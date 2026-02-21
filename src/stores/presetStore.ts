import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { StylePreset } from '../types';
import { presetApi } from '../services/api';

interface PresetStore {
  presets: StylePreset[];
  apiKey: string;
  modelName: string;
  adminPassword: string; // 메모리에 보관 (인증 후 세션 유지용)
  isAdminAuthenticated: boolean;
  isLoading: boolean;

  loadPresets: () => Promise<void>;
  addPreset: (preset: Omit<StylePreset, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePreset: (id: string, updates: Partial<StylePreset>) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  reorderPresets: (presets: StylePreset[]) => Promise<void>;

  loadApiKey: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  loadModelName: () => Promise<void>;
  setModelName: (name: string) => Promise<void>;

  verifyAdminPassword: (password: string) => Promise<boolean>;
  setAdminPassword: (password: string) => Promise<void>;
  setAdminAuthenticated: (value: boolean) => void;
}

export const usePresetStore = create<PresetStore>((set, get) => ({
  presets: [],
  apiKey: '',
  modelName: 'gemini-2.5-flash-image',
  adminPassword: '',
  isAdminAuthenticated: false,
  isLoading: false,

  loadPresets: async () => {
    set({ isLoading: true });
    try {
      const presets = await presetApi.getPresets();
      set({ presets });
    } catch (e) {
      console.error('Failed to load presets:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addPreset: async (presetData) => {
    const { presets, adminPassword } = get();
    const newPreset: StylePreset = {
      ...presetData,
      id: Crypto.randomUUID(),
      order: presets.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...presets, newPreset];
    set({ presets: updated });
    try {
      await presetApi.savePresets(updated, adminPassword);
    } catch (e) {
      console.error('Failed to save presets:', e);
      set({ presets }); // 롤백
    }
  },

  updatePreset: async (id, updates) => {
    const { presets, adminPassword } = get();
    const updated = presets.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    set({ presets: updated });
    try {
      await presetApi.savePresets(updated, adminPassword);
    } catch (e) {
      console.error('Failed to save presets:', e);
      set({ presets }); // 롤백
    }
  },

  deletePreset: async (id) => {
    const { presets, adminPassword } = get();
    const updated = presets
      .filter((p) => p.id !== id)
      .map((p, i) => ({ ...p, order: i }));
    set({ presets: updated });
    try {
      await presetApi.savePresets(updated, adminPassword);
    } catch (e) {
      console.error('Failed to save presets:', e);
      set({ presets }); // 롤백
    }
  },

  reorderPresets: async (reordered) => {
    const { presets, adminPassword } = get();
    const updated = reordered.map((p, i) => ({ ...p, order: i }));
    set({ presets: updated });
    try {
      await presetApi.savePresets(updated, adminPassword);
    } catch (e) {
      console.error('Failed to save presets:', e);
      set({ presets }); // 롤백
    }
  },

  loadApiKey: async () => {
    try {
      const apiKey = await presetApi.getApiKey();
      set({ apiKey });
    } catch (e) {
      console.error('Failed to load API key:', e);
    }
  },

  setApiKey: async (key) => {
    const { adminPassword } = get();
    set({ apiKey: key });
    try {
      await presetApi.saveConfig({ apiKey: key }, adminPassword);
    } catch (e) {
      console.error('Failed to save API key:', e);
    }
  },

  loadModelName: async () => {
    try {
      const modelName = await presetApi.getModelName();
      set({ modelName });
    } catch (e) {
      console.error('Failed to load model name:', e);
    }
  },

  setModelName: async (name) => {
    const { adminPassword } = get();
    set({ modelName: name });
    try {
      await presetApi.saveConfig({ modelName: name }, adminPassword);
    } catch (e) {
      console.error('Failed to save model name:', e);
    }
  },

  verifyAdminPassword: async (password) => {
    try {
      const valid = await presetApi.verifyPassword(password);
      if (valid) {
        set({ adminPassword: password, isAdminAuthenticated: true });
      }
      return valid;
    } catch (e) {
      console.error('Failed to verify password:', e);
      return false;
    }
  },

  setAdminPassword: async (password) => {
    const { adminPassword: currentPassword } = get();
    try {
      await presetApi.saveConfig({ adminPassword: password }, currentPassword);
      set({ adminPassword: password });
    } catch (e) {
      console.error('Failed to save admin password:', e);
    }
  },

  setAdminAuthenticated: (value) => {
    set({ isAdminAuthenticated: value });
  },
}));
