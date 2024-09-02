// -------------------------------------------------------------------------------------------

import './HireSlip.scss';

import { format } from 'date-fns';
import Decimal from 'decimal.js';
import { memo, useCallback, useEffect, useState } from 'react';
import { To, useLocation, useNavigate } from 'react-router-dom';

import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
	Button,
	FormControl,
	FormHelperText,
	InputLabel,
	OutlinedInput,
} from '@mui/material';

import RouterPath from '../../../app/routerPath';
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
import { getBranchByIdAsync } from '../../../services/branch/branch';
import {
	BranchInterface,
	RegionInterface,
} from '../../../services/branch/branch.types';
import { CompanyInterface } from '../../../services/company/company.types';
import {
	createHireSlipAsync,
	getBankDetailsByTruckNumberAsync,
	getHireSlipAsync,
} from '../../../services/loadingMemo/loadingMemo';
import { HireSlipInterface } from '../../../services/loadingMemo/loadingMemo.types';
import { UserInterface } from '../../../services/user/user.types';
import convertToWords from '../../../utils/convertToWords';
import findObjectInArray from '../../../utils/findObjectInArray';
import printPDF from '../../../utils/printPDF';

// -------------------------------------------------------------------------------------------

const defaultFormData: HireSlipInterface = {
	loadingMemoId: 0,
	hireSlipNo: 0,
	boliWeight: 0,
	ratePMT: 0,
	lorryHire: 0,
	halting: 0,
	overWeight: 0,
	overHeight: 0,
	overLength: 0,
	localCollection: 0,
	doorDelivery: 0,
	other1: 0,
	advance: 0,
	refund: 0,
	delayedCharges: 0,
	other2: 0,
	balanceHire: 0,
	userId: 0,
	bankName: '',
	partyName: '',
	accountNo: '',
	ifscCode: '',
	bankBranchName: '',
	remark: '',
};

const defaultFormErrors = {
	boliWeight: '',
	ratePMT: '',
	lorryHire: '',
	bankName: '',
	partyName: '',
	accountNo: '',
	ifscCode: '',
	bankBranchName: '',
};

// -------------------------------------------------------------------------------------------

