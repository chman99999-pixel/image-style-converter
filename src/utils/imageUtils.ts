import { Platform } from 'react-native';

export async function imageToBase64(uri: string): Promise<string> {
  // data URL이면 바로 base64 추출
  if (uri.startsWith('data:')) {
    return uri.split(',')[1];
  }

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const { File } = await import('expo-file-system/next');
  const file = new File(uri);
  return file.base64();
}

export async function resizeImage(
  uri: string,
  maxWidth: number = 1024
): Promise<string> {
  if (Platform.OS === 'web') {
    // 웹: Canvas로 리사이즈
    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context 생성 실패'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = uri;
    });
  }

  const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: maxWidth } }],
    { compress: 0.8, format: SaveFormat.JPEG }
  );
  return result.uri;
}

export async function base64ToTempFile(base64Data: string): Promise<string> {
  if (Platform.OS === 'web') {
    return `data:image/jpeg;base64,${base64Data}`;
  }

  const { File, Paths } = await import('expo-file-system/next');
  const filename = `transformed_${Date.now()}.jpg`;
  const file = new File(Paths.cache, filename);
  file.create();
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  file.write(bytes);
  return file.uri;
}
