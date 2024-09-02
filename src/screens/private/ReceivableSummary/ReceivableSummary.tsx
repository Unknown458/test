// -------------------------------------------------------------------------------------------

import './ReceivableSummary.scss';

import { format } from 'date-fns';
import Decimal from 'decimal.js';
import {
	MaterialReactTable,
	MRT_ColumnDef,
	useMaterialReactTable,
} from 'material-react-table';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { LocalShippingOutlined, Search } from '@mui/icons-material';
import {
	Checkbox,
	FormControl,
	FormHelperText,
	IconButton,
	InputLabel,
	ListItemText,
	MenuItem,
	OutlinedInput,
	Select,
	Tooltip,
} from '@mui/material';

import RouterPath from '../../../app/routerPath';
import Alert from '../../../components/Alert/Alert';
import {
	AlertInterface,
	AlertStates,
} from '../../../components/Alert/Alert.types';
import Fallback from '../../../components/Fallback/Fallback';
import { FallbackStateType } from '../../../components/Fallback/Fallback.types';
import { useApi } from '../../../contexts/Api/Api';
import { useApp } from '../../../contexts/App/App';
import { useAuth } from '../../../contexts/Auth/Auth';
import { BranchInterface } from '../../../services/branch/branch.types';
import { getReceivableSummaryAsync } from '../../../services/loadingMemo/loadingMemo';
import { ReceivableSummaryInterface } from '../../../services/loadingMemo/loadingMemo.types';
import { UserInterface } from '../../../services/user/user.types';
import addIndex from '../../../utils/addIndex';
import findObjectInArray from '../../../utils/findObjectInArray';

// -------------------------------------------------------------------------------------------

const defaultFormData = {
	fromStationIds: '',
};

const defaultFormErrors = { fromStationIds: '' };

// -------------------------------------------------------------------------------------------

