import { Schema, model, Types, Model } from 'mongoose';
import { User } from '../users/user.model';

export const DOCUMENT_NAME = 'Keystore';
export const COLLECTION_NAME = 'keystores';

export interface Keystore extends Document {
  client: Types.ObjectId;
  primaryKey: string;
  secondaryKey: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  revoked: boolean;
  tokenCount: number;
  loginTime?: Date;
  logoutTime?: Date;
  userAgent?: string;
  ipAddress?: string;
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

/**
 *
 * Upadate Keystore
 *
 */

const keystoreSchema = new Schema<Keystore>(
  {
    client: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    primaryKey: { type: String, required: true, trim: true },
    secondaryKey: { type: String, required: true, trim: true },
    status: { type: Boolean, default: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
    tokenCount: { type: Number, default: 0 },
    loginTime: { type: Date },
    logoutTime: { type: Date },
    userAgent: { type: String },
    ipAddress: { type: String },
  },
  {
    versionKey: false,
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    statics: {
      createKeystore: async function (
        user: User,
        primaryKey: string,
        secondaryKey: string,
      ) {
        const date = new Date();
        return await this.create({
          client: user._id,
          primaryKey,
          secondaryKey,
          createdAt: date,
          updatedAt: date,
          revoked: false,
          tokenCount: 1, // Initial token creation
        });
      },
    },
  },
);
keystoreSchema.statics.findByPrimaryKey = async function (primaryKey: string) {
  return await this.findOne({ primaryKey, revoked: false });
};

// export const Keystore = model<Keystore, IKeystore>('Keystore', keystoreSchema);

interface KeyStoreStatics extends Model<Keystore, {}> {
  createKeystore: (
    user: User,
    primaryKey: string,
    secondaryKey: string,
  ) => Promise<Keystore>;
}

keystoreSchema.statics.findByPrimaryKey = async function (primaryKey: string) {
  return await this.findOne({ primaryKey, revoked: false });
};

export const Keystore = model<Keystore, IKeystore>(
  'store2',
  keystoreSchema,
  COLLECTION_NAME,
) as KeyStoreStatics;
