// -------------------------------------------------------------------------------------------

import './BookingBranches.scss';

import {
	MaterialReactTable,
	MRT_ColumnDef,
	useMaterialReactTable,
} from 'material-react-table';
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

import {
	AddBoxOutlined,
	AddOutlined,
	Clear,
	CurrencyRupeeOutlined,
	DeleteOutline,
	Done,
	EditOutlined,
	PercentOutlined,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Fab,
	FormControl,
	FormHelperText,
	IconButton,
	InputAdornment,
	InputLabel,
	MenuItem,
	OutlinedInput,
	Select,
	Tooltip,
	useMediaQuery,
	useTheme,
} from '@mui/material';

import ActiveToggle from '../../../components/ActiveToggle/ActiveToggle';
import Alert from '../../../components/Alert/Alert';
import {
	AlertInterface,
	AlertStates,
} from '../../../components/Alert/Alert.types';
import Fallback from '../../../components/Fallback/Fallback';
import { FallbackStateType } from '../../../components/Fallback/Fallback.types';
import Search from '../../../components/Search/Search';
import { useApi } from '../../../contexts/Api/Api';
import { useApp } from '../../../contexts/App/App';
import { useAuth } from '../../../contexts/Auth/Auth';
import { AgentInterface } from '../../../services/agent/agent.types';
import {
	createBranchAsync,
	deleteBranchAsync,
	createRegionAsync,
	updateBranchAsync,
} from '../../../services/branch/branch';
import {
	BranchInterface,
	BranchType,
	CommisionType,
	RegionInterface,
	StateInterface,
} from '../../../services/branch/branch.types';
import { UserInterface } from '../../../services/user/user.types';
import {
	arrangeBranches,
	removeBranchById,
} from '../../../utils/arrangeBranches';
import findObjectInArray from '../../../utils/findObjectInArray';

// -------------------------------------------------------------------------------------------

const defaultFormData: BranchInterface = {
	name: '',
	address: '',
	stateId: 0,
	phone: '',
	email: '',
	managerName: '',
	managerPhone: '',
	managerEmail: '',
	isActive: true,
	isSubBranch: false,
	parentBranchId: 0,
	commisionType: CommisionType.OwnOffice,
	commissionBy: '',
	commissionValue: 0,
	ftlValue: 0,
	branchCode: '',
	branchType: BranchType.BookingBranch,
	transporterName: '',
	transporterPhone: '',
	marketingPerson: '',
	agentId: 0,
	regionId: 0,
	pincode: '',
};

const defaultFormErrors = {
	name: '',
	stateId: '',
	managerName: '',
	commissionBy: '',
	commissionValue: '',
	ftlValue: '',
	pincode: '',
	branchCode: '',
	regionId : '',



};

const defaultRegionForm: RegionInterface = {
	region: '',
};

const defaultRegionFormErrors = {
	region: '',
};


// -------------------------------------------------------------------------------------------

