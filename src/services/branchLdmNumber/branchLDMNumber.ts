import axios, { AxiosResponse } from "axios";

import Api from "../../app/api";
import AuthMiddleware from "../../middlewares/auth/auth";

import { getTokens } from "../../utils/authToken";




//----------------------------------------------------------------



export const createBranchLdmNumberAsync = async (
	data: any
): Promise<{ data: AxiosResponse } | boolean> => {
	const authResponse: boolean = await AuthMiddleware();
	const tokens = getTokens();

	if (authResponse && tokens) {
		try {
			let config = {
				method: 'post',
				maxBodyLength: Infinity,
				url: `${import.meta.env.VITE_BASE_URL}${
					Api.GetLdmSequenceAsync
				}`,
				headers: {
					Authorization: `Bearer ${tokens.accessToken}`,
				},
				data: data,
			};

			const response = await axios.request(config);
            console.log(response);
			return {
				data: response,
                
			};
		} catch (error: any) {
			return {
				data: error.response,
			};
		}
	} else {
		return false;
	}
};


export const updateBranchLdmAsync = async (
	data: any
): Promise<{ data: AxiosResponse } | boolean> => {
	const authResponse: boolean = await AuthMiddleware();
	const tokens = getTokens();

	if (authResponse && tokens) {
		try {
			let config = {
				method: 'post',
				maxBodyLength: Infinity,
				url: `${import.meta.env.VITE_BASE_URL}${
					Api.UpdateLdmSequenceAsync
				}`,
				headers: {
					Authorization: `Bearer ${tokens.accessToken}`,
				},
				data,
			};

			const response = await axios.request(config);

			return {
				data: response,
			};
		} catch (error: any) {
			return {
				data: error.response,
			};
		}
	} else {
		return false;
	}
};


export const getAllBranchLdmSequence = async (): Promise<
	{ data: AxiosResponse } | boolean
> => {
	const authResponse: boolean = await AuthMiddleware();
	const tokens = getTokens();

	if (authResponse && tokens) {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BASE_URL}${
					Api.getAllLdmSequencesAsync
				}`,
				{
					headers: {
						Authorization: `Bearer ${tokens.accessToken}`,
					},
				}
			);
			return {
				data: response,
			};
		} catch (error: any) {
			return {
				data: error.response,
			};
		}
	} else {
		return false;
	}
};