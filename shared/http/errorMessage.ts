import { t, type TranslationKey } from '@/shared/i18n';
import { serverMessage, toApiError } from './apiError';

/**
 * The message to show the user for a failed request or action, in the app's
 * language. A 4xx keeps the server's own message (such as "Invalid
 * credentials"), which a backend writes for users; anything else maps the
 * error's code to a translated string, so developer text (axios messages, a
 * missing AuthAdapter) never reaches the screen. Log the error for details.
 */
export function errorMessage(
  error: unknown,
  fallback: TranslationKey = 'common.unknownError'
): string {
  const apiError = toApiError(error);
  switch (apiError.code) {
    case 'network':
      return t('errors.network');
    case 'timeout':
      return t('errors.timeout');
    case 'server':
      return t('errors.server');
    case 'client':
    case 'unauthorized':
      return serverMessage(apiError.data) ?? t(fallback);
    default:
      return t(fallback);
  }
}
