import { redactObject } from './audit.service';

describe('audit redaction', () => {
  it('redacts secrets, tokens, and digital codes', () => {
    const redacted = redactObject({
      email: 'a@b.com',
      passwordHash: 'secret',
      token: 'abc',
      code: 'GAME-KEY-123',
      nested: { apiKey: 'x', ok: 1 },
    });

    expect(redacted?.email).toBe('a@b.com');
    expect(redacted?.passwordHash).toBe('[REDACTED]');
    expect(redacted?.token).toBe('[REDACTED]');
    expect(redacted?.code).toBe('[REDACTED]');
    expect((redacted?.nested as Record<string, unknown>).apiKey).toBe(
      '[REDACTED]',
    );
    expect((redacted?.nested as Record<string, unknown>).ok).toBe(1);
  });
});
