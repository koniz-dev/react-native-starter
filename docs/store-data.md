# Store Data

Learn how to store data locally in your Expo and React Native app.

## Overview

There are several ways to store data locally in React Native apps, each suited for different use cases.

## AsyncStorage

`@react-native-async-storage/async-storage` is a simple, unencrypted key-value storage system.

### Installation

```bash
npx expo install @react-native-async-storage/async-storage
```

### Basic Usage

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store data
const storeData = async (value: string) => {
  try {
    await AsyncStorage.setItem('my-key', value);
  } catch (e) {
    // Error saving
  }
};

// Read data
const getData = async () => {
  try {
    const value = await AsyncStorage.getItem('my-key');
    if (value !== null) {
      return value;
    }
  } catch (e) {
    // Error reading
  }
};

// Remove data
const removeData = async () => {
  try {
    await AsyncStorage.removeItem('my-key');
  } catch (e) {
    // Error removing
  }
};
```

### Store Objects

AsyncStorage only stores strings, so you need to stringify objects:

```tsx
// Store object
const storeObject = async (value: object) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem('my-key', jsonValue);
  } catch (e) {
    // Error saving
  }
};

// Read object
const getObject = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('my-key');
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    // Error reading
  }
};
```

### Limitations

- **Size Limit**: ~6MB on Android, ~10MB on iOS
- **Not Encrypted**: Data is stored in plain text
- **Synchronous on Web**: May block the main thread on web

## SecureStore (Expo)

`expo-secure-store` provides secure storage for sensitive data like tokens and passwords.

### Installation

```bash
npx expo install expo-secure-store
```

### Basic Usage

```tsx
import * as SecureStore from 'expo-secure-store';

// Store data
const storeSecure = async (key: string, value: string) => {
  await SecureStore.setItemAsync(key, value);
};

// Read data
const getSecure = async (key: string) => {
  return await SecureStore.getItemAsync(key);
};

// Delete data
const deleteSecure = async (key: string) => {
  await SecureStore.deleteItemAsync(key);
};
```

### Features

- **Encrypted**: Data is encrypted on device
- **Secure**: Uses Keychain (iOS) and Keystore (Android)
- **Size Limit**: ~2KB per item
- **Best For**: Tokens, passwords, API keys

## SQLite

For complex data structures, use SQLite with `expo-sqlite`.

### Installation

```bash
npx expo install expo-sqlite
```

### Basic Usage

```tsx
import * as SQLite from 'expo-sqlite';

const db = await SQLite.openDatabaseAsync('mydb.db');

// Create table
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE
  );
`);

// Insert data
await db.runAsync(
  'INSERT INTO users (name, email) VALUES (?, ?)',
  ['John Doe', 'john@example.com']
);

// Query data
const result = await db.getAllAsync('SELECT * FROM users');
```

## MMKV (Recommended for Performance)

`react-native-mmkv` is a fast, efficient key-value storage library.

### Installation

```bash
npx expo install react-native-mmkv
```

### Basic Usage

```tsx
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

// Store data
storage.set('user.name', 'John Doe');
storage.set('user.age', 25);

// Read data
const name = storage.getString('user.name');
const age = storage.getNumber('user.age');

// Delete data
storage.delete('user.name');

// Check if key exists
const hasName = storage.contains('user.name');
```

### Features

- **Fast**: 30x faster than AsyncStorage
- **Synchronous**: No async/await needed
- **Type-Safe**: TypeScript support
- **Encrypted**: Optional encryption support

## Choosing the Right Storage

| Storage | Use Case | Size Limit | Encrypted |
|---------|----------|------------|-----------|
| AsyncStorage | Simple key-value data | ~6-10MB | No |
| SecureStore | Sensitive data (tokens, passwords) | ~2KB/item | Yes |
| SQLite | Complex relational data | Large | No |
| MMKV | High-performance key-value | Large | Optional |

## Best Practices

1. **Choose Wisely**: Select storage based on your needs
2. **Encrypt Sensitive Data**: Use SecureStore for tokens and passwords
3. **Handle Errors**: Always wrap storage operations in try-catch
4. **Clean Up**: Remove unused data to free up space
5. **Test on Devices**: Storage behavior may differ on various devices

## References

- [Expo: Store Data](https://docs.expo.dev/develop/user-interface/store-data/)
- [AsyncStorage Documentation](https://react-native-async-storage.github.io/async-storage/)
- [expo-secure-store Documentation](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [expo-sqlite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [react-native-mmkv Documentation](https://github.com/mrousavy/react-native-mmkv)