const BookingBranches = () => {
	const { setTitle } = useApp();
	const { handleLogout } = useAuth();
	const {
		getStates,
		getAllActiveAgents,
		getBookingBranches,
		getUserDetails,
		getRegions,
		setRegions,
		setBookingBranches,
	} = useApi();

	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
	const [isFormDialogEditMode, setIsFormDialogEditMode] = useState(false);
	const [isFormDialogLoading, setIsFormDialogLoading] = useState(false);
	const [isFormSubBranchMode, setIsFormSubBranchMode] = useState(false);
	const [isRegionFormDialogOpen, setRegionIsFormDialogOpen] = useState(false);
	const [fallbackState, setFallbackState] =
		useState<FallbackStateType>('loading');
	const [bookingBranches, _setBookingBranches] = useState<BranchInterface[]>(
		[]
	);
	const [userDetails, _setUserDetails] = useState<UserInterface | null>(null);
	const [states, _setStates] = useState<StateInterface[]>([]);
	const [allActiveAgents, _setAllActiveAgents] = useState<AgentInterface[]>(
		[]
	);
	const [regions, _setRegions] = useState<RegionInterface[]>([]);
	const [regionFormLoading, setRegionFormLLoading] = useState(false);
	const [regionFormError, setRegionFormError] = useState(defaultRegionForm);
	const [formData, setFormData] = useState<BranchInterface>(defaultFormData);
	const [formErrors, setFormErrors] = useState(defaultFormErrors);
	const [regionFormData, setRegionFormData] =
		useState<RegionInterface>(defaultRegionForm);
	const [alertDialog, setAlertDialog] = useState<AlertInterface>({
		state: 'success',
		label: '',
		isActive: false,
	});

	const theme = useTheme();
	const isDialogFullScreen = useMediaQuery(theme.breakpoints.down('sm'));

	useEffect(() => {
		setTitle('Booking Branches');
		initialFetch();
	}, [
		getStates,
		getAllActiveAgents,
		getBookingBranches,
		userDetails,
		getRegions,
		setTitle,
	]);

	useEffect(() => {
		const updateWindowWidth = () => setWindowWidth(window.innerWidth);
		window.addEventListener('resize', updateWindowWidth);
		return () => window.removeEventListener('resize', updateWindowWidth);
	}, []);

	const initialFetch = useCallback(async () => {
		const bookingBranchesData = await getBookingBranches();
		const statesData = await getStates();
		const allActiveAgentsData = await getAllActiveAgents();
		const userDetailsData = await getUserDetails();
		const regionsData = await getRegions()

		if (
			statesData.length !== 0 &&
			allActiveAgentsData.length !== 0 &&
			userDetailsData
		) {
			_setBookingBranches(arrangeBranches(bookingBranchesData));
			_setStates(statesData);
			_setAllActiveAgents([
				{
					agentId: 0,
					name: 'No Agent',
					phoneNumber: '',
					rateType: '',
					rate: null,
					isActive: true,
				},
				...allActiveAgentsData,
			]);
			_setUserDetails(userDetailsData);
			_setRegions(regionsData);
			setFallbackState('hidden');
		} else {
			setFallbackState('not-found');
		}

		if (bookingBranchesData.length !== 0) {
			setFallbackState('hidden');
		} else {
			setFallbackState('not-found');
		}
	}, [getStates, getAllActiveAgents, getBookingBranches, getRegions, userDetails]);

	const handleOpenFormDialog = useCallback((data?: BranchInterface) => {
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
		setIsFormSubBranchMode(false);
	}, []);

	const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	}, []);

	const handleOpenAlertDialog = useCallback(
		(state: AlertStates, label: string) => {
			setAlertDialog({ state, label, isActive: true });
		},
		[]
	);

	console.log(bookingBranches);

	const handleCloseAlertDialog = useCallback(() => {
		setAlertDialog({ state: 'success', label: '', isActive: false });
	}, []);

	const handleSubBranchFormOpen = (branch: BranchInterface) => {
		setFormData((prev) => ({
			...prev,
			parentBranchId: branch.branchId as number,
			isSubBranch: true,
		}));
		setIsFormSubBranchMode(true);
		handleOpenFormDialog();
	};

	const handleSearch = async (keyword: string) => {
		const array = await getBookingBranches();

		if (!keyword || keyword.trim() === '') {
			_setBookingBranches(arrangeBranches(array));
			return;
		}
		
		const regex = new RegExp(keyword.trim(), 'i');

		const filteredBranches = array.filter((branch: BranchInterface) => {
			const name = branch.name || '';
			const regionId = branch.regionId as any || '';
			
			const address = branch.address || '';
			const phone = branch.phone || '';
			const email = branch.email || '';
			const managerName = branch.managerName || '';
			const managerPhone = branch.managerPhone || '';
			const managerEmail = branch.managerEmail || '';
			const commisionType = branch.commisionType || '';
			const commissionBy = branch.commissionBy || '';
			const commissionValue = branch.commissionValue!.toString() || '';
			const ftlValue = branch.ftlValue!.toString() || '';
			const branchCode = branch.branchCode || '';
			const transporterName = branch.transporterName || '';
			const transporterPhone = branch.transporterPhone || '';
			const marketingPerson = branch.marketingPerson || '';
			const stateId = branch.stateId
				? findObjectInArray(states, 'stateId', branch.stateId).state
				: '';
			const pincode = branch.pincode || '';

			return (
				regex.test(name) ||
				regex.test(regionId) ||
				regex.test(address) ||
				regex.test(phone) ||
				regex.test(email) ||
				regex.test(managerName) ||
				regex.test(managerPhone) ||
				regex.test(managerEmail) ||
				regex.test(commisionType) ||
				regex.test(commissionBy) ||
				regex.test(commissionValue) ||
				regex.test(ftlValue) ||
				regex.test(branchCode) ||
				regex.test(transporterName) ||
				regex.test(transporterPhone) ||
				regex.test(marketingPerson) ||
				regex.test(stateId) ||
				regex.test(pincode)
			);
		});

		_setBookingBranches(arrangeBranches(filteredBranches));
	};

	const validateBranch = useCallback(() => {
		let isValid = true;
		const errors = { ...defaultFormErrors };

		if (!formData?.name) {
			errors.name = 'Branch Name is required.';
			isValid = false;
		}

		if (!formData?.stateId) {
			errors.stateId = 'State is required.';
			isValid = false;
		}

		if (!formData?.managerName) {
			errors.managerName = 'Manager Name is required.';
			isValid = false;
		}
		if(!formData?.regionId){
			errors.regionId = 'Region ID is required.';
			isValid = false;
		}

		if (!formData.pincode) {
			errors.pincode = 'Pin Code is required.';
			isValid = false;
		}
		if (!formData.branchCode) {
			errors.branchCode = 'Branch Code is required.';
			isValid = false;
		}

		if (formData.commisionType === CommisionType.OnCommission) {
			if (!formData?.commissionBy) {
				errors.commissionBy = 'Commission by is required.';
				isValid = false;
			}

			if (!formData?.commissionValue) {
				errors.commissionValue = 'Commission Value is required.';
				isValid = false;
			}

			if (!formData?.ftlValue) {
				errors.ftlValue = 'FTL Value is required.';
				isValid = false;
			}
		}

		setFormErrors(errors);
		return isValid;
	}, [formData]);

	const handleCreateBranch = useCallback(async () => {
		if (!validateBranch()) return;

		setIsFormDialogLoading(true);

		const data = {
			name: formData.name ? formData.name : '',
			address: formData.address ? formData.address : null,
			stateId: formData.stateId,
			phone: formData.phone ? formData.phone : null,
			email: formData.email ? formData.email : null,
			managerName: formData.managerName ? formData.managerName : null,
			managerPhone: formData.managerPhone ? formData.managerPhone : null,
			managerEmail: formData.managerEmail ? formData.managerEmail : null,
			isActive: formData.isActive,
			commisionType: formData.commisionType,
			commissionBy: formData.commissionBy ? formData.commissionBy : null,
			commissionValue: formData.commissionValue?.toString(),
			ftlValue: formData.ftlValue?.toString(),
			isSubBranch: formData.isSubBranch,
			parentBranchId: formData.parentBranchId
				? formData.parentBranchId
				: null,
			branchCode: formData.branchCode ? formData.branchCode : null,
			branchType: BranchType.BookingBranch,
			marketingPerson: formData.marketingPerson
				? formData.marketingPerson
				: '',
			agentId: formData.agentId ? formData.agentId : 0,
			pincode: formData.pincode ? formData.pincode : '',
		};

		try {
			const response = await createBranchAsync(data);
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (response.data.status === 200) {
					const newBranch: BranchInterface = {
						...formData,
						branchId: response.data.data,
					};

					setBookingBranches((prev) =>
						arrangeBranches([newBranch, ...prev])
					);

					handleCloseFormDialog();
					handleOpenAlertDialog(
						'success',
						'Created new Booking Branch.'
					);
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
		validateBranch,
		handleCloseFormDialog,
		handleOpenAlertDialog,
		handleLogout,
	]);

	const handleUpdateBranch = useCallback(async () => {
		if (!validateBranch()) return;

		setIsFormDialogLoading(true);

		const data = {
			regionId : formData.regionId,
			branchId: formData.branchId,
			name: formData.name ? formData.name : null,
			address: formData.address ? formData.address : null,
			stateId: formData.stateId,
			phone: formData.phone ? formData.phone : null,
			email: formData.email ? formData.email : null,
			managerName: formData.managerName ? formData.managerName : null,
			managerPhone: formData.managerPhone ? formData.managerPhone : null,
			managerEmail: formData.managerEmail ? formData.managerEmail : null,
			isActive: formData.isActive,
			commisionType: formData.commisionType,
			commissionBy: formData.commissionBy ? formData.commissionBy : null,
			commissionValue: formData.commissionValue?.toString(),
			ftlValue: formData.ftlValue?.toString(),
			isSubBranch: formData.isSubBranch,
			parentBranchId: formData.parentBranchId
				? formData.parentBranchId
				: null,
			branchCode: formData.branchCode ? formData.branchCode : null,
			branchType: BranchType.BookingBranch,
			marketingPerson: formData.marketingPerson
				? formData.marketingPerson
				: '',
			agentId: formData.agentId ? formData.agentId : 0,
			pincode: formData.pincode ? formData.pincode : '',
		};

		try {
			const response = await updateBranchAsync(data);
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (response.data.status === 200) {
					const updatedBranches: BranchInterface[] =
						bookingBranches.map((branch) =>
							branch.branchId === formData.branchId
								? formData
								: branch
						);

					setBookingBranches(arrangeBranches(updatedBranches));

					handleCloseFormDialog();
					handleOpenAlertDialog('success', 'Updated Booking Branch.');
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
		validateBranch,
		handleCloseFormDialog,
		handleOpenAlertDialog,
		handleLogout,
		bookingBranches,
	]);

	const validateRegionForm = (): boolean => {
		if (!regionFormData?.region) {
			setRegionFormError((prev) => ({
				...prev,
				region: 'Region is required.',
			}));
		} else {
			setRegionFormError((prev) => ({ ...prev, region: '' }));
		}

		if (regionFormData?.region !== '') {
			return true;
		} else {
			return false;
		}
	};

	const handleCreateRegion = useCallback(async () => {
		if (!validateRegionForm()) return;

		setRegionFormLLoading(true);
		try {
			const response = await createRegionAsync(regionFormData);

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (response.data.status === 200) {
					const newRegion: RegionInterface = {
						...regionFormData,
						regionId: response.data.data,
					};

					setRegions((prev) => [newRegion, ...prev]);

					handleRegionFormDialogClose();
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
			setRegionFormLLoading(false);
		}
	}, [
		regionFormData,
		validateBranch,
		handleCloseFormDialog,
		handleOpenAlertDialog,
		handleLogout,
	]);

	const handleDeleteBranch = useCallback(
		async (branch: BranchInterface) => {
			if (userDetails && userDetails.branchId === branch.branchId) {
				handleOpenAlertDialog(
					'error',
					"You can't delete your own branch."
				);
				return;
			}

			let parentBranch = () => {
				for (let i = 0; i < bookingBranches.length; i++) {
					const thisBranch = bookingBranches[i];
					if (thisBranch.branchId === branch.branchId) {
						return branch;
					}
				}
			};

			const branchToDelete = parentBranch();

			if (
				branchToDelete &&
				branchToDelete.subBranches &&
				branchToDelete.subBranches.length !== 0
			) {
				handleOpenAlertDialog(
					'error',
					'To delete parent branch, first delete all sub-branches in it.'
				);

				return;
			}

			const confirm = window.confirm(
				`Are you sure you want to delete branch '${branch.name}'?`
			);

			if (!confirm) return;

			try {
				const branchId = branch.branchId as number;

				const response = await deleteBranchAsync(branchId);
				if (
					response &&
					typeof response !== 'boolean' &&
					response.data.status !== 401
				) {
					if (response.data.status === 200) {
						setBookingBranches((prev) =>
							removeBranchById(prev, branchId)
						);

						handleOpenAlertDialog(
							'success',
							'Deleted Booking Branch.'
						);
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
		[bookingBranches, handleLogout, handleOpenAlertDialog]
	);
	
	const columns = useMemo<MRT_ColumnDef<BranchInterface>[]>(
		() => [
			{
				accessorKey: 'id',
				header: '#',
				enableResizing: false,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				Cell: ({ row }) => (
					<>
						<div className='table-index'>
							{row.original.isActive ? (
								<Tooltip title='Active Branch'>
									<Chip
										icon={<Done />}
										color='success'
									/>
								</Tooltip>
							) : (
								<Tooltip title='Disabled Branch'>
									<Chip
										icon={<Clear />}
										color='error'
									/>
								</Tooltip>
							)}
							{row.original.reverseIndex}
						</div>
					</>
				),
			},
			{
				accessorKey: 'name',
				header: 'Branch Name',
				enableResizing: true,
				size: 150,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'stateId',
				header: 'State',
				enableResizing: true,
				size: 200,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				accessorFn: (row) =>
					`${findObjectInArray(states, 'stateId', row.stateId).state
					}`,
			},
			{
				accessorKey: 'pincode',
				header: 'Pincode',
				enableResizing: true,
				size: 150,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'regionId',
				header: 'Region',
				enableResizing: true,
				size: 200,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				accessorFn: (row) =>
					`${
						findObjectInArray(regions, 'regionId', row.regionId).region
					}`,
			},
		
			{
				accessorKey: 'managerName',
				header: 'Manager Name',
				enableResizing: true,
				size: 200,
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
				size: 120,
				muiTableHeadCellProps: { align: 'right' },
				muiTableBodyCellProps: { align: 'right' },
				muiTableFooterCellProps: { align: 'right' },
				Cell: ({ row }) => (
					<>
						<Tooltip title='Delete Booking Branch'>
							<IconButton
								onClick={() => handleDeleteBranch(row.original)}
							>
								<DeleteOutline />
							</IconButton>
						</Tooltip>
						<Tooltip title='Edit Booking Branch'>
							<IconButton
								onClick={() =>
									handleOpenFormDialog(row.original)
								}
							>
								<EditOutlined />
							</IconButton>
						</Tooltip>
						{row.original.subBranches &&
							!row.original.parentBranchId && (
								<Tooltip title='Add Sub-Branch'>
									<IconButton
										onClick={() =>
											handleSubBranchFormOpen(
												row.original
											)
										}
									>
										<AddBoxOutlined />
									</IconButton>
								</Tooltip>
							)}
					</>
				),
			},
		],
		[handleDeleteBranch, handleOpenFormDialog, states]
	);

	const table = useMaterialReactTable({
		columns,
		data: bookingBranches,
		filterFromLeafRows: true,
		paginateExpandedRows: false,
		enableColumnResizing: true,
		enablePagination: true,
		layoutMode: 'grid',
		enableDensityToggle: false,
		initialState: {
			pagination: { pageSize: 100, pageIndex: 0 },
			density: 'compact',
		},
		muiPaginationProps: { rowsPerPageOptions: [100, 200, 500, 1000] },
		muiTablePaperProps: {
			sx: {
				borderRadius: 'var(--shape-medium)',
				boxShadow: 'var(--elevation-extra-small)',
			},
		},
		muiTableBodyCellProps: { sx: { paddingTop: 0, paddingBottom: 0 } },
		enableExpandAll: true,
		enableExpanding: true,
		getSubRows: (row) => row.subBranches,
	});


	const handleRegionFormDialogOpen = () => {
		setRegionIsFormDialogOpen(true);
	};

	const handleRegionFormDialogClose = () => {
		setRegionIsFormDialogOpen(false);
		setRegionFormData(defaultRegionForm);
		setRegionFormError(defaultRegionFormErrors);
	};



	

	
	

	return (
		<>
			<div
				data-component='booking-branches'
				className='container'
			>
				<div
					data-component='booking-branches'
					className='top'
				>
					<Search
						onChange={handleSearch}
						isDisabled={fallbackState !== 'hidden'}
					/>
					{windowWidth > 600 && (
						<Tooltip title='Create New Booking Branch'>
							<Fab
								variant='extended'
								color='primary'
								data-component='booking-branches'
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
					data-component='booking-branches'
					className='bottom'
				>
					{fallbackState !== 'hidden' ? (
						<Fallback state={fallbackState} />
					) : (
						<div
							data-component='booking-branches'
							className='table-container'
						>
							<MaterialReactTable table={table} />
						</div>
					)}
				</div>
			</div>

			{windowWidth < 600 && (
				<div
					data-component='booking-branches'
					className='fab-container'
				>
					<Tooltip title='Create New Booking Branch'>
						<Fab
							variant='extended'
							color='primary'
							data-component='booking-branches'
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
				maxWidth='lg'
				fullScreen={isDialogFullScreen}
				data-component='booking-branches'
				className='dialog'
			>
				<DialogTitle
					data-component='booking-branches'
					className='dialog-title'
				>
					{!isFormSubBranchMode
						? !isFormDialogEditMode
							? 'Add New Booking Branch'
							: 'Edit Booking Branch'
						: !isFormDialogEditMode
							? 'Add New Booking Sub-Branch'
							: 'Edit Booking Sub-Branch'}
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
					data-component='booking-branches'
					className='dialog-content'
				>
					<div
						data-component='booking-branches'
						className='container'
					>
						<div
							data-component='booking-branches'
							className='column'
						>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
								error={formErrors.name ? true : false}
							>
								<InputLabel htmlFor='name'>
									Branch Name
								</InputLabel>
								<OutlinedInput
									label='Branch Name'
									id='name'
									type='text'
									value={formData?.name ? formData?.name : ''}
									name='name'
									onChange={handleChange}
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
								error={formErrors.stateId ? true : false}
							>
								<InputLabel>State</InputLabel>
								<Select
									label='State'
									value={
										formData.stateId ? formData.stateId : ''
									}
									name='stateId'
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											stateId: e.target.value as number,
										}));
									}}
								>
									{states.map((state) => (
										<MenuItem
											key={`state-${state.stateId}`}
											value={state.stateId}
										>
											{state.state}
										</MenuItem>
									))}
								</Select>
								{formErrors.stateId && (
									<FormHelperText error>
										{formErrors.stateId}
									</FormHelperText>
								)}
							</FormControl>
							<div
								data-component='delivery-branches'
								className='region-input'
							>
								<FormControl
									variant='outlined'
									fullWidth
									disabled={isFormDialogLoading}
									// error={formErrors.regionId ? true : false}
								>
									<InputLabel>Region</InputLabel>
									<Select
										label='Region'
										value={
											formData.regionId
												? formData.regionId
												: ''
										}
										onChange={(event: any) => {
											
											
											setFormData((prev) => ({
												...prev,
												regionId: +event.target
													.value as number,
											}));
											
										}}
									>
										{regions.map((region) => {
											return (
												<MenuItem
													key={region.regionId}
													value={region.regionId}
												>
													{region.region}
												</MenuItem>
											);
										})}
									</Select>
									{/* {formErrors.regionId && (
										<FormHelperText error>
											{formErrors.regionId}
										</FormHelperText>
									)} */}
								</FormControl>
								<Button
									disabled={isFormDialogLoading}
									className='add-region-button'
									onClick={handleRegionFormDialogOpen}
								>
									Add region
								</Button>
							</div>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
							>
								<InputLabel htmlFor='address'>
									Address
								</InputLabel>
								<OutlinedInput
									multiline
									rows={4.2}
									label='Address'
									id='address'
									type='text'
									value={
										formData?.address
											? formData?.address
											: ''
									}
									name='address'
									onChange={handleChange}
								/>
							</FormControl>
						</div>
						<div
							data-component='booking-branches'
							className='column'
						>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
								error={formErrors.pincode ? true : false}
							>
								<InputLabel htmlFor='pincode'>
									Pincode
								</InputLabel>
								<OutlinedInput
									label='Pincode'
									id='pincode'
									type='number'
									value={
										formData?.pincode
											? formData?.pincode
											: ''
									}
									name='pincode'
									onChange={handleChange}
								/>
								{formErrors.pincode && (
									<FormHelperText error>
										{formErrors.pincode}
									</FormHelperText>
								)}
							</FormControl>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
								required
								error={formErrors.branchCode ? true : false}
							>
								<InputLabel htmlFor='branchCode'>
									Branch Code
								</InputLabel>
								<OutlinedInput
									label='Branch Code'
									id='branchCode'
									type='text'
									inputProps={{ maxLength: 4 }}
									value={
										formData?.branchCode
											? formData?.branchCode.toUpperCase()
											: ''
									}
									name='branchCode'
									onChange={handleChange}
								/>
								{formErrors.branchCode && (
									<FormHelperText error>
										{formErrors.branchCode}
									</FormHelperText>
								)}
							</FormControl>

							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
							>
								<InputLabel htmlFor='phone'>
									Phone Number
								</InputLabel>
								<OutlinedInput
									label='Phone Number'
									id='phone'
									type='number'
									value={
										formData?.phone ? formData?.phone : ''
									}
									name='phone'
									onChange={handleChange}
								/>
							</FormControl>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
							>
								<InputLabel htmlFor='email'>Email</InputLabel>
								<OutlinedInput
									label='Email'
									id='email'
									type='email'
									value={
										formData?.email ? formData?.email : ''
									}
									name='email'
									onChange={handleChange}
								/>
							</FormControl>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
								error={formErrors.managerName ? true : false}
							>
								<InputLabel htmlFor='managerName'>
									Manager Name
								</InputLabel>
								<OutlinedInput
									label='Manager Name'
									id='managerName'
									type='text'
									value={
										formData?.managerName
											? formData?.managerName
											: ''
									}
									name='managerName'
									onChange={handleChange}
								/>
								{formErrors.managerName && (
									<FormHelperText error>
										{formErrors.managerName}
									</FormHelperText>
								)}
							</FormControl>

						</div>
						<div
							data-component='booking-branches'
							className='column'
						>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
							>
								<InputLabel htmlFor='managerPhone'>
									Manager Phone Number
								</InputLabel>
								<OutlinedInput
									label='Manager Phone Number'
									id='managerPhone'
									type='number'
									value={
										formData?.managerPhone
											? formData?.managerPhone
											: ''
									}
									name='managerPhone'
									onChange={handleChange}
								/>
							</FormControl>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
							>
								<InputLabel htmlFor='managerEmail'>
									Manager Email
								</InputLabel>
								<OutlinedInput
									label='Manager Email'
									id='managerEmail'
									type='email'
									value={
										formData?.managerEmail
											? formData?.managerEmail
											: ''
									}
									name='managerEmail'
									onChange={handleChange}
								/>
							</FormControl>
							<FormControl
								variant='outlined'
								fullWidth
								disabled={isFormDialogLoading}
							>
								<InputLabel>Agent</InputLabel>
								<Select
									label='Agent'
									value={
										formData.agentId ? formData.agentId : 0
									}
									onChange={(event: any) => {
										setFormData((prev) => ({
											...prev,
											agentId: +event.target
												.value as number,
										}));
									}}
								>
									{allActiveAgents.map((agent) => {
										return (
											<MenuItem
												key={agent.agentId}
												value={agent.agentId}
											>
												{agent.name}
											</MenuItem>
										);
									})}
								</Select>
							</FormControl>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
							>
								<InputLabel htmlFor='marketingPerson'>
									Marketing Person
								</InputLabel>
								<OutlinedInput
									label='Marketing Person'
									id='marketingPerson'
									type='text'
									value={
										formData?.marketingPerson
											? formData?.marketingPerson
											: ''
									}
									name='marketingPerson'
									onChange={handleChange}
								/>
							</FormControl>

							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth

							>
								<InputLabel>Commission Type</InputLabel>
								<Select
									label='Commission Type'
									value={formData?.commisionType}
									name='commisionType'
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											commisionType: e.target
												.value as CommisionType,
										}));
									}}
								>
									<MenuItem value={CommisionType.OwnOffice}>
										Own Office
									</MenuItem>
									<MenuItem
										value={CommisionType.OnCommission}
									>
										On Commission
									</MenuItem>
								</Select>
							</FormControl>
							{formData.commisionType ===
								CommisionType.OnCommission && (
									<>
										<FormControl
											size='medium'
											disabled={isFormDialogLoading}
											variant='outlined'
											fullWidth
											error={
												formErrors.commissionBy
													? true
													: false
											}
										>
											<InputLabel>Commission By</InputLabel>
											<Select
												label='Commission By'
												value={formData?.commissionBy}
												name='commissionBy'
												onChange={(e) => {
													setFormData((prev) => ({
														...prev,
														commissionBy: e.target
															.value as
															| 'ARTICLE'
															| 'WEIGHT'
															| 'VASULI',
													}));
												}}
											>
												<MenuItem value='ARTICLE'>
													By Article
												</MenuItem>
												<MenuItem value='WEIGHT'>
													By Weight
												</MenuItem>
												<MenuItem value='VASULI'>
													By Vasuli
												</MenuItem>
											</Select>
											{formErrors.commissionBy && (
												<FormHelperText error>
													{formErrors.commissionBy}
												</FormHelperText>
											)}
										</FormControl>
										<FormControl
											size='medium'
											disabled={isFormDialogLoading}
											variant='outlined'
											fullWidth
											error={
												formErrors.commissionValue
													? true
													: false
											}
										>
											<InputLabel htmlFor='commissionValue'>
												Commission Value
											</InputLabel>
											<OutlinedInput
												label='Commission Value'
												id='commissionValue'
												type='number'
												value={formData?.commissionValue}
												name='commissionValue'
												onChange={handleChange}
												startAdornment={
													(formData?.commissionBy ===
														'ARTICLE' ||
														formData?.commissionBy ===
														'WEIGHT') && (
														<InputAdornment position='start'>
															<CurrencyRupeeOutlined />
														</InputAdornment>
													)
												}
												endAdornment={
													formData?.commissionBy ===
													'VASULI' && (
														<InputAdornment position='end'>
															<PercentOutlined />
														</InputAdornment>
													)
												}
											/>
											{formErrors.commissionValue && (
												<FormHelperText error>
													{formErrors.commissionValue}
												</FormHelperText>
											)}
										</FormControl>
										<FormControl
											size='medium'
											disabled={isFormDialogLoading}
											variant='outlined'
											fullWidth
											error={
												formErrors.ftlValue ? true : false
											}
										>
											<InputLabel htmlFor='ftl'>
												FTL
											</InputLabel>
											<OutlinedInput
												label='FTL'
												id='ftl'
												type='number'
												value={
													formData?.ftlValue
														? formData?.ftlValue
														: ''
												}
												name='ftlValue'
												onChange={handleChange}
												startAdornment={
													<InputAdornment position='start'>
														<CurrencyRupeeOutlined />
													</InputAdornment>
												}
											/>
											{formErrors.ftlValue && (
												<FormHelperText error>
													{formErrors.ftlValue}
												</FormHelperText>
											)}
										</FormControl>
									</>
								)}
						</div>
					</div>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseFormDialog}>Close</Button>
					<LoadingButton
						color='primary'
						onClick={
							!isFormDialogEditMode
								? handleCreateBranch
								: handleUpdateBranch
						}
						loading={isFormDialogLoading}
						type='submit'
					>
						Save
					</LoadingButton>
				</DialogActions>
			</Dialog>
			<Dialog
				open={isRegionFormDialogOpen}
				onClose={handleRegionFormDialogClose}
				data-component='delivery-branches'
				className='dialog'
				fullWidth={true}
			>
				<DialogTitle>Add new region</DialogTitle>
				<DialogContent
					data-component='delivery-branches'
					className='dialog-content'
				>
					<FormControl
						size='medium'
						disabled={regionFormLoading}
						variant='outlined'
						fullWidth
						error={regionFormError.region ? true : false}
					>
						<InputLabel htmlFor='region'>Region</InputLabel>
						<OutlinedInput
							label='Region'
							id='region'
							type='text'
							value={
								regionFormData?.regionId
									? regionFormData?.regionId
									: ''
							}
							name='region'
							onChange={(e) => {
								setRegionFormData((prev) => ({
									...prev,
									region: e.target.value,
								}));
							}}
						/>
						{regionFormError.region && (
							<FormHelperText error>
								{regionFormError.region}
							</FormHelperText>
						)}
					</FormControl>
				</DialogContent>
				<DialogActions>
					<Button
						data-component='delivery-branches'
						className='text-button'
						onClick={handleRegionFormDialogClose}
						disabled={regionFormLoading}
					>
						Cancel
					</Button>
					<LoadingButton
						data-component='delivery-branches'
						className='text-button'
						color='primary'
						onClick={handleCreateRegion}
						loading={regionFormLoading}
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
};

// -------------------------------------------------------------------------------------------

export default BookingBranches;

// -------------------------------------------------------------------------------------------
