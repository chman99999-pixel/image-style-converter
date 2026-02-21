import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { usePresetStore } from '../src/stores/presetStore';

export default function RootLayout() {
  const { loadPresets, loadApiKey, loadModelName } = usePresetStore();

  useEffect(() => {
    loadPresets();
    loadApiKey();
    loadModelName();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="transform"
        options={{
          headerShown: true,
          title: '이미지 변환',
          headerBackTitle: '뒤로',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="result"
        options={{
          headerShown: true,
          title: '변환 결과',
          headerBackTitle: '뒤로',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
