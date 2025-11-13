import { logger, formatApiError, logApiError } from '@/utils/logger';

// Mock console methods
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

describe('logger utility', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterAll(() => {
    // Restore original console methods
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  describe('logger.warn', () => {
    test('logs warning message without context in development', () => {
      // Mock __DEV__ as true
      (global as { __DEV__?: boolean }).__DEV__ = true;

      logger.warn('Test warning');

      expect(console.warn).toHaveBeenCalledWith('⚠️ Test warning');
    });

    test('logs warning message with Error context', () => {
      (global as { __DEV__?: boolean }).__DEV__ = true;
      const error = new Error('Test error');

      logger.warn('Test warning', error);

      expect(console.warn).toHaveBeenCalledWith('⚠️ Test warning', error);
    });

    test('logs warning message with object context', () => {
      (global as { __DEV__?: boolean }).__DEV__ = true;
      const context = { userId: 123, action: 'login' };

      logger.warn('Test warning', context);

      expect(console.warn).toHaveBeenCalledWith('⚠️ Test warning', context);
    });

    test('does not log in production mode', () => {
      (global as { __DEV__?: boolean }).__DEV__ = false;

      logger.warn('Test warning');

      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('logger.error', () => {
    test('logs error message without context', () => {
      logger.error('Test error');

      expect(console.error).toHaveBeenCalledWith('❌ Test error');
    });

    test('logs error message with Error object and stack trace in development', () => {
      (global as { __DEV__?: boolean }).__DEV__ = true;
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      logger.error('Test error', error);

      expect(console.error).toHaveBeenCalledWith('❌ Test error', error);
      expect(console.error).toHaveBeenCalledWith('Stack trace:', error.stack);
    });

    test('logs error message with Error object but no stack trace in production', () => {
      (global as { __DEV__?: boolean }).__DEV__ = false;
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      logger.error('Test error', error);

      expect(console.error).toHaveBeenCalledWith('❌ Test error', error);
      expect(console.error).not.toHaveBeenCalledWith(
        'Stack trace:',
        expect.anything()
      );
    });

    test('logs error message with object context', () => {
      const context = { status: 500, message: 'Server error' };

      logger.error('Test error', context);

      expect(console.error).toHaveBeenCalledWith('❌ Test error', context);
    });

    test('logs error message with Error object without stack', () => {
      (global as { __DEV__?: boolean }).__DEV__ = true;
      const error = new Error('Test error');
      delete (error as { stack?: string }).stack;

      logger.error('Test error', error);

      expect(console.error).toHaveBeenCalledWith('❌ Test error', error);
      expect(console.error).not.toHaveBeenCalledWith(
        'Stack trace:',
        expect.anything()
      );
    });
  });

  describe('logger.info', () => {
    test('logs info message without context in development', () => {
      (global as { __DEV__?: boolean }).__DEV__ = true;

      logger.info('Test info');

      expect(console.log).toHaveBeenCalledWith('ℹ️ Test info');
    });

    test('logs info message with context in development', () => {
      (global as { __DEV__?: boolean }).__DEV__ = true;
      const context = { userId: 123 };

      logger.info('Test info', context);

      expect(console.log).toHaveBeenCalledWith('ℹ️ Test info', context);
    });

    test('does not log in production mode', () => {
      (global as { __DEV__?: boolean }).__DEV__ = false;

      logger.info('Test info');

      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('logger.debug', () => {
    test('logs debug message without context in development', () => {
      (global as { __DEV__?: boolean }).__DEV__ = true;

      logger.debug('Test debug');

      expect(console.log).toHaveBeenCalledWith('🐛 Test debug');
    });

    test('logs debug message with context in development', () => {
      (global as { __DEV__?: boolean }).__DEV__ = true;
      const context = { debug: true };

      logger.debug('Test debug', context);

      expect(console.log).toHaveBeenCalledWith('🐛 Test debug', context);
    });

    test('does not log in production mode', () => {
      (global as { __DEV__?: boolean }).__DEV__ = false;

      logger.debug('Test debug');

      expect(console.log).not.toHaveBeenCalled();
    });
  });
});

describe('formatApiError', () => {
  test('formats Error object', () => {
    const error = new Error('Network error');
    expect(formatApiError(error)).toBe('Network error');
  });

  test('formats API error object with message and status', () => {
    const error = { message: 'Not found', status: 404, data: null };
    expect(formatApiError(error)).toBe('[404] Not found');
  });

  test('formats API error object with message only', () => {
    const error = { message: 'Server error', data: null };
    expect(formatApiError(error)).toBe('Server error');
  });

  test('formats unknown error', () => {
    expect(formatApiError(null)).toBe('An unknown error occurred');
    expect(formatApiError(undefined)).toBe('An unknown error occurred');
    expect(formatApiError('string error')).toBe('An unknown error occurred');
  });

  test('formats API error object without message', () => {
    const error = { status: 500, data: { code: 'ERR_500' } };
    expect(formatApiError(error)).toBe('An unknown error occurred');
  });
});

describe('logApiError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  test('logs API error with Error object', () => {
    const error = new Error('Network error');
    logApiError('Failed to fetch', error);

    expect(console.error).toHaveBeenCalledWith(
      '❌ Failed to fetch: Network error',
      error
    );
  });

  test('logs API error with API error object', () => {
    const error = { message: 'Not found', status: 404 };
    logApiError('Failed to fetch', error);

    expect(console.error).toHaveBeenCalledWith(
      '❌ Failed to fetch: [404] Not found'
    );
  });

  test('logs API error with unknown error', () => {
    logApiError('Failed to fetch', null);

    expect(console.error).toHaveBeenCalledWith(
      '❌ Failed to fetch: An unknown error occurred'
    );
  });
});
