// Find conflicts in the students collection
// Conflicts can be duplicate student.registration_number
// Conflicts can be duplicate student entries as a whole
import paymentModel from '../../payments/payment.model';
import StudentModel from '../student.model';

export const findStudentConflicts = async () => {
	return await StudentModel.aggregate([
		{ $group: { _id: '$registration_number', count: { $sum: 1 } } }
	]);
};

export const findPaymentConflicts = async () => {
	const conflicts = await paymentModel.aggregate([
		{
			$group: {
				_id: {
					studentId: '$studentId',
					payId: '$payId'
				},
				count: { $sum: 1 },
				documents: { $push: '$_id' }
			}
		},
		{
			$match: {
				count: { $gt: 1 }
			}
		}
	]);

	return conflicts;
};
