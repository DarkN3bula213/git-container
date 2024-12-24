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

export function svgToBase64(svgString: string) {
	return Buffer.from(svgString).toString('base64');
}

export const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M12 14.373q-.161 0-.298-.053t-.267-.184L7.046 9.749q-.14-.14-.15-.344t.15-.363t.354-.16t.354.16L12 13.287l4.246-4.246q.14-.141.345-.15q.203-.01.363.15q.16.159.16.353t-.16.354l-4.389 4.389q-.13.13-.267.183q-.136.053-.298.053"/></svg>`;
