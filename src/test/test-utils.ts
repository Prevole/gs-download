import EventEmitter from "node:events";
import {ClientRequest} from "node:http";

export function unsafeCast<T>(value: unknown): T {
  return value as T;
}

export function createMock<T>(partial: Partial<T> = {}): T {
  return partial as T;
}

export function mockClientRequest(): ClientRequest {
  return new EventEmitter() as unknown as ClientRequest;
}
