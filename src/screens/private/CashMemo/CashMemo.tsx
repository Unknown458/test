// -------------------------------------------------------------------------------------------

import './CashMemo.scss';

import { format } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import Decimal from 'decimal.js';
import { memo, useCallback, useEffect, useState } from 'react';

import { Search } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
	Button,
	FormControl,
	FormHelperText,
	IconButton,
	InputLabel,
	MenuItem,
	OutlinedInput,
	Select,
	Tooltip,
	Typography,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import Logo from '../../../assets/logos/logo.png';
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
import {
	getBookingDetailsAsync,
	getBookingForCashMemoAsync,
} from '../../../services/booking/booking';
import { BookingInterface } from '../../../services/booking/booking.types';
import { getBranchByIdAsync } from '../../../services/branch/branch';
import { BranchInterface } from '../../../services/branch/branch.types';
import { BillTypeInterface } from '../../../services/branchLrNumber/branchLrNumber.types';
import {
	createCashMemoAsync,
	deleteCashMemoAsync,
	getCashMemoByCashMemoNoAsync,
	getCashMemoByLRNumberAsync,
	getNextCashMemoNoAsync,
	updateCashMemoAsync,
} from '../../../services/cashMemo/cashMemo';
import { CashMemoInterface } from '../../../services/cashMemo/cashMemo.types';
import { CompanyInterface } from '../../../services/company/company.types';
import {
	getAllConsigneesByCompanyAsync,
	getAllConsignorsByCompanyAsync,
} from '../../../services/party/party';
import {
	PartyInterface,
	PaymentTypeInterface,
} from '../../../services/party/party.types';
import { UserInterface } from '../../../services/user/user.types';
import convertToWords from '../../../utils/convertToWords';
import findObjectInArray from '../../../utils/findObjectInArray';
import printPDF from '../../../utils/printPDF';

// -------------------------------------------------------------------------------------------

const deliveryPaymentType = [
	{ paymentType: 'CASH' },
	{ paymentType: 'UPI' },
	{ paymentType: 'CREDIT' },
];

const receivable = [
	{ receivableType: 'Consignee Copy' },
	{ receivableType: 'Aadhaar Card' },
	{ receivableType: 'Voter ID' },
	{ receivableType: 'Rubber Stamp' },
	{ receivableType: 'Bond Paper' },
	{ receivableType: 'Letter Head' },
];

// -------------------------------------------------------------------------------------------

const defaultFormData: CashMemoInterface = {
	cashMemoNo: 0,
	bookingId: 0,
	lrNumber: 0,
	branchId: 0,
	deliveryBranchId: 0,
	paymentType: '',
	receivable: '',
	documentNo: '',
	deliveredToName: '',
	deliveredToPhone: '',
	remark: '',
	bookingTotal: 0,
	labour: 0,
	ds: 0,
	doorDelivery: 0,
	other: 0,
	gi: 0,
	demurrage: 0,
	discount: 0,
	total: 0,
	companyId: 0,
	userId: 0,
	cashMemoDate: new Date().toISOString(),
	stationary: 0,
	convCharge: 0,
	subTotal: 0,
};

const defaultFormErrors = {
	cashMemoNo: '',
	bookingId: '',
	lrNumber: '',
	branchId: '',
	deliveryBranchId: '',
	paymentType: '',
	receivable: '',
	documentNo: '',
	deliveredToName: '',
	deliveredToPhone: '',
	remark: '',
	bookingTotal: '',
	labour: '',
	ds: '',
	doorDelivery: '',
	other: '',
	gi: '',
	demurrage: '',
	discount: '',
	total: '',
	companyId: '',
	userId: '',
	cashMemoDate: '',
	stationary: '',
	convCharge: '',
};

// -------------------------------------------------------------------------------------------

