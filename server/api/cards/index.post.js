// server/api/cards/index.post.ts
import { getDatabase } from '~/server/utils/mongodb'

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const db = await getDatabase();
  const result = await db.collection('cards').insertOne(body);
  return { insertedId: result.insertedId };
});