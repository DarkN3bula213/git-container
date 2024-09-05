import { InternalError } from '@/lib/api';
import bcrypt from 'bcrypt';
import {
  ClientSession,
  type Document,
  type Model,
  Schema,
  Types,
  model,
} from 'mongoose';
import { RoleModel } from '../roles/role.model';
export interface User extends Document {
  name: string;
  username: string;
  father_name: string;
  gender: 'male' | 'female';
  cnic: string;
  cnic_issued_date: Date;
  cnic_expiry_date: Date;
  dob: Date;
  email: string;
  password: string;
  phone: string;
  address: string;
  roles: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  isPrime: boolean;
  temporary?: Date;
  resetPasswordToken: string | null;
  resetPasswordExpiresAt: Date | null;
  verificationToken: string | null;
  verificationTokenExpiresAt: Date | null;
  isVerified: boolean;
  lastLogin: Date;
}

interface UserMethods {
  comparePassword: compoarePassword;
}

interface UserModel extends Model<User, UserMethods> {
  customId: { type: number; unique: true };
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(
    userDetails: Partial<User>,
    rolesCode?: string,
    session?: ClientSession,
  ): Promise<User>;
  login(email: string, password: string): Promise<User | null>;
  insertManyWithId(docs: User[]): Promise<User[]>;
  changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void>;
}
export const schema = new Schema<User>(
  {
    temporary: { type: Date, required: false },
    username: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
    },
    father_name: {
      type: String,
      required: false,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      default: 'male',
    },

    cnic: {
      type: String,
    },
    cnic_issued_date: {
      type: Date,
    },
    cnic_expiry_date: {
      type: Date,
    },
    dob: {
      type: Date,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    isPrime: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpiresAt: {
      type: Date,
      default: null,
    },
    verificationToken: {
      type: String,
    },
    verificationTokenExpiresAt: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    roles: [
      {
        type: Types.ObjectId,
        ref: 'Role', // Use the model name as a string here
        required: false,
      },
    ],
    status: String,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
const exclusionDate = new Date('2024-08-01'); // Example exclusion date
schema.index(
  { verificationTokenExpiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: {
      isVerified: false,
      createdAt: { $gte: exclusionDate }, // Apply TTL only to users created after this date
    },
  },
);
type compoarePassword = (password: string) => Promise<boolean>;

schema.methods.isDuplicateEmail = async (email: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) return false;
  return true;
};

function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

schema.methods.comparePassword = async function (
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

schema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await hashPassword(this.password);
  }
  // if (this.isNew) {
  //   this.customId = await generateUniqueId();
  // }
  next();
});

schema.statics.createUser = async function (
  userDetails,
  roleCode?: string,
  session?: ClientSession,
) {
  if (roleCode) {
    try {
      const role = await RoleModel.findOne({ code: roleCode })
        .select('+code')
        .lean()
        .exec();
      if (!role) throw new InternalError('Role must be defined');
      const user = {
        ...userDetails,
        roles: role._id,
      };
      return this.create(user, { session });
    } catch (err: any) {
      throw new InternalError(err.message);
    }
  }
  return this.create(userDetails);
};

schema.statics.findUserByEmail = async function (email) {
  const user = await this.findOne({ email });
  if (!user) return null;
  return user;
};

schema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) return null;
  const isMatch = await user.comparePassword(password);
  if (!isMatch) return null;
  return user;
};
schema.statics.changePassword = async function (
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await this.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new Error('Old password is incorrect');
  }

  // Simply update the password field; the pre-save hook will hash it
  user.password = newPassword;
  await user.save();
};
export const UserModel: UserModel = model<User, UserModel>('User', schema);

export const findUserByEmail = async (email: string) => {
  return UserModel.find({
    email,
  });
};

export const findUserById = async (id: string) => {
  const user = await UserModel.findById(id).select('-password').lean();
  return user;
};

schema.index({ temporary: 1 }, { expireAfterSeconds: 86400 });
