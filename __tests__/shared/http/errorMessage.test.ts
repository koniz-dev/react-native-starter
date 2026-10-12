import { ApiError } from '@/shared/http/apiError';
import { errorMessage } from '@/shared/http/errorMessage';

describe('errorMessage', () => {
  it.each([
    ['network', 'No connection. Check your network and try again.'],
    ['timeout', 'The server took too long to answer. Please try again.'],
    ['server', 'The server had a problem. Please try again later.'],
    ['canceled', 'Something went wrong. Please try again.'],
    ['unknown', 'Something went wrong. Please try again.'],
  ] as const)('translates a %s error', (code, shown) => {
    expect(errorMessage(new ApiError('axios text', { code }))).toBe(shown);
  });

  it("keeps a 4xx's own server message, or falls back", () => {
    const withMessage = new ApiError('Request failed with status code 422', {
      code: 'client',
      status: 422,
      data: { error: { message: 'Title is required' } },
    });
    const without = new ApiError('Request failed with status code 404', {
      code: 'client',
      status: 404,
      data: '<html>Not Found</html>',
    });
    expect(errorMessage(withMessage)).toBe('Title is required');
    expect(errorMessage(without, 'login.error.generic')).toBe(
      'Login failed. Please try again.'
    );
  });

  it('never shows a non-request error', () => {
    expect(errorMessage(new Error('register an AuthAdapter'))).toBe(
      'Something went wrong. Please try again.'
    );
  });
});
