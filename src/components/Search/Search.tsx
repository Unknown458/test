// -------------------------------------------------------------------------------------------

import './Search.scss';

import { ChangeEvent, KeyboardEvent, useState } from 'react';

import { SearchOutlined } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';

import { useApp } from '../../contexts/App/App';
import { SearchInterface } from './Search.types';

// -------------------------------------------------------------------------------------------

const Search = ({ onChange, isDisabled }: SearchInterface) => {
	const [searchQuery, setSearchQuery] = useState('');
	const { title } = useApp();

	const handleSearch = () => {
		onChange(searchQuery.trim());
	};

	const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(event.target.value);
	};

	const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') {
			handleSearch();
		}
	};

	return (
		<div
			data-component='search'
			className='container'
		>
			<Tooltip title={`Search ${title}`}>
				<div
					data-component='search'
					className='icon'
				>
					<SearchOutlined />
				</div>
			</Tooltip>
			<input
				data-component='search'
				className='input body-large'
				placeholder={`Search ${title}`}
				type='search'
				value={searchQuery}
				onChange={handleInputChange}
				onKeyUp={handleKeyPress}
				onInput={(event) => onChange(event.currentTarget.value)}
				disabled={isDisabled}
			/>
			<div
				data-component='search'
				className='button'
			>
				<Tooltip title={`Search ${title}`}>
					<IconButton
						color='primary'
						disabled={isDisabled}
					>
						<SearchOutlined />
					</IconButton>
				</Tooltip>
			</div>
		</div>
	);
};

// -------------------------------------------------------------------------------------------

export default Search;

// -------------------------------------------------------------------------------------------
