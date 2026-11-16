Deno.serve(async (req) => {
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, apikey, authorization", "Access-Control-Allow-Methods": "POST, OPTIONS" };
if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
try {
const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
if (!token || !chatId) return new Response(JSON.stringify({ ok: false, reason: "not configured" }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
const body = await req.json();

/* 개인정보 최소화: 예약자명은 텔레그램으로 보내지 않는다.
   이름이 필요하면 조회코드로 운영자 화면에서 연다. */
const parts = String(body.venue || "").split(" | ");
const venue = parts[0] || "(식당명 없음)";
const link = parts[1] || "";
const kind = body.kind || "new";

const head = kind === "cancel" ? "[취소 요청]"
  : kind === "change" ? "[변경 요청]"
  : kind === "hold_accept" ? "[보류 조건 수락]"
  : kind === "inquiry" ? "[새 문의]"
  : "[새 예약 요청]";

let text;
if (kind === "inquiry") {
text = head + "\n\n문의코드: " + (body.code || "-") + "\n언어: " + (body.lang || "-") + "\n\n운영자 화면 문의함에서 확인하세요.";
} else {
text = head + "\n\n식당: " + venue + "\n인원: " + (body.party || "-") + "명\n언어: " + (body.lang || "-") + "\n조회코드: " + (body.code || "-");
if (link) text += "\n지도: " + link;
if (kind === "cancel") {
text += "\n환불: " + (body.refundable ? "대상" : "없음 (예약 당일 요청)");
text += "\n\n" + (body.before_call ? "통화 전 취소입니다. 식당에 연락할 필요 없습니다." : "식당에 취소를 전달하세요.");
} else if (kind === "change") {
text += "\n비용: " + (body.refundable ? "무료 변경 (1회차)" : "유료 ₩9,900");
text += "\n\n식당에 변경 가능 여부를 확인하세요.";
} else if (kind === "hold_accept") {
text += "\n\n고객이 보류 조건을 수락했습니다. 식당에 확정을 요청하세요.";
} else {
text += "\n\n운영자 화면에서 처리하세요.";
}
text += "\n\n※ 예약자명은 운영자 화면에서 확인하세요.";
}

await fetch("https://api.telegram.org/bot" + token + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text: text, disable_web_page_preview: true }) });
return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
} catch (e) {
return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
}
});
