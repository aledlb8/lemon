import mongoose from "mongoose"

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined
}

const cached = global.mongoose ?? { conn: null, promise: null }

function getMongoUri() {
  const uri = process.env.MONGODB_URI ?? ""
  if (!uri) {
    throw new Error("MONGODB_URI is not set")
  }
  return uri
}

export async function dbConnect() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    mongoose.set("strictQuery", true)
    const uri = getMongoUri()
    cached.promise = mongoose.connect(uri).then((mongooseInstance) => mongooseInstance)
  }

  cached.conn = await cached.promise
  global.mongoose = cached

  return cached.conn
}
