import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const SessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
)

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export type Session = InferSchemaType<typeof SessionSchema> & {
  _id: mongoose.Types.ObjectId
}

export const SessionModel =
  (mongoose.models.Session as Model<Session>) ||
  mongoose.model<Session>("Session", SessionSchema)
