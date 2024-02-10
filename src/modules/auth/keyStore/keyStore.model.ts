import { Schema, model, Types } from 'mongoose';
import { User } from '../users/user.model';

export const DOCUMENT_NAME = 'Keystore';
export const COLLECTION_NAME = 'keystores';

export default interface Keystore {
  _id: Types.ObjectId;
  client: User;
  primaryKey: string;
  secondaryKey: string;
  status?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IKeystore {
  createKeystore: (
    user: User,
    primaryKey: string,
    secondaryKey: string,
  ) => Promise<Keystore>;
}

const schema = new Schema<Keystore>(
  {
    client: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    primaryKey: {
      type: Schema.Types.String,
      required: true,
      trim: true,
    },
    secondaryKey: {
      type: Schema.Types.String,
      required: true,
      trim: true,
    },
    status: {
      type: Schema.Types.Boolean,
      default: true,
    },
    createdAt: {
      type: Schema.Types.Date,
      required: true,
      select: false,
    },
    updatedAt: {
      type: Schema.Types.Date,
      required: true,
      select: false,
    },
  },
  {
    versionKey: false,
    statics: {
      createKeystore: async function (
        user: User,
        primaryKey: string,
        secondaryKey: string,
      ) {
        const date = new Date();
        const userDetails = {
          client: user,
          primaryKey,
          secondaryKey,
          createdAt: date,
          updatedAt: date,
        };
        return await this.create(userDetails);
      },
      getByKey: async function (key) {
        return await this.findOne({ primaryKey: key });
      },
    },
  },
);

schema.index({ client: 1 });
schema.index({ client: 1, primaryKey: 1, status: 1 });
schema.index({ client: 1, primaryKey: 1, secondaryKey: 1 });

export const KeystoreModel = model<Keystore, IKeystore>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
