import { Logger } from '@/lib/logger';
import { convertToSeconds } from '@/lib/utils/fns';
import mongoose, { Document, Schema, Types } from 'mongoose';

// import autoIncrement from 'mongoose-sequence';

interface Token extends Document {
	token: string;
	tokenType: TokenTypes;
	userId: Types.ObjectId;
	createdAt: Date;
	issueNewToken(): Promise<string>;
	clearToken(): Promise<void>;
	logoutAllDevices(): Promise<void>;
}

interface TokenModel extends mongoose.Model<Token> {
	checkLogin(userId: string): Promise<boolean>;
	issueVerificationToken(
		userId: Types.ObjectId,
		code: string
	): Promise<string>;
}

type TokenTypes = 'VERIFICATION' | 'PASSWORD_RESET';

const schema = new Schema<Token>(
	{
		token: { type: String, required: true },
		tokenType: { type: String, enum: ['VERIFICATION', 'PASSWORD_RESET'] },
		userId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'User'
		},
		createdAt: {
			type: Date,
			default: Date.now
			// index: { expires: convertToMilliseconds('15m') }
		}
	},
	{
		timestamps: true,
		versionKey: false
	}
);

// Index for clearing verification tokens after 15 minutes
schema.path('createdAt').index({
	expireAfterSeconds: convertToSeconds('15m'),
	partialFilterExpression: {
		token: { $exists: true, $type: 'string' },
		tokenType: 'VERIFICATION'
	}
});

// schema.plugin(autoIncrement, {
// 	inc_field: 'IssueId',
// 	id: 'token_sequence',
// 	start_seq: 500
// });

// Instance method for issuing a new token
schema.methods.issueNewToken = async function () {
	// Logic to generate a new token and save the instance
	const newToken = 'newTokenLogicHere'; // Implement your logic to generate a new token
	this.token = newToken;
	await this.save();
	return newToken;
};

// Instance method to clear a specific token (logout from one device)
schema.methods.clearToken = async function () {
	this.token = null; // Or any logic to invalidate the token
	await this.save();
};

schema.statics.issueVerificationToken = async function (
	userId: Types.ObjectId,
	code: string
) {
	const token = await this.create({
		token: code,
		tokenType: 'VERIFICATION',
		userId: userId
	});
	return token;
};

// Static method to check if a user is logged in
schema.statics.checkLogin = async function (userId: string) {
	const token = await this.findOne({ user: userId });
	return !!token;
};

// Static method to clear all tokens for a user (logout from all devices)
schema.statics.logoutAllDevices = async function (userId: string) {
	await this.deleteMany({ user: userId });
};

// Unique compound index for tokenType and userId
schema.index(
	{ tokenType: 1, userId: 1 },
	{
		unique: true,
		partialFilterExpression: {
			tokenType: { $exists: true, $type: 'string' },
			userId: { $exists: true, $type: 'string' }
		}
	}
);

const Tokens = mongoose.model<Token, TokenModel>('Token', schema);
export default Tokens;

const logger = new Logger(__filename);
// Log when a token is deleted
Tokens.watch().on('change', (change) => {
	logger.info(change.operationType);
});
