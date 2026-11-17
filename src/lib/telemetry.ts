import { telemetryEnabled } from './supabase-config';

export type TelemetryEvent =
  | { type: 'site_open'; data: Record<string, never> }
  | { type: 'question_started'; data: { question_index: number } }
  | { type: 'question_completed'; data: { question_index: number; option_index: number } }
  | { type: 'css_reveal_entered'; data: Record<string, never> }
  | { type: 'animation_paused'; data: Record<string, never> }
  | { type: 'animation_resumed'; data: Record<string, never> }
  | { type: 'animation_skipped'; data: Record<string, never> }
  | { type: 'invite_response'; data: { response: 'yes' | 'no' } }
  | { type: 'reschedule_action'; data: { action: 'date_selected' | 'copy_clicked' } };

export type TelemetryRecord = {
  event_id: string;
  session_id: string;
  event_type: TelemetryEvent['type'];
  event_data: TelemetryEvent['data'];
};

type EventStore = {
  insert: (record: TelemetryRecord) => Promise<void>;
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

type TelemetryOptions = {
  storage?: StorageLike | null;
  uuid?: () => string;
  onError?: (error: unknown) => void;
};

const sessionStorageKey = 'db-chapter-i-telemetry-session';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function browserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function randomUuid() {
  return crypto.randomUUID();
}

function getSessionId(
  storage: StorageLike | null,
  uuid: () => string,
  onError: (error: unknown) => void,
) {
  let storedId: string | null = null;
  try {
    storedId = storage?.getItem(sessionStorageKey) ?? null;
  } catch (error) {
    onError(error);
  }
  if (storedId && uuidPattern.test(storedId)) return storedId;

  try {
    const sessionId = uuid();
    if (!uuidPattern.test(sessionId)) throw new Error('O gerador não devolveu um UUID válido.');
    try {
      storage?.setItem(sessionStorageKey, sessionId);
    } catch (error) {
      onError(error);
    }
    return sessionId;
  } catch (error) {
    onError(error);
    return null;
  }
}

export function createTelemetry(store: EventStore | null, options: TelemetryOptions = {}) {
  const reportError =
    options.onError ??
    ((error: unknown) =>
      console.warn('Telemetria indisponível; o jogo continua normalmente.', error));
  const storage = options.storage === undefined ? browserStorage() : options.storage;
  const uuid = options.uuid ?? randomUuid;
  const sessionId = store ? getSessionId(storage, uuid, reportError) : null;
  const recordedKeys = new Set<string>();

  return {
    enabled: Boolean(store && sessionId),
    sessionId,
    async track(event: TelemetryEvent, dedupeKey?: string) {
      if (!store || !sessionId) return;
      if (dedupeKey && recordedKeys.has(dedupeKey)) return;
      if (dedupeKey) recordedKeys.add(dedupeKey);

      try {
        await store.insert({
          event_id: uuid(),
          session_id: sessionId,
          event_type: event.type,
          event_data: event.data,
        });
      } catch (error) {
        reportError(error);
      }
    },
  };
}

const telemetryStore: EventStore | null = telemetryEnabled
  ? {
      async insert(record) {
        const { supabaseClient } = await import('./supabase');
        if (!supabaseClient) throw new Error('Supabase não está configurado.');
        const { error } = await supabaseClient
          .from('chapter_i_events')
          .upsert(record, { onConflict: 'event_id', ignoreDuplicates: true });
        if (error) throw error;
      },
    }
  : null;

export const telemetry = createTelemetry(telemetryStore);
