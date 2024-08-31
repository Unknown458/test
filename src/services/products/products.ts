 // -----------------------------------------------------------------
 
 import axios, { AxiosResponse } from 'axios';

 import Api from '../../app/api';
 import AuthMiddleware from '../../middlewares/auth/auth';
 import { getTokens } from '../../utils/authToken';

// -----------------------------------------------------------------

export const insertProductAsync  = async (
    data: any
): Promise<{data: AxiosResponse} | boolean> => {
    const authResponse: boolean = await AuthMiddleware();
	const tokens = getTokens();
	
	if (authResponse && tokens && tokens.accessToken) {
    try {
        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${import.meta.env.VITE_BASE_URL}${Api.InsertProductAsync}`,
            headers: {
                Authorization: `Bearer ${tokens.accessToken}`,

            },
            data: data,
        };

        const response = await axios.request(config);

        return{
            data: response,
        };
    }
    catch (error: any) {
        return { 
            data: error.response,
        };
    }
}
else{
	return false;
}
};

// -------------------------------------------------------------------------------------------

export const updateProductAsync = async (
	data: any
): Promise<{ data: AxiosResponse } | boolean> => {
	const authResponse: boolean = await AuthMiddleware();
	const tokens = getTokens();
	
	if (authResponse && tokens && tokens.accessToken) {
		try {
			const config = {
				method: 'post',
				maxBodyLength: Infinity,
				url: `${import.meta.env.VITE_BASE_URL}${
					Api.UpdateProductAsync
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
	}
	else{
		return false;
	}
	
};

// -------------------------------------------------------------------------------------------

export const deleteProductAsync = async (
	productId: number
): Promise<{ data: AxiosResponse } | boolean> => {
	
	const authResponse: boolean = await AuthMiddleware();
	const tokens = getTokens();
	
	if (authResponse && tokens && tokens.accessToken ) {
		try {
			const response = await axios.delete(
				`${import.meta.env.VITE_BASE_URL}${
					Api.DeleteProductAsync
				}/${productId}`,
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
	}
	else{
		return false;
	}
	
};

// -----------------------------------------------------------------------------

export const getAllProductsAsync = async (): Promise<
	{ data: AxiosResponse } | boolean
> => {
	const authResponse: boolean = await AuthMiddleware();
	const tokens = getTokens();
	
	if (authResponse && tokens && tokens.accessToken) {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BASE_URL}${
					Api.GetAllProductsAsync
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
	}
	else{
		return false
	}
	
};

// -------------------------------------------------------------------------------------

export const getProduct = async (): Promise<
	{ data: AxiosResponse } | boolean
> => {
	const authResponse: boolean = await AuthMiddleware();
	const tokens = getTokens();
	
	if (authResponse && tokens && tokens.accessToken) {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BASE_URL}${Api.GetProduct}`,
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
	}
	else{
		return false;
	}
	
};

// ------------------------------------------------------


export const getRateTypeAsync = async (): Promise<
	{ data: AxiosResponse } | boolean
> => {
	const authResponse: boolean = await AuthMiddleware();
	const tokens = getTokens();

	if (authResponse && tokens && tokens.accessToken) {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BASE_URL}${Api.GetRateTypeAsync}`,
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