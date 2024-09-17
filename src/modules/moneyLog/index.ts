import mongoose from 'mongoose';

const schema = new mongoose.Schema({ 
    date: { type: Date, required: true, default: Date.now ,unique: true},
    total: { type: Number, required: true }
});

type MoneyFlowModel = mongoose.InferSchemaType<typeof schema>;
export const MoneyFlow =
    mongoose.model < MoneyFlowModel>('MoneyFlow', schema);


// Function to save the money flow to MongoDB
export async function saveMoneyFlowToMongo(totalAmount: number): Promise<void> {
    try {
        const flowData = new MoneyFlow({
             total: totalAmount
        });

        await flowData.save();
        console.log(`Money flow for the day saved to MongoDB: ${totalAmount}`);
    } catch (err) {
        console.error('Error saving money flow to MongoDB:', err);
        throw err;
    }
}
