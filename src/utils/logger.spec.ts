import { vi } from 'vitest';

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

const mockTransport = {};

vi.mock('pino', () => {
  const pino = vi.fn().mockReturnValue(mockLogger);
  (pino as unknown as Record<string, unknown>).transport = vi.fn().mockReturnValue(mockTransport);
  return { default: pino };
});

describe('logger', () => {
  it('should create and export a pino logger with pino-roll transport', async () => {
    // when
    const { default: logger } = await import('./logger.js');
    const pino = (await import('pino')).default;

    // then
    expect(pino.transport).toHaveBeenCalledWith(expect.objectContaining({
      target: 'pino-roll',
      options: expect.objectContaining({
        frequency: 'daily',
        size: '10m',
        mkdir: true
      })
    }));

    expect(pino).toHaveBeenCalledWith(mockTransport);
    expect(logger).toBe(mockLogger);
  });
});
