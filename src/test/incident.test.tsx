import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App, { confirmationMessage } from '../App';
import { memes, questions } from '../config';
import { downloadDocument } from '../lib/download';

vi.mock('../lib/download', () => ({ downloadDocument: vi.fn().mockResolvedValue(undefined) }));

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
  fireEvent.click(screen.getByRole('button', { name: /SIM, VÁ. MARCA LÁ ISSO/ }));
}

describe('O Interrogatório', () => {
  it('tem quatro perguntas, foco a cada etapa e resultado sem criar dados persistentes', () => {
    start();
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

  it('recusa no convite termina sem insistência nem envio', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    invite();
    expect(screen.getByText('DATA A DEFINIR')).toBeInTheDocument();
    expect(screen.getByText('LOCAL A COMBINAR')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'AGORA NÃO, OBRIGADO.' }));
    expect(screen.getByRole('heading', { name: /TUDO BEM, BEN/ })).toHaveFocus();
    expect(screen.queryByRole('button', { name: /SIM|COPIAR|COMEÇAR/ })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('aceitação local, PNG, mensagem copiada e cartão preservado', async () => {
    const user = userEvent.setup();
    const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    accept();
    expect(screen.getByRole('article', { name: 'Bilhete de jantar' })).toHaveTextContent(
      'A definir',
    );
    expect(screen.getByText(/Nada foi enviado automaticamente/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Guardar bilhete/ }));
    expect(downloadDocument).toHaveBeenCalledWith(
      'JANTAR N.º 002',
      expect.arrayContaining([{ label: 'Estado', value: 'Convite aceite' }]),
      'DB-jantar-002-Ben.png',
      expect.stringContaining('confirmação não enviada'),
    );
    await user.click(screen.getByRole('button', { name: /COPIAR MENSAGEM/ }));
    expect(copy).toHaveBeenCalledWith(confirmationMessage);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Mensagem copiada. Agora envia-a ao Daniel.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByText(/EXTRAS ABSOLUTAMENTE/));
    await user.click(screen.getByRole('button', { name: 'Ver verso do cartão de sócio' }));
    expect(screen.getByRole('button', { name: 'Ver frente do cartão de sócio' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('falha de clipboard apresenta mensagem selecionável sem falso sucesso', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Permission denied'));
    accept();
    await user.click(screen.getByRole('button', { name: /COPIAR MENSAGEM/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Não foi possível copiar');
    expect(screen.getByText(confirmationMessage)).toBeInTheDocument();
  });

  it('falha do PNG mostra erro e permite repetir', async () => {
    vi.mocked(downloadDocument).mockRejectedValueOnce(new Error('Canvas unavailable'));
    const user = userEvent.setup();
    accept();
    await user.click(screen.getByRole('button', { name: /Guardar bilhete/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível guardar');
    expect(screen.getByRole('button', { name: /Guardar bilhete/ })).toBeEnabled();
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
