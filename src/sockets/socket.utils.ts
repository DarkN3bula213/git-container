export function calculateTimeSpent(startTime: Date): {
    time: string;
    endTime: Date;
    startTime: Date;
} {
    const endTime = new Date();

    // Ensure endTime is later than startTime
    if (endTime.getTime() <= startTime.getTime()) {
        throw new Error(
            'endTime is not later than startTime. Possible timing issue.'
        );
    }

    const timeSpentMs = endTime.getTime() - startTime.getTime(); // Duration in milliseconds
    const timeSpentSeconds = Math.floor(timeSpentMs / 1000);

    const hours = Math.floor(timeSpentSeconds / 3600);
    const minutes = Math.floor((timeSpentSeconds % 3600) / 60);
    const seconds = timeSpentSeconds % 60;

    const time = `${hours}h ${minutes}m ${seconds}s`;

    return {
        time,
        endTime,
        startTime
    };
}
