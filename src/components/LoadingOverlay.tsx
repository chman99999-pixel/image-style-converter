import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  onCancel?: () => void;
}

const MESSAGES = [
  '이미지를 분석하고 있습니다...',
  '스타일을 적용하고 있습니다...',
  '멋진 이미지를 만들고 있습니다...',
  '거의 완성되었습니다...',
];

export function LoadingOverlay({ visible, onCancel }: LoadingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!visible) {
      setMessageIndex(0);
      setElapsed(0);
      return;
    }

    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 3000);

    const elapsedTimer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(messageTimer);
      clearInterval(elapsedTimer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#1A237E" />
        <Text style={styles.message}>{MESSAGES[messageIndex]}</Text>
        <Text style={styles.elapsed}>{elapsed}초 경과 (약 5~15초 소요)</Text>
        {onCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 32,
    width: '80%',
    maxWidth: 320,
  },
  message: {
    fontSize: 18,
    color: '#212121',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  elapsed: {
    fontSize: 15,
    color: '#9E9E9E',
    marginTop: 8,
  },
  cancelBtn: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelText: {
    fontSize: 16,
    color: '#616161',
  },
});
