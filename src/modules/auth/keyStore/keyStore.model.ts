import { Schema, model, Types, Model } from 'mongoose';
import { User } from '../users/user.model';

export const DOCUMENT_NAME = 'Keystore';
export const COLLECTION_NAME = 'keystores';

export interface Keystore extends Document {
  user: Schema.Types.ObjectId;
  refreshToken: string;
  expiresAt: Date;
}

 

const schema = new Schema<Keystore>(
  {
    user: {
      type:  Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

 
export const KeystoreModel = model<Keystore>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
 