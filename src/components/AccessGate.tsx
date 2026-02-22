import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

interface AccessGateProps {
  onVerify: (code: string) => Promise<boolean>;
  onSuccess: () => void;
}

export function AccessGate({ onVerify, onSuccess }: AccessGateProps) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setIsVerifying(true);
    try {
      const valid = await onVerify(code.trim());
      if (valid) {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem('access_granted', 'true');
        }
        onSuccess();
      } else {
        Alert.alert('접근 불가', '접근 코드가 올바르지 않습니다.');
        setCode('');
      }
    } catch (e) {
      Alert.alert('오류', '서버 연결에 실패했습니다.');
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>그림공작소</Text>
        <Text style={styles.subtitle}>구독자 전용 서비스입니다.{'\n'}접근 코드를 입력해주세요.</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="접근 코드"
          secureTextEntry
          autoFocus
          onSubmitEditing={handleSubmit}
        />
        <TouchableOpacity
          style={[styles.button, !code.trim() && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isVerifying || !code.trim()}
        >
          <Text style={styles.buttonText}>{isVerifying ? '확인 중...' : '입장하기'}</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>복지인 서류해방에 로그인하면 자동으로 입장됩니다.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 36,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  icon: {
    fontSize: 52,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#616161',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1.5,
    borderColor: '#C5CAE9',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    backgroundColor: '#fafafa',
    marginBottom: 14,
    textAlign: 'center',
    letterSpacing: 4,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#1A237E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#9FA8DA',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 18,
  },
});
