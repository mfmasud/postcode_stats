// see https://mongoosejs.com/docs/typescript.html for how to use TypeScript with Mongoose

import { Schema, model, type InferSchemaType, type HydratedDocument, type Model } from 'mongoose';

const counterSchema = new Schema(
  {
    counterName: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
  },
);


counterSchema.statics.next = async function next(counterName: string): Promise<number> {
  // find the counter by name and increment the value by 1
  const doc = await this.findOneAndUpdate(
    { counterName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();
  return doc!.seq;
};

export type CounterInferredSchema = InferSchemaType<typeof counterSchema>;
export type CounterDoc = HydratedDocument<CounterInferredSchema>;

export interface CounterModel extends Model<CounterInferredSchema> {
  next(counterName: string): Promise<number>;
}

const Counter = model<CounterInferredSchema, CounterModel>('Counter', counterSchema);

export default Counter;
