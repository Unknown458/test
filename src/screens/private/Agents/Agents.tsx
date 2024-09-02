// -------------------------------------------------------------------------------------------

import './Agents.scss';

import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { AddOutlined, DeleteOutline, EditOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle, Fab, FormControl, FormHelperText,
    IconButton, InputLabel, MenuItem, OutlinedInput, Select, Tooltip, useMediaQuery, useTheme
} from '@mui/material';

import ActiveToggle from '../../../components/ActiveToggle/ActiveToggle';
import Alert from '../../../components/Alert/Alert';
import { AlertInterface, AlertStates } from '../../../components/Alert/Alert.types';
import Fallback from '../../../components/Fallback/Fallback';
import { FallbackStateType } from '../../../components/Fallback/Fallback.types';
import Search from '../../../components/Search/Search';
import { useApi } from '../../../contexts/Api/Api';
import { useApp } from '../../../contexts/App/App';
import { useAuth } from '../../../contexts/Auth/Auth';
import {
    createAgentAsync, deleteAgentAsync, updateAgentAsync
} from '../../../services/agent/agent';
import { AgentInterface } from '../../../services/agent/agent.types';
import { RateTypeInterface } from '../../../services/quotation/quotation.types';
import addIndex from '../../../utils/addIndex';

// -------------------------------------------------------------------------------------------

const defaultFormData: AgentInterface = {
	name: '',
	phoneNumber: '',
	rateType: '',
	rate: null,
	isActive: true,
};

const defaultFormErrors = { name: '', phoneNumber: '', rateType: '', rate: '' };

// -------------------------------------------------------------------------------------------

