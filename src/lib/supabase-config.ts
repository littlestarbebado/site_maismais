const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';
const telemetrySwitch = import.meta.env.VITE_TELEMETRY_ENABLED === 'true';

function isAllowedUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' ||
      (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))
    );
  } catch {
    return false;
  }
}

export const supabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && isAllowedUrl(supabaseUrl),
);
export const telemetryEnabled = telemetrySwitch && supabaseConfigured;

export function getSupabaseCredentials() {
  return supabaseConfigured ? { url: supabaseUrl, anonKey: supabaseAnonKey } : null;
}

if ((supabaseUrl || supabaseAnonKey) && !supabaseConfigured) {
  console.error('Supabase está mal configurado; o jogo continua sem telemetria.');
}
