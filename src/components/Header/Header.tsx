// -------------------------------------------------------------------------------------------

import './Header.scss';

import { format } from 'date-fns';
import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    ChevronLeftOutlined, ChevronRightOutlined, EditOutlined, Logout, MenuOutlined, PersonOutline,
    Search, SearchOutlined
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl,
    IconButton, InputLabel, Menu, MenuItem, OutlinedInput, Tooltip, useMediaQuery, useTheme
} from '@mui/material';

import RouterPath from '../../app/routerPath';
import { useApi } from '../../contexts/Api/Api';
import { useApp } from '../../contexts/App/App';
import { useAuth } from '../../contexts/Auth/Auth';
import { getBookingDetailsAsync } from '../../services/booking/booking';
import { BookingInterface } from '../../services/booking/booking.types';
import { BillTypeInterface } from '../../services/branchLrNumber/branchLrNumber.types';
import { UserInterface } from '../../services/user/user.types';
import addIndex from '../../utils/addIndex';
import findObjectInArray from '../../utils/findObjectInArray';
import Alert from '../Alert/Alert';
import { AlertInterface, AlertStates } from '../Alert/Alert.types';
import { HeaderInterface } from './Header.types';

// -------------------------------------------------------------------------------------------

const getMenuTooltip = (navigationState: string, windowWidth: number) => {
	if (navigationState === 'open') {
		return windowWidth > 600 ? 'Shrink Menu' : 'Close Menu';
	} else if (navigationState === 'semi-open') {
		return 'Close Menu';
	} else {
		return 'Open Menu';
	}
};

// -------------------------------------------------------------------------------------------

const getMenuIcon = (navigationState: string, windowWidth: number) => {
	if (navigationState === 'open' || navigationState === 'semi-open') {
		return <ChevronLeftOutlined />;
	} else if (windowWidth > 600) {
		return <ChevronRightOutlined />;
	} else {
		return <MenuOutlined />;
	}
};

// -------------------------------------------------------------------------------------------

