import { Roles } from '@/lib/constants';
import { Types, Schema, Model, Document, model } from 'mongoose';

export default interface Role extends Document {
  _id: Types.ObjectId;
  code: string;
  status?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const schema = new Schema<Role>({
  code: {
    type: Schema.Types.String,
    required: true,
    trim: true,
    unique: true,
    enum:Roles
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
});


export const RoleModel = model<Role, Model<Role>>(
  'Role',
  schema,
  'roles',
)

export const getUserRoles = async (key:Roles) => {
    const role = await RoleModel.findOne({code:key})
    return role
    
}