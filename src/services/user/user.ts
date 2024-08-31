import axios ,{AxiosResponse} from 'axios';

import Api from '../../app/api';
import { VerifyUserInterface } from './user.types';
import { setTokens } from '../../utils/authToken';

// -------------------------------------------------------------------------------------------


export const verifyUser = async (loginData: VerifyUserInterface) => {
    try {
        const response = await axios.post(`${import.meta.env.VITE_BASE_URL}${Api.VerifyUser}`,loginData);
        if (response.status === 200) {
			setTokens({
				accessToken: response.data.accessToken,
				accessTokenExpiry: response.data.accessTokenExpiry,
				
			});
		}
		
        return response;
		
    }
    catch (error: any) {
		return error.response;
	}
}
// -------------------------------------------------------------------------------------------

export const getCurrentTime = async (): Promise<{ data: AxiosResponse }> => {
	try {
		const response = await axios.get(
			`${import.meta.env.VITE_BASE_URL}${Api.GetCurrentTime}`
		);

		return {
			data: response,
		};
	} catch (error: any) {
		return {
			data: error.response,
		};
	}
};