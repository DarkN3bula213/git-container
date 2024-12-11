import mongoose, { InferSchemaType, Model, Schema, Types } from 'mongoose';

// Step 1: Define the Invoice Schema
const invoiceSchema = new Schema(
	{
		invoiceId: {
			type: String,
			unique: true,
			partialFilterExpression: { invoiceId: { $type: 'string' } }
		},
		studentId: {
			type: Types.ObjectId,
			required: true,
			ref: 'Student'
		},
		feeDetails: { type: Object, required: true },
		dateGenerated: { type: Date, default: Date.now },
		qrCode: { type: String, required: true },
		barcode: { type: String, required: true },
		jwtToken: { type: String, required: true },
		status: { type: String, default: 'unpaid' } // Optional: Enum could be added for status validation
	},
	{
		timestamps: true,
		collection: 'invoices'
	}
);

// Step 2: Infer Schema Type
export type InvoiceDocument = InferSchemaType<typeof invoiceSchema>;

// Step 3: Additional Interface for Invoice Logic (Optional)
interface InvoiceMethods {
	markPaid: () => void;
	remove: () => void;
}

interface InvoiceModel extends Model<InvoiceDocument, object, InvoiceMethods> {}

// Step 4: Adding Custom Methods to the Schema
invoiceSchema.methods.markPaid = function () {
	this.status = 'paid';
};

// Step 5: Create and Export the Model
const Invoice = mongoose.model<InvoiceDocument, InvoiceModel>(
	'Invoice',
	invoiceSchema
);

export default Invoice;
