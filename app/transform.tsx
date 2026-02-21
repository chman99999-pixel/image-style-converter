import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { usePresetStore } from '../src/stores/presetStore';
import { LoadingOverlay } from '../src/components/LoadingOverlay';
import { transformImage } from '../src/services/nanoBananaApi';
import { resizeImage, base64ToTempFile } from '../src/utils/imageUtils';

const MAX_IMAGES = 5;

const ASPECT_RATIOS = [
  { label: '1:1', value: '1:1' },
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' },
];

export default function TransformScreen() {
  const { presetId } = useLocalSearchParams<{ presetId: string }>();
  const router = useRouter();
  const { presets, apiKey, modelName } = usePresetStore();

  const preset = presets.find((p) => p.id === presetId);

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [extraPrompt, setExtraPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!preset) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>스타일을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const takePhoto = async () => {
    if (selectedImages.length >= MAX_IMAGES) {
      Alert.alert('알림', `최대 ${MAX_IMAGES}개까지 추가할 수 있습니다.`);
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const pickImage = async () => {
    if (selectedImages.length >= MAX_IMAGES) {
      Alert.alert('알림', `최대 ${MAX_IMAGES}개까지 추가할 수 있습니다.`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTransform = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('알림', '먼저 이미지를 선택해주세요.');
      return;
    }
    if (!apiKey) {
      Alert.alert('API 키 필요', '관리자 탭에서 API 키를 설정해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      // 모든 이미지 리사이즈
      const resizedImages: string[] = [];
      for (const img of selectedImages) {
        const resized = await resizeImage(img, 1024);
        resizedImages.push(resized);
      }

      // 프롬프트 조합
      const finalPrompt = extraPrompt
        ? `${preset.prompt}\n\n추가 요청: ${extraPrompt}`
        : preset.prompt;

      const resultBase64 = await transformImage(
        apiKey,
        resizedImages,
        finalPrompt,
        modelName,
        aspectRatio,
      );

      const resultUri = await base64ToTempFile(resultBase64);

      router.push({
        pathname: '/result',
        params: {
          originalUri: selectedImages[0],
          resultUri: resultUri,
          presetTitle: preset.title,
          presetId: preset.id,
        },
      });
    } catch (error: any) {
      console.error('[Transform] Error:', error);
      const msg = error.message || '이미지 변환 중 오류가 발생했습니다.';
      setErrorMessage(msg);
      if (Platform.OS === 'web') {
        window.alert('변환 실패: ' + msg);
      } else {
        Alert.alert('변환 실패', msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Selected Style */}
        <View style={styles.styleInfo}>
          <Image
            source={{ uri: preset.sampleImageUri }}
            style={styles.sampleImage}
          />
          <View style={styles.styleText}>
            <Text style={styles.styleName}>{preset.title}</Text>
            <Text style={styles.styleDesc}>선택한 스타일</Text>
          </View>
        </View>

        {/* Image Input */}
        <Text style={styles.sectionTitle}>
          변환할 이미지 ({selectedImages.length}/{MAX_IMAGES})
        </Text>

        {/* 선택된 이미지 목록 */}
        {selectedImages.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageList}
            contentContainerStyle={styles.imageListContent}
          >
            {selectedImages.map((uri, index) => (
              <View key={index} style={styles.imageThumbWrap}>
                <Image source={{ uri }} style={styles.imageThumb} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.imageIndex}>{index + 1}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* 이미지 추가 버튼 */}
        {selectedImages.length < MAX_IMAGES && (
          <View style={styles.inputButtons}>
            <TouchableOpacity style={styles.inputBtn} onPress={takePhoto}>
              <Text style={styles.inputBtnIcon}>📷</Text>
              <Text style={styles.inputBtnText}>카메라</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.inputBtn} onPress={pickImage}>
              <Text style={styles.inputBtnIcon}>🖼️</Text>
              <Text style={styles.inputBtnText}>갤러리</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 비율 선택 */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>이미지 비율</Text>
        <View style={styles.ratioRow}>
          {ASPECT_RATIOS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[
                styles.ratioBtn,
                aspectRatio === r.value && styles.ratioBtnActive,
              ]}
              onPress={() => setAspectRatio(r.value)}
            >
              <Text style={[
                styles.ratioBtnText,
                aspectRatio === r.value && styles.ratioBtnTextActive,
              ]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 추가 프롬프트 */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>추가 요청사항 (선택)</Text>
        <TextInput
          style={styles.promptInput}
          value={extraPrompt}
          onChangeText={setExtraPrompt}
          placeholder="예: 배경을 우주로 바꿔줘, 색연필 느낌으로..."
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* 기본 프롬프트 미리보기 */}
        <View style={styles.promptPreview}>
          <Text style={styles.promptPreviewLabel}>기본 프롬프트:</Text>
          <Text style={styles.promptPreviewText} numberOfLines={3}>
            {preset.prompt}
          </Text>
        </View>

        {errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{errorMessage}</Text>
            <TouchableOpacity onPress={() => setErrorMessage(null)}>
              <Text style={styles.errorDismiss}>닫기</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Transform Button */}
      {selectedImages.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.transformBtn, isLoading && styles.transformBtnDisabled]}
            onPress={handleTransform}
            disabled={isLoading}
          >
            <Text style={styles.transformBtnText}>이미지 생성하기</Text>
          </TouchableOpacity>
        </View>
      )}

      <LoadingOverlay visible={isLoading} onCancel={handleCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scroll: {
    padding: 20,
    paddingBottom: 100,
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  styleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sampleImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  styleText: {
    marginLeft: 14,
    flex: 1,
  },
  styleName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  styleDesc: {
    fontSize: 15,
    color: '#9E9E9E',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 14,
  },
  // 이미지 목록 (가로 스크롤)
  imageList: {
    marginBottom: 12,
  },
  imageListContent: {
    gap: 10,
  },
  imageThumbWrap: {
    position: 'relative',
    width: 110,
    height: 110,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  imageIndex: {
    position: 'absolute',
    bottom: 4,
    left: 6,
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  // 이미지 추가 버튼
  inputButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  inputBtn: {
    flex: 1,
    height: 90,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e8e8e8',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputBtnIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  inputBtnText: {
    fontSize: 15,
    color: '#616161',
    fontWeight: '500',
  },
  // 비율 선택
  ratioRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  ratioBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  ratioBtnActive: {
    borderColor: '#1A237E',
    backgroundColor: '#E8EAF6',
  },
  ratioBtnText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  ratioBtnTextActive: {
    color: '#1A237E',
    fontWeight: '700',
  },
  // 프롬프트 입력
  promptInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    lineHeight: 24,
    color: '#212121',
  },
  promptPreview: {
    marginTop: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
  },
  promptPreviewLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
    marginBottom: 4,
  },
  promptPreviewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Footer
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  transformBtn: {
    height: 52,
    backgroundColor: '#1A237E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A237E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  transformBtnDisabled: {
    opacity: 0.6,
  },
  transformBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorBoxText: {
    color: '#DC2626',
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  errorDismiss: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 10,
  },
});
