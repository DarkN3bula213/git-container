import mongoose, { Document, Schema } from 'mongoose';
import autoIncrement from 'mongoose-sequence'; 


interface Token extends Document {
  token: string;
  user: string;
  createdAt: Date;
  issueNewToken(): Promise<string>;
  clearToken(): Promise<void>;
  logoutAllDevices(): Promise<void>;
}

interface TokenModel extends mongoose.Model<Token> {
  checkLogin(userId: string): Promise<boolean>;
}

const schema = new Schema<Token>(
  {
    token: { type: String, required: true },
    user: { type: String, required: true, ref: 'User', index: true },
    createdAt: { type: Date, default: Date.now, index: { expires: '120m' } },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

schema.plugin(autoIncrement, {
  inc_field: 'IssueId',
  id: 'token_sequence',
  start_seq: 500,
});

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

// Static method to check if a user is logged in
schema.statics.checkLogin = async function (userId: string) {
  const token = await this.findOne({ user: userId });
  return !!token;
};

// Static method to clear all tokens for a user (logout from all devices)
schema.statics.logoutAllDevices = async function (userId: string) {
  await this.deleteMany({ user: userId });
};

const TokenModel = mongoose.model<Token, TokenModel>('Token', schema);
export default TokenModel;
