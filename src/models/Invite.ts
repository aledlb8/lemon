import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const InviteSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ownedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    usedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type Invite = InferSchemaType<typeof InviteSchema> & {
  _id: mongoose.Types.ObjectId
}

export const InviteModel =
  (mongoose.models.Invite as Model<Invite>) ||
  mongoose.model<Invite>("Invite", InviteSchema)
