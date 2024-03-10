import mongoose, { model, Model, Document, Schema } from 'mongoose';

/**
 *  {
        "first_name": "Tehmina",
        "last_name": "Butt",
        "gender": "Female",
        "father_name": "Abdul Wahid",
        "address": "Khokhar Town Sialkot",
        "cnic": "34603-5728906-2",
        "phone": "0335-8722041",
        "dob": "3/10/1983",
        "qualification": "M.A Islamiyat",
        "completion": "2009",
        "score": "603",
        "institution": "Punjab Uni",
        "designation": "Principal",
        "appointment": "12/10/2004",
        "appointing_authority": "Madem Malika Saeeda",
        "salary": "33500"
    }
 */
interface Qualification {
  degree: string;
  year: string;
  institution: string;
  marks?: string;
}

interface Appointment {
  designation: string;
  date: Date;
  appointed_by: string;
  salary: number;
}

// TypeScript interface for Teacher
interface Teacher extends Document {
  first_name: string;
  last_name: string;
  gender: string;
  father_name: string;
  address: string;
  cnic: string;
  phone: string;
  dob: Date;
  qualification: Qualification[];
  appointment: Appointment;
}

// Mongoose Schema for the Teacher model
const teacherSchema = new Schema<Teacher>({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  gender: { type: String, required: true },
  father_name: { type: String, required: true },
  address: { type: String, required: true },
  cnic: { type: String, required: false, unique: true },
  phone: { type: String, required: true },
  dob: { type: Date, required: true },
  qualification: [
    {
      degree: { type: String, required: true },
      year: { type: String, required: true },
      institution: { type: String, required: true },
      marks: String,
    },
  ],
  appointment: {
    designation: { type: String, required: true },
    date: { type: Date, required: true },
    appointed_by: { type: String, required: true },
    salary: { type: Number, required: true },
  },
});

// Creating the Mongoose model
const TeacherModel = mongoose.model<Teacher>('Teacher', teacherSchema);

export default TeacherModel;
