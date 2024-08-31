
import { AuthTokensInterface } from "../services/user/user.types";

export const setTokens = ({
    accessToken,
    accessTokenExpiry,
  
}: AuthTokensInterface) => {
    const key = import.meta.env.VITE_TOKEN_KEY;

    const value = JSON.stringify({
        accessToken,
        accessTokenExpiry,
       
    });
    localStorage.setItem(key, value);
}
// ----------------------------------------------------------------

export const getTokens = (): AuthTokensInterface | null => {
	const key = import.meta.env.VITE_TOKEN_KEY;

	const value = localStorage.getItem(key) as string;

	if (value) {
		const tokens = JSON.parse(value) as AuthTokensInterface;

		return tokens;
	} else {
		return null;
	}
};

// ------------------------------------------------------------------------

