// -------------------------------------------------------------------------------------------

import './ActiveToggle.scss';

import { Done } from '@mui/icons-material';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

import { ActiveToggleInterface } from './ActiveToggle.types';

// -------------------------------------------------------------------------------------------

const ActiveToggle = ({ isActive, onChange }: ActiveToggleInterface) => {
	return (
		<ToggleButtonGroup
			data-component='active-toggle'
			className='toggle-button'
			value={isActive}
			exclusive
			onChange={(_e, value) => {
				onChange(value);
			}}
		>
			<ToggleButton
				value={true}
				data-component='active-toggle'
				className='active'
			>
				{isActive && <Done />} Active
			</ToggleButton>
			<ToggleButton
				value={false}
				data-component='active-toggle'
				className='disabled'
			>
				{!isActive && <Done />} Disabled
			</ToggleButton>
		</ToggleButtonGroup>
	);
};

export default ActiveToggle;

// -------------------------------------------------------------------------------------------
