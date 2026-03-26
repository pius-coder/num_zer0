export type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export function Ok<T>(data: T): Result<T, never> {
  return { ok: true, data };
}

export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function tryCatch<T>(fn: () => T): Result<T> {
  try {
    return Ok(fn());
  } catch (e) {
    return Err(e instanceof Error ? e : new Error(String(e)));
  }
}

export async function tryCatchAsync<T>(
  fn: () => Promise<T>
): Promise<Result<T>> {
  try {
    const data = await fn();
    return Ok(data);
  } catch (e) {
    return Err(e instanceof Error ? e : new Error(String(e)));
  }
}
