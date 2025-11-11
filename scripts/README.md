# Scripts

This directory contains utility scripts for the project.

## Quick Start

### reset-project.js

Resets the project by moving the current `app` directory to `app-example` and creating a fresh `app` directory with a basic `index.tsx` and `_layout.tsx`.

**Create `scripts/reset-project.js`:**

```javascript
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const appDir = path.join(projectRoot, 'app');
const appExampleDir = path.join(projectRoot, 'app-example');

// Check if app directory exists
if (!fs.existsSync(appDir)) {
  console.error('❌ app directory does not exist');
  process.exit(1);
}

// Move app to app-example if it doesn't exist
if (!fs.existsSync(appExampleDir)) {
  console.log('📦 Moving app directory to app-example...');
  fs.renameSync(appDir, appExampleDir);
  console.log('✅ Moved app to app-example');
} else {
  console.log('⚠️  app-example already exists, skipping move');
}

// Create new app directory
console.log('📁 Creating new app directory...');
fs.mkdirSync(appDir, { recursive: true });

// Create index.tsx
const indexContent = `import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>Start editing app/index.tsx to see changes</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
`;

fs.writeFileSync(path.join(appDir, 'index.tsx'), indexContent);
console.log('✅ Created app/index.tsx');

// Create _layout.tsx
const layoutContent = `import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack />;
}
`;

fs.writeFileSync(path.join(appDir, '_layout.tsx'), layoutContent);
console.log('✅ Created app/_layout.tsx');

console.log('\n✨ Project reset complete!');
console.log('📖 Your old app directory has been moved to app-example');
console.log('🚀 Start developing with: npm start\n');
```

**Add to `package.json`:**

```json
{
  "scripts": {
    "reset-project": "node scripts/reset-project.js"
  }
}
```

## Usage

```bash
npm run reset-project
```

### What it does

1. Moves the current `app` directory to `app-example` (if it doesn't already exist)
2. Creates a new `app` directory
3. Creates a basic `app/index.tsx` file
4. Creates a basic `app/_layout.tsx` file

This is useful when you want to start fresh but keep your previous work as a reference in `app-example`.

### Note

If `app-example` already exists, the script will skip moving the current `app` directory to avoid overwriting your previous work.
