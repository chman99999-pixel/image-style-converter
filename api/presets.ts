import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const PRESETS_KEY = 'style_presets';
const ADMIN_PASS_KEY = 'admin_password';
const DEFAULT_ADMIN_PASS = '1234';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const presets = await redis.get(PRESETS_KEY);
      return res.status(200).json(presets ?? []);
    }

    if (req.method === 'PUT') {
      const password = req.headers['x-admin-password'] as string;
      const storedPass = (await redis.get<string>(ADMIN_PASS_KEY)) ?? DEFAULT_ADMIN_PASS;
      if (password !== storedPass) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const presets = req.body;
      await redis.set(PRESETS_KEY, JSON.stringify(presets));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('[API/presets] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
