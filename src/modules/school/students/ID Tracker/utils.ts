import { IDTrackerModel, IIDTracker } from './idTracker.model';
import dayjs from 'dayjs';

export const generateUniqueId = async (): Promise<string> => {
    const today = dayjs().format('YYMMDD');
    const update = {
        $setOnInsert: { date: today, checkDigit: 0 },
        $inc: { lastSequence: 1 }
    };
    const options = {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        returnOriginal: false
    };

    const updatedDoc = await IDTrackerModel.findOneAndUpdate(
        { date: today },
        update,
        options
    );

    // Ensure the document and necessary properties exist
    if (!updatedDoc) {
        throw new Error('Failed to update ID tracker document.');
    }

    // Destructure with type assertion
    const { lastSequence, checkDigit } = updatedDoc as IIDTracker;

    let sequenceStr = String(lastSequence).padStart(2, '0');
    let finalCheckDigit = checkDigit;

    // Reset sequence and increment check digit if sequence exceeds 99
    if (lastSequence > 99) {
        finalCheckDigit = (checkDigit + 1) % 10;
        await IDTrackerModel.findOneAndUpdate(
            { date: today },
            {
                $set: {
                    lastSequence: 1,
                    checkDigit: finalCheckDigit
                }
            }
        );
        sequenceStr = '00'; // Reset sequence string for ID
    }

    return `${today}-${finalCheckDigit}-${sequenceStr}`;
};
