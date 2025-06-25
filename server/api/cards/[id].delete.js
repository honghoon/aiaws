// server/api/cards/[id].delete.ts
import { getDatabase } from '~/server/utils/mongodb'
import { ObjectId } from 'mongodb';

export default defineEventHandler(async (event) => {
  const id = event.context.params.id;

  const db = await getDatabase();
  await db.collection('cards').deleteOne({ _id: new ObjectId(id) });

  return { success: true };
});