// server/api/cards/[id].put.ts
import { getDatabase } from '~/server/utils/mongodb'
import { ObjectId } from 'mongodb';

export default defineEventHandler(async (event) => {
  const id = event.context.params.id;
  const update = await readBody(event);

  const db = await getDatabase();
  await db.collection('cards').updateOne(
    { _id: new ObjectId(id) },
    { $set: update }
  );

  return { success: true };
});