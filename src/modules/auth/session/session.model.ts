import mongoose,{Types,Model,Schema} from "mongoose";

interface ISession {
  userId: string; // Link to the User model
  token: string; // JWT token
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  userAgent: string;
  ipAddress: string;
}
