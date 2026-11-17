import { useEffect, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabaseClient } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type EventRow = Database['public']['Tables']['chapter_i_events']['Row'];
type Funnel = Database['public']['Views']['chapter_i_telemetry_funnel']['Row'];

const pageSize = 100;

const eventLabels: Record<string, string> = {
  site_open: 'Abertura do site',
  question_started: 'Pergunta iniciada',
  question_completed: 'Pergunta concluída',
  css_reveal_entered: 'Entrada na revelação CSS',
  animation_paused: 'Animação pausada',
  animation_resumed: 'Animação retomada',
  animation_skipped: 'Animação saltada',
  invite_response: 'Resposta ao convite',
  reschedule_action: 'Ação de reagendamento',
};

function displayEventData(event: EventRow) {
  const data = event.event_data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return '—';

  if ('question_index' in data) {
    const questionNumber = Number(data.question_index) + 1;
    if ('option_index' in data) {
      return `Pergunta ${questionNumber} · Opção ${Number(data.option_index) + 1}`;
    }
    return `Pergunta ${questionNumber}`;
  }
  if ('response' in data) return data.response === 'yes' ? 'SIM' : 'NÃO';
  if ('action' in data)
    return data.action === 'date_selected' ? 'Dia escolhido' : 'Sugestão copiada';
  return '—';
}

