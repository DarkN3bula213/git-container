export function numberFormatter(
	value: number | undefined,
	options: {
		separator?: 'thousand' | string;
		decimals?: number;
		fallback?: string;
		locale?: string;
	} = {}
): string {
	// Handle undefined/null cases
	if (value === undefined || value === null) {
		return options.fallback || '0';
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

		// Custom separator logic
		const parts = num.toFixed(decimals).split('.');
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
		return parts.join('.');
	} catch (error) {
		return fallback;
	}
}
