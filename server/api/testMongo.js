import { getDatabase } from '~/server/utils/mongodb'

export default defineEventHandler(async () => {
  const db = await getDatabase()
  const users = await db.collection('users').find().toArray()
  return {"data": users}
})