import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    uploadKeyHash: { type: String, default: null },
    role: { type: Number, default: 0 },
    settings: {
      defaultVisibility: {
        type: String,
        enum: ["public", "private"],
        default: "public",
      },
    },
  },
  { timestamps: true }
)

export type User = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId
}

export const UserModel =
  (mongoose.models.User as Model<User>) || mongoose.model<User>("User", UserSchema)
