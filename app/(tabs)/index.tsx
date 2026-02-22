import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePresetStore } from '../../src/stores/presetStore';
import { StyleCard } from '../../src/components/StyleCard';
import { StylePreset } from '../../src/types';

export default function HomeScreen() {
  const { presets, isLoading, loadPresets } = usePresetStore();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const activePresets = presets
    .filter((p) => p.isActive)
    .sort((a, b) => a.order - b.order);

  // 반응형 그리드: 3열 / 2열 / 1열
  // maxWidth 960 제한을 반영하여 실제 컨텐츠 영역 기준으로 계산
  const containerPadding = 20;
  const gap = 20;
  const contentWidth = Math.min(width, 960);
  const numColumns = contentWidth > 700 ? 3 : contentWidth > 450 ? 2 : 1;
  const cardWidth = (contentWidth - containerPadding * 2 - gap * (numColumns - 1)) / numColumns;

  const handleSelectStyle = (preset: StylePreset) => {
    router.push({
      pathname: '/transform',
      params: { presetId: preset.id },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadPresets} />
        }
      >
        {/* Hero 헤더 */}
        <View style={styles.hero}>
          <Text style={styles.appName}>그림공작소</Text>
          <Text style={styles.heroTitle}>
            상상하는 대로{' '}
            <Text style={styles.highlight}>뚝딱!</Text>
            {'\n'}우리 반 그림 제작소
          </Text>
          <Text style={styles.heroDesc}>
            원하는 대로 그려지는 그림공작소로{'\n'}
            나만의 미술 활동지를 만들어보세요.
          </Text>
        </View>

        {/* 스타일 섹션 */}
        <View style={styles.styleSection}>
          <Text style={styles.sectionTitle}>변환할 스타일을 선택하세요</Text>

          {activePresets.length === 0 && !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎨</Text>
              <Text style={styles.emptyTitle}>등록된 스타일이 없습니다</Text>
              <Text style={styles.emptyText}>
                관리자 탭에서 스타일을 추가해주세요
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {activePresets.map((preset) => (
                <StyleCard
                  key={preset.id}
                  preset={preset}
                  onPress={handleSelectStyle}
                  cardWidth={cardWidth}
                />
              ))}
            </View>
          )}
        </View>

        {/* 푸터 */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>개발자 천만석</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  // Hero 헤더
  hero: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 32,
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#212121',
    lineHeight: 44,
    marginBottom: 16,
  },
  highlight: {
    ...(Platform.OS === 'web' ? {
      backgroundImage: 'linear-gradient(transparent 60%, #FFD600 60%)',
      paddingHorizontal: 4,
    } as any : {
      backgroundColor: '#FFD600',
      paddingHorizontal: 4,
    }),
  },
  heroDesc: {
    fontSize: 18,
    color: '#616161',
    lineHeight: 28,
  },
  // 스타일 섹션
  styleSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  // 빈 상태
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  // 푸터
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 15,
    color: '#616161',
    fontWeight: '600',
    textAlign: 'right',
  },
});
