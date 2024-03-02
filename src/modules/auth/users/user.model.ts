import {
  Document,
  Schema,
  Model,
  model,
  PopulateOptions,
  Types,
  FilterQuery,
} from 'mongoose';
import bcrypt from 'bcrypt';

import { Logger } from '@/lib/logger';
import Role, { RoleModel } from '../roles/role.model';
import { InternalError } from '@/lib/api';
import { Roles } from '@/lib/constants';
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
  roles: Types.ObjectId[] | Role[] | string[] | string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
const logger = new Logger(__filename);
interface UserMethods {
  comparePassword: compoarePassword;
}

interface UserModel extends Model<User, {}, UserMethods> {
  customId: { type: number; unique: true };
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(userDetails: Partial<User>, rolesCode?: string): Promise<User>;
  login(email: string, password: string): Promise<User | null>;
  insertManyWithId(docs: User[]): Promise<User[]>;
}

export const schema = new Schema<User>(
  {
    username: {
      type: String,
      // unique: true,
      required: true, //[+]
    },
    name: {
      type: String,
      required: true, //[+]
    },
    father_name: {
      type: String,
      required: false,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      default: 'male',
      required: true, //[+]
    },

    cnic: {
      type: String,
      required: true, //[+]
    },
    cnic_issued_date: {
      type: Date,
      required: true, //[+]
    },
    cnic_expiry_date: {
      type: Date,
      required: true, //[+]
    },
    dob: {
      type: Date,
      required: true, //[+]
    },
    email: {
      type: String,
      required: true, //[+]
      unique: true,
    },
    password: {
      type: String,
      required: true, //[+]
    },
    phone: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
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

type compoarePassword = (password: string) => Promise<boolean>;

schema.methods.isDuplicateEmail = async function (email: string) {
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

schema.statics.createUser = async function (userDetails, roleCode?: string) {
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
      return this.create(user);
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

async function updateInfo(user: User): Promise<any> {
  user.updatedAt = new Date();
  return UserModel.updateOne({ _id: user._id }, { $set: { ...user } })
    .lean()
    .exec();
}
