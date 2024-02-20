export function convertToMilliseconds(input: string | number): number {
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
  const unit = match[2].toLowerCase();

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
