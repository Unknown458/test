// -------------------------------------------------------------------------------------------

import { ReactNode } from 'react';

// -------------------------------------------------------------------------------------------

export interface AppContextInterface {
	setTitle: (title: string) => void;
	title: string;
}

export interface AppProviderInterface {
	children: ReactNode;
}

// -------------------------------------------------------------------------------------------
