// -------------------------------------------------------------------------------------------

import './Private.scss';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import AppDetails from '../../app/appDetails';
import RouterPath from '../../app/routerPath';
import Header from '../../components/Header/Header';
import Navigation from '../../components/Navigation/Navigation';
import { NavigationStateType } from '../../components/Navigation/Navigation.types';
import { ApiProvider } from '../../contexts/Api/Api';
import { useAuth } from '../../contexts/Auth/Auth';

// -------------------------------------------------------------------------------------------

const getInitialNavigationState = (): NavigationStateType => {
	const width = window.innerWidth;
	if (width < 600) return 'closed';
	if (width < 840) return 'semi-open';
	return 'open';
};

// -------------------------------------------------------------------------------------------

const Private = memo(() => {
	const { loginStatus, handleLogout } = useAuth();
	const [navigationState, setNavigationState] = useState<NavigationStateType>(
		getInitialNavigationState
	);

	useEffect(() => {
		const handleResize = () => {
			setNavigationState(getInitialNavigationState());
		};

		window.addEventListener('resize', handleResize);

		let inactivityTimer: any = 0;
		const maxInactiveDuration =
			import.meta.env.VITE_MAX_INACTIVE_MINUTES * 60 * 1000;
		const interationEvents = [
			'mousemove',
			'keypress',
			'touchstart',
			'touchmove',
		];

		const resetTimer = () => {
			clearTimeout(inactivityTimer);

			inactivityTimer = setTimeout(() => {
				alert('Logging out due to inactive user.');
				handleLogout();
			}, maxInactiveDuration);
		};

		const handleActivity = () => {
			resetTimer();
		};

		const handleInteractions = () => {
			interationEvents.forEach((event) => {
				document.addEventListener(event, handleActivity);
			});
		};

		handleInteractions();
		resetTimer();

		return () => {
			window.removeEventListener('resize', handleResize);

			clearTimeout(inactivityTimer);

			interationEvents.forEach((event) => {
				document.removeEventListener(event, handleActivity);
			});
		};
	}, []);

	const handleNavigationState = useCallback(() => {
		setNavigationState((prevState) => {
			const width = window.innerWidth;
			if (prevState === 'open')
				return width > 600 ? 'semi-open' : 'closed';
			return prevState === 'semi-open' ? 'closed' : 'open';
		});
	}, []);

	const memoizedNavigation = useMemo(
		() => (
			<Navigation
				navigationState={navigationState}
				onClick={handleNavigationState}
			/>
		),
		[navigationState, handleNavigationState]
	);

	const memoizedHeader = useMemo(
		() => (
			<Header
				onClick={handleNavigationState}
				navigationState={navigationState}
			/>
		),
		[navigationState, handleNavigationState]
	);

	if (!loginStatus) {
		return (
			<Navigate
				to={RouterPath.Login}
				replace
			/>
		);
	}

	return (
		<ApiProvider>
			<div
				data-component='private'
				className='container'
			>
				<div
					data-component='private'
					className={`navigation ${navigationState}`}
				>
					{memoizedNavigation}
				</div>
				<div
					data-component='private'
					className='screen'
				>
					<div
						data-component='private'
						className='header'
					>
						{memoizedHeader}
					</div>
					<div
						data-component='private'
						className='body'
					>
						<Outlet />
					</div>
					<div
						data-component='private'
						className='footer'
					>
						<a
							data-component='public'
							className='rights body-small'
							href='#'
							target='_blank'
						>
							{AppDetails.Rights}
						</a>
					</div>
				</div>
			</div>
		</ApiProvider>
	);
});

// -------------------------------------------------------------------------------------------

export default Private;

// -------------------------------------------------------------------------------------------
