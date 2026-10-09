/** Demo endpoint behind the Todos example (JSONPlaceholder). */
import { api } from '@/shared/http/api';
import type { Todo } from '../types';

export const todosApi = {
  getAll: async (): Promise<Todo[]> => {
    const response = await api.get<Todo[]>('/todos');
    return response.data;
  },
};
