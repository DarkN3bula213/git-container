import { withTransaction } from '@/data/database/db.utils';
import { BadRequestError, NotFoundError } from '@/lib/api';
import { Logger } from '@/lib/logger';
import ClassModel from '@/modules/school/classes/class.model';
import paymentModel from '@/modules/school/payments/payment.model';
import {
	Student,
	StudentDocument
} from '@/modules/school/students/student.interface';
import StudentModel from '@/modules/school/students/student.model';
import { Types } from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';

const logger = new Logger(__filename);

// Define the student document storage path
const STUDENT_DOCS_PATH = path.join('uploads', 'students');

// Ensure directories exist for uploads
const ensureDirectoryExists = (directory: string) => {
	if (!fs.existsSync(directory)) {
		fs.mkdirSync(directory, { recursive: true });
	}
};

// Make sure the student documents directory exists
ensureDirectoryExists(STUDENT_DOCS_PATH);

class Service {
	private static instance: Service;
	constructor(
		private student: typeof StudentModel,
		private classModel: typeof ClassModel,
		private feeDocument: typeof paymentModel
	) {}
	static getInstance() {
		if (!Service.instance) {
			Service.instance = new Service(
				StudentModel,
				ClassModel,
				paymentModel
			);
		}
		return Service.instance;
	}

	/**
	 * Add a document to a student record
	 */
	async addStudentDocument(
		studentId: string,
		file: Express.Multer.File,
		documentType: 'id' | 'certificate' | 'photo' | 'other' | 'application',
		description?: string
	): Promise<Student> {
		return withTransaction(async (session) => {
			// Ensure the student exists
			const student = await this.student
				.findById(studentId)
				.session(session);
			if (!student) {
				throw new BadRequestError('Student not found');
			}

			// Get current year for folder organization
			const currentYear = new Date().getFullYear();
			const studentFolder = `${student.name}-${student.registration_no}`;

			// Create organized directory structure: className-section-year/studentId
			const classFolder = `${student.className}-${student.section}-${currentYear}`;
			const studentDir = path.join(
				STUDENT_DOCS_PATH,
				classFolder,
				studentFolder
			);
			ensureDirectoryExists(studentDir);

			// Define the file path using document type and timestamp for better organization
			const fileName = `${documentType}-${Date.now()}${path.extname(file.originalname)}`;
			const filePath = path.join(studentDir, fileName);

			// Move the file from temporary location to permanent storage
			fs.renameSync(file.path, filePath);

			// Create the document record without explicit _id (MongoDB will generate it)
			const newDocument = {
				fileName,
				originalName: file.originalname,
				fileType: file.mimetype,
				filePath,
				fileSize: file.size,
				uploadDate: new Date(),
				documentType,
				description,
				exists: true
			};

			// Add the document to the student's documents array
			const updatedStudent = await this.student.findByIdAndUpdate(
				studentId,
				{ $push: { documents: newDocument } },
				{ new: true, runValidators: true, session }
			);

			if (!updatedStudent) {
				throw new BadRequestError('Failed to update student record');
			}

			return updatedStudent;
		});
	}

	/**
	 * Get all documents for a student
	 */
	async getStudentDocuments(studentId: string): Promise<StudentDocument[]> {
		const student = await this.student.findById(studentId).exec();
		if (!student) {
			throw new BadRequestError('Student not found');
		}

		// Check if files physically exist and add exists flag
		if (student.documents && student.documents.length > 0) {
			for (const doc of student.documents) {
				doc.exists = fs.existsSync(doc.filePath);
			}
		}

		// Cast documents array to StudentDocument[] type
		const documents = student.documents || ([] as StudentDocument[]);
		return documents;
	}

	/**
	 * Get a specific document by ID
	 */
	async getStudentDocumentById(
		studentId: string,
		documentId: string
	): Promise<StudentDocument> {
		const student = await this.student.findById(studentId).exec();
		if (!student) {
			throw new BadRequestError('Student not found');
		}

		const document = student.documents?.find(
			(doc) => doc._id?.toString() === documentId
		);
		if (!document) {
			throw new BadRequestError('Document not found');
		}

		// Check if the file physically exists
		document.exists = fs.existsSync(document.filePath);

		return document;
	}
	/**
	 * Delete a student document
	 */
	async deleteStudentDocument(
		studentId: string,
		documentId: string
	): Promise<Student> {
		return withTransaction(async (session) => {
			// Find the student and document
			const student = await this.student.findById(studentId, { session });
			if (!student) {
				throw new BadRequestError('Student not found');
			}

			const document = student.documents?.find(
				(doc) => doc._id === documentId
			);
			if (!document) {
				throw new BadRequestError('Document not found');
			}

			// Delete the file
			if (fs.existsSync(document.filePath)) {
				fs.unlinkSync(document.filePath);
			}

			// Remove the document from the student record
			const updatedStudent = await this.student.findByIdAndUpdate(
				studentId,
				{ $pull: { documents: { documentId } } },
				{ new: true }
			);

			if (!updatedStudent) {
				throw new BadRequestError('Failed to update student record');
			}

			return updatedStudent;
		});
	}
	async getDownloadableDocument(
		studentId: string,
		documentId: string
	): Promise<{ document: StudentDocument; buffer: Buffer }> {
		const document = await this.getStudentDocumentById(
			studentId,
			documentId
		);

		// Check if file exists
		if (!fs.existsSync(document.filePath)) {
			// Clean up zombie entry
			await this.cleanupZombieDocument(studentId, documentId);
			throw new NotFoundError('Document file not found on the server');
		}

		// Read the file into a buffer
		const buffer = fs.readFileSync(document.filePath);
		return { document, buffer };
	}
	/*<!------------------------------------( Cleanup Zombie Document )------------------------------------>*/
	async cleanupZombieDocument(
		studentId: string,
		documentId: string
	): Promise<Student | null> {
		// Only remove the document entry from the database, don't try to delete the file
		const updatedStudent = await this.student.findByIdAndUpdate(
			studentId,
			{ $pull: { documents: { _id: new Types.ObjectId(documentId) } } },
			{ new: true }
		);

		return updatedStudent;
	}
	/*<!------------------------------------( Cleanup Zombie Document )------------------------------------>*/
	async scanAndCleanupZombieDocuments(studentId: string): Promise<{
		cleanedCount: number;
		student: Student;
	}> {
		const student = await this.student.findById(studentId);
		if (!student) {
			throw new BadRequestError('Student not found');
		}

		let cleanedCount = 0;
		const documentsToKeep = [];

		// Check each document
		if (student.documents && student.documents.length > 0) {
			logger.info({
				studentId,
				documents: student.documents.length
			});
			for (const doc of student.documents) {
				logger.info({
					docId: doc._id,
					filePath: doc.filePath
				});
				if (fs.existsSync(doc.filePath)) {
					documentsToKeep.push(doc);
				} else {
					cleanedCount++;
				}
			}
			logger.info({
				cleanedCount,
				documentsToKeep: documentsToKeep.length
			});
		}

		// Update student record with only valid documents
		if (cleanedCount > 0) {
			logger.info({
				documentsToKeep: documentsToKeep.length
			});
			student.documents = documentsToKeep;
			await student.save();
		}

		return { cleanedCount, student };
	}
}

export const studentDocumentService = new Service(
	StudentModel,
	ClassModel,
	paymentModel
);
