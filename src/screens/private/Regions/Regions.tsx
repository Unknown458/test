// -------------------------------------------------------------------------------------------

import './Regions.scss';

import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table';
import { ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { AddOutlined, DeleteOutline, EditOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle, Fab, FormControl, FormHelperText,
    IconButton, InputLabel, OutlinedInput, Tooltip
} from '@mui/material';

import Alert from '../../../components/Alert/Alert';
import { AlertInterface, AlertStates } from '../../../components/Alert/Alert.types';
import Fallback from '../../../components/Fallback/Fallback';
import { FallbackStateType } from '../../../components/Fallback/Fallback.types';
import Search from '../../../components/Search/Search';
import { useApi } from '../../../contexts/Api/Api';
import { useApp } from '../../../contexts/App/App';
import { useAuth } from '../../../contexts/Auth/Auth';
import {
    createRegionAsync, deleteRegionAsync, updateRegionAsync
} from '../../../services/branch/branch';
import { RegionInterface } from '../../../services/branch/branch.types';
import addIndex from '../../../utils/addIndex';

// -------------------------------------------------------------------------------------------

const defaultFormData: RegionInterface = { region: '' };
const defaultFormErrors = { region: '' };

// -------------------------------------------------------------------------------------------

const Regions = memo(() => {
	const { setTitle } = useApp();
	const { handleLogout } = useAuth();
	const { getRegions, setRegions } = useApi();

	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
	const [isFormDialogEditMode, setIsFormDialogEditMode] = useState(false);
	const [isFormDialogLoading, setIsFormDialogLoading] = useState(false);
	const [fallbackState, setFallbackState] =
		useState<FallbackStateType>('loading');
	const [regions, _setRegions] = useState<RegionInterface[]>([]);
	const [formData, setFormData] = useState<RegionInterface>(defaultFormData);
	const [formErrors, setFormErrors] = useState(defaultFormErrors);
	const [alertDialog, setAlertDialog] = useState<AlertInterface>({
		state: 'success',
		label: '',
		isActive: false,
	});

	useEffect(() => {
		setTitle('Regions');
		initialFetch();
	}, [getRegions, setTitle]);

	useEffect(() => {
		const updateWindowWidth = () => setWindowWidth(window.innerWidth);
		window.addEventListener('resize', updateWindowWidth);
		return () => window.removeEventListener('resize', updateWindowWidth);
	}, []);

	const initialFetch = useCallback(async () => {
		const regionsData = await getRegions();

		if (regionsData.length !== 0) {
			_setRegions(regionsData);
			setFallbackState('hidden');
		} else {
			setFallbackState('not-found');
		}
	}, [getRegions]);

	const handleOpenFormDialog = useCallback((data?: RegionInterface) => {
		setIsFormDialogOpen(true);
		if (data) {
			setFormData(data);
			setIsFormDialogEditMode(true);
		}
	}, []);

	const handleCloseFormDialog = useCallback(() => {
		setIsFormDialogOpen(false);
		setFormData(defaultFormData);
		setFormErrors(defaultFormErrors);
		setIsFormDialogEditMode(false);
		setIsFormDialogLoading(false);
		handleCloseAlertDialog();
	}, []);

	const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	}, []);

	const handleOpenAlertDialog = useCallback(
		(state: AlertStates, label: string) => {
			setAlertDialog({ state, label, isActive: true });
		},
		[]
	);

	const handleCloseAlertDialog = useCallback(() => {
		setAlertDialog({ state: 'success', label: '', isActive: false });
	}, []);

	const handleSearch = async (keyword: string) => {
		const array = await getRegions();

		if (!keyword || keyword.trim() === '') {
			_setRegions(array);
			return;
		}

		const regex = new RegExp(keyword.trim(), 'i');
		const filteredRegions = array.filter((region) =>
			regex.test(region.region)
		);

		_setRegions(addIndex.addIndex3(filteredRegions));
	};

	const validateRegion = useCallback((): boolean => {
		if (!formData.region) {
			setFormErrors({ region: 'Region is required.' });
			return false;
		}
		setFormErrors({ region: '' });
		return true;
	}, [formData]);

	const handleCreateRegion = useCallback(async () => {
		if (!validateRegion()) return;

		const data = { ...formData };

		setIsFormDialogLoading(true);
		try {
			const response = await createRegionAsync(data);
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (response.data.status === 200) {
					const newRegion: RegionInterface = {
						...formData,
						regionId: response.data.data,
					};
					setRegions((prev) => addIndex.addIndex3([newRegion, ...prev]));
					handleCloseFormDialog();
					handleOpenAlertDialog('success', 'Created new Region.');
				} else {
					handleOpenAlertDialog('warning', response.data.data);
				}
			} else {
				handleLogout();
			}
		} catch (error) {
			handleLogout();
		} finally {
			setIsFormDialogLoading(false);
		}
	}, [
		formData,
		validateRegion,
		handleCloseFormDialog,
		handleOpenAlertDialog,
		handleLogout,
		setRegions,
	]);

	const handleUpdateRegion = useCallback(async () => {
		if (!validateRegion()) return;

		const data = { ...formData };

		setIsFormDialogLoading(true);
		try {
			const response = await updateRegionAsync(data);
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (response.data.status === 200) {
					const updatedRegions = regions.map((obj) =>
						obj.regionId === formData.regionId
							? { ...obj, region: formData.region }
							: obj
					);

					setRegions(addIndex.addIndex3(updatedRegions));
					handleCloseFormDialog();
					handleOpenAlertDialog('success', 'Updated Region.');
				} else {
					handleOpenAlertDialog('warning', response.data.data);
				}
			} else {
				handleLogout();
			}
		} catch (error) {
			handleLogout();
		} finally {
			setIsFormDialogLoading(false);
		}
	}, [
		formData,
		validateRegion,
		handleCloseFormDialog,
		handleOpenAlertDialog,
		handleLogout,
		regions,
		setRegions,
	]);

	const handleDeleteRegion = useCallback(
		async (data: RegionInterface) => {
			const confirm = window.confirm(
				`Are you sure you want to delete Region '${data.region}'?`
			);
			if (!confirm) return;

			const regionId = data.regionId as number;

			try {
				const response = await deleteRegionAsync(regionId);
				if (
					response &&
					typeof response !== 'boolean' &&
					response.data.status !== 401
				) {
					if (response.data.status === 200) {
						const updatedRegions = regions.filter(
							(obj) => obj.regionId !== regionId
						);
						setRegions(addIndex.addIndex3(updatedRegions));
						handleOpenAlertDialog('success', 'Deleted Region.');
					} else {
						handleOpenAlertDialog('warning', response.data.data);
					}
				} else {
					handleLogout();
				}
			} catch (error) {
				handleLogout();
			}
		},
		[regions, handleLogout, handleOpenAlertDialog, setRegions]
	);

	const columns = useMemo<MRT_ColumnDef<RegionInterface>[]>(
		() => [
			{
				accessorKey: 'index',
				header: '#',
				enableResizing: false,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'region',
				header: 'Region',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'actions',
				header: 'Actions',
				enableResizing: false,
				enableColumnFilter: false,
				enableSorting: false,
				size: 100,
				muiTableHeadCellProps: { align: 'right' },
				muiTableBodyCellProps: { align: 'right' },
				muiTableFooterCellProps: { align: 'right' },
				Cell: ({ row }) => (
					<>
						<Tooltip title='Delete Region'>
							<IconButton
								onClick={() => handleDeleteRegion(row.original)}
							>
								<DeleteOutline />
							</IconButton>
						</Tooltip>
						<Tooltip title='Edit Region'>
							<IconButton
								onClick={() =>
									handleOpenFormDialog(row.original)
								}
							>
								<EditOutlined />
							</IconButton>
						</Tooltip>
					</>
				),
			},
		],
		[handleDeleteRegion, handleOpenFormDialog]
	);

	const table = useMaterialReactTable({
		columns,
		data: regions,
		filterFromLeafRows: true,
		paginateExpandedRows: false,
		enableColumnResizing: true,
		enablePagination: true,
		layoutMode: 'grid',
		enableDensityToggle: false,
		initialState: {
			pagination: { pageSize: 100, pageIndex: 0 },
			density: 'compact',
			sorting: [{ id: "region", desc: false }],
		},
		muiPaginationProps: { rowsPerPageOptions: [100, 200, 500, 1000] },
		muiTablePaperProps: {
			sx: {
				borderRadius: 'var(--shape-medium)',
				boxShadow: 'var(--elevation-extra-small)',
			},
		},
		muiTableBodyCellProps: { sx: { paddingTop: 0, paddingBottom: 0 } },
	});

	return (
		<>
			<div
				data-component='regions'
				className='container'
			>
				<div
					data-component='regions'
					className='top'
				>
					<Search
						onChange={handleSearch}
						isDisabled={fallbackState !== 'hidden'}
					/>
					{windowWidth > 600 && (
						<Tooltip title='Create New Region'>
							<Fab
								variant='extended'
								color='primary'
								data-component='regions'
								className='fab'
								onClick={() => handleOpenFormDialog()}
							>
								<AddOutlined />
								Create new
							</Fab>
						</Tooltip>
					)}
				</div>
				<div
					data-component='regions'
					className='bottom'
				>
					{fallbackState !== 'hidden' ? (
						<Fallback state={fallbackState} />
					) : (
						<div
							data-component='regions'
							className='table-container'
						>
							<MaterialReactTable table={table} />
						</div>
					)}
				</div>
			</div>

			{windowWidth < 600 && (
				<div
					data-component='regions'
					className='fab-container'
				>
					<Tooltip title='Create New Region'>
						<Fab
							variant='extended'
							color='primary'
							data-component='regions'
							className='fab'
							onClick={() => handleOpenFormDialog()}
						>
							<AddOutlined />
							Create new
						</Fab>
					</Tooltip>
				</div>
			)}

			<Dialog
				open={isFormDialogOpen}
				onClose={handleCloseFormDialog}
				fullWidth={true}
			>
				<DialogTitle>
					{!isFormDialogEditMode
						? 'Create New Region'
						: 'Edit Region'}
				</DialogTitle>
				<DialogContent>
					<FormControl
						size='medium'
						variant='outlined'
						fullWidth
						error={!!formErrors.region}
						disabled={isFormDialogLoading}
						margin='dense'
					>
						<InputLabel htmlFor='region'>Region</InputLabel>
						<OutlinedInput
							label='Region'
							id='region'
							type='text'
							name='region'
							value={formData.region}
							onChange={handleChange}
							onBlur={validateRegion}
						/>
						{formErrors.region && (
							<FormHelperText>{formErrors.region}</FormHelperText>
						)}
					</FormControl>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseFormDialog}>Close</Button>
					<LoadingButton
						color='primary'
						onClick={
							!isFormDialogEditMode
								? handleCreateRegion
								: handleUpdateRegion
						}
						loading={isFormDialogLoading}
						type='submit'
					>
						Save
					</LoadingButton>
				</DialogActions>
			</Dialog>

			<Alert
				{...alertDialog}
				onClose={handleCloseAlertDialog}
			/>
		</>
	);
});

export default Regions;
