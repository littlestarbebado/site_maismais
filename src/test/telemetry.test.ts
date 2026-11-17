import { describe, expect, it, vi } from 'vitest';
import { createTelemetry, type TelemetryRecord } from '../lib/telemetry';

const sessionId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const eventId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('telemetria do Capítulo I', () => {
  it('não cria sessão nem envia eventos sem configuração', async () => {
    const insert = vi.fn();
    const uuid = vi.fn();
    const telemetry = createTelemetry(null, { uuid });

    await telemetry.track({ type: 'site_open', data: {} });

    expect(telemetry.enabled).toBe(false);
    expect(telemetry.sessionId).toBeNull();
    expect(uuid).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it('usa ID aleatório de sessão e elimina duplicados sem incluir dados pessoais', async () => {
    const insert = vi.fn(async (_record: TelemetryRecord) => {});
    const getItem = vi.fn(() => null);
    const setItem = vi.fn();
    const uuids = [sessionId, eventId, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'];
    const telemetry = createTelemetry(
      { insert },
      {
        storage: { getItem, setItem },
        uuid: () => uuids.shift()!,
        onError: vi.fn(),
      },
    );
    const answer = {
      type: 'question_completed' as const,
      data: { question_index: 2, option_index: 3 },
    };

    await telemetry.track(answer, 'question-3');
    await telemetry.track(answer, 'question-3');

    expect(telemetry.enabled).toBe(true);
    expect(setItem).toHaveBeenCalledWith('db-chapter-i-telemetry-session', sessionId);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith({
      event_id: eventId,
      session_id: sessionId,
      event_type: 'question_completed',
      event_data: { question_index: 2, option_index: 3 },
    });
    expect(JSON.stringify(insert.mock.calls[0][0])).not.toMatch(
      /email|name|ip|location|date|user.?agent/i,
    );
  });

  it('falhas de rede são reportadas sem propagar erro ao jogo', async () => {
    const networkError = new Error('offline');
    const insert = vi.fn().mockRejectedValue(networkError);
    const onError = vi.fn();
    const telemetry = createTelemetry(
      { insert },
      {
        storage: { getItem: () => sessionId, setItem: vi.fn() },
        uuid: () => eventId,
        onError,
      },
    );

    await expect(telemetry.track({ type: 'site_open', data: {} })).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalledWith(networkError);
  });
});
