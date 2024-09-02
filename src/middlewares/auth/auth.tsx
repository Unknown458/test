// -------------------------------------------------------------------------------------------

import { getTime } from '../../App';
import { verifyRefreshToken } from '../../services/user/user';
import { getTokens } from '../../utils/authToken';

// -------------------------------------------------------------------------------------------

const AuthMiddleware = async (): Promise<boolean> => {
	const expiryThreshold = Number(
		import.meta.env.VITE_ACCESS_TOKEN_REFRESH_THRESHOLD_SECONDS
	);
	const currentTime: any = getTime();
	const beforeExpiry = currentTime - expiryThreshold * 1000;

	const tokens = getTokens();

	if (!tokens) return false;

	const { accessToken, accessTokenExpiry, refreshToken, refreshTokenExpiry } =
		tokens;

	if (
		!accessToken ||
		!accessTokenExpiry ||
		!refreshToken ||
		!refreshTokenExpiry
	)
		return false;

	const willAccessTokenExpiry =
		new Date(accessTokenExpiry).getTime() < beforeExpiry;
	const willRefreshTokenExpiry =
		new Date(refreshTokenExpiry).getTime() < currentTime;

	if (willRefreshTokenExpiry) {
		alert('Session expired. Please login to continue usage.');
		return false;
	}

	if (willAccessTokenExpiry) {
		try {
			const response = await verifyRefreshToken(
				accessToken,
				refreshToken
			);

			return response.status === 200;
		} catch (error: any) {
			if (error.response.status !== 401) {
				alert('Something went wrong!');
			}

			return false;
		}
	}

	return true;
};

// -------------------------------------------------------------------------------------------

export default AuthMiddleware;

// -------------------------------------------------------------------------------------------
