import mongoose, { Document, InferSchemaType, Model, Schema } from 'mongoose';

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
export default Counter;

export async function getNextSequence(name: string): Promise<number> {
	const counter = await Counter.findOneAndUpdate(
		{ _id: name },
		{ $inc: { seq: 1 }, lastUpdated: Date.now() },
		{ new: true, upsert: true, returnDocument: 'after' }
	);
	return counter.seq;
}

const getCheckCharacter = (input: string): string => {
	const sum = input
		.split('')
		.reduce((acc, char) => acc + parseInt(char, 36), 0);
	return (sum % 36).toString(36).toUpperCase();
};

export const createInvoiceIdGenerator = (counterModel: Model<ICounter>) => {
	return async () => {
		const now = new Date();
		const datePart = [
			now.getUTCFullYear().toString().slice(-2),
			(now.getUTCMonth() + 1).toString().padStart(2, '0'),
			now.getUTCDate().toString().padStart(2, '0')
		].join('');

		const counter = await counterModel.findOneAndUpdate(
			{ date: datePart },
			{ $inc: { seq: 1 } },
			{ upsert: true, new: true }
		);

		const sequencePart = counter.seq.toString().padStart(4, '0');
		const baseString = `${datePart}${sequencePart}`;
		const checkChar = getCheckCharacter(baseString);

		return `${baseString}${checkChar}`;
	};
};
