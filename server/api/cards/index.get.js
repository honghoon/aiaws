// server/api/cards/index.get.ts
import { getDatabase } from '~/server/utils/mongodb'

export default defineEventHandler(async () => {
  const db = await getDatabase();
  const cards = await db.collection('cards').find().toArray();
  return cards;
});