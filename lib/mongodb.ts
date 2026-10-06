import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "pharmacy_pos_webdev2";

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

if (uri && process.env.NODE_ENV === "development") {
  if (!global.mongoClientPromise) {
    client = new MongoClient(uri);
    global.mongoClientPromise = client.connect();
  }
  clientPromise = global.mongoClientPromise;
} else if (uri) {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  if (!uri || !clientPromise) {
    throw new Error("Please define MONGODB_URI in .env.local");
  }

  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}
