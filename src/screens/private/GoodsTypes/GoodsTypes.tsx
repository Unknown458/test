// -------------------------------------------------------------------------------------------

import './GoodsTypes.scss';

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
    createGoodsTypesAsync, deleteGoodsTypeAsync, updateGoodsTypeAsync
} from '../../../services/goodsType/goodsType';
import { GoodsTypeInterface } from '../../../services/goodsType/goodsType.types';
import addIndex from '../../../utils/addIndex';

// -------------------------------------------------------------------------------------------

const defaultFormData: GoodsTypeInterface = { goodsType: '' };
const defaultFormErrors = { goodsType: '' };

// -------------------------------------------------------------------------------------------

const GoodsType = memo(() => {
	const { setTitle } = useApp();
	const { handleLogout } = useAuth();
	const { getGoodsTypes, setGoodsTypes } = useApi();

	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
	const [isFormDialogEditMode, setIsFormDialogEditMode] = useState(false);
	const [isFormDialogLoading, setIsFormDialogLoading] = useState(false);
	const [fallbackState, setFallbackState] =
		useState<FallbackStateType>('loading');
	const [goodsTypes, _setGoodsTypes] = useState<GoodsTypeInterface[]>([]);
	const [formData, setFormData] =
		useState<GoodsTypeInterface>(defaultFormData);
	const [formErrors, setFormErrors] = useState(defaultFormErrors);
	const [alertDialog, setAlertDialog] = useState<AlertInterface>({
		state: 'success',
		label: '',
		isActive: false,
	});

	useEffect(() => {
		setTitle('Goods Type');
		initialFetch();
	}, [getGoodsTypes, setTitle]);

	useEffect(() => {
		const updateWindowWidth = () => setWindowWidth(window.innerWidth);
		window.addEventListener('resize', updateWindowWidth);
		return () => window.removeEventListener('resize', updateWindowWidth);
	}, []);

	const initialFetch = useCallback(async () => {
		const goodsTypesData = await getGoodsTypes();

		if (goodsTypesData.length !== 0) {
			_setGoodsTypes(goodsTypesData);
			setFallbackState('hidden');
		} else {
			setFallbackState('not-found');
		}
	}, [getGoodsTypes]);

	const handleOpenFormDialog = useCallback((data?: GoodsTypeInterface) => {
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
		const array = await getGoodsTypes();

		if (!keyword || keyword.trim() === '') {
			_setGoodsTypes(array);
			return;
		}

		const regex = new RegExp(keyword.trim(), 'i');
		const filteredTypes = array.filter((type) =>
			regex.test(type.goodsType)
		);

		_setGoodsTypes(addIndex.addIndex3(filteredTypes));
	};

	const validateGoodsType = useCallback((): boolean => {
		if (!formData.goodsType) {
			setFormErrors({ goodsType: 'Goods Type is required.' });
			return false;
		}
		setFormErrors({ goodsType: '' });
		return true;
	}, [formData]);

	const handleCreateGoodsType = useCallback(async () => {
		if (!validateGoodsType()) return;

		const data = { ...formData };

		setIsFormDialogLoading(true);
		try {
			const response = await createGoodsTypesAsync(data);
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (response.data.status === 200) {
					const newGoodsType: GoodsTypeInterface = {
						...formData,
						goodsTypeId: response.data.data,
					};
					setGoodsTypes((prev) => addIndex.addIndex3([newGoodsType, ...prev]));
					handleCloseFormDialog();
					handleOpenAlertDialog('success', 'Created new Goods Type.');
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
		validateGoodsType,
		handleCloseFormDialog,
		handleOpenAlertDialog,
		handleLogout,
		setGoodsTypes,
	]);

	const handleUpdateGoodsType = useCallback(async () => {
		if (!validateGoodsType()) return;

		const data = { ...formData };

		setIsFormDialogLoading(true);
		try {
			const response = await updateGoodsTypeAsync(data);
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (response.data.status === 200) {
					const updatedGoodsTypes = goodsTypes.map((obj) =>
						obj.goodsTypeId === formData.goodsTypeId
							? { ...obj, goodsType: formData.goodsType }
							: obj
					);

					setGoodsTypes(addIndex.addIndex3(updatedGoodsTypes));
					handleCloseFormDialog();
					handleOpenAlertDialog('success', 'Updated Goods Type.');
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
		validateGoodsType,
		handleCloseFormDialog,
		handleOpenAlertDialog,
		handleLogout,
		goodsTypes,
		setGoodsTypes,
	]);

	const handleDeleteGoodsType = useCallback(
		async (data: GoodsTypeInterface) => {
			const confirm = window.confirm(
				`Are you sure you want to delete Goods Type '${data.goodsType}'?`
			);
			if (!confirm) return;

			const goodsTypeId = data.goodsTypeId as number;

			try {
				const response = await deleteGoodsTypeAsync(goodsTypeId);
				if (
					response &&
					typeof response !== 'boolean' &&
					response.data.status !== 401
				) {
					if (response.data.status === 200) {
						const updatedGoodsTypes = goodsTypes.filter(
							(obj) => obj.goodsTypeId !== goodsTypeId
						);
						setGoodsTypes(addIndex.addIndex3(updatedGoodsTypes));
						handleOpenAlertDialog('success', 'Deleted Goods Type.');
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
		[goodsTypes, handleLogout, handleOpenAlertDialog, setGoodsTypes]
	);

	const columns = useMemo<MRT_ColumnDef<GoodsTypeInterface>[]>(
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
				accessorKey: 'goodsType',
				header: 'Goods Type',
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
						<Tooltip title='Delete Goods Type'>
							<IconButton
								onClick={() =>
									handleDeleteGoodsType(row.original)
								}
							>
								<DeleteOutline />
							</IconButton>
						</Tooltip>
						<Tooltip title='Edit Goods Type'>
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
		[handleDeleteGoodsType, handleOpenFormDialog]
	);

	const table = useMaterialReactTable({
		columns,
		data: goodsTypes,
		filterFromLeafRows: true,
		paginateExpandedRows: false,
		enableColumnResizing: true,
		enablePagination: true,
		layoutMode: 'grid',
		enableDensityToggle: false,
		initialState: {
			pagination: { pageSize: 100, pageIndex: 0 },
			density: 'compact',
			sorting:[{id: "goodsType", desc: false}]
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
				data-component='goods-types'
				className='container'
			>
				<div
					data-component='goods-types'
					className='top'
				>
					<Search
						onChange={handleSearch}
						isDisabled={fallbackState !== 'hidden'}
					/>
					{windowWidth > 600 && (
						<Tooltip title='Create New Goods Type'>
							<Fab
								variant='extended'
								color='primary'
								data-component='goods-types'
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
					data-component='goods-types'
					className='bottom'
				>
					{fallbackState !== 'hidden' ? (
						<Fallback state={fallbackState} />
					) : (
						<div
							data-component='goods-types'
							className='table-container'
						>
							<MaterialReactTable table={table} />
						</div>
					)}
				</div>
			</div>

			{windowWidth < 600 && (
				<div
					data-component='goods-types'
					className='fab-container'
				>
					<Tooltip title='Create New Goods Type'>
						<Fab
							variant='extended'
							color='primary'
							data-component='goods-types'
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
						? 'Create New Goods Type'
						: 'Edit Goods Type'}
				</DialogTitle>
				<DialogContent>
					<FormControl
						size='medium'
						variant='outlined'
						fullWidth
						error={!!formErrors.goodsType}
						disabled={isFormDialogLoading}
						margin='dense'
					>
						<InputLabel htmlFor='goods-type'>Goods Type</InputLabel>
						<OutlinedInput
							label='Goods Type'
							id='goods-type'
							type='text'
							name='goodsType'
							value={formData.goodsType}
							onChange={handleChange}
							onBlur={validateGoodsType}
						/>
						{formErrors.goodsType && (
							<FormHelperText>
								{formErrors.goodsType}
							</FormHelperText>
						)}
					</FormControl>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseFormDialog}>Close</Button>
					<LoadingButton
						color='primary'
						onClick={
							!isFormDialogEditMode
								? handleCreateGoodsType
								: handleUpdateGoodsType
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

// -------------------------------------------------------------------------------------------

export default GoodsType;

// -------------------------------------------------------------------------------------------
