const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for import.meta
config.resolver.unstable_enablePackageExports = true;

// Add conditions for package.json "exports" field
config.resolver.unstable_conditionNames = [
  'react-native',
  'browser',
  'import',
  'require',
];

module.exports = config;
