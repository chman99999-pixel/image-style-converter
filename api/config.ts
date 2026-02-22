import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const API_KEY_KEY = 'api_key';
const ADMIN_PASS_KEY = 'admin_password';
const MODEL_NAME_KEY = 'model_name';
const ACCESS_CODE_KEY = 'access_code';
const DEFAULT_ADMIN_PASS = '1234';
const DEFAULT_MODEL = 'gemini-2.5-flash-image';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const action = req.query.action as string;
      const password = req.headers['x-admin-password'] as string;

      if (action === 'verify') {
        const storedPass = (await redis.get<string>(ADMIN_PASS_KEY)) ?? DEFAULT_ADMIN_PASS;
        return res.status(200).json({ valid: password === storedPass });
      }

      if (action === 'apikey') {
        const apiKey = (await redis.get<string>(API_KEY_KEY)) ?? '';
        return res.status(200).json({ apiKey });
      }

      if (action === 'model') {
        const modelName = (await redis.get<string>(MODEL_NAME_KEY)) ?? DEFAULT_MODEL;
        return res.status(200).json({ modelName });
      }

      if (action === 'verify_access') {
        const accessCode = req.query.code as string;
        const storedCode = (await redis.get<string>(ACCESS_CODE_KEY)) ?? (process.env.DEFAULT_ACCESS_CODE ?? '2026');
        return res.status(200).json({ valid: accessCode === storedCode });
      }

      if (action === 'get_access_code') {
        // 관리자 인증 필요
        const storedPass = (await redis.get<string>(ADMIN_PASS_KEY)) ?? DEFAULT_ADMIN_PASS;
        if (password !== storedPass) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        const storedCode = (await redis.get<string>(ACCESS_CODE_KEY)) ?? (process.env.DEFAULT_ACCESS_CODE ?? '2026');
        return res.status(200).json({ accessCode: storedCode });
      }

      // Full config requires admin auth
      const storedPass = (await redis.get<string>(ADMIN_PASS_KEY)) ?? DEFAULT_ADMIN_PASS;
      if (password !== storedPass) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const apiKey = (await redis.get<string>(API_KEY_KEY)) ?? '';
      return res.status(200).json({ apiKey, adminPassword: storedPass });
    }

    if (req.method === 'PUT') {
      const storedPass = (await redis.get<string>(ADMIN_PASS_KEY)) ?? DEFAULT_ADMIN_PASS;
      const password = req.headers['x-admin-password'] as string;
      if (password !== storedPass) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { apiKey, adminPassword, modelName, accessCode } = req.body;
      if (apiKey !== undefined) await redis.set(API_KEY_KEY, apiKey);
      if (adminPassword !== undefined) await redis.set(ADMIN_PASS_KEY, adminPassword);
      if (modelName !== undefined) await redis.set(MODEL_NAME_KEY, modelName);
      if (accessCode !== undefined) await redis.set(ACCESS_CODE_KEY, accessCode);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('[API/config] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
