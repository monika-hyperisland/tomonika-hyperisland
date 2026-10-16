import {
  Document,
  Schema,
  model,
  models,
  InferSchemaType,
  Types,
} from "mongoose";

const returnSchema = new Schema({
  projectUrl: { type: Schema.Types.String, required: true },
  liveVersion: { type: Schema.Types.String, required: true },
  pictureUrl: { type: Schema.Types.String, required: false },
  galleryVisible: { type: Schema.Types.Boolean, required: true, default: true },
  projectName: { type: Schema.Types.String, required: true },
  comment: { type: Schema.Types.String, required: true },
  owner: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
  createdAt: { type: Schema.Types.Date, required: true, default: Date.now },
  guide: { type: Schema.Types.ObjectId, required: true, ref: "Guide", index: true },
});

// Compound indexes for common query patterns
returnSchema.index({ guide: 1, owner: 1 });
returnSchema.index({ guide: 1, createdAt: -1 });

export type ReturnType = InferSchemaType<typeof returnSchema> & {
  _id: Types.ObjectId;
};

export type ReturnDocument = ReturnType & Document;
export const Return =
  models.Return || model<ReturnDocument>("Return", returnSchema);
