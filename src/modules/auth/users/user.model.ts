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

export interface User extends Document {
  name: string;
  father_name: string;
  gender: 'male' | 'female';
  country: string;
  cnic: string;
  cnic_issued_date: Date;
  cnic_expiry_date: Date;
  dob: Date;
  email: string;
  password: string;
  phone: string;
  address: string;
  role: 'master' | 'admin' | 'teacher';
  status: 'active' | 'inactive';
}

interface UserMethods {
  comparePassword: compoarePassword;
}

interface UserModel extends Model<User, {}, UserMethods> {
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(userDetails: Partial<User>): Promise<User>;
}

const schema = new Schema<User>(
  {
    name: {
      type: String,
      required: true,
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
    country: {
      type: String,
      required: false,
    },
    cnic: {
      type: String,
      required: false,
    },
    cnic_issued_date: {
      type: Date,
      required: false,
    },
    cnic_expiry_date: {
      type: Date,
      required: false,
    },
    dob: {
      type: Date,
      required: false,
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
    role: {
      type: String,
      enum: ['master', 'admin', 'teacher'],
      default: 'admin',
    },
    status: String,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

type compoarePassword = (password: string) => Promise<boolean>;

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
  next();
});

schema.statics.createUser = function (userDetails) {
  return this.create(userDetails);
};


export const UserModel: UserModel = model<User, UserModel>('User', schema);

export const findUserByEmail = async (email: FilterQuery<string>) => {
  return UserModel.findOne(email);
};

export const findUserById = async (id: Types.ObjectId) => {
  return UserModel.findById(id);
};

export const changePassword = async (password: string) => {};

export const updateUser = async () => {};

export const deleteUser = async () => {};
