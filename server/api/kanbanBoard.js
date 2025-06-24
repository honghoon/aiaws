import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import { Card } from "@vicons/ionicons5";
import { readBody } from "h3";

export default defineEventHandler(async (event) => {
  console.log("### Received request to /api/bedrock-stream");
  
  const body = await readBody(event);
  
  const client = new BedrockRuntimeClient({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  // 카드 요약 텍스트로 변환 (HTML 제거 포함)
  const cardsSummary = body.cards
    .map((card, idx) => {
      const textContent = card.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return `${idx + 1}. [${card.statusName}] ${card.type} - ${card.title} (기간: ${card.startDate} ~ ${card.endDate})\n${textContent} 진행률: ${card.progress}% ) 키: ${card.id}`;
    })
    .join("\n\n");

  const prompt = [
    {
      role: "user",
      content: `${body.system}\n\n업무 카드 목록:\n${cardsSummary}\n\n사용자 질문:\n${body.user}`
    }
  ];

  const input = {
    modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      messages: prompt,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 1024,
      anthropic_version: "bedrock-2023-05-31",
    }),
  };

  try {
    // 스트리밍을 위해 InvokeModelWithResponseStreamCommand 사용
    const command = new InvokeModelWithResponseStreamCommand(input);
    const res = await client.send(command);

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        
        try {
          // AWS Bedrock 스트림 응답 처리
          for await (const chunk of res.body) {
            if (chunk.chunk?.bytes) {
              const chunkData = JSON.parse(decoder.decode(chunk.chunk.bytes));
              
              // Claude 응답에서 텍스트 추출
              if (chunkData.type === 'content_block_delta' && chunkData.delta?.text) {
                controller.enqueue(encoder.encode(chunkData.delta.text));
              }
              // 또는 다른 형태의 응답 구조인 경우
              else if (chunkData.completion) {
                controller.enqueue(encoder.encode(chunkData.completion));
              }
            }
          }
          controller.close();
        } catch (error) {
          console.error('Stream processing error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error('Bedrock API Error:', error);
    
    // 스트리밍이 실패한 경우, 일반 InvokeModelCommand로 폴백
    try {
      const { InvokeModelCommand } = await import("@aws-sdk/client-bedrock-runtime");
      const fallbackCommand = new InvokeModelCommand(input);
      const fallbackRes = await client.send(fallbackCommand);
      
      const responseBody = JSON.parse(new TextDecoder().decode(fallbackRes.body));
      const text = responseBody.content?.[0]?.text || responseBody.completion || 'No response received';
      
      return new Response(text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
      
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      
      return new Response(
        JSON.stringify({ 
          error: true, 
          message: fallbackError.message || 'Internal server error' 
        }), 
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
});