// Runs before each test file. Tests use the public demo backends, as a fresh
// checkout does after `cp .env.example .env`. Tests that check validation
// call parseEnv() directly instead of relying on these values.
process.env.EXPO_PUBLIC_USE_DEMO_BACKENDS = 'true';
