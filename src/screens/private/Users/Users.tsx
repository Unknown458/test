// -------------------------------------------------------------------------------------------

import './Users.scss';

import dayjs, { Dayjs } from 'dayjs';
import {
	MaterialReactTable,
	MRT_ColumnDef,
	useMaterialReactTable,
} from 'material-react-table';
import {
	ChangeEvent,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';

import {
	AddOutlined,
	Clear,
	DeleteOutline,
	Done,
	EditOutlined,
	VisibilityOffOutlined,
	VisibilityOutlined,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
	Button,
	Checkbox,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Fab,
	FormControl,
	FormControlLabel,
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
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import ActiveToggle from '../../../components/ActiveToggle/ActiveToggle';
import Alert from '../../../components/Alert/Alert';
import {
	AlertInterface,
	AlertStates,
} from '../../../components/Alert/Alert.types';
import Fallback from '../../../components/Fallback/Fallback';
import { FallbackStateType } from '../../../components/Fallback/Fallback.types';
import Search from '../../../components/Search/Search';
import { EMAIL_REGEX, PASSWORD_REGEX } from '../../../constants/regex';
import { useApi } from '../../../contexts/Api/Api';
import { useApp } from '../../../contexts/App/App';
import { useAuth } from '../../../contexts/Auth/Auth';
import { BranchInterface } from '../../../services/branch/branch.types';
import {
	createUserAsync,
	deleteUserAsync,
	updateUserAsync,
} from '../../../services/user/user';
import {
	UserInterface,
	UserTypeInterface,
} from '../../../services/user/user.types';
import addIndex from '../../../utils/addIndex';
import findObjectInArray from '../../../utils/findObjectInArray';
import hashData from '../../../utils/hashData';

// -------------------------------------------------------------------------------------------

const defaultFormData: UserInterface = {
	userName: '',
	Password: '',
	confirmPassword: '',
	fullName: '',
	userTypeId: 0,
	phone: '',
	email: '',
	branchId: 0,
	isActive: true,
	companyId: 0,
	aadharNo: '',
	panNo: '',
	address: '',
	joiningDate: new Date().toISOString(),
	salary: 0,
	addedBy: 0,
	loginByOTP: false,
};

const defaultFormErrors = {
	userName: '',
	fullName: '',
	Password: '',
	confirmPassword: '',
	userTypeId: '',
	branchId: '',
	joiningDate: '',
	phone: '',
	email: '',
};

// -------------------------------------------------------------------------------------------

const Users = memo(() => {
	const { setTitle } = useApp();
	const { handleLogout } = useAuth();
	const {
		getAllUserByCompany,
		getAllBranchesByCompany,
		getUserTypes,
		setAllUserByCompany,
	} = useApi();

	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
	const [isFormDialogEditMode, setIsFormDialogEditMode] = useState(false);
	const [isFormDialogLoading, setIsFormDialogLoading] = useState(false);
	const [fallbackState, setFallbackState] =
		useState<FallbackStateType>('loading');
	const [allUserByCompany, _setAllUserByCompany] = useState<UserInterface[]>(
		[]
	);
	const [allBranchesByCompany, _setAllBranchesByCompany] = useState<
		BranchInterface[]
	>([]);
	const [userTypes, _setUserTypes] = useState<UserTypeInterface[]>([]);
	const [formData, setFormData] = useState<UserInterface>(defaultFormData);
	const [formErrors, setFormErrors] = useState(defaultFormErrors);
	const [alertDialog, setAlertDialog] = useState<AlertInterface>({
		state: 'success',
		label: '',
		isActive: false,
	});
	const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);

	const theme = useTheme();
	const isDialogFullScreen = useMediaQuery(theme.breakpoints.down('sm'));

	useEffect(() => {
		setTitle('Users');
		initialFetch();
	}, [getAllUserByCompany, setTitle]);

	useEffect(() => {
		const updateWindowWidth = () => setWindowWidth(window.innerWidth);
		window.addEventListener('resize', updateWindowWidth);
		return () => window.removeEventListener('resize', updateWindowWidth);
	}, []);

	const initialFetch = useCallback(async () => {
		const usersData = await getAllUserByCompany();
		const allBranchesByCompanyData = await getAllBranchesByCompany();
		const userTypesData = await getUserTypes();

		if (
			allBranchesByCompanyData.length !== 0 &&
			userTypesData.length !== 0
		) {
			_setAllUserByCompany(usersData);
			_setAllBranchesByCompany(allBranchesByCompanyData);
			_setUserTypes(userTypesData);
			setFallbackState('hidden');
		} else {
			setFallbackState('not-found');
		}

		if (usersData.length !== 0) {
			setFallbackState('hidden');
		} else {
			setFallbackState('not-found');
		}
	}, [getAllUserByCompany, allBranchesByCompany, userTypes]);

	const handleOpenFormDialog = useCallback((data?: UserInterface) => {
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
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
		const array = await getAllUserByCompany();
		if (!keyword || keyword.trim() === '') {
			_setAllUserByCompany(array);
			return;
		}

		const regex = new RegExp(keyword.trim(), 'i');

		const filteredUsers = array.filter((user: UserInterface) => {
			const fullName = user.fullName || '';
			const userName = user.userName || '';
			const phone = user.phone || '';
			const email = user.email || '';
			const userType = user.userTypeId
				? findObjectInArray(userTypes, 'userTypeId', user.userTypeId)
						.userType
				: '';
			const branchName = user.branchId
				? findObjectInArray(
						allBranchesByCompany,
						'branchId',
						user.branchId
				  ).name
				: '';
			const aadharNo = user.aadharNo || '';
			const panNo = user.panNo || '';
			const address = user.address || '';
			const joiningDate = user.joiningDate || '';
			const salary = user.salary?.toString() || '';

			return (
				regex.test(fullName) ||
				regex.test(userName) ||
				regex.test(phone) ||
				regex.test(email) ||
				regex.test(userType) ||
				regex.test(branchName) ||
				regex.test(aadharNo) ||
				regex.test(panNo) ||
				regex.test(address) ||
				regex.test(joiningDate) ||
				regex.test(salary)
			);
		});

		_setAllUserByCompany(addIndex.addIndex3(filteredUsers));
	};

	const validateUser = useCallback(() => {
		let isValid = true;
		const errors = {
			userName: '',
			fullName: '',
			Password: '',
			confirmPassword: '',
			userTypeId: '',
			branchId: '',
			joiningDate: '',
			phone: '',
			email: '',
		};

		if (!formData?.userName) {
			errors.userName = 'Username is required.';
			isValid = false;
		}

		if (!formData?.fullName) {
			errors.fullName = 'Full name is required.';
			isValid = false;
		}

		if (!isFormDialogEditMode) {
			if (!formData?.Password) {
				errors.Password = 'Password is required.';
				isValid = false;
			} else if (!formData.Password.match(PASSWORD_REGEX)) {
				errors.Password =
					'Password must contain characters length between 6 to 13 characters which contain at least one lowercase letter, one uppercase letter, one numeric digit and one special character';
				isValid = false;
			}

			if (!formData?.confirmPassword) {
				errors.confirmPassword = 'Please confirm password.';
				isValid = false;
			} else if (formData.Password !== formData.confirmPassword) {
				errors.confirmPassword = 'Password does not match.';
				isValid = false;
			}
		}

		if (!formData?.userTypeId) {
			errors.userTypeId = 'User type is required.';
			isValid = false;
		}

		if (!formData?.branchId) {
			errors.branchId = 'Branch is required.';
			isValid = false;
		}

		if (!formData?.joiningDate) {
			errors.joiningDate = 'Joining date is required.';
			isValid = false;
		}

		if (formData.loginByOTP) {
			if (!formData?.phone) {
				errors.phone = 'Phone number is required.';
				isValid = false;
			} else if (formData.phone.length !== 10) {
				errors.phone = 'Invalid phone number.';
				isValid = false;
			}

			if (!formData?.email) {
				errors.email = 'Email is required.';
				isValid = false;
			} else if (!formData.email.match(EMAIL_REGEX)) {
				errors.email = 'Invalid email.';
				isValid = false;
			}
		} else if (formData?.email && !formData.email.match(EMAIL_REGEX)) {
			errors.email = 'Invalid email.';
			isValid = false;
		}

		setFormErrors(errors);

		if (!isValid) return false;

		const validatePhoneEmail = () => {
			if (formData.loginByOTP) {
				return (
					formData.phone &&
					formData.phone.length === 10 &&
					formData.email &&
					formData.email.match(EMAIL_REGEX)
				);
			}
			return true;
		};

		if (!isFormDialogEditMode) {
			return (
				formData.Password &&
				formData.Password.match(PASSWORD_REGEX) &&
				formData.confirmPassword &&
				formData.Password === formData.confirmPassword &&
				validatePhoneEmail()
			);
		}

		return validatePhoneEmail();
	}, [formData, isFormDialogEditMode]);

	const handleCreateUser = useCallback(async () => {
		if (!validateUser()) return;

		let hashedPassword: string;
		let data;

		if (formData.Password) {
			hashedPassword = hashData(formData.Password);

			data = { ...formData, Password: hashedPassword };

			setIsFormDialogLoading(true);
			try {
				const response = await createUserAsync(data);
				if (
					response &&
					typeof response !== 'boolean' &&
					response.data.status !== 401
				) {
					if (response.data.status === 200) {
						const newUser: UserInterface = {
							...formData,
							userId: response.data.data,
						};
						setAllUserByCompany((prev) =>
							addIndex.addIndex3([newUser, ...prev])
						);
						handleCloseFormDialog();
						handleOpenAlertDialog('success', 'Created new User.');
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
		}
	}, [
		formData,
		validateUser,
		handleCloseFormDialog,
		handleOpenAlertDialog,
		handleLogout,
		setAllUserByCompany,
	]);

	const handleUpdateUser = useCallback(async () => {
		if (!validateUser()) return;

		const data = { ...formData };

		setIsFormDialogLoading(true);
		try {
			const response = await updateUserAsync(data);
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (response.data.status === 200) {
					const updatedUsers = allUserByCompany.map((obj) =>
						obj.userId === formData.userId ? { ...data } : obj
					);

					setAllUserByCompany(addIndex.addIndex3(updatedUsers));
					handleCloseFormDialog();
					handleOpenAlertDialog('success', 'Updated User.');
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
		validateUser,
		handleCloseFormDialog,
		handleOpenAlertDialog,
		handleLogout,
		allUserByCompany,
		setAllUserByCompany,
	]);

	const handleDeleteUser = useCallback(
		async (data: UserInterface) => {
			const confirm = window.confirm(
				`Are you sure you want to delete User '${data.fullName}'?`
			);
			if (!confirm) return;

			const userId = data.userId as number;

			try {
				const response = await deleteUserAsync(userId);
				if (
					response &&
					typeof response !== 'boolean' &&
					response.data.status !== 401
				) {
					if (response.data.status === 200) {
						const updatedUsers = allUserByCompany.filter(
							(obj) => obj.userId !== userId
						);
						setAllUserByCompany(addIndex.addIndex3(updatedUsers));
						handleOpenAlertDialog('success', 'Deleted User.');
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
		[
			allUserByCompany,
			handleLogout,
			handleOpenAlertDialog,
			setAllUserByCompany,
		]
	);

	const columns = useMemo<MRT_ColumnDef<UserInterface>[]>(
		() => [
			{
				accessorKey: 'index',
				header: '#',
				enableResizing: false,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				Cell: ({ row }) => {
					return (
						<>
							<div className='table-index'>
								{row.original.isActive ? (
									<Tooltip title='Active User'>
										<Chip
											icon={<Done />}
											color='success'
										/>
									</Tooltip>
								) : (
									<Tooltip title='Disabled User'>
										<Chip
											icon={<Clear />}
											color='error'
										/>
									</Tooltip>
								)}
								{row.original.index}
							</div>
						</>
					);
				},
			},
			{
				accessorKey: 'fullName',
				header: 'Full Name',
				enableResizing: true,
				size: 150,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				
			},
			{
				accessorKey: 'userTypeId',
				header: 'User Type',
				enableResizing: true,
				size: 200,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				accessorFn: (row) =>
					`${
						findObjectInArray(
							userTypes,
							'userTypeId',
							row.userTypeId
						).userType
					}`,
			},

			{
				accessorKey: 'branchId',
				header: 'Branch Name',
				enableResizing: true,
				size: 200,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				accessorFn: (row) =>
					`${
						findObjectInArray(
							allBranchesByCompany,
							'branchId',
							row.branchId
						).name || "—"
					}`,
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
						<Tooltip title='Delete User'>
							<IconButton
								onClick={() => handleDeleteUser(row.original)}
							>
								<DeleteOutline />
							</IconButton>
						</Tooltip>
						<Tooltip title='Edit User'>
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
		[handleDeleteUser, handleOpenFormDialog]
	);

	const table = useMaterialReactTable({
		columns,
		data: allUserByCompany,
		filterFromLeafRows: true,
		paginateExpandedRows: false,
		enableColumnResizing: true,
		enablePagination: true,
		layoutMode: 'grid',
		enableDensityToggle: false,
		initialState: {
			pagination: { pageSize: 100, pageIndex: 0 },
			density: 'compact',
			sorting: [{ id: "fullName", desc: false }],
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
				data-component='users'
				className='container'
			>
				<div
					data-component='users'
					className='top'
				>
					<Search
						onChange={handleSearch}
						isDisabled={fallbackState !== 'hidden'}
					/>
					{windowWidth > 600 && (
						<Tooltip title='Create New User'>
							<Fab
								variant='extended'
								color='primary'
								data-component='users'
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
					data-component='users'
					className='bottom'
				>
					{fallbackState !== 'hidden' ? (
						<Fallback state={fallbackState} />
					) : (
						<div
							data-component='users'
							className='table-container'
						>
							<MaterialReactTable table={table} />
						</div>
					)}
				</div>
			</div>

			{windowWidth < 600 && (
				<div
					data-component='users'
					className='fab-container'
				>
					<Tooltip title='Create New User'>
						<Fab
							variant='extended'
							color='primary'
							data-component='users'
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
				data-component='users'
				className='dialog'
			>
				<DialogTitle
					data-component='users'
					className='dialog-title'
				>
					{!isFormDialogEditMode ? 'Create New User' : 'Edit User'}
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
					data-component='users'
					className='dialog-content'
				>
					<div
						data-component='users'
						className='container'
					>
						<div
							data-component='users'
							className='column'
						>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
								error={formErrors.fullName ? true : false}
							>
								<InputLabel htmlFor='fullName'>
									Full Name
								</InputLabel>
								<OutlinedInput
									label='Full name'
									id='fullName'
									type='text'
									value={
										formData?.fullName
											? formData?.fullName
											: ''
									}
									name='fullName'
									onChange={handleChange}
								/>
								{formErrors.fullName && (
									<FormHelperText error>
										{formErrors.fullName}
									</FormHelperText>
								)}
							</FormControl>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
								error={formErrors.userName ? true : false}
							>
								<InputLabel htmlFor='username'>
									Username
								</InputLabel>
								<OutlinedInput
									label='Username'
									id='username'
									type='text'
									value={
										formData?.userName
											? formData?.userName
											: ''
									}
									name='userName'
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											userName: e.target.value,
										}));
									}}
								/>
								{formErrors.userName && (
									<FormHelperText error>
										{formErrors.userName}
									</FormHelperText>
								)}
							</FormControl>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
								error={formErrors.phone ? true : false}
							>
								<InputLabel htmlFor='phone'>
									Phone Number
								</InputLabel>
								<OutlinedInput
									label='Phone number'
									id='phone'
									type='number'
									value={
										formData?.phone ? formData?.phone : ''
									}
									name='phone'
									onChange={handleChange}
								/>
								{formErrors.phone && (
									<FormHelperText error>
										{formErrors.phone}
									</FormHelperText>
								)}
							</FormControl>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
								error={formErrors.email ? true : false}
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
								{formErrors.email && (
									<FormHelperText error>
										{formErrors.email}
									</FormHelperText>
								)}
							</FormControl>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
								error={formErrors.userTypeId ? true : false}
							>
								<InputLabel>User Type</InputLabel>
								<Select
									label='User type'
									value={
										formData.userTypeId
											? formData.userTypeId
											: ''
									}
									name='userType'
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											userTypeId: e.target
												.value as number,
										}));
									}}
								>
									{userTypes.map((user) => {
										return (
											<MenuItem
												key={`type-${user.userTypeId}`}
												value={user.userTypeId}
											>
												{user.userType}
											</MenuItem>
										);
									})}
								</Select>
								{formErrors.userTypeId && (
									<FormHelperText error>
										{formErrors.userTypeId}
									</FormHelperText>
								)}
							</FormControl>
						</div>
						<div
							data-component='users'
							className='column'
						>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
								error={formErrors.branchId ? true : false}
							>
								<InputLabel>Branch</InputLabel>
								<Select
									label='Branch'
									value={
										formData.branchId
											? formData.branchId
											: ''
									}
									name='userType'
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											branchId: e.target.value as number,
										}));
									}}
								>
									{allBranchesByCompany.map((branch) => {
										return (
											<MenuItem
												key={`state-${branch.branchId}`}
												value={branch.branchId}
											>
												{branch.name}
											</MenuItem>
										);
									})}
								</Select>
								{formErrors.branchId && (
									<FormHelperText error>
										{formErrors.branchId}
									</FormHelperText>
								)}
							</FormControl>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
							>
								<InputLabel htmlFor='aadhar-number'>
									Aadhaar Number
								</InputLabel>
								<OutlinedInput
									label='Aadhaar Number'
									id='aadhar-number'
									type='number'
									value={
										formData?.aadharNo
											? formData?.aadharNo
											: ''
									}
									name='aadharNo'
									onChange={handleChange}
								/>
							</FormControl>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
							>
								<InputLabel htmlFor='pan-number'>
									PAN Number
								</InputLabel>
								<OutlinedInput
									label='PAN number'
									id='pan-number'
									type='text'
									value={
										formData?.panNo ? formData?.panNo : ''
									}
									name='panNo'
									onChange={handleChange}
								/>
							</FormControl>
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
									rows={4}
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
							data-component='users'
							className='column'
						>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
								error={formErrors.joiningDate ? true : false}
							>
								<LocalizationProvider
									dateAdapter={AdapterDayjs}
								>
									<DatePicker
										label='Date'
										format='DD-MM-YYYY'
										disabled={isFormDialogLoading}
										value={
											formData.joiningDate
												? dayjs(formData.joiningDate)
												: null
										}
										onChange={(date: Dayjs | null) => {
											if (date) {
												setFormData((prev) => ({
													...prev,
													joiningDate:
														date.toISOString(),
												}));
											} else {
												setFormData((prev) => ({
													...prev,
													joiningDate: '',
												}));
											}
										}}
										slotProps={{
											field: {
												shouldRespectLeadingZeros: true,
											},
											popper: {
												placement: 'auto',
											},
										}}
									/>
								</LocalizationProvider>
								{formErrors.joiningDate && (
									<FormHelperText error>
										{formErrors.joiningDate}
									</FormHelperText>
								)}
							</FormControl>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
							>
								<InputLabel htmlFor='salary'>
									Monthly Salary
								</InputLabel>
								<OutlinedInput
									label='Monthly Salary'
									id='salary'
									type='number'
									value={
										formData?.salary ? formData?.salary : ''
									}
									name='salary'
									onChange={handleChange}
								/>
							</FormControl>
							{!isFormDialogEditMode && (
								<>
									<FormControl
										size='medium'
										disabled={isFormDialogLoading}
										variant='outlined'
										fullWidth
										error={
											formErrors.Password ? true : false
										}
									>
										<InputLabel htmlFor='password'>
											Password
										</InputLabel>
										<OutlinedInput
											label='Password'
											id='password'
											type={
												isPasswordVisible
													? 'text'
													: 'password'
											}
											name='Password'
											value={formData.Password}
											onChange={handleChange}
											endAdornment={
												<InputAdornment position='end'>
													<IconButton
														onClick={() => {
															setIsPasswordVisible(
																(prev) => !prev
															);
														}}
														edge='end'
													>
														{isPasswordVisible ? (
															<VisibilityOffOutlined />
														) : (
															<VisibilityOutlined />
														)}
													</IconButton>
												</InputAdornment>
											}
										/>
										{formErrors.Password && (
											<FormHelperText>
												{formErrors.Password}
											</FormHelperText>
										)}
									</FormControl>
									<FormControl
										size='medium'
										disabled={isFormDialogLoading}
										variant='outlined'
										fullWidth
										error={
											formErrors.confirmPassword
												? true
												: false
										}
									>
										<InputLabel htmlFor='confirm-password'>
											Confirm Password
										</InputLabel>
										<OutlinedInput
											label='Confirm password'
											id='confirm-password'
											type={
												isPasswordVisible
													? 'text'
													: 'password'
											}
											name='confirmPassword'
											value={formData.confirmPassword}
											onChange={handleChange}
											endAdornment={
												<InputAdornment position='end'>
													<IconButton
														aria-label='toggle password visibility'
														onClick={() => {
															setIsPasswordVisible(
																(prev) => !prev
															);
														}}
														edge='end'
													>
														{isPasswordVisible ? (
															<VisibilityOffOutlined />
														) : (
															<VisibilityOutlined />
														)}
													</IconButton>
												</InputAdornment>
											}
										/>
										{formErrors.confirmPassword && (
											<FormHelperText>
												{formErrors.confirmPassword}
											</FormHelperText>
										)}
									</FormControl>
								</>
							)}
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
							>
								<FormControlLabel
									control={
										<Checkbox
											checked={formData.loginByOTP}
											name='loginByOTP'
											onChange={(e) => {
												setFormData((prev) => ({
													...prev,
													loginByOTP:
														e.currentTarget.checked,
												}));
											}}
										/>
									}
									label='If checked, you will receive an OTP on WhatsApp or email while logging in.'
								/>
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
								? handleCreateUser
								: handleUpdateUser
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

export default Users;

// -------------------------------------------------------------------------------------------
