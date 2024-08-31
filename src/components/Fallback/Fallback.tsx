// -------------------------------------------------------------------------------------------

import './Fallback.scss';

import { CircularProgress } from '@mui/material';

import NoDataSvg from '../../assets/illustrations/no-data.svg';
import LogoDark from '../../assets/logos/logo-dark.png';
import { FallbackInterface } from './Fallback.types';

// -------------------------------------------------------------------------------------------

const Fallback = ({ state }: FallbackInterface) => {
	return (
		<div
			data-component='fallback'
			className='container'
		>
			{state === 'not-found' && (
				<>
					<div
						data-component='fallback'
						className='top'
					>
						<img
							data-component='fallback'
							className='illustration'
							src={NoDataSvg}
							alt='No data'
						/>
					</div>
					<div
						data-component='fallback'
						className='bottom'
					>
						<div
							data-component='fallback'
							className='title headline-large'
						>
							No Data
						</div>
						<div
							data-component='fallback'
							className='text body-small'
						>
							It seems there's no data available.
						</div>
					</div>
				</>
			)}
			{state === 'loading' && (
				<div
					data-component='fallback'
					className='loading'
				>
					<CircularProgress size={84} />
					<img
						data-component='fallback'
						className='logo'
						src={LogoDark}
						alt='App Logo'
					/>
				</div>
			)}
		</div>
	);
};

export default Fallback;

// -------------------------------------------------------------------------------------------
