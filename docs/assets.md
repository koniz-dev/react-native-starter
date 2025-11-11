# Assets

Learn how to manage images, fonts, and other static assets in your Expo project.

## Overview

Assets are static files like images, fonts, videos, and other media that your app uses. Expo provides built-in support for managing these assets.

## Project Structure

By convention, assets are stored in the `assets/` directory:

```
assets/
├── images/
│   ├── icon.png
│   ├── splash-icon.png
│   └── logo.png
├── fonts/
│   ├── Inter-Regular.ttf
│   └── Inter-Bold.ttf
└── ...
```

## Images

### Using Images

Import images directly in your code:

```tsx
import { Image } from 'react-native';

export default function App() {
  return (
    <Image
      source={require('./assets/images/logo.png')}
      style={{ width: 100, height: 100 }}
    />
  );
}
```

### Remote Images

You can also load images from URLs:

```tsx
<Image
  source={{ uri: 'https://example.com/image.png' }}
  style={{ width: 100, height: 100 }}
/>
```

### Image Formats

Expo supports:

- **PNG** - Best for images with transparency
- **JPEG** - Best for photos
- **WebP** - Modern format with good compression
- **SVG** - Vector graphics (requires `react-native-svg`)

### Image Optimization

1. **Use Appropriate Formats**: PNG for transparency, JPEG for photos
2. **Optimize File Size**: Compress images before adding to project
3. **Provide Multiple Sizes**: Use `@2x` and `@3x` variants for retina displays
4. **Lazy Load**: Load images only when needed

### Responsive Images

For different screen densities:

```
assets/
├── images/
│   ├── logo.png        # 1x
│   ├── logo@2x.png     # 2x
│   └── logo@3x.png     # 3x
```

React Native automatically selects the appropriate image based on device density.

## Fonts

See [Fonts Guide](fonts.md) for detailed information about adding custom fonts.

## Videos

### Installation

```bash
npx expo install expo-av
```

### Basic Usage

```tsx
import { Video } from 'expo-av';
import { useRef } from 'react';

export default function App() {
  const videoRef = useRef<Video>(null);

  return (
    <Video
      ref={videoRef}
      source={require('./assets/videos/intro.mp4')}
      style={{ width: 300, height: 200 }}
      useNativeControls
      resizeMode="contain"
    />
  );
}
```

## Audio

### Installation

```bash
npx expo install expo-av
```

### Basic Usage

```tsx
import { Audio } from 'expo-av';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    const playSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/audio/notification.mp3')
      );
      await sound.playAsync();
    };

    playSound();
  }, []);

  return null;
}
```

## Asset Loading

### Preload Assets

Preload assets for better performance:

```tsx
import { Asset } from 'expo-asset';

const loadAssets = async () => {
  const images = [
    require('./assets/images/logo.png'),
    require('./assets/images/icon.png'),
  ];

  await Asset.loadAsync(images);
};
```

### Check Asset Status

```tsx
import { Asset } from 'expo-asset';

const asset = Asset.fromModule(require('./assets/images/logo.png'));
const status = await asset.downloadAsync();
```

## App Icons and Splash Screens

See [Splash Screen and App Icon Guide](splash-screen-and-app-icon.md) for detailed information.

## Best Practices

1. **Organize by Type**: Group assets by type (images, fonts, videos)
2. **Optimize File Sizes**: Compress images and videos before adding
3. **Use Appropriate Formats**: Choose formats based on use case
4. **Provide Multiple Resolutions**: Include @2x and @3x variants
5. **Lazy Load Large Assets**: Load heavy assets only when needed
6. **Cache Remote Assets**: Cache remote images for offline access

## References

- [Expo: Assets](https://docs.expo.dev/develop/user-interface/assets/)
- [React Native: Images](https://reactnative.dev/docs/images)
- [expo-asset Documentation](https://docs.expo.dev/versions/latest/sdk/asset/)
- [expo-av Documentation](https://docs.expo.dev/versions/latest/sdk/av/)
