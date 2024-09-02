// -------------------------------------------------------------------------------------------

import CryptoJS from 'crypto-js';

// -------------------------------------------------------------------------------------------

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;

// -------------------------------------------------------------------------------------------

export const encryptData = (data: string): string => {
	const encryptedData = CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
	return encryptedData;
};

// -------------------------------------------------------------------------------------------

export const decryptData = (encryptedData: string): string => {
	const decryptedData = CryptoJS.AES.decrypt(
		encryptedData,
		SECRET_KEY
	).toString(CryptoJS.enc.Utf8);
	return decryptedData;
};

// -------------------------------------------------------------------------------------------
