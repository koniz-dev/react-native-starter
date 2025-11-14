/**
 * Typed Redux Hooks
 *
 * These hooks provide type-safe access to Redux store and dispatch.
 * Use these instead of the plain useDispatch and useSelector from react-redux.
 *
 * @example
 * ```tsx
 * import { useAppDispatch, useAppSelector } from '@/store/hooks';
 *
 * function MyComponent() {
 *   const dispatch = useAppDispatch();
 *   const user = useAppSelector(state => state.auth.user);
 *
 *   return <Text>{user?.name}</Text>;
 * }
 * ```
 */
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

/**
 * Typed dispatch hook
 *
 * Use this instead of useDispatch() for type-safe action dispatching.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed selector hook
 *
 * Use this instead of useSelector() for type-safe state selection.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
