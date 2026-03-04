import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StylePreset } from '../types';
import { imageToBase64, resizeImage } from '../utils/imageUtils';

interface PresetEditorProps {
  preset?: StylePreset | null;
  onSave: (data: {
    title: string;
    prompt: string;
    sampleImageUri: string;
    isActive: boolean;
  }) => void;
  onCancel: () => void;
}

export function PresetEditor({ preset, onSave, onCancel }: PresetEditorProps) {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [sampleImageUri, setSampleImageUri] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (preset) {
      setTitle(preset.title);
      setPrompt(preset.prompt);
      setSampleImageUri(preset.sampleImageUri);
      setIsActive(preset.isActive);
    }
  }, [preset]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      try {
        // 썸네일용이므로 300px로 리사이즈 후 base64 변환 (Redis 용량 절약)
        const resized = await resizeImage(uri, 300);
        if (Platform.OS === 'web') {
          // resizeImage가 이미 data URL을 반환 (웹)
          setSampleImageUri(resized);
        } else {
          setSampleImageUri(resized);
        }
      } catch {
        setSampleImageUri(uri);
      }
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('알림', '제목을 입력해주세요.');
      return;
    }
    if (!prompt.trim()) {
      Alert.alert('알림', '프롬프트를 입력해주세요.');
      return;
    }
    if (!sampleImageUri) {
      Alert.alert('알림', '샘플 이미지를 선택해주세요.');
      return;
    }
    onSave({ title: title.trim(), prompt: prompt.trim(), sampleImageUri, isActive });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>
          {preset ? '스타일 수정' : '새 스타일 추가'}
        </Text>

        <Text style={styles.label}>제목 *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="예: 팝아트, 컬러링, 웹툰"
        />

        <Text style={styles.label}>프롬프트 *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={prompt}
          onChangeText={setPrompt}
          placeholder="예: Transform this photo into a vibrant pop art style..."
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <Text style={styles.label}>샘플 이미지 *</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {sampleImageUri ? (
            <Image source={{ uri: sampleImageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>+</Text>
              <Text style={styles.placeholderText}>이미지 선택</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.switchRow}>
          <Text style={styles.label}>활성화</Text>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>저장</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 24,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  imagePicker: {
    width: 160,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 36,
    color: '#ccc',
  },
  placeholderText: {
    fontSize: 15,
    color: '#9E9E9E',
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 17,
    color: '#616161',
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#1A237E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 17,
    color: '#fff',
    fontWeight: '600',
  },
});
