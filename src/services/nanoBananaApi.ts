import { imageToBase64 } from '../utils/imageUtils';

export async function transformImage(
  apiKey: string,
  imageUris: string[],
  prompt: string,
  modelName: string = 'gemini-2.5-flash-image',
  aspectRatio?: string,
): Promise<string> {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  console.log('[API] Starting image transform...');
  console.log('[API] Model:', modelName);
  console.log('[API] Image count:', imageUris.length);
  console.log('[API] Prompt:', prompt?.substring(0, 80));

  // 각 이미지를 base64로 변환
  const imageParts: any[] = [];
  for (let i = 0; i < imageUris.length; i++) {
    try {
      const base64Image = await imageToBase64(imageUris[i]);
      console.log(`[API] Image ${i + 1} base64 length:`, base64Image.length);
      imageParts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64Image,
        },
      });
    } catch (e: any) {
      console.error(`[API] Failed to convert image ${i + 1}:`, e);
      throw new Error(`이미지 ${i + 1} 변환 준비 실패: ${e.message}`);
    }
  }

  const imageCountNote = imageUris.length > 1
    ? `\n\nNote: ${imageUris.length} images are provided. Apply the style transformation to all images and combine them into a single output image.`
    : '';

  // Gemini 3 Pro Image는 TEXT+IMAGE 필수, 2.5 Flash Image는 IMAGE만
  const isGemini3 = modelName.includes('gemini-3');

  // 비율 지시: Gemini 2.5는 프롬프트로, Gemini 3는 imageConfig로 처리
  let aspectInstruction = '';
  if (!isGemini3 && aspectRatio) {
    // Gemini 2.5 Flash Image는 imageConfig 미지원 → 프롬프트로 강하게 지시
    const [w, h] = aspectRatio.split(':').map(Number);
    aspectInstruction = `\n\nCRITICAL REQUIREMENT: The output image MUST have an aspect ratio of exactly ${aspectRatio} (width:height = ${w}:${h}). Resize and crop the canvas accordingly. Do NOT output a square image unless the ratio is 1:1.`;
  }

  const fullPrompt = `Edit this image with the following style. You MUST output an image, not text. Apply the transformation directly to the provided image and return the result as an image.\n\nStyle: ${prompt}${imageCountNote}${aspectInstruction}`;

  const generationConfig: any = {
    responseModalities: isGemini3 ? ['TEXT', 'IMAGE'] : ['IMAGE'],
  };

  // Gemini 3 Pro Image는 imageConfig로 비율/해상도 직접 지원
  if (isGemini3 && aspectRatio) {
    generationConfig.imageConfig = {
      aspectRatio: aspectRatio,
    };
  }

  const requestBody = {
    contents: [
      {
        parts: [
          ...imageParts,
          { text: fullPrompt },
        ],
      },
    ],
    generationConfig,
  };

  console.log('[API] Sending request to Gemini API...');

  // 타임아웃 설정 (90초)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  let response: Response;
  try {
    response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } catch (e: any) {
    clearTimeout(timeoutId);
    console.error('[API] Network error:', e);
    if (e.name === 'AbortError') {
      throw new Error(`API 응답 시간 초과 (90초). 선택한 모델(${modelName})이 현재 API 키에서 지원되지 않을 수 있습니다. 다른 모델로 시도해보세요.`);
    }
    throw new Error(`네트워크 오류: ${e.message}`);
  }
  clearTimeout(timeoutId);

  console.log('[API] Response status:', response.status);

  const responseText = await response.text();
  console.log('[API] Response body (first 500 chars):', responseText.substring(0, 500));

  if (!response.ok) {
    let errorMessage = `API 오류 (${response.status})`;
    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData?.error?.message || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }

  let data: any;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    throw new Error('API 응답 파싱 실패');
  }

  const candidates = data.candidates;
  if (!candidates || candidates.length === 0) {
    console.error('[API] No candidates in response:', JSON.stringify(data).substring(0, 300));
    throw new Error('이미지 생성 결과가 없습니다. 프롬프트를 수정해보세요.');
  }

  const parts = candidates[0].content?.parts;
  if (!parts) {
    console.error('[API] No parts in candidate:', JSON.stringify(candidates[0]).substring(0, 300));
    throw new Error('응답에서 이미지를 찾을 수 없습니다.');
  }

  for (const part of parts) {
    const imageData = part.inlineData?.data || part.inline_data?.data;
    if (imageData) {
      console.log('[API] Got image data, length:', imageData.length);
      return imageData;
    }
  }

  const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join(' ');
  console.error('[API] No image in response, text only:', textParts.substring(0, 200));
  throw new Error(`이미지가 생성되지 않았습니다. API 응답: ${textParts.substring(0, 100)}`);
}
