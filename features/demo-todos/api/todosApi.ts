/** Demo endpoint behind the Todos example (JSONPlaceholder). */
import { z } from 'zod';
import { api } from '@/shared/http/api';
import type { Todo } from '../types';

const TodosSchema = z.array(
  z.object({
    id: z.number(),
    userId: z.number(),
    title: z.string(),
    completed: z.boolean(),
  })
) satisfies z.ZodType<Todo[]>;

export const todosApi = {
  /**
   * Validated: an unexpected body (e.g. a captive portal's HTML page) rejects
   * instead of reaching the screen.
   */
  getAll: async (signal?: AbortSignal): Promise<Todo[]> => {
    const response = await api.get<unknown>('/todos', { signal });
    const parsed = TodosSchema.safeParse(response.data);
    if (!parsed.success) {
      throw new Error('Unexpected response from the server', {
        cause: parsed.error,
      });
    }
    return parsed.data;
  },
};
