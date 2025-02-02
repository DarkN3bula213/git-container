// workbook.service.ts
import { User, UserModel } from '@/modules/auth/users/user.model';
import { Style, Workbook, Worksheet } from 'exceljs';
import fs from 'fs';

// types.ts
export interface ColumnConfig<T> {
	key: keyof T; // The key in the data object
	label: string; // The column header label
	width?: number; // Optional column width
	format?: (value: any) => string | number; // Optional formatter for the cell value
	style?: Partial<Style>; // Optional style for the column
}

export interface WorkbookOptions<T> {
	title: string; // Title of the worksheet
	heading: string; // Main heading
	subHeading: string; // Subheading
	columnConfig: ColumnConfig<T>[]; // Configuration for columns
}

export class WorkbookService {
	/**
	 * Generates an Excel workbook from provided data.
	 * @param data - The data to populate the worksheet.
	 * @param options - Workbook options including title, headings, and column config.
	 * @returns A buffer containing the Excel file.
	 */
	public async generateWorkbook<T>(
		data: T[],
		options: WorkbookOptions<T>
	): Promise<Buffer> {
		const { title, heading, subHeading, columnConfig } = options;

		// Create a new workbook and worksheet
		const workbook = new Workbook();
		const worksheet = workbook.addWorksheet(title);

		// Calculate the number of columns
		const numberOfColumns = columnConfig.length;

		// Add title, heading, and subheading
		this.addTitle(worksheet, title, numberOfColumns);
		this.addHeading(worksheet, heading, numberOfColumns);
		this.addSubHeading(worksheet, subHeading, numberOfColumns);

		// Add headers
		this.addHeaders(worksheet, columnConfig);

		// Add data rows
		this.addDataRows(worksheet, data, columnConfig);

		// Generate the Excel file as a buffer
		const buffer = await workbook.xlsx.writeBuffer();
		return buffer as Buffer;
	}

	/**
	 * Adds a title row to the worksheet.
	 */
	private addTitle(
		worksheet: Worksheet,
		title: string,
		numberOfColumns: number
	): void {
		const titleRow = worksheet.addRow([title]);
		titleRow.font = { size: 16, bold: true };
		worksheet.mergeCells(
			`A1:${String.fromCharCode(64 + numberOfColumns)}1`
		); // Merge cells for the title
	}

	/**
	 * Adds a heading row to the worksheet.
	 */
	private addHeading(
		worksheet: Worksheet,
		heading: string,
		numberOfColumns: number
	): void {
		const headingRow = worksheet.addRow([heading]);
		headingRow.font = { size: 14, bold: true };
		worksheet.mergeCells(
			`A2:${String.fromCharCode(64 + numberOfColumns)}2`
		); // Merge cells for the heading
	}

	/**
	 * Adds a subheading row to the worksheet.
	 */
	private addSubHeading(
		worksheet: Worksheet,
		subHeading: string,
		numberOfColumns: number
	): void {
		const subHeadingRow = worksheet.addRow([subHeading]);
		subHeadingRow.font = { size: 12, bold: true };
		worksheet.mergeCells(
			`A3:${String.fromCharCode(64 + numberOfColumns)}3`
		); // Merge cells for the subheading
	}

	/**
	 * Adds headers to the worksheet based on the column config.
	 */
	private addHeaders<T>(
		worksheet: Worksheet,
		columnConfig: ColumnConfig<T>[]
	): void {
		const headers = columnConfig.map((config) => config.label);
		const headerRow = worksheet.addRow(headers);
		headerRow.font = { bold: true };

		// Set column widths and styles
		columnConfig.forEach((config, index) => {
			const column = worksheet.getColumn(index + 1);
			column.width = config.width || 20;

			// Apply custom style to the column if provided
			if (config.style) {
				column.eachCell({ includeEmpty: true }, (cell) => {
					Object.assign(cell, config.style);
				});
			}
		});
	}

	/**
	 * Adds data rows to the worksheet.
	 */
	private addDataRows<T>(
		worksheet: Worksheet,
		data: T[],
		columnConfig: ColumnConfig<T>[]
	): void {
		data.forEach((item) => {
			const row = columnConfig.map((config) => {
				const value = (item as any)[config.key]; // Access the value using the key
				return config.format ? config.format(value) : value;
			});
			worksheet.addRow(row);
		});
	}
}

/**
 * app.get('/export-users', async (req, res) => {
    try {
        const options = {
            title: 'User Report',
            heading: 'User Data',
            subHeading: 'Generated on ' + new Date().toLocaleDateString(),
            columnConfig: [
                { key: 'name', label: 'Name', width: 25 },
                { key: 'email', label: 'Email', width: 30 },
                { key: 'age', label: 'Age', width: 10 },
            ],
        };

        const buffer = await workbookService.generateWorkbook<User>(UserModel, options);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error('Error generating workbook:', error);
        res.status(500).send('Internal Server Error');
    }
});
 */

export const exportToExcelTest = async () => {
	const workbookService = new WorkbookService();
	try {
		const users = await UserModel.find().exec();

		// Define the workbook options
		const options = {
			title: 'User Report',
			heading: 'User Data',
			subHeading: 'Generated on ' + new Date().toLocaleDateString(),
			columnConfig: [
				{ key: 'name', label: 'Name', width: 25 },
				{ key: 'email', label: 'Email', width: 30 },
				{ key: 'username', label: 'Username', width: 30 },
				{ key: 'role', label: 'Role', width: 30 },
				{ key: 'createdAt', label: 'Created At', width: 30 },
				{ key: 'updatedAt', label: 'Updated At', width: 30 }
				// Omit the 'age' field by not including it in the columnConfig
			]
		} as WorkbookOptions<User>;

		// Generate the workbook
		const buffer = await workbookService.generateWorkbook(users, options);
		fs.writeFileSync('users.xlsx', buffer);
	} catch (error) {
		console.error('Error generating workbook:', error);
		throw error;
	}
};
