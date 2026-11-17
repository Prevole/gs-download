import { vi } from 'vitest';
import type { Mock } from 'vitest';

interface MockLogger {
  info: Mock;
  error: Mock;
  warn: Mock;
}

const logger: MockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
};

export default logger;
