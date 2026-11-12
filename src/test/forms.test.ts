import { describe, expect, it, vi } from 'vitest';
import { submitForm, todayInLisbon, validateReservation } from '../lib/forms';

const formspree = {
  provider: 'formspree',
  endpoint: 'https://formspree.io/f/example',
  hostname: 'example.com',
};
const netlify = { provider: 'netlify', endpoint: '', hostname: 'example.netlify.app' };
describe('entrega real de formulários', () => {
  it('não inventa uma entrega no servidor local', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      submitForm('livro', { mensagem: 'Olá' }, { ...netlify, hostname: 'localhost' }),
    ).rejects.toThrow('ainda não está disponível');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(['http://formspree.io/f/example', 'https://evil.test/f/example', ''])(
    'rejeita configuração insegura: %s',
    async (endpoint) => {
      await expect(submitForm('livro', {}, { ...formspree, endpoint })).rejects.toThrow(
        'ainda não está disponível',
      );
    },
  );
  it('envia o nome do formulário e os campos com codificação correta ao Netlify', async () => {
    const mock = vi
      .fn()
      .mockResolvedValue(new Response('', { status: 200, headers: { server: 'Netlify' } }));
    vi.stubGlobal('fetch', mock);
    await submitForm(
      'reserva',
      { nome: 'Ben', experiencia: 'Jantar às Cegas', observacao: 'A & B' },
      netlify,
    );
    const [url, options] = mock.mock.calls[0];
    expect(url).toBe('/');
    expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    const body = new URLSearchParams(options.body);
    expect(body.get('form-name')).toBe('reserva');
    expect(body.get('observacao')).toBe('A & B');
  });
  it.each([400, 429, 500])('trata HTTP %i como erro', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status })));
    await expect(submitForm('reserva', {}, formspree)).rejects.toThrow(
      'Não foi possível confirmar',
    );
  });
  it('rejeita um HTTP 200 devolvido por um alojamento sem Forms', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html></html>', { status: 200 })),
    );
    await expect(submitForm('reserva', {}, netlify)).rejects.toThrow('Não foi possível confirmar');
  });
  it('exige confirmação JSON do Formspree', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: false }), { status: 200 })),
    );
    await expect(submitForm('livro', {}, formspree)).rejects.toThrow('Não foi possível confirmar');
  });
  it('aceita uma confirmação positiva do Formspree', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );
    await expect(submitForm('inquerito', { comida: '1' }, formspree)).resolves.toBeUndefined();
  });
  it('trata falhas de rede', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(submitForm('livro', {}, formspree)).rejects.toThrow('Mantivemos o que escreveste');
  });
  it('rejeita o honeypot sem enviar', async () => {
    const mock = vi.fn();
    vi.stubGlobal('fetch', mock);
    await expect(submitForm('livro', { 'bot-field': 'bot' }, formspree)).rejects.toThrow();
    expect(mock).not.toHaveBeenCalled();
  });
});
describe('datas e reserva', () => {
  it('usa a data de Lisboa mesmo quando difere de UTC', () => {
    expect(todayInLisbon(new Date('2026-07-01T23:30:00Z'))).toBe('2026-07-02');
  });
  it('rejeita datas passadas e propostas vazias', () => {
    expect(validateReservation('jantar', '2020-01-01', '', ['jantar'])).toBeTruthy();
    expect(validateReservation('ideia', '2099-01-01', '   ', ['ideia'])).toBeTruthy();
    expect(validateReservation('', '2099-01-01', '', ['jantar'])).toBeTruthy();
    expect(validateReservation('jantar', '2099-01-01', '', ['jantar'])).toBeNull();
  });
});
