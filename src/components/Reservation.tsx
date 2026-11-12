import { useRef, useState, type FormEvent } from 'react';
import { club } from '../config';
import { formatDate, submitForm, todayInLisbon, validateReservation } from '../lib/forms';
import { downloadDocument } from '../lib/download';
import { Arrow, DownloadButton, ErrorMessage, Eyebrow, Honeypot, PrivacyNote } from './UI';
import { useMemeReaction } from './MemeReaction';

type Ticket = { experience: string; date: string; reference: string; idea: string };
export function Reservation() {
  const { show: showMeme } = useMemeReaction();
  const [experience, setExperience] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const data = new FormData(event.currentTarget);
    const date = String(data.get('data') || '');
    const idea = String(data.get('ideia') || '').trim();
    const invalid = validateReservation(
      experience,
      date,
      idea,
      club.experiences.map((item) => item.id),
    );
    if (invalid) {
      setError(invalid);
      return;
    }
    pending.current = true;
    setBusy(true);
    setError('');
    const reference = `DB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const title = club.experiences.find((item) => item.id === experience)!.title;
    try {
      await submitForm('reserva', {
        nome: club.member,
        experiencia: title,
        ideia: idea,
        data: date,
        observacao: String(data.get('observacao') || '').trim(),
        referencia: reference,
        'bot-field': String(data.get('bot-field') || ''),
      });
      setTicket({ experience: title, date, reference, idea });
      showMeme('coracao');
      requestAnimationFrame(() => {
        confirmation.current?.focus({ preventScroll: true });
        confirmation.current?.scrollIntoView({
          block: 'center',
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
        });
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="reservation-section" id="reservas">
      <div className="section">
        <div className="section-heading">
          <div>
            <Eyebrow>03 / A parte em que combinamos mesmo</Eyebrow>
            <h2>
              Pronto, vá.
              <br />
              Quando é<br />
              <em>que vens?</em>
            </h2>
          </div>
          <p>
            Escolhe um plano e um dia.
            <br />É só isto. Prometo.
          </p>
        </div>
        {ticket ? (
          <div className="confirmation" ref={confirmation} tabIndex={-1}>
            <Eyebrow>Já não era sem tempo</Eyebrow>
            <h3>Pedido recebido.</h3>
            <p>
              O pedido chegou. O Daniel vai agora consultar a agenda como se fosse uma pessoa muito
              ocupada.
            </p>
            <p className="confirmation-note">
              Ainda falta confirmar o dia. Não apareças já à porta.
            </p>
            <div className="ticket">
              <div className="ticket-brand">
                <span className="wordmark">D&B.</span>
                <span>
                  ENTRADA INDIVIDUAL
                  <br />
                  CONVIDADO DE HONRA
                </span>
              </div>
              <dl>
                <div>
                  <dt>Nome</dt>
                  <dd>{club.member}</dd>
                </div>
                <div>
                  <dt>Experiência escolhida</dt>
                  <dd>{ticket.experience}</dd>
                </div>
                {ticket.idea && (
                  <div>
                    <dt>A tua ideia</dt>
                    <dd>{ticket.idea}</dd>
                  </div>
                )}
                <div>
                  <dt>Data proposta</dt>
                  <dd>{formatDate(ticket.date)}</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>À espera de confirmação</dd>
                </div>
              </dl>
              <div className="ticket-reference">
                <span>{ticket.reference}</span>
                <span>REFERÊNCIA FICTÍCIA</span>
              </div>
            </div>
            <DownloadButton
              onDownload={() =>
                downloadDocument(
                  'PEDIDO DE RESERVA',
                  [
                    { label: 'Nome', value: club.member },
                    { label: 'Experiência', value: ticket.experience },
                    ...(ticket.idea ? [{ label: 'A tua ideia', value: ticket.idea }] : []),
                    { label: 'Data proposta', value: formatDate(ticket.date) },
                    { label: 'Estado', value: 'À espera de confirmação' },
                    { label: 'Referência fictícia', value: ticket.reference },
                  ],
                  `DB-bilhete-${ticket.reference}.png`,
                  'A data fica sujeita a confirmação pelo Daniel.',
                )
              }
            >
              Guardar bilhete · PNG
            </DownloadButton>
            <button className="text-button new-request" onClick={() => setTicket(null)}>
              Fazer outro pedido <Arrow />
            </button>
          </div>
        ) : (
          <form onSubmit={submit} aria-label="Pedir reserva">
            <fieldset disabled={busy} className="reservation-fields">
              <legend className="sr-only">Escolhe a tua experiência</legend>
              <div className="experience-list">
                {club.experiences.map((item, index) => (
                  <label
                    className={`experience ${experience === item.id ? 'selected' : ''}`}
                    key={item.id}
                  >
                    <input
                      type="radio"
                      name="experiencia"
                      value={item.id}
                      checked={experience === item.id}
                      onChange={() => setExperience(item.id)}
                      required
                    />
                    <span className="experience-number">0{index + 1}</span>
                    <span className="experience-content">
                      <span className="experience-title">{item.title}</span>
                      <span className="experience-description">{item.description}</span>
                    </span>
                    <span className="experience-check" aria-hidden="true">
                      {experience === item.id ? '✓' : '↗'}
                    </span>
                  </label>
                ))}
              </div>
              <div className="booking-details">
                <Eyebrow>O plano está ali. Falta o dia.</Eyebrow>
                {experience === 'ideia' && (
                  <label>
                    A tua ideia
                    <textarea
                      name="ideia"
                      required
                      maxLength={1200}
                      placeholder="Surpreende-me. Mas dá-me tempo para trocar de roupa."
                      rows={3}
                    />
                  </label>
                )}
                <label>
                  Data proposta
                  <input type="date" name="data" required min={todayInLisbon()} />
                </label>
                <p className="field-note">
                  É uma proposta, não uma reserva confirmada.
                  <br />O Daniel confirma contigo.
                </p>
                <label>
                  Alguma observação? <span className="optional">Opcional</span>
                  <textarea
                    name="observacao"
                    maxLength={2000}
                    rows={4}
                    placeholder="Alergias, preferências, coisas que não comes. Convém saber antes."
                  />
                </label>
                <Honeypot />
                <ErrorMessage message={error} />
                <button className="button button-gold" type="submit" disabled={busy}>
                  {busy ? 'A entregar à direção…' : 'Pedir reserva'} <Arrow />
                </button>
                <PrivacyNote />
              </div>
            </fieldset>
          </form>
        )}
      </div>
    </section>
  );
}
