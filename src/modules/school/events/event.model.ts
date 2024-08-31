import mongoose, { Schema, Document } from 'mongoose';

interface IEvent extends Document {
  title: string;
  location?: string;
  date: Date;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  participants: string[];
  description?: string;
}
const calendarEventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, maxlength: 100 },
    location: { type: String, maxlength: 255 },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isAllDay: { type: Boolean, default: false },
    participants: { type: [String], default: [] },
    description: { type: String, maxlength: 255 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        // delete ret._id;
        delete ret.__v;
      },
    },
  },
);

// Add this line to create the compound unique index
calendarEventSchema.index({ date: 1, title: 1 }, { unique: true });

export default mongoose.model<IEvent>('Events', calendarEventSchema, 'event');
