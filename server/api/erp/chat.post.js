import { streamClaudeResponse } from '~/server/utils/bedrock_stream';
import { sendClaudeResponseInvoke } from  '~/server/utils/bedrock_invoke';
import { Readable } from 'stream';

export default defineEventHandler(async (event) => {
  const { prompt } = await readBody(event);

  await streamClaudeResponse(prompt, event);

  let result = await sendClaudeResponseInvoke(prompt)

  console.log(result)

});