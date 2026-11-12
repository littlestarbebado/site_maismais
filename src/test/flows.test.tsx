import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';
import { questions, ratingCategories } from '../config';
import { Admission, readProgress } from '../components/Admission';
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

describe('convite e admissão', () => {
  it('percorre as cinco perguntas, admite e restaura apenas progresso não sensível', async () => {
    const user = userEvent.setup();
    const view = render(<App />);
    expect(screen.queryByRole('form', { name: 'Pedir reserva' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Ver convocatória/ }));
    expect(await screen.findByText(/Renovação de convite/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Aceitar ser avaliado/ }));
    for (let i = 0; i < 5; i++) {
      expect(screen.getByRole('heading', { name: questions[i].title })).toBeInTheDocument();
      await user.click(
        screen.getByRole('radio', {
          name: new RegExp(questions[i].options[2].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        }),
      );
      expect(
        screen
          .getAllByRole('status')
          .map((s) => s.textContent)
          .join(''),
      ).toContain(questions[i].reactions[2]);
      await user.click(
        screen.getByRole('button', { name: i === 4 ? /Consultar decisão/ : /Próxima pergunta/ }),
      );
    }
    expect(screen.getByRole('heading', { name: 'Admitido.' })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Pedir reserva' })).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem('db-club-progress-v1')!);
    expect(saved).toEqual({ stage: 'admitted', question: 4 });
    expect(localStorage.length).toBe(1);
    await user.click(screen.getByRole('button', { name: 'Ver verso do cartão de sócio' }));
    expect(screen.getByRole('button', { name: 'Ver frente do cartão de sócio' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    view.unmount();
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Admitido.' })).toBeInTheDocument();
  });
  it.each(questions.flatMap((q, question) => q.options.map((_, answer) => ({ question, answer }))))(
    'aceita a opção $answer na pergunta $question',
    async ({ question, answer }) => {
      const onProgress = vi.fn();
      render(<Admission progress={{ stage: 'quiz', question }} onProgress={onProgress} />);
      fireEvent.click(screen.getAllByRole('radio')[answer]);
      expect(screen.getByRole('status')).toHaveTextContent(questions[question].reactions[answer]);
      fireEvent.click(
        screen.getByRole('button', {
          name: question === 4 ? /Consultar decisão/ : /Próxima pergunta/,
        }),
      );
      expect(onProgress).toHaveBeenCalledWith({
        stage: question === 4 ? 'admitted' : 'quiz',
        question: question === 4 ? 4 : question + 1,
      });
    },
  );
  it('ignora progresso inválido', () => {
    localStorage.setItem('db-club-progress-v1', '{"stage":"quiz","question":99}');
    expect(readProgress()).toEqual({ stage: 'invitation', question: 0 });
  });
  it('revela os dois detalhes escondidos', async () => {
    const user = userEvent.setup();
    render(<App />);
    for (let i = 0; i < 5; i++)
      await user.click(screen.getByRole('button', { name: 'D&B. — Clube Privado' }));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Estás mesmo a explorar isto tudo? Gosto.',
    );
    await user.click(screen.getByRole('button', { name: /Falar com o responsável/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Olá. Sou o Daniel.');
  });
});

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
      'A tua mensagem foi entregue ao Daniel',
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