const Agents = memo(() => {
	const { setTitle } = useApp();
	const { handleLogout } = useAuth();
	const { getAllAgents, setAllAgents, getRateTypes } = useApi();

	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
	const [isFormDialogEditMode, setIsFormDialogEditMode] = useState(false);
	const [isFormDialogLoading, setIsFormDialogLoading] = useState(false);
	const [fallbackState, setFallbackState] =
		useState<FallbackStateType>('loading');
	const [agents, _setAgents] = useState<AgentInterface[]>([]);
	const [rateTypes, _setRateTypes] = useState<RateTypeInterface[]>([]);
	const [formData, setFormData] = useState<AgentInterface>(defaultFormData);
	const [formErrors, setFormErrors] = useState(defaultFormErrors);
	const [alertDialog, setAlertDialog] = useState<AlertInterface>({
		state: 'success',
		label: '',
		isActive: false,
	});

	const theme = useTheme();
	const isDialogFullScreen = useMediaQuery(theme.breakpoints.down('sm'));

	useEffect(() => {
		setTitle('Agents');
		initialFetch();
	}, [getAllAgents, getRateTypes, setTitle]);

	useEffect(() => {
		const updateWindowWidth = () => setWindowWidth(window.innerWidth);
		window.addEventListener('resize', updateWindowWidth);
		return () => window.removeEventListener('resize', updateWindowWidth);
	}, []);

	const initialFetch = useCallback(async () => {
		const agentsData = await getAllAgents();
		const rateTypesData = await getRateTypes();

		if (rateTypesData.length !== 0) {
			_setAgents(agentsData);
			_setRateTypes(rateTypesData);
			setFallbackState('hidden');
		} else {
			setFallbackState('not-found');
		}

		if (agentsData.length !== 0) {
			setFallbackState('hidden');
		} else {
			setFallbackState('not-found');
		}
	}, [getAllAgents, getRateTypes]);

	const handleOpenFormDialog = useCallback((data?: AgentInterface) => {
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
		const array = await getAllAgents();
		if (!keyword || keyword.trim() === '') {
			_setAgents(array);
			return;
		}

		const regex = new RegExp(keyword.trim(), 'i');

		const filteredUsers = array.filter((user: AgentInterface) => {
			const name = user.name || '';
			const phoneNumber = user.phoneNumber || '';
			const rateType = user.rateType || '';
			const rate = user.rate?.toString() || '';

			return (
				regex.test(name) ||
				regex.test(phoneNumber) ||
				regex.test(rateType) ||
				regex.test(rate)
			);
		});

		_setAgents(addIndex.addIndex4(filteredUsers));
	};

	const validateAgent = useCallback((): boolean => {
		const errors = { ...defaultFormErrors };

		if (!formData?.name) {
			errors.name = 'Name is required.';
		}
		if (!formData?.phoneNumber) {
			errors.phoneNumber = 'Phone is required.';
		}
		if (!formData?.rateType) {
			errors.rateType = 'Rate Type is required.';
		}
		if (!formData?.rate) {
			errors.rate = 'Rate is required.';
		}

		setFormErrors(errors);

		return Object.values(errors).every((error) => error === '');
	}, [formData]);

	const handleCreateAgent = useCallback(async () => {
		if (!validateAgent()) return;

		const data = { ...formData };

		setIsFormDialogLoading(true);
		try {
			const response = await createAgentAsync(data);
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (response.data.status === 200) {
					const newAgent: AgentInterface = {
						...formData,
						agentId: response.data.data,
					};
					setAllAgents((prev) => addIndex.addIndex4([newAgent, ...prev]));
					handleCloseFormDialog();
					handleOpenAlertDialog('success', 'Created new Agent.');
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
		validateAgent,
		handleCloseFormDialog,
		handleOpenAlertDialog,
		handleLogout,
		setAllAgents,
	]);

	const handleUpdateAgent = useCallback(async () => {
		if (!validateAgent()) return;

		const data = { ...formData };

		setIsFormDialogLoading(true);
		try {
			const response = await updateAgentAsync(data);
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (response.data.status === 200) {
					const updatedAgents = agents.map((obj) =>
						obj.agentId === formData.agentId ? data : obj
					);

					setAllAgents(addIndex.addIndex4(updatedAgents));
					handleCloseFormDialog();
					handleOpenAlertDialog('success', 'Updated Agent.');
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
		validateAgent,
		handleCloseFormDialog,
		handleOpenAlertDialog,
		handleLogout,
		agents,
		setAllAgents,
	]);

	const handleDeleteAgent = useCallback(
		async (data: AgentInterface) => {
			const confirm = window.confirm(
				`Are you sure you want to delete Agent '${data.name}'?`
			);
			if (!confirm) return;

			const agentId = data.agentId as number;

			try {
				const response = await deleteAgentAsync(agentId);
				if (
					response &&
					typeof response !== 'boolean' &&
					response.data.status !== 401
				) {
					if (response.data.status === 200) {
						const updatedAgents = agents.filter(
							(obj) => obj.agentId !== agentId
						);
						setAllAgents(addIndex.addIndex4(updatedAgents));
						handleOpenAlertDialog('success', 'Deleted Agent.');
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
		[agents, handleLogout, handleOpenAlertDialog, setAllAgents]
	);

	const columns = useMemo<MRT_ColumnDef<AgentInterface>[]>(
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
				accessorKey: 'name',
				header: 'Agent Name',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'phoneNumber',
				header: 'Phone Number',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'rateType',
				header: 'Rate Type',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'rate',
				header: 'Rate',
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
						<Tooltip title='Delete Agent'>
							<IconButton
								onClick={() => handleDeleteAgent(row.original)}
							>
								<DeleteOutline />
							</IconButton>
						</Tooltip>
						<Tooltip title='Edit Agent'>
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
		[handleDeleteAgent, handleOpenFormDialog]
	);

	const table = useMaterialReactTable({
		columns,
		data: agents,
		filterFromLeafRows: true,
		paginateExpandedRows: false,
		enableColumnResizing: true,
		enablePagination: true,
		layoutMode: 'grid',
		enableDensityToggle: false,
		initialState: {
			pagination: { pageSize: 100, pageIndex: 0 },
			density: 'compact',
			sorting:[{id: "name", desc: false}]
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
				data-component='agents'
				className='container'
			>
				<div
					data-component='agents'
					className='top'
				>
					<Search
						onChange={handleSearch}
						isDisabled={fallbackState !== 'hidden'}
					/>
					{windowWidth > 600 && (
						<Tooltip title='Create New Agent'>
							<Fab
								variant='extended'
								color='primary'
								data-component='agents'
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
					data-component='agents'
					className='bottom'
				>
					{fallbackState !== 'hidden' ? (
						<Fallback state={fallbackState} />
					) : (
						<div
							data-component='agents'
							className='table-container'
						>
							<MaterialReactTable table={table} />
						</div>
					)}
				</div>
			</div>

			{windowWidth < 600 && (
				<div
					data-component='agents'
					className='fab-container'
				>
					<Tooltip title='Create New Agent'>
						<Fab
							variant='extended'
							color='primary'
							data-component='agents'
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
				maxWidth='md'
				fullScreen={isDialogFullScreen}
				data-component='agents'
				className='dialog'
			>
				<DialogTitle
					data-component='agents'
					className='dialog-title'
				>
					{!isFormDialogEditMode ? 'Create New Agent' : 'Edit Agent'}
					<ActiveToggle
						isActive={formData.isActive}
						onChange={(value) => {
							setFormData((prev) => ({
								...prev,
								isActive: value,
							}));
						}}
					/>
				</DialogTitle>
				<DialogContent
					data-component='agents'
					className='dialog-content'
				>
					<div
						data-component='agents'
						className='container'
					>
						<div
							data-component='agents'
							className='columns-2'
						>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
								error={!!formErrors.name}
							>
								<InputLabel htmlFor='agent-name'>
									Name
								</InputLabel>
								<OutlinedInput
									label='Name'
									id='agent-name'
									type='text'
									value={formData.name}
									name='name'
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											name: e.target.value,
										}))
									}
								/>
								{formErrors.name && (
									<FormHelperText error>
										{formErrors.name}
									</FormHelperText>
								)}
							</FormControl>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
								error={!!formErrors.phoneNumber}
							>
								<InputLabel htmlFor='agent-phone'>
									Phone
								</InputLabel>
								<OutlinedInput
									label='Phone'
									id='agent-phone'
									type='number'
									value={formData.phoneNumber}
									name='phoneNumber'
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											phoneNumber: e.target.value,
										}))
									}
								/>
								{formErrors.phoneNumber && (
									<FormHelperText error>
										{formErrors.phoneNumber}
									</FormHelperText>
								)}
							</FormControl>
						</div>
						<div
							data-component='agents'
							className='columns-2'
						>
							<FormControl
								variant='outlined'
								fullWidth
								error={formErrors.rateType ? true : false}
								disabled={isFormDialogLoading}
							>
								<InputLabel>Rate Type</InputLabel>
								<Select
									label='Rate Type'
									data-tabindex='21'
									value={formData.rateType}
									onChange={(event: any) => {
										setFormData((prev) => ({
											...prev,
											rateType: event.target.value,
										}));
									}}
								>
									{rateTypes.map((type) => {
										return (
											<MenuItem
												key={type.rateType}
												value={type.rateType}
											>
												{type.rateType}
											</MenuItem>
										);
									})}
								</Select>
								{formErrors.rateType && (
									<FormHelperText error>
										{formErrors.rateType}
									</FormHelperText>
								)}
							</FormControl>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
								error={!!formErrors.rate}
							>
								<InputLabel htmlFor='agent-rate'>
									Rate
								</InputLabel>
								<OutlinedInput
									label='Rate'
									id='agent-rate'
									type='number'
									value={formData.rate}
									name='rate'
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											rate: +e.target.value as number,
										}))
									}
								/>
								{formErrors.rate && (
									<FormHelperText error>
										{formErrors.rate}
									</FormHelperText>
								)}
							</FormControl>
						</div>
					</div>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseFormDialog}>Close</Button>
					<LoadingButton
						color='primary'
						onClick={
							!isFormDialogEditMode
								? handleCreateAgent
								: handleUpdateAgent
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

export default Agents;

// -------------------------------------------------------------------------------------------
