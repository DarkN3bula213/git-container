import { DocumentResponse, SuccessResponse } from '@/lib/api';
import { fileUpload } from '@/lib/config/multer';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger';
import { getStandardMimeType } from '@/lib/utils/mimeTypes';
import { studentDocumentService } from '../services/document.service';
import { Student, StudentDocument } from '../student.interface';
import StudentModel from '../student.model';

const logger = new Logger(__filename);

export const uploadStudentDocument = asyncHandler(async (req, res) => {
	const { studentId } = req.params;
	const { documentType, description } = req.body;

	logger.info({
		studentId,
		documentType,
		description
	});

	// Validate document type
	if (!['id', 'certificate', 'photo', 'other'].includes(documentType)) {
		return res.status(400).json({
			status: 'error',
			message: 'Invalid document type'
		});
	}

	// Check if file exists
	if (!req.file) {
		return res.status(400).json({
			status: 'error',
			message: 'No file uploaded'
		});
	}

	// Add the document to the student record
	const student = await studentDocumentService.addStudentDocument(
		studentId,
		req.file,
		documentType as StudentDocument['documentType'],
		description
	);

	new SuccessResponse('Document uploaded successfully', student).send(res);
});
/*<!-- Student Documents ----------------------------( getStudentDocuments )*/
export const getStudentDocuments = asyncHandler(async (req, res) => {
	const { studentId } = req.params;

	const documents =
		await studentDocumentService.getStudentDocuments(studentId);

	new SuccessResponse(
		'Student documents fetched successfully',
		documents
	).send(res);
});

/*<!-- Download Student Document ----------------------------( downloadStudentDocument )*/

export const downloadStudentDocument = asyncHandler(async (req, res) => {
	const { studentId, documentId } = req.params;

	const { document, buffer } =
		await studentDocumentService.getDownloadableDocument(
			studentId,
			documentId
		);
	return new DocumentResponse(
		buffer,
		`${document.originalName}.${document.fileType.split('/')[1]}`,
		getStandardMimeType(document.fileType)
	).send(res);
});

/*<!-- Scan and Clean Zombie Documents ----------------------------( scanZombieDocuments )*/
export const scanZombieDocuments = asyncHandler(async (req, res) => {
	const { studentId } = req.params;

	const result =
		await studentDocumentService.scanAndCleanupZombieDocuments(studentId);

	new SuccessResponse(
		`Scanned student documents. Removed ${result.cleanedCount} zombie entries.`,
		result
	).send(res);
});

/*<!-- Scan and Clean All Zombie Documents ----------------------------( scanAllZombieDocuments )*/
export const cleanAllZombieDocuments = asyncHandler(async (req, res) => {
	const students: Student[] = await StudentModel.find({
		documents: { $exists: true }
	});

	const cleanedCount = [];
	for (const student of students) {
		const result =
			await studentDocumentService.scanAndCleanupZombieDocuments(
				student._id?.toString() || ''
			);
		cleanedCount.push(result.cleanedCount);
	}
	logger.info({
		cleanedCount
	});

	new SuccessResponse(
		'All zombie documents scanned and cleaned',
		students
	).send(res);
});

/*<!-- Delete Student Document ----------------------------( deleteStudentDocument )*/
export const deleteStudentDocument = asyncHandler(async (req, res) => {
	const { studentId, documentId } = req.params;

	const student = await studentDocumentService.deleteStudentDocument(
		studentId,
		documentId
	);

	new SuccessResponse('Document deleted successfully', student).send(res);
});

// Upload middleware for student documents
export const studentDocUpload = fileUpload.single('file');
