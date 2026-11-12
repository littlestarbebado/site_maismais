import { useEffect, useRef, useState } from 'react';
import { club, questions } from '../config';
import { downloadDocument } from '../lib/download';
import { Arrow, DownloadButton, Eyebrow } from './UI';
import { useMemeReaction } from './MemeReaction';

export type Progress = { stage: 'invitation' | 'quiz' | 'admitted'; question: number };
export const initialProgress: Progress = { stage: 'invitation', question: 0 };
const progressKey = 'db-club-progress-v1';
export function readProgress(): Progress {
  try {
    const value = JSON.parse(localStorage.getItem(progressKey) || 'null');
    if (
      value &&
      ['invitation', 'quiz', 'admitted'].includes(value.stage) &&
      Number.isInteger(value.question) &&
      value.question >= 0 &&
      value.question < questions.length
    )
      return { stage: value.stage, question: value.question };
  } catch {
    /* Storage is optional, including in private browsing. */
  }
  return initialProgress;
}
export function saveProgress(progress: Progress) {
  try {
    localStorage.setItem(progressKey, JSON.stringify(progress));
  } catch {
    /* Continue without persistence. */
  }
}

export function Admission({
  progress,
  onProgress,
}: {
  progress: Progress;
  onProgress: (progress: Progress) => void;
}) {
  const { show: showMeme, dismiss: dismissMeme } = useMemeReaction();
  const [selection, setSelection] = useState<number | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStage = useRef(progress.stage);
  useEffect(() => {
    if (previousStage.current !== progress.stage || progress.stage === 'quiz')
      heading.current?.focus({ preventScroll: true });
    previousStage.current = progress.stage;
  }, [progress.stage, progress.question]);

  if (progress.stage === 'admitted')
    return (
      <section className="section admission admitted" id="admissao">
        <div className="admission-copy">
          <Eyebrow>01 / Já estavas na lista, obviamente</Eyebrow>
          <h2 ref={heading} tabIndex={-1}>
            Admitido<span className="gold">.</span>
          </h2>
          <p>Passaste. A concorrência era feroz: tu, tu e tu.</p>
          <p className="vote">
            Votos a favor: 1. <span>Votos contra: 0.</span>
          </p>
          <p className="aside">O cartão estava feito antes de responderes. Não te armes.</p>
          <a className="text-button" href="#reservas">
            Pronto, vamos marcar isto <Arrow />
          </a>
        </div>
        <MemberCard />
      </section>
    );

  if (progress.stage === 'quiz') {
    const question = questions[progress.question];
    return (
      <section className="section admission" id="admissao">
        <div className="admission-copy">
          <Eyebrow>01 / Só para te chatear um bocadinho</Eyebrow>
          <h2>
            Responde lá,
            <br />
            <em>ó difícil.</em>
          </h2>
          <p>Tu respondes. Eu levo tudo demasiado a peito. É uma dinâmica saudável.</p>
          <p className="aside">
            Não há respostas certas. E podes dizer que não. Até eu tenho limites.
          </p>
        </div>
        <div className="questionnaire" key={progress.question}>
          <div className="question-count">
            <span>QUESTÃO 0{progress.question + 1}</span>
            <span>DE 05</span>
          </div>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${(progress.question + 1) * 20}%` }} />
          </div>
          <h3 ref={heading} tabIndex={-1}>
            {question.title}
          </h3>
          <fieldset className="answer-list">
            <legend className="sr-only">{question.title}</legend>
            {question.options.map((option, i) => (
              <label className={`answer ${selection === i ? 'selected' : ''}`} key={option}>
                <input
                  type="radio"
                  name="answer"
                  checked={selection === i}
                  onChange={() => {
                    setSelection(i);
                    const meme = question.memes[i];
                    if (meme) showMeme(meme);
                    else dismissMeme();
                  }}
                />
                <span className="answer-letter">{'ABCD'[i]}</span>
                <span>{option}</span>
                <span className="selection-mark" aria-hidden="true">
                  {selection === i ? '✓' : '+'}
                </span>
              </label>
            ))}
          </fieldset>
          <p className="reaction" role="status">
            {selection === null
              ? 'Pensa bem. Ou não. O site já está pago em horas de sono.'
              : question.reactions[selection]}
          </p>
          <div className="question-actions">
            {progress.question > 0 && (
              <button
                className="text-button"
                onClick={() => {
                  setSelection(null);
                  dismissMeme();
                  onProgress({ stage: 'quiz', question: progress.question - 1 });
                }}
              >
                ← Anterior
              </button>
            )}
            <button
              className="button button-navy"
              disabled={selection === null}
              onClick={() => {
                setSelection(null);
                dismissMeme();
                onProgress(
                  progress.question === questions.length - 1
                    ? { stage: 'admitted', question: progress.question }
                    : { stage: 'quiz', question: progress.question + 1 },
                );
              }}
            >
              {progress.question === questions.length - 1 ? 'Pronto, já chega' : 'Continua, vá'}{' '}
              <Arrow />
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section admission invitation-reveal" id="admissao">
      <div className="admission-copy">
        <Eyebrow>01 / O que este gajo quer</Eyebrow>
        <h2>
          Quero repetir.
          <br />
          <em>Pronto. Disse.</em>
        </h2>
        <p>
          Podia ter sido uma mensagem de três palavras.
          <br />
          Mas olha este tipo de letra.
        </p>
        <span className="small-seal" aria-hidden="true">
          D&B.
        </span>
      </div>
      <article className="official-letter">
        <div className="letter-meta">
          <span>PROVA DOCUMENTAL A</span>
          <span>GRAU DE NECESSIDADE: ZERO</span>
        </div>
        <h3>Anda cá outra vez.</h3>
        <p>
          Gostei do jantar. Da companhia também, mas não espalhes. Quero voltar a cozinhar para ti e
          depois fingir que vamos ver um filme.
        </p>
        <div className="signature">Daniel</div>
        <p className="signature-role">O gajo que podia ter mandado mensagem.</p>
        <button
          className="button button-navy"
          onClick={() => onProgress({ stage: 'quiz', question: 0 })}
        >
          Está bem, chateia-me <Arrow />
        </button>
        <p className="letter-note">P.S. — O convite é para jantar. O resto logo se vê.</p>
      </article>
    </section>
  );
}

function MemberCard() {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="member-card-area">
      <button
        className={`member-card ${flipped ? 'is-flipped' : ''}`}
        aria-label={flipped ? 'Ver frente do cartão de sócio' : 'Ver verso do cartão de sócio'}
        aria-pressed={flipped}
        onClick={() => setFlipped(!flipped)}
      >
        <span className="card-face card-front">
          <span className="card-top">
            <span className="wordmark">D&B.</span>
            <span>CLUBE PRIVADO</span>
          </span>
          <span className="card-rule" />
          <span className="card-category">CONVIDADO DE HONRA</span>
          <span className="card-name">{club.member.toUpperCase()}</span>
          <span className="card-bottom">
            <span>
              SÓCIO N.º {club.memberNumber}
              <small>Estado: Admitido</small>
            </span>
            <span>
              Direção: {club.director}
              <small>DESDE 2026</small>
            </span>
          </span>
        </span>
        <span className="card-face card-back">
          <span className="wordmark">D&B.</span>
          <span>{club.cardBack}</span>
          <small>EM CASO DE PERDA, FAZ OLHINHOS AO DIRETOR.</small>
        </span>
      </button>
      <div className="card-controls">
        <span className="aside">Toca no cartão para o virar.</span>
        <DownloadButton
          onDownload={() =>
            downloadDocument(
              'BEN',
              [
                { label: 'Sócio', value: `N.º ${club.memberNumber}` },
                { label: 'Categoria', value: 'Convidado de Honra' },
                { label: 'Estado', value: 'Admitido' },
                { label: 'Direção', value: club.director },
              ],
              'DB-cartao-Ben.png',
              club.cardBack,
            )
          }
        >
          Guardar cartão · PNG
        </DownloadButton>
      </div>
    </div>
  );
}
