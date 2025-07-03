// /server/api/bedrock-stream.ts
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { readBody } from "h3";

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event);

  const client = new BedrockRuntimeClient({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const input = {
    modelId: 'arn:aws:bedrock:us-east-1:333888904784:inference-profile/us.anthropic.claude-3-7-sonnet-20250219-v1:0', 
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  };

  try {
    const command = new InvokeModelCommand(input);
    const response = await client.send(command);

    const json = JSON.parse(Buffer.from(response.body).toString("utf-8"));
    return json;
  } catch (e) {
    console.error("Claude 호출 오류:", e);
    throw createError({ statusCode: 500, statusMessage: "Claude 호출 실패", data: e });
  }
});
