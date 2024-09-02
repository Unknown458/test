// -------------------------------------------------------------------------------------------

import axios, { AxiosResponse } from 'axios';

import Api from '../../app/api';
import AuthMiddleware from '../../middlewares/auth/auth';
import { getTokens } from '../../utils/authToken';

// -------------------------------------------------------------------------------------------

export const getNextCashMemoNoAsync = async (
	branchId: any
): Promise<{ data: AxiosResponse } | boolean> => {
	const authResponse: boolean = await AuthMiddleware();
	const tokens = getTokens();

	if (authResponse && tokens) {
		try {
			let config = {
				method: 'get',
				maxBodyLength: Infinity,
				url: `${import.meta.env.VITE_BASE_URL}${
					Api.GetNextCashMemoNoAsync
				}/${branchId}`,
				headers: {
					Authorization: `Bearer ${tokens.accessToken}`,
				},
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

export const createCashMemoAsync = async (
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
					Api.CreateCashMemoAsync
				}`,
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

export const updateCashMemoAsync = async (
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
					Api.UpdateCashMemoAsync
				}`,
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

export const deleteCashMemoAsync = async (
	cashMemoId: number,
	branchId: number
): Promise<{ data: AxiosResponse } | boolean> => {
	const authResponse: boolean = await AuthMiddleware();
	const tokens = getTokens();

	if (authResponse && tokens) {
		try {
			let config = {
				method: 'delete',
				maxBodyLength: Infinity,
				url: `${import.meta.env.VITE_BASE_URL}${
					Api.DeleteCashMemoAsync
				}/${cashMemoId}/${branchId}`,
				headers: {
					Authorization: `Bearer ${tokens.accessToken}`,
				},
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

export const getCashMemoByCashMemoNoAsync = async (
	cashMemoNo: number,
	branchId: number
): Promise<{ data: AxiosResponse } | boolean> => {
	const authResponse: boolean = await AuthMiddleware();
	const tokens = getTokens();

	if (authResponse && tokens) {
		try {
			let config = {
				method: 'get',
				maxBodyLength: Infinity,
				url: `${import.meta.env.VITE_BASE_URL}${
					Api.GetCashMemoByCashMemoNoAsync
				}/${cashMemoNo}/${branchId}`,
				headers: {
					Authorization: `Bearer ${tokens.accessToken}`,
				},
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

export const getCashMemoByLRNumberAsync = async (
	lrNumber: number,
	branchId: number
): Promise<{ data: AxiosResponse } | boolean> => {
	const authResponse: boolean = await AuthMiddleware();
	const tokens = getTokens();

	if (authResponse && tokens) {
		try {
			let config = {
				method: 'get',
				maxBodyLength: Infinity,
				url: `${import.meta.env.VITE_BASE_URL}${
					Api.GetCashMemoByLRNumberAsync
				}/${lrNumber}/${branchId}`,
				headers: {
					Authorization: `Bearer ${tokens.accessToken}`,
				},
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
