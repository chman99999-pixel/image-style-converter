import { StylePreset } from '../types';

const API_BASE = '/api';

export const presetApi = {
  async getPresets(): Promise<StylePreset[]> {
    const res = await fetch(`${API_BASE}/presets`);
    if (!res.ok) throw new Error('프리셋 불러오기 실패');
    return res.json();
  },

  async savePresets(presets: StylePreset[], adminPassword: string): Promise<void> {
    const res = await fetch(`${API_BASE}/presets`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': adminPassword,
      },
      body: JSON.stringify(presets),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || '프리셋 저장 실패');
    }
  },

  async verifyPassword(password: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/config?action=verify`, {
      headers: { 'X-Admin-Password': password },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.valid;
  },

  async getApiKey(): Promise<string> {
    const res = await fetch(`${API_BASE}/config?action=apikey`);
    if (!res.ok) return '';
    const data = await res.json();
    return data.apiKey || '';
  },

  async getModelName(): Promise<string> {
    const res = await fetch(`${API_BASE}/config?action=model`);
    if (!res.ok) return 'gemini-2.5-flash-image';
    const data = await res.json();
    return data.modelName || 'gemini-2.5-flash-image';
  },

  async saveConfig(
    config: { apiKey?: string; adminPassword?: string; modelName?: string },
    adminPassword: string
  ): Promise<void> {
    const res = await fetch(`${API_BASE}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': adminPassword,
      },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || '설정 저장 실패');
    }
  },
};
