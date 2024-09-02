// -------------------------------------------------------------------------------------------

import './NotFound.scss';

import { memo, useEffect } from 'react';

import NotFoundSvg from '../../../assets/illustrations/not-found.svg';
import { useApp } from '../../../contexts/App/App';

// -------------------------------------------------------------------------------------------

const NotFound = memo(() => {
	const { setTitle } = useApp();

	useEffect(() => {
		setTitle('Not Found');
	}, [setTitle]);

	return (
		<div
			data-component='not-found'
			className='container'
		>
			<div
				data-component='not-found'
				className='top'
			>
				<img
					data-component='not-found'
					className='illustration'
					src={NotFoundSvg}
					alt='Not found'
				/>
			</div>
			<div
				data-component='not-found'
				className='bottom'
			>
				<div
					data-component='not-found'
					className='title headline-large'
				>
					Not found
				</div>
				<div
					data-component='not-found'
					className='text body-small'
				>
					We can't find the resource your looking for.
				</div>
			</div>
		</div>
	);
});

// -------------------------------------------------------------------------------------------

export default NotFound;

// -------------------------------------------------------------------------------------------
