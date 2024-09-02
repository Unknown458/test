// -------------------------------------------------------------------------------------------

import './LoadingMemo.scss';

import { format } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import Decimal from 'decimal.js';
import {
	MaterialReactTable,
	MRT_ColumnDef,
	MRT_RowSelectionState,
	useMaterialReactTable,
} from 'material-react-table';
import QRCode from 'qrcode';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Search } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
	Button,
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
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import masterGstErrorCodes from '../../../app/masterGstErrorCodes';
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
import { ArticleShapeInterface } from '../../../services/articleShape/articleShape.types';
import {
	getBookingByLDMNoAsync,
	getBookingsForLoadingMemoAsync,
} from '../../../services/booking/booking';
import { BookingInterface } from '../../../services/booking/booking.types';
import { getBranchByIdAsync } from '../../../services/branch/branch';
import {
	BranchInterface,
	RegionInterface,
	StateInterface,
} from '../../../services/branch/branch.types';
import { CompanyInterface } from '../../../services/company/company.types';
import {
	generateConsolidatedEwaybill,
	getConsolidatedEwaybill,
} from '../../../services/gst/gst';
import {
	createLoadingMemoAsync,
	getLoadingMemoByLDMNoAsync,
	getNextLDMNoAsync,
	updateLoadingMemoAsync,
} from '../../../services/loadingMemo/loadingMemo';
import { LoadingMemoInterface } from '../../../services/loadingMemo/loadingMemo.types';
import { PaymentTypeInterface } from '../../../services/party/party.types';
import { UserInterface } from '../../../services/user/user.types';
import addIndex from '../../../utils/addIndex';
import findObjectInArray from '../../../utils/findObjectInArray';
import { printMultiplePDF } from '../../../utils/printPDF';
import { divideArrayIntoChunks } from '../../../utils/splitArray';
import trimWords from '../../../utils/trimWords';

// -------------------------------------------------------------------------------------------

const defaultForm = {
	ldmNo: 0,
	ldmDate: new Date().toISOString(),
	regionId: '',
	fromStationId: 0,
	toStationId: 0,
	truckNo: '',
	driverName: '',
	driverContactNo: '',
	brokerName: '',
	brokerContactNo: '',
	userId: 0,
	bookingIds: '',
	gdmUnloadBy: 0,
	consolidateEWayBillNo: '',
};

const defaultFormErrors = {
	ldmNo: '',
	regionId: '',
	toStationId: '',
	truckNo: '',
	driverName: '',
	driverContactNo: '',
	bookingIds: '',
	brokerContactNo: '',
};

const defaultTotalValues = {
	article: 0,
	weight: 0,
	chargeWeight: 0,
	toPay: 0,
	paid: 0,
	tbb: 0,
	total: 0,
};

// -------------------------------------------------------------------------------------------

