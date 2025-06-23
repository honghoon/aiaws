import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export default defineEventHandler(async (event) => {

  console.log("### Received request to /api/bedrock-stream");

  const body = await readBody(event);

  const client = new BedrockRuntimeClient({
    region: "us-east-1", // 변경 가능
    credentials: {
      accessKeyId: process.env.key,
      secretAccessKey: process.env.s_key,
    },
  });

  const messages = [
    { role: "system", content: body.system },
    ...body.history.flatMap(h => [
      { role: "user", content: h.q },
      { role: "assistant", content: h.a }
    ]),
    { role: "user", content: body.user },
  ];

  const input = {
    modelId: "anthropic.claude-3-sonnet-20240229-v1:0", // 모델 변경 가능
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      messages,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 1024,
    }),
  };

  const command = new InvokeModelCommand(input);
  const response = await client.send(command);

  const json = JSON.parse(Buffer.from(response.body).toString("utf-8"));

  return json;
});
