-- MBTI 궁합 사이트 결제 테이블
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS payments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    text        UNIQUE NOT NULL,
  payment_key text,
  amount      integer     NOT NULL DEFAULT 900,
  status      text        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'confirmed', 'failed')),
  access_token text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz
);

-- 토큰으로 빠른 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_payments_access_token ON payments (access_token)
  WHERE access_token IS NOT NULL;

-- 만료된 결제 기록 자동 정리 (선택사항)
-- 30일 이상 지난 confirmed 기록은 보관, pending/failed는 7일 후 삭제
-- (pg_cron 확장 필요 — Supabase Pro 이상)
-- SELECT cron.schedule('cleanup-old-payments', '0 3 * * *',
--   $$DELETE FROM payments WHERE status IN ('pending','failed') AND created_at < now() - interval '7 days'$$
-- );
