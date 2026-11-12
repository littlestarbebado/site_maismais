import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { memes, type MemeId } from '../config';

const ReactionContext = createContext({ show: (_id: MemeId) => {}, dismiss: () => {} });
export const useMemeReaction = () => useContext(ReactionContext);

export function MemeReactionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<{ id: MemeId; sequence: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const sequence = useRef(0);
  const panel = useRef<HTMLElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  const dismiss = useCallback(() => {
    if (panel.current?.contains(document.activeElement) && origin.current?.isConnected)
      origin.current.focus({ preventScroll: true });
    setActive(null);
    setPaused(false);
  }, []);
  const show = useCallback((id: MemeId) => {
    if (!panel.current?.contains(document.activeElement))
      origin.current = document.activeElement as HTMLElement;
    setPaused(false);
    setActive({ id, sequence: ++sequence.current });
  }, []);
  useEffect(() => {
    if (!active || paused) return;
    const timer = setTimeout(dismiss, 5500);
    return () => clearTimeout(timer);
  }, [active, paused, dismiss]);
  useEffect(() => {
    if (!active) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [active, dismiss]);
  const meme = active && memes[active.id];
  return (
    <ReactionContext.Provider value={{ show, dismiss }}>
      {children}
      {active && meme && (
        <aside
          className="meme-reaction"
          aria-label="A direção perdeu a pose"
          ref={panel}
          key={active.sequence}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
          }}
        >
          <div className="meme-heading">
            <span>FUGA DE INFORMAÇÃO</span>
            <button type="button" onClick={dismiss} aria-label="Fechar reação">
              ×
            </button>
          </div>
          <img src={meme.src} alt={meme.alt} onError={dismiss} />
          <p>{meme.caption}</p>
          <span className="meme-footnote">Isto não era para aparecer.</span>
        </aside>
      )}
    </ReactionContext.Provider>
  );
}
