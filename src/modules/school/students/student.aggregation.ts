import mongoose from 'mongoose';
import StudentModel from './student.model';

export const studentDetailsWithPayments = async (studentId: string) => {
  const result = await StudentModel.aggregate([
    // Match the student by ID
    { $match: { _id: new mongoose.Types.ObjectId(studentId) } },

    // Lookup to join with payments collection
    {
      $lookup: {
        from: 'payments', // the collection name in the database
        localField: '_id', // field from the student collection
        foreignField: 'studentId', // field from the payments collection
        as: 'feeDocuments', // the array that will hold all the joined documents
      },
    },

    // Unwind the feeDocuments to sort and then regroup
    { $unwind: { path: '$feeDocuments', preserveNullAndEmptyArrays: true } },

    // Sort the payments by payId within each student
    { $sort: { 'feeDocuments.payId': 1 } },

    // Group back to get all feeDocuments in one array
    {
      $group: {
        _id: '$_id',
        root: { $mergeObjects: '$$ROOT' },
        feeDocuments: { $push: '$feeDocuments' },
      },
    },

    // Project to structure the output document
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$root', '$$ROOT'],
        },
      },
    },
    { $project: { root: 0 } }, // Remove the temporary 'root' field
  ]);

  return result;
};
