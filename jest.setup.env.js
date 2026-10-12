// Runs before each test file, so the app's config is valid in every test.
// No request leaves the test run: tests mock fetch. The API and the auth
// backend are on different origins, as they often are in production. Tests
// that check validation call parseEnv() directly with their own values.
process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';
process.env.EXPO_PUBLIC_AUTH_API_URL = 'https://auth.example.com';
