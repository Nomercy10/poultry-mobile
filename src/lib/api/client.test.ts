import { apiRequest, configureApiAuth } from './client';
import { ApiError } from './errors';

type FakeResponse = { status: number; body?: unknown };

function respond({ status, body }: FakeResponse) {
  return Promise.resolve({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as Response);
}

const ok = (data: unknown) => respond({ status: 200, body: { success: true, data } });
const unauthorized = () => respond({ status: 401, body: { success: false, message: 'Token expired' } });

describe('apiRequest', () => {
  let token: string;
  const fetchMock = jest.fn();
  const refreshAccessToken = jest.fn<Promise<string | null>, []>();
  const onAuthFailure = jest.fn();

  beforeEach(() => {
    token = 'old';
    fetchMock.mockReset();
    refreshAccessToken.mockReset();
    onAuthFailure.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    configureApiAuth({ getAccessToken: () => token, refreshAccessToken, onAuthFailure });
  });

  it('unwraps the { success, data, meta } envelope', async () => {
    fetchMock.mockReturnValueOnce(
      respond({ status: 200, body: { success: true, data: [1, 2], meta: { total: 2, page: 1, limit: 20, totalPages: 1 } } }),
    );
    await expect(apiRequest('GET', '/eggs', { query: { page: 1, search: '' } })).resolves.toEqual({
      data: [1, 2],
      meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
    });
    // Empty query values are dropped.
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/eggs\?page=1$/);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer old');
  });

  it('refreshes once for parallel 401s, then retries each request with the new token', async () => {
    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      const auth = (init.headers as Record<string, string>).Authorization;
      return auth === 'Bearer new' ? ok('fresh') : unauthorized();
    });
    refreshAccessToken.mockImplementation(async () => {
      token = 'new';
      return 'new';
    });

    const results = await Promise.all([apiRequest('GET', '/a'), apiRequest('GET', '/b')]);

    expect(results.map((r) => r.data)).toEqual(['fresh', 'fresh']);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(onAuthFailure).not.toHaveBeenCalled();
  });

  it('signs out when the refresh token is no longer valid', async () => {
    fetchMock.mockImplementation(() => unauthorized());
    refreshAccessToken.mockResolvedValue(null);

    await expect(apiRequest('GET', '/dashboard/summary')).rejects.toMatchObject({ status: 401 });
    expect(onAuthFailure).toHaveBeenCalledTimes(1);
  });

  it('does not refresh for endpoints called without auth (login)', async () => {
    fetchMock.mockReturnValueOnce(respond({ status: 401, body: { success: false, message: 'Invalid email or password' } }));

    await expect(apiRequest('POST', '/auth/login', { auth: false, body: {} })).rejects.toThrow('Invalid email or password');
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it('reports a network failure as offline, not as a logout', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));

    const error = await apiRequest('GET', '/farms').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isOffline).toBe(true);
    expect(onAuthFailure).not.toHaveBeenCalled();
  });
});
