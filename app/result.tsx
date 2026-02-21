import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ResultScreen() {
  const { originalUri, resultUri, presetTitle, presetId } =
    useLocalSearchParams<{
      originalUri: string;
      resultUri: string;
      presetTitle: string;
      presetId: string;
    }>();
  const router = useRouter();

  const [showOriginal, setShowOriginal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (Platform.OS === 'web') {
        // 웹: 다운로드 링크로 저장
        const link = document.createElement('a');
        link.href = resultUri;
        link.download = `${presetTitle}_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert('저장 완료', '이미지 다운로드가 시작되었습니다.');
      } else {
        const MediaLibrary = await import('expo-media-library');
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('권한 필요', '사진 저장을 위해 라이브러리 접근 권한이 필요합니다.');
          return;
        }
        await MediaLibrary.saveToLibraryAsync(resultUri);
        Alert.alert('저장 완료', '이미지가 갤러리에 저장되었습니다.');
      }
    } catch (error: any) {
      Alert.alert('저장 실패', error.message || '이미지 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetry = () => {
    router.back();
  };

  const handleNewStyle = () => {
    router.dismissAll();
  };

  const handlePrint = () => {
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(
          '<!DOCTYPE html><html><head><title>' + presetTitle + '</title>' +
          '<style>' +
          '@media print { body { margin: 0; padding: 0; } img { max-width: 100%; height: auto; } @page { margin: 10mm; } }' +
          'body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }' +
          'img { max-width: 100%; max-height: 90vh; object-fit: contain; }' +
          '</style></head><body>' +
          '<img src="' + resultUri + '" onload="window.print(); window.close();" />' +
          '</body></html>'
        );
        printWindow.document.close();
      }
    } else {
      Alert.alert('안내', '프린트 기능은 웹 브라우저에서만 지원됩니다.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.presetTitle}>{presetTitle}</Text>

        {/* Image Compare Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, !showOriginal && styles.toggleActive]}
            onPress={() => setShowOriginal(false)}
          >
            <Text
              style={[
                styles.toggleText,
                !showOriginal && styles.toggleTextActive,
              ]}
            >
              변환 결과
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, showOriginal && styles.toggleActive]}
            onPress={() => setShowOriginal(true)}
          >
            <Text
              style={[
                styles.toggleText,
                showOriginal && styles.toggleTextActive,
              ]}
            >
              원본 이미지
            </Text>
          </TouchableOpacity>
        </View>

        {/* Image Display */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: showOriginal ? originalUri : resultUri }}
            style={styles.resultImage}
            resizeMode="contain"
          />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveBtnText}>
            {isSaving ? '저장 중...' : '💾 저장하기'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.printBtn}
          onPress={handlePrint}
        >
          <Text style={styles.printBtnText}>🖨️ 프린트</Text>
        </TouchableOpacity>
        <View style={styles.secondaryRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleRetry}>
            <Text style={styles.secondaryBtnText}>🔄 다시 생성</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleNewStyle}
          >
            <Text style={styles.secondaryBtnText}>🎨 다른 스타일</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scroll: {
    padding: 16,
  },
  presetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#e8e8e8',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 16,
    color: '#9E9E9E',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#333',
    fontWeight: '600',
  },
  imageContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultImage: {
    width: '100%',
    aspectRatio: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveBtn: {
    height: 52,
    backgroundColor: '#1A237E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  printBtn: {
    height: 52,
    backgroundColor: '#FF6F00',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  printBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  secondaryBtnText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
});
