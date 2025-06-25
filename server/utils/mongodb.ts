import { MongoClient } from 'mongodb'

const uri = useRuntimeConfig().MONGODB_URI as string

let client: MongoClient | null = null

export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(uri, {
  tls: true,
  tlsAllowInvalidCertificates: true, // ✅ 핵심 옵션
})
    await client.connect()
  }
  return client
}

export async function getDatabase(dbName = 'aiaws') {
  const client = await getMongoClient()
  return client.db(dbName)
}