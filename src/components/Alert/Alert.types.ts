// -------------------------------------------------------------------------------------------

export type AlertStates = 'success' | 'warning' | 'error';

export interface AlertInterface {
	state: AlertStates;
	label?: string;
	isActive: boolean;
	onClose?: () => void;
}

// -------------------------------------------------------------------------------------------
