/** Time unit type for duration strings */
export type TimeUnit =
	| 's'
	| 'sec'
	| 'm'
	| 'min'
	| 'mins'
	| 'h'
	| 'hr'
	| 'hrs'
	| 'hours'
	| 'd'
	| 'day'
	| 'days'
	| 'w'
	| 'week'
	| 'weeks'
	| 'mo'
	| 'month'
	| 'months';

/**
 * Represents a time duration string in the format "number + unit"
 * @example "5min", "1hr", "2days"
 */
export type Duration = `${number}${TimeUnit}`;

/**
 * Converts a duration string or milliseconds number to milliseconds
 * @param input - Duration string (e.g., "5min", "1hr") or milliseconds number
 * @returns Number of milliseconds
 * @throws {Error} If the time format is invalid or unit is unsupported
 * @example
 * ```ts
 * convertToMilliseconds("5min") // returns 300000
 * convertToMilliseconds("1hr")  // returns 3600000
 * convertToMilliseconds(5000)   // returns 5000
 * ```
 */
export function convertToMilliseconds(input: Duration | number): number {
	if (typeof input === 'number') {
		return input; // Assuming the input number is already in milliseconds
	}

	const regex =
		/^(\d+)(m|min|mins|s|sec|h|hr|hrs|hours|d|day|days|w|week|weeks|mo|month|months)$/i;
	const match = input.match(regex);

	if (!match) {
		throw new Error('Invalid time format');
	}

	const value = parseInt(match[1], 10);
	const unit = match[2].toLowerCase() as TimeUnit;

	switch (unit) {
		case 's':
		case 'sec':
			return value * 1000; // seconds to milliseconds
		case 'm':
		case 'min':
		case 'mins':
			return value * 60 * 1000; // minutes to milliseconds
		case 'h':
		case 'hr':
		case 'hrs':
		case 'hours':
			return value * 60 * 60 * 1000; // hours to milliseconds
		case 'd':
		case 'day':
		case 'days':
			return value * 24 * 60 * 60 * 1000; // days to milliseconds
		case 'w':
		case 'week':
		case 'weeks':
			return value * 7 * 24 * 60 * 60 * 1000; // weeks to milliseconds
		case 'mo':
		case 'month':
		case 'months':
			return value * 30 * 24 * 60 * 60 * 1000; // months to milliseconds (approximation)
		default:
			throw new Error('Unsupported time unit');
	}
}

export function convertToSeconds(input: Duration | number): number {
	if (typeof input === 'number') {
		return input / 1000;
	}
	return convertToMilliseconds(input) / 1000;
}
