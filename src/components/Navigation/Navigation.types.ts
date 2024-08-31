// -------------------------------------------------------------------------------------------

import RouterPath from '../../app/routerPath';

// -------------------------------------------------------------------------------------------

export type NavigationStateType = 'open' | 'semi-open' | 'closed';

export interface NavigationInterface {
	onClick: () => void;
	navigationState: NavigationStateType;
}

export interface NavigationScopeInterface {
	icon: JSX.Element;
	label: string;
	route?: RouterPath;
	routes?: NavigationScopeInterface[];
}

// -------------------------------------------------------------------------------------------
