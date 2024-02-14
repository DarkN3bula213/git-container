import { BadRequestError } from '@/lib/api';
import { ClassModel, IClass } from '../classes/class.model';
import { Student } from './student.interface';
import StudentModel from './student.model';

import {
  studentOutputSchema,
  studentRegistrationSchema,
} from './student.schema';

class Service {
  private static instance: Service;
  constructor(
    private student: typeof StudentModel,
    private classModel: typeof ClassModel,
  ) {}
  static getInstance() {
    if (!Service.instance) {
      Service.instance = new Service(StudentModel, ClassModel);
    }
    return Service.instance;
  }
  async getClassIdByName(className: string): Promise<IClass> {
    const classId = await this.classModel.findOne({ className: className });
    if (!classId) {
      throw new Error('Class not found');
    }
    return classId;
  }
  async resgisterStudent(data: Partial<Student>): Promise<Student> {

    const details = await this.getClassIdByName(data.className as string);
    if (!details) {
      throw new BadRequestError('Class not found');
    }
    data.classId = details._id;
    data.className = details.className;
    const newStudent = new this.student({
      tuition_fee: details.fee,
      classId: details._id,
      section: details.section,
      ...data,
    });

    const student =await newStudent.save();

    // const { error: outputError } = studentOutputSchema.validate(
    //   newStudent.toObject(),
    // ); // Assuming Mongoose model for toObject()
    // if (outputError) {
    //   throw new Error(outputError.details[0].message);
    // }
    return student;
  }
}

export const studentService = new Service(StudentModel, ClassModel);
