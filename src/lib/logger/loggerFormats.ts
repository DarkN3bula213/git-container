import colors from 'colors';
import dayjs from 'dayjs';
import { inspect } from 'util';
import winston, { format } from 'winston';

colors.setTheme({
	info: 'black',
	warn: 'yellow',
	error: 'red',
	debug: 'blue',
	timestampBg: 'bgCyan',
	infoMessage: 'white',
	warnMessage: 'cyan',
	errorMessage: 'magenta',
	debugMessage: 'blue'
});

const levelColors: Record<string, string> = {
	info: 'yellow',
	warn: 'cyan',
	error: 'red',
	debug: 'blue'
};

export const customTimestampFormat = winston.format((info) => {
	info.timestamp = dayjs().format('| [+] | MM-DD HH:mm:ss');
	return info;
})();

export const customPrintf = winston.format.printf((info) => {
	const timestamp = colors.grey(info.timestamp);
	const levelColor = levelColors[info.level] || 'white';
	const messageColor = (colors as any)[`${info.level}Message`];
	const level = (colors as any)[levelColor](info.level.toUpperCase());
	const message = messageColor ? messageColor(info.message) : info.message;

	return `${timestamp} [${level}]: ${message}`;
});

const sanitizeStack = (stack: any[]) => {
	try {
		let sanitizedStack = stack;

		if (stack && stack.length) {
			sanitizedStack = stack.map((error) => {
				return error;
			});
		}

		return inspect(sanitizedStack);
	} catch (e: any) {
		return e.stack;
	}
};

export const jsonFormat = format.printf((info) => {
	const logData = {
		level: info.level,
		timestamp: new Date().toLocaleString(),
		context: info.context,
		message: info.message,
		stack: sanitizeStack(info.stack)
	};
	return JSON.stringify(logData);
});

export const prettyFormat = format.printf((info) => {
	const separator = ' | ';
	const timestamp = new Date().toLocaleString();
	const { level, context, message, stack } = info;

	const logData = [
		timestamp,
		`${level}`.toUpperCase(),
		context,
		message,
		{ stack: sanitizeStack(stack) }
	];
	return logData.join(separator);
});
const getFormattedTimestamp = () => {
	const timestamp =
		new Date().toLocaleString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: 'numeric',
			hour12: false,
			timeZone: 'Asia/Karachi'
		}) + `.${new Date().getMilliseconds().toString().padStart(3, '0')}`;
	return colors.gray(`| + | ${timestamp}`);
};
export const formatObject = (scope: string, obj: object) => {
	const timestamp = getFormattedTimestamp();
	const prefix = `${timestamp} ${colors.cyan(':----:')}`;
	const lines = Object.entries(obj).map(([key, value]) => {
		const coloredKey = colors.dim(key);
		const line = `${prefix} ${coloredKey}: ${value}`;
		return line;
	});
	return '\n' + lines.join('\n');
};