const ReceivableSummary = memo(() => {
	const navigate = useNavigate();
	const { setTitle } = useApp();
	const { handleLogout } = useAuth();
	const {
		getUserDetails,
		getAllActiveBookingBranches,
		getAllActiveDeliveryBranches,
	} = useApi();

	const [fallbackState, setFallbackState] =
		useState<FallbackStateType>('not-found');
	const [bookingBranches, _setBookingBranches] = useState<BranchInterface[]>(
		[]
	);
	const [deliveryBranches, _setDeliveryBranches] = useState<
		BranchInterface[]
	>([]);
	const [filteredbookingBranches, _setFilteredBookingBranches] = useState<
		BranchInterface[]
	>([]);
	const [formData, _setFormData] = useState(defaultFormData);
	const [formErrors, setFormErrors] = useState(defaultFormErrors);
	const [alertDialog, setAlertDialog] = useState<AlertInterface>({
		state: 'success',
		label: '',
		isActive: false,
	});
	const [selectedFromBranches, setSelectedFromBranches] = useState<number[]>(
		[]
	);
	const [user, setUser] = useState<UserInterface>();
	const [receivableSummary, setReceivableSummary] = useState<
		ReceivableSummaryInterface[]
	>([]);

	useEffect(() => {
		setTitle('Receivable Summary');
		initialFetch();
	}, [setTitle]);

	const initialFetch = async () => {
		const allActiveBookingBranches = await getAllActiveBookingBranches();
		const allActiveDeliveryBranches = await getAllActiveDeliveryBranches();
		const userData = await getUserDetails();

		if (
			allActiveBookingBranches.length !== 0 &&
			allActiveDeliveryBranches.length !== 0
		) {
			setUser(userData);

			_setBookingBranches(allActiveBookingBranches);
			_setDeliveryBranches(allActiveDeliveryBranches);

			if (userData && userData?.branchId) {
				const filteredBranches = allActiveBookingBranches
					.filter((branch) => branch.branchId !== userData.branchId)
					.sort((a, b) => a.name.localeCompare(b.name));

				_setFilteredBookingBranches(filteredBranches);
			}
		}
	};

	const handleOpenAlertDialog = useCallback(
		(state: AlertStates, label: string) => {
			setAlertDialog({ state, label, isActive: true });
		},
		[]
	);

	const handleCloseAlertDialog = useCallback(() => {
		setAlertDialog({ state: 'success', label: '', isActive: false });
	}, []);

	const validateForm = (): boolean => {
		const errors = { ...defaultFormErrors };

		if (selectedFromBranches.length === 0) {
			errors.fromStationIds = 'From Branch is required.';
		}

		setFormErrors(errors);

		return Object.values(errors).every((error) => error === '');
	};

	const handleGetReceivableSummaryAsync = async () => {
		if (!validateForm()) return;

		setFallbackState('loading');

		const stringOfSelectedFromBranches = selectedFromBranches.join(',');

		const response = await getReceivableSummaryAsync(
			selectedFromBranches.length !== 0
				? stringOfSelectedFromBranches
				: '',
			user?.branchId ? user?.branchId : 0
		);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: any = response.data.data;

			if (data && data.length !== 0) {
				setReceivableSummary(addIndex.addIndex2(data.reverse()));
				setFallbackState('hidden');
			} else {
				handleOpenAlertDialog(
					'warning',
					`No Receivable Summary found.`
				);
				setFallbackState('not-found');
			}
		} else {
			handleLogout();
		}
	};

	const columns = useMemo<MRT_ColumnDef<ReceivableSummaryInterface>[]>(
		() => [
			{
				accessorKey: 'truckNo',
				header: 'Truck No.',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'ldmNo',
				header: 'LDM No.',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'ldmDate',
				header: 'LDM Date',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				accessorFn: (row) => format(row.ldmDate, 'dd-MM-yyyy'),
			},
			{
				accessorKey: 'fromStationId',
				header: 'From',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				accessorFn: (row) =>
					findObjectInArray(
						[...bookingBranches],
						'branchId',
						row.fromStationId
					).name,
			},
			{
				accessorKey: 'toStationId',
				header: 'To',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				accessorFn: (row) =>
					findObjectInArray(
						[...bookingBranches, ...deliveryBranches],
						'branchId',
						row.toStationId
					).name,
			},
			{
				accessorKey: 'totalLR',
				header: 'Total LR',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'article',
				header: 'Art.',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'actualWeight',
				header: 'Act. Weight',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'chargeWeight',
				header: 'Chg. Weight',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'driverName',
				header: 'Driver Name',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'driverContactNo',
				header: 'Driver No.',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'brokerName',
				header: 'Broker Name',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				accessorFn: (row) => (row.brokerName ? row.brokerName : '--'),
			},
			{
				accessorKey: 'brokerContactNo',
				header: 'Broker No.',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				accessorFn: (row) =>
					row.brokerContactNo ? row.brokerContactNo : '--',
			},
			{
				accessorKey: 'toPay',
				header: 'TOPAY',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'right' },
				muiTableBodyCellProps: { align: 'right' },
				muiTableFooterCellProps: { align: 'right' },
				accessorFn: (row) =>
					row.toPay ? (+row.toPay).toFixed(2).toString() : '0',
			},
			{
				accessorKey: 'paid',
				header: 'PAID',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'right' },
				muiTableBodyCellProps: { align: 'right' },
				muiTableFooterCellProps: { align: 'right' },
				accessorFn: (row) =>
					row.paid ? (+row.paid).toFixed(2).toString() : '0',
			},
			{
				accessorKey: 'tbb',
				header: 'TBB',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'right' },
				muiTableBodyCellProps: { align: 'right' },
				muiTableFooterCellProps: { align: 'right' },
				accessorFn: (row) =>
					row.tbb ? (+row.tbb).toFixed(2).toString() : '0',
			},
			{
				accessorKey: 'total',
				header: 'Vasuli',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'right' },
				muiTableBodyCellProps: { align: 'right' },
				muiTableFooterCellProps: { align: 'right' },
				accessorFn: (row) => {
					let total = +new Decimal(+row.toPay)
						.plus(+row.paid)
						.plus(+row.tbb);

					return `${total ? total.toFixed(2) : 0}`;
				},
			},
			{
				accessorKey: 'actions',
				header: 'Actions',
				enableResizing: false,
				enableColumnFilter: false,
				enableSorting: false,
				size: 10,
				muiTableHeadCellProps: { align: 'center' },
				muiTableBodyCellProps: { align: 'center' },
				muiTableFooterCellProps: { align: 'center' },
				Cell: ({ row }) => (
					<>
						<Tooltip title='Receive'>
							<IconButton
								onClick={() => {
									navigate(RouterPath.ImportLoadingMemo, {
										state: {
											importLoadingMemo: row.original,
										},
									});
								}}
							>
								<LocalShippingOutlined />
							</IconButton>
						</Tooltip>
					</>
				),
			},
		],
		[formData, selectedFromBranches, receivableSummary]
	);

	const table = useMaterialReactTable({
		columns,
		data: receivableSummary,
		filterFromLeafRows: true,
		paginateExpandedRows: false,
		enableColumnResizing: true,
		enablePagination: true,
		layoutMode: 'semantic',
		enableDensityToggle: false,
		enableColumnPinning: true,
		initialState: {
			pagination: { pageSize: 100, pageIndex: 0 },
			density: 'compact',
			columnPinning: {
				left: ['actions'],
			},
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
				data-component='receivable-summary'
				className='container'
			>
				<div
					data-component='receivable-summary'
					className='top'
				>
					<div
						data-component='receivable-summary'
						className='container'
					>
						<div
							data-component='receivable-summary'
							className='columns-1'
						>
							<div
								data-component='receivable-summary'
								className='from-branches-container'
							>
								<FormControl
									fullWidth
									size='small'
									error={!!formErrors.fromStationIds}
									disabled={false}
								>
									<InputLabel>From</InputLabel>
									<Select
										multiple
										value={selectedFromBranches}
										onChange={(event) => {
											const value = event.target
												.value as number[];

											const hasZero =
												value.find((id) => id === 0) ===
													0 && true;

											if (hasZero) {
												if (
													selectedFromBranches.length !==
													filteredbookingBranches.length
												) {
													const allFromBranches =
														filteredbookingBranches.map(
															(branch) =>
																branch.branchId as number
														);
													setSelectedFromBranches(
														allFromBranches
													);
												} else {
													setSelectedFromBranches([]);
												}
											} else {
												setSelectedFromBranches(value);
											}
										}}
										input={<OutlinedInput label='From' />}
										renderValue={(selected) =>
											(selected as number[])
												.map(
													(branchId) =>
														filteredbookingBranches.find(
															(branch) =>
																branch.branchId ===
																branchId
														)?.name
												)
												.join(', ')
										}
									>
										<MenuItem value={0}>
											<Checkbox
												checked={
													selectedFromBranches.length ===
													filteredbookingBranches.length
												}
											/>
											<ListItemText primary='All' />
										</MenuItem>
										{filteredbookingBranches.map(
											(branch) => (
												<MenuItem
													key={branch.branchId}
													value={branch.branchId}
												>
													<Checkbox
														checked={
															selectedFromBranches.indexOf(
																branch.branchId as number
															) > -1
														}
													/>
													<ListItemText
														primary={branch.name}
													/>
												</MenuItem>
											)
										)}
									</Select>
									{formErrors.fromStationIds && (
										<FormHelperText>
											{formErrors.fromStationIds}
										</FormHelperText>
									)}
								</FormControl>
								<Tooltip title='Search'>
									<IconButton
										color='primary'
										disabled={
											fallbackState === 'loading'
												? true
												: false
										}
										onClick={
											handleGetReceivableSummaryAsync
										}
									>
										<Search />
									</IconButton>
								</Tooltip>
							</div>
						</div>
					</div>
				</div>
				<div
					data-component='receivable-summary'
					className='bottom'
				>
					{fallbackState !== 'hidden' ? (
						<Fallback state={fallbackState} />
					) : (
						<>
							<div
								data-component='receivable-summary'
								className='table-container'
							>
								<MaterialReactTable table={table} />
							</div>
						</>
					)}
				</div>
			</div>

			<Alert
				{...alertDialog}
				onClose={handleCloseAlertDialog}
			/>
		</>
	);
});

// -------------------------------------------------------------------------------------------

export default ReceivableSummary;

// -------------------------------------------------------------------------------------------
