// -------------------------------------------------------------------------------------------

import './AppLogo.scss';

import { memo } from 'react';

import AppDetails from '../../app/appDetails';
import LogoDark from '../../assets/logos/logo-dark.png';
import LogoLight from '../../assets/logos/logo-light.png';
import { AppLogoInterface } from './AppLogo.types';

// -------------------------------------------------------------------------------------------

const AppLogo = memo(({ variant, iconOnly }: AppLogoInterface) => {
	const logoSrc = variant === 'light' ? LogoLight : LogoDark;

	return (
		<div
			data-component='app-logo'
			className={`container ${variant} ${iconOnly}`}
		>
			<img
				data-component='app-logo'
				className='logo'
				src={logoSrc}
				alt='App Logo'
			/>
			{!iconOnly && (
				<div
					data-component='app-logo'
					className='title title-medium'
				>
					{AppDetails.Title}
				</div>
			)}
		</div>
	);
});

// -------------------------------------------------------------------------------------------

export default AppLogo;

// -------------------------------------------------------------------------------------------
