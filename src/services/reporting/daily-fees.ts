import IPayment from '@/modules/school/payments/payment.model';
export interface PaymentAggregation {
   className: string;
   section: string;
   students: {
      studentName: string;
      payId: string;
      amount: number;
   }[];
   totalAmount: number;
}

export async function getPaymentsForDate(
   date: Date
): Promise<PaymentAggregation[]> {
   const startOfDay = new Date(date.setHours(0, 0, 0, 0));
   const endOfDay = new Date(date.setHours(23, 59, 59, 999));

   const payments = await IPayment.aggregate([
      {
         $match: {
            paymentDate: {
               $gte: startOfDay,
               $lte: endOfDay
            },
            paymentStatus: 'success' // Match with the status used in the schema
         }
      },
      {
         $lookup: {
            from: 'students', // Assuming your students collection is named 'students'
            localField: 'studentId',
            foreignField: '_id',
            as: 'studentDetails'
         }
      },
      {
         $unwind: '$studentDetails'
      },
      {
         $group: {
            _id: {
               className: '$className',
               section: '$section'
            },
            students: {
               $push: {
                  studentName: '$studentDetails.name', // Replace with the actual field name in the student schema
                  payId: '$studentDetails.registration_no',
                  amount: '$amount'
               }
            },
            totalAmount: { $sum: '$amount' }
         }
      },
      {
         $project: {
            _id: 0,
            className: '$_id.className',
            section: '$_id.section',
            students: 1,
            totalAmount: 1
         }
      },
      {
         $sort: { className: 1, section: 1 }
      }
   ]);

   return payments;
}
