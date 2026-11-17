import { useEffect, useRef, useState } from 'react';
import { club, memes, pointsPerQuestion, questions } from './config';
import { MemeReactionProvider, useMemeReaction } from './components/MemeReaction';

type Stage = 'entry' | 'quiz' | 'results' | 'invite' | 'accepted' | 'declined';

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
  const [alternateDay, setAlternateDay] = useState('');
  const [chaosPaused, setChaosPaused] = useState(false);
  const [chaosSkipped, setChaosSkipped] = useState(false);
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
    setChaosPaused(false);
    setChaosSkipped(false);
    setStage(next);
  }
  async function copyAlternateDay() {
    const message = `Outro dia que me dá jeito: ${alternateDay}.`;
    try {
      await navigator.clipboard.writeText(message);
      setCopyStatus('Sugestão copiada. Envia-a ao Daniel quando quiseres.');
    } catch {
      setCopyStatus('Não foi possível copiar. Podes selecionar e copiar a sugestão abaixo.');
    }
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
    <div
      className={`incident stage-${stage} ${stage === 'invite' || stage === 'accepted' ? 'chaos-stage' : ''} ${chaosPaused ? 'chaos-paused' : ''} ${chaosSkipped ? 'chaos-skipped' : ''}`}
    >
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
            <p className="spoiler-leak">
              POV: JÁ VISTE ISTO ANTES MAS EU DISSE QUE NÃO ESTAVA PRONTO
            </p>
            <div className="chaos-controls" aria-label="Controlos das animações">
              <button
                type="button"
                aria-pressed={chaosPaused}
                onClick={() => setChaosPaused(!chaosPaused)}
              >
                {chaosPaused ? 'RETOMAR O CAOS' : 'PAUSAR O CAOS'}
              </button>
              <button type="button" onClick={() => setChaosSkipped(true)}>
                SALTAR ANIMAÇÕES
              </button>
            </div>
            <h1 ref={heading} tabIndex={-1} className="chaos-title">
              BENNNNNNN, QUERES IR A UM DATE COMIGO????
            </h1>
            <p className="chaos-date">25/11 · PALÁCIO DO GELO · JANTAR + CINEMA ÀS 21:00</p>
            <p className="chaos-restaurant">JANTAMOS ONDE NOS APETECER PQ SOMOS LIVRES</p>
            <p className="chaos-facts">
              QUARTA-FEIRA, 25/11/2026 · PALÁCIO DO GELO, VISEU
              <br />
              JANTAR ANTES DO CINEMA · RESTAURANTE À ESCOLHA LÁ DENTRO
            </p>
            <div className="chaos-pics" aria-hidden="true">
              <img src={memes.coracao.src} alt="" />
              <img src={memes.sanidade.src} alt="" />
              <img src={memes.fallesi.src} alt="" />
            </div>
            <p className="chaos-emoji" aria-hidden="true">
              💋 ⭐ 💥 🍿 🪩
            </p>
            <div className="invite-actions">
              <button className="chaos-button" onClick={() => go('accepted')}>
                <span className="chaos-button-label">SIMMMMM 💋</span>
              </button>
              <button className="chaos-button" onClick={() => go('declined')}>
                <span className="chaos-button-label">NÃO POSSO 😭</span>
              </button>
            </div>
          </section>
        )}

        {stage === 'accepted' && (
          <section className="accepted-screen">
            <div className="chaos-controls" aria-label="Controlos das animações">
              <button
                type="button"
                aria-pressed={chaosPaused}
                onClick={() => setChaosPaused(!chaosPaused)}
              >
                {chaosPaused ? 'RETOMAR O CAOS' : 'PAUSAR O CAOS'}
              </button>
              <button type="button" onClick={() => setChaosSkipped(true)}>
                SALTAR ANIMAÇÕES
              </button>
            </div>
            <h1 ref={heading} tabIndex={-1} className="accepted-title">
              FODA-SE CONSEGUI UM SEGUNDO DATE
            </h1>
            <p className="accepted-message">Agora manda mensagem ao Daniel, seu parvo.</p>
            <p className="chaos-emoji" aria-hidden="true">
              💥 💋 ⭐ 🎉 🍾
            </p>
          </section>
        )}

        {stage === 'declined' && (
          <section className="declined-screen">
            <p className="mono">FIM. SEM DRAMA.</p>
            <h1 ref={heading} tabIndex={-1} className="display-title">
              TUDO <br />
              <em>BEM, BEN.</em>
            </h1>
            <p>Tudo bem — obrigado por dizeres. Não há pressão nenhuma.</p>
            <label htmlFor="alternate-day">Se quiseres, podes sugerir outro dia:</label>
            <div className="alternate-day">
              <input
                id="alternate-day"
                type="date"
                value={alternateDay}
                onChange={(event) => {
                  setAlternateDay(event.target.value);
                  setCopyStatus('');
                }}
              />
              <button
                className="punk-button primary"
                disabled={!alternateDay}
                onClick={() => void copyAlternateDay()}
              >
                COPIAR SUGESTÃO
              </button>
            </div>
            {alternateDay && (
              <p className="copy-message">Outro dia que me dá jeito: {alternateDay}.</p>
            )}
            <p role="status">{copyStatus}</p>
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
