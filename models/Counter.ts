// see https://mongoosejs.com/docs/typescript.html for how to use TypeScript with Mongoose

import { Schema, model, type InferSchemaType, type HydratedDocument, type Model } from 'mongoose';

const counterSchema = new Schema(
  {
    counterName: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
  },
);


counterSchema.statics.next = async function next(counterName: string): Promise<number> {
  const doc = await this.findOneAndUpdate(
    { counterName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();
  return doc!.seq;
};

export interface CounterModel extends Model<Counter> {
    next(counterName: string): Promise<number>;
  }

export type Counter = InferSchemaType<typeof counterSchema>;
export type CounterDoc = HydratedDocument<Counter>;

export default model<Counter, CounterModel>('Counter', counterSchema);
