import bwipjs from 'bwip-js';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import { BadRequestError } from '@/lib/api';
import { config } from '@/lib/config';

export const generateBarcode = (
  studentId: string,
  paymentId: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const barcodeText = `${studentId}_${paymentId}`; // Compact string encoding

    bwipjs.toBuffer(
      {
        bcid: 'code128', // Barcode type
        text: barcodeText, // Text to encode
        scale: 3, // 3x scaling factor
        height: 10, // Bar height, in millimeters
        includetext: true, // Show human-readable text
        textxalign: 'center', // Align text center
        backgroundcolor: 'FFFFFF', // White background
        barcolor: '000000', // Black bars (you can change this to match your theme)
      },
      (err: any, png: Buffer) => {
        if (err) {
          return reject(
            new Error(`Failed to generate barcode: ${err.message}`),
          );
        }
        // Convert the binary buffer to a base64-encoded string with the correct prefix
        const barcodeBase64 = `data:image/png;base64,${png.toString('base64')}`;
        resolve(barcodeBase64);
      },
    );
  });
};

/**
 * Generates a QR code containing a JWT token with student and invoice details.
 * @param {string} studentId - The ID of the student.
 * @param {string} invoiceId - The ID of the invoice.
 * @returns {Promise<string>} - The generated QR code as a base64 image.
 */
export const generateQRCode = async (
  studentId: string,
  invoiceId: string,
): Promise<string> => {
  const token = jwt.sign(
    { studentId, invoiceId },
    config.tokens.jwtSecret,
    // Removed the expiresIn option to ensure token validity without expiration
  );

  const url = `https://hps-admin.com/invoice/verify?token=${token}`;

  try {
    const qrCodeUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
    }); // Generate QR as base64
    return qrCodeUrl;
  } catch (err: any) {
    throw new BadRequestError('Error generating QR code');
  }
};
