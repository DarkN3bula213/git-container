import { DocumentMimeTypes } from '@/lib/api';

/**
 * Checks if a given MIME type belongs to a specific category
 */
export const isMimeType = {
	image: (mimeType: string) => {
		return (
			DocumentMimeTypes.IMAGE.includes(mimeType as any) ||
			mimeType.startsWith('image/')
		);
	},
	pdf: (mimeType: string) => mimeType === DocumentMimeTypes.PDF,
	spreadsheet: (mimeType: string) =>
		mimeType === DocumentMimeTypes.XLSX ||
		mimeType === DocumentMimeTypes.CSV,
	json: (mimeType: string) => mimeType === DocumentMimeTypes.JSON
};

/**
 * Gets the standardized MIME type for a given file type
 * Falls back to the original MIME type if no standard version exists
 */
export const getStandardMimeType = (mimeType: string): string => {
	if (isMimeType.image(mimeType)) {
		return DocumentMimeTypes.IMAGE[0]; // Default to PNG for images
	}
	if (isMimeType.pdf(mimeType)) {
		return DocumentMimeTypes.PDF;
	}
	if (isMimeType.spreadsheet(mimeType)) {
		return DocumentMimeTypes.XLSX;
	}
	if (isMimeType.json(mimeType)) {
		return DocumentMimeTypes.JSON;
	}
	return mimeType;
};
