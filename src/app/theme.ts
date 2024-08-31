// -------------------------------------------------------------------------------------------

import { createTheme } from '@mui/material/styles';

// -------------------------------------------------------------------------------------------

const theme = createTheme({
	palette: {
		primary: {
			main: '#6139d8',
		},
		secondary: {
			main: '#2564ff',
		},
		success: {
			main: '#00d642',
		},
		warning: {
			main: '#ffd300',
		},
		error: {
			main: '#ff2a17',
		},
	},
	components: {
		MuiDialog: {
			styleOverrides: {
				paper: {
					borderRadius: 'var(--shape-medium)',
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 'var(--shape-extra-large)',
				},
			},
		},
		MuiFab: {
			styleOverrides: {
				root: {
					height: '56px',
					borderRadius: 'var(--shape-huge)',
					whiteSpace: 'nowrap',
				},
			},
		},
		MuiDialogTitle: {
			styleOverrides: {
				root: {
					padding: 'var(--space)',
					color: 'var(--on-surface)',
				},
			},
		},
		MuiDialogContent: {
			styleOverrides: {
				root: {
					padding: 'var(--space)',
				},
			},
		},
		MuiDialogActions: {
			styleOverrides: {
				root: {
					padding: '0 var(--space) var(--space) var(--space)',
				},
			},
		},
		MuiInputLabel: {
			styleOverrides: {
				asterisk: {
					color: 'red',
				},
			},
		},
	},
});

// -------------------------------------------------------------------------------------------

export default theme;

// -------------------------------------------------------------------------------------------
