import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { usePresetStore } from '../src/stores/presetStore';
import { AccessGate } from '../src/components/AccessGate';

export default function RootLayout() {
  const {
    loadPresets,
    loadApiKey,
    loadModelName,
    isAccessGranted,
    verifyAccessCode,
    setAccessGranted,
  } = usePresetStore();

  useEffect(() => {
    loadPresets();
    loadApiKey();
    loadModelName();

    // 모바일 앱은 접근 코드 불필요 — 바로 통과
    if (Platform.OS !== 'web') {
      setAccessGranted(true);
      return;
    }

    // 1. URL ?ac= 파라미터 확인 (허브에서 넘어온 경우)
    const params = new URLSearchParams(window.location.search);
    const acParam = params.get('ac');
    if (acParam) {
      verifyAccessCode(acParam).then((valid) => {
        if (valid) {
          sessionStorage.setItem('access_granted', 'true');
          // URL에서 ?ac= 파라미터 제거 (노출 방지)
          const url = new URL(window.location.href);
          url.searchParams.delete('ac');
          window.history.replaceState({}, '', url.toString());
        }
      });
      return;
    }

    // 2. sessionStorage 캐시 확인 (같은 탭 내 새로고침)
    if (sessionStorage.getItem('access_granted') === 'true') {
      setAccessGranted(true);
    }
  }, []);

  // 웹에서 접근 코드 미인증 시 AccessGate 표시
  if (Platform.OS === 'web' && !isAccessGranted) {
    return (
      <AccessGate
        onVerify={verifyAccessCode}
        onSuccess={() => setAccessGranted(true)}
      />
    );
  }

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