const CashMemo = memo(() => {
	const { setTitle } = useApp();
	const { handleLogout } = useAuth();
	const {
		getUserDetails,
		getPaymentTypes,
		getDeliveryBranches,
		getCompanyDetailsById,
		getBillTypes,
	} = useApi();

	const [fallbackState, setFallbackState] =
		useState<FallbackStateType>('not-found');

	const [formData, setFormData] =
		useState<CashMemoInterface>(defaultFormData);
	const [booking, setBooking] = useState<BookingInterface[]>([]);

	const [formErrors, setFormErrors] = useState(defaultFormErrors);
	const [alertDialog, setAlertDialog] = useState<AlertInterface>({
		state: 'success',
		label: '',
		isActive: false,
	});
	const [user, _setUser] = useState<UserInterface>();
	const [paymentTypes, setPaymentTypes] = useState<PaymentTypeInterface[]>(
		[]
	);
	const [billTypes, setBillTypes] = useState<BillTypeInterface[]>([]);
	const [deliveryBranches, setDeliveryBranches] = useState<BranchInterface[]>(
		[]
	);
	const [filteredHomeBranches, setFilteredHomeBranches] = useState<
		BranchInterface[]
	>([]);

	const [consignor, setConsignor] = useState<PartyInterface>();
	const [consignee, setConsignee] = useState<PartyInterface>();
	const [isFormLoading, setIsFormLoading] = useState<boolean>(false);
	const [isFormEditMode, setIsFormEditMode] = useState<boolean>(false);
	const [company, _setCompany] = useState<CompanyInterface>();
	const [userBranchDetails, setUserBranchDetails] =
		useState<BranchInterface>();

	useEffect(() => {
		setTitle('Cash Memo');
		initialFetch();
	}, []);

	useEffect(() => {
		if (
			deliveryBranches.length !== 0 &&
			booking.length !== 0 &&
			booking[0]
		) {
			setFormData((prev) => ({
				...prev,
				deliveryBranchId: booking[0].toBranchId,
			}));

			setFilteredHomeBranches(
				deliveryBranches
					.filter(
						(branch) =>
							branch.branchId === booking[0].toBranchId ||
							branch.parentBranchId === booking[0].toBranchId
					)
					.reverse()
			);
		}

		const getPartyDetails = async () => {
			const [consignorsData, consigneesData] = await Promise.all([
				handleGetAllConsignorsByCompanyAsync(),
				handleGetAllConsigneesByCompanyAsync(),
			]);

			if (consignorsData.length !== 0) {
				const filteredConsignor = consignorsData?.filter(
					(party) => party.partyId === booking[0].consignorId
				);

				if (filteredConsignor.length !== 0) {
					setConsignor(filteredConsignor[0]);
				}
			}

			if (consigneesData.length !== 0) {
				const filteredConsignee = consigneesData?.filter(
					(party) => party.partyId === booking[0].consigneeId
				);

				if (filteredConsignee.length !== 0) {
					setConsignee(filteredConsignee[0]);
				}
			}
		};

		if (booking.length !== 0) {
			getPartyDetails();
		}
	}, [booking]);

	useEffect(() => {
		const subTotal = +new Decimal(formData.bookingTotal)
			.plus(formData.labour)
			.plus(formData.ds)
			.plus(formData.doorDelivery)
			.plus(formData.other)
			.plus(formData.gi)
			.plus(formData.demurrage)
			.plus(formData.stationary)
			.plus(formData.convCharge);

		const total = +new Decimal(subTotal).minus(formData.discount);

		setFormData((prev) => ({
			...prev,
			subTotal,
			total,
		}));
	}, [
		formData.bookingTotal,
		formData.labour,
		formData.ds,
		formData.doorDelivery,
		formData.other,
		formData.gi,
		formData.demurrage,
		formData.discount,
		formData.stationary,
		formData.convCharge,
	]);

	const initialFetch = async () => {
		const userData = await getUserDetails();
		const paymentTypeData = await getPaymentTypes();
		const deliveryBranches = await getDeliveryBranches();
		const companyData = await getCompanyDetailsById();
		const billTypesData = await getBillTypes();

		if (
			userData &&
			paymentTypeData.length !== 0 &&
			deliveryBranches.length !== 0 &&
			companyData
		) {
			_setUser(userData);
			handleGetNextCashMemoNoAsync(userData.branchId);
			setPaymentTypes(paymentTypeData);

			setDeliveryBranches(deliveryBranches);
			_setCompany(companyData);
			handleGetBranchById(userData.branchId);
			setBillTypes(billTypesData);

			setFormData((prev) => ({
				...prev,
				branchId: userData.branchId,
				userId: userData.userId,
			}));
		}
	};

	const handleGetNextCashMemoNoAsync = async (branchId: number) => {
		const response = await getNextCashMemoNoAsync(branchId);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: any = response.data.data;
			if (data) {
				setFormData((prev) => ({
					...prev,
					cashMemoNo: +data as number,
				}));
			}
		} else {
			handleLogout();
		}
	};

	const handleGetAllConsignorsByCompanyAsync = async (): Promise<
		PartyInterface[]
	> => {
		const response = await getAllConsignorsByCompanyAsync();

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: any = response.data.data;
			return data;
		} else {
			handleLogout();
			return [];
		}
	};

	const handleGetAllConsigneesByCompanyAsync = async (): Promise<
		PartyInterface[]
	> => {
		const response = await getAllConsigneesByCompanyAsync();

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: any = response.data.data;
			return data;
		} else {
			handleLogout();
			return [];
		}
	};

	const handleGetCashMemoByLRNumberAsync = async (
		lrNumber: number,
		branchId: number
	): Promise<CashMemoInterface | null> => {
		const response = await getCashMemoByLRNumberAsync(lrNumber, branchId);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: any = response.data.data;
			if (data) {
				await handleGetBookingDetailsAsync(lrNumber);
				return data;
			} else {
				handleOpenAlertDialog('warning', response.data.data);
				return null;
			}
		} else {
			handleLogout();
			return null;
		}
	};

	const handleGetCashMemoByCashMemoNoAsync = async (
		cashMemoNo: number,
		branchId: number
	) => {
		setFallbackState('loading');

		const response = await getCashMemoByCashMemoNoAsync(
			cashMemoNo,
			branchId
		);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			let data: any = response.data.data;
			if (data) {
				setFormData(data);
				await handleGetBookingDetailsAsync(data.lrNumber);
				setFallbackState('hidden');
				setIsFormEditMode(true);
			} else {
				setFallbackState('not-found');
				handleOpenAlertDialog('warning', 'No Cash Memo found.');
				setIsFormEditMode(false);
			}
		} else {
			handleLogout();
		}
	};

	const handleGetBookingDetailsAsync = async (lrNumber: number) => {
		setFallbackState('loading');

		const data = {
			fromBranchId: user?.branchId,
			lrNumber: +lrNumber,
		};

		const response = await getBookingDetailsAsync(data);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			let data: any = response.data.data;

			if (data.length !== 0) {
				setBooking(data);
				setFallbackState('hidden');
			}
		} else {
			handleLogout();
		}
	};

	const handleGetBookingForCashMemoAsync = async (
		lrNumber: number,
		branchId: number
	) => {
		setFallbackState('loading');

		const response = await getBookingForCashMemoAsync(lrNumber, branchId);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			let data: any = response.data.data;

			if (data.length !== 0) {
				setBooking(data);
				setFallbackState('hidden');

				setFormData((prev) => ({
					...prev,
					bookingId: data[0].bookingId,
				}));

				if (data[0].paymentType == 1) {
					setFormData((prev) => ({
						...prev,
						bookingTotal: data[0].grandTotal,
					}));
				}
			} else {
				const data = await handleGetCashMemoByLRNumberAsync(
					lrNumber,
					branchId
				);

				if (data !== null) {
					setFormData(data);
					setFallbackState('hidden');
					setIsFormEditMode(true);
				} else {
					setFallbackState('not-found');
					handleOpenAlertDialog('warning', 'No Cash Memo found.');
					setIsFormEditMode(false);
				}
			}
		} else {
			handleLogout();
		}
	};

	const validateCashMemo = () => {
		if (!formData.cashMemoNo) {
			setFormErrors((prev) => ({
				...prev,
				cashMemoNo: 'Cash Memo No. is required',
			}));

			return false;
		} else {
			setFormErrors((prev) => ({
				...prev,
				cashMemoNo: '',
			}));

			return true;
		}
	};

	const validateLRNumber = () => {
		if (!formData.lrNumber) {
			setFormErrors((prev) => ({
				...prev,
				lrNumber: 'LR Number No. is required',
			}));

			return false;
		} else {
			setFormErrors((prev) => ({
				...prev,
				lrNumber: '',
			}));

			return true;
		}
	};

	const validateDeliveryTo = () => {
		if (!formData.deliveryBranchId) {
			setFormErrors((prev) => ({
				...prev,
				deliveryBranchId: 'Delivery To is required',
			}));

			return false;
		} else {
			setFormErrors((prev) => ({
				...prev,
				deliveryBranchId: '',
			}));

			return true;
		}
	};

	const validateCashMemoDate = () => {
		if (!formData.cashMemoDate) {
			setFormErrors((prev) => ({
				...prev,
				cashMemoDate: 'Cash Memo Date is required',
			}));

			return false;
		} else {
			setFormErrors((prev) => ({
				...prev,
				cashMemoDate: '',
			}));

			return true;
		}
	};

	const validatePaymentType = () => {
		if (!formData.paymentType) {
			setFormErrors((prev) => ({
				...prev,
				paymentType: 'Payment Type is required',
			}));

			return false;
		} else {
			setFormErrors((prev) => ({
				...prev,
				paymentType: '',
			}));

			return true;
		}
	};

	const validateReceivable = () => {
		if (!formData.receivable) {
			setFormErrors((prev) => ({
				...prev,
				receivable: 'Receivable is required',
			}));

			return false;
		} else {
			setFormErrors((prev) => ({
				...prev,
				receivable: '',
			}));

			return true;
		}
	};

	const validateDocumentNo = () => {
		if (
			formData.receivable === 'Aadhaar Card' ||
			formData.receivable === 'Voter ID' ||
			formData.receivable === 'Bond Paper'
		) {
			if (!formData.documentNo) {
				setFormErrors((prev) => ({
					...prev,
					documentNo: 'Document Number is required',
				}));

				return false;
			} else {
				setFormErrors((prev) => ({
					...prev,
					documentNo: '',
				}));

				return true;
			}
		} else {
			return true;
		}
	};

	const validateDeliveredToName = () => {
		if (!formData.deliveredToName) {
			setFormErrors((prev) => ({
				...prev,
				deliveredToName: 'Delivered To Name is required',
			}));

			return false;
		} else {
			setFormErrors((prev) => ({
				...prev,
				deliveredToName: '',
			}));

			return true;
		}
	};

	const validateDeliveredToPhone = () => {
		if (!formData.deliveredToPhone) {
			setFormErrors((prev) => ({
				...prev,
				deliveredToPhone: 'Delivered To Phone is required',
			}));

			return false;
		} else {
			setFormErrors((prev) => ({
				...prev,
				deliveredToPhone: '',
			}));

			return true;
		}
	};

	const handleGetBranchById = async (branchId: number) => {
		const response = await getBranchByIdAsync(branchId);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: any = response.data.data;
			setUserBranchDetails(data);
		} else {
			handleLogout();
		}
	};

	const handleFormValidation = () => {
		const isCashMemo = validateCashMemo();
		const isLRNumber = validateLRNumber();
		const isDeliveryTo = validateDeliveryTo();
		const isCashMemoDate = validateCashMemoDate();
		const isPaymentType = validatePaymentType();
		const isReceivable = validateReceivable();
		const isDocumentNo = validateDocumentNo();
		const isDeliveredToName = validateDeliveredToName();
		const isDeliveredToPhone = validateDeliveredToPhone();

		if (
			isCashMemo &&
			isLRNumber &&
			isDeliveryTo &&
			isCashMemoDate &&
			isPaymentType &&
			isReceivable &&
			isDocumentNo &&
			isDeliveredToName &&
			isDeliveredToPhone
		) {
			return true;
		} else {
			return false;
		}
	};

	const handleCreateCashMemoAsync = async (): Promise<boolean> => {
		if (!handleFormValidation()) return false;

		setIsFormLoading(true);

		const data = {
			...formData,
		};

		const response = await createCashMemoAsync(data);

		setIsFormLoading(false);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				handleOpenAlertDialog('success', 'Created new Cash Memo');
				handleReset();
				return true;
			} else {
				handleOpenAlertDialog('warning', response.data.data);
				return false;
			}
		} else {
			handleLogout();
			return false;
		}
	};

	const handleUpdateCashMemoAsync = async (): Promise<boolean> => {
		if (!handleFormValidation()) return false;

		setIsFormLoading(true);

		const data = {
			...formData,
		};

		const response = await updateCashMemoAsync(data);

		setIsFormLoading(false);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				handleOpenAlertDialog('success', 'Updated Cash Memo');
				return true;
			} else {
				handleOpenAlertDialog('warning', response.data.data);
				return false;
			}
		} else {
			handleLogout();
			return false;
		}
	};

	const handleDeleteCashMemoAsync = async () => {
		const confirm = window.confirm(
			`Are you sure you want to delete this Cash Memo?`
		);
		if (!confirm) return;

		setIsFormLoading(true);

		if (!formData.cashMemoId || !user?.branchId)
			return handleOpenAlertDialog('warning', 'Something went wrong.');

		const response = await deleteCashMemoAsync(
			formData.cashMemoId,
			user?.branchId
		);

		setIsFormLoading(false);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				handleOpenAlertDialog('success', 'Deleted Cash Memo');
				handleReset();
			} else {
				handleOpenAlertDialog('warning', response.data.data);
			}
		} else {
			handleLogout();
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

	const handleReset = async () => {
		setFallbackState('not-found');
		setFormData(defaultFormData);
		setBooking([]);
		setFormErrors(defaultFormErrors);
		setFilteredHomeBranches([]);
		setConsignor(undefined);
		setConsignee(undefined);
		setIsFormLoading(false);
		setIsFormEditMode(false);

		if (user) {
			await handleGetNextCashMemoNoAsync(user?.branchId);
		}
	};

	return (
		<>
			<div
				data-component='cash-memo'
				className='container'
			>
				<div
					data-component='cash-memo'
					className='bottom'
				>
					<div
						data-component='cash-memo'
						className='data-container'
					>
						<div
							data-component='cash-memo'
							className='container'
						>
							<div
								data-component='cash-memo'
								className='columns-1'
							>
								<div
									data-component='cash-memo'
									className='container'
								>
									<div
										data-component='cash-memo'
										className='columns-4'
									>
										<div
											data-component='cash-memo'
											className='lr-no-container'
										>
											<FormControl
												size='small'
												variant='outlined'
												fullWidth
												error={!!formErrors.cashMemoNo}
											>
												<InputLabel htmlFor='cash-memo'>
													Cash Memo No.
												</InputLabel>
												<OutlinedInput
													id='cash-memo'
													label='Cash Memo No.'
													type='number'
													value={
														formData.cashMemoNo
															? formData.cashMemoNo
															: ''
													}
													onChange={(e) => {
														setFormData((prev) => ({
															...prev,
															cashMemoNo: +e
																.target
																.value as number,
														}));
													}}
												/>
												{formErrors.cashMemoNo && (
													<FormHelperText>
														{formErrors.cashMemoNo}
													</FormHelperText>
												)}
											</FormControl>
											<Tooltip title='Search Cash Memo'>
												<IconButton
													color='primary'
													onClick={() => {
														if (
															!formData.cashMemoNo ||
															!user
														)
															return;
														handleGetCashMemoByCashMemoNoAsync(
															formData.cashMemoNo,
															user?.branchId
														);
													}}
												>
													<Search />
												</IconButton>
											</Tooltip>
										</div>
									</div>
									<div
										data-component='cash-memo'
										className='columns-4'
									>
										<div
											data-component='cash-memo'
											className='lr-no-container'
										>
											<FormControl
												size='small'
												variant='outlined'
												fullWidth
												error={!!formErrors.lrNumber}
											>
												<InputLabel htmlFor='lr-number'>
													LR No.
												</InputLabel>
												<OutlinedInput
													id='lr-number'
													label='LR No.'
													type='number'
													value={
														formData.lrNumber
															? formData.lrNumber
															: ''
													}
													onChange={(e) => {
														setFormData((prev) => ({
															...prev,
															lrNumber: +e.target
																.value as number,
														}));
													}}
												/>
												{formErrors.lrNumber && (
													<FormHelperText>
														{formErrors.lrNumber}
													</FormHelperText>
												)}
											</FormControl>
											<Tooltip title='Search Cash Memo By LR No.'>
												<IconButton
													color='primary'
													onClick={() => {
														if (
															!formData.lrNumber ||
															!user
														)
															return;
														handleGetBookingForCashMemoAsync(
															formData.lrNumber,
															user?.branchId
														);
													}}
												>
													<Search />
												</IconButton>
											</Tooltip>
										</div>
									</div>
									<div
										data-component='cash-memo'
										className='columns-4'
									>
										<FormControl
											size='small'
											variant='outlined'
											fullWidth
											focused={false}
										>
											<InputLabel htmlFor='from'>
												From
											</InputLabel>
											<OutlinedInput
												id='from'
												label='From'
												type='text'
												value={
													booking[0]
														? booking[0].fromBranch
														: ''
												}
												contentEditable={false}
											/>
										</FormControl>
									</div>
									<div
										data-component='cash-memo'
										className='columns-4'
									>
										<FormControl
											size='small'
											variant='outlined'
											fullWidth
											focused={false}
										>
											<InputLabel htmlFor='to'>
												To
											</InputLabel>
											<OutlinedInput
												id='to'
												label='To'
												type='text'
												value={
													booking[0]
														? booking[0].toBranch
														: ''
												}
												contentEditable={false}
											/>
										</FormControl>
									</div>
								</div>

								{fallbackState !== 'hidden' ? (
									<Fallback state={fallbackState} />
								) : (
									<>
										<div
											data-component='cash-memo'
											className='container'
										>
											<div
												data-component='cash-memo'
												className='columns-4'
											>
												<FormControl
													size='small'
													variant='outlined'
													fullWidth
													error={
														!!formErrors.deliveryBranchId
													}
												>
													<InputLabel>
														Delivery To
													</InputLabel>
													<Select
														label='Delivery To'
														value={
															formData.deliveryBranchId ||
															''
														}
														onChange={(e) => {
															setFormData(
																(prev) => ({
																	...prev,
																	deliveryBranchId:
																		e.target
																			.value as number,
																})
															);
														}}
													>
														{filteredHomeBranches.map(
															(type) => (
																<MenuItem
																	key={`deliveryBranchId-${type.branchId}`}
																	value={
																		type.branchId
																	}
																>
																	{type.name}
																</MenuItem>
															)
														)}
													</Select>
													{formErrors.deliveryBranchId && (
														<FormHelperText error>
															{
																formErrors.deliveryBranchId
															}
														</FormHelperText>
													)}
												</FormControl>
											</div>
											<div
												data-component='cash-memo'
												className='columns-4'
											>
												<LocalizationProvider
													dateAdapter={AdapterDayjs}
												>
													<DatePicker
														label='Date'
														format='DD-MM-YYYY'
														value={
															formData.cashMemoDate
																? dayjs(
																		formData.cashMemoDate
																  )
																: null
														}
														onChange={(
															date: Dayjs | null
														) => {
															if (date) {
																setFormData(
																	(prev) => ({
																		...prev,
																		cashMemoDate:
																			date.toISOString(),
																	})
																);
															} else {
																setFormData(
																	(prev) => ({
																		...prev,
																		cashMemoDate:
																			'',
																	})
																);
															}
														}}
														slotProps={{
															field: {
																shouldRespectLeadingZeros:
																	true,
															},
															textField: {
																size: 'small',
															},
														}}
													/>
												</LocalizationProvider>
											</div>
											<div
												data-component='cash-memo'
												className='columns-3'
											>
												<FormControl
													size='small'
													variant='outlined'
													fullWidth
													focused={false}
												>
													<InputLabel htmlFor='form-type'>
														Form Type
													</InputLabel>
													<OutlinedInput
														id='form-type'
														label='Form Type'
														type='text'
														value={
															booking[0]
																? booking[0]
																		.eWayBillNumber
																		.length ===
																  0
																	? findObjectInArray(
																			billTypes,
																			'billTypeId',
																			booking[0]
																				.billTypeId
																	  ).billType
																	: 'E-Way Bill'
																: ''
														}
														contentEditable={false}
													/>
												</FormControl>
											</div>
											<div
												data-component='cash-memo'
												className='columns-4'
											>
												<FormControl
													size='small'
													variant='outlined'
													fullWidth
													focused={false}
												>
													<InputLabel htmlFor='lr-type'>
														LR Type
													</InputLabel>
													<OutlinedInput
														id='lr-type'
														label='LR Type'
														type='text'
														value={
															booking
																? booking[0]
																	? findObjectInArray(
																			paymentTypes,
																			'paymentTypeId',
																			booking[0]
																				.paymentType
																	  )
																			.paymentType
																	: ''
																: ''
														}
														contentEditable={false}
													/>
												</FormControl>
											</div>
										</div>
										<div
											data-component='cash-memo'
											className='container'
										>
											<div
												data-component='cash-memo'
												className='columns-2'
											>
												<Typography variant='h6'>
													Consignor
												</Typography>
												<div
													data-component='cash-memo'
													className='container'
												>
													<div
														data-component='cash-memo'
														className='columns-1'
													>
														<FormControl
															size='small'
															variant='outlined'
															fullWidth
															focused={false}
														>
															<InputLabel>
																Consignor
															</InputLabel>
															<OutlinedInput
																label='Consignor'
																type='text'
																value={
																	booking[0]
																		? booking[0]
																				.consignor
																		: ''
																}
																contentEditable={
																	false
																}
															/>
														</FormControl>
													</div>
												</div>
												<div
													data-component='cash-memo'
													className='container'
												>
													<div
														data-component='cash-memo'
														className='columns-2'
													>
														<FormControl
															size='small'
															variant='outlined'
															fullWidth
															focused={false}
														>
															<InputLabel>
																Consignor Phone
															</InputLabel>
															<OutlinedInput
																label='Consignor Phone'
																type='text'
																value={
																	booking[0]
																		? booking[0]
																				.consignorPhone
																		: ''
																}
																contentEditable={
																	false
																}
															/>
														</FormControl>
													</div>
													<div
														data-component='cash-memo'
														className='columns-2'
													>
														<FormControl
															size='small'
															variant='outlined'
															fullWidth
															focused={false}
														>
															<InputLabel>
																Consignor GST
																No.
															</InputLabel>
															<OutlinedInput
																label='Consignor GST No.'
																type='text'
																value={
																	booking[0]
																		? booking[0]
																				.consignorGST
																		: ''
																}
																contentEditable={
																	false
																}
															/>
														</FormControl>
													</div>
												</div>
												<div
													data-component='cash-memo'
													className='container'
												>
													<div
														data-component='cash-memo'
														className='columns-1'
													>
														<FormControl
															size='small'
															variant='outlined'
															fullWidth
															focused={false}
														>
															<InputLabel>
																Consignor
																Address
															</InputLabel>
															<OutlinedInput
																multiline
																label='Consignor Address'
																type='text'
																value={
																	consignor
																		? consignor.address
																		: ''
																}
																contentEditable={
																	false
																}
															/>
														</FormControl>
													</div>
												</div>
											</div>
											<div
												data-component='cash-memo'
												className='columns-2'
											>
												<Typography variant='h6'>
													Consignee
												</Typography>
												<div
													data-component='cash-memo'
													className='container'
												>
													<div
														data-component='cash-memo'
														className='columns-1'
													>
														<FormControl
															size='small'
															variant='outlined'
															fullWidth
															focused={false}
														>
															<InputLabel>
																Consignee
															</InputLabel>
															<OutlinedInput
																label='Consignee'
																type='text'
																value={
																	booking[0]
																		? booking[0]
																				.consignee
																		: ''
																}
																contentEditable={
																	false
																}
															/>
														</FormControl>
													</div>
												</div>
												<div
													data-component='cash-memo'
													className='container'
												>
													<div
														data-component='cash-memo'
														className='columns-2'
													>
														<FormControl
															size='small'
															variant='outlined'
															fullWidth
															focused={false}
														>
															<InputLabel>
																Consignee Phone
															</InputLabel>
															<OutlinedInput
																label='Consignee Phone'
																type='text'
																value={
																	booking[0]
																		? booking[0]
																				.consigneePhone
																		: ''
																}
																contentEditable={
																	false
																}
															/>
														</FormControl>
													</div>
													<div
														data-component='cash-memo'
														className='columns-2'
													>
														<FormControl
															size='small'
															variant='outlined'
															fullWidth
															focused={false}
														>
															<InputLabel>
																Consignee GST
																No.
															</InputLabel>
															<OutlinedInput
																label='Consignee GST No.'
																type='text'
																value={
																	booking[0]
																		? booking[0]
																				.consigneeGST
																		: ''
																}
																contentEditable={
																	false
																}
															/>
														</FormControl>
													</div>
												</div>
												<div
													data-component='cash-memo'
													className='container'
												>
													<div
														data-component='cash-memo'
														className='columns-1'
													>
														<FormControl
															size='small'
															variant='outlined'
															fullWidth
															focused={false}
														>
															<InputLabel>
																Consignee
																Address
															</InputLabel>
															<OutlinedInput
																multiline
																label='Consignee Address'
																type='text'
																value={
																	consignee
																		? consignee.address
																		: ''
																}
																contentEditable={
																	false
																}
															/>
														</FormControl>
													</div>
												</div>
											</div>
										</div>
										<Typography variant='h6'>
											Consignment Detail
										</Typography>
										<div
											data-component='cash-memo'
											className='container'
										>
											<div
												data-component='cash-memo'
												className='columns-4'
											>
												<FormControl
													size='small'
													variant='outlined'
													fullWidth
													focused={false}
												>
													<InputLabel>
														Actual Weight
													</InputLabel>
													<OutlinedInput
														label='Actual Weight'
														type='number'
														value={
															booking
																? booking[0]
																	? booking[0].bookingDetails.reduce(
																			(
																				sum: any,
																				detail: any
																			) =>
																				sum +
																				detail.weight,
																			0
																	  )
																	: ''
																: ''
														}
														contentEditable={false}
													/>
												</FormControl>
											</div>
											<div
												data-component='cash-memo'
												className='columns-4'
											>
												<FormControl
													size='small'
													variant='outlined'
													fullWidth
													focused={false}
												>
													<InputLabel>
														Charge Weight
													</InputLabel>
													<OutlinedInput
														label='Charge Weight'
														type='number'
														value={
															booking
																? booking[0]
																	? booking[0].bookingDetails.reduce(
																			(
																				sum: any,
																				detail: any
																			) =>
																				sum +
																				detail.chargeWeight,
																			0
																	  )
																	: ''
																: ''
														}
														contentEditable={false}
													/>
												</FormControl>
											</div>
											<div
												data-component='cash-memo'
												className='columns-4'
											>
												<FormControl
													size='small'
													variant='outlined'
													fullWidth
													focused={false}
												>
													<InputLabel>
														Invoice Number
													</InputLabel>
													<OutlinedInput
														label='Invoice Number'
														type='text'
														value={
															booking
																? booking[0]
																	? booking[0]
																			.invoiceNumber
																			.length !==
																	  0
																		? booking[0]
																				.invoiceNumber
																		: '--'
																	: ''
																: ''
														}
														contentEditable={false}
													/>
												</FormControl>
											</div>
											<div
												data-component='cash-memo'
												className='columns-4'
											>
												<FormControl
													size='small'
													variant='outlined'
													fullWidth
													focused={false}
												>
													<InputLabel>
														Declared Value
													</InputLabel>
													<OutlinedInput
														label='Declared Value'
														type='text'
														value={
															booking
																? booking[0]
																	? booking[0]
																			.declaredValue
																			.length !==
																	  0
																		? booking[0]
																				.declaredValue
																		: '--'
																	: ''
																: ''
														}
														contentEditable={false}
													/>
												</FormControl>
											</div>
										</div>
										<div
											data-component='cash-memo'
											className='container'
										>
											<div
												data-component='cash-memo'
												className='columns-1'
											>
												<FormControl
													size='small'
													variant='outlined'
													fullWidth
													focused={false}
												>
													<InputLabel>
														Remark
													</InputLabel>
													<OutlinedInput
														multiline
														label='Remark'
														type='text'
														value={
															booking
																? booking[0]
																	? booking[0]
																			.note
																			.length !==
																	  0
																		? booking[0]
																				.note
																		: '--'
																	: ''
																: ''
														}
														contentEditable={false}
													/>
												</FormControl>
											</div>
										</div>
										<Typography variant='h6'>
											Article Detail
										</Typography>
										{booking &&
											booking[0] &&
											booking[0].bookingDetails.map(
												(detail, index) => {
													return (
														<div
															data-component='cash-memo'
															className='container'
															key={`detail-${index}`}
														>
															<div
																data-component='cash-memo'
																className='columns-3'
															>
																<FormControl
																	size='small'
																	variant='outlined'
																	fullWidth
																	focused={
																		false
																	}
																>
																	<InputLabel>
																		No. of
																		Article
																	</InputLabel>
																	<OutlinedInput
																		label='No. of Article'
																		type='text'
																		value={
																			detail
																				? detail.article
																				: ''
																		}
																		contentEditable={
																			false
																		}
																	/>
																</FormControl>
															</div>
															<div
																data-component='cash-memo'
																className='columns-3'
															>
																<FormControl
																	size='small'
																	variant='outlined'
																	fullWidth
																	focused={
																		false
																	}
																>
																	<InputLabel>
																		Article
																		Type
																	</InputLabel>
																	<OutlinedInput
																		label='Article Type'
																		type='text'
																		value={
																			detail
																				? detail.shape
																				: ''
																		}
																		contentEditable={
																			false
																		}
																	/>
																</FormControl>
															</div>
															<div
																data-component='cash-memo'
																className='columns-3'
															>
																<FormControl
																	size='small'
																	variant='outlined'
																	fullWidth
																	focused={
																		false
																	}
																>
																	<InputLabel>
																		Said To
																		Contain
																	</InputLabel>
																	<OutlinedInput
																		label='Said To Contain'
																		type='text'
																		value={
																			detail
																				? detail.goodsType
																				: ''
																		}
																		contentEditable={
																			false
																		}
																	/>
																</FormControl>
															</div>
														</div>
													);
												}
											)}
										<Typography variant='h6'>
											Delivery Detail
										</Typography>
										<div
											data-component='cash-memo'
											className='container'
										>
											<div
												data-component='cash-memo'
												className={
													formData.receivable ===
														'Aadhaar Card' ||
													formData.receivable ===
														'Voter ID' ||
													formData.receivable ===
														'Bond Paper'
														? 'columns-3'
														: 'columns-2'
												}
											>
												<FormControl
													size='small'
													variant='outlined'
													fullWidth
													error={
														!!formErrors.paymentType
													}
												>
													<InputLabel>
														Payment Type
													</InputLabel>
													<Select
														label='Payment Type'
														value={
															formData.paymentType ||
															''
														}
														onChange={(e) => {
															setFormData(
																(prev) => ({
																	...prev,
																	paymentType:
																		e.target
																			.value,
																})
															);
														}}
													>
														{deliveryPaymentType.map(
															(type) => (
																<MenuItem
																	key={`payment-type-${type.paymentType}`}
																	value={
																		type.paymentType
																	}
																>
																	{
																		type.paymentType
																	}
																</MenuItem>
															)
														)}
													</Select>
													{formErrors.paymentType && (
														<FormHelperText error>
															{
																formErrors.paymentType
															}
														</FormHelperText>
													)}
												</FormControl>
											</div>
											<div
												data-component='cash-memo'
												className={
													formData.receivable ===
														'Aadhaar Card' ||
													formData.receivable ===
														'Voter ID' ||
													formData.receivable ===
														'Bond Paper'
														? 'columns-3'
														: 'columns-2'
												}
											>
												<FormControl
													size='small'
													variant='outlined'
													fullWidth
													error={
														!!formErrors.receivable
													}
												>
													<InputLabel>
														Receivable
													</InputLabel>
													<Select
														label='Receivable'
														value={
															formData.receivable ||
															''
														}
														onChange={(e) => {
															setFormData(
																(prev) => ({
																	...prev,
																	receivable:
																		e.target
																			.value,
																})
															);
														}}
													>
														{receivable.map(
															(type) => (
																<MenuItem
																	key={`receivable-${type.receivableType}`}
																	value={
																		type.receivableType
																	}
																>
																	{
																		type.receivableType
																	}
																</MenuItem>
															)
														)}
													</Select>
													{formErrors.receivable && (
														<FormHelperText error>
															{
																formErrors.receivable
															}
														</FormHelperText>
													)}
												</FormControl>
											</div>
											{(formData.receivable ===
												'Aadhaar Card' ||
												formData.receivable ===
													'Voter ID' ||
												formData.receivable ===
													'Bond Paper') && (
												<div
													data-component='cash-memo'
													className='columns-3'
												>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
														error={
															!!formErrors.documentNo
														}
													>
														<InputLabel>
															Document Number
														</InputLabel>
														<OutlinedInput
															label='Document Number'
															type='text'
															value={
																formData.documentNo
																	? formData.documentNo
																	: ''
															}
															onChange={(e) => {
																setFormData(
																	(prev) => ({
																		...prev,
																		documentNo:
																			e
																				.target
																				.value,
																	})
																);
															}}
														/>
														{formErrors.documentNo && (
															<FormHelperText
																error
															>
																{
																	formErrors.documentNo
																}
															</FormHelperText>
														)}
													</FormControl>
												</div>
											)}
										</div>
										<div
											data-component='cash-memo'
											className='container'
										>
											<div
												data-component='cash-memo'
												className='columns-2'
											>
												<FormControl
													size='small'
													variant='outlined'
													fullWidth
													error={
														!!formErrors.deliveredToName
													}
												>
													<InputLabel>
														Delivered to Name
													</InputLabel>
													<OutlinedInput
														label='Delivered to Name'
														type='text'
														value={
															formData.deliveredToName
																? formData.deliveredToName
																: ''
														}
														onChange={(e) => {
															setFormData(
																(prev) => ({
																	...prev,
																	deliveredToName:
																		e.target
																			.value,
																})
															);
														}}
													/>
													{formErrors.deliveredToName && (
														<FormHelperText error>
															{
																formErrors.deliveredToName
															}
														</FormHelperText>
													)}
												</FormControl>
											</div>
											<div
												data-component='cash-memo'
												className='columns-2'
											>
												<FormControl
													size='small'
													variant='outlined'
													fullWidth
													error={
														!!formErrors.deliveredToPhone
													}
												>
													<InputLabel>
														Delivered to Contact No.
													</InputLabel>
													<OutlinedInput
														label='Delivered to Contact No.'
														type='text'
														value={
															formData.deliveredToPhone
																? formData.deliveredToPhone
																: ''
														}
														onChange={(e) => {
															setFormData(
																(prev) => ({
																	...prev,
																	deliveredToPhone:
																		e.target
																			.value,
																})
															);
														}}
													/>
													{formErrors.deliveredToPhone && (
														<FormHelperText error>
															{
																formErrors.deliveredToPhone
															}
														</FormHelperText>
													)}
												</FormControl>
											</div>
										</div>
										<div
											data-component='cash-memo'
											className='container'
										>
											<div
												data-component='cash-memo'
												className='columns-1'
											>
												<FormControl
													size='small'
													variant='outlined'
													fullWidth
												>
													<InputLabel>
														Remark
													</InputLabel>
													<OutlinedInput
														multiline
														label='Remark'
														type='text'
														value={
															formData.remark
																? formData.remark
																: ''
														}
														onChange={(e) => {
															setFormData(
																(prev) => ({
																	...prev,
																	remark: e
																		.target
																		.value,
																})
															);
														}}
													/>
												</FormControl>
											</div>
										</div>
									</>
								)}
							</div>
						</div>
						<div
							data-component='cash-memo'
							className='display-container'
						>
							<FormControl
								size='small'
								variant='outlined'
								fullWidth
								disabled={true}
							>
								<InputLabel htmlFor='booking-total'>
									Booking Total
								</InputLabel>
								<OutlinedInput
									id='booking-total'
									label='Booking Total'
									type='number'
									value={
										formData.bookingTotal
											? formData.bookingTotal
											: ''
									}
								/>
							</FormControl>
							<FormControl
								size='small'
								variant='outlined'
								fullWidth
								error={!!formErrors.labour}
							>
								<InputLabel htmlFor='labour'>Labour</InputLabel>
								<OutlinedInput
									id='labour'
									label='Labour'
									type='number'
									value={
										formData.labour ? formData.labour : ''
									}
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											labour: +e.target.value as number,
										}));
									}}
								/>
								{formErrors.labour && (
									<FormHelperText>
										{formErrors.labour}
									</FormHelperText>
								)}
							</FormControl>
							<FormControl
								size='small'
								variant='outlined'
								fullWidth
								error={!!formErrors.ds}
							>
								<InputLabel htmlFor='ds'>D.S.</InputLabel>
								<OutlinedInput
									id='ds'
									label='D.S.'
									type='number'
									value={formData.ds ? formData.ds : ''}
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											ds: +e.target.value as number,
										}));
									}}
								/>
								{formErrors.ds && (
									<FormHelperText>
										{formErrors.ds}
									</FormHelperText>
								)}
							</FormControl>
							<FormControl
								size='small'
								variant='outlined'
								fullWidth
								error={!!formErrors.doorDelivery}
							>
								<InputLabel htmlFor='door-delivery'>
									Door Delivery
								</InputLabel>
								<OutlinedInput
									id='door-delivery'
									label='Door Delivery'
									type='number'
									value={
										formData.doorDelivery
											? formData.doorDelivery
											: ''
									}
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											doorDelivery: +e.target
												.value as number,
										}));
									}}
								/>
								{formErrors.doorDelivery && (
									<FormHelperText>
										{formErrors.doorDelivery}
									</FormHelperText>
								)}
							</FormControl>
							<FormControl
								size='small'
								variant='outlined'
								fullWidth
								error={!!formErrors.other}
							>
								<InputLabel htmlFor='other'>Other</InputLabel>
								<OutlinedInput
									id='other'
									label='Other'
									type='number'
									value={formData.other ? formData.other : ''}
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											other: +e.target.value as number,
										}));
									}}
								/>
								{formErrors.other && (
									<FormHelperText>
										{formErrors.doorDelivery}
									</FormHelperText>
								)}
							</FormControl>
							<FormControl
								size='small'
								variant='outlined'
								fullWidth
								error={!!formErrors.gi}
							>
								<InputLabel htmlFor='gi'>G.I.</InputLabel>
								<OutlinedInput
									id='gi'
									label='G.I.'
									type='number'
									value={formData.gi ? formData.gi : ''}
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											gi: +e.target.value as number,
										}));
									}}
								/>
								{formErrors.gi && (
									<FormHelperText>
										{formErrors.gi}
									</FormHelperText>
								)}
							</FormControl>
							<FormControl
								size='small'
								variant='outlined'
								fullWidth
								error={!!formErrors.demurrage}
							>
								<InputLabel htmlFor='demurrage'>
									Demurrage
								</InputLabel>
								<OutlinedInput
									id='demurrage'
									label='Demurrage'
									type='number'
									value={
										formData.demurrage
											? formData.demurrage
											: ''
									}
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											demurrage: +e.target
												.value as number,
										}));
									}}
								/>
								{formErrors.demurrage && (
									<FormHelperText>
										{formErrors.demurrage}
									</FormHelperText>
								)}
							</FormControl>
							<FormControl
								size='small'
								variant='outlined'
								fullWidth
								error={!!formErrors.stationary}
							>
								<InputLabel htmlFor='stationary'>
									Stationary
								</InputLabel>
								<OutlinedInput
									id='stationary'
									label='Stationary'
									type='number'
									value={
										formData.stationary
											? formData.stationary
											: ''
									}
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											stationary: +e.target
												.value as number,
										}));
									}}
								/>
								{formErrors.stationary && (
									<FormHelperText>
										{formErrors.stationary}
									</FormHelperText>
								)}
							</FormControl>
							<FormControl
								size='small'
								variant='outlined'
								fullWidth
								error={!!formErrors.convCharge}
							>
								<InputLabel htmlFor='convCharge'>
									Conv. Charges
								</InputLabel>
								<OutlinedInput
									id='convCharge'
									label='Conv. Charges'
									type='number'
									value={
										formData.convCharge
											? formData.convCharge
											: ''
									}
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											convCharge: +e.target
												.value as number,
										}));
									}}
								/>
								{formErrors.convCharge && (
									<FormHelperText>
										{formErrors.convCharge}
									</FormHelperText>
								)}
							</FormControl>
							<FormControl
								size='small'
								variant='outlined'
								fullWidth
								focused={false}
								disabled={true}
							>
								<InputLabel htmlFor='subtotal'>
									Subtotal
								</InputLabel>
								<OutlinedInput
									id='subtotal'
									label='Subtotal'
									type='number'
									value={
										formData.subTotal
											? formData.subTotal
											: ''
									}
									contentEditable={false}
								/>
							</FormControl>
							<FormControl
								size='small'
								variant='outlined'
								fullWidth
							>
								<InputLabel htmlFor='discount'>
									Discount
								</InputLabel>
								<OutlinedInput
									id='discount'
									label='Discount'
									type='number'
									value={
										formData.discount
											? formData.discount
											: ''
									}
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											discount: +e.target.value as number,
										}));
									}}
								/>
							</FormControl>
							<FormControl
								size='small'
								variant='outlined'
								fullWidth
								disabled={true}
							>
								<InputLabel htmlFor='delivery-amount'>
									Delivery Amount
								</InputLabel>
								<OutlinedInput
									id='delivery-amount'
									label='Delivery Amount'
									type='number'
									value={formData.total ? formData.total : ''}
								/>
							</FormControl>
						</div>
					</div>
					<div
						data-component='cash-memo'
						className='buttons-container'
					>
						<LoadingButton
							variant='contained'
							color='primary'
							onClick={async () => {
								const canPrint = !isFormEditMode
									? await handleCreateCashMemoAsync()
									: await handleUpdateCashMemoAsync();

								if (canPrint) {
									printPDF(
										document.getElementById(
											'cash-memo-print'
										) as HTMLElement,
										'a4'
									);
								}
							}}
							loading={isFormLoading}
							disabled={booking.length === 0}
						>
							{!isFormEditMode
								? 'Save & Print'
								: 'Update & Print'}
						</LoadingButton>
						<LoadingButton
							variant='contained'
							color='primary'
							onClick={
								!isFormEditMode
									? handleCreateCashMemoAsync
									: handleUpdateCashMemoAsync
							}
							loading={isFormLoading}
							disabled={booking.length === 0}
						>
							{!isFormEditMode ? 'Save' : 'Update'}
						</LoadingButton>
						{isFormEditMode && (
							<>
								<LoadingButton
									color='primary'
									onClick={() => {
										printPDF(
											document.getElementById(
												'cash-memo-print'
											) as HTMLElement,
											'a4'
										);
									}}
									loading={isFormLoading}
								>
									Print
								</LoadingButton>
								<LoadingButton
									color='primary'
									onClick={handleDeleteCashMemoAsync}
									loading={isFormLoading}
								>
									Delete
								</LoadingButton>
							</>
						)}
						<Button
							disabled={isFormLoading}
							onClick={handleReset}
						>
							Clear
						</Button>
					</div>
				</div>
			</div>

			<Alert
				{...alertDialog}
				onClose={handleCloseAlertDialog}
			/>

			{formData && booking.length !== 0 && user && (
				<div
					data-component='cash-memo'
					className='pdf'
					id='cash-memo-print'
				>
					{new Array(2).fill(null).map(() => {
						return (
							<div
								data-component='cash-memo'
								className='section'
							>
								<div data-component="cash-memo" className="head-container"> 
								<div
									data-component='cash-memo'
									className='logo-container'
								>
									<img
										data-component='cash-memo'
										className='logo'
										src={Logo}
									/>
								</div>
								<div
									data-component='cash-memo'
									className='headline title-large'
								>
									{company?.companyName
										? company?.companyName
										: '--'}
									<div
										data-component='cash-memo'
										className='body-small'
									>
										{userBranchDetails?.address
											? userBranchDetails?.address
											: '--'}
									</div>
									<div
										data-component='cash-memo'
										className='body-small'
									>
										Phone No.:{' '}
										{user?.phone ? user?.phone : '--'}
									</div>
								</div>
								</div>
								<div
									data-component='cash-memo'
									className='text body-small'
								>
									CASH MEMO
								</div>
								<div
									data-component='cash-memo'
									className='section-1'
								>
									<div
										data-component='cash-memo'
										className='container'
									>
										<div
											data-component='cash-memo'
											className='columns-2'
										>
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='label'
												>
													Cash Memo No.:
												</div>
												<div
													data-component='cash-memo'
													className='value'
												>
													{formData.cashMemoNo
														? formData.cashMemoNo
														: '--'}
												</div>
											</div>
										</div>
										<div
											data-component='cash-memo'
											className='columns-2'
										>
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='label'
												>
													Date:
												</div>
												<div
													data-component='cash-memo'
													className='value'
												>
													{formData.cashMemoDate
														? format(
																formData.cashMemoDate,
																'dd-MM-yyyy'
														  )
														: '--'}
												</div>
											</div>
										</div>
									</div>
									<div
										data-component='cash-memo'
										className='container'
									>
										<div
											data-component='cash-memo'
											className='columns-1'
										>
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='value'
												>
													{consignee?.partyName
														? consignee?.partyName
														: '--'}
												</div>
											</div>
										</div>
									</div>
									<div
										data-component='cash-memo'
										className='container'
									>
										<div
											data-component='cash-memo'
											className='columns-1'
										>
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='value'
												>
													GSTN:
												</div>
												<div
													data-component='cash-memo'
													className='value'
												>
													{consignee?.gstNo
														? consignee?.gstNo
														: '--'}
												</div>
											</div>
										</div>
									</div>
								</div>
								<div
									data-component='cash-memo'
									className='section-2'
								>
									<div
										data-component='cash-memo'
										className='container'
									>
										<div
											data-component='cash-memo'
											className='columns-4'
										>
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='label align-center'
												>
													LR No.
												</div>
											</div>
										</div>
										<div
											data-component='cash-memo'
											className='columns-4'
										>
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='label align-center'
												>
													Bkg.Dt.
												</div>
											</div>
										</div>
										<div
											data-component='cash-memo'
											className='columns-4'
										>
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='label align-center'
												>
													Art.
												</div>
											</div>
										</div>
										<div
											data-component='cash-memo'
											className='columns-2'
										>
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='label align-center'
												>
													From
												</div>
											</div>
										</div>
									</div>
									<div
										data-component='cash-memo'
										className='container'
									>
										<div
											data-component='cash-memo'
											className='columns-4'
										>
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='value align-center'
												>
													{formData?.lrNumber
														? formData?.lrNumber
														: '--'}
												</div>
											</div>
										</div>
										<div
											data-component='cash-memo'
											className='columns-4'
										>
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='value align-center'
												>
													{booking.length !== 0 &&
													booking[0].bookingDate
														? format(
																booking[0]
																	.bookingDate,
																'dd-MM-yyyy'
														  )
														: '--'}
												</div>
											</div>
										</div>
										<div
											data-component='cash-memo'
											className='columns-4'
										>
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='value align-center'
												>
													{booking
														? booking[0]
															? booking[0].bookingDetails.reduce(
																	(
																		sum: any,
																		detail: any
																	) =>
																		sum +
																		detail.article,
																	0
															  )
															: ''
														: ''}
												</div>
											</div>
										</div>
										<div
											data-component='cash-memo'
											className='columns-2'
										>
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='value align-center'
												>
													{booking
														? booking[0]
															? booking[0]
																	.fromBranch
															: ''
														: ''}
												</div>
											</div>
										</div>
									</div>
								</div>
								<div
									data-component='cash-memo'
									className='section-3'
								>
									<div
										data-component='cash-memo'
										className='value-container'
									>
										<div
											data-component='cash-memo'
											className='value'
										>
											Pvt.Mrk.:
										</div>
										<div
											data-component='cash-memo'
											className='value'
										>
											{booking
												? booking[0]
													? booking[0].privateMark
													: ''
												: ''}
										</div>
									</div>
								</div>
								<div
									data-component='cash-memo'
									className='section-4'
								>
									<div
										data-component='cash-memo'
										className='left-section'
									>
										<div
											data-component='cash-memo'
											className='nested-section-1'
										>
											<div
												data-component='cash-memo'
												className='container'
											>
												<div
													data-component='cash-memo'
													className='columns-2'
												>
													<div
														data-component='cash-memo'
														className='value-container'
													>
														<div
															data-component='cash-memo'
															className='label'
														>
															Chg.Wt.:
														</div>
														<div
															data-component='cash-memo'
															className='value'
														>
															{booking
																? booking[0]
																	? booking[0].bookingDetails.reduce(
																			(
																				sum: any,
																				detail: any
																			) =>
																				sum +
																				detail.chargeWeight,
																			0
																	  )
																	: ''
																: ''}
														</div>
													</div>
												</div>
												<div
													data-component='cash-memo'
													className='columns-1'
												>
													<div
														data-component='cash-memo'
														className='value-container'
													>
														<div
															data-component='cash-memo'
															className='label'
														>
															LR Type:
														</div>
														<div
															data-component='cash-memo'
															className='value'
														>
															{formData.paymentType
																? findObjectInArray(
																		paymentTypes,
																		'paymentTypeId',
																		booking[0]
																			.paymentType
																  ).paymentType
																: ''}
														</div>
													</div>
												</div>
											</div>
										</div>
										<div
											data-component='cash-memo'
											className='nested-section-2'
										>
											<div
												data-component='cash-memo'
												className='container'
											>
												<div
													data-component='cash-memo'
													className='columns-1'
												>
													<div
														data-component='cash-memo'
														className='value-container'
													>
														<div
															data-component='cash-memo'
															className='label'
														>
															Cnor:
														</div>
														<div
															data-component='cash-memo'
															className='value'
														>
															{consignor?.partyName
																? consignor?.partyName
																: '--'}
														</div>
													</div>
												</div>
											</div>
											<div
												data-component='cash-memo'
												className='container'
											>
												<div
													data-component='cash-memo'
													className='columns-1'
												>
													<div
														data-component='cash-memo'
														className='value-container'
													>
														<div
															data-component='cash-memo'
															className='label'
														>
															Delivered To:
														</div>
														<div
															data-component='cash-memo'
															className='value'
														>
															{formData?.deliveredToName
																? formData?.deliveredToName
																: '--'}
														</div>
													</div>
												</div>
											</div>
											<div
												data-component='cash-memo'
												className='container'
											>
												<div
													data-component='cash-memo'
													className='columns-1'
												>
													<div
														data-component='cash-memo'
														className='value-container'
													>
														<div
															data-component='cash-memo'
															className='label'
														>
															Phone No:
														</div>
														<div
															data-component='cash-memo'
															className='value'
														>
															{formData?.deliveredToPhone
																? formData?.deliveredToPhone
																: '--'}
														</div>
													</div>
												</div>
											</div>
										</div>
										<div
											data-component='cash-memo'
											className='nested-section-3'
										>
											<div
												data-component='cash-memo'
												className='columns-1'
											>
												<div
													data-component='cash-memo'
													className='value-container'
												>
													<div
														data-component='cash-memo'
														className='label'
													>
														Branch Name:
													</div>
													<div
														data-component='cash-memo'
														className='value'
													>
														{formData?.deliveryBranchId
															? findObjectInArray(
																	deliveryBranches,
																	'branchId',
																	formData.deliveryBranchId
															  ).name
															: '--'}
													</div>
												</div>
											</div>
										</div>
										<div
											data-component='cash-memo'
											className='nested-section-3'
										>
											<div
												data-component='cash-memo'
												className='columns-1'
											>
												<div
													data-component='cash-memo'
													className='value-container'
												>
													<div
														data-component='cash-memo'
														className='label'
													>
														Payment Type:
													</div>
													<div
														data-component='cash-memo'
														className='value'
													>
														{formData?.paymentType
															? formData?.paymentType
															: '--'}
													</div>
												</div>
											</div>
										</div>
										<div
											data-component='cash-memo'
											className='nested-section-3'
										>
											<div
												data-component='cash-memo'
												className='columns-1'
											>
												<div
													data-component='cash-memo'
													className='value-container'
												>
													<div
														data-component='cash-memo'
														className='value'
													>
														Rs.
														{convertToWords(
															formData.total
														).toUpperCase()}
													</div>
												</div>
											</div>
										</div>
										<div
											data-component='cash-memo'
											className='nested-section-4'
										>
											<div
												data-component='cash-memo'
												className='columns-1'
											>
												<div
													data-component='cash-memo'
													className='value-container'
												>
													<div
														data-component='cash-memo'
														className='label'
													>
														For B.A.T.O.
													</div>
												</div>
											</div>
										</div>
									</div>
									<div
										data-component='cash-memo'
										className='right-section'
									>
										{formData.bookingTotal ? (
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='label'
												>
													Bkg.Total:
												</div>
												<div
													data-component='cash-memo'
													className='value'
												>
													{formData.bookingTotal.toFixed(
														2
													)}
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.labour ? (
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='label'
												>
													Labour:
												</div>
												<div
													data-component='cash-memo'
													className='value'
												>
													{formData.labour.toFixed(2)}
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.ds ? (
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='label'
												>
													D.S:
												</div>
												<div
													data-component='cash-memo'
													className='value'
												>
													{formData.ds.toFixed(2)}
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.doorDelivery ? (
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='label'
												>
													Door Delivery:
												</div>
												<div
													data-component='cash-memo'
													className='value'
												>
													{formData.doorDelivery.toFixed(
														2
													)}
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.other ? (
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='label'
												>
													Other:
												</div>
												<div
													data-component='cash-memo'
													className='value'
												>
													{formData.other.toFixed(2)}
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.gi ? (
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='label'
												>
													G.I.:
												</div>
												<div
													data-component='cash-memo'
													className='value'
												>
													{formData.gi.toFixed(2)}
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.demurrage ? (
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='label'
												>
													Demurrage:
												</div>
												<div
													data-component='cash-memo'
													className='value'
												>
													{formData.demurrage.toFixed(
														2
													)}
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.stationary ? (
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='label'
												>
													Stationary:
												</div>
												<div
													data-component='cash-memo'
													className='value'
												>
													{formData.stationary.toFixed(
														2
													)}
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.convCharge ? (
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='label'
												>
													Conv. Charges:
												</div>
												<div
													data-component='cash-memo'
													className='value'
												>
													{formData.convCharge.toFixed(
														2
													)}
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.discount ? (
											<div
												data-component='cash-memo'
												className='value-container'
											>
												<div
													data-component='cash-memo'
													className='label'
												>
													Discount:
												</div>
												<div
													data-component='cash-memo'
													className='value'
												>
													{formData.discount.toFixed(
														2
													)}
												</div>
											</div>
										) : (
											<></>
										)}
										<div
											style={{
												flex: '1',
											}}
										></div>
										<div
											data-component='cash-memo'
											className='value-container total'
										>
											<div
												data-component='cash-memo'
												className='label'
											>
												Net Amount:
											</div>
											<div
												data-component='cash-memo'
												className='value'
											>
												{formData.total.toFixed(2)}
											</div>
										</div>
										<div
											data-component='cash-memo'
											className='value-container name'
										>
											<div
												data-component='cash-memo'
												className='label'
											>
												{user?.fullName
													? user?.fullName
													: '--'}{' '}
												{formData.cashMemoDate
													? format(
															formData.cashMemoDate,
															'hh:mm a'
													  )
													: format(
															new Date(),
															'hh:mm a'
													  )}
											</div>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</>
	);
});

// -------------------------------------------------------------------------------------------

export default CashMemo;

// -------------------------------------------------------------------------------------------
