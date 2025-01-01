import colors from 'colors';
import dayjs from 'dayjs';
import winston from 'winston';

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
