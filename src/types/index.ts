export interface StylePreset {
  id: string;
  title: string;
  prompt: string;
  sampleImageUri: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransformResult {
  originalUri: string;
  transformedBase64: string;
  presetTitle: string;
  timestamp: string;
}
