import mongoose from 'mongoose';

interface CalendarEvent extends mongoose.Document {
  title: string;
  startTime: Date;
  endTime: Date;
  description: string;
  location: string;
  attendees: string[];
}

const calendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    attendees: {
      type: [String],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

export default mongoose.model<CalendarEvent>(
  'Events',
  calendarEventSchema,
  'event',
);
