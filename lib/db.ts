import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI ?? ""

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set")
}

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined
}

const cached = global.mongoose ?? { conn: null, promise: null }

export async function dbConnect() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    mongoose.set("strictQuery", true)
    cached.promise = mongoose.connect(MONGODB_URI).then((mongooseInstance) => mongooseInstance)
  }

  cached.conn = await cached.promise
  global.mongoose = cached

  return cached.conn
}
