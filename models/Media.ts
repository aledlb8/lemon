import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const MediaSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    originalName: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    blobUrl: { type: String, required: true },
    blobPathname: { type: String, required: true },
  },
  { timestamps: true }
)

export type Media = InferSchemaType<typeof MediaSchema> & {
  _id: mongoose.Types.ObjectId
}

export const MediaModel =
  (mongoose.models.Media as Model<Media>) ||
  mongoose.model<Media>("Media", MediaSchema)
