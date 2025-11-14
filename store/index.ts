/**
 * Redux Store Configuration
 *
 * This file configures the Redux store using Redux Toolkit.
 * It exports the store instance and TypeScript types for type-safe usage.
 */
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import todosReducer from './slices/todosSlice';

/**
 * Configure the Redux store with all reducers
 *
 * Redux Toolkit's configureStore includes:
 * - Redux DevTools extension support
 * - Default middleware (thunk, immutability checks, serializability checks)
 * - Development mode checks
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    todos: todosReducer,
  },
  // Middleware is configured automatically by Redux Toolkit
  // You can customize it here if needed:
  // middleware: (getDefaultMiddleware) =>
  //   getDefaultMiddleware({
  //     serializableCheck: {
  //       ignoredActions: ['persist/PERSIST'],
  //     },
  //   }),
});

/**
 * RootState type
 *
 * Infer the RootState type from the store itself.
 * This provides type safety when using selectors.
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * AppDispatch type
 *
 * Infer the AppDispatch type from the store.
 * This provides type safety when dispatching actions.
 */
export type AppDispatch = typeof store.dispatch;
