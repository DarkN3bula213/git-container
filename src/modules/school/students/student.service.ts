import { BadRequestError } from '@/lib/api';
import { ClassModel, IClass } from '../classes/class.model';
import { Student } from './student.interface';
import StudentModel from './student.model';

import {
   studentOutputSchema,
   studentRegistrationSchema
} from './student.schema';

class Service {
   private static instance: Service;
   constructor(
      private student: typeof StudentModel,
      private classModel: typeof ClassModel
   ) {}
   static getInstance() {
      if (!Service.instance) {
         Service.instance = new Service(StudentModel, ClassModel);
      }
      return Service.instance;
   }
   async getClassIdByName(className: string): Promise<IClass> {
      const classId = await this.classModel.findOne({
         className: className
      });
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
         ...data
      });

      const student = await newStudent.save();

      // const { error: outputError } = studentOutputSchema.validate(
      //   newStudent.toObject(),
      // ); // Assuming Mongoose model for toObject()
      // if (outputError) {
      //   throw new Error(outputError.details[0].message);
      // }
      return student;
   }

   async updateStudentFee(studentId: string, amount: number, remarks: string) {
      const numericAmount = Number(amount);
      const check = await this.student.findById(studentId);
      if (!check) {
         throw new Error('Student not found');
      }
      const classData = await this.classModel.findById(check.classId);
      if (!classData) {
         throw new Error('Class not found');
      }
      const classFee = classData.fee;
      const isNormal = classFee === numericAmount;
      const update = {
         $set: {
            'status.isSpecialCondition': !isNormal,
            tuition_fee: numericAmount
         },
         $push: {
            'status.remarks': remarks
         }
      };
      const student = await this.student.findByIdAndUpdate(studentId, update, {
         new: true,
         runValidators: true
      });
      if (!student) {
         throw new Error('Student not found');
      }
      return student;
   }
}

export const studentService = new Service(StudentModel, ClassModel);
