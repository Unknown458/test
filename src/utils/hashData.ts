// -------------------------------------------------------------------------------------------

import CryptoJS from 'crypto-js';

// -------------------------------------------------------------------------------------------

const hashData = (data: string): string => {
	const hashedData = CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
	return hashedData;
};

// -------------------------------------------------------------------------------------------

export default hashData;

// -------------------------------------------------------------------------------------------