const LoadingMemo = memo(() => {
	const { setTitle } = useApp();
	const navigate = useNavigate();
	const { handleLogout } = useAuth();
	const {
		getRegions,
		getUserDetails,
		getAllActiveBookingBranches,
		getAllActiveDeliveryBranches,
		getPaymentTypes,
		getArticleShapes,
		getCompanyDetailsById,
		getStates,
	} = useApi();

	const [formData, setFormData] = useState<LoadingMemoInterface>(defaultForm);
	const [formErrors, setFormErrors] = useState(defaultFormErrors);

	const [regions, _setRegions] = useState<RegionInterface[]>([]);
	const [articleShapes, _setArticleShapes] = useState<
		ArticleShapeInterface[]
	>([]);
	const [paymentType, _setPaymentType] = useState<PaymentTypeInterface[]>([]);
	const [user, _setUser] = useState<UserInterface>();
	const [bookingBranches, _setBookingBranches] = useState<BranchInterface[]>(
		[]
	);
	const [deliveryBranches, _setDeliveryBranches] = useState<
		BranchInterface[]
	>([]);
	const [filteredDeliveryBranches, setFilteredDeliveryBranches] = useState<
		BranchInterface[]
	>([]);
	const [bookings, setBookings] = useState<BookingInterface[]>([]);
	const [_bookingsSortedByToStation, setBookingsSortedByToStation] = useState<
		BookingInterface[][]
	>([]);
	const [userBranchDetails, setUserBranchDetails] =
		useState<BranchInterface>();
	const [alertDialog, setAlertDialog] = useState<AlertInterface>({
		state: 'success',
		label: '',
		isActive: false,
	});
	const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});
	const [selectedBookings, setSelectedBookings] = useState<
		BookingInterface[]
	>([]);
	const [totalValues, setTotalValues] = useState(defaultTotalValues);
	const [selectedValues, setSelectedValues] = useState(defaultTotalValues);
	const [fallbackState, setFallbackState] =
		useState<FallbackStateType>('not-found');
	const [isFormEditMode, setIsFormEditMode] = useState(false);
	const [isFormDisabled, setIsFormDisabled] = useState(false);
	const [isMemoUnloaded, setIsMemoUnloaded] = useState(false);
	const [loadingMemo, setLoadingMemo] = useState<LoadingMemoInterface>();
	const [company, _setCompany] = useState<CompanyInterface>();

	const [ldmBookings, setLdmBookings] = useState<BookingInterface[][]>([]);
	const [transitReport, setTransitReport] = useState<BookingInterface[][]>(
		[]
	);
	const transitReportSummaryRowHeight = useRef<
		{
			rowHeight: number;
			boookings: BookingInterface[];
		}[]
	>([]);
	const [
		transitReportRemainingBookingsSummary,
		setTransitReportRemainingBookingsSummary,
	] = useState<BookingInterface[][][]>([]);

	const [gdmBookings, setGdmBookings] = useState<BookingInterface[][]>([]);
	const gdmSummaryRowHeight = useRef<
		{
			rowHeight: number;
			boookings: BookingInterface[];
		}[]
	>([]);
	const [gdmRemainingBookingsSummary, setGdmRemainingBookingsSummary] =
		useState<BookingInterface[][][]>([]);

	const [cEwayBillPrint, setCEwayBillPrint] = useState<any>([]);
	const [selectedRegions, setSelectedRegions] = useState<number[]>([]);
	const [states, setStates] = useState<StateInterface[]>([]);
	const [isCEwayBillLoading, setIsCEwayBillLoading] =
		useState<boolean>(false);

	const [passToHireSleepScreen, setPassToHireSleepScreen] = useState({
		totalWeight: 0,
		totalChargeWeight: 0,
		totalLr: 0,
		totalArticle: 0,
	});

	const [searchedLDM, setSearchedLDM] = useState<string>('');

	useEffect(() => {
		setTitle('Loading Memo');
		initialFetch();
	}, [setTitle]);

	useEffect(() => {
		const rowHeights = gdmSummaryRowHeight.current;
		let gdmSummaryContainer = document.getElementById(
			'gdm-summary-container'
		);
		const summaryRowsContainer = document.getElementById(
			'gdm-summary-rows-container'
		);

		let gdmSummaryContainerHeight = gdmSummaryContainer?.offsetHeight;
		const summaryRowsContainerHeight = summaryRowsContainer?.offsetHeight;

		if (
			rowHeights &&
			rowHeights.length !== 0 &&
			gdmSummaryContainerHeight &&
			summaryRowsContainerHeight
		) {
			gdmSummaryContainerHeight = gdmSummaryContainerHeight - 94;

			let firstPageRowContainerHeight = 0;
			const shownRows = [];
			const notShownRows = [];

			for (const row of rowHeights) {
				if (
					firstPageRowContainerHeight + row.rowHeight <=
					gdmSummaryContainerHeight
				) {
					firstPageRowContainerHeight =
						firstPageRowContainerHeight + row.rowHeight;
					shownRows.push(row);
				} else {
					notShownRows.push(row.boookings);
				}
			}

			summaryRowsContainer.style.height = `${notShownRows.length === 0
				? firstPageRowContainerHeight + 35
				: firstPageRowContainerHeight
				}px`;

			setGdmRemainingBookingsSummary(
				divideArrayIntoChunks(notShownRows, 24)
			);
		}
	}, [gdmSummaryRowHeight.current, gdmBookings]);

	useEffect(() => {
		const rowHeights = transitReportSummaryRowHeight.current;
		let transitReportContainer = document.getElementById(
			'transit-report-summary-container'
		);
		const summaryRowsContainer = document.getElementById(
			'transit-report-rows-container'
		);

		let transitReportContainerHeight = transitReportContainer?.offsetHeight;
		const summaryRowsContainerHeight = summaryRowsContainer?.offsetHeight;

		if (
			rowHeights &&
			rowHeights.length !== 0 &&
			transitReportContainerHeight &&
			summaryRowsContainerHeight
		) {
			transitReportContainerHeight = transitReportContainerHeight - 94;

			let firstPageRowContainerHeight = 0;
			const shownRows = [];
			const notShownRows = [];

			for (const row of rowHeights) {
				if (
					firstPageRowContainerHeight + row.rowHeight <=
					transitReportContainerHeight
				) {
					firstPageRowContainerHeight =
						firstPageRowContainerHeight + row.rowHeight;
					shownRows.push(row);
				} else {
					notShownRows.push(row.boookings);
				}
			}

			summaryRowsContainer.style.height = `${notShownRows.length === 0
				? firstPageRowContainerHeight + 35
				: firstPageRowContainerHeight
				}px`;

			setTransitReportRemainingBookingsSummary(
				divideArrayIntoChunks(notShownRows, 24)
			);
		}
	}, [transitReportSummaryRowHeight.current, transitReport]);

	useEffect(() => {
		if (!bookings || !selectedBookings) return;
		const selectedTotal = selectedBookings.reduce(
			(acc, booking) => {
				booking.bookingDetails.forEach((detail) => {
					let prevArticles = new Decimal(acc.totalArticle);
					let article = new Decimal(+detail.article);
					let totalArticle = +prevArticles.plus(article);
					acc.totalArticle = totalArticle;

					let prevWeight = new Decimal(acc.totalWeight);
					let weight = new Decimal(+detail.weight);
					let totalWeight = +prevWeight.plus(weight);
					acc.totalWeight = totalWeight;

					let prevChargeWeight = new Decimal(acc.totalChargeWeight);
					let chargeWeight = new Decimal(+detail.chargeWeight);
					let totalChargeWeight =
						+prevChargeWeight.plus(chargeWeight);
					acc.totalChargeWeight = totalChargeWeight;
				});

				if (booking.paymentType === 1) {
					let prevFreightToPay = new Decimal(acc.totalFreightToPay);
					let freight = new Decimal(+booking.grandTotal);
					let totalFreightToPay = +prevFreightToPay.plus(freight);
					acc.totalFreightToPay = totalFreightToPay;
				} else if (booking.paymentType === 2) {
					let prevFreightPaid = new Decimal(acc.totalFreightPaid);
					let freight = new Decimal(+booking.grandTotal);
					let totalFreightPaid = +prevFreightPaid.plus(freight);
					acc.totalFreightPaid = totalFreightPaid;
				} else if (booking.paymentType === 3) {
					let prevFreightTBB = new Decimal(acc.totalFreightTBB);
					let freight = new Decimal(+booking.grandTotal);
					let totalFreightTBB = +prevFreightTBB.plus(freight);
					acc.totalFreightTBB = totalFreightTBB;
				}
				return acc;
			},
			{
				totalArticle: 0,
				totalWeight: 0,
				totalChargeWeight: 0,
				totalFreightToPay: 0,
				totalFreightPaid: 0,
				totalFreightTBB: 0,
			}
		);

		const totals = bookings.reduce(
			(acc, booking) => {
				booking.bookingDetails.forEach((detail) => {
					let prevArticles = new Decimal(acc.totalArticle);
					let article = new Decimal(+detail.article);
					let totalArticle = +prevArticles.plus(article);
					acc.totalArticle = totalArticle;

					let prevWeight = new Decimal(acc.totalWeight);
					let weight = new Decimal(+detail.weight);
					let totalWeight = +prevWeight.plus(weight);
					acc.totalWeight = totalWeight;
				});

				if (booking.paymentType === 1) {
					let prevFreightToPay = new Decimal(acc.totalFreightToPay);
					let freight = new Decimal(+booking.grandTotal);
					let totalFreightToPay = +prevFreightToPay.plus(freight);
					acc.totalFreightToPay = totalFreightToPay;
				} else if (booking.paymentType === 2) {
					let prevFreightPaid = new Decimal(acc.totalFreightPaid);
					let freight = new Decimal(+booking.grandTotal);
					let totalFreightPaid = +prevFreightPaid.plus(freight);
					acc.totalFreightPaid = totalFreightPaid;
				} else if (booking.paymentType === 3) {
					let prevFreightTBB = new Decimal(acc.totalFreightTBB);
					let freight = new Decimal(+booking.grandTotal);
					let totalFreightTBB = +prevFreightTBB.plus(freight);
					acc.totalFreightTBB = totalFreightTBB;
				}
				return acc;
			},
			{
				totalArticle: 0,
				totalWeight: 0,
				totalFreightToPay: 0,
				totalFreightPaid: 0,
				totalFreightTBB: 0,
			}
		);

		setTotalValues((prev) => ({
			...prev,
			article: +new Decimal(totals.totalArticle).minus(
				selectedTotal.totalArticle
			),
			weight: +new Decimal(totals.totalWeight).minus(
				selectedTotal.totalWeight
			),
			toPay: +new Decimal(totals.totalFreightToPay).minus(
				selectedTotal.totalFreightToPay
			),
			paid: +new Decimal(totals.totalFreightPaid).minus(
				selectedTotal.totalFreightPaid
			),
			tbb: +new Decimal(totals.totalFreightTBB).minus(
				selectedTotal.totalFreightTBB
			),
			total: +new Decimal(
				+new Decimal(totals.totalFreightToPay).minus(
					selectedTotal.totalFreightToPay
				)
			)
				.plus(
					+new Decimal(totals.totalFreightPaid).minus(
						selectedTotal.totalFreightPaid
					)
				)
				.plus(
					+new Decimal(totals.totalFreightTBB).minus(
						selectedTotal.totalFreightTBB
					)
				),
		}));

		setSelectedValues((prev) => ({
			...prev,
			article: selectedTotal.totalArticle,
			weight: selectedTotal.totalWeight,
			chargeWeight: selectedTotal.totalChargeWeight,
			toPay: selectedTotal.totalFreightToPay,
			paid: selectedTotal.totalFreightPaid,
			tbb: selectedTotal.totalFreightTBB,
			total: +new Decimal(selectedTotal.totalFreightToPay)
				.plus(selectedTotal.totalFreightPaid)
				.plus(selectedTotal.totalFreightTBB),
		}));

		setFormData((prev) => ({
			...prev,
			totalLR: selectedBookings.length,
			article: selectedTotal.totalArticle,
			actualWeight: selectedTotal.totalWeight,
			chargeWeight: selectedTotal.totalChargeWeight,
			paid: selectedTotal.totalFreightPaid,
			toPay: selectedTotal.totalFreightToPay,
			tbb: selectedTotal.totalFreightTBB,
		}));
	}, [bookings, selectedBookings]);

	useEffect(() => {
		if (!rowSelection) return;
		const selectedBookings = Object.keys(rowSelection).map(Number);

		const filteredBookings = bookings.filter((booking) =>
			selectedBookings.includes(booking.index! - 1)
		);

		setSelectedBookings(filteredBookings);

		const bookingIds = filteredBookings
			.map((booking) => booking.bookingId)
			.join(',');

		setFormData((prev) => ({
			...prev,
			bookingIds: bookingIds,
		}));
	}, [rowSelection]);

	const initialFetch = useCallback(async () => {
		const regionsData = await getRegions();
		const userData = await getUserDetails();
		const bookingBranches = await getAllActiveBookingBranches();
		const deliveryBranches = await getAllActiveDeliveryBranches();
		const paymentTypesData = await getPaymentTypes();
		const articleShapesData = await getArticleShapes();
		const companyData = await getCompanyDetailsById();
		const statesData = await getStates();

		if (
			regionsData.length !== 0 &&
			userData &&
			deliveryBranches.length !== 0 &&
			paymentTypesData.length !== 0 &&
			articleShapesData.length !== 0 &&
			companyData
		) {
			_setRegions(regionsData);
			_setUser(userData);
			_setBookingBranches(bookingBranches);
			_setDeliveryBranches(deliveryBranches);
			_setPaymentType(paymentTypesData);
			_setArticleShapes(articleShapesData);
			_setCompany(companyData);
			setStates(statesData);

			handleGetNextLDMNoAsync(userData.branchId, formData?.toStationId);
			handleGetBranchById(userData.branchId);
		}
	}, []);

	useEffect(() => {
		if (formData.toStationId) {
			handleGetNextLDMNoAsync(user?.branchId as any, formData?.toStationId);
		}

	}, [formData.toStationId])

	useEffect(() => {
		const stringOfSelectedRegions = selectedRegions.join(',');

		setFormData((prev) => ({
			...prev,
			regionId: stringOfSelectedRegions,
		}));

		const fetchGetBookingsForLoadingMemoAsync = async () => {
			if (stringOfSelectedRegions && user) {
				const data: BookingInterface[] =
					await handleGetBookingsForLoadingMemoAsync(
						stringOfSelectedRegions,
						user?.branchId,
						false
					);

				setBookings(data);
			}
		};

		if (stringOfSelectedRegions && !isFormEditMode && user) {
			fetchGetBookingsForLoadingMemoAsync();
		}

		if (selectedRegions.length === 1) {
			if (stringOfSelectedRegions && deliveryBranches) {
				const filteredBranches = deliveryBranches
					.filter((branch) => branch.regionId === selectedRegions[0])
					.sort((a, b) => a.name.localeCompare(b.name));

				setFilteredDeliveryBranches(filteredBranches);
			}
		} else {
			if (bookingBranches && deliveryBranches && userBranchDetails) {
				const filteredBranches = [
					...bookingBranches,
					...deliveryBranches,
				]
					.filter(
						(branch) =>
							branch.branchId !== userBranchDetails.branchId
					)
					.sort((a, b) => a.name.localeCompare(b.name));

				setFilteredDeliveryBranches(filteredBranches);
			}
		}
	}, [selectedRegions]);

	const handleGenerateConsolidatedEwaybill = async (
		ldmNo: number,
		fromStationId: number,
		truckNo: string
	) => {
		setFallbackState('loading');

		const bookingByLDMNo = await handleGetBookingByLDMNoAsync(
			ldmNo,
			fromStationId
		);

		if (
			bookingByLDMNo.length === 0 &&
			!userBranchDetails &&
			states.length === 0
		) {
			setFallbackState('hidden');

			return handleOpenAlertDialog(
				'warning',
				'Something went wrong generating Consolidated E-way Bill.'
			);
		}

		const bookingsWithEwaybill = bookingByLDMNo.filter(
			(item) => item.eWayBillNumber
		);

		if (bookingsWithEwaybill.length === 0)
			return setFallbackState('hidden');

		const eWayBillNumbers = bookingsWithEwaybill.map((item) => ({
			ewbNo: +item.eWayBillNumber,
		}));

		const data = {
			fromPlace: bookingByLDMNo[0].fromBranch,
			fromState: findObjectInArray(
				states,
				'stateId',
				userBranchDetails?.stateId
			).gstStateCode,
			vehicleNo: truckNo,
			transMode: '1',
			transDocNo: '',
			transDocDate: format(new Date(), 'dd/MM/yyyy'),
			tripSheetEwbBills: eWayBillNumbers,
		};

		const response: any = await generateConsolidatedEwaybill(data);

		if (response.data.data.status_cd !== '1') {
			setFallbackState('hidden');

			const errorCode = +JSON.parse(response.data.data.error?.message)
				?.errorCodes;

			if (errorCode) {
				handleOpenAlertDialog(
					'warning',
					findObjectInArray(
						masterGstErrorCodes,
						'errorCode',
						errorCode
					).message
				);
			}
		} else {
			const consolidateEWayBillNo = `${response.data.data.data.cEwbNo}`;

			const loadingMemoData = {
				...formData,
				fromStationId: userBranchDetails?.branchId
					? userBranchDetails?.branchId
					: 0,
				userId: user?.userId ? user?.userId : 0,
				consolidateEWayBillNo: consolidateEWayBillNo,
			};

			await updateLoadingMemoAsync(loadingMemoData);

			setFallbackState('hidden');

			setLoadingMemo(() => ({
				...loadingMemoData,
				consolidateEWayBillNo: consolidateEWayBillNo,
			}));

			setFormData(() => ({
				...loadingMemoData,
				consolidateEWayBillNo: consolidateEWayBillNo,
			}));
		}
	};

	const groupBookingsByToBranchId = (bookings: BookingInterface[]) => {
		const groupedBookings: { [key: number]: any[] } = {};

		bookings.forEach((booking) => {
			const { toBranchId } = booking;

			if (!groupedBookings[toBranchId]) {
				groupedBookings[toBranchId] = [];
			}

			groupedBookings[toBranchId].push(booking);
		});

		if (bookings) {
			const groupByToBranch = (
				bookings: BookingInterface[]
			): BookingInterface[][] => {
				const groupedBookings: { [key: number]: any[] } = {};

				bookings.forEach((booking) => {
					const { toBranchId } = booking;

					if (!groupedBookings[toBranchId]) {
						groupedBookings[toBranchId] = [];
					}

					groupedBookings[toBranchId].push(booking);
				});

				const result: BookingInterface[][] =
					Object.values(groupedBookings);
				return result;
			};

			const orderByToBranch = (
				bookings: BookingInterface[][]
			): BookingInterface[][] => {
				let result = bookings.sort((a, b) =>
					a[0].toBranch
						.toUpperCase()
						.localeCompare(b[0].toBranch.toUpperCase())
				);

				return result;
			};

			const orderByLrNumber = (
				bookings: BookingInterface[][]
			): BookingInterface[][] => {
				let result = [];

				for (let i = 0; i < bookings.length; i++) {
					const thisBookings = bookings[i].sort(
						(a, b) => +a.lrNumber - +b.lrNumber
					);

					result.push(thisBookings);
				}

				return result;
			};

			const ungroupBookings = (
				bookings: BookingInterface[][]
			): BookingInterface[] => {
				let result = [];

				for (let i = 0; i < bookings.length; i++) {
					const thisBookings = bookings[i];

					for (let i = 0; i < thisBookings.length; i++) {
						const thisBooking = thisBookings[i];
						result.push(thisBooking);
					}
				}

				return result;
			};

			setLdmBookings(
				divideArrayIntoChunks(
					bookings.sort((a, b) => +a.lrNumber - +b.lrNumber),
					50
				)
			);

			setTransitReport(
				divideArrayIntoChunks(
					bookings.sort((a, b) => +a.lrNumber - +b.lrNumber),
					50
				)
			);

			setGdmBookings(
				divideArrayIntoChunks(
					ungroupBookings(
						orderByLrNumber(
							orderByToBranch(groupByToBranch(bookings))
						)
					),
					24
				)
			);

			const bookingsData = bookings.reduce(
				(acc, booking) => {
					booking.bookingDetails.forEach((detail) => {
						let preChargeWeight = new Decimal(
							acc.totalChargeWeight
						);
						let chargeWeight = new Decimal(+detail.chargeWeight);
						let totalChargeWeight =
							+preChargeWeight.plus(chargeWeight);
						acc.totalChargeWeight = totalChargeWeight;

						let prevWeight = new Decimal(acc.totalWeight);
						let weight = new Decimal(+detail.weight);
						let totalWeight = +prevWeight.plus(weight);
						acc.totalWeight = totalWeight;

						let preArticle = new Decimal(acc.totalArticle);
						let article = new Decimal(+detail.article);
						let totalArticle = +preArticle.plus(article);
						acc.totalArticle = totalArticle;
					});
					return acc;
				},
				{
					totalWeight: 0,
					totalChargeWeight: 0,
					totalArticle: 0,
				}
			);

			setPassToHireSleepScreen({
				totalArticle: bookingsData.totalArticle
					? bookingsData.totalArticle
					: 0,
				totalWeight: bookingsData.totalWeight
					? bookingsData.totalWeight
					: 0,
				totalChargeWeight: bookingsData.totalChargeWeight
					? bookingsData.totalChargeWeight
					: 0,
				totalLr: bookings.length,
			});
		}

		const result: BookingInterface[][] = Object.values(groupedBookings);
		return result;
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

	const handleGetNextLDMNoAsync = async (fromStationId: number, toStationId: number) => {
		const response = await getNextLDMNoAsync(fromStationId, toStationId);
		// alert(1);
		// console.log(response);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: any = response.data.data;
			setFormData((prev) => ({
				...prev,
				ldmNo: +data as number,
			}));
		} else {
			handleLogout();
		}
	};

	const handleGetBookingsForLoadingMemoAsync = async (
		regionId: string,
		branchId: number,
		isEditMode: boolean
	): Promise<BookingInterface[]> => {
		setFallbackState('loading');

		const response = await getBookingsForLoadingMemoAsync(
			regionId,
			branchId
		);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: any = response.data.data.reverse();
			if (data && data.length !== 0) {
				setRowSelection({});
				setFallbackState('hidden');

				return addIndex.addIndex2(data);
			} else {
				setFallbackState('not-found');
				if (!isEditMode) {
					handleOpenAlertDialog(
						'warning',
						`No bookings found for region ${getRegionNames(
							regionId
						)}.`
					);
				}
				return [];
			}
		} else {
			handleLogout();
			return [];
		}
	};

	const getMatchingIndices = (
		bookings: BookingInterface[],
		lrNumber: number
	): { [key: number]: boolean } => {
		const result: { [key: number]: boolean } = {};

		bookings.forEach((booking, index) => {
			if (booking.lrNumber === lrNumber) {
				result[index] = true;
			}
		});

		return result;
	};

	const isInRowSelection = (
		matchingIndices: { [key: number]: boolean },
		rowSelection: { [key: number]: boolean }
	): boolean => {
		for (const key in matchingIndices) {
			if (!(key in rowSelection) || !rowSelection[key]) {
				return false;
			}
		}
		return true;
	};

	const handleGetBookingByLDMNoAsync = async (
		ldmNo: number,
		fromStationId: number
	): Promise<BookingInterface[]> => {
		setIsFormEditMode(true);
		const response = await getBookingByLDMNoAsync(ldmNo, fromStationId);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: any = response.data.data.reverse();

			if (data && data.length !== 0) {
				const bookingArray = addIndex.addIndex2(data);

				// setBookings(bookingArray);
				// setBookingsSortedByToStation(
				// 	groupBookingsByToBranchId(bookingArray)
				// );
				// let selectedRows = {};
				// for (let i = 0; i < bookingArray.length; i++) {
				// 	selectedRows = {
				// 		...selectedRows,
				// 		[i]: true,
				// 	};
				// }
				// setRowSelection(selectedRows);
				setFormErrors(defaultFormErrors);
				return bookingArray;
			} else {
				handleOpenAlertDialog(
					'warning',
					`No bookings found for LDM number ${formData.ldmNo}.`
				);
				setFallbackState('not-found');
				return [];
			}
		} else {
			handleLogout();
			return [];
		}
	};

	const handleGetLoadingMemoByLDMNoAsync = async (
		ldmNo: number,
		fromStationId: number
	) => {
		setFallbackState('loading');
		setIsFormEditMode(true);
		const response = await getLoadingMemoByLDMNoAsync(ldmNo, fromStationId);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: any = response.data.data;

			if (data) {
				if (
					!data.unloadDate ||
					data.unloadDate === '0001-01-01T00:00:00'
				) {
					setIsMemoUnloaded(false);
					setLoadingMemo(data);
					setFormData(data);
					setIsFormDisabled(false);

					if (data.regionId) {
						setSelectedRegions(
							data.regionId.split(',').map((num: any) => +num)
						);
					}

					setFallbackState('loading');

					const bookingByLDMNo = await handleGetBookingByLDMNoAsync(
						data.ldmNo,
						data.fromStationId
					);

					const bookingsForLoadingMemo =
						await handleGetBookingsForLoadingMemoAsync(
							data.regionId,
							data.fromStationId,
							true
						);

					const bookingArray = addIndex.addIndex2([
						...bookingByLDMNo,
						...bookingsForLoadingMemo,
					]);

					setFallbackState('hidden');

					setBookingsSortedByToStation(
						groupBookingsByToBranchId(bookingByLDMNo)
					);

					let selectedRows = {};
					for (let i = 0; i < bookingByLDMNo.length; i++) {
						selectedRows = {
							...selectedRows,
							[i]: true,
						};
					}

					setRowSelection(selectedRows);
					setBookings(bookingArray);
				} else {
					setIsMemoUnloaded(true);
					setLoadingMemo(data);
					setFormData(data);

					setFallbackState('loading');

					const bookingByLDMNo = await handleGetBookingByLDMNoAsync(
						data.ldmNo,
						data.fromStationId
					);

					const bookingArray = addIndex.addIndex2([...bookingByLDMNo]);

					setFallbackState('hidden');

					setBookingsSortedByToStation(
						groupBookingsByToBranchId(bookingArray)
					);

					let selectedRows = {};
					for (let i = 0; i < bookingByLDMNo.length; i++) {
						selectedRows = {
							...selectedRows,
							[i]: true,
						};
					}

					setRowSelection(selectedRows);
					setBookings(bookingArray);
					setIsFormDisabled(true);
				}
			} else {
				handleOpenAlertDialog(
					'warning',
					`No Loading Memo found for LDM number ${formData.ldmNo}.`
				);
				setFallbackState('not-found');
				handleResetScreen();
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

	const handleResetScreen = () => {
		if (user?.branchId) {
			handleGetNextLDMNoAsync(user?.branchId, formData?.toStationId);
		}
		setFormData(defaultForm);
		setBookings([]);
		setSelectedBookings([]);
		setTotalValues(defaultTotalValues);
		setSelectedValues(defaultTotalValues);
		setRowSelection({});
		setFormErrors(defaultFormErrors);
		setIsFormEditMode(false);
		setFallbackState('not-found');
		setBookingsSortedByToStation([]);
		setFilteredDeliveryBranches([]);
		setIsFormDisabled(false);
		setIsMemoUnloaded(false);
		setSelectedRegions([]);

		setLdmBookings([]);
		setGdmBookings([]);
		setGdmRemainingBookingsSummary([]);
		gdmSummaryRowHeight.current = [];
		setTransitReport([]);
		setTransitReportRemainingBookingsSummary([]);
		transitReportSummaryRowHeight.current = [];
	};

	const validateLdmNo = (): boolean => {
		if (!formData?.ldmNo) {
			setFormErrors((prev) => ({
				...prev,
				ldmNo: 'LDM No. is required.',
			}));
			return false;
		} else {
			setFormErrors((prev) => ({
				...prev,
				ldmNo: '',
			}));
			return true;
		}
	};

	const validateRegionId = (): boolean => {
		if (!formData?.regionId) {
			setFormErrors((prev) => ({
				...prev,
				regionId: 'Region is required.',
			}));
			return false;
		} else {
			setFormErrors((prev) => ({
				...prev,
				regionId: '',
			}));
			return true;
		}
	};

	const validateToStationId = (): boolean => {
		if (!formData?.toStationId) {
			setFormErrors((prev) => ({
				...prev,
				toStationId: 'To Station is required.',
			}));
			return false;
		} else {
			setFormErrors((prev) => ({
				...prev,
				toStationId: '',
			}));
			return true;
		}
	};

	const validateTruckNo = (): boolean => {
		if (!formData?.truckNo) {
			setFormErrors((prev) => ({
				...prev,
				truckNo: 'Truck No. is required.',
			}));
			return false;
		} else {
			setFormErrors((prev) => ({
				...prev,
				truckNo: '',
			}));
			return true;
		}
	};

	const validateDriverName = (): boolean => {
		if (!formData?.driverName) {
			setFormErrors((prev) => ({
				...prev,
				driverName: 'Driver Name is required.',
			}));
			return false;
		} else {
			setFormErrors((prev) => ({
				...prev,
				driverName: '',
			}));
			return true;
		}
	};

	const validateDriverContactNo = (): boolean => {
		if (!formData?.driverContactNo) {
			setFormErrors((prev) => ({
				...prev,
				driverContactNo: 'Driver Contact No. is required.',
			}));
			return false;
		} else if (formData?.driverContactNo.length < 10) {
			setFormErrors((prev) => ({
				...prev,
				driverContactNo: 'Driver Contact No. is invalid.',
			}));
			return false;
		} else {
			setFormErrors((prev) => ({
				...prev,
				driverContactNo: '',
			}));
			return true;
		}
	};

	const validateBookingIds = (): boolean => {
		if (!formData?.bookingIds || formData.bookingIds.length === 0) {
			setFormErrors((prev) => ({
				...prev,
				bookingIds: 'Please select bookings.',
			}));
			handleOpenAlertDialog('warning', 'Please select bookings.');
			return false;
		} else {
			setFormErrors((prev) => ({
				...prev,
				bookingIds: '',
			}));
			return true;
		}
	};

	const validateBrokerContactNo = (): boolean => {
		if (
			formData?.brokerContactNo.length !== 0 &&
			formData?.brokerContactNo.length < 10
		) {
			setFormErrors((prev) => ({
				...prev,
				brokerContactNo: 'Broker Contact No. is invalid.',
			}));
			return false;
		} else {
			setFormErrors((prev) => ({
				...prev,
				brokerContactNo: '',
			}));
			return true;
		}
	};

	const validateForm = (): boolean => {
		const isLdmNoValid = validateLdmNo();
		const isRegionIdValid = validateRegionId();
		const isToStationIdValid = validateToStationId();
		const isTruckNoValid = validateTruckNo();
		const isDriverNameValid = validateDriverName();
		const isDriverContactNoValid = validateDriverContactNo();
		const isBookingIdsValid = validateBookingIds();
		const isBrokerContactNo = validateBrokerContactNo();

		return (
			isLdmNoValid &&
			isRegionIdValid &&
			isToStationIdValid &&
			isTruckNoValid &&
			isDriverNameValid &&
			isDriverContactNoValid &&
			isBookingIdsValid &&
			isBrokerContactNo
		);
	};

	const handleCreateLoadingMemo = async () => {
		if (!validateForm()) return;

		const data = {
			...formData,
			fromStationId: userBranchDetails?.branchId
				? userBranchDetails?.branchId
				: 0,
			userId: user?.userId ? user?.userId : 0,
		};

		setFallbackState('loading');

		const response = await createLoadingMemoAsync(data);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			if (response.data.status === 200) {
				handleOpenAlertDialog('success', 'Created new Loading Memo.');
				if (user?.branchId) {
					await handleGetLoadingMemoByLDMNoAsync(
						response.data.data,
						user?.branchId
					);
					await handleGenerateConsolidatedEwaybill(
						response.data.data,
						user?.branchId,
						data.truckNo
					);
				}
			} else {
				handleOpenAlertDialog('warning', response.data.data);
			}
		} else {
			handleLogout();
		}
	};

	const handleUpdateLoadingMemo = async () => {
		if (!validateForm()) return;

		const data = {
			...formData,
			fromStationId: userBranchDetails?.branchId
				? userBranchDetails?.branchId
				: 0,
			userId: user?.userId ? user?.userId : 0,
		};

		setFallbackState('loading');

		const response = await updateLoadingMemoAsync(data);

		setFallbackState('hidden');

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			if (response.data.status === 200) {
				handleOpenAlertDialog('success', 'Updated Loading Memo.');
				if (user?.branchId) {
					await handleGetLoadingMemoByLDMNoAsync(
						data.ldmNo,
						user?.branchId
					);
					await handleGenerateConsolidatedEwaybill(
						data.ldmNo,
						user?.branchId,
						data.truckNo
					);
				}
			} else {
				handleOpenAlertDialog('warning', response.data.data);
			}
		} else {
			handleLogout();
		}
	};

	const getRegionNames = (regionIdsString: string): string[] => {
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

	const handlPrintLDMprint = () => {
		const elements = Array.from(
			document.getElementsByClassName('ldm-print')
		) as HTMLElement[];
		printMultiplePDF(elements, 'a4');
	};

	const handlPrintGDMprint = () => {
		const elements = Array.from(
			document.getElementsByClassName('gdm-print')
		) as HTMLElement[];
		printMultiplePDF(elements, 'a4');
	};

	const handlPrintTransitReport = () => {
		const elements = Array.from(
			document.getElementsByClassName('transit-print')
		) as HTMLElement[];
		printMultiplePDF(elements, 'a4');
	};

	const handlPrintCEwayBillprint = async () => {
		setIsCEwayBillLoading(true);

		if (!formData.consolidateEWayBillNo)
			return setIsCEwayBillLoading(false);

		const response: any = await getConsolidatedEwaybill(
			+formData.consolidateEWayBillNo
		);

		if (response.data.data.status_cd !== '1') {
			const errorCode = +JSON.parse(response.data.data.error?.message)
				?.errorCodes;

			if (errorCode) {
				handleOpenAlertDialog(
					'warning',
					findObjectInArray(
						masterGstErrorCodes,
						'errorCode',
						errorCode
					).message
				);
			}

			setIsCEwayBillLoading(false);
		} else {
			const data = response.data.data.data;

			const tripSheetEwbBills = divideArrayIntoChunks(
				[...data.tripSheetEwbBills],
				25
			);

			let qr = '';
			await QRCode.toDataURL(
				JSON.stringify(data.tripSheetNo),
				function (err, code) {
					if (err) return console.log('error occurred');
					qr = code;
				}
			);

			setCEwayBillPrint(() => ({
				...data,
				tripSheetEwbBills,
				qr,
			}));

			setTimeout(() => {
				const elements = Array.from(
					document.getElementsByClassName('ceway-bill')
				) as HTMLElement[];

				printMultiplePDF(elements, 'a4');
				setIsCEwayBillLoading(false);
			}, 2000);
		}
	};

	const handleGetDescriptionString = (row: BookingInterface) => {
		let string: string = '';

		row.bookingDetails.map((detail, index) => {
			const articleShape = detail.shape;

			string =
				string +
				`${detail.goodsType} - ${articleShape
					? articleShape
					: '[Article Shape Not Specified]'
				}${index > 0 ? ', ' : ''}`;
		});

		return string;
	};

	const handleHireSlipScreen = () => {
		navigate(RouterPath.HireSlip, {
			state: {
				loadingMemo: {
					...loadingMemo,
					...passToHireSleepScreen,
				},
			},
		});
	};

	function isEmpty(obj: { [key: number]: boolean }): boolean {
		return Object.keys(obj).length === 0;
	}

	const columns = useMemo<MRT_ColumnDef<BookingInterface>[]>(
		() => [
			{
				accessorKey: 'lrNumber',
				header: 'LR No.',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				enableColumnPinning: true,
			},
			{
				accessorKey: 'bookingDate',
				header: 'Booking Date',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				accessorFn: (row) => format(row.bookingDate, 'dd-MM-yyyy'),
			},
			{
				accessorKey: 'toBranch',
				header: 'To',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				header: 'Article',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				accessorFn: (row) => {
					return row.bookingDetails.reduce(
						(sum: any, detail: any) => sum + detail.article,
						0
					);
				},
			},
			{
				accessorKey: 'privateMark',
				header: 'Private Mark',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				header: 'Goods Type',
				enableResizing: true,
				size: 80,
				maxSize: 200,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				accessorFn: (row) => handleGetDescriptionString(row),
			},
			{
				accessorKey: 'consignee',
				header: 'Consignee',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				header: 'Weight',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				accessorFn: (row) => {
					return row.bookingDetails.reduce(
						(sum: any, detail: any) => sum + detail.weight,
						0
					);
				},
			},
			{
				accessorKey: 'grandTotal',
				header: 'Total',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'fromBranch',
				header: 'From',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'paymentType',
				header: 'Payment Type',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
				accessorFn: (row) =>
					`${findObjectInArray(
						paymentType,
						'paymentTypeId',
						row.paymentType
					).paymentType
					}`,
			},
			{
				accessorKey: 'consignor',
				header: 'Consignor',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
		],
		[paymentType, bookings, articleShapes]
	);

	const table = useMaterialReactTable({
		columns,
		data: bookings,
		filterFromLeafRows: true,
		paginateExpandedRows: false,
		enableColumnResizing: true,
		enablePagination: true,
		enableRowSelection: !isFormDisabled,
		layoutMode: 'semantic',
		enableDensityToggle: false,
		enableColumnPinning: true,
		initialState: {
			pagination: { pageSize: 1000, pageIndex: 0 },
			density: 'compact',
			columnPinning: {
				left: ['mrt-row-select', 'lrNumber'],
			},
		},
		muiPaginationProps: { rowsPerPageOptions: [100, 200, 500, 1000, 2000] },
		muiTablePaperProps: {
			sx: {
				borderRadius: 'var(--shape-medium)',
				boxShadow: 'var(--elevation-extra-small)',
			},
		},
		muiTableBodyCellProps: {
			sx: { paddingTop: 0, paddingBottom: 0 },
		},
		onRowSelectionChange: setRowSelection,
		state: { rowSelection: !isFormDisabled ? rowSelection : {} },
		enableStickyHeader: true,
	});

	return (
		<>
			<div
				data-component='loading-memo'
				className='container'
			>
				<div
					data-component='loading-memo'
					className='top'
				>
					<div
						data-component='loading-memo'
						className='container'
					>
						<div
							data-component='loading-memo'
							className='columns-5'
						>
							<FormControl
								size='small'
								error={!!formErrors.regionId}
								disabled={isFormDisabled}
							>
								<InputLabel>Regions</InputLabel>
								<Select
									multiple
									value={selectedRegions}
									onChange={(event) => {
										const value = event.target
											.value as number[];

										const hasZero =
											value.find((id) => id === 0) ===
											0 && true;

										if (hasZero) {
											if (
												selectedRegions.length !==
												regions.length
											) {
												const allRegionIds =
													regions.map(
														(region) =>
															region.regionId as number
													);
												setSelectedRegions(
													allRegionIds
												);
											} else {
												setSelectedRegions([]);
											}
										} else {
											setSelectedRegions(value);
										}
									}}
									input={<OutlinedInput label='Regions' />}
									renderValue={(selected) =>
										(selected as number[])
											.map(
												(regionId) =>
													regions.find(
														(region) =>
															region.regionId ===
															regionId
													)?.region
											)
											.join(', ')
									}
								>
									<MenuItem value={0}>
										<Checkbox
											checked={
												selectedRegions.length ===
												regions.length
											}
										/>
										<ListItemText primary='All' />
									</MenuItem>
									{regions.map((region) => (
										<MenuItem
											key={region.regionId}
											value={region.regionId}
										>
											<Checkbox
												checked={
													selectedRegions.indexOf(
														region.regionId as number
													) > -1
												}
											/>
											<ListItemText
												primary={region.region}
											/>
										</MenuItem>
									))}
								</Select>
								{formErrors.regionId && (
									<FormHelperText>
										{formErrors.regionId}
									</FormHelperText>
								)}
							</FormControl>
						</div>

						<div
							data-component='loading-memo'
							className='columns-3'
						>
							<FormControl
								size='small'
								variant='outlined'
								fullWidth
								focused={false}
								disabled={isFormDisabled}
							>
								<InputLabel htmlFor='from'>From</InputLabel>
								<OutlinedInput
									id='from'
									label='From'
									value={
										userBranchDetails?.name
											? userBranchDetails?.name
											: ''
									}
									contentEditable={false}
								/>
							</FormControl>
						</div>
						<div
							data-component='loading-memo'
							className='columns-3'
						>
							<FormControl
								size='small'
								variant='outlined'
								fullWidth
								disabled={isFormDisabled}
								error={!!formErrors.toStationId}
								onBlur={validateToStationId}
							>
								<InputLabel>To</InputLabel>
								<Select
									label='To'
									value={
										formData.toStationId
											? formData.toStationId
											: ''
									}
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											toStationId: e.target
												.value as number,
										}));
									}}
								>
									{filteredDeliveryBranches.map((branch) => {
										return (
											<MenuItem
												key={`to-${branch.branchId}`}
												value={branch.branchId}
											>
												{branch.name}
											</MenuItem>
										);
									})}
								</Select>
								{formErrors.toStationId && (
									<FormHelperText>
										{formErrors.toStationId}
									</FormHelperText>
								)}
							</FormControl>
						</div>

						<div
							data-component='loading-memo'
							className='columns-5'
						>
							<div
								data-component='loading-memo'
								className='ldm-container'
							>
								<FormControl
									size='small'
									variant='outlined'
									fullWidth
									error={!!formErrors.ldmNo}
									disabled={isFormEditMode}
								>
									<InputLabel htmlFor='ldm-number'>
										LDM No.
									</InputLabel>
									<OutlinedInput
										id='ldm-number'
										label='LDM No.'
										type='number'
										value={
											formData.ldmNo ? formData.ldmNo : ''
										}
										onChange={(e) => {
											setFormData((prev) => ({
												...prev,
												ldmNo: +e.target
													.value as number,
											}));
										}}
									/>
									{formErrors.ldmNo && (
										<FormHelperText>
											{formErrors.ldmNo}
										</FormHelperText>
									)}
								</FormControl>

								<Tooltip title='Search LDM Number'>
									<IconButton
										color='primary'
										disabled={
											fallbackState === 'loading'
												? true
												: false
										}
										onClick={() => {
											if (
												validateLdmNo() &&
												user?.branchId
											) {
												handleGetLoadingMemoByLDMNoAsync(
													formData.ldmNo,
													user?.branchId
												);
											}
										}}
									>
										<Search />
									</IconButton>
								</Tooltip>
							</div>
						</div>



						<div
							data-component='loading-memo'
							className='columns-6'
						>
							<LocalizationProvider dateAdapter={AdapterDayjs}>
								<DatePicker
									label='Date'
									format='DD-MM-YYYY'
									value={
										formData.ldmDate
											? dayjs(formData.ldmDate)
											: null
									}
									onChange={(date: Dayjs | null) => {
										if (date) {
											setFormData((prev) => ({
												...prev,
												ldmDate: date.toISOString(),
											}));
										} else {
											setFormData((prev) => ({
												...prev,
												ldmDate: '',
											}));
										}
									}}
									disabled={isFormDisabled}
									slotProps={{
										field: {
											shouldRespectLeadingZeros: true,
										},
										textField: { size: 'small' },
									}}
								/>
							</LocalizationProvider>
						</div>
					</div>
					<div
						data-component='loading-memo'
						className='container'
					>
						<div
							data-component='loading-memo'
							className='columns-5'
						>
							<FormControl
								size='small'
								variant='outlined'
								fullWidth
								disabled={isFormDisabled}
								error={!!formErrors.driverName}
							>
								<InputLabel htmlFor='driver-name'>
									Driver Name
								</InputLabel>
								<OutlinedInput
									id='driver-name'
									label='Driver Name'
									type='text'
									value={
										formData.driverName
											? formData.driverName
											: ''
									}
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											driverName: e.target.value,
										}));
									}}
									onBlur={validateDriverName}
								/>
								{formErrors.driverName && (
									<FormHelperText>
										{formErrors.driverName}
									</FormHelperText>
								)}
							</FormControl>
						</div>
						<div
							data-component='loading-memo'
							className='columns-5'
						>
							<FormControl
								size='small'
								variant='outlined'
								fullWidth
								disabled={isFormDisabled}
								error={!!formErrors.driverContactNo}
							>
								<InputLabel htmlFor='driver-contact'>
									Driver Contact Number
								</InputLabel>
								<OutlinedInput
									id='driver-contact'
									label='Driver Contact Number'
									type='number'
									value={
										formData.driverContactNo
											? formData.driverContactNo
											: ''
									}
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											driverContactNo: e.target.value,
										}));
									}}
									onBlur={validateDriverContactNo}
								/>
								{formErrors.driverContactNo && (
									<FormHelperText>
										{formErrors.driverContactNo}
									</FormHelperText>
								)}
							</FormControl>
						</div>
						<div
							data-component='loading-memo'
							className='columns-5'
						>
							<FormControl
								size='small'
								variant='outlined'
								disabled={isFormDisabled}
								fullWidth
							>
								<InputLabel htmlFor='broker-name'>
									Broker Name
								</InputLabel>
								<OutlinedInput
									id='broker-name'
									label='Broker Name'
									type='text'
									value={
										formData.brokerName
											? formData.brokerName
											: ''
									}
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											brokerName: e.target.value,
										}));
									}}
								/>
							</FormControl>
						</div>
						<div
							data-component='loading-memo'
							className='columns-5'
						>
							<FormControl
								size='small'
								variant='outlined'
								disabled={isFormDisabled}
								fullWidth
								error={!!formErrors.brokerContactNo}
							>
								<InputLabel htmlFor='broker-contact-number'>
									Broker Contact Number
								</InputLabel>
								<OutlinedInput
									id='broker-contact-number'
									label='Broker Contact Number'
									type='number'
									value={
										formData.brokerContactNo
											? formData.brokerContactNo
											: ''
									}
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											brokerContactNo: e.target.value,
										}));
									}}
									onBlur={validateBrokerContactNo}
								/>
								{formErrors.brokerContactNo && (
									<FormHelperText>
										{formErrors.brokerContactNo}
									</FormHelperText>
								)}
							</FormControl>
						</div>
						<div
							data-component='loading-memo'
							className='columns-5'
						>
							<FormControl
								size='small'
								variant='outlined'
								fullWidth

								disabled={isFormDisabled}
								error={!!formErrors.truckNo}
							>
								<InputLabel htmlFor='truck-no'>
									Truck Number
								</InputLabel>
								<OutlinedInput

									id='truck-no'
									label='Truck Number'

									value={
										formData.truckNo ? formData.truckNo : ''
									}
									onBlur={validateTruckNo}
									onChange={(e) => {
										const value = e.target.value.toUpperCase();

										const regex = /^[a-zA-Z0-9]*$/;


										if (regex.test(value)) {
											setFormData((prev) => ({
												...prev,
												truckNo: value,
											}));
										}
									}}
								/>
								{formErrors.truckNo && (
									<FormHelperText>
										{formErrors.truckNo}
									</FormHelperText>
								)}
							</FormControl>
						</div>
						<div
							data-component='loading-memo'
							className='columns-5'
						>
							<FormControl
								size='small'
								variant='outlined'
								fullWidth
								disabled={true}
							>
								<InputLabel htmlFor='c-ewaybill'>
									C. E-Way Bill No.
								</InputLabel>
								<OutlinedInput
									id='c-ewaybill'
									label='C. E-Way Bill No.'
									value={
										formData.consolidateEWayBillNo
											? formData.consolidateEWayBillNo
											: ''
									}
								/>
							</FormControl>
						</div>
					</div>
				</div>
				<div
					data-component='loading-memo'
					className='bottom'
				>
					<div
						data-component='loading-memo'
						className='data-container'
					>
						<div
							data-component='loading-memo'
							className='table-container'
						>
							{fallbackState === 'not-found' ? (
								<Fallback state='not-found' />
							) : (
								<>
									{fallbackState === 'loading' ? (
										<Fallback state='loading' />
									) : (
										<>
											{isMemoUnloaded ? (
												<div
													data-component='loading-memo'
													className='imported-loading-memo-container title-medium'
												>
													Loading Memo is Imported
												</div>
											) : (
												<div
													data-component='loading-memo'
													className='container'
													style={{
														margin: '0 0 var(--space) 0',
													}}
												>
													<div
														data-component='loading-memo'
														className='columns-3'
													>
														<div
															data-component='loading-memo'
															className='ldm-container'
														>
															<FormControl
																size='small'
																variant='outlined'
																fullWidth
															>
																<InputLabel htmlFor='search-ldm'>
																	Search LR
																	No.
																</InputLabel>
																<OutlinedInput
																	id='search-ldm'
																	label='Search LR No.'
																	type='number'
																	value={
																		searchedLDM
																			? searchedLDM
																			: ''
																	}
																	onChange={(
																		e
																	) => {
																		setSearchedLDM(
																			e
																				.target
																				.value
																		);
																	}}
																/>
															</FormControl>

															<Tooltip title='Search LDM Number'>
																<IconButton
																	color='primary'
																	onClick={() => {
																		const matchingIndices =
																			getMatchingIndices(
																				bookings,
																				+searchedLDM
																			);

																		const inRowSelection =
																			isInRowSelection(
																				matchingIndices,
																				rowSelection
																			);

																		if (
																			isEmpty(
																				matchingIndices
																			)
																		) {
																			handleOpenAlertDialog(
																				'warning',
																				`${searchedLDM} LR Number not found.`
																			);
																		} else if (
																			inRowSelection
																		) {
																			handleOpenAlertDialog(
																				'warning',
																				`${searchedLDM} LR Number is already selected.`
																			);
																		} else {
																			setRowSelection(
																				(
																					prev
																				) => ({
																					...prev,
																					...matchingIndices,
																				})
																			);
																			handleOpenAlertDialog(
																				'success',
																				`Selected all LR Number ${searchedLDM}`
																			);
																			setSearchedLDM(
																				''
																			);
																		}
																	}}
																>
																	<Search />
																</IconButton>
															</Tooltip>
														</div>
													</div>
												</div>
											)}
											<MaterialReactTable table={table} />
										</>
									)}
								</>
							)}
						</div>
						<div
							data-component='loading-memo'
							className='display-container'
						>
							<div
								data-component='loading-memo'
								className='total-values'
							>
								<div
									data-component='loading-memo'
									className='title title-small'
								>
									Loaded
								</div>
								<div
									data-component='loading-memo'
									className='values-container'
								>
									<FormControl
										disabled={isFormDisabled}
										size='small'
										variant='outlined'
										fullWidth
										focused={false}
									>
										<InputLabel htmlFor='article'>
											Article
										</InputLabel>
										<OutlinedInput
											id='article'
											label='article'
											type='number'
											contentEditable={false}
											value={
												selectedValues.article
													? selectedValues.article
													: 0
											}
										/>
									</FormControl>
									<FormControl
										disabled={isFormDisabled}
										size='small'
										variant='outlined'
										fullWidth
										focused={false}
									>
										<InputLabel htmlFor='weight'>
											Weight
										</InputLabel>
										<OutlinedInput
											id='weight'
											label='Weight'
											type='number'
											contentEditable={false}
											value={
												selectedValues.weight
													? selectedValues.weight
													: 0
											}
										/>
									</FormControl>
									<FormControl
										disabled={isFormDisabled}
										size='small'
										variant='outlined'
										fullWidth
										focused={false}
									>
										<InputLabel htmlFor='to-pay'>
											To Pay
										</InputLabel>
										<OutlinedInput
											id='to-pay'
											label='To Pay'
											type='number'
											contentEditable={false}
											value={
												selectedValues.toPay
													? selectedValues.toPay
													: 0
											}
										/>
									</FormControl>
									<FormControl
										disabled={isFormDisabled}
										size='small'
										variant='outlined'
										fullWidth
										focused={false}
									>
										<InputLabel htmlFor='paid'>
											Paid
										</InputLabel>
										<OutlinedInput
											id='paid'
											label='Paid'
											type='number'
											contentEditable={false}
											value={
												selectedValues.paid
													? selectedValues.paid
													: 0
											}
										/>
									</FormControl>
									<FormControl
										disabled={isFormDisabled}
										size='small'
										variant='outlined'
										fullWidth
										focused={false}
									>
										<InputLabel htmlFor='tbb'>
											TBB
										</InputLabel>
										<OutlinedInput
											id='tbb'
											label='TBB'
											type='number'
											contentEditable={false}
											value={
												selectedValues.tbb
													? selectedValues.tbb
													: 0
											}
										/>
									</FormControl>
									<FormControl
										disabled={isFormDisabled}
										size='small'
										variant='outlined'
										fullWidth
										focused={false}
									>
										<InputLabel htmlFor='total-vasuli'>
											Total Vasuli
										</InputLabel>
										<OutlinedInput
											id='total-vasuli'
											label='Total Vasuli'
											type='number'
											contentEditable={false}
											value={
												selectedValues.total
													? selectedValues.total
													: 0
											}
										/>
									</FormControl>
								</div>
							</div>
							<div
								data-component='loading-memo'
								className='selected-values'
							>
								<div
									data-component='loading-memo'
									className='title title-small'
								>
									Stock
								</div>
								<div
									data-component='loading-memo'
									className='values-container'
								>
									<FormControl
										disabled={isFormDisabled}
										size='small'
										variant='outlined'
										fullWidth
										focused={false}
									>
										<InputLabel htmlFor='article'>
											Article
										</InputLabel>
										<OutlinedInput
											id='article'
											label='article'
											type='number'
											contentEditable={false}
											value={
												totalValues.article
													? totalValues.article
													: 0
											}
										/>
									</FormControl>
									<FormControl
										disabled={isFormDisabled}
										size='small'
										variant='outlined'
										fullWidth
										focused={false}
									>
										<InputLabel htmlFor='weight'>
											Weight
										</InputLabel>
										<OutlinedInput
											id='weight'
											label='Weight'
											type='number'
											contentEditable={false}
											value={
												totalValues.weight
													? totalValues.weight
													: 0
											}
										/>
									</FormControl>
									<FormControl
										disabled={isFormDisabled}
										size='small'
										variant='outlined'
										fullWidth
										focused={false}
									>
										<InputLabel htmlFor='to-pay'>
											To Pay
										</InputLabel>
										<OutlinedInput
											id='to-pay'
											label='To Pay'
											type='number'
											contentEditable={false}
											value={
												totalValues.toPay
													? totalValues.toPay
													: 0
											}
										/>
									</FormControl>
									<FormControl
										disabled={isFormDisabled}
										size='small'
										variant='outlined'
										fullWidth
										focused={false}
									>
										<InputLabel htmlFor='paid'>
											Paid
										</InputLabel>
										<OutlinedInput
											id='paid'
											label='Paid'
											type='number'
											contentEditable={false}
											value={
												totalValues.paid
													? totalValues.paid
													: 0
											}
										/>
									</FormControl>
									<FormControl
										disabled={isFormDisabled}
										size='small'
										variant='outlined'
										fullWidth
										focused={false}
									>
										<InputLabel htmlFor='tbb'>
											TBB
										</InputLabel>
										<OutlinedInput
											id='tbb'
											label='TBB'
											type='number'
											contentEditable={false}
											value={
												totalValues.tbb
													? totalValues.tbb
													: 0
											}
										/>
									</FormControl>
									<FormControl
										disabled={isFormDisabled}
										size='small'
										variant='outlined'
										fullWidth
										focused={false}
									>
										<InputLabel htmlFor='total-vasuli'>
											Total Vasuli
										</InputLabel>
										<OutlinedInput
											id='total-vasuli'
											label='Total Vasuli'
											type='number'
											contentEditable={false}
											value={
												totalValues.total
													? totalValues.total
													: 0
											}
										/>
									</FormControl>
								</div>
							</div>
						</div>
					</div>
					<div
						data-component='loading-memo'
						className='buttons-container'
					>
						<Button onClick={handleResetScreen}>Clear</Button>
						{!isFormEditMode ? (
							<Button
								variant='contained'
								onClick={handleCreateLoadingMemo}
								disabled={bookings.length === 0 ? true : false}
							>
								Save
							</Button>
						) : (
							<>
								<Button
									onClick={handleHireSlipScreen}
									disabled={
										!loadingMemo || !bookings ? true : false
									}
								>
									Hire Slip
								</Button>
								{formData.consolidateEWayBillNo !== '' &&
									formData.consolidateEWayBillNo !== null && (
										<LoadingButton
											disabled={
												!loadingMemo || !bookings
													? true
													: false
											}
											onClick={handlPrintCEwayBillprint}
											loading={isCEwayBillLoading}
										>
											Print Consolidate E-Way Bill
										</LoadingButton>
									)}
								<Button
									onClick={handlPrintTransitReport}
									disabled={
										!loadingMemo || !bookings ? true : false
									}
								>
									Print Transit Report
								</Button>
								<Button
									onClick={handlPrintLDMprint}
									disabled={
										!loadingMemo || !bookings ? true : false
									}
								>
									Print LDM
								</Button>
								<Button
									onClick={handlPrintGDMprint}
									disabled={
										!loadingMemo || !bookings ? true : false
									}
								>
									Print GDM
								</Button>
								<Button
									variant='contained'
									onClick={handleUpdateLoadingMemo}
									disabled={
										bookings.length === 0 || isMemoUnloaded
											? true
											: false
									}
								>
									Update
								</Button>
							</>
						)}
					</div>
				</div>
			</div>

			<Alert
				{...alertDialog}
				onClose={handleCloseAlertDialog}
			/>

			{loadingMemo &&
				bookings &&
				regions &&
				bookingBranches &&
				deliveryBranches &&
				ldmBookings &&
				userBranchDetails && (
					<div
						data-component='loading-memo'
						className='pdf-container'
						id='ldm-prints-container'
					>
						{ldmBookings.map((page, index) => {
							const pageArray = page.reverse();

							let leftSideBookings = [...pageArray].splice(0, 25);
							let rightSideBookings = [...pageArray].splice(
								25,
								50
							);

							return (
								<div
									data-component='loading-memo'
									className='page ldm-print'
									id={`ldm-print-${index}`}
								>
									<div
										data-component='loading-memo'
										className='body-small'
									>
										Page No.{index + 1}
									</div>
									<div data-component="loading-memo" className="head-container">
									<div
										data-component='loading-memo'
										className='logo-container'
									>
										<img
											data-component='loading-memo'
											className='logo'
											src={Logo}
										/>
									</div>
									<div
										data-component='loading-memo'
										className='headline title-large'
									>
										{company?.companyName
											? company?.companyName
											: '--'}
										<div
											data-component='loading-memo'
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
											data-component='loading-memo'
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
										data-component='loading-memo'
										className='text body-small'
									>
										LOADING SHEET
									</div>
									<div
										data-component='loading-memo'
										className='top-section'
									>
										<div
											data-component='loading-memo'
											className='container'
										>
											<div
												data-component='loading-memo'
												className='columns-4'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-medium'
													>
														LDM No:
													</div>
													<div
														data-component='loading-memo'
														className='value body-medium'
													>
														{loadingMemo.ldmNo
															? loadingMemo.ldmNo
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='loading-memo'
												className='columns-4'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-medium'
													>
														From:
													</div>
													<div
														data-component='loading-memo'
														className='value body-medium bold-text'
													>
														{userBranchDetails?.name
															? userBranchDetails?.name
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='loading-memo'
												className='columns-4'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-small'
													>
														To:
													</div>
													<div
														data-component='loading-memo'
														className='value body-small bold-text'
													>
														{loadingMemo.toStationId
															? findObjectInArray(
																[
																	...deliveryBranches,
																	...bookingBranches,
																],
																'branchId',
																loadingMemo.toStationId
															).name
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='loading-memo'
												className='columns-4'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-medium'
													>
														Date:
													</div>
													<div
														data-component='loading-memo'
														className='value body-medium'
													>
														{loadingMemo.ldmDate
															? format(
																loadingMemo.ldmDate,
																'dd-MM-yyyy'
															)
															: '--'}
													</div>
												</div>
											</div>
										</div>
										<div
											data-component='loading-memo'
											className='container'
										>
											<div
												data-component='loading-memo'
												className='columns-1'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-medium'
													>
														Truck No.:
													</div>
													<div
														data-component='loading-memo'
														className='value body-medium'
													>
														{loadingMemo.truckNo
															? loadingMemo.truckNo
															: '--'}
													</div>
												</div>
											</div>
										</div>
									</div>
									<div
										data-component='loading-memo'
										className='middle-section'
									>
										<div
											data-component='loading-memo'
											className='container'
										>
											<div
												data-component='loading-memo'
												className='columns-2'
											>
												<div
													data-component='loading-memo'
													className='container table-head'
												>
													<div
														data-component='loading-memo'
														className='columns-10 body-small'
													>
														Src
													</div>
													<div
														data-component='loading-memo'
														className='columns-6 body-small align-center'
													>
														LR No.
													</div>
													<div
														data-component='loading-memo'
														className='columns-10 body-small align-center'
													>
														Art.
													</div>
													<div
														data-component='loading-memo'
														className='columns-10 body-small align-center'
													>
														Wgt.
													</div>
													<div
														data-component='loading-memo'
														className='columns-4 body-small align-center'
													>
														Pvt.mrk.
													</div>
													<div
														data-component='loading-memo'
														className='columns-5 body-small align-center'
													>
														Bkg.dt.
													</div>
													<div
														data-component='loading-memo'
														className='columns-6 body-small align-center'
													>
														Desti.
													</div>
												</div>
												{leftSideBookings.map((row) => {
													return (
														<div
															data-component='loading-memo'
															className='container table-row'
														>
															<div
																data-component='loading-memo'
																className='columns-10 body-small'
															>
																{row.fromBranch
																	? trimWords(
																		row.fromBranch,
																		3
																	)
																	: '--'}
															</div>
															<div
																data-component='loading-memo'
																className='columns-6 body-small align-center'
															>
																{row.lrNumber
																	? row.lrNumber
																	: '--'}
															</div>
															<div
																data-component='loading-memo'
																className='columns-10 body-small align-center'
															>
																{row.bookingDetails
																	? row.bookingDetails.reduce(
																		(
																			sum: any,
																			detail: any
																		) =>
																			sum +
																			detail.article,
																		0
																	)
																	: '--'}
															</div>
															<div
																data-component='loading-memo'
																className='columns-10 body-small align-center'
															>
																{row.bookingDetails
																	? row.bookingDetails.reduce(
																		(
																			sum: any,
																			detail: any
																		) =>
																			sum +
																			detail.weight,
																		0
																	)
																	: '--'}
															</div>
															<div
																data-component='loading-memo'
																className='columns-4 body-small align-center'
																style={{
																	wordBreak:
																		'break-word',
																}}
															>
																{row.privateMark
																	? trimWords(
																		row.privateMark,
																		6
																	)
																	: '--'}
															</div>
															<div
																data-component='loading-memo'
																className='columns-5 label-medium align-center'
																style={{
																	fontWeight:
																		'700',
																}}
															>
																{row.bookingDate
																	? format(
																		row.bookingDate,
																		'dd-MM-yyyy'
																	)
																	: '--'}
															</div>
															<div
																data-component='loading-memo'
																className='columns-6 body-small align-center'
																style={{
																	wordBreak:
																		'break-word',
																}}
															>
																{row.toBranch
																	? trimWords(
																		row.toBranch,
																		3
																	)
																	: '--'}
															</div>
														</div>
													);
												})}
											</div>
											{rightSideBookings.length !== 0 && (
												<div
													data-component='loading-memo'
													className='columns-2'
												>
													<div
														data-component='loading-memo'
														className='container table-head'
													>
														<div
															data-component='loading-memo'
															className='columns-10 body-small'
														>
															Src
														</div>
														<div
															data-component='loading-memo'
															className='columns-6 body-small align-center'
														>
															LR No.
														</div>
														<div
															data-component='loading-memo'
															className='columns-10 body-small align-center'
														>
															Art.
														</div>
														<div
															data-component='loading-memo'
															className='columns-10 body-small align-center'
														>
															Wgt.
														</div>
														<div
															data-component='loading-memo'
															className='columns-4 body-small align-center'
														>
															Pvt.mrk.
														</div>
														<div
															data-component='loading-memo'
															className='columns-5 body-small align-center'
														>
															Bkg.dt.
														</div>
														<div
															data-component='loading-memo'
															className='columns-6 body-small align-center'
														>
															Desti.
														</div>
													</div>
													{rightSideBookings.map(
														(row) => {
															return (
																<div
																	data-component='loading-memo'
																	className='container table-row'
																>
																	<div
																		data-component='loading-memo'
																		className='columns-10 body-small'
																	>
																		{row.fromBranch
																			? trimWords(
																				row.fromBranch,
																				3
																			)
																			: '--'}
																	</div>
																	<div
																		data-component='loading-memo'
																		className='columns-6 body-small align-center'
																	>
																		{row.lrNumber
																			? row.lrNumber
																			: '--'}
																	</div>
																	<div
																		data-component='loading-memo'
																		className='columns-10 body-small align-center'
																	>
																		{row.bookingDetails
																			? row.bookingDetails.reduce(
																				(
																					sum: any,
																					detail: any
																				) =>
																					sum +
																					detail.article,
																				0
																			)
																			: '--'}
																	</div>
																	<div
																		data-component='loading-memo'
																		className='columns-10 body-small align-center'
																	>
																		{row.bookingDetails
																			? row.bookingDetails.reduce(
																				(
																					sum: any,
																					detail: any
																				) =>
																					sum +
																					detail.weight,
																				0
																			)
																			: '--'}
																	</div>
																	<div
																		data-component='loading-memo'
																		className='columns-4 body-small align-center'
																		style={{
																			wordBreak:
																				'break-word',
																		}}
																	>
																		{row.privateMark
																			? trimWords(
																				row.privateMark,
																				6
																			)
																			: '--'}
																	</div>
																	<div
																		data-component='loading-memo'
																		className='columns-5 label-medium align-center'
																		style={{
																			fontWeight:
																				'700',
																		}}
																	>
																		{row.bookingDate
																			? format(
																				row.bookingDate,
																				'dd-MM-yyyy'
																			)
																			: '--'}
																	</div>
																	<div
																		data-component='loading-memo'
																		className='columns-6 body-small align-center'
																		style={{
																			wordBreak:
																				'break-word',
																		}}
																	>
																		{row.toBranch
																			? trimWords(
																				row.toBranch,
																				3
																			)
																			: '--'}
																	</div>
																</div>
															);
														}
													)}
												</div>
											)}
										</div>

										{ldmBookings.length === index + 1 && (
											<div
												data-component='loading-memo'
												className='container table-bottom'
											>
												<div
													data-component='loading-memo'
													className='columns-4 body-medium'
												>
													Total Records:{' '}
													{bookings
														? bookings.length
														: '--'}
												</div>
												<div
													data-component='loading-memo'
													className='columns-4 body-medium'
												>
													Total Article:{' '}
													{selectedValues.article
														? selectedValues.article
														: '--'}
												</div>
												<div
													data-component='loading-memo'
													className='columns-3 body-medium'
												>
													Total Actual Weight:{' '}
													{selectedValues.weight
														? selectedValues.weight
														: '--'}
												</div>
												<div
													data-component='loading-memo'
													className='columns-3 body-medium'
												>
													Total Charge Weight:{' '}
													{selectedValues.chargeWeight
														? selectedValues.chargeWeight
														: '--'}
												</div>
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}

			{loadingMemo &&
				bookings &&
				regions &&
				bookingBranches &&
				deliveryBranches &&
				gdmBookings &&
				userBranchDetails && (
					<div
						data-component='loading-memo'
						className='pdf-container'
						id='gdm-prints-container'
					>
						{gdmBookings.map((page, index) => {
							const pageArray = page;

							let leftBookings = [...pageArray].splice(0, 12);
							let rightBookings = [...pageArray].splice(12, 24);

							const sortByToBranch = (
								bookings: BookingInterface[]
							) => {
								const groupedBookings: {
									[key: number]: any[];
								} = {};

								bookings.forEach((booking) => {
									const { toBranchId } = booking;

									if (!groupedBookings[toBranchId]) {
										groupedBookings[toBranchId] = [];
									}

									groupedBookings[toBranchId].push(booking);
								});

								const result: BookingInterface[][] =
									Object.values(groupedBookings);
								return result;
							};

							const orderByToBranch = (
								bookings: BookingInterface[][]
							): BookingInterface[][] => {
								let result = bookings.sort((a, b) =>
									a[0].toBranch
										.toUpperCase()
										.localeCompare(
											b[0].toBranch.toUpperCase()
										)
								);

								return result;
							};

							const orderByLrNumber = (
								bookings: BookingInterface[][]
							): BookingInterface[][] => {
								let result = [];

								for (let i = 0; i < bookings.length; i++) {
									const thisBookings = bookings[i].sort(
										(a, b) => +a.lrNumber - +b.lrNumber
									);

									result.push(thisBookings);
								}

								return result;
							};

							const leftSideBookings = orderByLrNumber(
								orderByToBranch(sortByToBranch(leftBookings))
							);
							const rightSideBookings = orderByLrNumber(
								orderByToBranch(sortByToBranch(rightBookings))
							);

							let usedToBranches: string[] = [];

							return (
								<div
									data-component='loading-memo'
									className='page gdm-print'
									id={`gdm-print-${index}`}
								>
									<div
										data-component='loading-memo'
										className='body-small'
									>
										Page No.{index + 1}
									</div>
									<div data-component="loading-memo" className="head-container"> 
									<div
										data-component='loading-memo'
										className='logo-container'
									>
										<img
											data-component='loading-memo'
											className='logo'
											src={Logo}
										/>
									</div>
									<div
										data-component='loading-memo'
										className='headline title-large'
									>
										{company?.companyName
											? company?.companyName
											: '--'}
										<div
											data-component='loading-memo'
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
											data-component='loading-memo'
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
										data-component='loading-memo'
										className='text body-small'
									>
										MOTOR REPORT
									</div>
									<div
										data-component='loading-memo'
										className='top-section'
									>
										<div
											data-component='loading-memo'
											className='container highlighted-row'
										>
											<div
												data-component='loading-memo'
												className='columns-3'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-small'
													>
														LDM Number:
													</div>
													<div
														data-component='loading-memo'
														className='value body-small'
													>
														{loadingMemo.ldmNo
															? loadingMemo.ldmNo
															: '--'}
													</div>
												</div>
											</div>

											<div
												data-component='loading-memo'
												className='columns-3'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-small'
													>
														From:
													</div>
													<div
														data-component='loading-memo'
														className='value body-small bold-text'
													>
														{userBranchDetails?.name
															? userBranchDetails?.name
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='loading-memo'
												className='columns-3'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-small'
													>
														To:
													</div>
													<div
														data-component='loading-memo'
														className='value body-small bold-text'
													>
														{loadingMemo.toStationId
															? findObjectInArray(
																[
																	...deliveryBranches,
																	...bookingBranches,
																],
																'branchId',
																loadingMemo.toStationId
															).name
															: '--'}
													</div>
												</div>
											</div>
										</div>
										<div
											data-component='loading-memo'
											className='container'
										>
											<div
												data-component='loading-memo'
												className='columns-3'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-medium'
													>
														Truck Number:
													</div>
													<div
														data-component='loading-memo'
														className='value body-medium'
													>
														{loadingMemo.truckNo
															? loadingMemo.truckNo
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='loading-memo'
												className='columns-3'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-medium'
													>
														Driver Name:
													</div>
													<div
														data-component='loading-memo'
														className='value body-medium'
													>
														{loadingMemo.driverName
															? loadingMemo.driverName
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='loading-memo'
												className='columns-3'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-medium'
													>
														Driver Contact No.:
													</div>
													<div
														data-component='loading-memo'
														className='value body-medium'
													>
														{loadingMemo.driverContactNo
															? loadingMemo.driverContactNo
															: '--'}
													</div>
												</div>
											</div>
										</div>
										<div
											data-component='loading-memo'
											className='container'
										>
											<div
												data-component='loading-memo'
												className='columns-3'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-medium'
													>
														Date:
													</div>
													<div
														data-component='loading-memo'
														className='value body-medium'
													>
														{loadingMemo.ldmDate
															? format(
																loadingMemo.ldmDate,
																'dd-MM-yyyy'
															)
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='loading-memo'
												className='columns-3'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-medium'
													>
														Broker Name:
													</div>
													<div
														data-component='loading-memo'
														className='value body-medium'
													>
														{loadingMemo.brokerName
															? loadingMemo.brokerName
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='loading-memo'
												className='columns-3'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-medium'
													>
														Broker Contact No.:
													</div>
													<div
														data-component='loading-memo'
														className='value body-medium'
													>
														{loadingMemo.brokerContactNo
															? loadingMemo.brokerContactNo
															: '--'}
													</div>
												</div>
											</div>
										</div>
										<div
											data-component='loading-memo'
											className='container'
										>
											<div
												data-component='loading-memo'
												className='columns-3'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-medium'
													>
														CEway Bill No.:
													</div>
													<div
														data-component='loading-memo'
														className='value body-medium'
													>
														{loadingMemo.consolidateEWayBillNo
															? loadingMemo.consolidateEWayBillNo
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='loading-memo'
												className='columns-3'
											></div>
											<div
												data-component='loading-memo'
												className='columns-3'
											></div>
										</div>
									</div>
									<div
										data-component='loading-memo'
										className='middle-section'
									>
										<div
											data-component='loading-memo'
											className='container'
										>
											<div
												data-component='loading-memo'
												className='columns-2'
											>
												<div
													data-component='loading-memo'
													className='container table-head'
												>
													<div
														data-component='loading-memo'
														className='columns-5 body-small'
													>
														From
													</div>
													<div
														data-component='loading-memo'
														className='columns-8 body-small align-center'
													>
														LR No.
													</div>
													<div
														data-component='loading-memo'
														className='columns-10 body-small align-center'
													>
														Art.
													</div>
													<div
														data-component='loading-memo'
														className='columns-3 body-small align-center'
													>
														Pvt.mrk.
													</div>
													<div
														data-component='loading-memo'
														className='columns-10 body-small align-center'
													>
														Wgt.
													</div>
													<div
														data-component='loading-memo'
														className='columns-5 body-small align-right'
													>
														Amount
													</div>
												</div>

												{leftSideBookings.map(
													(array) => {
														let totalArticleInToStation = 0;
														let totalWeightInToStation = 0;
														let totalInToStation = 0;

														const exists =
															usedToBranches.includes(
																array[0]
																	.toBranch
															);

														if (exists === false) {
															usedToBranches.push(
																array[0]
																	.toBranch
															);
														}

														return (
															<>
																{!exists && (
																	<div
																		data-component='loading-memo'
																		className='to-station-top body-small'
																	>
																		To:{' '}
																		{
																			array[0]
																				.toBranch
																		}
																	</div>
																)}
																<div
																	data-component='loading-memo'
																	className='to-station-middle body-small'
																>
																	{array.map(
																		(
																			row
																		) => {
																			let totalArticleInRow =
																				row.bookingDetails.reduce(
																					(
																						sum: any,
																						detail: any
																					) =>
																						sum +
																						detail.article,
																					0
																				);

																			let totalWeightInRow =
																				row.bookingDetails.reduce(
																					(
																						sum: any,
																						detail: any
																					) =>
																						sum +
																						detail.weight,
																					0
																				);

																			totalArticleInToStation +=
																				totalArticleInRow;

																			totalWeightInToStation +=
																				totalWeightInRow;

																			totalInToStation +=
																				row.grandTotal
																					? row.grandTotal
																					: 0;

																			return (
																				<div
																					data-component='loading-memo'
																					className='container table-row'
																				>
																					<div
																						data-component='loading-memo'
																						className='columns-5 body-small'
																						style={{
																							wordBreak:
																								'break-word',
																						}}
																					>
																						{array[0]
																							.fromBranch
																							? trimWords(
																								array[0]
																									.fromBranch,
																								5
																							)
																							: '--'}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-8 body-small align-center'
																					>
																						{row.lrNumber
																							? row.lrNumber
																							: '--'}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-10 body-small align-center'
																					>
																						{totalArticleInRow
																							? totalArticleInRow
																							: '--'}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-3 body-small align-center'
																						style={{
																							wordBreak:
																								'break-word',
																						}}
																					>
																						{row.privateMark
																							? trimWords(
																								row.privateMark,
																								6
																							)
																							: '--'}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-10 body-small align-center'
																					>
																						{totalWeightInRow
																							? totalWeightInRow
																							: '--'}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-5 body-small align-right'
																					>
																						{row.grandTotal
																							? (+row.grandTotal).toFixed(
																								2
																							)
																							: '--'}
																					</div>
																				</div>
																			);
																		}
																	)}
																</div>
																{/* <div
																	data-component='loading-memo'
																	className='to-station-bottom body-small'
																>
																	<div
																		data-component='loading-memo'
																		className='container'
																	>
																		<div
																			data-component='loading-memo'
																			className='columns-3 body-small'
																		>
																			Article:{' '}
																			{
																				totalArticleInToStation
																			}
																		</div>
																		<div
																			data-component='loading-memo'
																			className='columns-3 body-small'
																		>
																			Weight:{' '}
																			{
																				totalWeightInToStation
																			}
																		</div>
																		<div
																			data-component='loading-memo'
																			className='columns-3 body-small align-right'
																		>
																			Total:{' '}
																			{(+totalInToStation).toFixed(
																				2
																			)}
																		</div>
																	</div>
																</div> */}
															</>
														);
													}
												)}
											</div>
											{rightSideBookings.length !== 0 && (
												<div
													data-component='loading-memo'
													className='columns-2'
												>
													<div
														data-component='loading-memo'
														className='container table-head'
													>
														<div
															data-component='loading-memo'
															className='columns-5 body-small'
														>
															From
														</div>
														<div
															data-component='loading-memo'
															className='columns-8 body-small align-center'
														>
															LR No.
														</div>
														<div
															data-component='loading-memo'
															className='columns-10 body-small align-center'
														>
															Art.
														</div>
														<div
															data-component='loading-memo'
															className='columns-3 body-small align-center'
														>
															Pvt.mrk.
														</div>
														<div
															data-component='loading-memo'
															className='columns-10 body-small align-center'
														>
															Wgt.
														</div>
														<div
															data-component='loading-memo'
															className='columns-5 body-small align-right'
														>
															Amount
														</div>
													</div>

													{rightSideBookings.map(
														(array) => {
															let totalArticleInToStation = 0;
															let totalWeightInToStation = 0;
															let totalInToStation = 0;

															const exists =
																usedToBranches.includes(
																	array[0]
																		.toBranch
																);

															if (
																exists === false
															) {
																usedToBranches.push(
																	array[0]
																		.toBranch
																);
															}

															return (
																<>
																	{!exists && (
																		<div
																			data-component='loading-memo'
																			className='to-station-top body-small'
																		>
																			To:{' '}
																			{
																				array[0]
																					.toBranch
																			}
																		</div>
																	)}
																	<div
																		data-component='loading-memo'
																		className='to-station-middle body-small'
																	>
																		{array.map(
																			(
																				row
																			) => {
																				let totalArticleInRow =
																					row.bookingDetails.reduce(
																						(
																							sum: any,
																							detail: any
																						) =>
																							sum +
																							detail.article,
																						0
																					);

																				let totalWeightInRow =
																					row.bookingDetails.reduce(
																						(
																							sum: any,
																							detail: any
																						) =>
																							sum +
																							detail.weight,
																						0
																					);

																				totalArticleInToStation +=
																					totalArticleInRow;

																				totalWeightInToStation +=
																					totalWeightInRow;

																				totalInToStation +=
																					row.grandTotal
																						? row.grandTotal
																						: 0;

																				return (
																					<div
																						data-component='loading-memo'
																						className='container table-row'
																					>
																						<div
																							data-component='loading-memo'
																							className='columns-5 body-small'
																							style={{
																								wordBreak:
																									'break-word',
																							}}
																						>
																							{array[0]
																								.fromBranch
																								? trimWords(
																									array[0]
																										.fromBranch,
																									5
																								)
																								: '--'}
																						</div>
																						<div
																							data-component='loading-memo'
																							className='columns-8 body-small align-center'
																						>
																							{row.lrNumber
																								? row.lrNumber
																								: '--'}
																						</div>
																						<div
																							data-component='loading-memo'
																							className='columns-10 body-small align-center'
																						>
																							{totalArticleInRow
																								? totalArticleInRow
																								: '--'}
																						</div>
																						<div
																							data-component='loading-memo'
																							className='columns-3 body-small align-center'
																							style={{
																								wordBreak:
																									'break-word',
																							}}
																						>
																							{row.privateMark
																								? trimWords(
																									row.privateMark,
																									6
																								)
																								: '--'}
																						</div>
																						<div
																							data-component='loading-memo'
																							className='columns-10 body-small align-center'
																						>
																							{totalWeightInRow
																								? totalWeightInRow
																								: '--'}
																						</div>
																						<div
																							data-component='loading-memo'
																							className='columns-5 body-small align-right'
																						>
																							{row.grandTotal
																								? (+row.grandTotal).toFixed(
																									2
																								)
																								: '--'}
																						</div>
																					</div>
																				);
																			}
																		)}
																	</div>
																	{/* <div
																		data-component='loading-memo'
																		className='to-station-bottom body-small'
																	>
																		<div
																			data-component='loading-memo'
																			className='container'
																		>
																			<div
																				data-component='loading-memo'
																				className='columns-3 body-small'
																			>
																				Article:{' '}
																				{
																					totalArticleInToStation
																				}
																			</div>
																			<div
																				data-component='loading-memo'
																				className='columns-3 body-small'
																			>
																				Weight:{' '}
																				{
																					totalWeightInToStation
																				}
																			</div>
																			<div
																				data-component='loading-memo'
																				className='columns-3 body-small align-right'
																			>
																				Total:{' '}
																				{(+totalInToStation).toFixed(
																					2
																				)}
																			</div>
																		</div>
																	</div> */}
																</>
															);
														}
													)}
												</div>
											)}
										</div>
									</div>

									{gdmBookings.length === index + 1 && (
										<>
											<div
												data-component='loading-memo'
												className='summary-container'
												id='gdm-summary-container'
											>
												<div
													data-component='loading-memo'
													className='middle-section'
													style={{
														margin: '24px 0 0 0',
													}}
												>
													<div
														data-component='loading-memo'
														className='container table-head'
													>
														<div
															data-component='loading-memo'
															className='columns-6 body-small'
														>
															To
														</div>
														<div
															data-component='loading-memo'
															className='columns-12 body-small align-center'
														>
															LR
														</div>
														<div
															data-component='loading-memo'
															className='columns-10 body-small align-center'
														>
															Article
														</div>
														<div
															data-component='loading-memo'
															className='columns-8 body-small align-center'
														>
															Actual Weight
														</div>
														<div
															data-component='loading-memo'
															className='columns-8 body-small align-center'
														>
															Charge Weight
														</div>
														<div
															data-component='loading-memo'
															className='columns-10 body-small align-right'
														>
															TOPAY
														</div>
														<div
															data-component='loading-memo'
															className='columns-10 body-small align-right'
														>
															PAID
														</div>
														<div
															data-component='loading-memo'
															className='columns-10 body-small align-right'
														>
															TBB
														</div>
														<div
															data-component='loading-memo'
															className='columns-10 body-small align-right'
														>
															Vasuli
														</div>
													</div>
												</div>

												<div
													data-component='loading-memo'
													className='summary-rows-container'
													id='gdm-summary-rows-container'
												>
													{new Array(1)
														.fill(null)
														.map(() => {
															let grandTotalLrInToStation = 0;
															let grandTotalArticleInToStation = 0;
															let grandTotalWeightInToStation = 0;
															let grandTotalChargeWeightInToStation = 0;
															let grandTotalToPayInToStation = 0;
															let grandTotalToPaidInToStation = 0;
															let grandTotalToTBBInToStation = 0;
															let grandTotalInToStation = 0;
															let grandTotalVasuliInToStation = 0;

															const allBookingsToDisplay =
																[];

															for (
																let i = 0;
																i <
																gdmBookings.length;
																i++
															) {
																const thisBookings =
																	gdmBookings[
																	i
																	];

																for (
																	let i = 0;
																	i <
																	thisBookings.length;
																	i++
																) {
																	const bookings =
																		thisBookings[
																		i
																		];
																	allBookingsToDisplay.push(
																		bookings
																	);
																}
															}

															const groupedBookings: {
																[
																key: number
																]: any[];
															} = {};

															allBookingsToDisplay.forEach(
																(booking) => {
																	const {
																		toBranchId,
																	} = booking;

																	if (
																		!groupedBookings[
																		toBranchId
																		]
																	) {
																		groupedBookings[
																			toBranchId
																		] = [];
																	}

																	groupedBookings[
																		toBranchId
																	].push(
																		booking
																	);
																}
															);

															let result: BookingInterface[][] =
																Object.values(
																	groupedBookings
																).reverse();

															const orderByToBranch =
																(
																	bookings: BookingInterface[][]
																): BookingInterface[][] => {
																	let result =
																		bookings.sort(
																			(
																				a,
																				b
																			) =>
																				a[0].toBranch
																					.toUpperCase()
																					.localeCompare(
																						b[0].toBranch.toUpperCase()
																					)
																		);

																	return result;
																};

															result =
																orderByToBranch(
																	result
																);

															return (
																<>
																	{result.map(
																		(
																			array
																		) => {
																			let totalArticleInToStation = 0;
																			let totalWeightInToStation = 0;
																			let totalChargeWeightInToStation = 0;
																			let totalInToStation = 0;
																			let totalLr =
																				array.length;

																			array.map(
																				(
																					row
																				) => {
																					let totalArticleInRow =
																						row.bookingDetails.reduce(
																							(
																								sum: any,
																								detail: any
																							) =>
																								sum +
																								detail.article,
																							0
																						);

																					let totalWeightInRow =
																						row.bookingDetails.reduce(
																							(
																								sum: any,
																								detail: any
																							) =>
																								sum +
																								detail.weight,
																							0
																						);

																					let totalChargeWeightInRow =
																						row.bookingDetails.reduce(
																							(
																								sum: any,
																								detail: any
																							) =>
																								sum +
																								detail.chargeWeight,
																							0
																						);

																					totalWeightInToStation +=
																						totalWeightInRow;

																					totalChargeWeightInToStation +=
																						totalChargeWeightInRow;

																					totalArticleInToStation +=
																						totalArticleInRow;

																					totalInToStation +=
																						row.grandTotal
																							? row.grandTotal
																							: 0;
																				}
																			);

																			const selectedTotal =
																				array.reduce(
																					(
																						acc,
																						booking
																					) => {
																						if (
																							booking.paymentType ===
																							1
																						) {
																							let prevFreightToPay =
																								new Decimal(
																									acc.totalFreightToPay
																								);
																							let freight =
																								new Decimal(
																									+booking.grandTotal
																								);
																							let totalFreightToPay =
																								+prevFreightToPay.plus(
																									freight
																								);
																							acc.totalFreightToPay =
																								totalFreightToPay;
																						} else if (
																							booking.paymentType ===
																							2
																						) {
																							let prevFreightPaid =
																								new Decimal(
																									acc.totalFreightPaid
																								);
																							let freight =
																								new Decimal(
																									+booking.grandTotal
																								);
																							let totalFreightPaid =
																								+prevFreightPaid.plus(
																									freight
																								);
																							acc.totalFreightPaid =
																								totalFreightPaid;
																						} else if (
																							booking.paymentType ===
																							3
																						) {
																							let prevFreightTBB =
																								new Decimal(
																									acc.totalFreightTBB
																								);
																							let freight =
																								new Decimal(
																									+booking.grandTotal
																								);
																							let totalFreightTBB =
																								+prevFreightTBB.plus(
																									freight
																								);
																							acc.totalFreightTBB =
																								totalFreightTBB;
																						}
																						return acc;
																					},
																					{
																						totalFreightToPay: 0,
																						totalFreightPaid: 0,
																						totalFreightTBB: 0,
																					}
																				);

																			const totalVasuli =
																				new Decimal(
																					+selectedTotal.totalFreightToPay
																				)
																					.plus(
																						+selectedTotal.totalFreightPaid
																					)
																					.plus(
																						+selectedTotal.totalFreightTBB
																					);

																			grandTotalLrInToStation +=
																				totalLr;

																			grandTotalArticleInToStation +=
																				totalArticleInToStation;

																			grandTotalWeightInToStation +=
																				totalWeightInToStation;

																			grandTotalChargeWeightInToStation +=
																				totalChargeWeightInToStation;

																			grandTotalToPayInToStation +=
																				selectedTotal.totalFreightToPay;
																			grandTotalToPaidInToStation +=
																				selectedTotal.totalFreightPaid;
																			grandTotalToTBBInToStation +=
																				selectedTotal.totalFreightTBB;

																			grandTotalInToStation +=
																				totalInToStation;

																			grandTotalVasuliInToStation +=
																				+totalVasuli;

																			return (
																				<>
																					<div
																						data-component='loading-memo'
																						className='table-row body-small'
																						ref={(
																							e
																						) => {
																							if (
																								e
																							) {
																								gdmSummaryRowHeight.current.push(
																									{
																										rowHeight:
																											e.offsetHeight,
																										boookings:
																											array,
																									}
																								);
																							}
																						}}
																					>
																						<div
																							data-component='loading-memo'
																							className='container'
																						>
																							<div
																								data-component='loading-memo'
																								className='columns-6 body-small'
																							>
																								{
																									array[0]
																										.toBranch
																								}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-12 body-small align-center'
																							>
																								{
																									totalLr
																								}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-center'
																							>
																								{
																									totalArticleInToStation
																								}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-8 body-small align-center'
																							>
																								{
																									totalWeightInToStation
																								}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-8 body-small align-center'
																							>
																								{
																									totalChargeWeightInToStation
																								}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-right'
																							>
																								{(+selectedTotal.totalFreightToPay).toFixed(
																									2
																								)}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-right'
																							>
																								{(+selectedTotal.totalFreightPaid).toFixed(
																									2
																								)}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-right'
																							>
																								{(+selectedTotal.totalFreightTBB).toFixed(
																									2
																								)}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-right'
																							>
																								{`${(+totalVasuli).toFixed(
																									2
																								)}`}
																							</div>
																						</div>
																					</div>
																				</>
																			);
																		}
																	)}

																	{gdmRemainingBookingsSummary.length ===
																		0 && (
																			<div
																				data-component='loading-memo'
																				className='middle-section'
																			>
																				<div
																					data-component='loading-memo'
																					className='container table-head'
																				>
																					<div
																						data-component='loading-memo'
																						className='columns-6 body-small'
																					>
																						Total
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-12 body-small align-center'
																					>
																						{
																							grandTotalLrInToStation
																						}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-10 body-small align-center'
																					>
																						{
																							grandTotalArticleInToStation
																						}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-8 body-small align-center'
																					>
																						{
																							grandTotalWeightInToStation
																						}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-8 body-small align-center'
																					>
																						{
																							grandTotalChargeWeightInToStation
																						}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-10 body-small align-right'
																					>
																						{(+grandTotalToPayInToStation).toFixed(
																							2
																						)}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-10 body-small align-right'
																					>
																						{(+grandTotalToPaidInToStation).toFixed(
																							2
																						)}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-10 body-small align-right'
																					>
																						{(+grandTotalToTBBInToStation).toFixed(
																							2
																						)}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-10 body-small align-right'
																					>
																						{(+grandTotalVasuliInToStation).toFixed(
																							2
																						)}
																					</div>
																				</div>
																			</div>
																		)}
																</>
															);
														})}
												</div>
											</div>
										</>
									)}
								</div>
							);
						})}

						{gdmRemainingBookingsSummary &&
							gdmRemainingBookingsSummary.length !== 0 && (
								<>
									{gdmRemainingBookingsSummary.map(
										(data, index) => {
											let finalTotalLr = 0;
											let finalTotalArticle = 0;
											let finalTotalWeight = 0;
											let finalTotalChargeWeight = 0;
											let finalTotalToPay = 0;
											let finalTotalToPaid = 0;
											let finalTotalToTBB = 0;
											let finalTotalVasuli = 0;

											for (
												let i = 0;
												i < gdmBookings.length;
												i++
											) {
												const gdmBooking =
													gdmBookings[i];

												const totals =
													gdmBooking.reduce(
														(acc, booking) => {
															booking.bookingDetails.forEach(
																(detail) => {
																	let prevArticles =
																		new Decimal(
																			acc.totalArticle
																		);
																	let article =
																		new Decimal(
																			+detail.article
																		);
																	let totalArticle =
																		+prevArticles.plus(
																			article
																		);

																	acc.totalArticle =
																		totalArticle;

																	let prevWeight =
																		new Decimal(
																			acc.totalWeight
																		);

																	let weight =
																		new Decimal(
																			+detail.weight
																		);

																	let totalWeight =
																		+prevWeight.plus(
																			weight
																		);
																	acc.totalWeight =
																		totalWeight;

																	let prevChargeWeight =
																		new Decimal(
																			acc.totalChargeWeight
																		);

																	let chargeWeight =
																		new Decimal(
																			+detail.chargeWeight
																		);

																	let totalChargeWeight =
																		+prevChargeWeight.plus(
																			chargeWeight
																		);
																	acc.totalChargeWeight =
																		totalChargeWeight;
																}
															);

															if (
																booking.paymentType ===
																1
															) {
																let prevFreightToPay =
																	new Decimal(
																		acc.totalFreightToPay
																	);
																let freight =
																	new Decimal(
																		+booking.grandTotal
																	);
																let totalFreightToPay =
																	+prevFreightToPay.plus(
																		freight
																	);
																acc.totalFreightToPay =
																	totalFreightToPay;
															} else if (
																booking.paymentType ===
																2
															) {
																let prevFreightPaid =
																	new Decimal(
																		acc.totalFreightPaid
																	);
																let freight =
																	new Decimal(
																		+booking.grandTotal
																	);
																let totalFreightPaid =
																	+prevFreightPaid.plus(
																		freight
																	);
																acc.totalFreightPaid =
																	totalFreightPaid;
															} else if (
																booking.paymentType ===
																3
															) {
																let prevFreightTBB =
																	new Decimal(
																		acc.totalFreightTBB
																	);
																let freight =
																	new Decimal(
																		+booking.grandTotal
																	);
																let totalFreightTBB =
																	+prevFreightTBB.plus(
																		freight
																	);
																acc.totalFreightTBB =
																	totalFreightTBB;
															}
															return acc;
														},
														{
															totalArticle: 0,
															totalWeight: 0,
															totalChargeWeight: 0,
															totalFreightToPay: 0,
															totalFreightPaid: 0,
															totalFreightTBB: 0,
														}
													);

												const totalVasuli = new Decimal(
													+totals.totalFreightToPay
												)
													.plus(
														+totals.totalFreightPaid
													)
													.plus(
														+totals.totalFreightTBB
													);

												finalTotalLr =
													finalTotalLr +
													gdmBooking.length;
												finalTotalArticle =
													finalTotalArticle +
													totals.totalArticle;
												finalTotalWeight =
													finalTotalWeight +
													totals.totalWeight;
												finalTotalChargeWeight =
													finalTotalChargeWeight +
													totals.totalChargeWeight;
												finalTotalToPay =
													finalTotalToPay +
													totals.totalFreightToPay;
												finalTotalToPaid =
													finalTotalToPaid +
													totals.totalFreightPaid;
												finalTotalToTBB =
													finalTotalToTBB +
													totals.totalFreightTBB;
												finalTotalVasuli =
													finalTotalVasuli +
													+totalVasuli;
											}

											return (
												<div
													data-component='loading-memo'
													className='page gdm-print'
												>
													<div
														data-component='loading-memo'
														className='body-small'
													>
														Page No.
														{gdmBookings.length +
															(index + 1)}
													</div>
													<div data-component="loading-memo" className="head-container"> 
													<div
														data-component='loading-memo'
														className='logo-container'
													>
														<img
															data-component='loading-memo'
															className='logo'
															src={Logo}
														/>
													</div>
													<div
														data-component='loading-memo'
														className='headline title-large'
													>
														{company?.companyName
															? company?.companyName
															: '--'}
														<div
															data-component='loading-memo'
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
															data-component='loading-memo'
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
														data-component='loading-memo'
														className='text body-small'
													>
														MOTOR REPORT
													</div>
													<div
														data-component='loading-memo'
														className='top-section'
													>
														<div
															data-component='loading-memo'
															className='container highlighted-row'
														>
															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-small'
																	>
																		LDM
																		Number:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-small'
																	>
																		{loadingMemo.ldmNo
																			? loadingMemo.ldmNo
																			: '--'}
																	</div>
																</div>
															</div>

															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-small'
																	>
																		From:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-small bold-text'
																	>
																		{userBranchDetails?.name
																			? userBranchDetails?.name
																			: '--'}
																	</div>
																</div>
															</div>
															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-small'
																	>
																		To:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-small bold-text'
																	>
																		{loadingMemo.toStationId
																			? findObjectInArray(
																				[
																					...deliveryBranches,
																					...bookingBranches,
																				],
																				'branchId',
																				loadingMemo.toStationId
																			)
																				.name
																			: '--'}
																	</div>
																</div>
															</div>
														</div>
														<div
															data-component='loading-memo'
															className='container'
														>
															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-medium'
																	>
																		Truck
																		Number:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-medium'
																	>
																		{loadingMemo.truckNo
																			? loadingMemo.truckNo
																			: '--'}
																	</div>
																</div>
															</div>
															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-medium'
																	>
																		Driver
																		Name:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-medium'
																	>
																		{loadingMemo.driverName
																			? loadingMemo.driverName
																			: '--'}
																	</div>
																</div>
															</div>
															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-medium'
																	>
																		Driver
																		Contact
																		No.:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-medium'
																	>
																		{loadingMemo.driverContactNo
																			? loadingMemo.driverContactNo
																			: '--'}
																	</div>
																</div>
															</div>
														</div>
														<div
															data-component='loading-memo'
															className='container'
														>
															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-medium'
																	>
																		Date:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-medium'
																	>
																		{loadingMemo.ldmDate
																			? format(
																				loadingMemo.ldmDate,
																				'dd-MM-yyyy'
																			)
																			: '--'}
																	</div>
																</div>
															</div>
															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-medium'
																	>
																		Broker
																		Name:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-medium'
																	>
																		{loadingMemo.brokerName
																			? loadingMemo.brokerName
																			: '--'}
																	</div>
																</div>
															</div>
															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-medium'
																	>
																		Broker
																		Contact
																		No.:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-medium'
																	>
																		{loadingMemo.brokerContactNo
																			? loadingMemo.brokerContactNo
																			: '--'}
																	</div>
																</div>
															</div>
														</div>
														<div
															data-component='loading-memo'
															className='container'
														>
															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-medium'
																	>
																		CEway
																		Bill
																		No.:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-medium'
																	>
																		{loadingMemo.consolidateEWayBillNo
																			? loadingMemo.consolidateEWayBillNo
																			: '--'}
																	</div>
																</div>
															</div>
															<div
																data-component='loading-memo'
																className='columns-3'
															></div>
															<div
																data-component='loading-memo'
																className='columns-3'
															></div>
														</div>
													</div>

													<div
														data-component='loading-memo'
														className='summary-container'
													>
														<div
															data-component='loading-memo'
															className='middle-section'
															style={{
																margin: '24px 0 0 0',
															}}
														>
															<div
																data-component='loading-memo'
																className='container table-head'
															>
																<div
																	data-component='loading-memo'
																	className='columns-6 body-small'
																>
																	To
																</div>
																<div
																	data-component='loading-memo'
																	className='columns-12 body-small align-center'
																>
																	LR
																</div>
																<div
																	data-component='loading-memo'
																	className='columns-10 body-small align-center'
																>
																	Article
																</div>
																<div
																	data-component='loading-memo'
																	className='columns-8 body-small align-center'
																>
																	Actual
																	Weight
																</div>
																<div
																	data-component='loading-memo'
																	className='columns-8 body-small align-center'
																>
																	Charge
																	Weight
																</div>
																<div
																	data-component='loading-memo'
																	className='columns-10 body-small align-right'
																>
																	TOPAY
																</div>
																<div
																	data-component='loading-memo'
																	className='columns-10 body-small align-right'
																>
																	PAID
																</div>
																<div
																	data-component='loading-memo'
																	className='columns-10 body-small align-right'
																>
																	TBB
																</div>
																<div
																	data-component='loading-memo'
																	className='columns-10 body-small align-right'
																>
																	Vasuli
																</div>
															</div>
														</div>

														<div
															data-component='loading-memo'
															className='summary-rows-container'
														>
															{new Array(1)
																.fill(null)
																.map(() => {
																	let grandTotalLrInToStation = 0;
																	let grandTotalArticleInToStation = 0;
																	let grandTotalWeightInToStation = 0;
																	let grandTotalChargeWeightInToStation = 0;
																	let grandTotalToPayInToStation = 0;
																	let grandTotalToPaidInToStation = 0;
																	let grandTotalToTBBInToStation = 0;
																	let grandTotalInToStation = 0;
																	let grandTotalVasuliInToStation = 0;

																	return (
																		<>
																			{data.map(
																				(
																					array
																				) => {
																					let totalArticleInToStation = 0;
																					let totalWeightInToStation = 0;
																					let totalChargeWeightInToStation = 0;
																					let totalInToStation = 0;
																					let totalLr =
																						array.length;

																					array.map(
																						(
																							row
																						) => {
																							let totalArticleInRow =
																								row.bookingDetails.reduce(
																									(
																										sum: any,
																										detail: any
																									) =>
																										sum +
																										detail.article,
																									0
																								);

																							let totalWeightInRow =
																								row.bookingDetails.reduce(
																									(
																										sum: any,
																										detail: any
																									) =>
																										sum +
																										detail.weight,
																									0
																								);

																							let totalChargeWeightInRow =
																								row.bookingDetails.reduce(
																									(
																										sum: any,
																										detail: any
																									) =>
																										sum +
																										detail.chargeWeight,
																									0
																								);

																							totalWeightInToStation +=
																								totalWeightInRow;

																							totalChargeWeightInToStation +=
																								totalChargeWeightInRow;

																							totalArticleInToStation +=
																								totalArticleInRow;

																							totalInToStation +=
																								row.grandTotal
																									? row.grandTotal
																									: 0;
																						}
																					);

																					const selectedTotal =
																						array.reduce(
																							(
																								acc,
																								booking
																							) => {
																								if (
																									booking.paymentType ===
																									1
																								) {
																									let prevFreightToPay =
																										new Decimal(
																											acc.totalFreightToPay
																										);
																									let freight =
																										new Decimal(
																											+booking.grandTotal
																										);
																									let totalFreightToPay =
																										+prevFreightToPay.plus(
																											freight
																										);
																									acc.totalFreightToPay =
																										totalFreightToPay;
																								} else if (
																									booking.paymentType ===
																									2
																								) {
																									let prevFreightPaid =
																										new Decimal(
																											acc.totalFreightPaid
																										);
																									let freight =
																										new Decimal(
																											+booking.grandTotal
																										);
																									let totalFreightPaid =
																										+prevFreightPaid.plus(
																											freight
																										);
																									acc.totalFreightPaid =
																										totalFreightPaid;
																								} else if (
																									booking.paymentType ===
																									3
																								) {
																									let prevFreightTBB =
																										new Decimal(
																											acc.totalFreightTBB
																										);
																									let freight =
																										new Decimal(
																											+booking.grandTotal
																										);
																									let totalFreightTBB =
																										+prevFreightTBB.plus(
																											freight
																										);
																									acc.totalFreightTBB =
																										totalFreightTBB;
																								}
																								return acc;
																							},
																							{
																								totalFreightToPay: 0,
																								totalFreightPaid: 0,
																								totalFreightTBB: 0,
																							}
																						);

																					const totalVasuli =
																						new Decimal(
																							+selectedTotal.totalFreightToPay
																						)
																							.plus(
																								+selectedTotal.totalFreightPaid
																							)
																							.plus(
																								+selectedTotal.totalFreightTBB
																							);

																					grandTotalLrInToStation +=
																						totalLr;
																					grandTotalArticleInToStation +=
																						totalArticleInToStation;
																					grandTotalWeightInToStation +=
																						totalWeightInToStation;
																					grandTotalChargeWeightInToStation +=
																						totalChargeWeightInToStation;
																					grandTotalToPayInToStation +=
																						selectedTotal.totalFreightToPay;
																					grandTotalToPaidInToStation +=
																						selectedTotal.totalFreightPaid;
																					grandTotalToTBBInToStation +=
																						selectedTotal.totalFreightTBB;
																					grandTotalInToStation +=
																						totalInToStation;
																					grandTotalVasuliInToStation +=
																						+totalVasuli;

																					return (
																						<>
																							<div
																								data-component='loading-memo'
																								className='table-row body-small'
																								ref={(
																									e
																								) => {
																									if (
																										e
																									) {
																										gdmSummaryRowHeight.current.push(
																											{
																												rowHeight:
																													e.offsetHeight,
																												boookings:
																													array,
																											}
																										);
																									}
																								}}
																							>
																								<div
																									data-component='loading-memo'
																									className='container'
																								>
																									<div
																										data-component='loading-memo'
																										className='columns-6 body-small'
																									>
																										{
																											array[0]
																												.toBranch
																										}
																									</div>
																									<div
																										data-component='loading-memo'
																										className='columns-12 body-small align-center'
																									>
																										{
																											totalLr
																										}
																									</div>
																									<div
																										data-component='loading-memo'
																										className='columns-10 body-small align-center'
																									>
																										{
																											totalArticleInToStation
																										}
																									</div>
																									<div
																										data-component='loading-memo'
																										className='columns-8 body-small align-center'
																									>
																										{
																											totalWeightInToStation
																										}
																									</div>
																									<div
																										data-component='loading-memo'
																										className='columns-8 body-small align-center'
																									>
																										{
																											totalChargeWeightInToStation
																										}
																									</div>
																									<div
																										data-component='loading-memo'
																										className='columns-10 body-small align-right'
																									>
																										{(+selectedTotal.totalFreightToPay).toFixed(
																											2
																										)}
																									</div>
																									<div
																										data-component='loading-memo'
																										className='columns-10 body-small align-right'
																									>
																										{(+selectedTotal.totalFreightPaid).toFixed(
																											2
																										)}
																									</div>
																									<div
																										data-component='loading-memo'
																										className='columns-10 body-small align-right'
																									>
																										{(+selectedTotal.totalFreightTBB).toFixed(
																											2
																										)}
																									</div>
																									<div
																										data-component='loading-memo'
																										className='columns-10 body-small align-right'
																									>
																										{`${(+totalVasuli).toFixed(
																											2
																										)}`}
																									</div>
																								</div>
																							</div>
																						</>
																					);
																				}
																			)}

																			{gdmRemainingBookingsSummary.length ===
																				index +
																				1 && (
																					<div
																						data-component='loading-memo'
																						className='middle-section'
																					>
																						<div
																							data-component='loading-memo'
																							className='container table-head'
																						>
																							<div
																								data-component='loading-memo'
																								className='columns-6 body-small'
																							>
																								Total
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-12 body-small align-center'
																							>
																								{
																									finalTotalLr
																								}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-center'
																							>
																								{
																									finalTotalArticle
																								}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-8 body-small align-center'
																							>
																								{
																									finalTotalWeight
																								}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-8 body-small align-center'
																							>
																								{
																									finalTotalChargeWeight
																								}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-right'
																							>
																								{(+finalTotalToPay).toFixed(
																									2
																								)}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-right'
																							>
																								{(+finalTotalToPaid).toFixed(
																									2
																								)}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-right'
																							>
																								{(+finalTotalToTBB).toFixed(
																									2
																								)}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-right'
																							>
																								{(+finalTotalVasuli).toFixed(
																									2
																								)}
																							</div>
																						</div>
																					</div>
																				)}
																		</>
																	);
																})}
														</div>
													</div>
												</div>
											);
										}
									)}
								</>
							)}
					</div>
				)}

			{loadingMemo &&
				bookings &&
				cEwayBillPrint &&
				states &&
				cEwayBillPrint.tripSheetEwbBills && (
					<div
						data-component='loading-memo'
						className='pdf-container'
						id='ewaybill-prints-container'
					>
						{cEwayBillPrint.tripSheetEwbBills.map(
							(array: any, index: any) => {
								return (
									<div className='container ceway-bill'>
										<div
											data-component='loading-memo'
											className='body-small'
										>
											Page No.{index + 1}
										</div>
										<div className='header'>
											PRINT CONSOLIDATED E-WAY BILL
										</div>
										<div className='title'>
											Consolidated E-Way Bill
										</div>
										<div className='top-container'>
											<table>
												<tr>
													<th colSpan={2}>
														1. Consolidated E-Way
														Bill Details
													</th>
												</tr>
												<tr>
													<td>
														Consolidated E-Way Bill
														No
													</td>
													<td>
														{cEwayBillPrint.tripSheetNo
															? cEwayBillPrint.tripSheetNo
															: '--'}
													</td>
												</tr>
												<tr>
													<td>Date</td>
													<td>
														{cEwayBillPrint.transDocDate
															? cEwayBillPrint.transDocDate
															: '--'}
													</td>
												</tr>
												<tr>
													<td>Transporter ID</td>
													<td>
														{cEwayBillPrint.userGstin
															? cEwayBillPrint.userGstin
															: '--'}
													</td>
												</tr>
												<tr>
													<td>Vehicle No</td>
													<td>
														{cEwayBillPrint.vehicleNo
															? cEwayBillPrint.vehicleNo
															: '--'}
													</td>
												</tr>
												<tr>
													<td>From</td>
													<td>
														{cEwayBillPrint.fromPlace
															? cEwayBillPrint.fromPlace
															: '--'}
														-
														{cEwayBillPrint.fromState
															? findObjectInArray(
																states,
																'gstStateCode',
																+cEwayBillPrint.fromState
															).state
															: '--'}
													</td>
												</tr>
												<tr>
													<td>Mode</td>
													<td>Road</td>
												</tr>
											</table>
											<div className='qr-container'>
												<img
													alt='QR Code'
													className='qr-code'
													src={
														cEwayBillPrint.qr
															? cEwayBillPrint.qr
															: ''
													}
												/>
											</div>
										</div>
										<table>
											<tr>
												<th colSpan={7}>
													2. Item Details
												</th>
											</tr>
											<tr>
												<th>E-WayBill No. & Date</th>
												<th>E-WayBill By</th>
												<th>Document No. & Date</th>
												<th>Value</th>
												<th>To</th>
												<th>Valid Till Date</th>
											</tr>
											{array.map((data: any) => {
												return (
													<tr>
														<td>
															{data.ewbNo
																? data.ewbNo
																: '--'}
															-
															{data.ewbDate
																? format(
																	data.ewbDate,
																	'dd/MM/yyyy'
																)
																: '--'}
														</td>
														<td>
															{data.fromGstin
																? data.fromGstin
																: '--'}
														</td>
														<td>
															{data.docNo
																? data.docNo
																: '--'}
															-
															{data.docDate
																? data.docDate
																: '--'}
														</td>
														<td>
															{data.totInvValue
																? data.totInvValue
																: '--'}
														</td>
														<td>--</td>
														<td>
															{data.validUpto
																? data.validUpto.split(
																	' '
																)[0]
																: '--'}
														</td>
													</tr>
												);
											})}
										</table>
									</div>
								);
							}
						)}
					</div>
				)}

			{loadingMemo &&
				bookings &&
				regions &&
				bookingBranches &&
				deliveryBranches &&
				ldmBookings &&
				userBranchDetails && (
					<div
						data-component='loading-memo'
						className='pdf-container'
						id='transit-prints-container'
					>
						{transitReport.map((page, index) => {
							const pageArray = page.reverse();

							let leftSideBookings = [...pageArray].splice(0, 25);
							let rightSideBookings = [...pageArray].splice(
								25,
								50
							);

							return (
								<div
									data-component='loading-memo'
									className='page transit-print'
									id={`transit-print-${index}`}
								>
									<div
										data-component='loading-memo'
										className='body-small'
									>
										Page No.{index + 1}
									</div>
									<div data-component="loading-memo" className="head-container">
									<div
										data-component='loading-memo'
										className='logo-container'
									>
										<img
											data-component='loading-memo'
											className='logo'
											src={Logo}
										/>
									</div>
									<div
										data-component='loading-memo'
										className='headline title-large'
									>
										{company?.companyName
											? company?.companyName
											: '--'}
										<div
											data-component='loading-memo'
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
											data-component='loading-memo'
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
										data-component='loading-memo'
										className='text body-small'
									>
										TRANSIT REPORT
									</div>
									<div
										data-component='loading-memo'
										className='top-section'
									>
										<div
											data-component='loading-memo'
											className='container'
										>
											<div
												data-component='loading-memo'
												className='columns-4'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-medium'
													>
														LDM Number:
													</div>
													<div
														data-component='loading-memo'
														className='value body-medium'
													>
														{loadingMemo.ldmNo
															? loadingMemo.ldmNo
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='loading-memo'
												className='columns-4'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-medium'
													>
														LDM Date:
													</div>
													<div
														data-component='loading-memo'
														className='value body-medium'
													>
														{loadingMemo.ldmDate
															? format(
																loadingMemo.ldmDate,
																'dd-MM-yyyy'
															)
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='loading-memo'
												className='columns-4'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-medium'
													>
														From:
													</div>
													<div
														data-component='loading-memo'
														className='value body-medium bold-text'
													>
														{userBranchDetails?.name
															? userBranchDetails?.name
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='loading-memo'
												className='columns-4'
											>
												<div
													data-component='loading-memo'
													className='value-container'
												>
													<div
														data-component='loading-memo'
														className='label body-medium'
													>
														To:
													</div>
													<div
														data-component='loading-memo'
														className='value body-medium'
													>
														{loadingMemo.toStationId
															? findObjectInArray(
																[
																	...deliveryBranches,
																	...bookingBranches,
																],
																'branchId',
																loadingMemo.toStationId
															).name
															: '--'}
													</div>
												</div>
											</div>
										</div>
									</div>
									<div
										data-component='loading-memo'
										className='middle-section'
									>
										<div
											data-component='loading-memo'
											className='container'
										>
											<div
												data-component='loading-memo'
												className='columns-2'
											>
												<div
													data-component='loading-memo'
													className='container table-head'
												>
													<div
														data-component='loading-memo'
														className='columns-10 body-small'
													>
														Src
													</div>
													<div
														data-component='loading-memo'
														className='columns-6 body-small align-center'
													>
														LR No.
													</div>
													<div
														data-component='loading-memo'
														className='columns-10 body-small align-center'
													>
														Art.
													</div>
													<div
														data-component='loading-memo'
														className='columns-10 body-small align-center'
													>
														Wgt.
													</div>
													<div
														data-component='loading-memo'
														className='columns-4 body-small align-center'
													>
														Pvt.mrk.
													</div>
													<div
														data-component='loading-memo'
														className='columns-5 body-small align-center'
													>
														Bkg.dt.
													</div>
													<div
														data-component='loading-memo'
														className='columns-6 body-small align-center'
													>
														Desti.
													</div>
												</div>
												{leftSideBookings.map((row) => {
													return (
														<div
															data-component='loading-memo'
															className='container table-row'
														>
															<div
																data-component='loading-memo'
																className='columns-10 body-small'
															>
																{row.fromBranch
																	? trimWords(
																		row.fromBranch,
																		3
																	)
																	: '--'}
															</div>
															<div
																data-component='loading-memo'
																className='columns-6 body-small align-center'
															>
																{row.lrNumber
																	? row.lrNumber
																	: '--'}
															</div>
															<div
																data-component='loading-memo'
																className='columns-10 body-small align-center'
															>
																{row.bookingDetails
																	? row.bookingDetails.reduce(
																		(
																			sum: any,
																			detail: any
																		) =>
																			sum +
																			detail.article,
																		0
																	)
																	: '--'}
															</div>
															<div
																data-component='loading-memo'
																className='columns-10 body-small align-center'
															>
																{row.bookingDetails
																	? row.bookingDetails.reduce(
																		(
																			sum: any,
																			detail: any
																		) =>
																			sum +
																			detail.weight,
																		0
																	)
																	: '--'}
															</div>
															<div
																data-component='loading-memo'
																className='columns-4 body-small align-center'
																style={{
																	wordBreak:
																		'break-word',
																}}
															>
																{row.privateMark
																	? trimWords(
																		row.privateMark,
																		6
																	)
																	: '--'}
															</div>
															<div
																data-component='loading-memo'
																className='columns-5 label-medium align-center'
																style={{
																	fontWeight:
																		'700',
																}}
															>
																{row.bookingDate
																	? format(
																		row.bookingDate,
																		'dd-MM-yyyy'
																	)
																	: '--'}
															</div>
															<div
																data-component='loading-memo'
																className='columns-6 body-small align-center'
																style={{
																	wordBreak:
																		'break-word',
																}}
															>
																{row.toBranch
																	? trimWords(
																		row.toBranch,
																		3
																	)
																	: '--'}
															</div>
														</div>
													);
												})}
											</div>
											{rightSideBookings.length !== 0 && (
												<div
													data-component='loading-memo'
													className='columns-2'
												>
													<div
														data-component='loading-memo'
														className='container table-head'
													>
														<div
															data-component='loading-memo'
															className='columns-10 body-small'
														>
															Src
														</div>
														<div
															data-component='loading-memo'
															className='columns-6 body-small align-center'
														>
															LR No.
														</div>
														<div
															data-component='loading-memo'
															className='columns-10 body-small align-center'
														>
															Art.
														</div>
														<div
															data-component='loading-memo'
															className='columns-10 body-small align-center'
														>
															Wgt.
														</div>
														<div
															data-component='loading-memo'
															className='columns-4 body-small align-center'
														>
															Pvt.mrk.
														</div>
														<div
															data-component='loading-memo'
															className='columns-5 body-small align-center'
														>
															Bkg.dt.
														</div>
														<div
															data-component='loading-memo'
															className='columns-6 body-small align-center'
														>
															Desti.
														</div>
													</div>
													{rightSideBookings.map(
														(row) => {
															return (
																<div
																	data-component='loading-memo'
																	className='container table-row'
																>
																	<div
																		data-component='loading-memo'
																		className='columns-10 body-small'
																	>
																		{row.fromBranch
																			? trimWords(
																				row.fromBranch,
																				3
																			)
																			: '--'}
																	</div>
																	<div
																		data-component='loading-memo'
																		className='columns-6 body-small align-center'
																	>
																		{row.lrNumber
																			? row.lrNumber
																			: '--'}
																	</div>
																	<div
																		data-component='loading-memo'
																		className='columns-10 body-small align-center'
																	>
																		{row.bookingDetails
																			? row.bookingDetails.reduce(
																				(
																					sum: any,
																					detail: any
																				) =>
																					sum +
																					detail.article,
																				0
																			)
																			: '--'}
																	</div>
																	<div
																		data-component='loading-memo'
																		className='columns-10 body-small align-center'
																	>
																		{row.bookingDetails
																			? row.bookingDetails.reduce(
																				(
																					sum: any,
																					detail: any
																				) =>
																					sum +
																					detail.weight,
																				0
																			)
																			: '--'}
																	</div>
																	<div
																		data-component='loading-memo'
																		className='columns-4 body-small align-center'
																		style={{
																			wordBreak:
																				'break-word',
																		}}
																	>
																		{row.privateMark
																			? trimWords(
																				row.privateMark,
																				6
																			)
																			: '--'}
																	</div>
																	<div
																		data-component='loading-memo'
																		className='columns-5 label-medium align-center'
																		style={{
																			fontWeight:
																				'700',
																		}}
																	>
																		{row.bookingDate
																			? format(
																				row.bookingDate,
																				'dd-MM-yyyy'
																			)
																			: '--'}
																	</div>
																	<div
																		data-component='loading-memo'
																		className='columns-6 body-small align-center'
																		style={{
																			wordBreak:
																				'break-word',
																		}}
																	>
																		{row.toBranch
																			? trimWords(
																				row.toBranch,
																				3
																			)
																			: '--'}
																	</div>
																</div>
															);
														}
													)}
												</div>
											)}
										</div>
									</div>

									{transitReport.length === index + 1 && (
										<>
											<div
												data-component='loading-memo'
												className='summary-container'
												id='transit-report-summary-container'
											>
												<div
													data-component='loading-memo'
													className='middle-section'
													style={{
														margin: '24px 0 0 0',
													}}
												>
													<div
														data-component='loading-memo'
														className='container table-head'
													>
														<div
															data-component='loading-memo'
															className='columns-6 body-small'
														>
															To
														</div>
														<div
															data-component='loading-memo'
															className='columns-12 body-small align-center'
														>
															LR
														</div>
														<div
															data-component='loading-memo'
															className='columns-10 body-small align-center'
														>
															Article
														</div>
														<div
															data-component='loading-memo'
															className='columns-8 body-small align-center'
														>
															Actual Weight
														</div>
														<div
															data-component='loading-memo'
															className='columns-8 body-small align-center'
														>
															Charge Weight
														</div>
														<div
															data-component='loading-memo'
															className='columns-10 body-small align-right'
														>
															TOPAY
														</div>
														<div
															data-component='loading-memo'
															className='columns-10 body-small align-right'
														>
															PAID
														</div>
														<div
															data-component='loading-memo'
															className='columns-10 body-small align-right'
														>
															TBB
														</div>
														<div
															data-component='loading-memo'
															className='columns-10 body-small align-right'
														>
															Vasuli
														</div>
													</div>
												</div>

												<div
													data-component='loading-memo'
													className='summary-rows-container'
													id='transit-report-rows-container'
												>
													{new Array(1)
														.fill(null)
														.map(() => {
															let grandTotalLrInToStation = 0;
															let grandTotalArticleInToStation = 0;
															let grandTotalWeightInToStation = 0;
															let grandTotalChargeWeightInToStation = 0;
															let grandTotalToPayInToStation = 0;
															let grandTotalToPaidInToStation = 0;
															let grandTotalToTBBInToStation = 0;
															let grandTotalInToStation = 0;
															let grandTotalVasuliInToStation = 0;

															const allBookingsToDisplay =
																[];

															for (
																let i = 0;
																i <
																transitReport.length;
																i++
															) {
																const thisBookings =
																	transitReport[
																	i
																	];

																for (
																	let i = 0;
																	i <
																	thisBookings.length;
																	i++
																) {
																	const bookings =
																		thisBookings[
																		i
																		];
																	allBookingsToDisplay.push(
																		bookings
																	);
																}
															}

															const groupedBookings: {
																[
																key: number
																]: any[];
															} = {};

															allBookingsToDisplay.forEach(
																(booking) => {
																	const {
																		toBranchId,
																	} = booking;

																	if (
																		!groupedBookings[
																		toBranchId
																		]
																	) {
																		groupedBookings[
																			toBranchId
																		] = [];
																	}

																	groupedBookings[
																		toBranchId
																	].push(
																		booking
																	);
																}
															);

															let result: BookingInterface[][] =
																Object.values(
																	groupedBookings
																).reverse();

															const orderByToBranch =
																(
																	bookings: BookingInterface[][]
																): BookingInterface[][] => {
																	let result =
																		bookings.sort(
																			(
																				a,
																				b
																			) =>
																				a[0].toBranch
																					.toUpperCase()
																					.localeCompare(
																						b[0].toBranch.toUpperCase()
																					)
																		);

																	return result;
																};

															result =
																orderByToBranch(
																	result
																);

															return (
																<>
																	{result.map(
																		(
																			array
																		) => {
																			let totalArticleInToStation = 0;
																			let totalWeightInToStation = 0;
																			let totalChargeWeightInToStation = 0;
																			let totalInToStation = 0;
																			let totalLr =
																				array.length;

																			array.map(
																				(
																					row
																				) => {
																					let totalArticleInRow =
																						row.bookingDetails.reduce(
																							(
																								sum: any,
																								detail: any
																							) =>
																								sum +
																								detail.article,
																							0
																						);

																					let totalWeightInRow =
																						row.bookingDetails.reduce(
																							(
																								sum: any,
																								detail: any
																							) =>
																								sum +
																								detail.weight,
																							0
																						);

																					let totalChargeWeightInRow =
																						row.bookingDetails.reduce(
																							(
																								sum: any,
																								detail: any
																							) =>
																								sum +
																								detail.chargeWeight,
																							0
																						);

																					totalWeightInToStation +=
																						totalWeightInRow;

																					totalChargeWeightInToStation +=
																						totalChargeWeightInRow;

																					totalArticleInToStation +=
																						totalArticleInRow;

																					totalInToStation +=
																						row.grandTotal
																							? row.grandTotal
																							: 0;
																				}
																			);

																			const selectedTotal =
																				array.reduce(
																					(
																						acc,
																						booking
																					) => {
																						if (
																							booking.paymentType ===
																							1
																						) {
																							let prevFreightToPay =
																								new Decimal(
																									acc.totalFreightToPay
																								);
																							let freight =
																								new Decimal(
																									+booking.grandTotal
																								);
																							let totalFreightToPay =
																								+prevFreightToPay.plus(
																									freight
																								);
																							acc.totalFreightToPay =
																								totalFreightToPay;
																						} else if (
																							booking.paymentType ===
																							2
																						) {
																							let prevFreightPaid =
																								new Decimal(
																									acc.totalFreightPaid
																								);
																							let freight =
																								new Decimal(
																									+booking.grandTotal
																								);
																							let totalFreightPaid =
																								+prevFreightPaid.plus(
																									freight
																								);
																							acc.totalFreightPaid =
																								totalFreightPaid;
																						} else if (
																							booking.paymentType ===
																							3
																						) {
																							let prevFreightTBB =
																								new Decimal(
																									acc.totalFreightTBB
																								);
																							let freight =
																								new Decimal(
																									+booking.grandTotal
																								);
																							let totalFreightTBB =
																								+prevFreightTBB.plus(
																									freight
																								);
																							acc.totalFreightTBB =
																								totalFreightTBB;
																						}
																						return acc;
																					},
																					{
																						totalFreightToPay: 0,
																						totalFreightPaid: 0,
																						totalFreightTBB: 0,
																					}
																				);

																			const totalVasuli =
																				new Decimal(
																					+selectedTotal.totalFreightToPay
																				)
																					.plus(
																						+selectedTotal.totalFreightPaid
																					)
																					.plus(
																						+selectedTotal.totalFreightTBB
																					);

																			grandTotalLrInToStation +=
																				totalLr;

																			grandTotalArticleInToStation +=
																				totalArticleInToStation;

																			grandTotalWeightInToStation +=
																				totalWeightInToStation;

																			grandTotalChargeWeightInToStation +=
																				totalChargeWeightInToStation;

																			grandTotalToPayInToStation +=
																				selectedTotal.totalFreightToPay;
																			grandTotalToPaidInToStation +=
																				selectedTotal.totalFreightPaid;
																			grandTotalToTBBInToStation +=
																				selectedTotal.totalFreightTBB;

																			grandTotalInToStation +=
																				totalInToStation;

																			grandTotalVasuliInToStation +=
																				+totalVasuli;

																			return (
																				<>
																					<div
																						data-component='loading-memo'
																						className='table-row body-small'
																						ref={(
																							e
																						) => {
																							if (
																								e
																							) {
																								transitReportSummaryRowHeight.current.push(
																									{
																										rowHeight:
																											e.offsetHeight,
																										boookings:
																											array,
																									}
																								);
																							}
																						}}
																					>
																						<div
																							data-component='loading-memo'
																							className='container'
																						>
																							<div
																								data-component='loading-memo'
																								className='columns-6 body-small'
																							>
																								{
																									array[0]
																										.toBranch
																								}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-12 body-small align-center'
																							>
																								{
																									totalLr
																								}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-center'
																							>
																								{
																									totalArticleInToStation
																								}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-8 body-small align-center'
																							>
																								{
																									totalWeightInToStation
																								}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-8 body-small align-center'
																							>
																								{
																									totalChargeWeightInToStation
																								}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-right'
																							>
																								{(+selectedTotal.totalFreightToPay).toFixed(
																									2
																								)}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-right'
																							>
																								{(+selectedTotal.totalFreightPaid).toFixed(
																									2
																								)}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-right'
																							>
																								{(+selectedTotal.totalFreightTBB).toFixed(
																									2
																								)}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-right'
																							>
																								{`${(+totalVasuli).toFixed(
																									2
																								)}`}
																							</div>
																						</div>
																					</div>
																				</>
																			);
																		}
																	)}

																	{transitReportRemainingBookingsSummary.length ===
																		0 && (
																			<div
																				data-component='loading-memo'
																				className='middle-section'
																			>
																				<div
																					data-component='loading-memo'
																					className='container table-head'
																				>
																					<div
																						data-component='loading-memo'
																						className='columns-6 body-small'
																					>
																						Total
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-12 body-small align-center'
																					>
																						{
																							grandTotalLrInToStation
																						}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-10 body-small align-center'
																					>
																						{
																							grandTotalArticleInToStation
																						}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-8 body-small align-center'
																					>
																						{
																							grandTotalWeightInToStation
																						}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-8 body-small align-center'
																					>
																						{
																							grandTotalChargeWeightInToStation
																						}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-10 body-small align-right'
																					>
																						{(+grandTotalToPayInToStation).toFixed(
																							2
																						)}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-10 body-small align-right'
																					>
																						{(+grandTotalToPaidInToStation).toFixed(
																							2
																						)}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-10 body-small align-right'
																					>
																						{(+grandTotalToTBBInToStation).toFixed(
																							2
																						)}
																					</div>
																					<div
																						data-component='loading-memo'
																						className='columns-10 body-small align-right'
																					>
																						{(+grandTotalVasuliInToStation).toFixed(
																							2
																						)}
																					</div>
																				</div>
																			</div>
																		)}
																</>
															);
														})}
												</div>
											</div>
										</>
									)}
								</div>
							);
						})}
						{transitReportRemainingBookingsSummary &&
							transitReportRemainingBookingsSummary.length !==
							0 && (
								<>
									{transitReportRemainingBookingsSummary.map(
										(data, index) => {
											let finalTotalLr = 0;
											let finalTotalArticle = 0;
											let finalTotalWeight = 0;
											let finalTotalChargeWeight = 0;
											let finalTotalToPay = 0;
											let finalTotalToPaid = 0;
											let finalTotalToTBB = 0;
											let finalTotalVasuli = 0;

											for (
												let i = 0;
												i < transitReport.length;
												i++
											) {
												const thisBooking =
													transitReport[i];

												const totals =
													thisBooking.reduce(
														(acc, booking) => {
															booking.bookingDetails.forEach(
																(detail) => {
																	let prevArticles =
																		new Decimal(
																			acc.totalArticle
																		);
																	let article =
																		new Decimal(
																			+detail.article
																		);
																	let totalArticle =
																		+prevArticles.plus(
																			article
																		);

																	acc.totalArticle =
																		totalArticle;

																	let prevWeight =
																		new Decimal(
																			acc.totalWeight
																		);

																	let weight =
																		new Decimal(
																			+detail.weight
																		);

																	let totalWeight =
																		+prevWeight.plus(
																			weight
																		);
																	acc.totalWeight =
																		totalWeight;

																	let prevChargeWeight =
																		new Decimal(
																			acc.totalChargeWeight
																		);

																	let chargeWeight =
																		new Decimal(
																			+detail.chargeWeight
																		);

																	let totalChargeWeight =
																		+prevChargeWeight.plus(
																			chargeWeight
																		);
																	acc.totalChargeWeight =
																		totalChargeWeight;
																}
															);

															if (
																booking.paymentType ===
																1
															) {
																let prevFreightToPay =
																	new Decimal(
																		acc.totalFreightToPay
																	);
																let freight =
																	new Decimal(
																		+booking.grandTotal
																	);
																let totalFreightToPay =
																	+prevFreightToPay.plus(
																		freight
																	);
																acc.totalFreightToPay =
																	totalFreightToPay;
															} else if (
																booking.paymentType ===
																2
															) {
																let prevFreightPaid =
																	new Decimal(
																		acc.totalFreightPaid
																	);
																let freight =
																	new Decimal(
																		+booking.grandTotal
																	);
																let totalFreightPaid =
																	+prevFreightPaid.plus(
																		freight
																	);
																acc.totalFreightPaid =
																	totalFreightPaid;
															} else if (
																booking.paymentType ===
																3
															) {
																let prevFreightTBB =
																	new Decimal(
																		acc.totalFreightTBB
																	);
																let freight =
																	new Decimal(
																		+booking.grandTotal
																	);
																let totalFreightTBB =
																	+prevFreightTBB.plus(
																		freight
																	);
																acc.totalFreightTBB =
																	totalFreightTBB;
															}
															return acc;
														},
														{
															totalArticle: 0,
															totalWeight: 0,
															totalChargeWeight: 0,
															totalFreightToPay: 0,
															totalFreightPaid: 0,
															totalFreightTBB: 0,
														}
													);

												const totalVasuli = new Decimal(
													+totals.totalFreightToPay
												)
													.plus(
														+totals.totalFreightPaid
													)
													.plus(
														+totals.totalFreightTBB
													);

												finalTotalLr =
													finalTotalLr +
													thisBooking.length;
												finalTotalArticle =
													finalTotalArticle +
													totals.totalArticle;
												finalTotalWeight =
													finalTotalWeight +
													totals.totalWeight;
												finalTotalChargeWeight =
													finalTotalChargeWeight +
													totals.totalChargeWeight;
												finalTotalToPay =
													finalTotalToPay +
													totals.totalFreightToPay;
												finalTotalToPaid =
													finalTotalToPaid +
													totals.totalFreightPaid;
												finalTotalToTBB =
													finalTotalToTBB +
													totals.totalFreightTBB;
												finalTotalVasuli =
													finalTotalVasuli +
													+totalVasuli;
											}

											return (
												<div
													data-component='loading-memo'
													className='page transit-print'
												>
													<div
														data-component='loading-memo'
														className='body-small'
													>
														Page No.
														{transitReport.length +
															(index + 1)}
													</div>
													<div data-component="loading-memo" className="head-container">
													<div
														data-component='loading-memo'
														className='logo-container'
													>
														<img
															data-component='loading-memo'
															className='logo'
															src={Logo}
														/>
													</div>
													<div
														data-component='loading-memo'
														className='headline title-large'
													>
														{company?.companyName
															? company?.companyName
															: '--'}
														<div
															data-component='loading-memo'
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
															data-component='loading-memo'
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
														data-component='loading-memo'
														className='text body-small'
													>
														MOTOR REPORT
													</div>
													<div
														data-component='loading-memo'
														className='top-section'
													>
														<div
															data-component='loading-memo'
															className='container highlighted-row'
														>
															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-small'
																	>
																		LDM
																		Number:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-small'
																	>
																		{loadingMemo.ldmNo
																			? loadingMemo.ldmNo
																			: '--'}
																	</div>
																</div>
															</div>

															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-small'
																	>
																		From:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-small bold-text'
																	>
																		{userBranchDetails?.name
																			? userBranchDetails?.name
																			: '--'}
																	</div>
																</div>
															</div>
															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-small'
																	>
																		To:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-small bold-text'
																	>
																		{loadingMemo.toStationId
																			? findObjectInArray(
																				[
																					...deliveryBranches,
																					...bookingBranches,
																				],
																				'branchId',
																				loadingMemo.toStationId
																			)
																				.name
																			: '--'}
																	</div>
																</div>
															</div>
														</div>
														<div
															data-component='loading-memo'
															className='container'
														>
															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-medium'
																	>
																		Truck
																		Number:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-medium'
																	>
																		{loadingMemo.truckNo
																			? loadingMemo.truckNo
																			: '--'}
																	</div>
																</div>
															</div>
															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-medium'
																	>
																		Driver
																		Name:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-medium'
																	>
																		{loadingMemo.driverName
																			? loadingMemo.driverName
																			: '--'}
																	</div>
																</div>
															</div>
															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-medium'
																	>
																		Driver
																		Contact
																		No.:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-medium'
																	>
																		{loadingMemo.driverContactNo
																			? loadingMemo.driverContactNo
																			: '--'}
																	</div>
																</div>
															</div>
														</div>
														<div
															data-component='loading-memo'
															className='container'
														>
															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-medium'
																	>
																		Date:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-medium'
																	>
																		{loadingMemo.ldmDate
																			? format(
																				loadingMemo.ldmDate,
																				'dd-MM-yyyy'
																			)
																			: '--'}
																	</div>
																</div>
															</div>
															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-medium'
																	>
																		Broker
																		Name:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-medium'
																	>
																		{loadingMemo.brokerName
																			? loadingMemo.brokerName
																			: '--'}
																	</div>
																</div>
															</div>
															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-medium'
																	>
																		Broker
																		Contact
																		No.:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-medium'
																	>
																		{loadingMemo.brokerContactNo
																			? loadingMemo.brokerContactNo
																			: '--'}
																	</div>
																</div>
															</div>
														</div>
														<div
															data-component='loading-memo'
															className='container'
														>
															<div
																data-component='loading-memo'
																className='columns-3'
															>
																<div
																	data-component='loading-memo'
																	className='value-container'
																>
																	<div
																		data-component='loading-memo'
																		className='label body-medium'
																	>
																		CEway
																		Bill
																		No.:
																	</div>
																	<div
																		data-component='loading-memo'
																		className='value body-medium'
																	>
																		{loadingMemo.consolidateEWayBillNo
																			? loadingMemo.consolidateEWayBillNo
																			: '--'}
																	</div>
																</div>
															</div>
															<div
																data-component='loading-memo'
																className='columns-3'
															></div>
															<div
																data-component='loading-memo'
																className='columns-3'
															></div>
														</div>
													</div>

													<div
														data-component='loading-memo'
														className='summary-container'
													>
														<div
															data-component='loading-memo'
															className='middle-section'
															style={{
																margin: '24px 0 0 0',
															}}
														>
															<div
																data-component='loading-memo'
																className='container table-head'
															>
																<div
																	data-component='loading-memo'
																	className='columns-6 body-small'
																>
																	To
																</div>
																<div
																	data-component='loading-memo'
																	className='columns-12 body-small align-center'
																>
																	LR
																</div>
																<div
																	data-component='loading-memo'
																	className='columns-10 body-small align-center'
																>
																	Article
																</div>
																<div
																	data-component='loading-memo'
																	className='columns-8 body-small align-center'
																>
																	Actual
																	Weight
																</div>
																<div
																	data-component='loading-memo'
																	className='columns-8 body-small align-center'
																>
																	Charge
																	Weight
																</div>
																<div
																	data-component='loading-memo'
																	className='columns-10 body-small align-right'
																>
																	TOPAY
																</div>
																<div
																	data-component='loading-memo'
																	className='columns-10 body-small align-right'
																>
																	PAID
																</div>
																<div
																	data-component='loading-memo'
																	className='columns-10 body-small align-right'
																>
																	TBB
																</div>
																<div
																	data-component='loading-memo'
																	className='columns-10 body-small align-right'
																>
																	Vasuli
																</div>
															</div>
														</div>

														<div
															data-component='loading-memo'
															className='summary-rows-container'
														>
															{new Array(1)
																.fill(null)
																.map(() => {
																	let grandTotalLrInToStation = 0;
																	let grandTotalArticleInToStation = 0;
																	let grandTotalWeightInToStation = 0;
																	let grandTotalChargeWeightInToStation = 0;
																	let grandTotalToPayInToStation = 0;
																	let grandTotalToPaidInToStation = 0;
																	let grandTotalToTBBInToStation = 0;
																	let grandTotalInToStation = 0;
																	let grandTotalVasuliInToStation = 0;

																	// const allBookingsToDisplay =
																	// 	[];

																	// for (
																	// 	let i = 0;
																	// 	i <
																	// 	gdmBookings.length;
																	// 	i++
																	// ) {
																	// 	const thisBookings =
																	// 		gdmBookings[
																	// 			i
																	// 		];

																	// 	for (
																	// 		let i = 0;
																	// 		i <
																	// 		thisBookings.length;
																	// 		i++
																	// 	) {
																	// 		const bookings =
																	// 			thisBookings[
																	// 				i
																	// 			];
																	// 		allBookingsToDisplay.push(
																	// 			bookings
																	// 		);
																	// 	}
																	// }

																	// const groupedBookings: {
																	// 	[
																	// 		key: number
																	// 	]: any[];
																	// } = {};

																	// allBookingsToDisplay.forEach(
																	// 	(
																	// 		booking
																	// 	) => {
																	// 		const {
																	// 			toBranchId,
																	// 		} =
																	// 			booking;

																	// 		if (
																	// 			!groupedBookings[
																	// 				toBranchId
																	// 			]
																	// 		) {
																	// 			groupedBookings[
																	// 				toBranchId
																	// 			] =
																	// 				[];
																	// 		}

																	// 		groupedBookings[
																	// 			toBranchId
																	// 		].push(
																	// 			booking
																	// 		);
																	// 	}
																	// );

																	// let result: BookingInterface[][] =
																	// 	Object.values(
																	// 		groupedBookings
																	// 	).reverse();

																	// const orderByToBranch =
																	// 	(
																	// 		bookings: BookingInterface[][]
																	// 	): BookingInterface[][] => {
																	// 		let result =
																	// 			bookings.sort(
																	// 				(
																	// 					a,
																	// 					b
																	// 				) =>
																	// 					a[0].toBranch
																	// 						.toUpperCase()
																	// 						.localeCompare(
																	// 							b[0].toBranch.toUpperCase()
																	// 						)
																	// 			);

																	// 		return result;
																	// 	};

																	// result =
																	// 	orderByToBranch(
																	// 		result
																	// 	);

																	return (
																		<>
																			{data.map(
																				(
																					array
																				) => {
																					let totalArticleInToStation = 0;
																					let totalWeightInToStation = 0;
																					let totalChargeWeightInToStation = 0;
																					let totalInToStation = 0;
																					let totalLr =
																						array.length;

																					array.map(
																						(
																							row
																						) => {
																							let totalArticleInRow =
																								row.bookingDetails.reduce(
																									(
																										sum: any,
																										detail: any
																									) =>
																										sum +
																										detail.article,
																									0
																								);

																							let totalWeightInRow =
																								row.bookingDetails.reduce(
																									(
																										sum: any,
																										detail: any
																									) =>
																										sum +
																										detail.weight,
																									0
																								);

																							let totalChargeWeightInRow =
																								row.bookingDetails.reduce(
																									(
																										sum: any,
																										detail: any
																									) =>
																										sum +
																										detail.chargeWeight,
																									0
																								);

																							totalWeightInToStation +=
																								totalWeightInRow;

																							totalChargeWeightInToStation +=
																								totalChargeWeightInRow;

																							totalArticleInToStation +=
																								totalArticleInRow;

																							totalInToStation +=
																								row.grandTotal
																									? row.grandTotal
																									: 0;
																						}
																					);

																					const selectedTotal =
																						array.reduce(
																							(
																								acc,
																								booking
																							) => {
																								if (
																									booking.paymentType ===
																									1
																								) {
																									let prevFreightToPay =
																										new Decimal(
																											acc.totalFreightToPay
																										);
																									let freight =
																										new Decimal(
																											+booking.grandTotal
																										);
																									let totalFreightToPay =
																										+prevFreightToPay.plus(
																											freight
																										);
																									acc.totalFreightToPay =
																										totalFreightToPay;
																								} else if (
																									booking.paymentType ===
																									2
																								) {
																									let prevFreightPaid =
																										new Decimal(
																											acc.totalFreightPaid
																										);
																									let freight =
																										new Decimal(
																											+booking.grandTotal
																										);
																									let totalFreightPaid =
																										+prevFreightPaid.plus(
																											freight
																										);
																									acc.totalFreightPaid =
																										totalFreightPaid;
																								} else if (
																									booking.paymentType ===
																									3
																								) {
																									let prevFreightTBB =
																										new Decimal(
																											acc.totalFreightTBB
																										);
																									let freight =
																										new Decimal(
																											+booking.grandTotal
																										);
																									let totalFreightTBB =
																										+prevFreightTBB.plus(
																											freight
																										);
																									acc.totalFreightTBB =
																										totalFreightTBB;
																								}
																								return acc;
																							},
																							{
																								totalFreightToPay: 0,
																								totalFreightPaid: 0,
																								totalFreightTBB: 0,
																							}
																						);

																					const totalVasuli =
																						new Decimal(
																							+selectedTotal.totalFreightToPay
																						)
																							.plus(
																								+selectedTotal.totalFreightPaid
																							)
																							.plus(
																								+selectedTotal.totalFreightTBB
																							);

																					grandTotalLrInToStation +=
																						totalLr;
																					grandTotalArticleInToStation +=
																						totalArticleInToStation;
																					grandTotalWeightInToStation +=
																						totalWeightInToStation;
																					grandTotalChargeWeightInToStation +=
																						totalChargeWeightInToStation;
																					grandTotalToPayInToStation +=
																						selectedTotal.totalFreightToPay;
																					grandTotalToPaidInToStation +=
																						selectedTotal.totalFreightPaid;
																					grandTotalToTBBInToStation +=
																						selectedTotal.totalFreightTBB;
																					grandTotalInToStation +=
																						totalInToStation;
																					grandTotalVasuliInToStation +=
																						+totalVasuli;

																					return (
																						<>
																							<div
																								data-component='loading-memo'
																								className='table-row body-small'
																							// ref={(
																							// 	e
																							// ) => {
																							// 	if (
																							// 		e
																							// 	) {
																							// 		transitReportSummaryRowHeight.current.push(
																							// 			{
																							// 				rowHeight:
																							// 					e.offsetHeight,
																							// 				boookings:
																							// 					array,
																							// 			}
																							// 		);
																							// 	}
																							// }}
																							>
																								<div
																									data-component='loading-memo'
																									className='container'
																								>
																									<div
																										data-component='loading-memo'
																										className='columns-6 body-small'
																									>
																										{
																											array[0]
																												.toBranch
																										}
																									</div>
																									<div
																										data-component='loading-memo'
																										className='columns-12 body-small align-center'
																									>
																										{
																											totalLr
																										}
																									</div>
																									<div
																										data-component='loading-memo'
																										className='columns-10 body-small align-center'
																									>
																										{
																											totalArticleInToStation
																										}
																									</div>
																									<div
																										data-component='loading-memo'
																										className='columns-8 body-small align-center'
																									>
																										{
																											totalWeightInToStation
																										}
																									</div>
																									<div
																										data-component='loading-memo'
																										className='columns-8 body-small align-center'
																									>
																										{
																											totalChargeWeightInToStation
																										}
																									</div>
																									<div
																										data-component='loading-memo'
																										className='columns-10 body-small align-right'
																									>
																										{(+selectedTotal.totalFreightToPay).toFixed(
																											2
																										)}
																									</div>
																									<div
																										data-component='loading-memo'
																										className='columns-10 body-small align-right'
																									>
																										{(+selectedTotal.totalFreightPaid).toFixed(
																											2
																										)}
																									</div>
																									<div
																										data-component='loading-memo'
																										className='columns-10 body-small align-right'
																									>
																										{(+selectedTotal.totalFreightTBB).toFixed(
																											2
																										)}
																									</div>
																									<div
																										data-component='loading-memo'
																										className='columns-10 body-small align-right'
																									>
																										{`${(+totalVasuli).toFixed(
																											2
																										)}`}
																									</div>
																								</div>
																							</div>
																						</>
																					);
																				}
																			)}

																			{transitReportRemainingBookingsSummary.length ===
																				index +
																				1 && (
																					<div
																						data-component='loading-memo'
																						className='middle-section'
																					>
																						<div
																							data-component='loading-memo'
																							className='container table-head'
																						>
																							<div
																								data-component='loading-memo'
																								className='columns-6 body-small'
																							>
																								Total
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-12 body-small align-center'
																							>
																								{
																									finalTotalLr
																								}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-center'
																							>
																								{
																									finalTotalArticle
																								}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-8 body-small align-center'
																							>
																								{
																									finalTotalWeight
																								}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-8 body-small align-center'
																							>
																								{
																									finalTotalChargeWeight
																								}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-right'
																							>
																								{(+finalTotalToPay).toFixed(
																									2
																								)}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-right'
																							>
																								{(+finalTotalToPaid).toFixed(
																									2
																								)}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-right'
																							>
																								{(+finalTotalToTBB).toFixed(
																									2
																								)}
																							</div>
																							<div
																								data-component='loading-memo'
																								className='columns-10 body-small align-right'
																							>
																								{(+finalTotalVasuli).toFixed(
																									2
																								)}
																							</div>
																						</div>
																					</div>
																				)}
																		</>
																	);
																})}
														</div>
													</div>
												</div>
											);
										}
									)}
								</>
							)}
					</div>
				)}
		</>
	);
});

// -------------------------------------------------------------------------------------------

export default LoadingMemo;

// -------------------------------------------------------------------------------------------
