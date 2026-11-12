import { useEffect, useRef, useState } from 'react';
import { Admission, readProgress, saveProgress, type Progress } from './components/Admission';
import { Reservation } from './components/Reservation';
import { Feedback } from './components/Feedback';
import { Arrow, Eyebrow } from './components/UI';
import { club } from './config';
import { MemeReactionProvider, useMemeReaction } from './components/MemeReaction';

export default function App() {
  return (
    <MemeReactionProvider>
      <ClubPage />
    </MemeReactionProvider>
  );
}

function ClubPage() {
  const { show: showMeme, dismiss: dismissMeme } = useMemeReaction();
  const [progress, setProgress] = useState(readProgress);
  const [opened, setOpened] = useState(progress.stage !== 'invitation');
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const clicks = useRef(0);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(noticeTimer.current), []);
  function showNotice(text: string) {
    setNotice(text);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 6500);
  }
  function updateProgress(next: Progress) {
    dismissMeme();
    setProgress(next);
    saveProgress(next);
    if (next.stage === 'admitted') showMeme('fallesi');
  }
  function openInvitation() {
    setOpened(true);
    requestAnimationFrame(() => {
      const section = document.getElementById('admissao');
      section?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      });
      const heading = section?.querySelector<HTMLElement>('h2');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus({ preventScroll: true });
    });
  }
  const admitted = progress.stage === 'admitted';
  return (
    <>
      <a className="skip-link" href="#conteudo">
        Saltar para o conteúdo
      </a>
      <header className="site-header">
        <button
          className="logo"
          aria-label="D&B. — Clube Privado"
          onClick={() => {
            clicks.current++;
            if (clicks.current % 5 === 0) {
              showNotice('Cinco cliques. Ben, arranja um hobby. Eu claramente não tenho.');
              showMeme('sanidade');
            }
          }}
        >
          D<span>&</span>B.
        </button>
        <div className="header-caption">
          CLUBE PRIVADO<span>CRITÉRIO DE ENTRADA: SER O BEN.</span>
        </div>
        <button
          className="menu-toggle text-button"
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? 'Fechar −' : 'Menu +'}
        </button>
        <nav
          id="main-navigation"
          aria-label="Navegação principal"
          className={menuOpen ? 'is-open' : ''}
        >
          <a href="#clube" onClick={() => setMenuOpen(false)}>
            O caso
          </a>
          <a href="#gastronomia" onClick={() => setMenuOpen(false)}>
            À mesa
          </a>
          {admitted && (
            <a href="#secretaria" onClick={() => setMenuOpen(false)}>
              Secretaria
            </a>
          )}
          <button
            className="nav-invite"
            onClick={() => {
              setMenuOpen(false);
              if (admitted) document.getElementById('reservas')?.scrollIntoView();
              else openInvitation();
            }}
          >
            {admitted ? 'Pedir reserva' : 'O teu convite'} <Arrow diagonal />
          </button>
        </nav>
      </header>
      <main id="conteudo">
        <section className="hero" id="clube">
          <div className="hero-content">
            <Eyebrow>
              <span className="status-dot" /> Processo n.º 0001 · Tu, outra vez
            </Eyebrow>
            <h1>
              <span className="hero-ben">Ben,</span>
              <span className="hero-again">outra vez</span>
              <em>tu?</em>
              <span className="title-asterisk" aria-hidden="true">
                *
              </span>
            </h1>
            <p className="hero-description">
              Após o primeiro encontro, a direção reuniu-se para decidir se valia a pena repetir.
            </p>
            <p className="hero-aside">Infelizmente, sim.</p>
            <button className="button button-gold" onClick={openInvitation}>
              {opened
                ? admitted
                  ? 'Ver cartão de sócio'
                  : 'Voltar a esta palhaçada'
                : 'Ver o que este gajo quer'}{' '}
              <Arrow />
            </button>
          </div>
          <aside className="case-file" aria-label="O processo do Ben">
            <div className="case-binding" aria-hidden="true" />
            <div className="case-meta">
              <span>D&B. / ARQUIVO PESSOAL</span>
              <span>
                CONFIDENCIAL
                <br />
                MAS ESTÁ NUM SITE
              </span>
            </div>
            <Eyebrow>Assunto: repetir a dose</Eyebrow>
            <div className="case-number" aria-hidden="true">
              02<span>º</span>
            </div>
            <p className="case-title">
              encontro.
              <br />
              <em>Mesmo suspeito.</em>
            </p>
            <span className="rubber-stamp">
              APROVADO
              <br />
              <small>contra todo o bom senso</small>
            </span>
            <div className="case-verdict">
              <span>VOTOS A FAVOR: 1</span>
              <span>ERA SÓ EU.</span>
            </div>
            <p className="scribbled-note">
              Podia ter mandado
              <br />
              «queres vir cá?»
              <br />
              <span>Mas pronto.</span>
            </p>
          </aside>
          <div className="hero-bottom">
            <span>* SIM, FIZ MESMO UM SITE.</span>
            <span>NÃO, NÃO TINHA MAIS NADA PARA FAZER.</span>
            <a href="#gastronomia" aria-label="Descobrir o clube">
              ↓
            </a>
          </div>
        </section>
        <section className="evidence-strip" aria-label="Estatísticas absolutamente não científicas">
          <p>
            <strong>01</strong>
            <span>
              convidado
              <br />e já dá trabalho
            </span>
          </p>
          <p>
            <strong>00</strong>
            <span>
              concorrentes
              <br />à vaga do Daniel
            </span>
          </p>
          <p>
            <strong>
              97<span>%</span>
            </strong>
            <span>
              pose
              <br />
              3% saber o que faço
            </span>
          </p>
          <span className="statistics-note">Fonte: inventei.</span>
        </section>
        {opened && <Admission progress={progress} onProgress={updateProgress} />}
        <section className="section suspects" aria-labelledby="suspects-title">
          <div className="suspects-intro">
            <Eyebrow>Os envolvidos / sem direito a anonimato</Eyebrow>
            <h2 id="suspects-title">
              Duas pessoas.
              <br />
              <em>Este aparato todo.</em>
            </h2>
            <p>
              Um queria combinar um jantar.
              <br />O outro ainda está a ler isto.
            </p>
          </div>
          <article className="profile profile-ben">
            <span className="profile-index">01 / O PROBLEMA</span>
            <h3>
              Ben<span>®</span>
            </h3>
            <p>
              Principal causa de
              <br />
              distração do Daniel.
            </p>
            <div className="profile-footnote">
              Competências: aparecer.
              <br />E aparentemente chega.
            </div>
          </article>
          <article className="profile profile-daniel">
            <span className="profile-index">02 / O PROBLEMA MAIOR</span>
            <h3>Daniel</h3>
            <p>
              Chef, diretor e<br />
              funcionário do mês.
            </p>
            <div className="profile-footnote">
              Eleito por: Daniel.
              <br />
              Auditoria independente: Daniel.
            </div>
            <button className="profile-note" onClick={() => showMeme('sanidade')}>
              estou ótimo, juro ↗
            </button>
          </article>
        </section>
        <section className="gastronomy-section" id="gastronomia">
          <div className="section gastronomy">
            <div className="gastronomy-copy">
              <Eyebrow>02 / Um elogio e ficou assim</Eyebrow>
              <h2>
                <span className="gastronomy-numeral">{club.stars}</span>{' '}
                {club.stars === 1 ? 'estrela.' : 'estrelas.'}
                <br />
                <em>0 humildade.</em>
              </h2>
              <p>O chef continua convencido de que merece mais.</p>
              <p className="source">Disseste que estava bom. Agora aguenta.</p>
              <div className="restaurant-state">
                <span className="status-dot" />
                <p>
                  <strong>Cozinha aberta. Ego também.</strong>
                  <br />
                  Reclamações sobre o sal são aceites. Com algum sofrimento.
                </p>
              </div>
            </div>
            <div className="gastronomy-record">
              <div
                className="stars"
                role="img"
                aria-label={`${club.stars} de 3 estrelas, classificação fictícia`}
              >
                {Array.from({ length: 3 }, (_, i) => (
                  <span key={i} className={i < club.stars ? 'earned' : ''} aria-hidden="true">
                    {i < club.stars ? '★' : '☆'}
                  </span>
                ))}
              </div>
              <div className="rating-caption">AS OUTRAS DUAS ESTÃO PRESAS NA ALFÂNDEGA.</div>
              <ol className="dinner-history">
                {club.history.map((item) => (
                  <li key={item.number}>
                    <span className="dinner-number">{item.number}</span>
                    <div>
                      <span className="dinner-label">JANTAR N.º {item.number}</span>
                      <h3>{item.title}</h3>
                      <p>{item.detail}</p>
                    </div>
                    <span className="dinner-status">{item.status}</span>
                  </li>
                ))}
              </ol>
              <p className="gastronomy-disclaimer">
                Uma brincadeira interna. Sem qualquer ligação ao Guia Michelin.
              </p>
            </div>
          </div>
        </section>
        {admitted ? (
          <>
            <Reservation />
            <Feedback />
          </>
        ) : (
          <section className="section members-only">
            <span className="small-seal" aria-hidden="true">
              D&B.
            </span>
            <Eyebrow>Não fiz isto para ficares só a olhar</Eyebrow>
            <h2>
              O jantar não se
              <br />
              <em>marca sozinho, Ben.</em>
            </h2>
            <p>Cinco perguntas. Depois podes escolher quando me aturas.</p>
            <button className="button button-navy" onClick={openInvitation}>
              {progress.stage === 'quiz' ? 'Acabar com isto' : 'Vá, mostra lá'} <Arrow />
            </button>
          </section>
        )}
      </main>
      <footer>
        <div className="footer-top">
          <div>
            <span className="footer-logo">D&B.</span>
            <p>
              Tudo isto para te dizer:
              <br />
              anda cá jantar, pá.
            </p>
          </div>
          <div className="footer-contact">
            <Eyebrow>Não há linha de apoio. Há um Daniel.</Eyebrow>
            <button
              className="text-button"
              onClick={() =>
                showNotice('Olá. Sou o Daniel. Sim, também atendo o telefone imaginário.')
              }
            >
              Falar com o responsável <Arrow diagonal />
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © 2026 D&B. Todos os direitos reservados.
            <br className="mobile-break" /> Todos os funcionários são o Daniel.
          </p>
          <span>UM SITE INTEIRO. UMA MENSAGEM TERIA CHEGADO.</span>
        </div>
      </footer>
      <div className={`notice ${notice ? 'visible' : ''}`} role="status" aria-live="polite">
        {notice}
        {notice && (
          <button onClick={() => setNotice('')} aria-label="Fechar mensagem">
            ×
          </button>
        )}
      </div>
    </>
  );
}
