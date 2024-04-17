import StudentModel from '../students/student.model';

export async function checkPaymentStatus(className: string, payId: string) {
  return StudentModel.aggregate([
    {
      $match: {
        className: className,
      },
    },
    {
      $lookup: {
        from: 'payments',
        localField: '_id',
        foreignField: 'studentId',
        as: 'paymentDetails',
      },
    },
    {
      $addFields: {
        paid: {
          $anyElementTrue: {
            $map: {
              input: '$paymentDetails',
              as: 'payment',
              in: { $eq: ['$$payment.payId', payId] },
            },
          },
        },
        recordId: {
          $arrayElemAt: [
            {
              $map: {
                input: {
                  $filter: {
                    input: '$paymentDetails',
                    as: 'payment',
                    cond: { $eq: ['$$payment.payId', payId] },
                  },
                },
                as: 'filteredPayment',
                in: '$$filteredPayment._id',
              },
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        name: 1,
        registration_no: 1,
        className: 1,
        section: 1,
        admission_date: 1,
        paid: 1,
        recordId: 1, // Ensure this field is included in the projection
      },
    },
  ]);
}
