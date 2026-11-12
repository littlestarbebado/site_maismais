import { useRef, useState, type FormEvent } from 'react';
import { club, ratingCategories } from '../config';
import { submitForm } from '../lib/forms';
import { Arrow, ErrorMessage, Eyebrow, Honeypot, PrivacyNote } from './UI';
import { useMemeReaction } from './MemeReaction';

export function Feedback() {
  const [active, setActive] = useState<'livro' | 'inquerito'>('livro');
  return (
    <section className="section feedback" id="secretaria">
      <div className="section-heading">
        <div>
          <Eyebrow>04 / O ego tem de aprender</Eyebrow>
          <h2>
            Estás a reclamar
            <br />
            <em>de quê, exatamente?</em>
          </h2>
        </div>
        <p>
          Podes dizer mal. A sério.
          <br />O drama é só para o site.
        </p>
      </div>
      <div className="feedback-layout">
        <nav className="feedback-nav" aria-label="Formulários da secretaria">
          <button aria-pressed={active === 'livro'} onClick={() => setActive('livro')}>
            Livro de reclamações <Arrow />
          </button>
          <button aria-pressed={active === 'inquerito'} onClick={() => setActive('inquerito')}>
            Inquérito de satisfação <Arrow />
          </button>
          <div className="employee">
            <span className="employee-star" aria-hidden="true">
              ✧
            </span>
            <Eyebrow>Funcionário do mês</Eyebrow>
            <p>Daniel</p>
            <span className="aside">12 meses. Zero outros candidatos.</span>
          </div>
        </nav>
        <FeedbackForm key={active} kind={active} />
      </div>
    </section>
  );
}

function FeedbackForm({ kind }: { kind: 'livro' | 'inquerito' }) {
  const { show: showMeme } = useMemeReaction();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const isBook = kind === 'livro';
  const success = isBook
    ? 'A direção recebeu a tua reclamação. A direção está ofendida.'
    : 'Agradecemos a tua colaboração. Vou ler isto com maturidade. Ou com uma colher de gelado na mão.';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const formData = new FormData(event.currentTarget);
    const data: Record<string, string> = { nome: club.member };
    for (const [key, value] of formData.entries()) data[key] = String(value).trim();
    if (isBook && !data.mensagem) {
      setError('Reclamar em silêncio é muito elegante, mas escreve qualquer coisa.');
      return;
    }
    if (!isBook && ratingCategories.some(([key]) => !/^[1-5]$/.test(data[key] || ''))) {
      setError('Escolhe uma avaliação de 1 a 5 em cada categoria.');
      return;
    }
    setBusy(true);
    pending.current = true;
    setError('');
    try {
      await submitForm(kind, data);
      setSent(true);
      if (isBook) showMeme('fallesi');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      pending.current = false;
    }
  }
  return (
    <div className="feedback-form">
      <h3>{isBook ? 'Livro de reclamações' : 'Inquérito de satisfação'}</h3>
      <p>
        {isBook
          ? 'A comida? O filme? A quantidade de vezes que disse «fui eu que fiz»? Podes deixar uma reclamação, uma sugestão ou, vá, um elogio.'
          : 'Sem respostas certas e sem pontos por seres simpático. Se foi uma seca, diz. Eu sobrevivo.'}
      </p>
      {sent ? (
        <div className="feedback-success" role="status">
          <span aria-hidden="true">✓</span>
          <p>{success}</p>
          <button className="text-button" onClick={() => setSent(false)}>
            Enviar outra resposta <Arrow />
          </button>
        </div>
      ) : (
        <form
          onSubmit={submit}
          aria-label={isBook ? 'Livro de reclamações' : 'Inquérito de satisfação'}
        >
          <fieldset disabled={busy} className="feedback-fields">
            <legend className="sr-only">{isBook ? 'A tua mensagem' : 'A tua avaliação'}</legend>
            {isBook ? (
              <>
                <label>
                  Natureza do assunto
                  <select name="tipo" defaultValue="Sugestão">
                    <option>Reclamação</option>
                    <option>Sugestão</option>
                    <option>Elogio</option>
                  </select>
                </label>
                <label>
                  A tua mensagem
                  <textarea
                    name="mensagem"
                    required
                    maxLength={3000}
                    rows={5}
                    placeholder="Desabafa. O Daniel lê e tenta não levar a peito."
                  />
                </label>
              </>
            ) : (
              <>
                <p className="rating-guide">
                  1 — Deixa a desejar <span>5 — Impecável</span>
                </p>
                {ratingCategories.map(([key, label]) => (
                  <fieldset className="rating-row" key={key}>
                    <legend>{label}</legend>
                    <div className="rating-options">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <label key={value}>
                          <input
                            type="radio"
                            name={key}
                            value={value}
                            required
                            aria-label={`${label}: ${value} de 5`}
                          />
                          <span>{value}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <label>
                  Queres acrescentar alguma coisa antes de a direção encerrar o processo?{' '}
                  <span className="optional">Opcional</span>
                  <textarea name="mensagem" rows={3} maxLength={3000} />
                </label>
              </>
            )}
            <Honeypot />
            <ErrorMessage message={error} />
            <button className="button button-navy" type="submit" disabled={busy}>
              {busy ? 'A entregar à direção…' : isBook ? 'Entregar à direção' : 'Enviar avaliação'}{' '}
              <Arrow />
            </button>
            <PrivacyNote />
          </fieldset>
        </form>
      )}
    </div>
  );
}
