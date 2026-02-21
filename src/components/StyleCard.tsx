import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { StylePreset } from '../types';

interface StyleCardProps {
  preset: StylePreset;
  onPress: (preset: StylePreset) => void;
  cardWidth?: number;
  isAdmin?: boolean;
  onEdit?: (preset: StylePreset) => void;
  onDelete?: (preset: StylePreset) => void;
  onMoveUp?: (preset: StylePreset) => void;
  onMoveDown?: (preset: StylePreset) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function StyleCard({
  preset,
  onPress,
  cardWidth,
  isAdmin,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: StyleCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const webHoverProps = Platform.OS === 'web' ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  } as any : {};

  // Admin 모드에서는 카드 전체 클릭이 아닌, 개별 버튼으로만 동작
  if (isAdmin) {
    return (
      <View
        style={[
          styles.card,
          cardWidth ? { width: cardWidth } : undefined,
        ]}
      >
        <TouchableOpacity activeOpacity={0.7} onPress={() => onPress(preset)}>
          <Image
            source={{ uri: preset.sampleImageUri }}
            style={[
              styles.image,
              cardWidth ? { height: cardWidth } : undefined,
            ]}
          />
        </TouchableOpacity>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {preset.title}
          </Text>
          {!preset.isActive && (
            <Text style={styles.inactive}>비활성</Text>
          )}
        </View>
        {/* 순서 변경 버튼 */}
        <View style={styles.reorderRow}>
          <TouchableOpacity
            style={[styles.reorderBtn, isFirst && styles.reorderBtnDisabled]}
            onPress={() => onMoveUp?.(preset)}
            disabled={isFirst}
          >
            <Text style={[styles.reorderBtnText, isFirst && styles.reorderBtnTextDisabled]}>▲ 위로</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reorderBtn, isLast && styles.reorderBtnDisabled]}
            onPress={() => onMoveDown?.(preset)}
            disabled={isLast}
          >
            <Text style={[styles.reorderBtnText, isLast && styles.reorderBtnTextDisabled]}>▼ 아래로</Text>
          </TouchableOpacity>
        </View>
        {/* 수정/삭제 버튼 */}
        <View style={styles.adminActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => onEdit?.(preset)}
          >
            <Text style={styles.editBtnText}>✏️ 수정</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete?.(preset)}
          >
            <Text style={styles.deleteBtnText}>🗑️ 삭제</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 일반 모드 (홈 화면)
  return (
    <TouchableOpacity
      style={[
        styles.card,
        cardWidth ? { width: cardWidth } : undefined,
        isHovered && styles.cardHovered,
      ]}
      onPress={() => onPress(preset)}
      activeOpacity={0.7}
      {...webHoverProps}
    >
      <View style={[
        styles.imageWrapper,
        isHovered && styles.imageWrapperHovered,
      ]}>
        <Image
          source={{ uri: preset.sampleImageUri }}
          style={[
            styles.image,
            cardWidth ? { height: cardWidth } : undefined,
          ]}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {preset.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    ...(Platform.OS === 'web' ? {
      transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
      cursor: 'pointer',
    } as any : {}),
  },
  cardHovered: {
    borderColor: '#FFD600',
    ...(Platform.OS === 'web' ? {
      transform: [{ translateY: -6 }],
      shadowOpacity: 0.15,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
    } as any : {}),
  },
  imageWrapper: {
    overflow: 'hidden',
  },
  imageWrapperHovered: {
    ...(Platform.OS === 'web' ? {
      transform: [{ scale: 1.03 }],
      transition: 'transform 0.25s ease',
    } as any : {}),
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#E0E0E0',
  },
  info: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    color: '#212121',
    flex: 1,
  },
  inactive: {
    fontSize: 13,
    color: '#9E9E9E',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 6,
  },
  // 순서 변경 버튼
  reorderRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  reorderBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  reorderBtnDisabled: {
    opacity: 0.3,
  },
  reorderBtnText: {
    fontSize: 13,
    color: '#1A237E',
    fontWeight: '500',
  },
  reorderBtnTextDisabled: {
    color: '#999',
  },
  // 관리자 액션 버튼
  adminActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  editBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  editBtnText: {
    fontSize: 15,
    color: '#1A237E',
    fontWeight: '500',
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 15,
    color: '#E74C3C',
    fontWeight: '500',
  },
});
