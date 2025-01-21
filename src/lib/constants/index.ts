/* eslint-disable no-useless-escape */
import path from 'node:path';

// First, export constants that don't depend on config
export const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

// Create a function to get environment-dependent values
// export const getEnvironmentConstants = () => {
// 	// eslint-disable-next-line @typescript-eslint/no-var-requires
// 	const { config } = require('../config/config');

// 	return {
// 		// Put your environment-dependent constants here
// 		isDevelopment: config?.isDevelopment,
// 		isProduction: config?.isProduction
// 		// ... other config-dependent values
// 	};
// };

export * from './roles';

const STORAGE_BASE_PATH = 'uploads';

export const documentsPath = path.join(STORAGE_BASE_PATH, 'documents');
export const imagesPath = path.join(STORAGE_BASE_PATH, 'images');

// List of image file extensions
export const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

export const getUploadsDir = () => {
	const currentDir = process.cwd();
	return path.join(currentDir, 'uploads');
};

export const banner = `
__/\\\\\\________/\\\\\\__/\\\\\\\\\\\\\\\\\\\\\_______/\\\\\\\\\\\\\\___        
 _\\/\\\\\\_______\\/\\\\\\_\\/\\\\\\/////////\\\\\\___/\\\\\\/////////\\\\\\_       
  _\\/\\\\\\_______\\/\\\\\\_\\/\\\\\\_______\\/\\\\\\__\\//\\\\\\______\\///__      
   _\\/\\\\\\\\\\\\\\\\\\\\\\\\\\_\\/\\\\\\\\\\\\\\\\\\\\\\\\/____\\////\\\\\\_________ 
    _\\/\\\\\\/////////\\\\\\_\\/\\\\\\/////////_________\\////\\\\\\______
     _\\/\\\\\\_______\\/\\\\\\_\\/\\\\\\_____________________\\////\\\\\\___ 
      _\\/\\\\\\_______\\/\\\\\\_\\/\\\\\\______________/\\\\\\______\\//\\\\\\__  
       _\\/\\\\\\_______\\/\\\\\\_\\/\\\\\\_____________ \\///\\\\\\\\\\\\\\\\\\/___
        _\\///________\\///__\\///________________\\///////////_____
`;

export const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// Get time in Pakistan
export const pkTime = new Intl.DateTimeFormat('en-US', {
	timeZone: 'Asia/Karachi',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hour12: false
}).format(new Date());

// export const serverInitLog = {
// 	port: config.app.port,
// 	app: banner,
// 	date: format(new Date(), 'PPP'),
// 	timeZone: timeZone,
// 	pkTime: pkTime,
// 	mode: config.production ? 'Production' : 'Development'
// };
