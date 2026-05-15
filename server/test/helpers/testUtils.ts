import APIError from '../../src/utils/apiErrors';

// ── Error Catching ─────────────────────────────────────────────────────────────

async function expectError(fn: () => Promise<unknown>, expectedMessage: string | RegExp): Promise<Error> {
  let caughtError: unknown;

  try {
    await fn();
  } catch (err) {
    caughtError = err;
  }

  if (!caughtError) {
    throw new Error('Hata fırlatılmalıydı ama fırlatılmadı');
  }

  expect(caughtError).toBeInstanceOf(Error);

  const message = (caughtError as Error).message;

  if (expectedMessage instanceof RegExp) {
    expect(message).toMatch(expectedMessage);
  } else {
    expect(message).toContain(expectedMessage);
  }

  return caughtError as Error;
}

async function expectAPIError(
  fn: () => Promise<unknown>,
  expectedStatus: number,
  expectedMessage?: string
): Promise<APIError> {
  let caughtError: unknown;

  try {
    await fn();
  } catch (err) {
    caughtError = err;
  }

  if (!caughtError) {
    throw new Error('APIError fırlatılmalıydı ama fırlatılmadı');
  }

  expect(caughtError).toBeInstanceOf(APIError);

  const apiError = caughtError as APIError;

  expect(apiError.statusCode).toBe(expectedStatus);

  if (expectedMessage) {
    expect(apiError.message).toContain(expectedMessage);
  }

  return apiError;
}

// ── Mock Controllers ──────────────────────────────────────────────────────────

function expectNotCalled(mock: jest.Mock): void {
  expect(mock).not.toHaveBeenCalled();
}

function expectCalledTimes(mock: jest.Mock, times: number): void {
  expect(mock).toHaveBeenCalledTimes(times);
}

function expectCalledWith(mock: jest.Mock, ...args: unknown[]): void {
  expect(mock).toHaveBeenCalledWith(...args);
}

// ── Redis Helpers ────────────────────────────────────────────────────────

function expectRedisSet(
  mock: jest.Mock,
  options: {
    key: string;
    ttl?: number;
    payloadIncludes?: Record<string, unknown>;
  }
): void {
  expect(mock).toHaveBeenCalled();

  const call = mock.mock.calls[0];

  if (!call) {
    throw new Error('Redis.set çağrılmamış');
  }

  const [key, rawPayload, , ttl] = call as [string, string, string?, number?];

  expect(key).toBe(options.key);

  if (options.ttl !== undefined) {
    expect(ttl).toBe(options.ttl);
  }

  if (options.payloadIncludes) {
    let payload: Record<string, unknown>;

    try {
      payload = JSON.parse(rawPayload);
    } catch (err) {
      throw new Error(`Redis payload JSON değil: ${rawPayload}`, { cause: err });
    }

    for (const [k, v] of Object.entries(options.payloadIncludes)) {
      expect(payload[k]).toEqual(v);
    }
  }
}

// ── Domain-specific helpers ─────────────────────────────────────────────────

async function expectResolved<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Hata fırlatılmamalıydı ama fırlatıldı: ${message}`, { cause: err });
  }
}

async function expectAuthError(fn: () => Promise<unknown>, message?: string): Promise<APIError> {
  return expectAPIError(fn, 401, message);
}

async function expectValidationError(fn: () => Promise<unknown>, message?: string): Promise<APIError> {
  return expectAPIError(fn, 400, message);
}

async function expectConflictError(fn: () => Promise<unknown>, message?: string): Promise<APIError> {
  return expectAPIError(fn, 409, message);
}

const testUtils = {
  expectError,
  expectAPIError,
  expectNotCalled,
  expectCalledTimes,
  expectCalledWith,
  expectRedisSet,
  expectResolved,
  expectAuthError,
  expectValidationError,
  expectConflictError,
};

export default testUtils;
