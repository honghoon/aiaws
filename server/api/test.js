export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Content-Type", "text/event-stream");
  setResponseHeader(event, "Cache-Control", "no-cache");
  setResponseHeader(event, "Connection", "keep-alive");

  for (let i = 1; i <= 5; i++) {
    event.node.res.write(`data: 테스트 메시지 ${i}\n\n`);
    await new Promise((resolve) => setTimeout(resolve, 200)); // 0.2초 대기
  }

  event.node.res.end();
});