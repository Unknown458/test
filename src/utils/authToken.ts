// -------------------------------------------------------------------------------------------

import { AuthTokensInterface } from '../services/user/user.types';

// -------------------------------------------------------------------------------------------

export const setTokens = ({
	accessToken,
	accessTokenExpiry,
	refreshToken,
	refreshTokenExpiry,
}: AuthTokensInterface) => {
	let key = import.meta.env.VITE_TOKEN_KEY;

	let value = JSON.stringify({
		accessToken,
		accessTokenExpiry,
		refreshToken,
		refreshTokenExpiry,
	});

	localStorage.setItem(key, value);
};

// -------------------------------------------------------------------------------------------

export const getTokens = (): AuthTokensInterface | null => {
	let key = import.meta.env.VITE_TOKEN_KEY;

	let value = localStorage.getItem(key) as string;

	if (value) {
		let tokens = JSON.parse(value) as AuthTokensInterface;

		return tokens;
	} else {
		return null;
	}
};

// -------------------------------------------------------------------------------------------
