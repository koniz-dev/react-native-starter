import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { getTabBarColors } from '@/constants/Theme';
import { t } from '@/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Render errors in this group's screens show a themed fallback with
// "Try again" and "Go home" and are reported (components/ErrorBoundary.tsx).
export { RouteErrorBoundary as ErrorBoundary } from '@/components/ErrorBoundary';

export default function TabLayout() {
  const tabBar = getTabBarColors(useTheme());

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tabBar.active,
        tabBarInactiveTintColor: tabBar.inactive,
        tabBarStyle: {
          backgroundColor: tabBar.background,
          borderTopColor: tabBar.border,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tabs.explore'),
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="compass" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
