import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSessionToken, verifySessionToken, SESSION_DURATION_SEC } from '../session';

// Mock env variables
vi.mock('../env-server', () => ({
  getServerEnv: vi.fn((key: string) => {
    if (key === 'SESSION_SECRET') return 'test-super-secret-key-that-is-long-enough';
    return undefined;
  }),
}));

describe('Session Module', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('powinien wygenerować poprawny token sesji', async () => {
    const token = await createSessionToken('admin');
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.includes('.')).toBe(true);
  });

  it('powinien poprawnie zweryfikować ważny token', async () => {
    const token = await createSessionToken('admin');
    
    const result = await verifySessionToken(token);
    expect(result.valid).toBe(true);
    expect(result.role).toBe('admin');
  });

  it('powinien poprawnie zweryfikować token pracownika', async () => {
    const token = await createSessionToken('pracownik');
    
    const result = await verifySessionToken(token);
    expect(result.valid).toBe(true);
    expect(result.role).toBe('pracownik');
  });

  it('powinien odrzucić zmodyfikowany token', async () => {
    const token = await createSessionToken('admin');
    const modifiedToken = token.replace('admin', 'pracownik'); // Zmiana roli bez aktualizacji podpisu
    
    const result = await verifySessionToken(modifiedToken);
    expect(result.valid).toBe(false);
    expect(result.role).toBeUndefined();
  });

  it('powinien odrzucić wygasły token', async () => {
    const token = await createSessionToken('admin');
    
    // Przesuwamy czas o więcej niż czas trwania sesji
    vi.advanceTimersByTime((SESSION_DURATION_SEC + 1) * 1000);
    
    const result = await verifySessionToken(token);
    expect(result.valid).toBe(false);
  });

  it('powinien odrzucić niepoprawnie sformatowany token', async () => {
    const result1 = await verifySessionToken('invalid-token-without-dot');
    expect(result1.valid).toBe(false);

    const result2 = await verifySessionToken('payload.invalidsignature');
    expect(result2.valid).toBe(false);
  });
});
