import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const prompt = body?.prompt || "";

  console.log("Received prompt:", prompt);
  
  const client = new BedrockRuntimeClient({
    region: "ap-northeast-2",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const command = new InvokeModelWithResponseStreamCommand({
    modelId: "anthropic.claude-v2",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      prompt: prompt,
      max_tokens_to_sample: 1024,
      temperature: 0.7,
    }),
  });

  setResponseHeader(event, "Content-Type", "text/event-stream");
  setResponseHeader(event, "Cache-Control", "no-cache");
  setResponseHeader(event, "Connection", "keep-alive");

  const response = await client.send(command);

  if (!response.body) {
    event.node.res.end();
    return;
  }

  const reader = response.body.getReader();
  const encoder = new TextEncoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    event.node.res.write(encoder.encode(`data: ${value ? Buffer.from(value).toString("utf-8") : ""}\n\n`));
  }

  event.node.res.end();
});