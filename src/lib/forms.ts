export type FormName = 'reserva' | 'livro' | 'inquerito';
type Settings = { provider: string; endpoint: string; hostname: string };

export async function submitForm(
  name: FormName,
  data: Record<string, string>,
  settings: Settings = {
    provider: import.meta.env.VITE_FORM_PROVIDER || 'netlify',
    endpoint: import.meta.env.VITE_FORMSPREE_ENDPOINT || '',
    hostname: window.location.hostname,
  },
): Promise<void> {
  if (data['bot-field']) throw new Error('Não foi possível entregar a mensagem. Tenta novamente.');
  let endpoint: string;
  let body: string;
  let headers: Record<string, string>;
  if (settings.provider === 'formspree') {
    if (!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(settings.endpoint)) {
      throw new Error(
        'A receção de pedidos ainda não está disponível. Tanto design e falta ligar a campainha. Fala com o Daniel.',
      );
    }
    endpoint = settings.endpoint;
    body = JSON.stringify({ ...data, 'form-name': name });
    headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  } else if (settings.provider === 'netlify') {
    if (
      ['localhost', '127.0.0.1', '::1', '[::1]'].includes(settings.hostname) ||
      settings.hostname.endsWith('.vercel.app')
    ) {
      throw new Error(
        'A receção de pedidos ainda não está disponível nesta versão. Tanto design e falta ligar a campainha. Fala com o Daniel.',
      );
    }
    endpoint = '/';
    body = new URLSearchParams({ ...data, 'form-name': name }).toString();
    headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  } else {
    throw new Error(
      'A receção de pedidos ainda não está disponível. Tanto design e falta ligar a campainha. Fala com o Daniel.',
    );
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('delivery');
    if (settings.provider === 'formspree') {
      const result = await response.json();
      if (result.ok !== true) throw new Error('delivery');
    } else if (!(response.headers.get('server') || '').toLowerCase().includes('netlify')) {
      // A static host can return index.html with HTTP 200 for an unhandled POST.
      throw new Error('unverified-host');
    }
  } catch {
    throw new Error(
      'Não foi possível confirmar a entrega. O site também tem os seus dias. Mantivemos o que escreveste. Tenta novamente ou fala com o Daniel.',
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function todayInLisbon(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Lisbon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`));
}

export function validateReservation(
  experience: string,
  date: string,
  idea: string,
  validIds: string[],
): string | null {
  if (!validIds.includes(experience))
    return 'Escolhe um plano. A telepatia ainda não está incluída.';
  if (experience === 'ideia' && !idea.trim())
    return 'Conta à direção qual é a tua ideia. «Uma ideia melhor» assim em branco não conta.';
  const parsed = new Date(`${date}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date ||
    date < todayInLisbon()
  )
    return 'Escolhe uma data de hoje em diante. Ainda não sei cozinhar no passado.';
  return null;
}
