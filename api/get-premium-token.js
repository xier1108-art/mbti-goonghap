/**
 * GET /api/get-premium-token?token=xxx
 * 프리미엄 액세스 토큰 유효성 검증
 * 프론트엔드에서 localStorage 토큰이 실제로 유효한지 서버에서 재확인할 때 사용합니다.
 *
 * 환경변수:
 *   SUPABASE_URL      — Supabase 프로젝트 URL
 *   SUPABASE_ANON_KEY — Supabase anon key
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ valid: false, error: '토큰이 없습니다' });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    // Supabase 미연결 시 클라이언트 측 만료 확인으로 폴백
    return res.status(200).json({ valid: true, note: 'DB 미연결 — 클라이언트 검증만 수행' });
  }

  // Supabase에서 토큰 조회
  const queryUrl = `${SUPABASE_URL}/rest/v1/payments?access_token=eq.${encodeURIComponent(token)}&status=eq.confirmed&select=expires_at`;
  const dbRes = await fetch(queryUrl, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!dbRes.ok) {
    return res.status(500).json({ valid: false, error: 'DB 조회 오류' });
  }

  const rows = await dbRes.json();

  if (!rows.length) {
    return res.status(200).json({ valid: false, error: '토큰을 찾을 수 없습니다' });
  }

  const { expires_at } = rows[0];
  const isValid = new Date(expires_at) > new Date();

  return res.status(200).json({ valid: isValid, expiresAt: expires_at });
}
