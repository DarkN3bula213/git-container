export async function proisifyFunction<T>(fn: () => Promise<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		fn().then(resolve).catch(reject);
	});
}

const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const numSet = '0123456789';

export function generateRandomString(length: number) {
	let result = '';
	for (let i = 0; i < length; i++) {
		result += charSet.charAt(Math.floor(Math.random() * charSet.length));
	}
	return result;
}

export const generateAlphaNum = (length: number) => {
	let result = '';
	for (let i = 0; i < length; i++) {
		result += numSet.charAt(Math.floor(Math.random() * numSet.length));
	}
	return result;
};
