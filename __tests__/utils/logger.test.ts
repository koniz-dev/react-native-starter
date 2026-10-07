import {
  createLogger,
  redact,
  settingsFromConfig,
  type LoggerSettings,
} from '@/utils/logger';
import {
  consoleErrorReporter,
  errorReporterSeam,
  getErrorReporter,
  setErrorReporter,
  type ErrorReporter,
} from '@/integrations/errorReporter';
import { ApiError } from '@/services/apiError';

const PRODUCTION: LoggerSettings = { minLevel: 'warn', development: false };
const DEVELOPMENT: LoggerSettings = { minLevel: 'debug', development: true };

function mockReporter(): jest.Mocked<ErrorReporter> {
  return {
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    setUser: jest.fn(),
  };
}

describe('logger', () => {
  let reporter: jest.Mocked<ErrorReporter>;
  let consoleSpies: Record<
    'debug' | 'info' | 'warn' | 'error',
    jest.SpyInstance
  >;

  beforeEach(() => {
    reporter = mockReporter();
    errorReporterSeam.set(reporter);
    consoleSpies = {
      debug: jest.spyOn(console, 'debug').mockImplementation(() => {}),
      info: jest.spyOn(console, 'info').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    errorReporterSeam.reset();
    jest.restoreAllMocks();
  });

  describe('levels', () => {
    it('writes only messages at or above the minimum level', () => {
      const logger = createLogger(() => PRODUCTION);

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleSpies.debug).not.toHaveBeenCalled();
      expect(consoleSpies.info).not.toHaveBeenCalled();
      expect(consoleSpies.warn).toHaveBeenCalledWith('warn message');
      expect(consoleSpies.error).toHaveBeenCalledWith('error message');
    });

    it('writes every level in development', () => {
      const logger = createLogger(() => DEVELOPMENT);

      logger.debug('debug message', { a: 1 });
      logger.info('info message');

      expect(consoleSpies.debug).toHaveBeenCalledWith('debug message', {
        a: 1,
      });
      expect(consoleSpies.info).toHaveBeenCalledWith('info message');
    });

    it('writes nothing to the console when silent', () => {
      const logger = createLogger(() => ({
        minLevel: 'silent',
        development: false,
      }));

      logger.warn('warn message');
      logger.error('error message', new Error('boom'));

      expect(consoleSpies.warn).not.toHaveBeenCalled();
      expect(consoleSpies.error).not.toHaveBeenCalled();
      // Reporting does not depend on the console level.
      expect(reporter.captureException).toHaveBeenCalledTimes(1);
    });

    it('reads the settings on every call', () => {
      let settings = PRODUCTION;
      const logger = createLogger(() => settings);

      logger.info('hidden');
      settings = DEVELOPMENT;
      logger.info('shown');

      expect(consoleSpies.info).toHaveBeenCalledTimes(1);
      expect(consoleSpies.info).toHaveBeenCalledWith('shown');
    });

    it('uses the configured level from config/env.ts', () => {
      // jest.setup.env.js runs tests as a development build.
      expect(settingsFromConfig()).toEqual({
        minLevel: 'debug',
        development: true,
      });
    });
  });

  describe('forwarding to the error reporter in production', () => {
    it('reports an Error with the message and redacted context', () => {
      const logger = createLogger(() => PRODUCTION);
      const error = new Error('disk full');

      logger.error('Failed to save', error, {
        key: 'settings',
        headers: { Authorization: 'Bearer secret-token' },
      });

      expect(reporter.captureException).toHaveBeenCalledWith(error, {
        message: 'Failed to save',
        extra: { key: 'settings', headers: { Authorization: '[redacted]' } },
      });
    });

    it('reports a message when there is no Error', () => {
      const logger = createLogger(() => PRODUCTION);

      logger.error('Payment declined', undefined, { orderId: 7 });

      expect(reporter.captureMessage).toHaveBeenCalledWith(
        'Payment declined',
        'error',
        { message: 'Payment declined', extra: { orderId: 7 } }
      );
      expect(reporter.captureException).not.toHaveBeenCalled();
    });

    it('reports a thrown non-Error value as a message with the value', () => {
      const logger = createLogger(() => PRODUCTION);

      logger.error('Unexpected rejection', { reason: 'nope', token: 'abc' });

      expect(reporter.captureMessage).toHaveBeenCalledWith(
        'Unexpected rejection',
        'error',
        {
          message: 'Unexpected rejection',
          extra: { error: { reason: 'nope', token: '[redacted]' } },
        }
      );
    });

    it('does not forward warnings', () => {
      createLogger(() => PRODUCTION).warn('slow response');

      expect(reporter.captureException).not.toHaveBeenCalled();
      expect(reporter.captureMessage).not.toHaveBeenCalled();
    });

    it('also forwards in development', () => {
      const error = new Error('boom');
      createLogger(() => DEVELOPMENT).error('Failed', error);

      expect(reporter.captureException).toHaveBeenCalledWith(error, {
        message: 'Failed',
        extra: undefined,
      });
    });

    it('setErrorReporter registers a provider', () => {
      errorReporterSeam.reset();
      const provider = mockReporter();
      setErrorReporter(provider);

      createLogger(() => PRODUCTION).error('Failed', new Error('boom'));

      expect(getErrorReporter()).toBe(provider);
      expect(provider.captureException).toHaveBeenCalledTimes(1);
    });

    it('keeps working when the reporter throws', () => {
      reporter.captureException.mockImplementation(() => {
        throw new Error('reporter down');
      });
      const logger = createLogger(() => PRODUCTION);

      expect(() => logger.error('Failed', new Error('boom'))).not.toThrow();
      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('the default reporter writes one console line', () => {
      errorReporterSeam.reset();
      createLogger(() => PRODUCTION).error('Failed to save', new Error('boom'));

      expect(errorReporterSeam.get()).toBe(consoleErrorReporter);
      expect(consoleSpies.info).toHaveBeenCalledWith(
        '[error-reporter] exception: Error: boom (Failed to save)'
      );
    });
  });

  describe('redaction', () => {
    it('always redacts auth headers, cookies, tokens, and passwords', () => {
      const input = {
        headers: {
          Authorization: 'Bearer abc',
          Cookie: 'session=1',
          Accept: 'application/json',
        },
        credentials: { username: 'emilys', password: 'emilyspass' },
        accessToken: 'abc',
        refresh_token: 'def',
      };

      for (const development of [true, false]) {
        expect(redact(input, development)).toEqual({
          headers: {
            Authorization: '[redacted]',
            Cookie: '[redacted]',
            Accept: 'application/json',
          },
          credentials: { username: 'emilys', password: '[redacted]' },
          accessToken: '[redacted]',
          refresh_token: '[redacted]',
        });
      }
    });

    it('redacts response bodies outside development only', () => {
      const input = { status: 500, data: { user: 'emily' }, body: '{}' };

      expect(redact(input, false)).toEqual({
        status: 500,
        data: '[redacted]',
        body: '[redacted]',
      });
      expect(redact(input, true)).toEqual(input);
    });

    it('reduces Errors to name, message, code, and status outside development', () => {
      const error = new ApiError('Server error', {
        code: 'server',
        status: 500,
        data: { secret: 'response body' },
      });

      expect(redact({ error }, false)).toEqual({
        error: {
          name: 'ApiError',
          message: 'Server error',
          code: 'server',
          status: 500,
        },
      });
      expect(redact({ error }, true)).toEqual({
        error: expect.objectContaining({ stack: expect.any(String) }),
      });
    });

    it('prints a redacted Error summary in production and the Error in development', () => {
      const error = new ApiError('Server error', {
        code: 'server',
        status: 500,
        data: { user: 'emily' },
      });

      createLogger(() => PRODUCTION).error('Request failed', error);
      expect(consoleSpies.error).toHaveBeenLastCalledWith('Request failed', {
        name: 'ApiError',
        message: 'Server error',
        code: 'server',
        status: 500,
      });

      createLogger(() => DEVELOPMENT).error('Request failed', error);
      expect(consoleSpies.error).toHaveBeenLastCalledWith(
        'Request failed',
        error
      );
    });

    it('handles circular and deeply nested values', () => {
      const circular: Record<string, unknown> = { name: 'loop' };
      circular.self = circular;
      const deep = { a: { b: { c: { d: { e: { f: 1 } } } } } };

      expect(redact(circular, false)).toEqual({
        name: 'loop',
        self: '[circular]',
      });
      expect(redact(deep, false)).toEqual({
        a: { b: { c: { d: { e: '[truncated]' } } } },
      });
    });

    it('redacts what the logger writes outside development', () => {
      createLogger(() => PRODUCTION).warn('Request failed', {
        config: { headers: { Authorization: 'Bearer abc' } },
        response: { status: 401, data: { message: 'expired' } },
      });

      expect(consoleSpies.warn).toHaveBeenCalledWith('Request failed', {
        config: { headers: { Authorization: '[redacted]' } },
        response: { status: 401, data: '[redacted]' },
      });
    });
  });
});