export default function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [summary, setSummary] = useState<Funnel | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [panelError, setPanelError] = useState('');
  const isAdmin = user?.app_metadata.role === 'chapter_i_admin';

  useEffect(() => {
    const client = supabaseClient;
    if (!client) {
      setAuthReady(true);
      return;
    }

    let active = true;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null);
    });

    void client.auth
      .getSession()
      .then(async ({ data: sessionData, error: sessionError }) => {
        if (!active) return;
        if (sessionError) {
          setAuthError(sessionError.message);
          setAuthReady(true);
          return;
        }
        if (!sessionData.session) {
          setUser(null);
          setAuthReady(true);
          return;
        }
        const { data, error } = await client.auth.getUser();
        if (error) setAuthError(error.message);
        setUser(data.user);
        setAuthReady(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setAuthError(error instanceof Error ? error.message : 'Falha ao verificar a sessão.');
        setAuthReady(true);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const client = supabaseClient;
    if (!client || !isAdmin) {
      setSummary(null);
      setEvents([]);
      setHasMore(false);
      return;
    }

    let active = true;
    setPanelError('');
    void Promise.all([
      client.from('chapter_i_telemetry_funnel').select('*').single(),
      client
        .from('chapter_i_events')
        .select('event_id, created_at, session_id, event_type, event_data')
        .order('created_at', { ascending: false })
        .order('event_id', { ascending: false })
        .range(0, pageSize - 1),
    ])
      .then(([funnelResult, eventsResult]) => {
        if (!active) return;
        if (funnelResult.error || eventsResult.error) {
          setPanelError(
            funnelResult.error?.message ??
              eventsResult.error?.message ??
              'Falha ao ler telemetria.',
          );
          return;
        }
        setSummary(funnelResult.data);
        setEvents(eventsResult.data);
        setHasMore(eventsResult.data.length === pageSize);
      })
      .catch((error: unknown) => {
        if (active)
          setPanelError(error instanceof Error ? error.message : 'Falha ao ler telemetria.');
      });

    return () => {
      active = false;
    };
  }, [isAdmin]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabaseClient) return;
    setBusy(true);
    setAuthError('');
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setAuthError(error.message);
        return;
      }
      if (data.user?.app_metadata.role !== 'chapter_i_admin') {
        const { error: signOutError } = await supabaseClient.auth.signOut();
        setUser(null);
        setAuthError(
          signOutError
            ? `Conta sem permissões; não foi possível terminar sessão: ${signOutError.message}`
            : 'Esta conta não tem permissões de administração.',
        );
      } else {
        setUser(data.user);
        setPassword('');
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Falha ao iniciar sessão.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.auth.signOut();
    if (error) setAuthError(error.message);
    else {
      setUser(null);
      setSummary(null);
      setEvents([]);
    }
  }

  async function loadMore() {
    if (!supabaseClient || !isAdmin || loadingMore) return;
    setLoadingMore(true);
    setPanelError('');
    try {
      const { data, error } = await supabaseClient
        .from('chapter_i_events')
        .select('event_id, created_at, session_id, event_type, event_data')
        .order('created_at', { ascending: false })
        .order('event_id', { ascending: false })
        .range(events.length, events.length + pageSize - 1);
      if (error) {
        setPanelError(error.message);
        return;
      }
      setEvents((previous) => [...previous, ...data]);
      setHasMore(data.length === pageSize);
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : 'Falha ao carregar mais eventos.');
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">D&B. · ACESSO RESTRITO</p>
          <h1>Acompanhamento do Capítulo I</h1>
        </div>
        {isAdmin && (
          <button className="admin-secondary-button" onClick={() => void signOut()}>
            Terminar sessão
          </button>
        )}
      </header>

      {!supabaseClient ? (
        <section className="admin-card" role="status">
          <h2>Painel ainda não configurado</h2>
          <p>
            Define a URL e a chave pública do Supabase no ambiente de build e aplica a migração de
            telemetria antes de iniciar sessão.
          </p>
        </section>
      ) : !authReady ? (
        <p role="status">A verificar sessão…</p>
      ) : !user ? (
        <form className="admin-card admin-login" onSubmit={(event) => void signIn(event)}>
          <h2>Iniciar sessão</h2>
          <label htmlFor="admin-email">Email administrativo</label>
          <input
            id="admin-email"
            autoComplete="username"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label htmlFor="admin-password">Palavra-passe</label>
          <input
            id="admin-password"
            autoComplete="current-password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="admin-primary-button" disabled={busy}>
            {busy ? 'A autenticar…' : 'Entrar'}
          </button>
          {authError && (
            <p className="admin-error" role="alert">
              {authError}
            </p>
          )}
          <p className="admin-help">
            Não existe registo público. A conta é criada pelo administrador.
          </p>
        </form>
      ) : !isAdmin ? (
        <section className="admin-card" role="alert">
          <h2>Acesso não autorizado</h2>
          <p>A conta autenticada não tem o papel administrativo necessário.</p>
          <button className="admin-secondary-button" onClick={() => void signOut()}>
            Terminar sessão
          </button>
        </section>
      ) : (
        <section className="admin-dashboard" aria-label="Dados do Capítulo I">
          <p className="admin-signed-in">Sessão administrativa: {user.email}</p>
          {panelError && (
            <p className="admin-error" role="alert">
              {panelError}
            </p>
          )}
          {summary && (
            <>
              <div className="admin-stats">
                <article className="admin-stat">
                  <span>Visitas</span>
                  <strong>{summary.visits}</strong>
                </article>
                <article className="admin-stat">
                  <span>Sessões</span>
                  <strong>{summary.sessions}</strong>
                </article>
                <article className="admin-stat">
                  <span>SIM</span>
                  <strong>{summary.yes_responses}</strong>
                </article>
                <article className="admin-stat">
                  <span>NÃO</span>
                  <strong>{summary.no_responses}</strong>
                </article>
                <article className="admin-stat">
                  <span>Reagendamentos</span>
                  <strong>{summary.reschedule_actions}</strong>
                </article>
              </div>
              <section className="admin-card">
                <h2>Funil de conclusão</h2>
                <ol className="admin-funnel">
                  {[1, 2, 3, 4].map((number) => (
                    <li key={number}>
                      <span>
                        Pergunta {number}: iniciada{' '}
                        {summary[`question_${number}_started` as keyof Funnel]} · concluída{' '}
                        {summary[`question_${number}_completed` as keyof Funnel]}
                      </span>
                    </li>
                  ))}
                  <li>
                    <span>Revelação CSS: {summary.reveal_sessions}</span>
                  </li>
                  <li>
                    <span>
                      SIM: {summary.yes_responses} · NÃO: {summary.no_responses}
                    </span>
                  </li>
                </ol>
              </section>
            </>
          )}
          <section className="admin-card admin-history">
            <h2>Histórico de eventos</h2>
            <div className="admin-table-scroll">
              <table>
                <caption>Eventos mais recentes, por timestamp do servidor</caption>
                <thead>
                  <tr>
                    <th scope="col">Timestamp</th>
                    <th scope="col">Sessão aleatória</th>
                    <th scope="col">Evento</th>
                    <th scope="col">Dados mínimos</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.event_id}>
                      <td>{new Date(event.created_at).toLocaleString('pt-PT')}</td>
                      <td>
                        <code>{event.session_id}</code>
                      </td>
                      <td>{eventLabels[event.event_type] ?? event.event_type}</td>
                      <td>{displayEventData(event)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {events.length === 0 && !panelError && <p>Ainda não há eventos.</p>}
            {hasMore && (
              <button
                className="admin-secondary-button"
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore ? 'A carregar…' : 'Carregar eventos anteriores'}
              </button>
            )}
          </section>
          <p className="admin-privacy">
            O painel só lê eventos após autenticação. O banco bloqueia leituras sem papel
            administrativo através de RLS.
          </p>
        </section>
      )}
      {authError && supabaseClient && user && (
        <p className="admin-error" role="alert">
          {authError}
        </p>
      )}
    </main>
  );
}
