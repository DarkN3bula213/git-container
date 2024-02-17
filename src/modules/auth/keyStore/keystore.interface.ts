import { Document, Model, Types } from 'mongoose';
import { User } from '../users/user.model';

export interface KeystoreStatics extends Model<Keystore> {
  // Static methods
  getClientById(clientId: Types.ObjectId): Promise<Keystore | null>;
  createKeyStore(
    client: User,
    primaryKey: string,
    secondaryKey: string,
  ): Promise<Keystore>;
}

export interface KeystoreQueryHelpers {
  // Query helpers can be added here if needed
}

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
  // Instance methods
  issueTokens(): Promise<{ primaryKey: string; secondaryKey: string }>;
  updateStore(): Promise<this>;
  revokeStore(): Promise<this>;
}
