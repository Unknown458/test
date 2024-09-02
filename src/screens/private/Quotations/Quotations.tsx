import './Quotations.scss';

import dayjs, { Dayjs } from 'dayjs';
import {
	MaterialReactTable,
	MRT_ColumnDef,
	useMaterialReactTable,
} from 'material-react-table';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { AddOutlined, DeleteOutline, EditOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
	Box,
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
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import RouterPath from '../../../app/routerPath';
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
import { ArticleShapeInterface } from '../../../services/articleShape/articleShape.types';
import { BranchInterface } from '../../../services/branch/branch.types';
import { GoodsTypeInterface } from '../../../services/goodsType/goodsType.types';
import {
	createQuotationAsync,
	deleteQuotationAsync,
	getQuotationsByPartyAsync,
	updateQuotationAsync,
} from '../../../services/quotation/quotation';
import {
	QuotationInterface,
	RateTypeInterface,
} from '../../../services/quotation/quotation.types';
import addIndex from '../../../utils/addIndex';
import { getAllActiveBookingBranchesAsync } from '../../../services/branch/branch';

// -------------------------------------------------------------------------------------------

const defaultFormData: QuotationInterface = {
	quotationDate: new Date().toISOString(),
	partyId: 0,
	fromBranchId: 0,
	toBranchId: 0,
	branchId: 0,
	goodsTypeId: 0,
	shapeId: 0,
	rateType: 0,
	branchRate: 0,
	billRate: 0,
	hamaliType: 0,
	agentId: 0,
	branchHamali: 0,
	billHamali: 0,
	branchCollectionCharges: 0,
	billCollectionCharges: 0,
	branchDoorDeliveryCharges: 0,
	billDoorDeliveryCharges: 0,
	deliverydays: 0,
	isActive: true,
};

const defaultFormErrors = {
	quotationDate: '',
	branchId: '',
	fromBranchId: '',
	toBranchId: '',
	goodsTypeId: '',
	shapeId: '',
	rateType: '',
	branchRate: '',
	billRate: '',
	hamaliType: '',
	branchHamali: '',
	billHamali: '',
	deliverydays: '',
};

// -------------------------------------------------------------------------------------------

const Quotations = memo(() => {
	const { setTitle } = useApp();
	const { handleLogout } = useAuth();
	const {
		getGoodsTypes,
		getRateTypes,
		getAllActiveDeliveryBranches,

		getArticleShapes,
	} = useApi();
	const navigate = useNavigate();
	const location = useLocation();
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
	const [isFormDialogEditMode, setIsFormDialogEditMode] = useState(false);
	const [isFormDialogLoading, setIsFormDialogLoading] = useState(false);
	const [fallbackState, setFallbackState] =
		useState<FallbackStateType>('loading');
	const [quotations, _setQuotations] = useState<QuotationInterface[]>([]);
	const [rawQuotations, _setRawQuotations] = useState<QuotationInterface[]>(
		[]
	);
	const [goodsTypes, _setGoodsTypes] = useState<GoodsTypeInterface[]>([]);
	const [fromData, _setFromData] = useState<any[]>([]);
	const [rateTypes, _setRateTypes] = useState<RateTypeInterface[]>([]);
	const [branches, _setBranches] = useState<BranchInterface[]>([]);
	const [articleShapes, _setArticleShapes] = useState<
		ArticleShapeInterface[]
	>([]);
	const [formData, setFormData] =
		useState<QuotationInterface>(defaultFormData);
	const [formErrors, setFormErrors] = useState(defaultFormErrors);
	const [isBillRateEdited, setIsBillRateEdited] = useState(false);
	const [alertDialog, setAlertDialog] = useState<AlertInterface>({
		state: 'success',
		label: '',
		isActive: false,
	});

	const theme = useTheme();
	const isDialogFullScreen = useMediaQuery(theme.breakpoints.down('sm'));

	useEffect(() => {
		setTitle('Quotations');
		initialFetch();
	}, [getGoodsTypes, getRateTypes, getAllActiveDeliveryBranches, getAllActiveBookingBranchesAsync, setTitle]);

	useEffect(() => {
		const updateWindowWidth = () => setWindowWidth(window.innerWidth);
		window.addEventListener('resize', updateWindowWidth);
		return () => window.removeEventListener('resize', updateWindowWidth);
	}, []);


	const initialFetch = async () => {
		if (location.state) {
			const quotationsData = await getQuotationsByParty(location.state.party.partyId);
			const rateTypesData = await getRateTypes();
			const bookingFromResponse = await getAllActiveBookingBranchesAsync();

			// Check if bookingFromResponse is not a boolean and has a data property
			if (bookingFromResponse && typeof bookingFromResponse !== 'boolean' && bookingFromResponse.data) {
				const bookingFromData = bookingFromResponse.data.data;


				const articleShapesData = await getArticleShapes();

				if (branches.length === 0) {
					const allActiveDeliveryBranchesData = await getAllActiveDeliveryBranches();
					_setBranches(allActiveDeliveryBranchesData);
				}

				if (rateTypesData.length !== 0 && articleShapesData.length !== 0) {
					_setQuotations(quotationsData);
					_setRawQuotations(quotationsData);
					_setFromData(bookingFromData);

					_setRateTypes(rateTypesData);
					_setArticleShapes(articleShapesData);
					setFallbackState('hidden');
				} else {
					setFallbackState('not-found');
				}

				if (quotationsData.length !== 0) {
					setFallbackState('hidden');
				} else {
					setFallbackState('not-found');
				}
			} else {
				console.error('Failed to fetch bookingFrom data');
			}
		} else {
			navigate(RouterPath.Dashboard, { replace: true });
		}
	};



	useEffect(() => {
		if (!isBillRateEdited) {
			setFormData((prev) => ({
				...prev,
				billRate: prev.branchRate,
			}));
		}
	}, [formData.branchRate, isBillRateEdited]);

	const handleBillRateChange = (e: any) => {
		setIsBillRateEdited(true);
		handleChange(e);
	};

	const getQuotationsByParty = useCallback(
		async (partyId: number): Promise<QuotationInterface[]> => {
			const response = await getQuotationsByPartyAsync(partyId);

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: any = response.data.data.reverse();

				return addIndex.addIndex2(data);
			} else {
				handleLogout();
				return [];
			}
		},
		[]
	);

	const handleOpenFormDialog = useCallback((data?: QuotationInterface) => {
		setIsFormDialogOpen(true);
		if (data) {
			setFormData(data);
			setIsFormDialogEditMode(true);
		} else {
			setFormData((prev) => ({
				...defaultFormData,
				toBranchId: prev.fromBranchId, // Set toBranchId based on fromBranchId
			}));
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

	console.log('form data is ', formData)

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
		const array = rawQuotations;

		if (!keyword || keyword.trim() === '') {
			_setQuotations(array);
			return;
		}

		const regex = new RegExp(keyword.trim(), 'i');

		const filteredQuotations = array.filter(
			(quotation: QuotationInterface) => {
				const branchName = quotation.branchId
					? branches.find(
						(branch) => branch.branchId === quotation.branchId
					)?.name || ''
					: '';
				const goodsTypeName = quotation.goodsTypeId
					? goodsTypes.find(
						(type) => type.goodsTypeId === quotation.goodsTypeId
					)?.goodsType || ''
					: '';
				const rateTypeName = quotation.rateType
					? rateTypes.find(
						(type) => type.rateTypeId === quotation.rateType
					)?.rateType || ''
					: '';
				const branchRate = quotation.branchRate?.toString() || '';
				const billRate = quotation.billRate?.toString() || '';
				const hamaliType = quotation.rateType
					? rateTypes.find(
						(type) => type.rateTypeId === quotation.hamaliType
					)?.rateType || ''
					: '';
				const branchHamali = quotation.branchHamali?.toString() || '';
				const billHamali = quotation.billHamali?.toString() || '';
				const branchCollectionCharges =
					quotation.branchCollectionCharges?.toString() || '';
				const billCollectionCharges =
					quotation.billCollectionCharges?.toString() || '';
				const branchDoorDeliveryCharges =
					quotation.branchDoorDeliveryCharges?.toString() || '';
				const billDoorDeliveryCharges =
					quotation.billDoorDeliveryCharges?.toString() || '';
				const deliverydays = quotation.deliverydays?.toString() || '';

				return (
					regex.test(branchName) ||
					regex.test(goodsTypeName) ||
					regex.test(rateTypeName) ||
					regex.test(branchRate) ||
					regex.test(billRate) ||
					regex.test(hamaliType) ||
					regex.test(branchHamali) ||
					regex.test(billHamali) ||
					regex.test(branchCollectionCharges) ||
					regex.test(billCollectionCharges) ||
					regex.test(branchDoorDeliveryCharges) ||
					regex.test(billDoorDeliveryCharges) ||
					regex.test(deliverydays)
				);
			}
		);

		_setQuotations(addIndex.addIndex2(filteredQuotations));
	};

	const validateQuotation = useCallback((): boolean => {
		const errors = { ...defaultFormErrors };

		if (!formData?.quotationDate) {
			errors.quotationDate = 'Quotation Date is required.';
		}
		if (!formData?.fromBranchId) {
			errors.fromBranchId = 'From is required.';
		}
		if (!formData?.toBranchId) {
			errors.toBranchId = 'Branch is required.';
		}
		// if (formData.shapeId.toString()==='All') {
		// 	formData.goodsTypeId = 0;
		// }
		// if (!formData?.shapeId) {
		// 	errors.shapeId = 'Article Shape is required.';
		// }
		if (!formData?.rateType) {
			errors.rateType = 'Rate Type is required.';
		}
		if (!formData?.branchRate) {
			errors.branchRate = 'Branch Rate is required.';
		}
		if (!formData?.billRate) {
			errors.billRate = 'Bill Rate is required.';
		}
		// if (!formData?.hamaliType) {
		// 	errors.hamaliType = 'Hamali Type is required.';
		// }
		// if (!formData?.branchHamali) {
		// 	errors.branchHamali = 'Branch Hamali is required.';
		// }
		// if (!formData?.billHamali) {
		// 	errors.billHamali = 'Bill Hamali is required.';
		// }
		// if (!formData?.deliverydays) {
		// 	errors.deliverydays = 'Delivery Days is required.';
		// }
		setFormErrors(errors);

		return Object.values(errors).every((error) => error === '');
	}, [formData]);



	const handleCreateQuotation = async () => {
		if (!validateQuotation()) return;

		const data = {
			quotationDate: formData.quotationDate
				? new Date(formData.quotationDate).toISOString()
				: new Date().toISOString(),
			partyId: location.state.party.partyId ? location.state.party.partyId : 0,
			fromBranchId: formData.fromBranchId ? +formData.fromBranchId : 0,
			toBranchId: formData.toBranchId ? +formData.toBranchId : 0,
			goodsTypeId: formData.goodsTypeId ? +formData.goodsTypeId : null,
			shapeId: formData.shapeId ? +formData.shapeId : null,
			rateType: formData.rateType ? formData.rateType : null,
			branchRate: formData.branchRate ? +formData.branchRate : 0,
			billRate: formData.billRate ? +formData.billRate : 0,
			hamaliType: formData.hamaliType ? formData.hamaliType : 0,
			branchHamali: formData.branchHamali ? +formData.branchHamali : 0,
			billHamali: formData.billHamali ? +formData.billHamali : 0,
			branchCollectionCharges: formData.branchCollectionCharges
				? +formData.branchCollectionCharges
				: 0,
			billCollectionCharges: formData.billCollectionCharges
				? +formData.billCollectionCharges
				: 0,
			branchDoorDeliveryCharges: formData.branchDoorDeliveryCharges
				? +formData.branchDoorDeliveryCharges
				: 0,
			billDoorDeliveryCharges: formData.billDoorDeliveryCharges
				? +formData.billDoorDeliveryCharges
				: 0,
			deliverydays: formData.deliverydays ? +formData.deliverydays : 0,
			isActive: formData.isActive,
		};

		setIsFormDialogLoading(true);
		try {
			const response = await createQuotationAsync(data);
			if (response && typeof response !== 'boolean' && response.data.status !== 401) {
				if (response.data.status === 200) {
					const newQuotation: QuotationInterface = {
						...formData,
						quotationId: response.data.data,
					};
					_setQuotations((prev) => addIndex.addIndex2([newQuotation, ...prev]));
					_setRawQuotations((prev) => addIndex.addIndex2([newQuotation, ...prev]));
					handleCloseFormDialog();
					handleOpenAlertDialog('success', 'Created new Quotation.');
					setFallbackState('hidden');
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
	};


	const handleUpdateQuotation = async () => {
		if (!validateQuotation()) return;
		const updatedData = { ...formData };
		if (formData.shapeId.toString() === 'All') {
			updatedData.shapeId = 0; 
		  }
		const data = updatedData;
		

		setIsFormDialogLoading(true);
		try {
			const response = await updateQuotationAsync(data);
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (response.data.status === 200) {
					const updatedQuotations = quotations.map((obj) =>
						obj.quotationId === formData.quotationId ? data : obj
					);

					_setQuotations(addIndex.addIndex2(updatedQuotations));
					_setRawQuotations(addIndex.addIndex2(updatedQuotations));
					handleCloseFormDialog();
					handleOpenAlertDialog('success', 'Updated Quotation.');
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
	};

	const handleDeleteQuotation = async (data: QuotationInterface) => {
		const confirm = window.confirm(
			`Are you sure you want to delete Quotation?`
		);
		if (!confirm) return;

		const quotationId = data.quotationId as number;

		try {
			const response = await deleteQuotationAsync(quotationId);
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (response.data.status === 200) {
					const updatedQuotations = quotations.filter(
						(obj) => obj.quotationId !== quotationId
					);
					_setQuotations(addIndex.addIndex2(updatedQuotations));
					_setRawQuotations(addIndex.addIndex2(updatedQuotations));
					handleOpenAlertDialog('success', 'Deleted Quotation.');
					if (updatedQuotations.length === 0) {
						setFallbackState('not-found');
					}
				} else {
					handleOpenAlertDialog('warning', response.data.data);
				}
			} else {
				handleLogout();
			}
		} catch (error) {
			handleLogout();
		}
	};
	const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
		const { name, value } = e.target;
		if (name) {
			setFormData((prev) => {
				const newState = { ...prev, [name]: value };
				if (name === 'fromBranchId' && !isFormDialogEditMode) {
					newState.toBranchId = value as number; // Update toBranchId when fromBranchId changes
				}
				return newState;
			});
		}
	};






	const columns = useMemo<MRT_ColumnDef<QuotationInterface>[]>(
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
				accessorKey: 'fromBranchId', // Use fromBranchId instead of agentId
				header: 'From',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				Cell: ({ cell }) => {
					const fromBranchId = cell.getValue<number>();


					const from = fromData.find((from) => from.branchId === fromBranchId);
					return from ? from.name : '';
				},
			},
			{
				accessorKey: 'toBranchId',
				header: 'To',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				Cell: ({ cell }) => {
					const toBranchId = cell.getValue<number>();
					const branch = branches.find(
						(branch) => branch.branchId === toBranchId

					);

					return branch ? branch.name : '';
				},
			},

			{
				accessorKey: 'shapeId',
				header: 'Article Shapes',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				Cell: ({ cell }) => {
					const shapeId = cell.getValue<number>();
					if (typeof shapeId !== 'undefined') {
						const articleShape = articleShapes.find(
							(shape) => shape.articleShapeId === shapeId
						);
						return articleShape ? articleShape.articleShape : 'All';
					}
					return '';
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
						<Tooltip title='Delete Quotation'>
							<IconButton
								onClick={() =>
									handleDeleteQuotation(row.original)
								}
							>
								<DeleteOutline />
							</IconButton>
						</Tooltip>
						<Tooltip title='Edit Quotation'>
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
			handleDeleteQuotation,
			handleOpenFormDialog,
			branches,
			fromData,
			articleShapes,
			quotations,
		]
	);


	const table = useMaterialReactTable({
		columns,
		data: quotations,
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



	const onEnterFocusNext = (event: any, elementId: string) => {
		if (event.key === 'Enter' || event.key === 'Tab' && elementId) {
			event.preventDefault();
			document.getElementById(elementId)?.focus();

		}
	};

	return (
		<>
			<div
				data-component='quotations'
				className='container'
			>
				<div
					data-component='quotations'
					className='party-name title-medium'
				>
					Party Name:{' '}
					{location.state
						? `${location.state?.party?.partyName} (${location.state?.party?.gstNo})`
						: '--'}
				</div>
				<div
					data-component='quotations'
					className='top'
				>
					<Search
						onChange={handleSearch}
						isDisabled={fallbackState !== 'hidden'}
					/>
					{windowWidth > 600 && (
						<Tooltip title='Create New Quotation'>
							<Fab
								variant='extended'
								color='primary'
								data-component='quotations'
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
					data-component='quotations'
					className='bottom'
				>
					{fallbackState !== 'hidden' ? (
						<Fallback state={fallbackState} />
					) : (
						<>

							<div
								data-component='quotations'
								className='table-container'
							>
								<MaterialReactTable table={table} />
							</div>
						</>
					)}
				</div>
			</div>

			{windowWidth < 600 && (
				<div
					data-component='agents'
					className='fab-container'
				>
					<Tooltip title='Create New Quotation'>
						<Fab
							variant='extended'
							color='primary'
							data-component='quotations'
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
				data-component='quotations'
				className='dialog'
			>
				<Box>

					<DialogTitle
						data-component='quotations'
						className='dialog-title'
						style={{ marginTop: '1px' }}
					>

						{!isFormDialogEditMode
							? 'Create New Quotation'
							: 'Edit Quotation'}
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
					<Typography variant='subtitle1' style={{ paddingLeft: '1.8rem' }}>
						Party Name : {`${location.state?.party?.partyName} (${location.state?.party?.gstNo}`}
					</Typography>
				</Box>
				<DialogContent
					data-component='quotations'
					className='dialog-content'
				>
					<div
						data-component='quotations'
						className='container'
						style={{ marginTop: '6px' }}
					>
						<div
							data-component='quotations'
							className='columns-2'
						>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
								error={formErrors.fromBranchId ? true : false}
							>
								<InputLabel>From</InputLabel>
								<Select
									autoFocus
									onKeyDownCapture={(e) => onEnterFocusNext(e, 'qt-to')}
									label='From'
									value={formData?.fromBranchId ? formData?.fromBranchId : ''}
									name='fromBranchId'
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											fromBranchId: e.target.value as number,
										}));
									}}
								>
									{fromData.map((fromBranch) => {
										return (
											<MenuItem
												key={`from-branch-${fromBranch.branchId}`}
												value={fromBranch.branchId as number}
											>
												{fromBranch.name}
											</MenuItem>
										);
									})}
								</Select>
								{formErrors.fromBranchId && (
									<FormHelperText error>
										{formErrors.fromBranchId}
									</FormHelperText>
								)}
							</FormControl>
							<FormControl size="medium" disabled={isFormDialogLoading} variant="outlined" fullWidth error={formErrors.toBranchId ? true : false}>
								<InputLabel>To</InputLabel>
								<Select
									id="qt-to"
									onKeyDownCapture={(e) => onEnterFocusNext(e, 'qt-article-shape')}
									label="Delivery Branch"
									value={formData?.toBranchId ? formData?.toBranchId : ''}
									name="toBranchId"
									onChange={(e: any) => handleChange(e)} // Use handleChange here
								>
									{branches.map((branch) => {
										return (
											<MenuItem key={`branch-${branch.branchId}`} value={branch.branchId as number}>
												{branch.name}
											</MenuItem>
										);
									})}
								</Select>
								{formErrors.branchId && <FormHelperText error>{formErrors.branchId}</FormHelperText>}
							</FormControl>
							{/* <FormControl

								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
								error={formErrors.goodsTypeId ? true : false}
							>
								<InputLabel>Goods Type</InputLabel>
								<Select
									label='Goods Type'
									value={
										formData?.goodsTypeId
											? formData?.goodsTypeId
											: ''
									}
									name='goodsTypeId'
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											goodsTypeId: e.target
												.value as number,
										}));
									}}
								>
									{goodsTypes.map((type) => {
										return (
											<MenuItem
												key={`goods-type-${type.goodsTypeId}`}
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
								fullWidth
								error={formErrors.shapeId ? true : false}
							>
								<InputLabel>Article Shape</InputLabel>

								<Select
									onKeyDownCapture={(e) => onEnterFocusNext(e, 'qt-rate-type')}
									id='qt-article-shape'
									label='Article Shape'
									value={
										formData?.shapeId
											? formData?.shapeId
											: ''
									}
									name='shapeId'
									onChange={(e) => {
										
										
										setFormData((prev) => ({
											...prev,
											shapeId: e.target.value as number,
										}));
									}}
								>

									<MenuItem
										key='article-shape-0'
										value ='All'
									>
										All
									</MenuItem>
									{articleShapes.map((shape) => {
										return (
											<MenuItem
												key={`article-shape-${shape.articleShapeId}`}
												value={shape.articleShapeId}
											>
												{shape.articleShape}
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
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
								onKeyDownCapture={(e) => onEnterFocusNext(e, 'qt-rate-type')}

								error={formErrors.quotationDate ? true : false}
							>
								<LocalizationProvider
									dateAdapter={AdapterDayjs}

								>

									<DatePicker

										label='Date'

										format='DD-MM-YYYY'
										value={
											formData.quotationDate
												? dayjs(formData.quotationDate)
												: null
										}
										disabled={isFormDialogLoading}

										onChange={(date: Dayjs | null) => {
											if (date) {
												setFormData((prev) => ({
													...prev,
													quotationDate:
														date.toISOString(),
												}));
											} else {
												setFormData((prev) => ({
													...prev,
													quotationDate: '',
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
									></DatePicker>

								</LocalizationProvider>
								{formErrors.quotationDate && (
									<FormHelperText error>
										{formErrors.quotationDate}
									</FormHelperText>
								)}
							</FormControl>

						</div>
						<div
							data-component='quotations'
							className='columns-2'
						>
							<div
								data-component='quotations'
								className='container'
							>
								<div
									data-component='quotations'
									className='columns-3'
								>
									<FormControl
										size='medium'
										disabled={isFormDialogLoading}
										variant='outlined'
										fullWidth
										error={
											formErrors.rateType ? true : false
										}
									>
										<InputLabel>Rate Type</InputLabel>
										<Select
											onKeyDownCapture={(e) => onEnterFocusNext(e, 'branch-rate')}
											id='qt-rate-type'
											label='Rate Type'
											value={
												formData?.rateType
													? formData?.rateType
													: ''
											}
											name='rateType'
											onChange={(e) => {
												setFormData((prev) => ({
													...prev,
													rateType: e.target
														.value as number,
												}));
											}}
										>
											{rateTypes.map((type) => {
												return (
													<MenuItem
														key={type.rateTypeId}
														value={type.rateTypeId}
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
								</div>
								<div
									data-component='quotations'
									className='columns-3'
								>
									<FormControl
										size='medium'
										disabled={isFormDialogLoading}
										variant='outlined'
										fullWidth
										error={
											formErrors.branchRate ? true : false
										}
									>
										<InputLabel htmlFor='branch-rate'>
											Branch Rate
										</InputLabel>
										<OutlinedInput
											label='Branch Rate'
											onKeyDownCapture={(e) => onEnterFocusNext(e, 'bill-rate')}
											id='branch-rate'
											type='number'
											value={
												formData?.branchRate
													? formData?.branchRate
													: ''
											}
											name='branchRate'
											onChange={handleChange}
										/>
										{formErrors.branchRate && (
											<FormHelperText error>
												{formErrors.branchRate}
											</FormHelperText>
										)}
									</FormControl>
								</div>
								<div
									data-component='quotations'
									className='columns-3'
								>
									<FormControl
										size='medium'
										disabled={isFormDialogLoading}
										variant='outlined'
										fullWidth
										error={formErrors.billRate ? true : false}
									>
										<InputLabel htmlFor='bill-rate'>Bill Rate</InputLabel>
										<OutlinedInput
											label='Bill Rate'
											id='bill-rate'

											type='number'
											onKeyDownCapture={(e) => onEnterFocusNext(e, 'quotation-save')}
											value={formData.billRate || ''}
											name='billRate'
											onChange={handleBillRateChange}
										/>
										{formErrors.billRate && (
											<FormHelperText error>{formErrors.billRate}</FormHelperText>
										)}
									</FormControl>
								</div>
							</div>
							<div
								data-component='quotations'
								className='container'
							>
								<div
									data-component='quotations'
									className='columns-3'
								>
									<FormControl
										size='medium'
										disabled={isFormDialogLoading}
										variant='outlined'
										fullWidth
										error={
											formErrors.hamaliType ? true : false
										}
									>
										<InputLabel>Hamali Type</InputLabel>
										<Select
											label='Hamali Type'
											value={
												formData?.hamaliType
													? formData?.hamaliType
													: ''
											}
											name='hamaliType'
											onChange={(e) => {
												setFormData((prev) => ({
													...prev,
													hamaliType: e.target
														.value as number,
												}));
											}}
										>
											{rateTypes.map((type) => {
												return (
													<MenuItem
														key={type.rateTypeId}
														value={type.rateTypeId}
													>
														{type.rateType}
													</MenuItem>
												);
											})}
										</Select>
										{/* {formErrors.hamaliType && (
											<FormHelperText error>
												{formErrors.hamaliType}
											</FormHelperText>
										)} */}
									</FormControl>
								</div>
								<div
									data-component='quotations'
									className='columns-3'
								>
									<FormControl
										size='medium'
										disabled={isFormDialogLoading}
										variant='outlined'
										fullWidth
										error={
											formErrors.branchHamali
												? true
												: false
										}
									>
										<InputLabel htmlFor='branch-hamali-rate'>
											Branch Hamali Rate
										</InputLabel>
										<OutlinedInput
											label='Branch Hamali Rate'
											id='branch-hamali-rate'
											type='number'
											value={
												formData?.branchHamali
													? formData?.branchHamali
													: ''
											}
											name='branchHamali'
											onChange={handleChange}
										/>
										{/* {formErrors.branchHamali && (
											<FormHelperText error>
												{formErrors.branchHamali}
											</FormHelperText>
										)} */}
									</FormControl>
								</div>
								<div
									data-component='quotations'
									className='columns-3'
								>
									<FormControl
										size='medium'
										disabled={isFormDialogLoading}
										variant='outlined'
										fullWidth
										error={
											formErrors.billHamali ? true : false
										}
									>
										<InputLabel htmlFor='hamali-bill-rate'>
											Hamali Bill Rate
										</InputLabel>
										<OutlinedInput
											label='Hamali Bill Rate'
											id='hamali-bill-rate'
											type='number'
											value={
												formData?.billHamali
													? formData?.billHamali
													: ''
											}
											name='billHamali'
											onChange={handleChange}
										/>
										{/* {formErrors.billHamali && (
											<FormHelperText error>
												{formErrors.billHamali}
											</FormHelperText>
										)} */}
									</FormControl>
								</div>
							</div>
							<div
								data-component='quotations'
								className='container'
							>
								<div
									data-component='quotations'
									className='columns-2'
								>
									<FormControl
										size='medium'
										disabled={isFormDialogLoading}
										variant='outlined'
										fullWidth
									>
										<InputLabel htmlFor='branch-collection-charges'>
											Branch Collection Charges
										</InputLabel>
										<OutlinedInput
											label='Branch Collection Charges'
											id='branch-collection-charges'
											type='number'
											value={
												formData?.branchCollectionCharges
													? formData?.branchCollectionCharges
													: ''
											}
											name='branchCollectionCharges'
											onChange={handleChange}
										/>
									</FormControl>
								</div>
								<div
									data-component='quotations'
									className='columns-2'
								>
									<FormControl
										size='medium'
										disabled={isFormDialogLoading}
										variant='outlined'
										fullWidth
									>
										<InputLabel htmlFor='bill-collection-charges'>
											Bill Collection Charges
										</InputLabel>
										<OutlinedInput
											label='Bill Collection Charges'
											id='bill-collection-charges'
											type='number'
											value={
												formData?.billCollectionCharges
													? formData?.billCollectionCharges
													: ''
											}
											name='billCollectionCharges'
											onChange={handleChange}
										/>
									</FormControl>
								</div>
							</div>
							<div
								data-component='quotations'
								className='container'
							>
								<div
									data-component='quotations'
									className='columns-2'
								>
									<FormControl
										size='medium'
										disabled={isFormDialogLoading}
										variant='outlined'
										fullWidth
									>
										<InputLabel htmlFor='branch-door-delivery-charges'>
											Branch Door Delivery Charges
										</InputLabel>
										<OutlinedInput
											label='Branch Door Delivery Charges'
											id='branch-door-delivery-charges'
											type='number'
											value={
												formData?.branchDoorDeliveryCharges
													? formData?.branchDoorDeliveryCharges
													: ''
											}
											name='branchDoorDeliveryCharges'
											onChange={handleChange}
										/>
									</FormControl>
								</div>
								<div
									data-component='quotations'
									className='columns-2'
								>
									<FormControl
										size='medium'
										disabled={isFormDialogLoading}
										variant='outlined'
										fullWidth
									>
										<InputLabel htmlFor='bill-door-delivery-charges'>
											Bill Door Delivery Charges
										</InputLabel>
										<OutlinedInput
											label='Bill Door Delivery Charges'
											id='bill-door-delivery-charges'
											type='number'
											value={
												formData?.billDoorDeliveryCharges
													? formData?.billDoorDeliveryCharges
													: ''
											}
											name='billDoorDeliveryCharges'
											onChange={handleChange}
										/>
									</FormControl>
								</div>
							</div>
							<FormControl
								size='medium'
								disabled={isFormDialogLoading}
								variant='outlined'
								fullWidth
								error={formErrors.deliverydays ? true : false}
							>
								<InputLabel htmlFor='delivery-days'>
									Delivery Days
								</InputLabel>
								<OutlinedInput
									label='Delivery Days'
									id='delivery-days'
									type='number'
									value={
										formData?.deliverydays
											? formData?.deliverydays
											: ''
									}
									name='deliverydays'
									onChange={handleChange}
								/>
								{formErrors.deliverydays && (
									<FormHelperText error>
										{formErrors.deliverydays}
									</FormHelperText>
								)}
							</FormControl>
						</div>
					</div>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseFormDialog}>Close</Button>
					<LoadingButton
						id='quotation-save'
						color='primary'
						onClick={
							!isFormDialogEditMode
								? handleCreateQuotation
								: handleUpdateQuotation
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

export default Quotations;

// -------------------------------------------------------------------------------------------
