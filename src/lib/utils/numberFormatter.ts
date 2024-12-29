export function numberFormatter(
	value: number | undefined,
	options: {
		separator?: string;
		decimals?: number;
		fallback?: string;
		locale?: string;
	} = {}
): string {
	// Handle undefined/null cases
	if (value === undefined || value === null) {
		return options.fallback ?? '0';
	}

	const {
		separator = 'thousand',
		decimals = 2,
		fallback = '0',
		locale = 'en-US'
	} = options;

	try {
		// Convert to number if it's not already
		const num = Number(value);

		// Check if it's a valid number
		if (isNaN(num)) {
			return fallback;
		}

		// Use Intl.NumberFormat for thousand separator
		if (separator === 'thousand') {
			return new Intl.NumberFormat(locale, {
				minimumFractionDigits: decimals,
				maximumFractionDigits: decimals
			}).format(num);
		}

		// Safer number formatting without regex
		const parts = num.toFixed(decimals).split('.');
		const numberString = parts[0];
		const result = [];

		// Process digits from right to left
		for (let i = numberString.length - 1, count = 0; i >= 0; i--) {
			if (count === 3 && i !== 0) {
				result.unshift(separator);
				count = 0;
			}
			result.unshift(numberString[i]);
			count++;
		}

		return parts.length > 1
			? result.join('') + '.' + parts[1]
			: result.join('');
	} catch (error) {
		return fallback;
	}
}
