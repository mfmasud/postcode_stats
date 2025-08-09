import { Schema, model } from 'mongoose';

interface ICounter {
    counterName: string;
    seq: number;
}

const counterSchema = new Schema({
    counterName: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
  });

const Counter = model<ICounter>('Counter', counterSchema);

export default Counter;