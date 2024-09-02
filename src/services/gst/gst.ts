// -------------------------------------------------------------------------------------------

import axios from 'axios';

import Api from '../../app/api';

// -------------------------------------------------------------------------------------------

let authenticationCount: number = 0;
let myIpAddress: string = '';

// -------------------------------------------------------------------------------------------

const MASTERGST_CLIENT_ID = import.meta.env.VITE_MASTERGST_CLIENT_ID;
const MASTERGST_CLIENT_SECRET = import.meta.env.VITE_MASTERGST_CLIENT_SECRET;
const MASTERGST_GST_NO = import.meta.env.VITE_MASTERGST_GST_NO;
const MASTERGST_EMAIL = import.meta.env.VITE_MASTERGST_EMAIL;
const MASTERGST_USERNAME = import.meta.env.VITE_MASTERGST_USERNAME;
const MASTERGST_PASSWORD = import.meta.env.VITE_MASTERGST_PASSWORD;

// -------------------------------------------------------------------------------------------

const getMyIpAddress = async (): Promise<string> => {
	if (myIpAddress !== '') return myIpAddress;

	try {
		const response = await axios.get(`${Api.GetMyIpAddress}`);
		myIpAddress = response.data;
		return myIpAddress;
	} catch (error: any) {
		alert('Something went wrong!');
		return '';
	}
};

// -------------------------------------------------------------------------------------------

export const mastergstAuthentication = async () => {
	try {
		const response = await axios.get(
			`${Api.MastergstAuthentication}?email=${MASTERGST_EMAIL}&username=${MASTERGST_USERNAME}&password=${MASTERGST_PASSWORD}`,
			{
				headers: {
					ip_address: await getMyIpAddress(),
					client_id: MASTERGST_CLIENT_ID,
					client_secret: MASTERGST_CLIENT_SECRET,
					gstin: MASTERGST_GST_NO,
				},
			}
		);

		if (response.data.status_cd === '1') {
			authenticationCount = 0;
		} else {
			authenticationCount++;
		}

		return {
			data: response,
		};
	} catch (error: any) {
		return {
			data: error.response,
		};
	}
};

// -------------------------------------------------------------------------------------------

export const getEwayBillDetails = async (ewayBillNumber: string) => {
	try {
		const response = await axios.get(
			`${Api.GetEwayBillDetails}?email=${MASTERGST_EMAIL}&ewbNo=${ewayBillNumber}`,
			{
				headers: {
					ip_address: await getMyIpAddress(),
					client_id: MASTERGST_CLIENT_ID,
					client_secret: MASTERGST_CLIENT_SECRET,
					gstin: MASTERGST_GST_NO,
				},
			}
		);

		if (response.data.status_cd !== '1') {
			const errorCode = +JSON.parse(response.data.error?.message)
				?.errorCodes;

			if (
				errorCode &&
				(errorCode === 105 || errorCode === 106 || errorCode === 238) &&
				authenticationCount < 10
			) {
				await mastergstAuthentication();
				await getEwayBillDetails(ewayBillNumber);
			} else {
				return {
					data: response,
				};
			}
		} else {
			return {
				data: response,
			};
		}
	} catch (error: any) {
		return {
			data: error.response,
		};
	}
};

// -------------------------------------------------------------------------------------------

export const getGSTINdetails = async (gstNumber: string) => {
	try {
		const response = await axios.get(
			`${Api.GetGSTINdetails}?email=${MASTERGST_EMAIL}&GSTIN=${gstNumber}`,
			{
				headers: {
					ip_address: await getMyIpAddress(),
					client_id: MASTERGST_CLIENT_ID,
					client_secret: MASTERGST_CLIENT_SECRET,
					gstin: MASTERGST_GST_NO,
				},
			}
		);

		if (response.data.status_cd !== '1') {
			const errorCode = +JSON.parse(response.data.error?.message)
				?.errorCodes;

			if (
				errorCode &&
				(errorCode === 105 || errorCode === 106 || errorCode === 238) &&
				authenticationCount < 10
			) {
				await mastergstAuthentication();
				await getGSTINdetails(gstNumber);
			} else {
				return {
					data: response,
				};
			}
		} else {
			return {
				data: response,
			};
		}
	} catch (error: any) {
		return {
			data: error.response,
		};
	}
};

// -------------------------------------------------------------------------------------------

export const generateConsolidatedEwaybill = async (data: any) => {
	try {
		let config = {
			method: 'post',
			maxBodyLength: Infinity,
			url: `${Api.GenerateConsolidatedEwaybill}?email=${MASTERGST_EMAIL}`,
			headers: {
				ip_address: await getMyIpAddress(),
				client_id: MASTERGST_CLIENT_ID,
				client_secret: MASTERGST_CLIENT_SECRET,
				gstin: MASTERGST_GST_NO,
			},
			data: data,
		};

		const response = await axios.request(config);

		if (response.data.status_cd !== '1') {
			const errorCode = +JSON.parse(response.data.error?.message)
				?.errorCodes;

			if (
				errorCode &&
				(errorCode === 105 || errorCode === 106 || errorCode === 238) &&
				authenticationCount < 10
			) {
				await mastergstAuthentication();
				await generateConsolidatedEwaybill(data);
			} else {
				return {
					data: response,
				};
			}
		} else {
			return {
				data: response,
			};
		}
	} catch (error: any) {
		return {
			data: error.response,
		};
	}
};

// -------------------------------------------------------------------------------------------

export const getConsolidatedEwaybill = async (tripSheetNo: number) => {
	try {
		const response = await axios.get(
			`${Api.GetConsolidatedEwaybill}?email=${MASTERGST_EMAIL}&tripSheetNo=${tripSheetNo}`,
			{
				headers: {
					ip_address: await getMyIpAddress(),
					client_id: MASTERGST_CLIENT_ID,
					client_secret: MASTERGST_CLIENT_SECRET,
					gstin: MASTERGST_GST_NO,
				},
			}
		);

		if (response.data.status_cd !== '1') {
			const errorCode = +JSON.parse(response.data.error?.message)
				?.errorCodes;

			if (
				errorCode &&
				(errorCode === 105 || errorCode === 106 || errorCode === 238) &&
				authenticationCount < 10
			) {
				await mastergstAuthentication();
				await getConsolidatedEwaybill(tripSheetNo);
			} else {
				return {
					data: response,
				};
			}
		} else {
			return {
				data: response,
			};
		}
	} catch (error: any) {
		return {
			data: error.response,
		};
	}
};

// -------------------------------------------------------------------------------------------
