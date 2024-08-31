// -------------------------------------------------------------------------------------------

import { ReactNode } from 'react';

// -------------------------------------------------------------------------------------------

export interface AuthContextInterface {
	loginStatus: boolean;
	handleLogin: () => void;
	handleLogout: () => void;
}

export interface AuthProviderInterface {
	children: ReactNode;
}

// -------------------------------------------------------------------------------------------
