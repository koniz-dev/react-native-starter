/**
 * Todos Atoms
 * Jotai atoms for todos state management
 * Demonstrates array atoms, loading/error states, async atoms, and derived atoms
 */
import { atom } from 'jotai';
import { todosApi } from '@/services/api';
import type { Todo } from '@/types/api';

/**
 * Primitive atom: Todos array
 * Stores the list of todos
 */
export const todosAtom = atom<Todo[]>([]);

/**
 * Primitive atom: Loading state
 * Tracks whether a fetch operation is in progress
 */
export const todosLoadingAtom = atom<boolean>(false);

/**
 * Primitive atom: Error state
 * Stores error message if fetch fails
 */
export const todosErrorAtom = atom<string | null>(null);

/**
 * Async write atom: Fetch todos
 * Handles fetching todos from API and updates todosAtom, loadingAtom, and errorAtom
 * This demonstrates Jotai's async write atom pattern with multiple state updates
 */
export const fetchTodosAtom = atom(null, async (get, set) => {
  set(todosLoadingAtom, true);
  set(todosErrorAtom, null);

  try {
    const todos = await todosApi.getAll();
    set(todosAtom, todos);
    set(todosLoadingAtom, false);
    return todos;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch todos';
    set(todosErrorAtom, errorMessage);
    set(todosLoadingAtom, false);
    throw error;
  }
});

/**
 * Write atom: Add todo
 * Adds a new todo to the todos array
 * This demonstrates updating array atoms
 */
export const addTodoAtom = atom(null, (get, set, todo: Todo) => {
  const currentTodos = get(todosAtom);
  set(todosAtom, [...currentTodos, todo]);
});

/**
 * Write atom: Toggle todo completion
 * Updates a todo's completed status
 */
export const toggleTodoAtom = atom(null, (get, set, todoId: number) => {
  const currentTodos = get(todosAtom);
  set(
    todosAtom,
    currentTodos.map(todo =>
      todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
    )
  );
});

/**
 * Write atom: Remove todo
 * Removes a todo from the array
 */
export const removeTodoAtom = atom(null, (get, set, todoId: number) => {
  const currentTodos = get(todosAtom);
  set(
    todosAtom,
    currentTodos.filter(todo => todo.id !== todoId)
  );
});

/**
 * Derived atom: Filtered todos
 * Computed from todosAtom - automatically updates when todos change
 * This demonstrates Jotai's derived atom pattern
 */
export const filteredTodosAtom = atom(get => {
  const todos = get(todosAtom);
  // Example: filter completed todos
  return todos.filter(todo => !todo.completed);
});

/**
 * Derived atom: Completed todos count
 * Computed from todosAtom
 */
export const completedTodosCountAtom = atom(get => {
  const todos = get(todosAtom);
  return todos.filter(todo => todo.completed).length;
});

/**
 * Derived atom: Total todos count
 * Computed from todosAtom
 */
export const totalTodosCountAtom = atom(get => {
  const todos = get(todosAtom);
  return todos.length;
});