const HireSlip = memo(() => {
	const { setTitle } = useApp();
	const { handleLogout } = useAuth();
	const {
		getUserDetails,
		getDeliveryBranches,
		getBookingBranches,
		getRegions,
		getCompanyDetailsById,
	} = useApi();
	const location = useLocation();
	const navigate = useNavigate();

	const [isFormLoading, setIsFormLoading] = useState(false);
	const [fallbackState, setFallbackState] =
		useState<FallbackStateType>('loading');
	const [formData, setFormData] =
		useState<HireSlipInterface>(defaultFormData);
	const [formErrors, setFormErrors] = useState(defaultFormErrors);
	const [alertDialog, setAlertDialog] = useState<AlertInterface>({
		state: 'success',
		label: '',
		isActive: false,
	});
	const [user, setUser] = useState<UserInterface>();
	const [regions, setRegions] = useState<RegionInterface[]>();
	const [bookingBranches, setBookingBranches] = useState<BranchInterface[]>();
	const [deliveryBranches, setDeliveryBranches] =
		useState<BranchInterface[]>();
	const [isFormEditMode, setIsFormEditMode] = useState<boolean>(false);
	const [company, _setCompany] = useState<CompanyInterface>();
	const [userBranchDetails, setUserBranchDetails] =
		useState<BranchInterface>();

	const [valueToPlus, setValueToPlus] = useState<number>(0);
	const [valueToMinus, setValueToMinus] = useState<number>(0);

	const getRegionNames = (regionIdsString: string): string[] => {
		if (!regions) return [];

		const regionIds = regionIdsString
			.split(',')
			.map((id) => parseInt(id.trim(), 10));
		return regionIds
			.map((regionId) =>
				regions.find((region) => region.regionId === regionId)
			)
			.filter((region) => region !== undefined)
			.map((region) => region!.region);
	};

	useEffect(() => {
		setTitle('Hire Slip');
		initialFetch();
		if (location.state) {
			handleGetHireSlipAsync(location.state.loadingMemo.loadingMemoId);
			handleGetBankDetailsByTruckNumberAsync(
				location.state.loadingMemo.truckNo
			);
		} else {
			navigate(RouterPath.Dashboard, { replace: true });
		}
	}, [setTitle, location]);

	const initialFetch = useCallback(async () => {
		const userData = await getUserDetails();
		const bookingBranchesData = await getBookingBranches();
		const deliveryBranchesData = await getDeliveryBranches();
		const regionsData = await getRegions();
		const companyData = await getCompanyDetailsById();

		if (userData) {
			setUser(userData);
			setBookingBranches(bookingBranchesData);
			setDeliveryBranches(deliveryBranchesData);
			setRegions(regionsData);
			_setCompany(companyData);

			if (userData) {
				handleGetBranchById(userData.branchId);
			}

			setFallbackState('hidden');
		} else {
			setFallbackState('not-found');
		}
	}, [user]);

	useEffect(() => {
		let ratePerMetricKG = new Decimal(+formData.ratePMT).dividedBy(1000);

		let lorryHire = new Decimal(+ratePerMetricKG).times(
			formData.boliWeight
		);

		setFormData((prev) => ({
			...prev,
			lorryHire: +lorryHire,
		}));
	}, [formData.boliWeight, formData.ratePMT]);

	useEffect(() => {
		const row1 = +formData.lorryHire;

		const row2 = +new Decimal(+formData.halting)
			.plus(new Decimal(+formData.overWeight))
			.plus(new Decimal(+formData.overHeight))
			.plus(new Decimal(+formData.overLength))
			.plus(new Decimal(+formData.localCollection))
			.plus(new Decimal(+formData.doorDelivery))
			.plus(new Decimal(+formData.other1));

		const row3 = +new Decimal(+formData.advance)
			.plus(new Decimal(+formData.refund))
			.plus(new Decimal(+formData.delayedCharges))
			.plus(new Decimal(+formData.other2));

		const balanceHire = new Decimal(
			new Decimal(row1 ? row1 : 0).plus(row2)
		).minus(row3);

		setFormData((prev) => ({
			...prev,
			balanceHire: +balanceHire,
		}));

		setValueToPlus(+new Decimal(row1).plus(row2));
		setValueToMinus(row3);
	}, [
		formData.lorryHire,
		formData.halting,
		formData.overWeight,
		formData.overHeight,
		formData.overLength,
		formData.localCollection,
		formData.doorDelivery,
		formData.other1,
		formData.advance,
		formData.refund,
		formData.delayedCharges,
		formData.other2,
	]);

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

	const handleOpenAlertDialog = useCallback(
		(state: AlertStates, label: string) => {
			setAlertDialog({ state, label, isActive: true });
		},
		[]
	);

	const handleCloseAlertDialog = useCallback(() => {
		setAlertDialog({ state: 'success', label: '', isActive: false });
	}, []);

	const validateHireSlip = useCallback((): boolean => {
		const errors = { ...defaultFormErrors };
		if (!formData?.boliWeight) {
			errors.boliWeight = 'Boli Weight is required.';
		}
		if (!formData?.ratePMT) {
			errors.ratePMT = 'Rate Per Metric Tone is required.';
		}
		if (!formData?.lorryHire) {
			errors.lorryHire = 'Lorry Hire is required.';
		}
		if (!formData?.bankName) {
			errors.bankName = 'Bank Name is required.';
		}
		if (!formData?.partyName) {
			errors.partyName = 'Party Name is required.';
		}
		if (!formData?.accountNo) {
			errors.accountNo = 'Account Number is required.';
		}
		if (!formData?.ifscCode) {
			errors.ifscCode = 'IFSC Code is required.';
		}
		if (!formData?.bankBranchName) {
			errors.bankBranchName = 'Bank Branch Name is required.';
		}

		setFormErrors(errors);
		return Object.values(errors).every((error) => error === '');
	}, [formData]);

	const handleCreateHireSlip = useCallback(async (): Promise<Boolean> => {
		if (!validateHireSlip()) return false;

		const data = {
			loadingMemoId: location.state.loadingMemo.loadingMemoId
				? location.state.loadingMemo.loadingMemoId
				: 0,
			hireSlipNo: formData.hireSlipNo ? formData.hireSlipNo : 0,
			boliWeight: formData.boliWeight ? formData.boliWeight : 0,
			ratePMT: formData.ratePMT ? formData.ratePMT : 0,
			lorryHire: formData.lorryHire ? formData.lorryHire : 0,
			halting: formData.halting ? formData.halting : 0,
			overWeight: formData.overWeight ? formData.overWeight : 0,
			overHeight: formData.overHeight ? formData.overHeight : 0,
			overLength: formData.overLength ? formData.overLength : 0,
			localCollection: formData.localCollection
				? formData.localCollection
				: 0,
			doorDelivery: formData.doorDelivery ? formData.doorDelivery : 0,
			other1: formData.other1 ? formData.other1 : 0,
			advance: formData.advance ? formData.advance : 0,
			refund: formData.refund ? formData.refund : 0,
			delayedCharges: formData.delayedCharges
				? formData.delayedCharges
				: 0,
			other2: formData.other2 ? formData.other2 : 0,
			balanceHire: formData.balanceHire ? formData.balanceHire : 0,
			userId: user?.userId ? user?.userId : 0,
			companyId: user?.companyId ? user?.companyId : 0,
			bankName: formData.bankName ? formData.bankName : '',
			partyName: formData.partyName ? formData.partyName : '',
			accountNo: formData.accountNo ? formData.accountNo : '',
			ifscCode: formData.ifscCode ? formData.ifscCode : '',
			bankBranchName: formData.bankBranchName
				? formData.bankBranchName
				: '',
			remark: formData.bankBranchName ? formData.bankBranchName : '',
		};

		setIsFormLoading(true);

		try {
			const response = await createHireSlipAsync(data);
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (response.data.status === 200) {
					handleOpenAlertDialog('success', 'Created new Hire Slip.');
					setIsFormEditMode(true);
					return true;
				} else {
					handleOpenAlertDialog('warning', response.data.data);
					return false;
				}
			} else {
				handleLogout();
				return false;
			}
		} catch (error) {
			handleLogout();
			return false;
		} finally {
			setIsFormLoading(false);
		}
	}, [user, formData]);

	const handleGetHireSlipAsync = useCallback(
		async (loadingMemoId: number) => {
			const response = await getHireSlipAsync(loadingMemoId);

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: any = response.data.data;
				if (data) {
					setIsFormEditMode(true);
					setFormData(data);
				} else {
					setIsFormEditMode(false);
				}
			} else {
				handleLogout();
			}
		},
		[user, formData]
	);

	const handleGetBankDetailsByTruckNumberAsync = useCallback(
		async (truckNumber: number) => {
			const response = await getBankDetailsByTruckNumberAsync(
				truckNumber
			);

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: any = response.data.data;
				if (data) {
					setFormData((prev) => ({
						...prev,
						bankName: data.bankName ? data.bankName : '',
						partyName: data.partyName ? data.partyName : '',
						accountNo: data.accountNo ? data.accountNo : '',
						ifscCode: data.ifscCode ? data.ifscCode : '',
						bankBranchName: data.bankBranchName
							? data.bankBranchName
							: '',
					}));
				}
			} else {
				handleLogout();
			}
		},
		[user, formData]
	);

	const handlPrintHireSlipprint = () => {
		const element = document.getElementById(
			'hire-slip-print'
		) as HTMLElement;
		if (element) {
			printPDF(element, 'a4');
		}
	};

	const submitAndPrint = async () => {
		if (await handleCreateHireSlip()) {
			handlPrintHireSlipprint();
		}
	};

	return (
		<>
			<div
				data-component='hire-slip'
				className='container'
			>
				<div
					data-component='hire-slip'
					className='bottom'
				>
					{fallbackState !== 'hidden' ? (
						<Fallback state={fallbackState} />
					) : (
						<>
							<div
								data-component='hire-slip'
								className='form'
							>
								<div
									data-component='hire-slip'
									className='container'
								>
									<div
										data-component='hire-slip'
										className='columns-1'
										style={{
											paddingBottom: 'var(--space)',
										}}
									>
										<div
											data-component='hire-slip'
											className='title-medium'
										>
											Hire Slip Details
										</div>
										<div
											data-component='hire-slip'
											className='container'
										>
											<div
												data-component='hire-slip'
												className='columns-2'
											>
												<FormControl
													size='small'
													variant='outlined'
													fullWidth
													focused={false}
												>
													<InputLabel htmlFor='hire-slip-no'>
														Hire Slip No.
													</InputLabel>
													<OutlinedInput
														id='hire-slip-no'
														label='Hire Slip No.'
														contentEditable={false}
														value={
															location.state
																.loadingMemo
																.ldmNo
														}
													/>
												</FormControl>
											</div>
											<div
												data-component='hire-slip'
												className='columns-2'
											>
												<FormControl
													focused={false}
													size='small'
													variant='outlined'
													fullWidth
												>
													<InputLabel htmlFor='region'>
														Region
													</InputLabel>
													<OutlinedInput
														multiline
														contentEditable={false}
														id='region'
														label='Region'
														value={
															location.state
																.loadingMemo
																.regionId &&
															regions
																? getRegionNames(
																		location
																			.state
																			.loadingMemo
																			.regionId
																  )
																: '--'
														}
													/>
												</FormControl>
											</div>
										</div>
										<div
											data-component='hire-slip'
											className='container'
										>
											<div
												data-component='hire-slip'
												className='columns-2'
											>
												<FormControl
													focused={false}
													size='small'
													variant='outlined'
													fullWidth
												>
													<InputLabel htmlFor='from'>
														From
													</InputLabel>
													<OutlinedInput
														contentEditable={false}
														id='hire-slip-no'
														label='From'
														value={
															location.state
																.loadingMemo
																.fromStationId &&
															bookingBranches
																? findObjectInArray(
																		bookingBranches,
																		'branchId',
																		location
																			.state
																			.loadingMemo
																			.fromStationId
																  ).name
																: '--'
														}
													/>
												</FormControl>
											</div>
											<div
												data-component='hire-slip'
												className='columns-2'
											>
												<FormControl
													focused={false}
													size='small'
													variant='outlined'
													fullWidth
												>
													<InputLabel htmlFor='to'>
														To
													</InputLabel>
													<OutlinedInput
														contentEditable={false}
														id='to'
														label='To'
														value={
															location.state
																.loadingMemo
																.toStationId &&
															deliveryBranches &&
															bookingBranches
																? findObjectInArray(
																		[
																			...deliveryBranches,
																			...bookingBranches,
																		],
																		'branchId',
																		location
																			.state
																			.loadingMemo
																			.toStationId
																  ).name
																: '--'
														}
													/>
												</FormControl>
											</div>
										</div>
										<div
											data-component='hire-slip'
											className='container'
										>
											<div
												data-component='hire-slip'
												className='columns-2'
											>
												<FormControl
													focused={false}
													size='small'
													variant='outlined'
													fullWidth
												>
													<InputLabel htmlFor='date'>
														Date
													</InputLabel>
													<OutlinedInput
														contentEditable={false}
														id='date'
														label='Date'
														value={format(
															location.state
																.loadingMemo
																.ldmDate,
															'dd-MM-yyyy'
														)}
													/>
												</FormControl>
											</div>
											<div
												data-component='hire-slip'
												className='columns-2'
											>
												<FormControl
													size='small'
													variant='outlined'
													fullWidth
													focused={false}
												>
													<InputLabel htmlFor='driver-name'>
														Driver Name
													</InputLabel>
													<OutlinedInput
														id='driver-name'
														label='Driver Name'
														contentEditable={false}
														value={
															location.state
																.loadingMemo
																.driverName
														}
													/>
												</FormControl>
											</div>
										</div>
										<div
											data-component='hire-slip'
											className='container'
										>
											<div
												data-component='hire-slip'
												className='columns-2'
											>
												<FormControl
													focused={false}
													size='small'
													variant='outlined'
													fullWidth
												>
													<InputLabel htmlFor='driver-phone'>
														Driver Contact Number
													</InputLabel>
													<OutlinedInput
														contentEditable={false}
														id='driver-phone'
														label='Driver Contact Number'
														value={
															location.state
																.loadingMemo
																.driverContactNo
														}
													/>
												</FormControl>
											</div>
											<div
												data-component='hire-slip'
												className='columns-2'
											>
												<FormControl
													focused={false}
													size='small'
													variant='outlined'
													fullWidth
												>
													<InputLabel htmlFor='broker-name'>
														Broker Name
													</InputLabel>
													<OutlinedInput
														contentEditable={false}
														id='broker-name'
														label='Broker Name'
														value={
															location.state
																.loadingMemo
																.brokerName
														}
													/>
												</FormControl>
											</div>
										</div>
										<div
											data-component='hire-slip'
											className='container'
										>
											<div
												data-component='hire-slip'
												className='columns-2'
											>
												<FormControl
													focused={false}
													size='small'
													variant='outlined'
													fullWidth
												>
													<InputLabel htmlFor='broker-phone'>
														Broker Contact Number
													</InputLabel>
													<OutlinedInput
														contentEditable={false}
														id='broker-phone'
														label='Broker Contact Number'
														value={
															location.state
																.loadingMemo
																.brokerContactNo
														}
													/>
												</FormControl>
											</div>
											<div
												data-component='hire-slip'
												className='columns-2'
											>
												<FormControl
													focused={false}
													size='small'
													variant='outlined'
													fullWidth
												>
													<InputLabel htmlFor='truck-number'>
														Truck Number
													</InputLabel>
													<OutlinedInput
														contentEditable={false}
														id='truck Number'
														label='Truck-number'
														value={
															location.state
																.loadingMemo
																.truckNo
														}
													/>
												</FormControl>
											</div>
										</div>
										<div
											data-component='hire-slip'
											className='container'
										>
											<div
												data-component='hire-slip'
												className='columns-2'
											>
												<FormControl
													size='small'
													variant='outlined'
													fullWidth
													focused={false}
												>
													<InputLabel htmlFor='weight'>
														Actual Weight (KG)
													</InputLabel>
													<OutlinedInput
														id='weight'
														label='Actual Weight (KG)'
														type='number'
														value={
															location.state
																.loadingMemo
																? location.state
																		.loadingMemo
																		.totalWeight
																: '0'
														}
														contentEditable={false}
													/>
												</FormControl>
											</div>
											<div
												data-component='hire-slip'
												className='columns-2'
											>
												<FormControl
													size='small'
													variant='outlined'
													fullWidth
													focused={false}
												>
													<InputLabel htmlFor='charge-weight'>
														Charge Weight (KG)
													</InputLabel>
													<OutlinedInput
														id='charge-weight'
														label='Charge Weight (KG)'
														type='number'
														value={
															location.state
																.loadingMemo
																? location.state
																		.loadingMemo
																		.totalChargeWeight
																: '0'
														}
														contentEditable={false}
													/>
												</FormControl>
											</div>
										</div>
									</div>
									<div
										data-component='hire-slip'
										className='columns-2'
									>
										<div
											data-component='hire-slip'
											className='right-container'
										>
											<div
												data-component='hire-slip'
												className='container'
											>
												<div
													data-component='hire-slip'
													className='columns-1'
												>
													<div
														data-component='hire-slip'
														className='title-medium'
													>
														Bank Detail
													</div>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
														error={
															!!formErrors.partyName
														}
													>
														<InputLabel htmlFor='party-name'>
															Party Name
														</InputLabel>
														<OutlinedInput
															id='party-name'
															label='Party Name'
															type='text'
															value={
																formData.partyName
																	? formData.partyName
																	: ''
															}
															onChange={(e) => {
																setFormData(
																	(prev) => ({
																		...prev,
																		partyName:
																			e
																				.target
																				.value,
																	})
																);
															}}
														/>
														{formErrors.partyName && (
															<FormHelperText>
																{
																	formErrors.partyName
																}
															</FormHelperText>
														)}
													</FormControl>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
														error={
															!!formErrors.bankName
														}
													>
														<InputLabel htmlFor='bankN-name'>
															Bank Name
														</InputLabel>
														<OutlinedInput
															id='bankN-name'
															label='Bank Name'
															type='text'
															value={
																formData.bankName
																	? formData.bankName
																	: ''
															}
															onChange={(e) => {
																setFormData(
																	(prev) => ({
																		...prev,
																		bankName:
																			e
																				.target
																				.value,
																	})
																);
															}}
														/>
														{formErrors.bankName && (
															<FormHelperText>
																{
																	formErrors.bankName
																}
															</FormHelperText>
														)}
													</FormControl>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
														error={
															!!formErrors.accountNo
														}
													>
														<InputLabel htmlFor='account-number'>
															Account Number
														</InputLabel>
														<OutlinedInput
															id='account-number'
															label='Account Number'
															type='text'
															value={
																formData.accountNo
																	? formData.accountNo
																	: ''
															}
															onChange={(e) => {
																setFormData(
																	(prev) => ({
																		...prev,
																		accountNo:
																			e
																				.target
																				.value,
																	})
																);
															}}
														/>
														{formErrors.accountNo && (
															<FormHelperText>
																{
																	formErrors.accountNo
																}
															</FormHelperText>
														)}
													</FormControl>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
														error={
															!!formErrors.ifscCode
														}
													>
														<InputLabel htmlFor='ifsc-code'>
															IFSC Code
														</InputLabel>
														<OutlinedInput
															id='ifsc-code'
															label='IFSC Code'
															type='text'
															value={
																formData.ifscCode
																	? formData.ifscCode
																	: ''
															}
															onChange={(e) => {
																setFormData(
																	(prev) => ({
																		...prev,
																		ifscCode:
																			e
																				.target
																				.value,
																	})
																);
															}}
														/>
														{formErrors.ifscCode && (
															<FormHelperText>
																{
																	formErrors.ifscCode
																}
															</FormHelperText>
														)}
													</FormControl>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
														error={
															!!formErrors.bankBranchName
														}
													>
														<InputLabel htmlFor='bank-branch-name'>
															Bank Branch Name
														</InputLabel>
														<OutlinedInput
															id='bank-branch-name'
															label='Bank Branch Name'
															type='text'
															value={
																formData.bankBranchName
																	? formData.bankBranchName
																	: ''
															}
															onChange={(e) => {
																setFormData(
																	(prev) => ({
																		...prev,
																		bankBranchName:
																			e
																				.target
																				.value,
																	})
																);
															}}
														/>
														{formErrors.bankBranchName && (
															<FormHelperText>
																{
																	formErrors.bankBranchName
																}
															</FormHelperText>
														)}
													</FormControl>
												</div>
											</div>
										</div>
									</div>
								</div>

								<div
									data-component='hire-slip'
									className='calculations-container'
								>
									<div
										data-component='hire-slip'
										className='container'
									>
										<div
											data-component='hire-slip'
											className='columns-1'
										>
											<div
												data-component='hire-slip'
												className='container'
											>
												<div
													data-component='hire-slip'
													className='columns-3'
												>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
														error={
															!!formErrors.boliWeight
														}
													>
														<InputLabel htmlFor='boli-weight'>
															Boli Weight (KG)
														</InputLabel>
														<OutlinedInput
															id='boli-weight'
															label='Boli Weight (KG)'
															type='number'
															value={
																formData.boliWeight
																	? formData.boliWeight
																	: ''
															}
															onChange={(e) => {
																setFormData(
																	(prev) => ({
																		...prev,
																		boliWeight:
																			+e
																				.target
																				.value as number,
																	})
																);
															}}
														/>
														{formErrors.boliWeight && (
															<FormHelperText>
																{
																	formErrors.boliWeight
																}
															</FormHelperText>
														)}
													</FormControl>
												</div>
												<div
													data-component='hire-slip'
													className='columns-3'
												>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
														error={
															!!formErrors.ratePMT
														}
													>
														<InputLabel htmlFor='ratePMT'>
															Rate Per Metric Tone
														</InputLabel>
														<OutlinedInput
															id='ratePMT'
															label='Rate Per Metric Tone'
															type='number'
															value={
																formData.ratePMT
																	? formData.ratePMT
																	: ''
															}
															onChange={(e) => {
																setFormData(
																	(prev) => ({
																		...prev,
																		ratePMT:
																			+e
																				.target
																				.value as number,
																	})
																);
															}}
														/>
														{formErrors.ratePMT && (
															<FormHelperText>
																{
																	formErrors.ratePMT
																}
															</FormHelperText>
														)}
													</FormControl>
												</div>
												<div
													data-component='hire-slip'
													className='columns-3'
												>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
														error={
															!!formErrors.ratePMT
														}
														focused={false}
													>
														<InputLabel htmlFor='lorry-hire'>
															Lorry Hire
														</InputLabel>
														<OutlinedInput
															id='lorry-hire'
															label='Lorry Hire'
															type='number'
															value={
																formData.lorryHire
																	? formData.lorryHire
																	: ''
															}
															contentEditable={
																false
															}
														/>
														{formErrors.lorryHire && (
															<FormHelperText>
																{
																	formErrors.lorryHire
																}
															</FormHelperText>
														)}
													</FormControl>
												</div>
											</div>
											<div
												data-component='hire-slip'
												className='container'
											>
												<div
													data-component='hire-slip'
													className='columns-5'
												>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
													>
														<InputLabel htmlFor='halting'>
															Halting
														</InputLabel>
														<OutlinedInput
															id='halting'
															label='Halting'
															type='number'
															value={
																formData.halting
																	? formData.halting
																	: ''
															}
															onChange={(e) => {
																setFormData(
																	(prev) => ({
																		...prev,
																		halting:
																			+e
																				.target
																				.value as number,
																	})
																);
															}}
															startAdornment={
																<AddCircleOutline />
															}
														/>
													</FormControl>
												</div>
												<div
													data-component='hire-slip'
													className='columns-5'
												>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
													>
														<InputLabel htmlFor='overweight'>
															Over Weight
														</InputLabel>
														<OutlinedInput
															id='over Weight'
															label='Overweight'
															type='number'
															value={
																formData.overWeight
																	? formData.overWeight
																	: ''
															}
															onChange={(e) => {
																setFormData(
																	(prev) => ({
																		...prev,
																		overWeight:
																			+e
																				.target
																				.value as number,
																	})
																);
															}}
															startAdornment={
																<AddCircleOutline />
															}
														/>
													</FormControl>
												</div>
												<div
													data-component='hire-slip'
													className='columns-5'
												>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
													>
														<InputLabel htmlFor='over-height'>
															Over Height
														</InputLabel>
														<OutlinedInput
															id='over-height'
															label='Over Height'
															type='number'
															value={
																formData.overHeight
																	? formData.overHeight
																	: ''
															}
															onChange={(e) => {
																setFormData(
																	(prev) => ({
																		...prev,
																		overHeight:
																			+e
																				.target
																				.value as number,
																	})
																);
															}}
															startAdornment={
																<AddCircleOutline />
															}
														/>
													</FormControl>
												</div>
												<div
													data-component='hire-slip'
													className='columns-5'
												>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
													>
														<InputLabel htmlFor='over-length'>
															Over Length
														</InputLabel>
														<OutlinedInput
															id='over-length'
															label='Over Length'
															type='number'
															value={
																formData.overLength
																	? formData.overLength
																	: ''
															}
															onChange={(e) => {
																setFormData(
																	(prev) => ({
																		...prev,
																		overLength:
																			+e
																				.target
																				.value as number,
																	})
																);
															}}
															startAdornment={
																<AddCircleOutline />
															}
														/>
													</FormControl>
												</div>
												<div
													data-component='hire-slip'
													className='columns-5'
												>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
													>
														<InputLabel htmlFor='local-collection'>
															Local Collection
														</InputLabel>
														<OutlinedInput
															id='local-collection'
															label='Local Collection'
															type='number'
															value={
																formData.localCollection
																	? formData.localCollection
																	: ''
															}
															onChange={(e) => {
																setFormData(
																	(prev) => ({
																		...prev,
																		localCollection:
																			+e
																				.target
																				.value as number,
																	})
																);
															}}
															startAdornment={
																<AddCircleOutline />
															}
														/>
													</FormControl>
												</div>
												<div
													data-component='hire-slip'
													className='columns-5'
												>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
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
																setFormData(
																	(prev) => ({
																		...prev,
																		doorDelivery:
																			+e
																				.target
																				.value as number,
																	})
																);
															}}
															startAdornment={
																<AddCircleOutline />
															}
														/>
													</FormControl>
												</div>
												<div
													data-component='hire-slip'
													className='columns-5'
												>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
													>
														<InputLabel htmlFor='other-1'>
															Other 1
														</InputLabel>
														<OutlinedInput
															id='other-1'
															label='Other 1'
															type='number'
															value={
																formData.other1
																	? formData.other1
																	: ''
															}
															onChange={(e) => {
																setFormData(
																	(prev) => ({
																		...prev,
																		other1: +e
																			.target
																			.value as number,
																	})
																);
															}}
															startAdornment={
																<AddCircleOutline />
															}
														/>
													</FormControl>
												</div>
											</div>
											<div
												data-component='hire-slip'
												className='container'
											>
												<div
													data-component='hire-slip'
													className='columns-5'
												>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
													>
														<InputLabel htmlFor='advance'>
															Advance
														</InputLabel>
														<OutlinedInput
															id='advance'
															label='Advance'
															type='number'
															value={
																formData.advance
																	? formData.advance
																	: ''
															}
															onChange={(e) => {
																setFormData(
																	(prev) => ({
																		...prev,
																		advance:
																			+e
																				.target
																				.value as number,
																	})
																);
															}}
															startAdornment={
																<RemoveCircleOutline />
															}
														/>
													</FormControl>
												</div>
												<div
													data-component='hire-slip'
													className='columns-5'
												>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
													>
														<InputLabel htmlFor='refund'>
															Refund/Claim
														</InputLabel>
														<OutlinedInput
															id='refund'
															label='Refund/Claim'
															type='number'
															value={
																formData.refund
																	? formData.refund
																	: ''
															}
															onChange={(e) => {
																setFormData(
																	(prev) => ({
																		...prev,
																		refund: +e
																			.target
																			.value as number,
																	})
																);
															}}
															startAdornment={
																<RemoveCircleOutline />
															}
														/>
													</FormControl>
												</div>
												<div
													data-component='hire-slip'
													className='columns-5'
												>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
													>
														<InputLabel htmlFor='delayed-charges'>
															Delayed Charges
														</InputLabel>
														<OutlinedInput
															id='delayed-charges'
															label='Delayed Charges'
															type='number'
															value={
																formData.delayedCharges
																	? formData.delayedCharges
																	: ''
															}
															onChange={(e) => {
																setFormData(
																	(prev) => ({
																		...prev,
																		delayedCharges:
																			+e
																				.target
																				.value as number,
																	})
																);
															}}
															startAdornment={
																<RemoveCircleOutline />
															}
														/>
													</FormControl>
												</div>
												<div
													data-component='hire-slip'
													className='columns-5'
												>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
													>
														<InputLabel htmlFor='other-2'>
															Other 2
														</InputLabel>
														<OutlinedInput
															id='other-2'
															label='Other 2'
															type='number'
															value={
																formData.other2
																	? formData.other2
																	: ''
															}
															onChange={(e) => {
																setFormData(
																	(prev) => ({
																		...prev,
																		other2: +e
																			.target
																			.value as number,
																	})
																);
															}}
															startAdornment={
																<RemoveCircleOutline />
															}
														/>
													</FormControl>
												</div>
												<div
													data-component='hire-slip'
													className='columns-5'
												>
													<FormControl
														size='small'
														variant='outlined'
														fullWidth
														focused={false}
													>
														<InputLabel htmlFor='balance-hire'>
															Balance Hire
														</InputLabel>
														<OutlinedInput
															id='balance-hire'
															label='Balance Hire'
															type='number'
															value={
																formData.balanceHire
																	? formData.balanceHire
																	: ''
															}
															contentEditable={
																false
															}
														/>
													</FormControl>
												</div>
											</div>
											<FormControl
												size='small'
												variant='outlined'
												fullWidth
											>
												<InputLabel htmlFor='remark'>
													Remark
												</InputLabel>
												<OutlinedInput
													multiline
													id='remark'
													label='Remark'
													type='text'
													value={
														formData.remark
															? formData.remark
															: ''
													}
													onChange={(e) => {
														setFormData((prev) => ({
															...prev,
															remark: e.target
																.value,
														}));
													}}
												/>
											</FormControl>
										</div>
									</div>
								</div>
							</div>
							<div
								data-component='hire-slip'
								className='buttons-container'
							>
								<Button
									onClick={() => {
										navigate(-1 as To, { replace: true });
									}}
								>
									Back
								</Button>
								{!isFormEditMode ? (
									<>
										<LoadingButton
											variant='contained'
											color='primary'
											onClick={handleCreateHireSlip}
											loading={isFormLoading}
										>
											Save
										</LoadingButton>
										<LoadingButton
											variant='contained'
											color='primary'
											onClick={submitAndPrint}
											loading={isFormLoading}
										>
											Save & Print
										</LoadingButton>
									</>
								) : (
									<LoadingButton
										color='primary'
										onClick={handlPrintHireSlipprint}
									>
										Print
									</LoadingButton>
								)}
							</div>
						</>
					)}
				</div>
			</div>
			{location.state &&
				company &&
				regions &&
				deliveryBranches &&
				bookingBranches && (
					<div
						data-component='hire-slip'
						className='pdf-container'
					>
						<div
							data-component='hire-slip'
							className='page'
							id='hire-slip-print'
						>
							<div data-component="hire-slip" className="head-container">
							<div
								data-component='hire-slip'
								className='logo-container'
							>
								<img
									data-component='hire-slip'
									className='logo'
									src={Logo}
								/>
							</div>
							<div
								data-component='hire-slip'
								className='headline title-large'
							>
								{company?.companyName
									? company?.companyName
									: '--'}
								<div
									data-component='hire-slip'
									className='body-small'
									style={{
										margin: '8px 0 8px 0',
									}}
								>
									{userBranchDetails?.address
										? userBranchDetails?.address
										: '--'}
								</div>
								<div
									data-component='hire-slip'
									className='body-small'
								>
									Phone No.:{' '}
									{userBranchDetails?.phone
										? userBranchDetails?.phone
										: '--'}
								</div>
							</div>
							</div>
							<div
								data-component='hire-slip'
								className='text body-small'
							>
								LORRY HIRE PAYMENT VOUCHER
							</div>
							<div
								data-component='hire-slip'
								className='top-section'
							>
								<div
									data-component='hire-slip'
									className='container'
								>
									<div
										data-component='hire-slip'
										className='columns-3'
									>
										<div
											data-component='hire-slip'
											className='value-container'
										>
											<div
												data-component='hire-slip'
												className='label body-medium'
											>
												Hire Slip No.:
											</div>
											<div
												data-component='hire-slip'
												className='value body-medium'
											>
												{location.state.loadingMemo
													.ldmNo
													? location.state.loadingMemo
															.ldmNo
													: '--'}
											</div>
										</div>
									</div>
									<div
										data-component='hire-slip'
										className='columns-3'
									>
										<div
											data-component='hire-slip'
											className='value-container'
										>
											<div
												data-component='hire-slip'
												className='label body-medium'
											>
												Date:
											</div>
											<div
												data-component='hire-slip'
												className='value body-medium'
											>
												{location.state.loadingMemo
													.ldmDate
													? format(
															location.state
																.loadingMemo
																.ldmDate,
															'dd-MM-yyyy'
													  )
													: '--'}
											</div>
										</div>
									</div>
									<div
										data-component='hire-slip'
										className='columns-3'
									>
										<div
											data-component='hire-slip'
											className='value-container'
										>
											<div
												data-component='hire-slip'
												className='label body-medium'
											>
												Truck Number:
											</div>
											<div
												data-component='hire-slip'
												className='value body-medium'
											>
												{location.state.loadingMemo
													.truckNo
													? location.state.loadingMemo
															.truckNo
													: '--'}
											</div>
										</div>
									</div>
								</div>
								<div
									data-component='hire-slip'
									className='container'
								>
									<div
										data-component='hire-slip'
										className='columns-3'
									>
										<div
											data-component='hire-slip'
											className='value-container'
										>
											<div
												data-component='hire-slip'
												className='label body-medium'
											>
												From:
											</div>
											<div
												data-component='hire-slip'
												className='value body-medium'
											>
												{location.state.loadingMemo
													.fromStationId
													? findObjectInArray(
															[
																...deliveryBranches,
																...bookingBranches,
															],
															'branchId',
															location.state
																.loadingMemo
																.fromStationId
													  ).name
													: '--'}
											</div>
										</div>
									</div>
									<div
										data-component='hire-slip'
										className='columns-3'
									>
										<div
											data-component='hire-slip'
											className='value-container'
										>
											<div
												data-component='hire-slip'
												className='label body-medium'
											>
												To:
											</div>
											<div
												data-component='hire-slip'
												className='value body-medium'
											>
												{location.state.loadingMemo
													.toStationId
													? findObjectInArray(
															[
																...deliveryBranches,
																...bookingBranches,
															],
															'branchId',
															location.state
																.loadingMemo
																.toStationId
													  ).name
													: '--'}
											</div>
										</div>
									</div>
									<div
										data-component='hire-slip'
										className='columns-3'
									></div>
								</div>
							</div>
							<div
								data-component='hire-slip'
								className='middle-section'
								style={{
									marginTop: '24px',
								}}
							>
								<div
									data-component='hire-slip'
									className='container'
								>
									<div
										data-component='hire-slip'
										className='columns-2'
									>
										<div
											data-component='hire-slip'
											className='container total-table-row'
											style={{
												backgroundColor: '#0000000d',
											}}
										>
											<div
												data-component='hire-slip'
												className='columns-2'
											>
												<div
													data-component='hire-slip'
													className='label body-medium'
												>
													Boli Weight:
												</div>
											</div>
											<div
												data-component='hire-slip'
												className='columns-2'
											>
												<div
													data-component='hire-slip'
													className='value body-medium align-right'
												>
													{formData.boliWeight
														? `${(+formData.boliWeight).toFixed(
																2
														  )}`
														: '0'}
												</div>
											</div>
										</div>
										<div
											data-component='hire-slip'
											className='container total-table-row'
											style={{
												backgroundColor: '#0000000d',
											}}
										>
											<div
												data-component='hire-slip'
												className='columns-2'
											>
												<div
													data-component='hire-slip'
													className='label body-medium'
												>
													Rate Per Metric Tone:
												</div>
											</div>
											<div
												data-component='hire-slip'
												className='columns-2'
											>
												<div
													data-component='hire-slip'
													className='value body-medium align-right'
												>
													{formData.ratePMT
														? `${(+formData.ratePMT).toFixed(
																2
														  )}`
														: '0'}
												</div>
											</div>
										</div>
										{formData.lorryHire ? (
											<div
												data-component='hire-slip'
												className='container total-table-row'
											>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='label body-medium'
													>
														Lorry Hire:
													</div>
												</div>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='value body-medium align-right'
													>
														{formData.lorryHire
															? `+${(+formData.lorryHire).toFixed(
																	2
															  )}`
															: '0'}
													</div>
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.halting ? (
											<div
												data-component='hire-slip'
												className='container total-table-row'
											>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='label body-medium'
													>
														Halting:
													</div>
												</div>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='value body-medium align-right'
													>
														{formData.halting
															? `+${(+formData.halting).toFixed(
																	2
															  )}`
															: '0'}
													</div>
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.overWeight ? (
											<div
												data-component='hire-slip'
												className='container total-table-row'
											>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='label body-medium'
													>
														Over Weight:
													</div>
												</div>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='value body-medium align-right'
													>
														{formData.overWeight
															? `+${(+formData.overWeight).toFixed(
																	2
															  )}`
															: '0'}
													</div>
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.overHeight ? (
											<div
												data-component='hire-slip'
												className='container total-table-row'
											>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='label body-medium'
													>
														Over Height:
													</div>
												</div>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='value body-medium align-right'
													>
														{formData.overHeight
															? `+${(+formData.overHeight).toFixed(
																	2
															  )}`
															: '0'}
													</div>
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.overLength ? (
											<div
												data-component='hire-slip'
												className='container total-table-row'
											>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='label body-medium'
													>
														Over Length:
													</div>
												</div>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='value body-medium align-right'
													>
														{formData.overLength
															? `+${(+formData.overLength).toFixed(
																	2
															  )}`
															: '0'}
													</div>
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.localCollection ? (
											<div
												data-component='hire-slip'
												className='container total-table-row'
											>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='label body-medium'
													>
														Local Collection:
													</div>
												</div>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='value body-medium align-right'
													>
														{formData.localCollection
															? `+${(+formData.localCollection).toFixed(
																	2
															  )}`
															: '0'}
													</div>
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.doorDelivery ? (
											<div
												data-component='hire-slip'
												className='container total-table-row'
											>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='label body-medium'
													>
														Door Delivery:
													</div>
												</div>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='value body-medium align-right'
													>
														{formData.doorDelivery
															? `+${(+formData.doorDelivery).toFixed(
																	2
															  )}`
															: '0'}
													</div>
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.other1 ? (
											<div
												data-component='hire-slip'
												className='container total-table-row'
											>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='label body-medium'
													>
														Other 1:
													</div>
												</div>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='value body-medium align-right'
													>
														{formData.other1
															? `+${(+formData.other1).toFixed(
																	2
															  )}`
															: '0'}
													</div>
												</div>
											</div>
										) : (
											<></>
										)}
									</div>
									<div
										data-component='hire-slip'
										className='columns-2'
									>
										{formData.advance ? (
											<div
												data-component='hire-slip'
												className='container total-table-row'
											>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='label body-medium'
													>
														Advance:
													</div>
												</div>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='value body-medium align-right'
													>
														{formData.advance
															? `-${(+formData.advance).toFixed(
																	2
															  )}`
															: '0'}
													</div>
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.refund ? (
											<div
												data-component='hire-slip'
												className='container total-table-row'
											>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='label body-medium'
													>
														Refund/Claim:
													</div>
												</div>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='value body-medium align-right'
													>
														{formData.refund
															? `-${(+formData.refund).toFixed(
																	2
															  )}`
															: '0'}
													</div>
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.delayedCharges ? (
											<div
												data-component='hire-slip'
												className='container total-table-row'
											>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='label body-medium'
													>
														Delayed Charge:
													</div>
												</div>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='value body-medium align-right'
													>
														{formData.delayedCharges
															? `-${(+formData.delayedCharges).toFixed(
																	2
															  )}`
															: '0'}
													</div>
												</div>
											</div>
										) : (
											<></>
										)}
										{formData.other2 ? (
											<div
												data-component='hire-slip'
												className='container total-table-row'
											>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='label body-medium'
													>
														Other 2:
													</div>
												</div>
												<div
													data-component='hire-slip'
													className='columns-2'
												>
													<div
														data-component='hire-slip'
														className='value body-medium align-right'
													>
														{formData.other2
															? `-${(+formData.other2).toFixed(
																	2
															  )}`
															: '0'}
													</div>
												</div>
											</div>
										) : (
											<></>
										)}
									</div>
								</div>
							</div>
							<div
								data-component='hire-slip'
								className='container row-total'
							>
								<div
									data-component='hire-slip'
									className='columns-2'
								>
									<div
										data-component='hire-slip'
										className='container'
									>
										<div
											data-component='hire-slip'
											className='columns-2'
										>
											<div
												data-component='hire-slip'
												className='label body-small'
											>
												Total Hire:
											</div>
										</div>
										<div
											data-component='hire-slip'
											className='columns-2'
										>
											<div
												data-component='hire-slip'
												className='value body-small align-right'
											>
												{valueToPlus
													? valueToPlus.toFixed(2)
													: '0'}
											</div>
										</div>
									</div>
								</div>
								<div
									data-component='hire-slip'
									className='columns-2'
								>
									<div
										data-component='hire-slip'
										className='container'
									>
										<div
											data-component='hire-slip'
											className='columns-2'
										>
											<div
												data-component='hire-slip'
												className='label body-small'
											>
												Less Hire:
											</div>
										</div>
										<div
											data-component='hire-slip'
											className='columns-2'
										>
											<div
												data-component='hire-slip'
												className='value body-small align-right'
											>
												{valueToMinus
													? valueToMinus.toFixed(2)
													: '0'}
											</div>
										</div>
									</div>
								</div>
							</div>

							<div
								data-component='hire-slip'
								className='total-box'
							>
								<div
									data-component='hire-slip'
									className='container'
								>
									<div
										data-component='hire-slip'
										className='columns-2'
									>
										<div
											data-component='hire-slip'
											className='label body-small'
										>
											Total Hire:
										</div>
									</div>
									<div
										data-component='hire-slip'
										className='columns-2'
									>
										<div
											data-component='hire-slip'
											className='value body-small align-right'
										>
											{valueToPlus
												? valueToPlus.toFixed(2)
												: '0'}
										</div>
									</div>
								</div>
								<div
									data-component='hire-slip'
									className='container'
								>
									<div
										data-component='hire-slip'
										className='columns-2'
									>
										<div
											data-component='hire-slip'
											className='label body-small'
										>
											Less Hire:
										</div>
									</div>
									<div
										data-component='hire-slip'
										className='columns-2'
									>
										<div
											data-component='hire-slip'
											className='value body-small align-right'
										>
											{valueToMinus
												? valueToMinus.toFixed(2)
												: '0'}
										</div>
									</div>
								</div>
								<div
									data-component='hire-slip'
									className='container'
								>
									<div
										data-component='hire-slip'
										className='columns-2'
									>
										<div
											data-component='hire-slip'
											className='label body-small'
										>
											Balance Hire:
										</div>
									</div>
									<div
										data-component='hire-slip'
										className='columns-2'
									>
										<div
											data-component='hire-slip'
											className='value body-small align-right'
										>
											{formData.balanceHire
												? `${(+formData.balanceHire).toFixed(
														2
												  )}`
												: '0'}
										</div>
									</div>
								</div>
							</div>
							<div
								data-component='hire-slip'
								className='middle-section'
							>
								<div
									data-component='hire-slip'
									className='container'
								>
									<div
										data-component='hire-slip'
										className='columns-6'
									>
										<div
											data-component='hire-slip'
											className='label body-small'
										>
											Balance Hire:
										</div>
									</div>
									<div
										data-component='hire-slip'
										className='columns-1'
									>
										<div
											data-component='hire-slip'
											className='value body-small'
										>
											{formData.balanceHire
												? convertToWords(
														+formData.balanceHire
												  ).toLocaleUpperCase()
												: '0'}
										</div>
									</div>
								</div>
							</div>

							<div
								data-component='hire-slip'
								className='middle-section'
								style={{
									padding: '8px 0',
									borderTop: '1px solid black',
									margin: '8px 0 0 0',
								}}
							>
								<div
									data-component='hire-slip'
									className='container'
								>
									<div
										data-component='hire-slip'
										className='columns-6'
									>
										<div
											data-component='hire-slip'
											className='label body-small'
										>
											Remark:
										</div>
									</div>
									<div
										data-component='hire-slip'
										className='columns-1'
									>
										<div
											data-component='hire-slip'
											className='value body-small'
										>
											{formData.remark
												? formData.remark
												: '--'}
										</div>
									</div>
								</div>
							</div>
							<div
								data-component='hire-slip'
								className='top-section'
								style={{
									borderTop: '1px solid black',
								}}
							>
								<div
									data-component='hire-slip'
									className='container'
									style={{
										borderBottom: '1px solid black',
									}}
								>
									<div
										data-component='hire-slip'
										className='columns-4'
									>
										<div
											data-component='hire-slip'
											className='label body-medium align-center'
										>
											Total LR
										</div>
									</div>
									<div
										data-component='hire-slip'
										className='columns-4'
									>
										<div
											data-component='hire-slip'
											className='label body-medium align-center'
										>
											Total Article
										</div>
									</div>
									<div
										data-component='hire-slip'
										className='columns-4'
									>
										<div
											data-component='hire-slip'
											className='label body-medium align-center'
										>
											Total Actual Weight
										</div>
									</div>
									<div
										data-component='hire-slip'
										className='columns-4'
									>
										<div
											data-component='hire-slip'
											className='label body-medium align-center'
										>
											Total Charge Weight
										</div>
									</div>
								</div>
								<div
									data-component='hire-slip'
									className='container'
								>
									<div
										data-component='hire-slip'
										className='columns-4'
									>
										<div
											data-component='hire-slip'
											className='value body-medium align-center'
										>
											{location.state.loadingMemo.totalLr
												? location.state.loadingMemo
														.totalLr
												: '--'}
										</div>
									</div>
									<div
										data-component='hire-slip'
										className='columns-4'
									>
										<div
											data-component='hire-slip'
											className='value body-medium align-center'
										>
											{location.state.loadingMemo
												.totalArticle
												? location.state.loadingMemo
														.totalArticle
												: '--'}
										</div>
									</div>
									<div
										data-component='hire-slip'
										className='columns-4'
									>
										<div
											data-component='hire-slip'
											className='value body-medium align-center'
										>
											{location.state.loadingMemo
												.totalWeight
												? location.state.loadingMemo
														.totalWeight
												: '--'}
										</div>
									</div>
									<div
										data-component='hire-slip'
										className='columns-4'
									>
										<div
											data-component='hire-slip'
											className='value body-medium align-center'
										>
											{location.state.loadingMemo
												.totalChargeWeight
												? location.state.loadingMemo
														.totalChargeWeight
												: '--'}
										</div>
									</div>
								</div>
							</div>
							<div
								data-component='hire-slip'
								className='top-section'
							>
								<div
									data-component='hire-slip'
									className='value-container'
								>
									<div
										data-component='hire-slip'
										className='label body-small'
									>
										Party Name:
									</div>
									<div
										data-component='hire-slip'
										className='value body-small'
									>
										{formData.partyName
											? formData.partyName
											: '--'}
									</div>
								</div>
								<div
									data-component='hire-slip'
									className='value-container'
								>
									<div
										data-component='hire-slip'
										className='label body-small'
									>
										Bank Name:
									</div>
									<div
										data-component='hire-slip'
										className='value body-small'
									>
										{formData.bankName
											? formData.bankName
											: '--'}
									</div>
								</div>

								<div
									data-component='hire-slip'
									className='value-container'
								>
									<div
										data-component='hire-slip'
										className='label body-small'
									>
										Account Number:
									</div>
									<div
										data-component='hire-slip'
										className='value body-small'
									>
										{formData.accountNo
											? formData.accountNo
											: '--'}
									</div>
								</div>
								<div
									data-component='hire-slip'
									className='value-container'
								>
									<div
										data-component='hire-slip'
										className='label body-small'
									>
										IFSC Code:
									</div>
									<div
										data-component='hire-slip'
										className='value body-small'
									>
										{formData.ifscCode
											? formData.ifscCode
											: '--'}
									</div>
								</div>
								<div
									data-component='hire-slip'
									className='value-container'
								>
									<div
										data-component='hire-slip'
										className='label body-small'
									>
										Bank Branch Name:
									</div>
									<div
										data-component='hire-slip'
										className='value body-small'
									>
										{formData.bankBranchName
											? formData.bankBranchName
											: '--'}
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

			<Alert
				{...alertDialog}
				onClose={handleCloseAlertDialog}
			/>
		</>
	);
});

// -------------------------------------------------------------------------------------------

export default HireSlip;

// -------------------------------------------------------------------------------------------
