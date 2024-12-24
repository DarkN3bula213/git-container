import mongoose, { Document, InferSchemaType, Schema } from 'mongoose';

interface ICounter extends Document {
	_id: string;
	seq: number;
	lastUpdated: Date;
}

const counterSchema = new Schema<ICounter>({
	_id: { type: String, required: true },
	seq: { type: Number, default: 0 },
	lastUpdated: { type: Date, default: Date.now }
});

type CounterType = InferSchemaType<typeof counterSchema>;
const Counter = mongoose.model<CounterType>('Counter', counterSchema);

export async function getNextSequence(name: string): Promise<number> {
	const counter = await Counter.findOneAndUpdate(
		{ _id: name },
		{ $inc: { seq: 1 }, lastUpdated: Date.now() },
		{ new: true, upsert: true, returnDocument: 'after' }
	);
	return counter.seq;
}
