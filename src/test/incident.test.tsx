import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';
import { memes, questions } from '../config';
import { telemetry } from '../lib/telemetry';

function start() {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /COMEÇAR ESTA PALHAÇADA/ }));
}
function answer(index = 0) {
  fireEvent.click(screen.getAllByRole('radio')[index]);
  fireEvent.click(screen.getByRole('button', { name: /SEGUINTE|VER O VEREDITO|TERMINAR/ }));
}
function invite() {
  start();
  for (let i = 0; i < 4; i++) answer();
  fireEvent.click(screen.getByRole('button', { name: /PRONTO, O QUE É QUE QUERES/ }));
}
function accept() {
  invite();
  fireEvent.click(screen.getByRole('button', { name: 'SIMMMMM 💋' }));
}

describe('O Interrogatório', () => {
  it('tem quatro perguntas, foco a cada etapa e resultado sem criar dados persistentes', () => {
    const track = vi.spyOn(telemetry, 'track');
    start();
    expect(track).toHaveBeenCalledWith({ type: 'site_open', data: {} }, 'site-open');
    expect(questions).toHaveLength(4);
    for (let i = 0; i < 4; i++) {
      expect(screen.getByRole('heading', { name: questions[i].title })).toHaveFocus();
      expect(screen.getByRole('button', { name: /SEGUINTE|VER O VEREDITO/ })).toBeDisabled();
      answer();
    }
    expect(screen.getByRole('heading', { name: /RESULTADOS/ })).toHaveFocus();
    expect(screen.getByText('2.340')).toBeInTheDocument();
    expect(screen.getByText('80.000')).toBeInTheDocument();
    expect(localStorage.length).toBe(0);
  });

  it.each(questions.flatMap((q, question) => q.options.map((_, option) => ({ question, option }))))(
    'feedback da pergunta $question, resposta $option',
    ({ question, option }) => {
      start();
      for (let i = 0; i < question; i++) answer();
      fireEvent.click(screen.getAllByRole('radio')[option]);
      expect(screen.getByRole('status')).toHaveTextContent(questions[question].reactions[option]);
      for (const radio of screen.getAllByRole('radio')) expect(radio).toBeEnabled();
      fireEvent.click(screen.getByRole('button', { name: /SEGUINTE|VER O VEREDITO|TERMINAR/ }));
      if (question === 3 && option === 3) {
        expect(screen.getByRole('heading', { name: /TUDO BEM, BEN/ })).toHaveFocus();
        expect(screen.queryByRole('button', { name: /MARCA LÁ/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: /RESULTADOS/ })).not.toBeInTheDocument();
      } else expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
    },
  );

  it('mudar a resposta não acumula pontos e os memes podem ser fechados', () => {
    start();
    fireEvent.click(screen.getAllByRole('radio')[0]);
    expect(screen.getByRole('img', { name: memes.coracao.alt })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar reação' }));
    expect(screen.queryByRole('img', { name: memes.coracao.alt })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('radio')[2]);
    expect(screen.getByRole('img', { name: memes.sanidade.alt })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('img', { name: memes.sanidade.alt })).not.toBeInTheDocument();
    expect(screen.getByText('420 PONTOS INVENTADOS')).toBeInTheDocument();
    answer();
    fireEvent.click(screen.getAllByRole('radio')[0]);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    answer();
    fireEvent.click(screen.getAllByRole('radio')[3]);
    expect(screen.getByRole('img', { name: memes.fallesi.alt })).toBeInTheDocument();
  });

  it('mostra o convite real e permite pausar e saltar o caos', () => {
    const track = vi.spyOn(telemetry, 'track');
    invite();
    expect(
      screen.getByText('POV: JÁ VISTE ISTO ANTES MAS EU DISSE QUE NÃO ESTAVA PRONTO'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'BENNNNNNN, QUERES IR A UM DATE COMIGO????' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('25/11 · PALÁCIO DO GELO · JANTAR + CINEMA ÀS 21:00'),
    ).toBeInTheDocument();
    expect(screen.getByText('JANTAMOS ONDE NOS APETECER PQ SOMOS LIVRES')).toBeInTheDocument();
    expect(
      screen.getByText(/QUARTA-FEIRA, 25\/11\/2026 · PALÁCIO DO GELO, VISEU/),
    ).toBeInTheDocument();
    expect(screen.getByText(/RESTAURANTE À ESCOLHA LÁ DENTRO/)).toBeInTheDocument();
    expect(screen.queryByText(/namorar comigo/i)).not.toBeInTheDocument();
    const pause = screen.getByRole('button', { name: 'PAUSAR O CAOS' });
    fireEvent.click(pause);
    expect(screen.getByRole('button', { name: 'RETOMAR O CAOS' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'SALTAR ANIMAÇÕES' }));
    expect(document.querySelector('.chaos-skipped')).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith({ type: 'animation_paused', data: {} });
    expect(track).toHaveBeenCalledWith({ type: 'animation_skipped', data: {} });
    expect(screen.getByRole('button', { name: 'SIMMMMM 💋' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'NÃO POSSO 😭' })).toBeEnabled();
  });

  it('recusa no convite sem insistência e permite sugerir outro dia', async () => {
    const user = userEvent.setup();
    const track = vi.spyOn(telemetry, 'track');
    const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    invite();
    fireEvent.click(screen.getByRole('button', { name: 'NÃO POSSO 😭' }));
    expect(screen.getByRole('heading', { name: /TUDO BEM, BEN/ })).toHaveFocus();
    expect(screen.getByText(/Não há pressão nenhuma/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'SIMMMMM 💋' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Se quiseres, podes sugerir outro dia:'), {
      target: { value: '2026-12-02' },
    });
    await user.click(screen.getByRole('button', { name: 'COPIAR SUGESTÃO' }));
    expect(copy).toHaveBeenCalledWith('Outro dia que me dá jeito: 2026-12-02.');
    expect(track).toHaveBeenCalledWith(
      {
        type: 'invite_response',
        data: { response: 'no' },
      },
      expect.any(String),
    );
    expect(track).toHaveBeenCalledWith({
      type: 'reschedule_action',
      data: { action: 'date_selected' },
    });
    expect(track).toHaveBeenCalledWith({
      type: 'reschedule_action',
      data: { action: 'copy_clicked' },
    });
    expect(screen.getByRole('status')).toHaveTextContent('Sugestão copiada.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('aceita como segundo date sem confirmar reserva, bilhete ou envio', () => {
    accept();
    expect(screen.getByRole('heading', { name: 'FODA-SE CONSEGUI UM SEGUNDO DATE' })).toHaveFocus();
    expect(screen.getByText('Agora manda mensagem ao Daniel, seu parvo.')).toBeInTheDocument();
    expect(screen.queryByText(/bilhete|reserva|namorar/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PAUSAR O CAOS' })).toBeEnabled();
  });

  it('regista início, resposta, revelação e aceitação com dados mínimos', () => {
    const track = vi.spyOn(telemetry, 'track');
    start();
    for (let question = 0; question < questions.length; question++) answer(question === 0 ? 2 : 0);

    expect(track).toHaveBeenCalledWith(
      { type: 'question_started', data: { question_index: 0 } },
      expect.any(String),
    );
    expect(track).toHaveBeenCalledWith(
      {
        type: 'question_completed',
        data: { question_index: 0, option_index: 2 },
      },
      expect.any(String),
    );
    fireEvent.click(screen.getByRole('button', { name: /PRONTO, O QUE É QUE QUERES/ }));
    fireEvent.click(screen.getByRole('button', { name: 'SIMMMMM 💋' }));
    expect(track).toHaveBeenCalledWith(
      { type: 'css_reveal_entered', data: {} },
      expect.any(String),
    );
    expect(track).toHaveBeenCalledWith(
      { type: 'invite_response', data: { response: 'yes' } },
      expect.any(String),
    );
  });

  it('falha ao copiar uma data alternativa não apresenta falso sucesso', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Permission denied'));
    invite();
    await user.click(screen.getByRole('button', { name: 'NÃO POSSO 😭' }));
    fireEvent.change(screen.getByLabelText('Se quiseres, podes sugerir outro dia:'), {
      target: { value: '2026-12-02' },
    });
    await user.click(screen.getByRole('button', { name: 'COPIAR SUGESTÃO' }));
    expect(screen.getByRole('status')).toHaveTextContent('Não foi possível copiar');
    expect(screen.getByText('Outro dia que me dá jeito: 2026-12-02.')).toBeInTheDocument();
  });

  it('som começa desligado; indisponibilidade não interrompe o quiz', async () => {
    const user = userEvent.setup();
    start();
    expect(screen.getByRole('button', { name: /SOM DESLIGADO/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await user.click(screen.getByRole('button', { name: /SOM DESLIGADO/ }));
    await user.click(screen.getAllByRole('radio')[1]);
    expect(screen.getByRole('button', { name: /SOM DESLIGADO/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByText(/Som indisponível/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /SEGUINTE/ })).toBeEnabled();
  });
});
