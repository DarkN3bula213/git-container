import { Actions, Resources, Roles } from '@/lib/constants';
import { type Document, type Model, Schema, type Types, model } from 'mongoose';

export interface Permission {
  resource: Resources;
  action: Actions;
}
export default interface Role extends Document {
  _id: Types.ObjectId;
  code: string;
  status?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  permissions: Permission[];
}
const permissionSchema = new Schema<Permission>({
  resource: { type: String, enum: Object.values(Resources), required: true },
  action: { type: String, enum: Object.values(Actions), required: true },
});
const schema = new Schema<Role>(
  {
    code: {
      type: Schema.Types.String,
      required: true,
      trim: true,
      unique: true,
      enum: Roles,
    },
    status: {
      type: Schema.Types.Boolean,
      default: true,
    },
    permissions: {
      type: [permissionSchema],
      default: () =>
        Object.values(Resources).map((resource) => ({
          resource,
          action: Actions.READ,
        })),
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
  { timestamps: true },
);

export const RoleModel = model<Role, Model<Role>>('Role', schema, 'roles');

export const getUserRoles = async (key: Roles) => {
  const role = await RoleModel.findOne({ code: key });
  return role;
};
