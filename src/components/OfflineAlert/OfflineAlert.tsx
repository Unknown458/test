// -------------------------------------------------------------------------------------------

import './OfflineAlert.scss';

import { useEffect, useState } from 'react';

import { WarningAmberOutlined } from '@mui/icons-material';
import { Typography } from '@mui/material';

// -------------------------------------------------------------------------------------------

const OfflineAlert = () => {
	const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

	const handleOnline = () => {
		setIsOffline(false);
	};

	const handleOffline = () => {
		setIsOffline(true);
	};

	useEffect(() => {
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	return (
		<>
			{isOffline && (
				<div
					data-component='offline-alert'
					className='container'
				>
					<WarningAmberOutlined />
					<Typography variant='body1'>
						You are currently offline. Some features may not work as
						expected.
					</Typography>
				</div>
			)}
		</>
	);
};

// -------------------------------------------------------------------------------------------

export default OfflineAlert;

// -------------------------------------------------------------------------------------------
