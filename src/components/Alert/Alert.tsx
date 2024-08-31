// -------------------------------------------------------------------------------------------

import './Alert.scss';

import { useEffect, useState } from 'react';

import {
	CheckCircleOutline,
	ErrorOutlineOutlined,
	WarningAmberOutlined,
} from '@mui/icons-material';
import { Button, Dialog, Typography } from '@mui/material';

import { AlertInterface } from './Alert.types';

// -------------------------------------------------------------------------------------------

const Alert = ({ state, label, isActive, onClose }: AlertInterface) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setIsVisible(isActive);
	}, [isActive]);

	if (!isVisible) {
		return <></>;
	}

	const handleClose = () => {
		// setIsVisible(false);
		if (typeof onClose === 'function') {
			onClose();
		}
	};

	return (
		<Dialog
			open={isVisible}
			data-component='alert'
			className={`dialog ${state}`}
		>
			<div
				data-component='alert'
				className='container'
			>
				<div
					data-component='alert'
					className='top'
				>
					{state === 'success' ? (
						<CheckCircleOutline />
					) : state === 'warning' ? (
						<WarningAmberOutlined />
					) : (
						<ErrorOutlineOutlined />
					)}
				</div>
				<div
					data-component='alert'
					className='bottom'
				>
					{label && (
						<Typography
							variant='body1'
							data-component='alert'
							className='text'
						>
							{label}
						</Typography>
					)}
					{onClose && (
						<Button
							variant='outlined'
							data-component='alert'
							className='outlined-button'
							onClick={handleClose}
							color='primary'
							focusRipple
						>
							Close
						</Button>
					)}
				</div>
			</div>
		</Dialog>
	);
};

// -------------------------------------------------------------------------------------------

export default Alert;

// -------------------------------------------------------------------------------------------
