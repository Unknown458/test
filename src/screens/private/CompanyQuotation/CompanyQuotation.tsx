// -------------------------------------------------------------------------------------------

import './CompanyQuotation.scss';

import {
	MaterialReactTable,
	MRT_ColumnDef,
	useMaterialReactTable,
} from 'material-react-table';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { AddOutlined, DeleteOutline, EditOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Fab,
	FormControl,
	FormHelperText,
	IconButton,
	InputLabel,
	MenuItem,
	OutlinedInput,
	Select,
	Tooltip,
	useMediaQuery,
	useTheme,
} from '@mui/material';

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
import { ArticleShapeInterface } from '../../../services/articleShape/articleShape.types';
import { BranchInterface } from '../../../services/branch/branch.types';
import { GoodsTypeInterface } from '../../../services/goodsType/goodsType.types';
import { BillTypeInterface } from '../../../services/branchLrNumber/branchLrNumber.types';
import {
	createCompanyQuotationAsync,
	deleteCompanyQuotationAsync,
	updateCompanyQuotationAsync,
} from '../../../services/quotation/quotation';
import {
	CompanyQuotationInterface,
	RateTypeInterface,
} from '../../../services/quotation/quotation.types';
import { UserInterface } from '../../../services/user/user.types';
import addIndex from '../../../utils/addIndex';
import findObjectInArray from '../../../utils/findObjectInArray';

// -------------------------------------------------------------------------------------------

const defaultFormData: CompanyQuotationInterface = {
	fromId: 0,
	toId: 0,
	goodsTypeId: 0,
	shapeId: 0,
	billTypeId: 0,
	rateType: '',
	rate: 0,
	companyId: 0,
	userId: 0,
};

const defaultFormErrors = {
	fromId: '',
	toId: '',
	goodsTypeId: '',
	shapeId: '',
	billTypeId: '',
	rateType: '',
	rate: '',
};

// -------------------------------------------------------------------------------------------

