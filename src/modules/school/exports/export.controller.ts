import { SuccessResponse } from '@/lib/api/ApiResponse';
import { DocumentMimeTypes } from '@/lib/api/ApiResponse';
import { DocumentResponse } from '@/lib/api/ApiResponse';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { sortStudents } from '@/lib/utils/sortStudents';
import { WorkbookOptions, WorkbookService } from '@/services/data-export/excel';
import { Student } from '../students/student.interface';
import StudentModel from '../students/student.model';
import { studentExportOptions } from './export.utils';

/*<!-- 1. Excel Export ----------------------------( Get xlsx results )>*/
export const getXlsxResults = asyncHandler(async (req, res) => {
	const download = true;
	const workbookService = new WorkbookService();
	const data = await StudentModel.find().exec();
	const sortedData = sortStudents(data);
	const options = {
		title: 'Student Record',
		heading: 'List of enrolled students',
		subHeading: 'Student list for the current academic year',
		columnConfig: studentExportOptions
	} as WorkbookOptions<Student>;
	if (download) {
		const excelBuffer = await workbookService.generateWorkbook(
			sortedData,
			options
		);

		new DocumentResponse(
			excelBuffer,
			'students.xlsx',
			DocumentMimeTypes.XLSX
		).send(res);
	} else {
		new SuccessResponse('Students fetched successfully', data).send(res);
	}
});
/*---------------------------------------------------------------------- */
