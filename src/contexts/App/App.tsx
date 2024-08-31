// -------------------------------------------------------------------------------------------

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import AppDetails from '../../app/appDetails';
import { AppContextInterface, AppProviderInterface } from './App.types';

// -------------------------------------------------------------------------------------------

const AppContext = createContext<AppContextInterface | undefined>(undefined);

// -------------------------------------------------------------------------------------------

export const useApp = () => {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error('useAppContext must be used within an AppProvider');
	}
	return context;
};

// -------------------------------------------------------------------------------------------

export const AppProvider = ({ children }: AppProviderInterface) => {
	const [title, setTitle] = useState<string>('');

	useEffect(() => {
		if (title) {
			document.title = `${title} • ${AppDetails.Title}`;
		} else {
			document.title = AppDetails.Title;
		}
	}, [title]);

	const contextValue = useMemo(() => ({ setTitle, title }), [title]);

	return (
		<AppContext.Provider value={contextValue}>
			{children}
		</AppContext.Provider>
	);
};

// -------------------------------------------------------------------------------------------
