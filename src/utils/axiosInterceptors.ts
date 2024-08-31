// -------------------------------------------------------------------------------------------

import axios from 'axios';

// -------------------------------------------------------------------------------------------

let ongoingApiCalls = 0;

// -------------------------------------------------------------------------------------------

const incrementOngoingApiCalls = () => {
	ongoingApiCalls += 1;
};

const decrementOngoingApiCalls = () => {
	ongoingApiCalls -= 1;
};

// -------------------------------------------------------------------------------------------

const setupAxiosInterceptors = () => {
	axios.interceptors.request.use(
		(config) => {
			incrementOngoingApiCalls();
			return config;
		},
		(error) => {
			decrementOngoingApiCalls();
			return Promise.reject(error);
		}
	);

	axios.interceptors.response.use(
		(response) => {
			decrementOngoingApiCalls();
			return response;
		},
		(error) => {
			decrementOngoingApiCalls();
			return Promise.reject(error);
		}
	);
};

// -------------------------------------------------------------------------------------------

const hasOngoingApiCalls = () => ongoingApiCalls > 0;

// -------------------------------------------------------------------------------------------

export { setupAxiosInterceptors, hasOngoingApiCalls };

// -------------------------------------------------------------------------------------------
