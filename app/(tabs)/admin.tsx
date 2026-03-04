import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { usePresetStore } from '../../src/stores/presetStore';
import { StyleCard } from '../../src/components/StyleCard';
import { AdminPasscode } from '../../src/components/AdminPasscode';
import { PresetEditor } from '../../src/components/PresetEditor';
import { StylePreset } from '../../src/types';
import { presetApi } from '../../src/services/api';

export default function AdminScreen() {
  const {
    presets,
    apiKey,
    modelName,
    isAdminAuthenticated,
    verifyAdminPassword,
    setAdminAuthenticated,
    addPreset,
    updatePreset,
    deletePreset,
    reorderPresets,
    setApiKey,
    setModelName,
  } = usePresetStore();

  const AVAILABLE_MODELS = [
    { id: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image', tag: '' },
    { id: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image', tag: '(Preview)' },
    { id: 'gemini-3.1-flash-image-preview', label: 'Nano Banana 2', tag: '(Preview)' },
  ];

  const [showEditor, setShowEditor] = useState(false);
  const [editingPreset, setEditingPreset] = useState<StylePreset | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [showAccessCodeInput, setShowAccessCodeInput] = useState(false);
  const [currentAccessCode, setCurrentAccessCode] = useState('');
  const [tempAccessCode, setTempAccessCode] = useState('');
  const [loadingAccessCode, setLoadingAccessCode] = useState(false);
  const { width } = useWindowDimensions();

  if (!isAdminAuthenticated) {
    return (
      <AdminPasscode
        onVerify={verifyAdminPassword}
        onSuccess={() => setAdminAuthenticated(true)}
      />
    );
  }

  const sortedPresets = [...presets].sort((a, b) => a.order - b.order);

  // 반응형 그리드 계산
  const containerPadding = 16;
  const gap = 12;
  const contentWidth = Math.min(width, 960);
  const adminColumns = contentWidth > 600 ? 3 : contentWidth > 400 ? 2 : 1;
  const adminCardWidth = (contentWidth - containerPadding * 2 - gap * (adminColumns - 1)) / adminColumns;

  const handleAdd = () => {
    setEditingPreset(null);
    setShowEditor(true);
  };

  const handleEdit = (preset: StylePreset) => {
    setEditingPreset(preset);
    setShowEditor(true);
  };

  const handleDelete = (preset: StylePreset) => {
    if (Platform.OS === 'web') {
      // 웹에서는 window.confirm 사용 (Alert.alert 버튼 콜백이 웹에서 작동 안 함)
      const confirmed = window.confirm(`"${preset.title}" 스타일을 삭제하시겠습니까?`);
      if (confirmed) {
        deletePreset(preset.id);
      }
    } else {
      Alert.alert(
        '삭제 확인',
        `"${preset.title}" 스타일을 삭제하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: () => deletePreset(preset.id),
          },
        ]
      );
    }
  };

  const handleSave = async (data: {
    title: string;
    prompt: string;
    sampleImageUri: string;
    isActive: boolean;
  }) => {
    if (editingPreset) {
      await updatePreset(editingPreset.id, data);
    } else {
      await addPreset(data);
    }
    setShowEditor(false);
    setEditingPreset(null);
  };

  const handleSaveApiKey = () => {
    setApiKey(tempApiKey);
    setShowApiKeyInput(false);
    Alert.alert('저장 완료', 'API 키가 저장되었습니다.');
  };

  const handleOpenAccessCode = async () => {
    setLoadingAccessCode(true);
    try {
      const { adminPassword: pw } = usePresetStore.getState();
      const code = await presetApi.getAccessCode(pw);
      setCurrentAccessCode(code);
      setTempAccessCode(code);
      setShowAccessCodeInput(true);
    } catch (e) {
      Alert.alert('오류', '접근 코드를 불러오지 못했습니다.');
    } finally {
      setLoadingAccessCode(false);
    }
  };

  const handleSaveAccessCode = async () => {
    try {
      const { adminPassword: pw } = usePresetStore.getState();
      await presetApi.saveAccessCode(tempAccessCode, pw);
      setCurrentAccessCode(tempAccessCode);
      setShowAccessCodeInput(false);
      Alert.alert('저장 완료', '접근 코드가 변경되었습니다.');
    } catch (e) {
      Alert.alert('오류', '접근 코드 저장에 실패했습니다.');
    }
  };

  const handleMoveUp = (preset: StylePreset) => {
    const idx = sortedPresets.findIndex((p) => p.id === preset.id);
    if (idx <= 0) return;
    const newList = [...sortedPresets];
    [newList[idx - 1], newList[idx]] = [newList[idx], newList[idx - 1]];
    reorderPresets(newList);
  };

  const handleMoveDown = (preset: StylePreset) => {
    const idx = sortedPresets.findIndex((p) => p.id === preset.id);
    if (idx < 0 || idx >= sortedPresets.length - 1) return;
    const newList = [...sortedPresets];
    [newList[idx], newList[idx + 1]] = [newList[idx + 1], newList[idx]];
    reorderPresets(newList);
  };

  return (
    <View style={styles.container}>
      {/* API Key Section */}
      <View style={styles.apiSection}>
        <View style={styles.apiRow}>
          <Text style={styles.apiLabel}>API 키</Text>
          <TouchableOpacity onPress={() => {
            setTempApiKey(apiKey);
            setShowApiKeyInput(true);
          }}>
            <Text style={styles.apiAction}>
              {apiKey ? '변경' : '설정'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.apiStatus}>
          {apiKey ? `설정됨 (${apiKey.slice(0, 8)}...)` : '미설정 - API 키를 입력해주세요'}
        </Text>
      </View>

      {/* Access Code Section */}
      <View style={styles.apiSection}>
        <View style={styles.apiRow}>
          <Text style={styles.apiLabel}>접근 코드</Text>
          <TouchableOpacity onPress={handleOpenAccessCode} disabled={loadingAccessCode}>
            <Text style={styles.apiAction}>{loadingAccessCode ? '로딩...' : '변경'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.apiStatus}>
          {currentAccessCode ? `현재: ${currentAccessCode}` : '허브 → 앱 접근 제어용 코드'}
        </Text>
      </View>

      {/* Model Selection */}
      <View style={styles.apiSection}>
        <Text style={styles.apiLabel}>AI 모델 선택</Text>
        <View style={styles.modelRow}>
          {AVAILABLE_MODELS.map((model) => (
            <TouchableOpacity
              key={model.id}
              style={[
                styles.modelBtn,
                modelName === model.id && styles.modelBtnActive,
              ]}
              onPress={() => setModelName(model.id)}
            >
              <Text style={[
                styles.modelBtnText,
                modelName === model.id && styles.modelBtnTextActive,
              ]}>
                {model.label}{model.tag ? ` ${model.tag}` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Preset List */}
      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>
            스타일 프리셋 ({presets.length}개)
          </Text>
        </View>

        {sortedPresets.length === 0 ? (
          <View style={styles.emptyList}>
            <Text style={styles.emptyText}>
              등록된 스타일이 없습니다.{'\n'}아래 버튼을 눌러 추가해주세요.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {sortedPresets.map((item, index) => (
              <StyleCard
                key={item.id}
                preset={item}
                onPress={handleEdit}
                isAdmin
                onEdit={handleEdit}
                onDelete={handleDelete}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                isFirst={index === 0}
                isLast={index === sortedPresets.length - 1}
                cardWidth={adminCardWidth}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Text style={styles.addButtonText}>+ 새 스타일 추가</Text>
      </TouchableOpacity>

      {/* Preset Editor Modal */}
      <Modal visible={showEditor} animationType="slide">
        <PresetEditor
          preset={editingPreset}
          onSave={handleSave}
          onCancel={() => {
            setShowEditor(false);
            setEditingPreset(null);
          }}
        />
      </Modal>

      {/* API Key Input Modal */}
      <Modal visible={showApiKeyInput} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Google AI API 키</Text>
            <Text style={styles.modalDesc}>
              Google AI Studio에서 발급받은 API 키를 입력해주세요.
            </Text>
            <TextInput
              style={styles.apiInput}
              value={tempApiKey}
              onChangeText={setTempApiKey}
              placeholder="AIzaSy..."
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowApiKeyInput(false)}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveApiKey}
              >
                <Text style={styles.modalSaveText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Access Code Input Modal */}
      <Modal visible={showAccessCodeInput} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>접근 코드 변경</Text>
            <Text style={styles.modalDesc}>
              허브에서 앱으로 접속할 때 사용하는 코드입니다.{'\n'}
              변경 시 허브 환경변수와 기록지해방 Secrets도 함께 업데이트해주세요.
            </Text>
            <TextInput
              style={styles.apiInput}
              value={tempAccessCode}
              onChangeText={setTempAccessCode}
              placeholder="새 접근 코드"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAccessCodeInput(false)}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveAccessCode}
              >
                <Text style={styles.modalSaveText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  apiSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  apiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  apiLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#212121',
  },
  apiAction: {
    fontSize: 16,
    color: '#1A237E',
    fontWeight: '500',
  },
  apiStatus: {
    fontSize: 15,
    color: '#9E9E9E',
    marginTop: 4,
  },
  modelRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  modelBtnActive: {
    borderColor: '#1A237E',
    backgroundColor: '#E8EAF6',
  },
  modelBtnText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  modelBtnTextActive: {
    color: '#1A237E',
    fontWeight: '700',
  },
  list: {
    padding: 16,
    paddingBottom: 80,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  listHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A237E',
  },
  emptyList: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 24,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
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
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 15,
    color: '#616161',
    marginBottom: 16,
    lineHeight: 22,
  },
  apiInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#616161',
  },
  modalSaveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1A237E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
