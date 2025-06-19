import { MongoClient } from 'mongodb'

const uri = useRuntimeConfig().MONGODB_URI as string

let client: MongoClient | null = null

export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
  }
  return client
}

export async function getDatabase(dbName = 'my-database') {
  const client = await getMongoClient()
  return client.db(dbName)
}