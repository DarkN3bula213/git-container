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
import { generateUniqueId } from './utils';
import { Logger } from '@/lib/logger';
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
  role: 'master' | 'admin' | 'teacher';
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;

}
const logger = new Logger(__filename);
interface UserMethods {
  comparePassword: compoarePassword;
}

interface UserModel extends Model<User, {}, UserMethods> {
  customId: { type: Number; unique: true };
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(userDetails: Partial<User>): Promise<User>;
  login(email: string, password: string): Promise<User | null>;
  insertManyWithId(docs: User[]): Promise<User[]>;
}

export const schema = new Schema<User>(
  {
    username: {
      type: String,
      unique: true,
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
    statics: {
      async insertManyWithId(docs: User[]) {
        // const documentsWithIds = await Promise.all(
        //   docs.map(async (doc) => {
        //     doc.customId = await generateUniqueId();
        //     return doc;
        //   }),
        // );
        // // Use the original insertMany function on `this` which refers to the model
        // return await this.insertMany(documentsWithIds);
      },

      async findUserById(id: string) {
        return await this.findOne({ _id: id });
      },

      async findUserByEmail(email: string) {
        return await this.findOne({ email });
      },
    },
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

schema.statics.createUser = function (userDetails) {
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