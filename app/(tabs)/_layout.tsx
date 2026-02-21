import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1A237E',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarStyle: {
          borderTopColor: '#E0E0E0',
          height: 60,
          paddingBottom: 8,
          backgroundColor: '#fff',
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '스타일 변환',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>🎨</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: '관리자',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>⚙️</Text>
          ),
        }}
      />
    </Tabs>
  );
}