const Header = memo(({ onClick, navigationState }: HeaderInterface) => {
	const { getUserDetails, getBillTypes } = useApi();
	const navigate = useNavigate();
	const [isSearchLrNumberDialogOpen, setIsSearchLrNumberDialogOpen] =
		useState(false);
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	const { title } = useApp();
	const { handleLogout } = useAuth();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [user, setUser] = useState<UserInterface>();
	const [alertDialog, setAlertDialog] = useState<AlertInterface>({
		state: 'success',
		label: '',
		isActive: false,
	});
	const [billTypes, _setBillTypes] = useState<BillTypeInterface[]>([]);

	const updateWindowWidth = useCallback(() => {
		setWindowWidth(window.innerWidth);
	}, []);
	const [searchInput, setSearchInput] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);
	const [bookingDetails, setBookingDetails] = useState<BookingInterface[]>(
		[]
	);
	const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);

	const theme = useTheme();
	const isDialogFullScreen = useMediaQuery(theme.breakpoints.down('sm'));

	useEffect(() => {
		initialFetch();
	}, []);

	const initialFetch = useCallback(async () => {
		const userData = await getUserDetails();
		const billTypesData = await getBillTypes();

		if (userData && billTypesData.length !== 0) {
			setUser(userData);
			_setBillTypes(billTypesData);
		}
	}, [getUserDetails, billTypes]);

	useEffect(() => {
		window.addEventListener('resize', updateWindowWidth);
		return () => {
			window.removeEventListener('resize', updateWindowWidth);
		};
	}, [updateWindowWidth]);

	const menuTooltip = useMemo(
		() => getMenuTooltip(navigationState, windowWidth),
		[navigationState, windowWidth]
	);
	const menuIcon = useMemo(
		() => getMenuIcon(navigationState, windowWidth),
		[navigationState, windowWidth]
	);

	const handleAvatarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const handleOpenSearchLrNumberDialog = useCallback(() => {
		setIsSearchLrNumberDialogOpen(true);
	}, []);

	const handleCloseSearchLrNumberDialog = useCallback(() => {
		setIsSearchLrNumberDialogOpen(false);
	}, []);

	const handleOpenAlertDialog = (state: AlertStates, label: string) => {
		setAlertDialog({
			state: state,
			label: label,
			isActive: true,
		});
	};

	const handleCloseAlertDialog = () => {
		setAlertDialog({
			state: 'success',
			label: '',
			isActive: false,
		});
	};

	const handleFormDialogOpen = () => {
		setIsFormDialogOpen(true);
	};

	const handleFormDialogClose = () => {
		setIsFormDialogOpen(false);
		setSearchInput('');
		setBookingDetails([]);
	};

	const handleGetBookingDetails = useCallback(async () => {
		if (searchInput) {
			const data = {
				fromBranchId: user?.branchId,
				lrNumber: +searchInput,
			};

			setIsLoading(true);

			const response = await getBookingDetailsAsync(data);

			setIsLoading(false);

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (
					response.data.status === 200 &&
					response.data.data.length !== 0
				) {
					const data: BookingInterface[] =
						response.data.data.reverse();

					if (data.length === 1) {
						navigate(RouterPath.Booking, {
							state: {
								bookingDetails: data[0],
							},
						});

						setSearchInput('');
					} else {
						handleFormDialogOpen();
						setBookingDetails(addIndex.addIndex2(data));
					}
				} else {
					handleOpenAlertDialog('warning', 'No booking found.');
				}
			} else {
				handleLogout();
			}
		} else {
			handleOpenAlertDialog('warning', 'Please enter LR Number');
		}
	}, [searchInput, bookingDetails]);

	const onEnter = (event: any) => {
		if (event.key === 'Enter') {
			handleGetBookingDetails();
		}
	};

	const columnsWithBillType = useMemo<MRT_ColumnDef<BookingInterface>[]>(
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
				accessorKey: 'fromBranch',
				header: 'From',
				size: 150,
				enableResizing: true,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'toBranch',
				header: 'To',
				size: 150,
				enableResizing: true,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'bookingDate',
				header: 'Booking Date',
				enableResizing: true,
				size: 120,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				accessorFn: (row) => format(row.bookingDate, 'dd-MM-yyyy'),
			},
			{
				accessorKey: 'billTypeId',
				header: 'Bill Type',
				enableResizing: true,
				size: 120,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				accessorFn: (row) =>
					`${
						findObjectInArray(
							billTypes,
							'billTypeId',
							row.billTypeId
						).billType
					}`,
			},
			{
				accessorKey: 'grandTotal',
				header: 'Grand Total',
				enableResizing: true,
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
				muiTableHeadCellProps: {
					align: 'right',
				},
				muiTableBodyCellProps: {
					align: 'right',
				},
				muiTableFooterCellProps: {
					align: 'right',
				},
				Cell: ({ row }) => {
					return (
						<>
							<Tooltip title='Edit'>
								<IconButton
									onClick={() => {
										navigate(RouterPath.Booking, {
											state: {
												bookingDetails: row.original,
											},
										});

										handleFormDialogClose();
									}}
								>
									<EditOutlined />
								</IconButton>
							</Tooltip>
						</>
					);
				},
			},
		],
		[bookingDetails]
	);

	const columnsWithoutBillType = useMemo<MRT_ColumnDef<BookingInterface>[]>(
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
				accessorKey: 'fromBranch',
				header: 'From',
				size: 150,
				enableResizing: true,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'toBranch',
				header: 'To',
				size: 150,
				enableResizing: true,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'bookingDate',
				header: 'Booking Date',
				enableResizing: true,
				size: 120,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				accessorFn: (row) => format(row.bookingDate, 'dd-MM-yyyy'),
			},
			{
				accessorKey: 'grandTotal',
				header: 'Grand Total',
				enableResizing: true,
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
				muiTableHeadCellProps: {
					align: 'right',
				},
				muiTableBodyCellProps: {
					align: 'right',
				},
				muiTableFooterCellProps: {
					align: 'right',
				},
				Cell: ({ row }) => {
					return (
						<>
							<Tooltip title='Edit'>
								<IconButton
									onClick={() => {
										navigate(RouterPath.Booking, {
											state: {
												bookingDetails: row.original,
											},
										});

										handleFormDialogClose();
									}}
								>
									<EditOutlined />
								</IconButton>
							</Tooltip>
						</>
					);
				},
			},
		],
		[bookingDetails]
	);

	const table = useMaterialReactTable({
		columns: user?.displayEstimate
			? columnsWithBillType
			: columnsWithoutBillType,
		data: bookingDetails,
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
	});

	return (
		<>
			<div
				data-component='header'
				className='container'
			>
				<div
					data-component='header'
					className='left'
				>
					<Tooltip title={menuTooltip}>
						<IconButton onClick={onClick}>{menuIcon}</IconButton>
					</Tooltip>
					<div
						data-component='header'
						className='title title-large'
					>
						{title}
					</div>
				</div>
				<div
					data-component='header'
					className='right'
				>
					<div
						data-component='header'
						className='search'
					>
						<Tooltip title='Search LR Number'>
							<div
								data-component='header'
								className='icon'
								onClick={() =>
									windowWidth < 600 &&
									handleOpenSearchLrNumberDialog()
								}
							>
								<SearchOutlined />
							</div>
						</Tooltip>
						{windowWidth > 600 && (
							<>
								<input
									data-component='header'
									className='input body-large'
									placeholder='Search '
									type='number'
									value={searchInput}
									onChange={(event) =>
										setSearchInput(event.target.value)
									}
									onKeyDown={onEnter}
									disabled={isLoading}
								/>
								<div
									data-component='header'
									className='button'
								>
									<Tooltip title='Search LR Number'>
										<IconButton
											color='primary'
											onClick={handleGetBookingDetails}
										>
											{!isLoading ? (
												<Search />
											) : (
												<CircularProgress size={24} />
											)}
										</IconButton>
									</Tooltip>
								</div>
							</>
						)}
					</div>
					<Tooltip title='My Account'>
						<IconButton
							onClick={handleAvatarClick}
							color='primary'
						>
							<PersonOutline />
						</IconButton>
					</Tooltip>
					<Menu
						anchorEl={anchorEl}
						open={Boolean(anchorEl)}
						onClose={handleMenuClose}
					>
						<MenuItem onClick={handleLogout}>
							<Logout /> Logout
						</MenuItem>
					</Menu>
				</div>
			</div>
			<Dialog
				open={isSearchLrNumberDialogOpen}
				onClose={handleCloseSearchLrNumberDialog}
				maxWidth='sm'
				fullWidth
			>
				<DialogTitle>Search LR Number</DialogTitle>
				<DialogContent>
					<FormControl
						size='medium'
						variant='outlined'
						fullWidth
						margin='dense'
					>
						<InputLabel htmlFor='search-lr-number'>
							Search LR Number
						</InputLabel>
						<OutlinedInput
							label='Search LR Number'
							id='search-lr-number'
							type='number'
							value={searchInput}
							onChange={(event) =>
								setSearchInput(event.target.value)
							}
							onKeyDown={onEnter}
							disabled={isLoading}
						/>
					</FormControl>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseSearchLrNumberDialog}>
						Close
					</Button>
					<LoadingButton
						color='primary'
						onClick={handleGetBookingDetails}
						loading={isLoading}
						type='submit'
					>
						Search
					</LoadingButton>
				</DialogActions>
			</Dialog>
			<Dialog
				open={isFormDialogOpen}
				onClose={handleFormDialogClose}
				data-component='article-shapes'
				className='dialog'
				fullWidth={true}
				maxWidth='lg'
				fullScreen={isDialogFullScreen}
			>
				<DialogTitle>
					Booking details for LR Number {searchInput}
				</DialogTitle>
				<DialogContent
					data-component='article-shapes'
					className='dialog-content'
				>
					<MaterialReactTable table={table} />
				</DialogContent>
				<DialogActions>
					<Button
						data-component='article-shapes'
						className='text-button'
						onClick={handleFormDialogClose}
					>
						Close
					</Button>
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

export default Header;

// -------------------------------------------------------------------------------------------
