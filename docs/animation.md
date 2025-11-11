# Animation

Learn how to add animations to your Expo and React Native app.

## Overview

Animations can enhance user experience by providing visual feedback, guiding user attention, and making interactions feel smooth and natural.

## React Native Animated API

React Native provides a powerful `Animated` API for creating smooth animations.

### Basic Example

```tsx
import { Animated, View, Button } from 'react-native';
import { useRef } from 'react';

export default function App() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: fadeAnim }],
        }}
      >
        <View style={{ width: 100, height: 100, backgroundColor: 'blue' }} />
      </Animated.View>
      <Button title="Fade In" onPress={fadeIn} />
      <Button title="Fade Out" onPress={fadeOut} />
    </View>
  );
}
```

### Animation Types

1. **Timing**: Animate a value over time
2. **Spring**: Create spring physics animations
3. **Decay**: Create deceleration animations

### Native Driver

Always use `useNativeDriver: true` when possible for better performance:

```tsx
Animated.timing(animValue, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // Runs on UI thread
}).start();
```

## Reanimated (Recommended)

`react-native-reanimated` provides a more powerful and performant animation library.

### Installation

```bash
npx expo install react-native-reanimated
```

### Basic Example

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { View, Button } from 'react-native';

export default function App() {
  const width = useSharedValue(100);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: width.value,
    };
  });

  const handlePress = () => {
    width.value = withSpring(width.value + 50);
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          { width: 100, height: 100, backgroundColor: 'blue' },
          animatedStyle,
        ]}
      />
      <Button title="Animate" onPress={handlePress} />
    </View>
  );
}
```

### Worklets

Reanimated uses worklets to run animations on the UI thread:

```tsx
const animatedStyle = useAnimatedStyle(() => {
  'worklet'; // Runs on UI thread
  return {
    transform: [{ translateX: translateX.value }],
  };
});
```

## Layout Animations

Reanimated 2.3+ supports layout animations:

```tsx
import Animated, { Layout } from 'react-native-reanimated';

<Animated.View layout={Layout.springify()}>
  {/* Your content */}
</Animated.View>
```

## Gesture Handler

Combine animations with gestures using `react-native-gesture-handler`:

### Installation

```bash
npx expo install react-native-gesture-handler
```

### Example

```tsx
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export default function App() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ width: 100, height: 100, backgroundColor: 'blue' }, animatedStyle]} />
    </GestureDetector>
  );
}
```

## Best Practices

1. **Use Native Driver**: Always use `useNativeDriver: true` when possible
2. **Prefer Reanimated**: Use `react-native-reanimated` for complex animations
3. **Optimize Performance**: Avoid animating layout properties when possible
4. **Test on Devices**: Animations may behave differently on various devices
5. **Consider Accessibility**: Ensure animations don't interfere with accessibility features

## References

- [Expo: Animation](https://docs.expo.dev/develop/user-interface/animation/)
- [React Native: Animated API](https://reactnative.dev/docs/animated)
- [react-native-reanimated Documentation](https://docs.swmansion.com/react-native-reanimated/)
- [react-native-gesture-handler Documentation](https://docs.swmansion.com/react-native-gesture-handler/)

