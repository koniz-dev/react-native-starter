/** Demo endpoint behind the Todos example (JSONPlaceholder). */
import { api } from '@/shared/http/api';
import type { Todo } from '../types';

export const todosApi = {
  getAll: async (signal?: AbortSignal): Promise<Todo[]> => {
    const response = await api.get<Todo[]>('/todos', { signal });
    return response.data;
  },
};
