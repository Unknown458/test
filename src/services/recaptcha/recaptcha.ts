// -------------------------------------------------------------------------------------------

import axios from 'axios';

import Api from '../../app/api';

// -------------------------------------------------------------------------------------------

export const verifyCaptcha = async (token: string) => {
	try {
		const response = await axios.post(
			`${Api.RecaptchaSiteVerify}?secret=${
				import.meta.env.VITE_RECAPTCHA_SECRET_KEY
			}&response=${token}`
		);
		return response.data.success;
	} catch (error: any) {
		return error.response;
	}
};

// -------------------------------------------------------------------------------------------
