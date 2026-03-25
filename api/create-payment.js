/**
 * POST /api/create-payment
 * 결제 주문 생성 — 토스페이먼츠에 결제를 요청하기 전 orderId를 생성합니다.
 * (현재 토스페이먼츠 v1 SDK는 클라이언트에서 직접 requestPayment 호출 가능하므로
 *  이 엔드포인트는 orderId 사전 등록/검증이 필요할 때 사용합니다.)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { person1Name, person2Name } = req.body || {};

  // orderId: 중복 없는 고유값 (클라이언트에서 생성해도 되지만 서버 검증용으로 활용 가능)
  const orderId = `mbti_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 필요 시 Supabase에 pending 상태로 미리 저장
  // await supabase.from('payments').insert({ order_id: orderId, status: 'pending', amount: 900 });

  return res.status(200).json({
    orderId,
    amount: 900,
    orderName: `${person1Name || '사람A'} × ${person2Name || '사람B'} 궁합 상세 분석`,
  });
}
