import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock server-only (must be first)
vi.mock('server-only', () => ({}));

// Mock jose
const mockSign = vi.fn().mockResolvedValue('mock-jwt-token');
const mockSetIssuedAt = vi.fn().mockReturnValue({ sign: mockSign });
const mockSetExpirationTime = vi.fn().mockReturnValue({ setIssuedAt: mockSetIssuedAt });
const mockSetProtectedHeader = vi.fn().mockReturnValue({ setExpirationTime: mockSetExpirationTime });
const MockSignJWT = vi.fn().mockImplementation(() => ({ setProtectedHeader: mockSetProtectedHeader }));

vi.mock('jose', () => ({
  SignJWT: MockSignJWT,
  jwtVerify: vi.fn(),
}));

// Mock next/headers
const mockCookieSet = vi.fn();
const mockCookies = vi.fn().mockResolvedValue({
  set: mockCookieSet,
  get: vi.fn(),
  delete: vi.fn(),
});

vi.mock('next/headers', () => ({
  cookies: mockCookies,
}));

// Import after all mocks are set up
const { createSession } = await import('../auth');

describe('createSession', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('creates session with valid userId and email', async () => {
    const userId = 'user-123';
    const email = 'test@example.com';

    await createSession(userId, email);

    // Verify cookies() was called
    expect(mockCookies).toHaveBeenCalledTimes(1);

    // Verify cookie was set
    expect(mockCookieSet).toHaveBeenCalledTimes(1);
  });

  test('sets cookie with correct name and token', async () => {
    const userId = 'user-456';
    const email = 'user@test.com';

    await createSession(userId, email);

    // cookie.set(name, value, options)
    const [cookieName, token] = mockCookieSet.mock.calls[0];
    expect(cookieName).toBe('auth-token');
    expect(token).toBe('mock-jwt-token');
  });

  test('sets cookie with httpOnly flag', async () => {
    await createSession('user-1', 'test@example.com');

    const [, , options] = mockCookieSet.mock.calls[0];
    expect(options.httpOnly).toBe(true);
  });

  test('sets cookie with sameSite: lax', async () => {
    await createSession('user-1', 'test@example.com');

    const [, , options] = mockCookieSet.mock.calls[0];
    expect(options.sameSite).toBe('lax');
  });

  test('sets cookie with path: /', async () => {
    await createSession('user-1', 'test@example.com');

    const [, , options] = mockCookieSet.mock.calls[0];
    expect(options.path).toBe('/');
  });

  test('sets cookie with expiration date 7 days in future', async () => {
    const before = Date.now();
    await createSession('user-1', 'test@example.com');
    const after = Date.now();

    const [, , options] = mockCookieSet.mock.calls[0];
    const expiresTime = options.expires.getTime();

    // Should be approximately 7 days from now
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const expectedMin = before + sevenDaysInMs;
    const expectedMax = after + sevenDaysInMs;

    expect(expiresTime).toBeGreaterThanOrEqual(expectedMin);
    expect(expiresTime).toBeLessThanOrEqual(expectedMax);
  });

  test('sets secure flag to false in development', async () => {
    process.env.NODE_ENV = 'development';

    await createSession('user-1', 'test@example.com');

    const [, , options] = mockCookieSet.mock.calls[0];
    expect(options.secure).toBe(false);
  });

  test('sets secure flag to true in production', async () => {
    process.env.NODE_ENV = 'production';

    await createSession('user-1', 'test@example.com');

    const [, , options] = mockCookieSet.mock.calls[0];
    expect(options.secure).toBe(true);
  });

  test('handles special characters in email', async () => {
    const email = 'test+tag@example.com';

    await createSession('user-1', email);

    expect(mockCookieSet).toHaveBeenCalledTimes(1);
  });

  test('handles long userId', async () => {
    const longUserId = 'a'.repeat(1000);

    await createSession(longUserId, 'test@example.com');

    expect(mockCookieSet).toHaveBeenCalledTimes(1);
  });

  test('creates session with empty userId (edge case)', async () => {
    await createSession('', 'test@example.com');

    expect(mockCookieSet).toHaveBeenCalledTimes(1);
  });

  test('creates session with empty email (edge case)', async () => {
    await createSession('user-1', '');

    expect(mockCookieSet).toHaveBeenCalledTimes(1);
  });

  test('creates multiple sessions sequentially', async () => {
    await createSession('user-1', 'user1@example.com');
    await createSession('user-2', 'user2@example.com');
    await createSession('user-3', 'user3@example.com');

    expect(mockCookieSet).toHaveBeenCalledTimes(3);
  });

  test('cookie options match expected configuration in production', async () => {
    process.env.NODE_ENV = 'production';

    await createSession('user-123', 'test@example.com');

    const [cookieName, token, options] = mockCookieSet.mock.calls[0];

    expect(cookieName).toBe('auth-token');
    expect(token).toBe('mock-jwt-token');
    expect(options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
    expect(options.expires).toBeInstanceOf(Date);
  });

  test('uses consistent expiration time for cookie', async () => {
    await createSession('user-1', 'test@example.com');

    const [, , options] = mockCookieSet.mock.calls[0];
    const cookieExpires = options.expires;

    // Cookie should expire in ~7 days
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const expectedExpiry = now + sevenDays;

    // Allow 1 second tolerance for test execution time
    expect(cookieExpires.getTime()).toBeGreaterThan(expectedExpiry - 1000);
    expect(cookieExpires.getTime()).toBeLessThan(expectedExpiry + 1000);
  });

  test('calls SignJWT with correct session payload', async () => {
    const userId = 'test-user-id';
    const email = 'test@example.com';

    await createSession(userId, email);

    expect(MockSignJWT).toHaveBeenCalledTimes(1);
    const sessionPayload = MockSignJWT.mock.calls[0][0];

    expect(sessionPayload).toMatchObject({
      userId,
      email,
    });
    expect(sessionPayload.expiresAt).toBeInstanceOf(Date);
  });

  test('sets JWT protected header with HS256 algorithm', async () => {
    await createSession('user-1', 'test@example.com');

    expect(mockSetProtectedHeader).toHaveBeenCalledWith({ alg: 'HS256' });
  });

  test('sets JWT expiration time to 7 days', async () => {
    await createSession('user-1', 'test@example.com');

    expect(mockSetExpirationTime).toHaveBeenCalledWith('7d');
  });

  test('sets JWT issued at timestamp', async () => {
    await createSession('user-1', 'test@example.com');

    expect(mockSetIssuedAt).toHaveBeenCalled();
  });

  test('signs JWT with secret', async () => {
    await createSession('user-1', 'test@example.com');

    expect(mockSign).toHaveBeenCalled();
  });
});
