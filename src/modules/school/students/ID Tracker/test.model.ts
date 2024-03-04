import mongoose, { Schema, Document } from 'mongoose';

interface IUser extends Document {
  name: string;
}

const userSchema: Schema = new Schema({
  name: { type: String, required: true },
  // We'll add the uniqueId field later on
});

export const UserModel = mongoose.model<IUser>('TUser', userSchema);
