/**
 * Atoms Index
 * Central export point for all Jotai atoms
 * Grouped by feature for better organization
 */

// Auth atoms
export {
  userAtom,
  tokenAtom,
  isAuthenticatedAtom,
  loginAtom,
  logoutAtom,
} from './authAtoms';

// Todos atoms
export {
  todosAtom,
  todosLoadingAtom,
  todosErrorAtom,
  fetchTodosAtom,
  addTodoAtom,
  toggleTodoAtom,
  removeTodoAtom,
  filteredTodosAtom,
  completedTodosCountAtom,
  totalTodosCountAtom,
} from './todosAtoms';
