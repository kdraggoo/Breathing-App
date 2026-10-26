import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.skyBottom } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="breathe" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'For grown-ups',
            headerTintColor: colors.ink,
          }}
        />
      </Stack>
    </>
  );
}
