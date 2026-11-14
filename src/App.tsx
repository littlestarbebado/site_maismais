import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { MemberCard } from './components/Admission';
import { Reservation } from './components/Reservation';
import { Feedback } from './components/Feedback';
import { DownloadButton } from './components/UI';
import { club, pointsPerQuestion, questions } from './config';
import { MemeReactionProvider, useMemeReaction } from './components/MemeReaction';
import { downloadDocument } from './lib/download';

type Stage = 'entry' | 'quiz' | 'results' | 'invite' | 'accepted' | 'declined';
export const confirmationMessage =
  'Daniel, aceito o convite para o jantar n.º 002. Agora temos de combinar a data e o local!';

export default function App() {
  return (
    <MemeReactionProvider>
      <Incident />
    </MemeReactionProvider>
  );
}

function Incident() {
  const [stage, setStage] = useState<Stage>('entry');
  const [question, setQuestion] = useState(0);
  const [selection, setSelection] = useState<number | null>(null);
  const [sound, setSound] = useState(false);
  const [soundError, setSoundError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const { show, dismiss } = useMemeReaction();
  const q = questions[question];
  const score = pointsPerQuestion
    .slice(0, question + (selection === null ? 0 : 1))
    .reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (stage !== 'entry') heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [stage, question]);
  useEffect(
    () => () => {
      void audio.current?.close();
    },
    [],
  );

  async function beep() {
    if (!sound) return;
    try {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      const oscillator = audio.current.createOscillator();
      const gain = audio.current.createGain();
      oscillator.connect(gain);
      gain.connect(audio.current.destination);
      oscillator.frequency.setValueAtTime(480, audio.current.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(180, audio.current.currentTime + 0.12);
      gain.gain.setValueAtTime(0.045, audio.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.current.currentTime + 0.15);
      oscillator.start();
      oscillator.stop(audio.current.currentTime + 0.16);
    } catch {
      setSound(false);
      setSoundError('Som indisponível neste navegador. A palhaçada continua.');
    }
  }
  function go(next: Stage) {
    dismiss();
    setStage(next);
  }
  function next() {
    if (selection === null) return;
    dismiss();
    if (question === 3) go(selection === 3 ? 'declined' : 'results');
    else {
      setQuestion(question + 1);
      setSelection(null);
    }
  }

  return (
    <div className={`incident stage-${stage}`}>
      <a className="skip-link" href="#conteudo">
        Saltar para o conteúdo
      </a>
      <header className="incident-header">
        <span className="incident-logo" aria-label="D e B">
          D<span>&</span>B<span>.</span>
        </span>
        <span className="edition">
          UMA PRODUÇÃO DO DANIEL <br />
          <b>EXCLUSIVAMENTE PARA O BEN.</b>
        </span>
        <button
          className="sound-toggle"
          aria-pressed={sound}
          onClick={() => {
            setSound(!sound);
            setSoundError('');
          }}
        >
          <span aria-hidden="true">{sound ? '▥' : '⌁'}</span> SOM {sound ? 'LIGADO' : 'DESLIGADO'}
        </button>
      </header>
      {soundError && <p role="status">{soundError}</p>}
      <main id="conteudo" tabIndex={-1}>
        {stage === 'entry' && (
          <section className="entry-screen">
            <div className="entry-top mono">
              <span>
                <i className="live-dot" /> CAPÍTULO I — O INTERROGATÓRIO
              </span>
              <span>EDIÇÃO 001 / TIRAGEM: TU</span>
            </div>
            <div className="entry-grid">
              <div className="entry-copy">
                <h1 className="entry-title">
                  <span>BEN.</span>
                  <span>
                    QUE <em>CHATICE.</em>
                  </span>
                </h1>
                <p className="entry-description">
                  Fiz um site para te fazer uma pergunta. Infelizmente, primeiro tens de responder a
                  quatro completamente inúteis.
                </p>
                <button className="punk-button primary" onClick={() => go('quiz')}>
                  COMEÇAR ESTA PALHAÇADA <span aria-hidden="true">↗</span>
                </button>
                <p className="entry-duration mono">01–02 MINUTOS DA TUA VIDA. ZERO DEVOLUÇÕES.</p>
              </div>
              <div className="poster" aria-label="Quatro perguntas, zero necessidade">
                <div className="poster-meta mono">
                  <span>
                    D&B. / DEPARTAMENTO <br />
                    DE IDEIAS QUESTIONÁVEIS
                  </span>
                  <span>
                    N.º <br />
                    0001
                  </span>
                </div>
                <div className="poster-star" aria-hidden="true">
                  ✳
                </div>
                <p className="poster-type">
                  MUITO <br />
                  <span>APARATO.</span> <br />
                  PARA QUÊ?
                </p>
                <span className="poster-sticker">
                  100% <br />
                  <small>DESNECESSÁRIO</small>
                </span>
                <div className="poster-bottom">
                  <span className="barcode" aria-hidden="true" />
                  <span className="mono">
                    4 PERGUNTAS. <br />0 NECESSIDADE.
                  </span>
                </div>
                <span className="poster-scribble">
                  podia ter sido <br />
                  uma mensagem.
                </span>
              </div>
            </div>
            <div className="entry-bottom">
              <p>
                Este site foi desenvolvido por alguém com problemas em demonstrar afeto normalmente.
              </p>
              <span className="mono">
                DESIGN: DANIEL. <br />
                CULPA: BEN.
              </span>
            </div>
          </section>
        )}

        {stage === 'quiz' && (
          <section className={`quiz-screen transition-${question}`} key={question}>
            <div className="screen-meta mono">
              <span>O INTERROGATÓRIO / SEM VALOR LEGAL</span>
              <span aria-live="polite">{score.toLocaleString('pt-PT')} PONTOS INVENTADOS</span>
            </div>
            <div className="quiz-progress" aria-label={`Pergunta ${question + 1} de 4`}>
              <span className="question-index">
                0{question + 1}
                <small>/04</small>
              </span>
              <div className="progress-segments" aria-hidden="true">
                {questions.map((_, i) => (
                  <span key={i} className={i <= question ? 'filled' : ''} />
                ))}
              </div>
            </div>
            <h1 ref={heading} tabIndex={-1} className="quiz-title">
              {q.title}
            </h1>
            <fieldset className="quiz-answers">
              <legend className="sr-only">{q.title}</legend>
              {q.options.map((option, i) => (
                <label key={option} className={`quiz-answer ${selection === i ? 'chosen' : ''}`}>
                  <input
                    type="radio"
                    name={`question-${question}`}
                    checked={selection === i}
                    onChange={() => {
                      setSelection(i);
                      void beep();
                      const meme = q.memes[i];
                      if (meme) show(meme);
                      else dismiss();
                    }}
                  />
                  <span className="option-letter" aria-hidden="true">
                    {'ABCD'[i]}
                  </span>
                  <span>{option}</span>
                  <span className="option-mark" aria-hidden="true">
                    {selection === i ? '↗' : '+'}
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="quiz-bottom">
              <p className="quiz-reaction" role="status">
                {selection === null
                  ? 'Escolhe. O rigor científico é nenhum.'
                  : q.reactions[selection]}
              </p>
              <button className="punk-button primary" disabled={selection === null} onClick={next}>
                {question === 3 ? (selection === 3 ? 'TERMINAR' : 'VER O VEREDITO') : 'SEGUINTE'}{' '}
                <span aria-hidden="true">→</span>
              </button>
            </div>
            <p className="mono quiz-note">
              SEM RESPOSTAS CERTAS. SEM PRESSA. SEM QUALQUER UTILIDADE.
            </p>
          </section>
        )}

        {stage === 'results' && (
          <section className="results-screen">
            <p className="mono">AUDITORIA INDEPENDENTE FEITA PELO DANIEL</p>
            <h1 ref={heading} tabIndex={-1} className="display-title">
              RESULTADOS <br />
              <em>OFICIAIS*</em>
            </h1>
            <div className="scoreboard">
              <div>
                <span>BEN</span>
                <strong>
                  2.340<small>PONTOS</small>
                </strong>
              </div>
              <div className="winner">
                <span>
                  DANIEL <i aria-hidden="true">✳</i>
                </span>
                <strong>
                  80.000<small>PONTOS</small>
                </strong>
              </div>
            </div>
            <p className="results-question">Como é que o Daniel ganhou sem jogar?</p>
            <p>Não sabemos. O sistema foi desenvolvido por ele.</p>
            <button className="punk-button light" onClick={() => go('invite')}>
              PRONTO, O QUE É QUE QUERES? <span aria-hidden="true">↗</span>
            </button>
            <p className="mono results-note">* PONTOS FICTÍCIOS. NÃO SERVEM PARA NADA. MESMO.</p>
          </section>
        )}

        {stage === 'invite' && (
          <section className="invite-screen">
            <div className="star-burst" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} style={{ '--i': i } as CSSProperties}>
                  ✦
                </span>
              ))}
            </div>
            <p className="mono">FIM DO INTERROGATÓRIO. ERA ISTO.</p>
            <p className="invite-prelude">Pronto, Ben.</p>
            <h1 ref={heading} tabIndex={-1} className="display-title">
              QUERES VIR <br />
              <em>JANTAR COMIGO</em> <br />
              OUTRA VEZ?
            </h1>
            <p className="invite-description">
              Prometo tentar manter a estrela. <br />A minha reputação está em jogo.
            </p>
            <div className="invite-details mono">
              <span>DATA A DEFINIR</span>
              <span>LOCAL A COMBINAR</span>
              <span>JANTAR N.º 002</span>
            </div>
            <div className="invite-actions">
              <button className="punk-button primary" onClick={() => go('accepted')}>
                SIM, VÁ. MARCA LÁ ISSO. <span aria-hidden="true">↗</span>
              </button>
              <button className="punk-button secondary" onClick={() => go('declined')}>
                AGORA NÃO, OBRIGADO.
              </button>
            </div>
          </section>
        )}

        {stage === 'accepted' && (
          <section className="accepted-screen">
            <p className="mono">JANTAR N.º 002 / CONVITE ACEITE</p>
            <h1 ref={heading} tabIndex={-1} className="display-title">
              PRONTO. <br />
              <em>AGORA TEMOS DE</em> <br />
              COMBINAR ISSO.
            </h1>
            <div className="confirmation-grid">
              <article className="dinner-ticket" aria-label="Bilhete de jantar">
                <div className="ticket-head">
                  <span>D&B.</span>
                  <span className="mono">
                    GUARDA ISTO. <br />
                    OU FAZ UM PRINT.
                  </span>
                </div>
                <h2>
                  JANTAR <em>n.º 002</em>
                </h2>
                <dl>
                  {[
                    ['Convidado', 'Ben'],
                    ['Anfitrião', 'Daniel'],
                    ['Experiência', 'Jantar n.º 002'],
                    ['Data', 'A definir'],
                    ['Estado', 'Convite aceite'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="ticket-foot">
                  <span className="barcode" aria-hidden="true" />
                  <span className="mono">
                    VÁLIDO PARA UMA <br />
                    PESSOA ESPECÍFICA.
                  </span>
                </div>
              </article>
              <div className="ticket-actions">
                <p>
                  O bilhete é teu. <br />
                  <em>Agora falta avisar o chef.</em>
                </p>
                <DownloadButton
                  onDownload={() =>
                    downloadDocument(
                      'JANTAR N.º 002',
                      [
                        { label: 'Convidado', value: 'Ben' },
                        { label: 'Anfitrião', value: 'Daniel' },
                        { label: 'Experiência', value: 'Jantar n.º 002' },
                        { label: 'Data', value: 'A definir' },
                        { label: 'Estado', value: 'Convite aceite' },
                      ],
                      'DB-jantar-002-Ben.png',
                      'Local a combinar. Convite aceite neste dispositivo; confirmação não enviada ao Daniel.',
                    )
                  }
                >
                  Guardar bilhete · PNG
                </DownloadButton>
                <button
                  className="punk-button primary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(confirmationMessage);
                      setCopyStatus('Mensagem copiada. Agora envia-a ao Daniel.');
                    } catch {
                      setCopyStatus(
                        'Não foi possível copiar. Seleciona a mensagem abaixo e envia-a ao Daniel.',
                      );
                    }
                  }}
                >
                  COPIAR MENSAGEM PARA O DANIEL <span aria-hidden="true">↗</span>
                </button>
                <p className="delivery-note">
                  Nada foi enviado automaticamente. Copia esta mensagem e envia-a ao Daniel:
                </p>
                <p className="copy-message">{confirmationMessage}</p>
                <p role="status">{copyStatus}</p>
              </div>
            </div>
            <details className="club-extras">
              <summary>
                EXTRAS ABSOLUTAMENTE DESNECESSÁRIOS <span aria-hidden="true">+</span>
              </summary>
              <div className="extras-content">
                <h2>Já que fiz o site.</h2>
                <MemberCard />
                <Reservation />
                <Feedback />
              </div>
            </details>
          </section>
        )}

        {stage === 'declined' && (
          <section className="declined-screen">
            <p className="mono">FIM. SEM DRAMA.</p>
            <h1 ref={heading} tabIndex={-1} className="display-title">
              TUDO <br />
              <em>BEM, BEN.</em>
            </h1>
            <p>
              O convite fica sem efeito. <br />
              Obrigado por teres passado por aqui.
            </p>
            <p className="mono">Podes fechar esta página.</p>
          </section>
        )}
      </main>
      <footer className="incident-footer">
        <div className="star-record">
          <span
            className="footer-stars"
            role="img"
            aria-label={`${club.stars} de 3 estrelas, classificação fictícia`}
          >
            {Array.from({ length: 3 }, (_, i) => (i < club.stars ? '★' : '☆')).join(' ')}
          </span>
          <strong>
            {club.stars} {club.stars === 1 ? 'ESTRELA' : 'ESTRELAS'}. 0 HUMILDADE.
          </strong>
          <span>Primeiro jantar aprovado. O chef continua convencido de que merece mais.</span>
        </div>
        <details className="history">
          <summary>O CADASTRO DO CHEF ↗</summary>
          <ol>
            {club.history.map((item) => (
              <li key={item.number}>
                <strong>
                  {item.number} / {item.title}
                </strong>
                <p>
                  {item.detail} — {item.status}
                </p>
              </li>
            ))}
          </ol>
          <p>Brincadeira privada. Sem ligação ao Guia Michelin.</p>
        </details>
        <div className="footer-credit mono">
          <span>© D&B. 2026</span>
          <span>LOOKS EXPENSIVE. SOUNDS UNHINGED.</span>
          <span>FEITO COM DEMASIADO TEMPO.</span>
        </div>
      </footer>
    </div>
  );
}
