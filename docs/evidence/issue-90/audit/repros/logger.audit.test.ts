import { createLogger, redact } from '@/shared/lib/logger';
import { errorReporterSeam } from '@/shared/integrations/errorReporter';
import { ApiError } from '@/shared/http/apiError';

const PRODUCTION = { minLevel: 'warn' as const, development: false };

describe('audit: logger', () => {
  afterEach(() => { errorReporterSeam.reset(); jest.restoreAllMocks(); });

  it('A1 Date / Map / URL in context are logged as {}', () => {
    const out = redact({ at: new Date(0), m: new Map([['k', 'v']]), u: new URL('https://x.test/a') }, true);
    console.log('A1', JSON.stringify(out));
    expect(out).toEqual({ at: new Date(0) }); // expect to FAIL: Date became {}
  });

  it('A2 a throwing getter in context makes logger.error throw', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const ctx = { get boom(): string { throw new Error('getter'); } };
    expect(() => createLogger(() => PRODUCTION).error('x', new Error('e'), ctx)).not.toThrow();
  });

  it('A3 the reporter receives the raw ApiError with its response body in production', () => {
    const reporter = { captureException: jest.fn(), captureMessage: jest.fn(), setUser: jest.fn() };
    errorReporterSeam.set(reporter);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const err = new ApiError('Bad', { code: 'client', status: 422, data: { email: 'emily@example.com', ssn: '123' } });
    createLogger(() => PRODUCTION).error('Sign-in failed', err);
    const sent = reporter.captureException.mock.calls[0][0];
    console.log('A3 data reaching reporter:', JSON.stringify(sent.data));
    expect(sent.data).toBeUndefined(); // expect FAIL
  });

  it('A4 default reporter writes to the console even when silent', () => {
    const info = jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    createLogger(() => ({ minLevel: 'silent', development: false })).error('Failed', new Error('secret detail'));
    console.log('A4 info calls', JSON.stringify(info.mock.calls));
    expect(info).not.toHaveBeenCalled(); // expect FAIL
  });

  it('A5 context key "error" is overwritten for non-Error thrown values', () => {
    const reporter = { captureException: jest.fn(), captureMessage: jest.fn(), setUser: jest.fn() };
    errorReporterSeam.set(reporter);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    createLogger(() => PRODUCTION).error('x', 'thrown string', { error: 'ctx' });
    console.log('A5', JSON.stringify(reporter.captureMessage.mock.calls[0][2]));
  });

  it('A6 over/under redaction samples', () => {
    const keys = ['footprint','author','email','phone','cardNumber','ssn','set-cookie','proxy-authorization','x-api-key','apikey','bearer','idToken','sid','hash','salt','iban','dob','password_hash','pwd','pass','code'];
    const out = redact(Object.fromEntries(keys.map(k => [k, 'v'])), false) as Record<string,string>;
    console.log('A6', JSON.stringify(out));
  });

  it('A7 secret in an Error message / URL value is not redacted', () => {
    const out = redact({ url: 'https://api.test/reset?token=abc', error: new Error('Bearer abc') }, false);
    console.log('A7', JSON.stringify(out));
  });
});
