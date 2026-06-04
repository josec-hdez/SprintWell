const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new HttpError(response.status, body || response.statusText);
  }

  return (await response.json()) as T;
}

export { BASE_URL as apiBaseUrl };
