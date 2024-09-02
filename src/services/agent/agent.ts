// -------------------------------------------------------------------------------------------

import axios, { AxiosResponse } from 'axios';

import Api from '../../app/api';
import AuthMiddleware from '../../middlewares/auth/auth';
import { getTokens } from '../../utils/authToken';

// -------------------------------------------------------------------------------------------

export const createAgentAsync = async (
	data: any
): Promise<{ data: AxiosResponse } | boolean> => {
	const authResponse: boolean = await AuthMiddleware();
	const tokens = getTokens();

	if (authResponse && tokens) {
		try {
			let config = {
				method: 'post',
				maxBodyLength: Infinity,
				url: `${import.meta.env.VITE_BASE_URL}${Api.CreateAgentAsync}`,
				headers: {
					Authorization: `Bearer ${tokens.accessToken}`,
				},
				data: data,
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

// -------------------------------------------------------------------------------------------

export const deleteAgentAsync = async (
	articleShapeId: number
): Promise<{ data: AxiosResponse } | boolean> => {
	const authResponse: boolean = await AuthMiddleware();
	const tokens = getTokens();

	if (authResponse && tokens) {
		try {
			const response = await axios.delete(
				`${import.meta.env.VITE_BASE_URL}${
					Api.DeleteAgentAsync
				}/${articleShapeId}`,
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

// -------------------------------------------------------------------------------------------

export const getAllAgentsAsync = async (): Promise<
	{ data: AxiosResponse } | boolean
> => {
	const authResponse: boolean = await AuthMiddleware();
	const tokens = getTokens();

	if (authResponse && tokens) {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BASE_URL}${Api.GetAllAgentsAsync}`,
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

// -------------------------------------------------------------------------------------------

export const getAllActiveAgentsAsync = async (): Promise<
	{ data: AxiosResponse } | boolean
> => {
	const authResponse: boolean = await AuthMiddleware();
	const tokens = getTokens();

	if (authResponse && tokens) {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BASE_URL}${
					Api.GetAllActiveAgentsAsync
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

// -------------------------------------------------------------------------------------------

export const updateAgentAsync = async (
	data: any
): Promise<{ data: AxiosResponse } | boolean> => {
	const authResponse: boolean = await AuthMiddleware();
	const tokens = getTokens();

	if (authResponse && tokens) {
		try {
			let config = {
				method: 'post',
				maxBodyLength: Infinity,
				url: `${import.meta.env.VITE_BASE_URL}${Api.UpdateAgentAsync}`,
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

// -------------------------------------------------------------------------------------------