const CompanyQuotation = memo(() => {
	const { setTitle } = useApp();
	const { handleLogout } = useAuth();
	const {
		getCompanyQuotationsByCompany,
		getRateTypes,
		getAllActiveBookingBranches,
		getAllActiveDeliveryBranches,
		getGoodsTypes,
		getArticleShapes,
		getUserDetails,
		getBillTypes,
		setCompanyQuotationsByCompany,
	} = useApi();

	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	const [billTypes, _setBillTypes] = useState<BillTypeInterface[]>([]);
	const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
	const [isFormDialogEditMode, setIsFormDialogEditMode] = useState(false);
	const [isFormDialogLoading, setIsFormDialogLoading] = useState(false);

	const [fallbackState, setFallbackState] =
		useState<FallbackStateType>('loading');
	const [companyQuotations, _setCompanyQuotations] = useState<
		CompanyQuotationInterface[]
	>([]);
	const [rateTypes, _setRateTypes] = useState<RateTypeInterface[]>([]);
	const [activeBookingBranches, _setActiveBookingBranches] = useState<
		BranchInterface[]
	>([]);
	const [activeDeliveryBranches, _setActiveDeliveryBranches] = useState<
		BranchInterface[]
	>([]);
	const [goodsTypes, _setGoodsTypes] = useState<GoodsTypeInterface[]>([]);
	const [articleShapes, _setArticleShapes] = useState<
		ArticleShapeInterface[]
	>([]);
	const [user, _setUser] = useState<UserInterface>();

	const [formData, setFormData] =
		useState<CompanyQuotationInterface>(defaultFormData);
	const [formErrors, setFormErrors] = useState(defaultFormErrors);
	const [alertDialog, setAlertDialog] = useState<AlertInterface>({
		state: 'success',
		label: '',
		isActive: false,
	});

	const theme = useTheme();
	const isDialogFullScreen = useMediaQuery(theme.breakpoints.down('sm'));

	useEffect(() => {
		setTitle('Company Quotations');
		initialFetch();
	}, [setTitle, getCompanyQuotationsByCompany]);

	useEffect(() => {
		const updateWindowWidth = () => setWindowWidth(window.innerWidth);
		window.addEventListener('resize', updateWindowWidth);

		fetchBranches();

		return () => window.removeEventListener('resize', updateWindowWidth);
	}, []);

	const fetchBranches = async () => { };

	const initialFetch = useCallback(async () => {
		const companyQuotationsData = await getCompanyQuotationsByCompany();
		const rateTypesData = await getRateTypes();
		const goodsTypesData = await getGoodsTypes();
		const articleShapesData = await getArticleShapes();
		const userData = await getUserDetails();
		const billTypesData = await getBillTypes();
		if (activeBookingBranches.length === 0) {
			const activeBookingBranchesData =
				await getAllActiveBookingBranches();
			_setActiveBookingBranches(activeBookingBranchesData);
		}

		if (activeDeliveryBranches.length === 0) {
			const activeDeliveryBranchesData =
				await getAllActiveDeliveryBranches();
			_setActiveDeliveryBranches(activeDeliveryBranchesData);
		}

		if (
			rateTypesData.length !== 0 &&
			goodsTypesData.length !== 0 &&
			articleShapesData.length !== 0 &&
			userData
		) {
			_setCompanyQuotations(companyQuotationsData);
			_setRateTypes(rateTypesData);
			_setGoodsTypes(goodsTypesData);
			_setArticleShapes(articleShapesData);
			_setUser(userData);
			setFallbackState('hidden');
			_setBillTypes(billTypesData);
		} else {
			setFallbackState('not-found');
		}

		if (companyQuotationsData.length !== 0) {
			setFallbackState('hidden');
		} else {
			setFallbackState('not-found');
		}
	}, [
		getCompanyQuotationsByCompany,
		getRateTypes,
		getGoodsTypes,
		getArticleShapes,
		getUserDetails,
	]);

	const handleOpenFormDialog = useCallback(
		(data?: CompanyQuotationInterface) => {
			setIsFormDialogOpen(true);
			if (data) {
				setFormData(data);
				setIsFormDialogEditMode(true);
			}
		},
		[]
	);

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
		const array = await getCompanyQuotationsByCompany();
		if (!keyword || keyword.trim() === '') {
			_setCompanyQuotations(array);
			return;
		}
		const regex = new RegExp(keyword.trim(), 'i');
		const filteredCompanyQuotation = array.filter(
			(quotation: CompanyQuotationInterface) => {
				const billTypeId = findObjectInArray(
					billTypes,
					'billTypeId',
					quotation.billTypeId,
				)
				const fromId = findObjectInArray(
					activeBookingBranches,
					'branchId',
					quotation.fromId
				).name;

				const toId = findObjectInArray(
					activeDeliveryBranches,
					'branchId',
					quotation.toId
				).name;

				const goodsTypeId = findObjectInArray(
					goodsTypes,
					'goodsTypeId',
					quotation.goodsTypeId
				).goodsType;

				const shapeId = findObjectInArray(
					articleShapes,
					'articleShapeId',
					quotation.shapeId
				).article;

				const rateType = quotation.rateType || '';
				const rate = quotation.rate?.toString() || '';

				return (
					regex.test(billTypeId) ||
					regex.test(fromId) ||
					regex.test(toId) ||
					regex.test(goodsTypeId) ||
					regex.test(shapeId) ||
					regex.test(rateType) ||
					regex.test(rate)
				);
			}
		);
		_setCompanyQuotations(addIndex.addIndex5(filteredCompanyQuotation));
	};

	const validateCompanyQuotation = useCallback((): boolean => {
		const errors = { ...defaultFormErrors };
		if (!formData?.fromId) {
			errors.fromId = 'From is required.';
		}
		if (!formData?.toId) {
			errors.toId = 'To is required.';
		}
		// if (!formData?.goodsTypeId) {
		// 	errors.goodsTypeId = 'Goods Type is required.';
		// }
		// if (!formData?.shapeId) {
		// 	errors.shapeId = 'Article Shape is required.';
		// }
		if(!formData?.billTypeId){
			errors.billTypeId = 'Bill Type is required.';
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

	const handleCreateCompanyQuotation = useCallback(async () => {
		if (!validateCompanyQuotation()) return;

		const data = {
			billTypeId : formData.billTypeId ? formData.billTypeId : 0,
			fromId: formData.fromId ? formData.fromId : 0,
			toId: formData.toId ? formData.toId : 0,
			goodsTypeId: formData.goodsTypeId ? formData.goodsTypeId : null,
			shapeId: formData.shapeId.toString() ==='All' ? null : formData.shapeId,
			rateType: formData.rateType ? formData.rateType : '',
			rate: formData.rate ? formData.rate : 0,
			companyId: user?.companyId ? user?.companyId : 0,
			userId: user?.userId ? user?.userId : 0,
		};

		

		setIsFormDialogLoading(true);
		try {
			const response = await createCompanyQuotationAsync(data);
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (response.data.status === 200) {
					const newCompanyQuotation: CompanyQuotationInterface = {
						...formData,
						companyQuotationId: response.data.data,
					};
					setCompanyQuotationsByCompany((prev) =>
						addIndex.addIndex5([newCompanyQuotation, ...prev])
					);
					handleCloseFormDialog();
					handleOpenAlertDialog(
						'success',
						'Created new Company Quotation.'
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
		validateCompanyQuotation,
		handleCloseFormDialog,
		handleOpenAlertDialog,
		handleLogout,
		setCompanyQuotationsByCompany,
	]);

	

	const handleUpdateCompanyQuotation = useCallback(async () => {
		if (!validateCompanyQuotation()) return;

		const data = {
			companyQuotationId: formData.companyQuotationId
				? formData.companyQuotationId
				: 0,
			fromId: formData.fromId ? formData.fromId : 0,
			toId: formData.toId ? formData.toId : 0,
			billTypeId : formData.billTypeId ? formData.billTypeId : 0,
			goodsTypeId: formData.goodsTypeId ? formData.goodsTypeId : 0,
			shapeId: formData?.shapeId?.toString()==='All' ?   0 : formData.shapeId,
			rateType: formData.rateType ? formData.rateType : '',
			rate: formData.rate ? formData.rate : 0,
			companyId: user?.companyId ? user?.companyId : 0,
			userId: user?.userId ? user?.userId : 0,
		};

		setIsFormDialogLoading(true);
		try {
			const response = await updateCompanyQuotationAsync(data);
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (response.data.status === 200) {
					const updatedCompanyQuotations = companyQuotations.map(
						(obj) =>
							obj.companyQuotationId ===
								formData.companyQuotationId
								? data
								: obj
					);

					setCompanyQuotationsByCompany(
						addIndex.addIndex5(updatedCompanyQuotations)
					);
					handleCloseFormDialog();
					handleOpenAlertDialog(
						'success',
						'Updated Company Quotation.'
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
		validateCompanyQuotation,
		handleCloseFormDialog,
		handleOpenAlertDialog,
		handleLogout,
		companyQuotations,
		setCompanyQuotationsByCompany,
	]);

	const handleDeleteCompanyQuotation = useCallback(
		async (data: CompanyQuotationInterface) => {
			const confirm = window.confirm(
				`Are you sure you want to delete Company Quotation?`
			);
			if (!confirm) return;

			const companyQuotationId = data.companyQuotationId as number;

			try {
				const response = await deleteCompanyQuotationAsync(
					companyQuotationId
				);
				if (
					response &&
					typeof response !== 'boolean' &&
					response.data.status !== 401
				) {
					if (response.data.status === 200) {
						const updatedCompanyQuotations =
							companyQuotations.filter(
								(obj) =>
									obj.companyQuotationId !==
									companyQuotationId
							);
						setCompanyQuotationsByCompany(
							addIndex.addIndex5(updatedCompanyQuotations)
						);
						handleOpenAlertDialog(
							'success',
							'Deleted Company Quotation.'
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
		[
			companyQuotations,
			handleLogout,
			handleOpenAlertDialog,
			setCompanyQuotationsByCompany,
		]
	);

	const columns = useMemo<MRT_ColumnDef<CompanyQuotationInterface>[]>(
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
				accessorKey: 'billTypeId',
				header: 'Bill Type',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				accessorFn: (row) =>
					
						findObjectInArray(
							billTypes,
							'billTypeId',
							row.billTypeId
						)?.billType || ''
					,
			},
			{
				accessorKey: 'fromId',
				header: 'From',
				enableResizing: true,
				muiTableHeadCellProps: {
					align: 'left',
				},
				muiTableBodyCellProps: {
					align: 'left',
				},
				muiTableFooterCellProps: {
					align: 'left',
				},
				accessorFn: (row) => 
					findObjectInArray(
						activeBookingBranches,
						'branchId',
						row.fromId
					).name,
				sortingFn: (rowA, rowB) => {
					const nameA = findObjectInArray(
						activeBookingBranches,
						'branchId',
						rowA.original.fromId
					).name.toLowerCase();
					const nameB = findObjectInArray(
						activeBookingBranches,
						'branchId',
						rowB.original.fromId
					).name.toLowerCase();
					return nameA.localeCompare(nameB);
				},
			},
			{
				accessorKey: 'toId',
				header: 'To',
				enableResizing: true,
				muiTableHeadCellProps: {
					align: 'left',
				},
				muiTableBodyCellProps: {
					align: 'left',
				},
				muiTableFooterCellProps: {
					align: 'left',
				},
				accessorFn: (row) =>
					findObjectInArray(
						activeDeliveryBranches,
						'branchId',
						row.toId
					).name,
			},
			// {
			// 	accessorKey: 'goodsTypeId',
			// 	header: 'Goods Type',
			// 	enableResizing: true,
			// 	muiTableHeadCellProps: {
			// 		align: 'left',
			// 	},
			// 	muiTableBodyCellProps: {
			// 		align: 'left',
			// 	},
			// 	muiTableFooterCellProps: {
			// 		align: 'left',
			// 	},
			// 	accessorFn: (row) =>
			// 		findObjectInArray(
			// 			goodsTypes,
			// 			'goodsTypeId',
			// 			row.goodsTypeId
			// 		).goodsType,
			// },
			{
				accessorKey: 'shapeId',
				header: 'Article Shape',
				enableResizing: true,
				muiTableHeadCellProps: {
					align: 'left',
				},
				muiTableBodyCellProps: {
					align: 'left',
				},
				muiTableFooterCellProps: {
					align: 'left',
				},
				accessorFn: (row) =>
					findObjectInArray(
						articleShapes,
						'articleShapeId',
						row.shapeId
					).articleShape ? findObjectInArray(
						articleShapes,
						'articleShapeId',
						row.shapeId
					).articleShape : 'All',
			},
			{
				accessorKey: 'rateType',
				header: 'Rate Type',
				enableResizing: true,
				muiTableHeadCellProps: {
					align: 'left',
				},
				muiTableBodyCellProps: {
					align: 'left',
				},
				muiTableFooterCellProps: {
					align: 'left',
				},
			},
			{
				accessorKey: 'rate',
				header: 'Rate',
				enableResizing: true,
				muiTableHeadCellProps: {
					align: 'left',
				},
				muiTableBodyCellProps: {
					align: 'left',
				},
				muiTableFooterCellProps: {
					align: 'left',
				},
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
						<Tooltip title='Delete CompanyQuotation'>
							<IconButton
								onClick={() =>
									handleDeleteCompanyQuotation(row.original)
								}
							>
								<DeleteOutline />
							</IconButton>
						</Tooltip>
						<Tooltip title='Edit CompanyQuotation'>
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
		[
			handleDeleteCompanyQuotation,
			handleOpenFormDialog,
			activeBookingBranches,
			activeDeliveryBranches,
		]
	);

	const table = useMaterialReactTable({
		columns,
		data: companyQuotations,
		filterFromLeafRows: true,
		paginateExpandedRows: false,
		enableColumnResizing: true,
		enablePagination: true,
		layoutMode: 'grid',
		enableDensityToggle: false,
		initialState: {
			pagination: { pageSize: 100, pageIndex: 0 },
			density: 'compact',
			sorting:[{id: "fromId", desc: false}]
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




	const onEnterFocusNext = (event: React.KeyboardEvent<HTMLSelectElement>, elementId: string) => {
		if (event.key === 'Tab' || event.key === 'Enter') {
			event.preventDefault();
			const nextElement = document.getElementById(elementId);
			if (nextElement) {
				(nextElement as HTMLElement).focus();
			}
		}
	};




	return (
		<>
			<div
				data-component='company-quotation'
				className='container'
			>
				<div
					data-component='company-quotation'
					className='top'
				>
					<Search
						onChange={handleSearch}
						isDisabled={fallbackState !== 'hidden'}
					/>
					{windowWidth > 600 && (
						<Tooltip title='Create New CompanyQuotation'>
							<Fab
								variant='extended'
								color='primary'
								onKeyDownCapture={(event: any) => onEnterFocusNext(event, 'cq-from')}
								data-component='company-quotation'
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
					data-component='company-quotation'
					className='bottom'
				>
					{fallbackState !== 'hidden' ? (
						<Fallback state={fallbackState} />
					) : (
						<div
							data-component='company-quotation'
							className='table-container'
						>
							<MaterialReactTable table={table} />
						</div>
					)}
				</div>
			</div>

			{windowWidth < 600 && (
				<div
					data-component='company-quotation'
					className='fab-container'
				>
					<Tooltip title='Create New CompanyQuotation'>
						<Fab
							variant='extended'
							color='primary'
							data-component='company-quotation'
							className='fab'
							onKeyDownCapture={(event: any) => onEnterFocusNext(event, 'cq-from')}
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
				data-component='company-quotation'
				className='dialog'
			>
				<DialogTitle
					data-component='company-quotation'
					className='dialog-title'
				>
					{!isFormDialogEditMode
						? 'Create New Company Quotation'
						: 'Edit Company Quotation'}
				</DialogTitle>
				<DialogContent
					data-component='company-quotation'
					className='dialog-content'
				>
					<div
						data-component='company-quotation'
						className='container'
					>	
						{user?.displayEstimate && (
								<FormControl
									size='medium'
									disabled={isFormDialogLoading}
									variant='outlined'
									fullWidth
									error={!!formErrors.billTypeId}
								>
									<InputLabel>Bill Type</InputLabel>
									<Select
										label='Bill Type'
										value={formData.billTypeId || ''}
										onChange={(e) => {
											console.log('bill type',e.target.value as number);
											setFormData((prev) => ({
												...prev,
												billTypeId: e.target
													.value as number,
											}));
										}}
									>
										{billTypes.map((type) => (
											<MenuItem
												key={`bill-type-${type.billTypeId}`}
												value={type.billTypeId}
											>
												{type.billType}
											</MenuItem>
										))}
									</Select>
									{formErrors.billTypeId && (
										<FormHelperText error>
											{formErrors.billTypeId}
										</FormHelperText>
									)}
								</FormControl>
							)}

						<FormControl
							variant='outlined'
							fullWidth
							
							error={formErrors.fromId ? true : false}
							disabled={
								isFormDialogEditMode
									? true
									: isFormDialogLoading
							}
						>
							<InputLabel>From</InputLabel>
							<Select
								id='cq-from'
								label='From'
								autoFocus
								onKeyDownCapture={(event: any) => onEnterFocusNext(event, 'company-quotation-to')}

								value={
									
									formData.fromId ? formData.fromId : ''
								}
								onChange={(event: any) => {
									console.log('formdata',formData);
									console.log('fromid', event.target.value as number);
									setFormData((prev) => ({
										...prev,
										fromId: event.target.value,
									}));

								}}

							>
								{activeBookingBranches.map((branch) => {
									return (
										<MenuItem
											key={branch.branchId}
											value={branch.branchId}
										>
											{branch.name}
										</MenuItem>
									);
								})}
							</Select>
							{formErrors.fromId && (
								<FormHelperText error>
									{formErrors.fromId}
								</FormHelperText>
							)}
						</FormControl>
						<FormControl
							variant='outlined'
							fullWidth
							error={formErrors.toId ? true : false}
							disabled={
								isFormDialogEditMode
									? true
									: isFormDialogLoading
							}
						>
							<InputLabel>To</InputLabel>

							<Select
								label='To'
								onKeyDownCapture={(event: any) => onEnterFocusNext(event, 'cq-article-shape')}
								id='company-quotation-to'
								value={formData.toId ? formData.toId : ''}
								onChange={(event: any) => {
									setFormData((prev) => ({
										...prev,
										toId: event.target.value,
									}));
								}}
							>
								{activeDeliveryBranches.map((branch) => {
									return (
										<MenuItem
											key={branch.branchId}
											value={branch.branchId}
										>
											{branch.name}
										</MenuItem>
									);
								})}
							</Select>
							{formErrors.toId && (
								<FormHelperText error>
									{formErrors.toId}
								</FormHelperText>
							)}
						</FormControl>
						<FormControl
							variant='outlined'
							fullWidth
							// error={formErrors.shapeId ? true : false}
							disabled={
								isFormDialogEditMode
									? true
									: isFormDialogLoading
							}
						>
							<InputLabel>Article Shape</InputLabel>
							<Select
								id='cq-article-shape'
								label='Article Shape'
								value={
									formData.shapeId ? formData.shapeId : ''
								}
								onChange={(event: any) => {
									setFormData((prev) => ({
										...prev,
										shapeId: event.target.value,
									}));
								}}
								onKeyDownCapture={(event: any) => onEnterFocusNext(event, 'cq-rate-type')}
							>
								<MenuItem
										key='article-shape-0'
										value ='All'
									>
										All
									</MenuItem>
								{articleShapes.map((type) => {
									return (
										<MenuItem
											key={type.articleShapeId}
											value={type.articleShapeId}
										>
											{type.articleShape}
										</MenuItem>
									);
								})}
							</Select>
							{formErrors.shapeId && (
								<FormHelperText error>
									{formErrors.shapeId}
								</FormHelperText>
							)}
						</FormControl>



						<FormControl
							variant='outlined'
							
							fullWidth
							error={formErrors.rateType ? true : false}
							disabled={isFormDialogLoading}
						>
							<InputLabel>Rate Type</InputLabel>
							<Select
								id='cq-rate-type'
								onKeyDownCapture={(event: any) => onEnterFocusNext(event, 'agent-rate')}
								label='Rate Type'
								type='number'
								value={
									formData.rateType
										? formData.rateType
										: ''
								}
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

						{/* 						
							<FormControl
								variant='outlined'
								style={{ visibility: 'hidden' }}
								fullWidth
								// error={formErrors.goodsTypeId ? true : false}
								disabled={
									isFormDialogEditMode
										? true
										: isFormDialogLoading
								}
							>
								<InputLabel>Goods Type</InputLabel>
								<Select
									label='Goods Type'
									value={
										formData.goodsTypeId
											? formData.goodsTypeId
											: ''
									}
									onChange={(event: any) => {
										setFormData((prev) => ({
											...prev,
											goodsTypeId: event.target.value,
										}));
									}}
								>
									{goodsTypes.map((type) => {
										return (
											<MenuItem
												key={type.goodsTypeId}
												value={type.goodsTypeId}
											>
												{type.goodsType}
											</MenuItem>
										);
									})}
								</Select>
								{formErrors.goodsTypeId && (
									<FormHelperText error>
										{formErrors.goodsTypeId}
									</FormHelperText>
								)}
							</FormControl> */}

						<FormControl
							size='medium'
							disabled={isFormDialogLoading}
							variant='outlined'

							
							error={!!formErrors.rate}
						>
							<InputLabel htmlFor='agent-rate'>
								Rate
							</InputLabel>
							<OutlinedInput
								label='Rate'
								id='agent-rate'
								type='number'
								value={formData.rate ? formData.rate : ''}
								name='rate'
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										rate: +e.target.value as number,
									}))
								}
								onKeyDownCapture={(event: any) => onEnterFocusNext(event, 'cq-save')}
							/>
							{formErrors.rate && (
								<FormHelperText error>
									{formErrors.rate}
								</FormHelperText>
							)}
						</FormControl>

					</div>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseFormDialog}>Close</Button>
					<LoadingButton
						id='cq-save'
						color='primary'
						onClick={
							!isFormDialogEditMode
								? handleCreateCompanyQuotation
								: handleUpdateCompanyQuotation
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

export default CompanyQuotation;

// -------------------------------------------------------------------------------------------
