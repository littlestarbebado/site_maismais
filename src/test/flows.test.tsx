import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ratingCategories } from '../config';
import { Reservation } from '../components/Reservation';
import { Feedback } from '../components/Feedback';

function mockDelivery(ok = true) {
  vi.stubEnv('VITE_FORM_PROVIDER', 'formspree');
  vi.stubEnv('VITE_FORMSPREE_ENDPOINT', 'https://formspree.io/f/example');
  const mock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ ok }), { status: ok ? 200 : 500 }));
  vi.stubGlobal('fetch', mock);
  return mock;
}

describe('reservas e secretaria', () => {
  it('mostra o bilhete só depois da entrega, sempre pendente', async () => {
    const mock = mockDelivery();
    render(<Reservation />);
    fireEvent.click(screen.getByRole('radio', { name: /Jantar às Cegas/ }));
    fireEvent.change(screen.getByLabelText('Data proposta'), { target: { value: '2099-01-05' } });
    fireEvent.submit(screen.getByRole('form', { name: 'Pedir reserva' }));
    expect(await screen.findByRole('heading', { name: 'Pedido recebido.' })).toBeInTheDocument();
    expect(screen.getByText('À espera de confirmação')).toBeInTheDocument();
    expect(mock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(mock.mock.calls[0][1].body)).toMatchObject({
      'form-name': 'reserva',
      experiencia: 'Jantar às Cegas',
      data: '2099-01-05',
    });
    expect(localStorage.length).toBe(0);
  });
  it('preserva o pedido quando o serviço falha', async () => {
    mockDelivery(false);
    render(<Reservation />);
    fireEvent.click(screen.getByRole('radio', { name: /Tens Uma Ideia Melhor/ }));
    fireEvent.change(screen.getByLabelText('A tua ideia'), {
      target: { value: 'Passear junto ao rio' },
    });
    fireEvent.change(screen.getByLabelText('Data proposta'), { target: { value: '2099-01-05' } });
    fireEvent.submit(screen.getByRole('form', { name: 'Pedir reserva' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível confirmar');
    expect(screen.getByLabelText('A tua ideia')).toHaveValue('Passear junto ao rio');
    expect(screen.queryByText('Pedido recebido.')).not.toBeInTheDocument();
  });
  it('não envia uma ideia vazia nem uma data passada', () => {
    const mock = mockDelivery();
    render(<Reservation />);
    fireEvent.click(screen.getByRole('radio', { name: /Tens Uma Ideia Melhor/ }));
    fireEvent.submit(screen.getByRole('form', { name: 'Pedir reserva' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Conta à direção');
    expect(mock).not.toHaveBeenCalled();
  });
  it('entrega uma mensagem e informa o resultado', async () => {
    const mock = mockDelivery();
    render(<Feedback />);
    fireEvent.change(screen.getByLabelText('A tua mensagem'), {
      target: { value: 'O jantar merece bis.' },
    });
    fireEvent.submit(screen.getByRole('form', { name: 'Livro de reclamações' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'A direção recebeu a tua reclamação.',
    );
    expect(JSON.parse(mock.mock.calls[0][1].body)).toMatchObject({
      'form-name': 'livro',
      mensagem: 'O jantar merece bis.',
    });
  });
  it('aceita avaliações honestas de 1 em todas as categorias', async () => {
    const mock = mockDelivery();
    render(<Feedback />);
    fireEvent.click(screen.getByRole('button', { name: /Inquérito de satisfação/ }));
    const form = screen.getByRole('form', { name: 'Inquérito de satisfação' });
    for (const [, label] of ratingCategories)
      fireEvent.click(within(form).getByRole('radio', { name: `${label}: 1 de 5` }));
    fireEvent.submit(form);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Agradecemos a tua colaboração'),
    );
    const body = JSON.parse(mock.mock.calls[0][1].body);
    for (const [key] of ratingCategories) expect(body[key]).toBe('1');
    expect(localStorage.length).toBe(0);
  });
});
