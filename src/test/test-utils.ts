import EventEmitter from "node:events";
import {ClientRequest} from "node:http";
import { vi } from 'vitest';

export function unsafeCast<T>(value: unknown): T {
  return value as T;
}

export function createMock<T>(partial: Partial<T> = {}): T {
  return partial as T;
}

export function mockClientRequest(): ClientRequest {
  return new EventEmitter() as unknown as ClientRequest;
}

export function setupInversifyMocks(): void {
  vi.mock('inversify', async () => {
    const actual = await vi.importActual('inversify');
    return {
      ...actual,
      injectable: () => (target: unknown) => target,
      inject: () => (_target: unknown, _propertyKey?: string | symbol, _parameterIndex?: number) => {}
    };
  });
}
