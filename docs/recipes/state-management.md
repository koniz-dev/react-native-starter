# Recipe: State Management

The starter does not pick a store library. Server data is loaded per screen
(`useFetch`, or a data library such as TanStack Query), and the one piece of
app-wide state, the session, lives in `SessionProvider`
(`shared/session/SessionProvider.tsx`). When you need shared client state
(a cart, filters, drafts, preferences), add one of the options below.

The rules are the same for all four:

- **The session stays in `SessionProvider`.** Read it with `useSession()`;
  don't copy the user or token into a store. The token never leaves the token
  store (Keychain / Keystore, memory on web).
- **Clear user data on sign-out.** Mount a small component inside
  `SessionProvider` that resets the store when the session becomes
  `signedOut` (sign-out or an expired session).
- **Persist only non-secret data**, with `shared/storage/storage.ts`.

Each recipe builds the same example: a set of favorite item IDs that is
cleared on sign-out. The code compiles against this repo with the library
installed (`npm run docs:check`; CI installs the libraries to check it).

Where the pieces go:

```
features/favorites/
  store.ts                 the store (one of the recipes below)
  ResetFavoritesOnSignOut.tsx
app/_layout.tsx            <SessionProvider> <ResetFavoritesOnSignOut /> <RootNavigator /> </SessionProvider>
```

## Zustand

A small store without providers; a good default.

```bash
npx expo install zustand
```

<!-- docs-check: requires zustand -->

```tsx
// features/favorites/store.ts
import { useEffect } from 'react';
import { create } from 'zustand';
import { useSession } from '@/shared/session/SessionProvider';

interface FavoritesState {
  ids: number[];
  toggle(id: number): void;
  reset(): void;
}

export const useFavorites = create<FavoritesState>()(set => ({
  ids: [],
  toggle: id =>
    set(state => ({
      ids: state.ids.includes(id)
        ? state.ids.filter(other => other !== id)
        : [...state.ids, id],
    })),
  reset: () => set({ ids: [] }),
}));

// Mounted inside <SessionProvider> in app/_layout.tsx.
export function ResetFavoritesOnSignOut() {
  const { session } = useSession();
  const reset = useFavorites(state => state.reset);
  useEffect(() => {
    if (session.status === 'signedOut') reset();
  }, [session.status, reset]);
  return null;
}

// In a screen: select only what the component needs.
export function useIsFavorite(id: number): boolean {
  return useFavorites(state => state.ids.includes(id));
}
```

To persist it, wrap the store with Zustand's `persist` middleware and a
storage adapter over AsyncStorage
([Zustand: persisting state](https://zustand.docs.pmnd.rs/integrations/persisting-store-data)).

## Redux Toolkit

For larger apps that want one store, devtools, and middleware.

```bash
npx expo install @reduxjs/toolkit react-redux
```

<!-- docs-check: requires @reduxjs/toolkit react-redux -->

```tsx
// features/favorites/store.ts
import { useEffect, type ReactNode } from 'react';
import {
  configureStore,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { useSession } from '@/shared/session/SessionProvider';

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: { ids: [] as number[] },
  reducers: {
    toggle(state, action: PayloadAction<number>) {
      const index = state.ids.indexOf(action.payload);
      if (index >= 0) state.ids.splice(index, 1);
      else state.ids.push(action.payload);
    },
    reset(state) {
      state.ids = [];
    },
  },
});

export const { toggle, reset } = favoritesSlice.actions;

export const store = configureStore({
  reducer: { favorites: favoritesSlice.reducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

// In app/_layout.tsx, inside <SessionProvider>:
export function StoreProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ResetFavoritesOnSignOut />
      {children}
    </Provider>
  );
}

function ResetFavoritesOnSignOut() {
  const { session } = useSession();
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (session.status === 'signedOut') dispatch(reset());
  }, [session.status, dispatch]);
  return null;
}

export function useIsFavorite(id: number): boolean {
  return useAppSelector(state => state.favorites.ids.includes(id));
}
```

For server data, RTK Query plugs into the same store; build its
`baseQuery` on the shared `api` client so requests keep the token rules and
`ApiError`s ([API and Storage](../api-and-storage.md)).

## Jotai

Atoms for fine-grained state shared between a few components.

```bash
npx expo install jotai
```

<!-- docs-check: requires jotai -->

```tsx
// features/favorites/store.ts
import { useEffect } from 'react';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { useSession } from '@/shared/session/SessionProvider';

export const favoriteIdsAtom = atom<number[]>([]);

export const toggleFavoriteAtom = atom(null, (get, set, id: number) => {
  const ids = get(favoriteIdsAtom);
  set(
    favoriteIdsAtom,
    ids.includes(id) ? ids.filter(other => other !== id) : [...ids, id]
  );
});

// Mounted inside <SessionProvider> in app/_layout.tsx.
export function ResetFavoritesOnSignOut() {
  const { session } = useSession();
  const setIds = useSetAtom(favoriteIdsAtom);
  useEffect(() => {
    if (session.status === 'signedOut') setIds([]);
  }, [session.status, setIds]);
  return null;
}

export function useIsFavorite(id: number): boolean {
  return useAtomValue(favoriteIdsAtom).includes(id);
}
```

Without a `<Provider>`, atoms live in Jotai's default store for the whole
app, which is what you want here.

## React Context

No dependency; fine for a small amount of state that changes rarely. Every
consumer re-renders on every change, so split contexts as state grows.

```tsx
// features/favorites/FavoritesProvider.tsx
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react';
import { useSession } from '@/shared/session/SessionProvider';

type Action = { type: 'toggle'; id: number } | { type: 'reset' };

function reducer(ids: number[], action: Action): number[] {
  switch (action.type) {
    case 'toggle':
      return ids.includes(action.id)
        ? ids.filter(other => other !== action.id)
        : [...ids, action.id];
    case 'reset':
      return [];
  }
}

const FavoritesContext = createContext<{
  ids: number[];
  toggle(id: number): void;
} | null>(null);

// In app/_layout.tsx, inside <SessionProvider>.
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, dispatch] = useReducer(reducer, []);
  const { session } = useSession();

  useEffect(() => {
    if (session.status === 'signedOut') dispatch({ type: 'reset' });
  }, [session.status]);

  return (
    <FavoritesContext.Provider
      value={{ ids, toggle: id => dispatch({ type: 'toggle', id }) }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const value = useContext(FavoritesContext);
  if (!value)
    throw new Error('useFavorites must be used inside <FavoritesProvider>');
  return value;
}
```

## Testing a store

Render with `renderWithProviders(<Screen />, { withSession: true })` from
`@/testing`, and reset module-level stores (Zustand, Jotai's default store,
Redux) between tests, for example with `useFavorites.setState({ ids: [] })`
in `beforeEach`. See [Testing](../testing.md).

Jotai 3 and Redux Toolkit (through Immer) ship ES modules, which Jest doesn't
transform by default: add `jotai`, or `immer|@reduxjs/toolkit|react-redux|reselect|redux|redux-thunk`,
to the `transformIgnorePatterns` allowlist in `package.json`.

## The old branches

Earlier versions of the starter had `state-management/*` branches with a
Redux, Context, Zustand, and Jotai variant of the whole app. They predate
Expo SDK 57, store the token in AsyncStorage, and no longer merge with
`main`, so they were retired. Their last commits are kept as the tags
`archive/state-management-redux`, `archive/state-management-react-context`,
`archive/state-management-zustand`, and `archive/state-management-jotai`;
use the recipes above instead.
