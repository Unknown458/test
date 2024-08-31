import { getTime } from '../../App';
// import { verifyRefreshToken } from '../../services/user/user';
import { getTokens } from '../../utils/authToken';

// -------------------------------------------------------------------------------------------

const AuthMiddleware = async (): Promise<boolean> => {
    const expiryThreshold = Number(
        import.meta.env.VITE_ACCESS_TOKEN_REFRESH_THRESHOLD_SECONDS
    );
    const currentTime: any = getTime();
    const beforeExpiry = currentTime - expiryThreshold * 1000;

    const tokens = getTokens();

    if (!tokens || !tokens.accessToken || !tokens.accessTokenExpiry) return false;

    const willAccessTokenExpire = new Date(tokens.accessTokenExpiry).getTime() < beforeExpiry;

    if (willAccessTokenExpire) {
        alert('Session expired. Please login to continue usage.');
        return false;
    }

    return true;
};

// -------------------------------------------------------------------------------------------

export default AuthMiddleware;
