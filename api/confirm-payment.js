/**
 * POST /api/confirm-payment
 * 토스페이먼츠 결제 승인 + Supabase 저장 + 프리미엄 액세스 토큰 발급
 *
 * 환경변수 (Vercel 대시보드에서 설정):
 *   TOSS_SECRET_KEY   — 토스페이먼츠 시크릿 키 (test_sk_... 또는 live_sk_...)
 *   SUPABASE_URL      — Supabase 프로젝트 URL
 *   SUPABASE_ANON_KEY — Supabase anon key
 */
import crypto from 'crypto';

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
const SUPABASE_URL    = process.env.SUPABASE_URL;
const SUPABASE_KEY    = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentKey, orderId, amount } = req.body || {};

  if (!paymentKey || !orderId || !amount) {
    return res.status(400).json({ error: '필수 파라미터 누락' });
  }

  if (Number(amount) !== 900) {
    return res.status(400).json({ error: '결제 금액이 일치하지 않습니다' });
  }

  // 1. 토스페이먼츠 결제 승인 API 호출
  const authHeader = 'Basic ' + Buffer.from(TOSS_SECRET_KEY + ':').toString('base64');
  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  if (!tossRes.ok) {
    const err = await tossRes.json();
    console.error('Toss confirm error:', err);
    return res.status(400).json({ error: err.message || '결제 승인 실패' });
  }

  const payment = await tossRes.json();

  // 2. 프리미엄 액세스 토큰 생성 (24시간 유효)
  const accessToken = crypto.randomBytes(32).toString('hex');
  const expiresAt   = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // 3. Supabase에 결제 기록 저장
  if (SUPABASE_URL && SUPABASE_KEY) {
    await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        order_id:     orderId,
        payment_key:  paymentKey,
        amount:       payment.totalAmount,
        status:       'confirmed',
        access_token: accessToken,
        expires_at:   expiresAt,
      }),
    });
  }

  return res.status(200).json({ accessToken, expiresAt });
}
