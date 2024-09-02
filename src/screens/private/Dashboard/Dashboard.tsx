// -------------------------------------------------------------------------------------------

import './Dashboard.scss';

import { memo, useCallback, useEffect, useState } from 'react';

import { LocalShippingOutlined, StorefrontOutlined } from '@mui/icons-material';
import { Typography } from '@mui/material';

import Fallback from '../../../components/Fallback/Fallback';
import { FallbackStateType } from '../../../components/Fallback/Fallback.types';
import { useApi } from '../../../contexts/Api/Api';
import { useApp } from '../../../contexts/App/App';
import { UserInterface } from '../../../services/user/user.types';

// -------------------------------------------------------------------------------------------

const Dashboard = memo(() => {
	const { setTitle } = useApp();
	const { getUserDetails } = useApi();
	const [user, setUser] = useState<UserInterface>();
	const [fallbackState, setFallbackState] =
		useState<FallbackStateType>('loading');

	useEffect(() => {
		setTitle('Dashboard');
		initialFetch();
	}, [setTitle]);

	const initialFetch = useCallback(async () => {
		const userData = await getUserDetails();

		if (userData) {
			setUser(userData);
			setFallbackState('hidden');
		} else {
			setFallbackState('not-found');
		}
	}, [getUserDetails]);

	return (
		<div
			data-component='dashboard'
			className='container'
		>
			{fallbackState !== 'hidden' ? (
				<Fallback state={fallbackState} />
			) : (
				<>
					<Typography
						data-component='dashboard'
						className='name'
						variant='body1'
					>
						Welcome, <b>{user?.fullName}</b>! We're glad to see you.
						It's {new Date().toDateString()}
					</Typography>
					<div
						data-component='dashboard'
						className='card-container'
					>
						<div
							data-component='dashboard'
							className='card'
						>
							<div
								data-component='dashboard'
								className='cargo-detail'
							>
								<div
									data-component='dashboard'
									className='icon-container'
								>
									<LocalShippingOutlined
										data-component='dashboard'
										className='icon'
									/>
									<Typography
										variant='h6'
										data-component='dashboard'
										className='title'
									>
										Received cargo
									</Typography>
								</div>
								<div
									data-component='dashboard'
									className='detail'
								>
									<Typography variant='h2'>1000</Typography>
								</div>
							</div>
							<div
								data-component='dashboard'
								className='border'
							></div>
							<div
								data-component='dashboard'
								className='cargo-detail'
							>
								<div
									data-component='dashboard'
									className='icon-container'
								>
									<LocalShippingOutlined
										data-component='dashboard'
										className='icon'
									/>
									<Typography
										variant='h6'
										data-component='dashboard'
										className='title'
									>
										Delivered cargo
									</Typography>
								</div>
								<div
									data-component='dashboard'
									className='detail'
								>
									<Typography variant='h2'>500</Typography>
								</div>
							</div>
							<div
								data-component='dashboard'
								className='border'
							></div>
							<div
								data-component='dashboard'
								className='cargo-detail'
							>
								<div
									data-component='dashboard'
									className='icon-container'
								>
									<StorefrontOutlined
										data-component='dashboard'
										className='icon'
									/>
									<Typography
										variant='h6'
										data-component='dashboard'
										className='title'
									>
										Cargo at warehouse
									</Typography>
								</div>
								<div
									data-component='dashboard'
									className='detail'
								>
									<Typography variant='h2'>500</Typography>
								</div>
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);
});

// -------------------------------------------------------------------------------------------

export default Dashboard;

// -------------------------------------------------------------------------------------------
