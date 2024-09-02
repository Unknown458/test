// -------------------------------------------------------------------------------------------

import './Booking.scss';

import { format } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import Decimal from 'decimal.js';
import {
	MaterialReactTable,
	MRT_ColumnDef,
	MRT_RowData,
	useMaterialReactTable,
} from 'material-react-table';
import QRCode from 'qrcode';
import { memo, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Add, Close, DeleteOutline, EditOutlined, } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
	Autocomplete,
	Button,
	CircularProgress,
	createFilterOptions,
	Divider,
	FormControl,
	FormHelperText,
	IconButton,
	InputAdornment,
	InputLabel,
	MenuItem,
	OutlinedInput,
	Select,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import masterGstErrorCodes from '../../../app/masterGstErrorCodes';
import Alert from '../../../components/Alert/Alert';
import {
	AlertInterface,
	AlertStates,
} from '../../../components/Alert/Alert.types';
import { useApi } from '../../../contexts/Api/Api';
import { useApp } from '../../../contexts/App/App';
import { useAuth } from '../../../contexts/Auth/Auth';
import { ArticleShapeInterface } from '../../../services/articleShape/articleShape.types';
import {
	createBookingAsync,
	deleteBookingAsync,
	getFormTypesAsync,
	getNextLRNumberAsync,
	updateBookingAsync,
} from '../../../services/booking/booking';
import {
	BookingDetailsInterface,
	BookingInterface,
	BookingTypeInterface,
	FormTypeInterface,
} from '../../../services/booking/booking.types';
import { getBranchByIdAsync } from '../../../services/branch/branch';
import {
	BranchInterface,
	StateInterface,
} from '../../../services/branch/branch.types';
import { BillTypeInterface } from '../../../services/branchLrNumber/branchLrNumber.types';
import { GoodsTypeInterface } from '../../../services/goodsType/goodsType.types';
import { getEwayBillDetails, getGSTINdetails } from '../../../services/gst/gst';
import { createPartyAsync } from '../../../services/party/party';
import {
	PartyInterface,
	PaymentTypeInterface,
} from '../../../services/party/party.types';
import {
	getCompanyQuotationsByBranchAsync,

	getQuotationsByPartyAsync,
	getRateTypeAsync,
} from '../../../services/quotation/quotation';
import {
	QuotationInterface,
	RateTypeInterface,
} from '../../../services/quotation/quotation.types';
import { getAllUserByCompanyAsync } from '../../../services/user/user';
import { UserInterface } from '../../../services/user/user.types';
import addIndex from '../../../utils/addIndex';
import findObjectInArray from '../../../utils/findObjectInArray';
import printPDF from '../../../utils/printPDF';

// -------------------------------------------------------------------------------------------

const defaultArticleRateTypeId = 2;
const defaultLabourRateTypeId = 2;

const defaultTableRow = {
	bookingDetailId: '',
	bookingId: '',
	lrNumber: '',
	goodsType: '',
	shape: '',
	articleRateTypeId: defaultArticleRateTypeId,
	article: '',
	rate: '',
	weight: '',
	chargeWeight: '',
	labourRateTypeId: defaultLabourRateTypeId,
	labourRate: 0,
	totalLabour: 0,
	freight: '',
};

const defaultFormData: BookingInterface = {
	billTypeId: 1,
	bookingId: 0,
	fromBranchId: 0,
	toBranchId: 0,
	pinCode: 0,
	fromBranch: '',
	bookingTypeId: 1,
	toBranch: '',
	exportTo: '',
	lrNumber: '',
	bookingDate: new Date().toISOString(),
	eWayBillNumber: '',
	consignorId: 0,
	consignorGST: '',
	consignor: '',
	consignorPhone: '',
	consigneeId: 0,
	status: 0,
	consigneeGST: '',
	consignee: '',
	consigneePhone: '',
	quotationBy: 'Consignee',
	paymentType: 1,
	goodsTypeId: 0,
	goodsType: '',
	invoiceNumber: '',
	declaredValue: '',
	privateMark: '',
	goodsReceivedBy: '',
	mode: 'GODOWN',
	note: '',
	freight: 0,
	lrCharge: 0,
	labour: 0,
	aoc: 0,
	collection: 0,
	doorDelivery: 0,
	oloc: 0,
	insurance: 0,
	other: 0,
	carrierRisk: 0,
	bhCharge: 0,
	fov: 0,
	cartage: 0,
	total: 0,
	sgst: 0,
	cgst: 0,
	igst: 0,
	grandTotal: 0,
	addedBy: 0,
	bookingDetails: [],
	transporterName: '',
	transporterPhone: '',
	truckNumber: '',
};

const defaultFormError = {
	toBranch: '',
	consignorGST: '',
	consignor: '',
	consignorPhone: '',
	consigneeGST: '',
	consignee: '',
	consigneePhone: '',
	paymentType: '',
	goodsTypeId: '',
	shape: '',
	invoiceNumber: '',
	declaredValue: '',
	privateMark: '',
	goodsReceivedBy: '',
	mode: '',
	transporterName: '',
	transporterPhone: '',
	articleRateTypeId: '',
	article: '',
	doorDelivery: '',
	rate: '',
	weight: '',
	chargeWeight: '',
	labourRateTypeId: '',
	labourRate: '',
	eWayBillNumber: '',
};

const defaultEnterConsignorName = {
	partyName: '',
};

const defaultEnterConsigneeName = {
	partyName: '',
};

const consignorFilter = createFilterOptions<any>();
const consigneeFilter = createFilterOptions<any>();

// -------------------------------------------------------------------------------------------

const Booking = memo(() => {
	const { setTitle } = useApp();

	useEffect(() => {
		setTitle('Booking');

		document.getElementById('eway-bill-number')?.focus();
	}, [setTitle]);

	const location = useLocation();
	const navigate = useNavigate();
	const [userDetails, setUserDetails] = useState<UserInterface | null>();
	const [articleShape, setArticleShape] = useState<ArticleShapeInterface[]>(
		[]
	);


	const [states, _setStates] = useState<StateInterface[]>([]);
	const [currentBillType, setCurrentBillType] = useState<BillTypeInterface>({
		billType: 'Bill',
		billTypeId: 1,
	});
	const [qr, setQr] = useState('');
	const [eWayNumbers, seteWayNumbers] = useState(['']);
	const [quotations, setQuotations] = useState<QuotationInterface[]>([]);
	const [goodsType, setGoodsType] = useState<GoodsTypeInterface[]>([]);
	const [paymentTypes, setPaymentTypes] = useState<PaymentTypeInterface[]>(
		[]
	);
	const [isAdmin, setIsAdmin] = useState(false);

	const [consignors, setConsignors] = useState<PartyInterface[]>([]);
	const [consignees, setConsignees] = useState<PartyInterface[]>([]);
	const [bookingTypes, setBookingTypes] = useState<BookingTypeInterface[]>(
		[]
	);
	const [rateTypes, setRateTypes] = useState<RateTypeInterface[]>([]);
	const [formTypes, setFormTypes] = useState<FormTypeInterface[]>([]);
	const [billTypes, _setBillTypes] = useState<BillTypeInterface[]>([]);
	const [currentTime, setCurrentTime] = useState(new Date());

	const [isConsignorHasQuotation, setIsConsignorHasQuotation] =
		useState<boolean>(false);
	const [isConsigneeHasQuotation, setIsConsigneeHasQuotation] =
		useState<boolean>(false);

	const [isFormLoading, setIsFormLoading] = useState<boolean>(false);
	const [isSubmitDisabled, _setIsSubmitDisabled] = useState<boolean>(false);
	// const [gotDataFromEwaybill, setGotDataFromEwaybill] =
	// 	useState<boolean>(false);

	const { handleLogout } = useAuth();

	const {
		getUserDetails,
		getBillTypes,
		getGoodsTypes,
		getPaymentTypes,
		getArticleShapes,
		getAllActiveDeliveryBranches,
		getAllActiveConsignorsByCompany,
		getAllActiveConsigneesByCompany,
		getBookingTypes,
		getStates,
		setAllConsignorsByCompany,
		setAllConsigneesByCompany,
	} = useApi();

	const [currConsignorQuotation, setCurrConsignorQuotation] = useState<any[]>([]);
	const [consignorArticleShape, setConsignorArticleShape] = useState<ArticleShapeInterface[]>([]);


	const [allActiveUsers, setAllActiveUsers] = useState<UserInterface[]>([]);
	const [activeDeliveryBranches, setActiveDeliveryBranches] = useState<
		BranchInterface[]
	>([]);
	const [consignor, setConsignor] = useState<PartyInterface>();
	const [consignee, setConsignee] = useState<PartyInterface>();

	const [newConsignor, setNewConsignor] = useState<PartyInterface | null>(
		null
	);
	const [newConsignee, setNewConsignee] = useState<PartyInterface | null>(
		null
	);

	const [formData, setformData] = useState<BookingInterface>(defaultFormData);
	const [formCopy, setFormCopy] = useState<BookingInterface>(defaultFormData);
	const [formError, setformError] = useState(defaultFormError);

	const [userBranchDetails, setUserBranchDetails] =
		useState<BranchInterface>();
	const [tableRowCopy, setTableRowCopy] = useState<BookingDetailsInterface>({ ...defaultTableRow })
	const [tableRow, setTableRow] = useState<BookingDetailsInterface>({
		...defaultTableRow,
	});
	const [tableRowEditMode, setTableRowEditMode] = useState(false);
	const [alertDialog, setAlertDialog] = useState<AlertInterface>({
		state: 'success',
		label: '',
		isActive: false,
	});

	const [_isConsignorAutoFilled, setIsConsignorAutoFilled] = useState(false);
	const [_isConsigneeAutoFilled, setIsConsigneeAutoFilled] = useState(false);

	// const [isToBranchDisabled, setIsToBranchDisabled] = useState(false);

	const [isEwayLoading, setIsEwayLoading] = useState(false);
	const [isConsignorLoading, setIsConsignorLoading] = useState(false);
	const [isConsigneeLoading, setIsConsigneeLoading] = useState(false);

	const [enterConsignorName, setEnterConsignorName] = useState<any | null>(
		defaultEnterConsignorName
	);
	const [enterConsigneeName, setEnterConsigneeName] = useState<any | null>(
		defaultEnterConsigneeName
	);
	const [_isQuotationFromParty, setIsQuotationFromParty] =
		useState<boolean>(false);



	useEffect(() => {
		setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);
		initialFetch();

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.altKey && (event.key === 's' || event.key === 'S')) {
				event.preventDefault();
				document.getElementById('save-button')?.click();
			}

			if (event.altKey && (event.key === 'p' || event.key === 'P')) {
				event.preventDefault();
				document.getElementById('save-print-button')?.click();
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, []);

	const initialFetch = async () => {
		const billTypeData = await getBillTypes();
		const statesData = await getStates();

		if (billTypeData.length !== 0) {
			_setBillTypes(billTypeData);
			_setStates(statesData);
		}
	};





	// ---------------Calling on Load Function ----------
	const getOnload = async () => {
		let goodsType = await getGoodsTypes();
		let allActiveDeliveryBranches = await getAllActiveDeliveryBranches();
		let allActiveConsignorsByCompany =
			await getAllActiveConsignorsByCompany();
		let allActiveConsigneesByCompany =
			await getAllActiveConsigneesByCompany();

		goodsType = goodsType.map((type) => ({
			...type,
			label: type.goodsType,
		}));
		setGoodsType(goodsType),
			(allActiveDeliveryBranches = allActiveDeliveryBranches.map(
				(branch) => ({
					...branch,
					label: branch.name,
				})
			));
		setActiveDeliveryBranches(allActiveDeliveryBranches);

		allActiveConsignorsByCompany = allActiveConsignorsByCompany.map(
			(party) => ({
				...party,
				label: party.partyName ? party.partyName : '',
			})
		);
		setConsignors(allActiveConsignorsByCompany);

		allActiveConsigneesByCompany = allActiveConsigneesByCompany.map(
			(party) => ({
				...party,
				label: party.partyName ? party.partyName : '',
			})
		);
		setConsignees(allActiveConsigneesByCompany);

		const userDetailsData = await getUserDetails();

		if (userDetailsData.fullName) {
			setformData((prev) => ({
				...prev,
				goodsReceivedBy: userDetailsData.fullName,
			}));
		}

		await Promise.all([
			setUserDetails(userDetailsData),

			setArticleShape(await getArticleShapes()),
			setPaymentTypes(await getPaymentTypes()),
			handleGetAllActiveUserByCompany(),
			setBookingTypes(await getBookingTypes()),
			handleGetRateType(),
			handleGetFormTypes(),
		]);
		if (userDetails?.userTypeId === 1) {
			setIsAdmin(true);
		}

	};



	useEffect(() => {
		if (
			location.state &&
			activeDeliveryBranches &&
			consignors &&
			consignees
		) {
			setformError(defaultFormError);

			const bookingDetails = location.state
				.bookingDetails as BookingInterface;

			setformData({
				...bookingDetails,
				bookingDate: bookingDetails.bookingDate,
				bookingDetails: bookingDetails.bookingDetails.map(
					(row, index) => {
						return {
							...row,
							index: index,
						};
					}
				),
			});
			setFormCopy({
				...bookingDetails,
				bookingDate: bookingDetails.bookingDate,
				bookingDetails: bookingDetails.bookingDetails.map(
					(row, index) => {
						return {
							...row,
							index: index,
						};
					}
				),
			});





			setEnterConsignorName({
				partyName: bookingDetails.consignor
					? bookingDetails.consignor
					: '',
			});
			setEnterConsigneeName({
				partyName: bookingDetails.consignee
					? bookingDetails.consignee
					: '',
			});

			for (const deliveryBranch of activeDeliveryBranches) {
				if (deliveryBranch.branchId === bookingDetails.toBranchId) {
					setformData((prev) => ({
						...prev,
						transporterName: deliveryBranch.transporterName
							? deliveryBranch.transporterName
							: '',
						transporterPhone: deliveryBranch.transporterPhone
							? deliveryBranch.transporterPhone
							: '',
					}));
					return;
				} else {
					setformData((prev) => ({
						...prev,
						transporterName: '',
						transporterPhone: '',
					}));
				}
			}
		}
	}, [location.state, activeDeliveryBranches, consignors, consignees]);

	useEffect(() => {
		getOnload();

		if (userDetails) {
			handleGetBranchById(userDetails.branchId as number);

			if (consignors.length !== 0 && formData.fromBranchId) {
				const fromBranch = formData.fromBranchId;
				const fromBranchConsignors = consignors.filter(
					(consignor) => consignor.branchId === fromBranch
				);
				setConsignors(fromBranchConsignors);
			}

			if (consignees.length !== 0 && formData.toBranchId) {
				const toBranch = formData.toBranchId;
				const toBranchConsignees = consignees.filter(
					(consignee) => consignee.branchId === toBranch
				);
				setConsignees(toBranchConsignees);
			}
		}
	}, [userDetails, formData.fromBranchId, formData.toBranchId]);

	useEffect(() => {
		if (location.state) return;

		if (formData && formData.eWayBillNumber.length === 12) {
			handleGetEwayBillDetails(formData.eWayBillNumber);
		}
	}, [formData.eWayBillNumber]);

	useEffect(() => {
		if (location.state) return;

		if (formData && formData.consignorGST.length === 15) {
			for (const consignor of consignors) {
				if (consignor.gstNo === formData.consignorGST) {
					setformData((prev: any) => ({
						...prev,
						consignorGST: consignor.gstNo,
						consignor: consignor.partyName
							? consignor.partyName
							: '',
						consignorPhone: consignor.phoneNo,
						consignorId: consignor.partyId,
					}));
					setEnterConsignorName({
						partyName: consignor.partyName
							? consignor.partyName
							: '',
					});
					setConsignor(consignor);
					setIsConsignorAutoFilled(true);
					return;
				} else {
					if (!formData.eWayBillNumber) {
						setEnterConsignorName({
							partyName: '',
						});
					}
				}
			}

			if (!formData.eWayBillNumber) {
				handleGetConsignorGSTdetails(formData.consignorGST);
			}
		} else {
			setformData((prev: any) => ({
				...prev,
				consignorId: 0,
			}));

			setIsConsignorAutoFilled(false);
		}
	}, [formData.consignorGST]);

	useEffect(() => {
		if (location.state) return;

		if (formData && formData.consigneeGST.length === 15) {
			for (const consignee of consignees) {
				if (consignee.gstNo === formData.consigneeGST) {
					setformData((prev: any) => ({
						...prev,
						consigneeGST: consignee.gstNo,
						consignee: consignee.partyName
							? consignee.partyName
							: '',
						consigneePhone: consignee.phoneNo,
						consigneeId: consignee.partyId,
					}));
					setEnterConsigneeName({
						partyName: consignee.partyName
							? consignee.partyName
							: '',
					});
					setConsignee(consignee);
					setIsConsigneeAutoFilled(true);
					return;
				} else {
					if (!formData.eWayBillNumber) {
						setEnterConsigneeName({
							partyName: '',
						});
					}
				}
			}
			if (!formData.eWayBillNumber) {
				handleGetConsigneeGSTdetails(formData.consigneeGST);
			}
		} else {
			setformData((prev: any) => ({
				...prev,
				consigneeId: 0,
			}));

			setIsConsigneeAutoFilled(false);
		}
	}, [formData.consigneeGST]);

	useEffect(() => {
		if (formData.toBranchId) {
			for (const deliveryBranch of activeDeliveryBranches) {
				if (deliveryBranch.branchId === formData.toBranchId) {
					setformData((prev) => ({
						...prev,
						transporterName: deliveryBranch.transporterName
							? deliveryBranch.transporterName
							: '',
						transporterPhone: deliveryBranch.transporterPhone
							? deliveryBranch.transporterPhone
							: '',
						toBranchPhone: deliveryBranch.phone
							? deliveryBranch.phone
							: '',
					}));
					return;
				} else {
					setformData((prev) => ({
						...prev,
						transporterName: '',
						transporterPhone: '',
						toBranchPhone: '',
					}));
				}
			}
		}
	}, [formData.toBranchId]);


	useEffect(() => {



		if (tableRow.articleRateTypeId == 2) {

			if (tableRow.chargeWeight && tableRow.rate) {
				let a = new Decimal(+tableRow.rate);
				let b = new Decimal(+tableRow.chargeWeight);

				let value = +a.times(b);

				setTableRow((prev) => ({
					...prev,
					freight: value,
				}));
			} else {
				setTableRow((prev) => ({
					...prev,
					freight: tableRow.rate,
				}));
			}
		} else if (tableRow.articleRateTypeId == 1) {

			if (tableRow.article && tableRow.rate) {
				let a = new Decimal(+tableRow.rate);
				let b = new Decimal(+tableRow.article);

				let value = +a.times(b);

				setTableRow((prev) => ({
					...prev,
					freight: value,
				}));
			} else {
				setTableRow((prev) => ({
					...prev,
					freight: tableRow.rate,
				}));
			}
		} else if (tableRow.articleRateTypeId === 3 && tableRow.rate) {
			setTableRow((prev) => ({
				...prev,
				freight: tableRow.rate,
			}));
		}

		if (tableRow.labourRateTypeId == 2) {
			if (tableRow.labourRate && tableRow.chargeWeight) {
				let a = new Decimal(+tableRow.labourRate);
				let b = new Decimal(+tableRow.chargeWeight);

				let value = +a.times(b);

				setTableRow((prev) => ({
					...prev,
					totalLabour: value,
				}));
			} else {
				setTableRow((prev) => ({
					...prev,
					totalLabour: '',
				}));
			}
		} else if (tableRow.labourRateTypeId === 1) {
			if (tableRow.article && tableRow.labourRate) {
				let a = new Decimal(+tableRow.labourRate);
				let b = new Decimal(+tableRow.article);

				let value = +a.times(b);

				setTableRow((prev) => ({
					...prev,
					totalLabour: value,
				}));
			} else {
				setTableRow((prev) => ({
					...prev,
					totalLabour: '',
				}));
			}
		} else if (tableRow.labourRateTypeId === 3 && tableRow.labourRate) {
			setTableRow((prev) => ({
				...prev,
				totalLabour: tableRow.labourRate,
			}));
		}
	}, [
		tableRow.articleRateTypeId,
		tableRow.article,
		tableRow.chargeWeight,
		tableRow.rate,
		tableRow.labourRateTypeId,
		tableRow.labourRate,
	]);

	useEffect(() => {
		if (tableRow.weight && +tableRow.weight >= +tableRow.chargeWeight) {
			setTableRow((prev) => ({
				...prev,
				chargeWeight: tableRow.weight,
			}));
		}
	}, [tableRow.weight]);

	useEffect(() => {
		if (formData.bookingDetails) {
			let freightTotal: any = 0;

			for (let i = 0; i < formData.bookingDetails.length; i++) {
				const row = formData.bookingDetails[i];

				let a = new Decimal(freightTotal);
				let b = new Decimal(+row.freight);
				let value = +a.plus(b);

				freightTotal = value;
			}

			let totalLabour: number = 0;

			for (let i = 0; i < formData.bookingDetails.length; i++) {
				const row = formData.bookingDetails[i];

				let a = new Decimal(totalLabour);
				let b = new Decimal(+row.totalLabour);
				let value = +a.plus(b);

				totalLabour = value;
			}

			setformData((prev) => ({
				...prev,
				freight: freightTotal,
				// labour: totalLabour,
			}));
		}
	}, [formData.bookingDetails]);


	useEffect(() => {




		if (tableRow.article) {
			const x = choosedQuotation
				? choosedQuotation?.billRate || choosedQuotation?.rate
				: currConsignorQuotation.find(item => item.shapeId === null)?.rate || tableRow.rate
			const y = choosedQuotation
				? choosedQuotation?.rateType || choosedQuotation?.rateType

				: quotations.find(item => item.shapeId === null)?.rateType

			setTableRow((prev) => ({
				...prev,
				rate: x as number,
			}));
			setTableRow((prev) => ({
				...prev,
				articleRateTypeId: +y,
			}));

		}
	}, [tableRow.shape, formData.billTypeId, tableRow.articleRateTypeId])




	useEffect(() => {
		let quotationBy = formData.quotationBy;

		if (isConsignorHasQuotation && !isConsigneeHasQuotation) {
			quotationBy = 'Consignor';
		} else if (!isConsignorHasQuotation && isConsigneeHasQuotation) {
			quotationBy = 'Consignee';
		} else if (isConsignorHasQuotation && isConsigneeHasQuotation) {
			quotationBy = 'Consignee';
		} else {
			quotationBy = quotationBy;
		}

		setformData((prev) => ({
			...prev,
			quotationBy: quotationBy,
		}));
	}, [
		formData.consignorGST,
		formData.consigneeGST,
		isConsignorHasQuotation,
		isConsigneeHasQuotation,
	]);


	useEffect(() => {

		handleQuotationData();


	}, [
		formData.quotationBy,
		formData.consignorGST,
		formData.consigneeGST,
		consignor,
		formData.consigneeId,
		formData.consigneeGST,
		consignee,
		formData.fromBranchId,
		formData.billTypeId,
		newConsignor,
		newConsignee,
	]);


	useEffect(() => {

		setQuotations([]);
		setCurrConsignorQuotation([]);



		handleQuotationData();

	}, [formData.billTypeId]);


	useEffect(() => {

		const x = async () => {
			setQuotations([]);


			const companyQt: any = await getCompanyQuotationsByBranchAsync(userBranchDetails?.branchId as number, formData.toBranchId);
			const companyQuotations = Array.isArray(companyQt?.data.data)
				? companyQt.data.data
				: [companyQt.data.data];

			const filteredByBillQuoation = companyQuotations.filter((item: any) => item.billTypeId === formData.billTypeId)
			setQuotations(filteredByBillQuoation);





		}

		x();
	}, [formData.billTypeId])

	const handleQuotationData = async () => {

		if (quotations.length === 0 && formData.consigneeId !== 0 || formData.consigneeGST !== '') {
			if (quotations.find((item) => item.billRate === 0)) {
				const companyQt: any = await getCompanyQuotationsByBranchAsync(userBranchDetails?.branchId as number, formData.toBranchId);
				const companyQuotations = Array.isArray(companyQt?.data.data)
					? companyQt.data.data
					: [companyQt.data.data];

				const filteredByBillQuoation = companyQuotations.filter((item: any) => item.billTypeId === formData.billTypeId)
				setQuotations(filteredByBillQuoation);

			}


		}


		const consignorQuotations = consignor
			? await handleGetQuotationsByParty(consignor.partyId as number)
			: [];


		const consigneeQuotations = consignee
			? await handleGetQuotationsByParty(consignee.partyId as number)
			: [];

		const _isConsignorHasQuotation =
			consignorQuotations.length !== 0 ? true : false;
		const _isConsigneeHasQuotation =
			consigneeQuotations.length !== 0 ? true : false;

		setIsConsignorHasQuotation(_isConsignorHasQuotation);
		setIsConsigneeHasQuotation(_isConsigneeHasQuotation);

		if (
			formData.quotationBy === 'Consignor' &&
			consignor &&
			formData.consignorGST
		) {
			setformData((prev: any) => ({
				...prev,
				paymentType: consignor.paymentTypeId
					? consignor.paymentTypeId
					: 1,
				lrCharge: consignor.biltyCharge ? consignor.biltyCharge : 0,
			}));

			if (consignorQuotations.length !== 0) {
				setQuotations(consignorQuotations);
				setIsQuotationFromParty(true);
			} else {
				setIsQuotationFromParty(false);

				if (!userBranchDetails?.branchId) return;

				const companyQuotation =
					await handleGetCompanyQuotationsByBranch(
						userBranchDetails.branchId
					);

				setQuotations(companyQuotation);
			}
		} else if (
			formData.quotationBy === 'Consignee' &&
			consignee &&
			formData.consigneeGST
		) {
			setformData((prev: any) => ({
				...prev,
				paymentType: consignee.paymentTypeId
					? consignee.paymentTypeId
					: 1,
				lrCharge: consignee.biltyCharge ? consignee.biltyCharge : 0,
			}));

			if (consigneeQuotations.length !== 0) {

				setIsQuotationFromParty(true);
				setQuotations(consigneeQuotations);
			} else {
				setIsQuotationFromParty(false);
			}
		}




		if (location.state && location.state.bookingDetails) {

			if (formData.consignorId || formData.consignorGST && formData.quotationBy === 'Consignor') {
				const quotations = await handleGetQuotationsByParty(
					formData.consignorId
				);

				if (quotations.length !== 0) {
					setIsQuotationFromParty(true);
					setQuotations(quotations);
				} else {
					setIsQuotationFromParty(false);
				}
			}


			if (formData.consigneeId || formData.consigneeGST && formData.quotationBy === 'Consignee') {
				const quotations = await handleGetQuotationsByParty(
					formData.consigneeId
				);
				if (quotations.length !== 0) {
					setQuotations(quotations);
					setIsQuotationFromParty(true);
				} else {
					setIsQuotationFromParty(false);
				}
			}
		}

	};

	const updateQuotationsAndShapes = (
		quotations: any[],
		formData: BookingInterface,
		userBranchDetails: BranchInterface
	) => {

		const newQuotations: any[] = quotations.filter(
			(item) =>
				(item.toBranchId === formData?.toBranchId || item.toId === formData?.toBranchId) &&
				(item.fromBranchId === userBranchDetails?.branchId || item.fromId === userBranchDetails?.branchId)
		);


		setCurrConsignorQuotation((prevState) => {
			const updatedQuotations = [...prevState, ...newQuotations];

			const uniqueQuotations = Array.from(new Set(updatedQuotations.map(q => `${q.quotationId}-${q.shapeId}`)))
				.map(id => updatedQuotations.find(q => `${q.quotationId}-${q.shapeId}` === id)!);
			return uniqueQuotations;
		});

		let newArticleShapes: any[] = [];


		if (newQuotations.some((q) => q.shapeId === null || q.shapeId === undefined)) {
			newArticleShapes = articleShape;
		} else {
			newArticleShapes = newQuotations
				.map((currConsignorQuotation) =>
					articleShape.filter(item => item.articleShapeId === currConsignorQuotation.shapeId)
				)
				.flat();
		}

		// Set the article shapes in state, ensuring uniqueness
		setConsignorArticleShape((prevState) => {
			const updatedShapes = [...prevState, ...newArticleShapes];
			const uniqueShapes = Array.from(new Set(updatedShapes.map(s => s.articleShapeId)))
				.map(id => updatedShapes.find(s => s.articleShapeId === id)!);
			return uniqueShapes;
		});
	};



	const foundItem = consignorArticleShape.find(item => item.articleShape === tableRow.shape);
	let choosedQuotation: any = currConsignorQuotation.find(item => item.shapeId === foundItem?.articleShapeId);

	useEffect(() => {
		if (!choosedQuotation && foundItem) {
			choosedQuotation = currConsignorQuotation.find(item => item.shapeId === null || item.shapeId === undefined);
		}
	}, [foundItem, choosedQuotation])

	useEffect(() => {

		if (quotations && userBranchDetails) {
			updateQuotationsAndShapes(quotations, formData, userBranchDetails);
		}

	}, [quotations, currConsignorQuotation, eWayNumbers, formData.toBranchId, formData, userBranchDetails, formData.consigneeGST, formData.consignorGST]);




	useEffect(() => {
		fetchingAcEway();

	}, [formData.consigneeId !== 0, enterConsigneeName, formData.consigneeGST !== '', formData.toBranchId !== 0, consignee, consignor])

	const fetchingAcEway = async () => {

		if (quotations.length <= 0 && formData.eWayBillNumber !== '' || formData.consigneeId !== 0 || formData.consigneeGST !== '' || formData.consigneeGST || enterConsigneeName) {

			// if(quotations.find(q=>q.billRate !==0 )){
			const companyQt: any = await getCompanyQuotationsByBranchAsync(userBranchDetails?.branchId as number, formData.toBranchId);
			const companyQuotations = Array.isArray(companyQt?.data.data)
				? companyQt.data.data
				: [companyQt.data.data];


			setQuotations(companyQuotations)
			const filteredQt = companyQuotations.filter((item: any) => item.billTypeId === formData.billTypeId);
			setQuotations(filteredQt);


			// }
		}
	}



	useEffect(() => {
		setCurrConsignorQuotation([]);
		setConsignorArticleShape([])
		setQuotations([]);

		// setEnterConsignorName('')
		// setEnterConsigneeName('')
		// formData.consigneeGST = '';
		// formData.consignorGST = '';
		// formData.consigneePhone = '';
		// formData.consignorPhone = '';

		// console.log('Cleared')
	}, [formData.toBranchId]);


	// console.log(
	// 	'currConsignorQuotation', currConsignorQuotation,
	// 	'articleshape', consignorArticleShape,
	// 	'found', foundItem,
	// 	'choosedq', choosedQuotation,
	// 	'quotation', quotations
	// );







	useEffect(() => {
		const freight = new Decimal(formData.freight ? +formData.freight : 0);
		const lrCharge = new Decimal(
			formData.lrCharge ? +formData.lrCharge : 0
		);
		const labour = new Decimal(formData.labour ? +formData.labour : 0);
		const aoc = new Decimal(formData.aoc ? +formData.aoc : 0);
		const collection = new Decimal(
			formData.collection ? +formData.collection : 0
		);
		const doorDelivery = new Decimal(
			formData.doorDelivery ? +formData.doorDelivery : 0
		);
		const oloc = new Decimal(formData.oloc ? +formData.oloc : 0);
		const insurance = new Decimal(
			formData.insurance ? +formData.insurance : 0
		);
		const other = new Decimal(formData.other ? +formData.other : 0);
		const carrierRisk = new Decimal(
			formData.carrierRisk ? +formData.carrierRisk : 0
		);
		const bhCharge = new Decimal(
			formData.bhCharge ? +formData.bhCharge : 0
		);
		const fov = new Decimal(formData.fov ? +formData.fov : 0);
		const cartage = new Decimal(formData.cartage ? +formData.cartage : 0);
		const sgst = new Decimal(formData.sgst ? +formData.sgst : 0);
		const cgst = new Decimal(formData.cgst ? +formData.cgst : 0);
		const igst = new Decimal(formData.igst ? +formData.igst : 0);

		let values = [
			freight,
			lrCharge,
			labour,
			aoc,
			collection,
			doorDelivery,
			oloc,
			insurance,
			other,
			carrierRisk,
			bhCharge,
			fov,
			cartage,
			sgst,
			cgst,
			igst,
		];

		let sum = new Decimal(0);

		values.forEach((value) => {
			sum = sum.plus(new Decimal(value));
		});

		setformData((prev) => ({
			...prev,
			total: +sum,
			grandTotal: +sum,
		}));
	}, [
		formData.freight,
		formData.lrCharge,
		formData.labour,
		formData.aoc,
		formData.collection,
		formData.doorDelivery,
		formData.oloc,
		formData.insurance,
		formData.other,
		formData.carrierRisk,

		formData.bhCharge,
		formData.fov,
		formData.cartage,
		formData.sgst,
		formData.cgst,
		formData.igst,
	]);

	useEffect(() => {
		if (formData.billTypeId && formData.toBranchId && !location.state) {
			handleGetNextLrNumber();
			validatetoBranch();
		}
	}, [formData.billTypeId, formData.toBranchId]);

	useEffect(() => {
		if (formData.goodsTypeId && quotations) {
			const filteredQuotation: QuotationInterface = quotations.filter(
				(quotation) => quotation.goodsTypeId === formData.goodsTypeId
			)[0];

			if (filteredQuotation) {
				setTableRow((prev: any) => ({
					...prev,
					rate: filteredQuotation.billRate,
					// articleRateTypeId: filteredQuotation.rateType,
					// shape: filteredQuotation.shapeId.toString()
					// 	? findObjectInArray(
					// 		articleShape,
					// 		'articleShapeId',
					// 		+filteredQuotation.shapeId
					// 	).articleShape
					// 	: '',
					labourRate: filteredQuotation.billHamali,
					labourRateTypeId: filteredQuotation.hamaliType,
				}));

				setformData((prev) => ({
					...prev,
					doorDelivery: filteredQuotation.billDoorDeliveryCharges
						? filteredQuotation.billDoorDeliveryCharges
						: 0,
					collection: filteredQuotation.billCollectionCharges
						? filteredQuotation.billCollectionCharges
						: 0,
				}));
			} else {
				setTableRow((prev: any) => ({
					...prev,
					rate: '',
					articleRateTypeId: defaultArticleRateTypeId,
					// shape: '',
					labourRate: 0,
					labourRateTypeId: defaultLabourRateTypeId,
					freight: '',
					totalLabour: 0,
				}));

				setformData((prev) => ({
					...prev,
					doorDelivery: 0,
					collection: 0,
				}));
			}
		}
	}, [formData.goodsTypeId, formData.consignorGST, formData.consigneeGST]);





	const handleGetEwayBillDetails = async (eWayBillNumber: string) => {
		setIsEwayLoading(true);
		setIsConsignorLoading(true);
		setIsConsigneeLoading(true);

		const response: any = await getEwayBillDetails(eWayBillNumber);

		setIsEwayLoading(false);
		setIsConsignorLoading(false);
		setIsConsigneeLoading(false);

		const data = response.data.data.data;

		if (response.data.data.status_cd != '1') {
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

			handleResetScreen();
			return;
		}

		if (data) {
			// if (
			// 	!findObjectInArray(
			// 		activeDeliveryBranches,
			// 		'pincode',
			// 		`${data.toPincode}`
			// 	).pincode
			// ) {
			// 	handleOpenAlertDialog(
			// 		'error',
			// 		`${data.toPlace} (Pin code: ${data.toPincode}) branch does not exists in Delivery Branches Masters. Please add ${data.toPlace} branch to Delivery Branches Masters first.`
			// 	);

			// 	handleResetScreen();
			// 	return;
			// }

			// setIsToBranchDisabled(true);
			// setGotDataFromEwaybill(true);

			setformData((prev: any) => ({
				...prev,
				consignorGST: `${data.fromGstin ? data.fromGstin : ''}`,
				consignor: `${data.fromTrdName ? data.fromTrdName : ''}`,
				consigneeGST: `${data.toGstin ? data.toGstin : ''}`,
				consignee: `${data.toTrdName ? data.toTrdName : ''}`,
				invoiceNumber: `${data.docNo ? data.docNo : ''}`,
				declaredValue: `${data.totInvValue ? data.totInvValue : ''}`,
				pinCode: `${data.toPincode ? data.toPincode : ''}`,
				toBranch:
					data.toPlace &&
						findObjectInArray(
							activeDeliveryBranches,
							'pincode',
							`${data.toPincode}`
						).pincode &&
						findObjectInArray(
							activeDeliveryBranches,
							'pincode',
							`${data.toPincode}`
						).pincode !== ''
						? data.toPlace
						: formData.toBranch,
				toBranchId:
					data.toPlace &&
						findObjectInArray(
							activeDeliveryBranches,
							'pincode',
							`${data.toPincode}`
						).pincode &&
						findObjectInArray(
							activeDeliveryBranches,
							'pincode',
							`${data.toPincode}`
						).pincode !== ''
						? findObjectInArray(
							activeDeliveryBranches,
							'pincode',
							`${data.toPincode}`
						).branchId
						: formData.toBranchId,
			}));

			setEnterConsignorName({
				partyName: data.fromTrdName ? data.fromTrdName : '',
			});

			setEnterConsigneeName({
				partyName: data.toTrdName ? data.toTrdName : '',
			});

			setNewConsignor({
				gstNo: data.fromGstin ? data.fromGstin : '',
				partyName: data.fromTrdName ? data.fromTrdName : '',
				address: `${data.fromAddr1}, ${data.fromAddr2}, ${data.toPlace
					}, ${findObjectInArray(
						states,
						'gstStateCode',
						+data.fromStateCode
					).state
					}, ${data.fromPincode}`,
				branchId: userDetails?.branchId ? userDetails?.branchId : 0,
				watsappNo: '',
				phoneNo: formData.consignorPhone ? formData.consignorPhone : '',
				contactPerson: '',
				comments: '',
				quotationComment: '',
				headerText: '',
				botttomText: '',
				paymentTypeId: 0,
				biltyCharge: 0,
				carting: 0,
				commission: 0,
				partyType: 1,
				isActive: true,
				billTypeId: 1,
				marketingPerson: '',
			});

			setNewConsignee({
				gstNo: data.toGstin ? data.toGstin : '',
				partyName: data.toTrdName ? data.toTrdName : '',
				address: `${data.toAddr1}, ${data.toAddr2}, ${data.toPlace}, ${findObjectInArray(states, 'gstStateCode', +data.toStateCode)
					.state
					}, ${data.toPincode}`,
				branchId: userDetails?.branchId ? userDetails?.branchId : 0,
				watsappNo: '',
				phoneNo: formData.consignorPhone ? formData.consignorPhone : '',
				contactPerson: '',
				comments: '',
				quotationComment: '',
				headerText: '',
				botttomText: '',
				paymentTypeId: 0,
				biltyCharge: 0,
				carting: 0,
				commission: 0,
				partyType: 2,
				isActive: true,
				billTypeId: 1,
				marketingPerson: '',
			});
		}
	};


	const handleGetConsignorGSTdetails = async (gstNumber: string) => {
		setIsConsignorLoading(true);
		const response: any = await getGSTINdetails(gstNumber);
		setIsConsignorLoading(false);

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
			setIsConsignorAutoFilled(false);
		} else {
			const data = response.data.data.data;

			if (data.gstin || data.tradeName) {
				setformData((prev: any) => ({
					...prev,
					consignorGST: data.gstin,
					consignor: data.tradeName,
				}));
				setEnterConsignorName({
					partyName: data.tradeName ? data.tradeName : '',
				});
				setNewConsignor({
					gstNo: data.gstin ? data.gstin : '',
					partyName: data.tradeName ? data.tradeName : '',
					address: `${data.address1}, ${data.address2}, ${findObjectInArray(
						states,
						'gstStateCode',
						+data.stateCode
					).state
						}, ${data.pinCode}`,
					branchId: userDetails?.branchId ? userDetails?.branchId : 0,
					watsappNo: '',
					phoneNo: formData.consignorPhone
						? formData.consignorPhone
						: '',
					contactPerson: '',
					comments: '',
					quotationComment: '',
					headerText: '',
					botttomText: '',
					paymentTypeId: 0,
					biltyCharge: 0,
					carting: 0,
					commission: 0,
					partyType: 1,
					isActive: true,
					billTypeId: 1,
					marketingPerson: '',
				});
				setIsConsignorAutoFilled(true);
			} else {
				setIsConsignorAutoFilled(false);
			}
		}
	};

	const handleGetConsigneeGSTdetails = async (gstNumber: string) => {
		setIsConsigneeLoading(true);
		const response: any = await getGSTINdetails(gstNumber);
		setIsConsigneeLoading(false);

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
			setIsConsigneeAutoFilled(false);
		} else {
			const data = response.data.data.data;

			if (data.gstin || data.tradeName) {
				setformData((prev) => ({
					...prev,
					consigneeGST: data.gstin,
					consignee: data.tradeName,
				}));
				setEnterConsigneeName({
					partyName: data.tradeName ? data.tradeName : '',
				});
				setNewConsignee({
					gstNo: data.gstin ? data.gstin : '',
					partyName: data.tradeName ? data.tradeName : '',
					address: `${data.address1}, ${data.address2}, ${findObjectInArray(
						states,
						'gstStateCode',
						+data.stateCode
					).state
						}, ${data.pinCode}`,
					branchId: userDetails?.branchId ? userDetails?.branchId : 0,
					watsappNo: '',
					phoneNo: formData.consigneePhone
						? formData.consigneePhone
						: '',
					contactPerson: '',
					comments: '',
					quotationComment: '',
					headerText: '',
					botttomText: '',
					paymentTypeId: 0,
					biltyCharge: 0,
					carting: 0,
					commission: 0,
					partyType: 2,
					isActive: true,
					billTypeId: 1,
					marketingPerson: '',
				});
				setIsConsigneeAutoFilled(true);
			} else {
				setIsConsigneeAutoFilled(false);
			}
		}
	};

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

	const handleSetCurrentBillType = (currentBillType: BillTypeInterface) => {
		setCurrentBillType(currentBillType);
		setformData((prev) => ({
			...prev,
			billTypeId: currentBillType.billTypeId,
		}));
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

	const handleGetAllActiveUserByCompany = async () => {
		const response = await getAllUserByCompanyAsync();

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: any = response.data.data;
			let array = data.filter(
				(user: UserInterface) => user.isActive === true
			);
			array = [...array].map((user) => ({
				...user,
				label: user.fullName,
			}));
			setAllActiveUsers(array.reverse());
		} else {
			handleLogout();
		}
	};

	const handleGetRateType = async () => {
		const response = await getRateTypeAsync();

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: any = response.data.data;

			setRateTypes(data);
		} else {
			handleLogout();
		}
	};

	const handleGetFormTypes = async () => {
		const response = await getFormTypesAsync();

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: any = response.data.data;

			setFormTypes(data);
		} else {
			handleLogout();
		}
	};

	const handleGetQuotationsByParty = async (
		partyId: number
	): Promise<QuotationInterface[]> => {
		const response = await getQuotationsByPartyAsync(partyId);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: any = response.data.data.reverse();
			return data;
		} else {
			handleLogout();
			return [];
		}
	};

	const handleGetCompanyQuotationsByBranch = async (
		branchId: number
	): Promise<QuotationInterface[]> => {
		const response = await getCompanyQuotationsByBranchAsync(branchId, formData.toBranchId);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: any = response.data.data.reverse();
			return data;
		} else {
			handleLogout();
			return [];
		}
	};

	const handleGetNextLrNumber = async () => {
		if (
			!formData.billTypeId ||
			!userBranchDetails?.branchId ||
			!formData.toBranchId
		) {
			handleOpenAlertDialog('error', 'Something went wrong.');
			return;
		}

		const data = {
			billTypeId: formData.billTypeId,
			fromBranchId: userBranchDetails.branchId,
			toBranchId: formData.toBranchId,
		};

		const response = await getNextLRNumberAsync(data);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			if (response.data.status === 200) {
				const data: any = response.data.data;

				setformData((prev) => ({
					...prev,
					lrNumber: data,
				}));
			} else {
				handleOpenAlertDialog('warning', response.data.data);
				setformData((prev) => ({
					...prev,
					lrNumber: '',
				}));
			}
		} else {
			handleLogout();
		}
	};

	const handleAddTableRow = () => {
		const isgoodsTypeId = validategoodsTypeId();
		const isShapeValid = validateShape();
		const isarticleRateTypeId = validatearticleRateTypeId();
		const israte = validaterate();
		const isarticle = validatearticle();
		const isweight = validateweight();
		// const islabourRateTypeId = validatelabourRateTypeId();
		// const islabourRate = validatelabourRate();

		if (
			isgoodsTypeId &&
			isShapeValid &&
			isarticleRateTypeId &&
			israte &&
			isarticle &&
			isweight
			// islabourRateTypeId &&
			// islabourRate
		) {
			if (!tableRowEditMode) {
				setformData((prev) => ({
					...prev,
					bookingDetails: [
						...prev.bookingDetails,
						{ ...tableRow, index: prev.bookingDetails.length },
					],
				}));
			} else {
				const array: BookingDetailsInterface[] = [];

				for (let i = 0; i < formData.bookingDetails.length; i++) {
					let data = formData.bookingDetails[i];

					if (tableRow.index === i) {
						data = tableRow;
					}

					array.push(data);
				}

				setformData((prev) => ({
					...prev,
					bookingDetails: array,
				}));
			}

			setTableRow(defaultTableRow);
			setformData((prev) => ({
				...prev,
				goodsType: '',
			}));
			setTableRowEditMode(false);

			document.getElementById('invoice-number')?.focus();
		}
	};

	const handleEditTableRow = (index: number) => {
		setTableRow({ ...formData.bookingDetails[index] });
		setTableRowCopy({ ...formData.bookingDetails[index] })
		setTableRowEditMode(true);
		setformData((prev) => ({
			...prev,
			goodsType: formData.bookingDetails[index].goodsType,
		}));
	};


	const handleDeleteTableRow = (index: number) => {
		const array: BookingDetailsInterface[] = [];

		for (let i = 0; i < formData.bookingDetails.length; i++) {
			if (index !== i) {
				array.push(formData.bookingDetails[i]);
			}
		}

		setformData((prev) => ({
			...prev,
			bookingDetails: array,
		}));
	};

	const columns = useMemo<MRT_ColumnDef<MRT_RowData, any>[]>(
		() => [
			{
				accessorKey: 'actions',
				header: 'Actions',
				enableResizing: false,
				enableColumnFilter: false,
				enableSorting: false,
				size: 100,
				muiTableHeadCellProps: {
					align: 'center',
				},
				muiTableBodyCellProps: {
					align: 'center',
				},
				muiTableFooterCellProps: {
					align: 'center',
				},
				Cell: (row) => {
					return (
						<>
							<Tooltip title='Edit'>
								<IconButton
									onClick={() =>
										handleEditTableRow(row.row.index)
									}
								>
									<EditOutlined />
								</IconButton>
							</Tooltip>
							<Tooltip title='Delete'>

								<IconButton
									disabled={!isAdmin && formCopy.status !== 5 && row.row.original.bookingId > 0}
									onClick={() =>
										handleDeleteTableRow(row.row.index)

									}
								>
									<DeleteOutline />
								</IconButton>
							</Tooltip>
						</>
					);
				},
			},
			{
				accessorKey: 'goodsType',
				header: 'Goods Type',
				enableColumnFilter: false,
				enableSorting: false,
				size: 180,
				muiTableHeadCellProps: {
					align: 'left',
				},
				muiTableBodyCellProps: {
					align: 'left',
				},
				muiTableFooterCellProps: {
					align: 'left',
				},
				accessorFn: (row) => `${row.goodsType ? row.goodsType : '--'}`,
			},
			{
				accessorKey: 'shape',
				header: 'Article Shape',
				enableColumnFilter: false,
				enableSorting: false,
				size: 180,
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
				accessorKey: 'article',
				header: 'Article',
				enableColumnFilter: false,
				enableSorting: false,
				size: 80,
				muiTableHeadCellProps: {
					align: 'left',
				},
				muiTableBodyCellProps: {
					align: 'left',
				},
				muiTableFooterCellProps: {
					align: 'left',
				},
				accessorFn: (row) => `${row.article ? row.article : '--'}`,
			},
			{
				accessorKey: 'weight',
				header: 'Weight',
				enableColumnFilter: false,
				enableSorting: false,
				size: 80,
				muiTableHeadCellProps: {
					align: 'left',
				},
				muiTableBodyCellProps: {
					align: 'left',
				},
				muiTableFooterCellProps: {
					align: 'left',
				},
				accessorFn: (row) => `${row.weight ? row.weight : '0'}`,
			},
			{
				accessorKey: 'chargeWeight',
				header: 'Chg. Weight',
				enableColumnFilter: false,
				enableSorting: false,
				size: 100,
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
					`${row.chargeWeight ? row.chargeWeight : '0'}`,
			},
			{
				accessorKey: 'articleRateTypeId',
				header: 'Rate Type',
				enableColumnFilter: false,
				enableSorting: false,
				size: 100,
				muiTableHeadCellProps: {
					align: 'left',
				},
				muiTableBodyCellProps: {
					align: 'left',
				},
				muiTableFooterCellProps: {
					align: 'left',
				},
				accessorFn: (row) => {
					return `${row.articleRateTypeId
						? getRateTypeById(row.articleRateTypeId)
						: '--'
						}`;
				},
			},
			{
				accessorKey: 'rate',
				header: 'Rate',
				enableColumnFilter: false,
				enableSorting: false,
				size: 70,
				muiTableHeadCellProps: {
					align: 'left',
				},
				muiTableBodyCellProps: {
					align: 'left',
				},
				muiTableFooterCellProps: {
					align: 'left',
				},
				accessorFn: (row) => `${row.rate ? row.rate : '0'}`,
			},
			{
				accessorKey: 'freight',
				header: 'Freight',
				enableColumnFilter: false,
				enableSorting: false,
				size: 90,
				muiTableHeadCellProps: {
					align: 'left',
				},
				muiTableBodyCellProps: {
					align: 'left',
				},
				muiTableFooterCellProps: {
					align: 'left',
				},
				accessorFn: (row) => `${row.freight ? row.freight : '0'}`,
			},
			{
				accessorKey: 'labourRate',
				header: 'Labour Rate',
				enableColumnFilter: false,
				enableSorting: false,
				size: 120,
				muiTableHeadCellProps: {
					align: 'left',
				},
				muiTableBodyCellProps: {
					align: 'left',
				},
				muiTableFooterCellProps: {
					align: 'left',
				},
				accessorFn: (row) => `${row.labourRate ? row.labourRate : '0'}`,
			},
			{
				accessorKey: 'totalLabour',
				header: 'Labour',
				enableColumnFilter: false,
				enableSorting: false,
				size: 120,
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
					`${row.totalLabour ? row.totalLabour : '0'}`,
			},
		],
		[rateTypes, formData.bookingDetails]
	);

	const getRateTypeById = (id: number) => {
		const rateTypesArray = [
			{ rateTypeId: 1, rateType: 'ARTICLE' },
			{ rateTypeId: 2, rateType: 'WEIGHT' },
			{ rateTypeId: 3, rateType: 'FIX' },
		];

		for (const type of rateTypesArray) {
			if (type.rateTypeId === id) {
				return type.rateType;
			}
		}
		return '--';
	};

	const table = useMaterialReactTable({
		columns,
		data:
			formData && formData.bookingDetails ? formData.bookingDetails : [],
		filterFromLeafRows: false,
		paginateExpandedRows: false,
		enableColumnResizing: true,
		enablePagination: false,
		layoutMode: 'grid',
		enableFilters: false,
		enableTopToolbar: false,
		enableBottomToolbar: false,
		enableColumnActions: false,
	});

	const getBillTypeById = (id: number) => {
		for (const type of billTypes) {
			if (type.billTypeId === id) {
				return type;
			}
		}
		return '--';
	};

	const getPaymentTypeById = (id: number) => {
		for (const type of paymentTypes) {
			if (type.paymentTypeId === id) {
				return type.paymentType;
			}
		}
		return '--';
	};

	const validateEwayBill = () => {
		if (formData.eWayBillNumber.length === 0 || formData.eWayBillNumber.length === 12) {
			setformError((prev) => ({
				...prev,
				eWayBillNumber: '',
			}));
			return true;
		} else {
			setformError((prev) => ({
				...prev,
				eWayBillNumber: 'Invalid E-Way Bill Number',
			}));
		} return false;
	}

	const validatetoBranch = () => {
		if (!formData.toBranch) {
			setformError((prev) => ({
				...prev,
				toBranch: '"To" branch is required',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				toBranch: '',
			}));

			return true;
		}
	};

	const validateconsignor = () => {
		if (!formData.consignor) {
			setformError((prev) => ({
				...prev,
				consignor: 'Consignor is required',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				consignor: '',
			}));

			return true;
		}
	};

	const validateconsignorPhone = () => {
		if (!formData.consignorPhone) {
			setformError((prev) => ({
				...prev,
				consignorPhone: 'Consignor phone number is required',
			}));

			return false;
		} else if (
			formData.consignorPhone &&
			formData.consignorPhone.length < 10
		) {
			setformError((prev) => ({
				...prev,
				consignorPhone: 'Invalid Consignor phone number',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				consignorPhone: '',
			}));

			return true;
		}
	};

	const validateconsignee = () => {
		if (!formData.consignee) {
			setformError((prev) => ({
				...prev,
				consignee: 'Consignee is required',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				consignee: '',
			}));

			return true;
		}
	};

	const validateconsigneePhone = () => {
		if (!formData.consigneePhone) {
			setformError((prev) => ({
				...prev,
				consigneePhone: 'Consignee phone number is required',
			}));

			return false;
		} else if (
			formData.consigneePhone &&
			formData.consigneePhone.length < 10
		) {
			setformError((prev) => ({
				...prev,
				consigneePhone: 'Invalid Consignee phone number',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				consigneePhone: '',
			}));

			return true;
		}
	};

	const validatepaymentType = () => {
		if (!formData.paymentType) {
			setformError((prev) => ({
				...prev,
				paymentType: 'Payment type is required',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				paymentType: '',
			}));

			return true;
		}
	};

	const validateEwaybillNumber = () => {
		if (!formData.eWayBillNumber) {
			setformError((prev) => ({
				...prev,
				eWayBillNumber: 'E-Way Bill Number is required',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				eWayBillNumber: '',
			}));

			return true;
		}
	};

	const validategoodsTypeId = () => {
		if (!formData.goodsType) {
			setformError((prev) => ({
				...prev,
				goodsTypeId: 'Goods type is required',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				goodsTypeId: '',
			}));

			return true;
		}
	};

	const validateShape = () => {
		if (!tableRow.shape) {
			setformError((prev) => ({
				...prev,
				shape: 'Article Shape is required',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				shape: '',
			}));

			return true;
		}
	};

	const validateinvoiceNumber = () => {
		if (!formData.invoiceNumber) {
			setformError((prev) => ({
				...prev,
				invoiceNumber: 'Invoice number is required',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				invoiceNumber: '',
			}));

			return true;
		}
	};

	const validatedeclaredValue = () => {
		if (!formData.declaredValue) {
			setformError((prev) => ({
				...prev,
				declaredValue: 'Declared value is required',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				declaredValue: '',
			}));

			return true;
		}
	};


	const validateDoorDelivery = () => {
		if (formData.mode.toLowerCase() === 'door delivery') {
			if (!formData.doorDelivery) {
				setformError((prev) => ({
					...prev,
					doorDelivery: 'Door Delivery is required',
				}));
				return false;
			} else {
				return true;
			}
		} else {
			setformError((prev) => ({
				...prev,
				doorDelivery: '',
			}));
			return true;
		}
	};



	const validateprivateMark = () => {
		if (!formData.privateMark) {
			setformError((prev) => ({
				...prev,
				privateMark: 'Private mark is required',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				privateMark: '',
			}));

			return true;
		}
	};

	const validategoodsReceivedBy = () => {
		if (!formData.goodsReceivedBy) {
			setformError((prev) => ({
				...prev,
				goodsReceivedBy: 'Goods received by is required',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				goodsReceivedBy: '',
			}));

			return true;
		}
	};

	const validatemode = () => {
		if (!formData.mode) {
			setformError((prev) => ({
				...prev,
				mode: 'Mode is required',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				mode: '',
			}));

			return true;
		}
	};

	const validatearticleRateTypeId = () => {
		if (!tableRow.articleRateTypeId) {
			setformError((prev) => ({
				...prev,
				articleRateTypeId: 'Rate type is required',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				articleRateTypeId: '',
			}));

			return true;
		}
	};

	const validatearticle = () => {
		if (!tableRow.article) {
			setformError((prev) => ({
				...prev,
				article: 'Article is required',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				article: '',
			}));

			return true;
		}
	};

	const validaterate = () => {
		if (!tableRow.rate) {
			setformError((prev) => ({
				...prev,
				rate: 'Rate is required',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				rate: '',
			}));

			return true;
		}
	};

	const validateweight = () => {
		if (!tableRow.weight) {
			setformError((prev) => ({
				...prev,
				weight: 'Weight is required',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				weight: '',
			}));

			return true;
		}
	};

	const validatechargeWeight = () => {
		if (
			tableRow.chargeWeight &&
			tableRow.weight &&
			+tableRow.chargeWeight < +tableRow.weight
		) {
			setformError((prev) => ({
				...prev,
				chargeWeight:
					'Charge Weight is greater than or equal to Weight.',
			}));

			return false;
		} else {
			setformError((prev) => ({
				...prev,
				chargeWeight: '',
			}));

			return true;
		}
	};






	const onEnterFocusNext = (event: any, elementId: string) => {
		if (event.key === 'Enter' && elementId) {
			event.preventDefault();
			document.getElementById(elementId)?.focus();

		}
	};

	const onTabFocusNext = (event: any, elementId: string) => {
		if (event.key === 'Tab' && !event.shiftKey && elementId) {
			event.preventDefault();
			document.getElementById(elementId)?.focus();
		}
	};


	const handleResetScreen = () => {
		let billTypeId = formData.billTypeId;
		setQuotations([]);
		setFormCopy({ ...defaultFormData, billTypeId })
		setCurrConsignorQuotation([]);
		setformData({ ...defaultFormData, billTypeId });
		setformError(defaultFormError);
		setTableRow(defaultTableRow);
		setTableRowCopy(defaultTableRow);
		setEnterConsignorName(defaultEnterConsignorName);
		setEnterConsigneeName(defaultEnterConsigneeName);
		setCurrConsignorQuotation([]);
		setConsignorArticleShape([]);
		setArticleShape([]);
		if (userDetails) {
			setformData((prev) => ({
				...prev,
				goodsReceivedBy: userDetails.fullName,
			}));
		}

		setNewConsignor(null);
		setNewConsignee(null);

		setConsignor(undefined);
		setConsignee(undefined);

		setIsConsignorHasQuotation(false);
		setIsConsigneeHasQuotation(false);

		// setIsToBranchDisabled(false);
		// setGotDataFromEwaybill(false);

		navigate(location.pathname, {
			replace: true,
			state: null,
		});
	};

	const handleCreateParty = async (party: PartyInterface) => {

		try {
			const response = await createPartyAsync(party);
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (response.data.status === 200) {
					return response;
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




	const handleSubmit = async () => {
		if (formData.billTypeId === 2) {


			setformData((prev) => ({
				...prev,
				consignorGST: '',
				consigneeGST: '',
			}));

		}

		const ewaybillValidation = validateEwayBill();
		const istoBranchValid = validatetoBranch();
		const isconsignorValid = validateconsignor();
		const isconsignorPhoneValid = validateconsignorPhone();
		const isconsigneeValid = validateconsignee();
		const isconsigneePhoneValid = validateconsigneePhone();
		const ispaymentTypeValid = validatepaymentType();
		const isinvoiceNumberValid = validateinvoiceNumber();
		const isdeclaredValueValid = validatedeclaredValue();
		const isprivateMarkValid = validateprivateMark();
		const isgoodsReceivedByValid = validategoodsReceivedBy();
		const ismodeValid = validatemode();
		const isDoorDeliveryValid = validateDoorDelivery();
		if (!ewaybillValidation) {
			return document.getElementById('eway-bill-number')?.focus();
		}
		if (!istoBranchValid)
			return document.getElementById('to-branch')?.focus();
		if (!isconsignorValid)
			return document.getElementById('consignor')?.focus();
		if (!isconsignorPhoneValid)
			return document.getElementById('consignor-phone')?.focus();
		if (!isconsigneeValid)
			return document.getElementById('consignee')?.focus();
		if (!isconsigneePhoneValid)
			return document.getElementById('consignee-phone')?.focus();
		if (!ispaymentTypeValid)
			return document.getElementById('payment-type')?.focus();
		if (!isinvoiceNumberValid)
			return document.getElementById('invoice-number')?.focus();
		if (!isdeclaredValueValid)
			return document.getElementById('declared-value')?.focus();
		if (!isprivateMarkValid)
			return document.getElementById('private-mark')?.focus();
		if (!isgoodsReceivedByValid)
			return document.getElementById('goods-received-by')?.focus();
		if (!ismodeValid) return document.getElementById('mode')?.focus();
		if (!isDoorDeliveryValid) return document.getElementById('right-door-delivery')?.focus();

		if (
			istoBranchValid &&
			isconsignorValid &&
			isconsignorPhoneValid &&
			isconsigneeValid &&
			isconsigneePhoneValid &&
			ispaymentTypeValid &&
			isinvoiceNumberValid &&
			isdeclaredValueValid &&
			isprivateMarkValid &&
			isgoodsReceivedByValid &&
			ismodeValid
		) {
			if (formData.bookingDetails.length === 0) {
				handleOpenAlertDialog(
					'warning',
					'Please add at least one item.'
				);
				return;
			}

			if (+formData.declaredValue >= 50000) {
				if (!validateEwaybillNumber()) {
					document.getElementById('eway-bill-number')?.focus();
					return;
				}
			}


			let data: BookingInterface = {
				bookingId: 0,
				billTypeId: formData.billTypeId,
				bookingTypeId: formData.bookingTypeId,
				fromBranchId: userDetails?.branchId ? userDetails?.branchId : 0,
				toBranchId: formCopy.toBranch !== '' ? formCopy.toBranchId : formData.toBranchId,
				fromBranch: userBranchDetails?.name
					? userBranchDetails.name
					: '',
				toBranch: formCopy.toBranch !== '' ? formCopy.toBranch : formData.toBranch,
				pinCode: formData.pinCode,
				exportTo: formData.exportTo ? formData.exportTo : '',
				lrNumber: formData.lrNumber,
				bookingDate: formData.bookingDate,
				eWayBillNumber: formData.eWayBillNumber
					? formData.eWayBillNumber
					: '',
				consignorId: formData.consignorId ? formData.consignorId : 0,
				consignorGST: formData.consignorGST
					? formData.consignorGST
					: '',
				consignor: formData.consignor ? formData.consignor : '',
				consignorPhone: formData.consignorPhone
					? formData.consignorPhone
					: '',
				consigneeId: formData.consigneeId ? formData.consigneeId : 0,
				consigneeGST: formData.consigneeGST
					? formData.consigneeGST
					: '',
				consignee: formData.consignee ? formData.consignee : '',
				consigneePhone: formData.consigneePhone
					? formData.consigneePhone
					: '',
				quotationBy: formData.quotationBy,
				paymentType: formData.paymentType,
				invoiceNumber: formData.invoiceNumber,
				declaredValue: formData.declaredValue,
				privateMark: formData.privateMark,
				goodsReceivedBy: formData.goodsReceivedBy,
				mode: formData.mode,
				note: formData.note,
				freight: formData.freight,
				lrCharge: formData.lrCharge,
				labour: formData.labour,
				aoc: formData.aoc,
				collection: formData.collection,
				doorDelivery: formData.doorDelivery,
				oloc: formData.oloc,
				insurance: formData.insurance,
				other: formData.other,
				carrierRisk: formData.carrierRisk,
				bhCharge: formData.bhCharge,
				fov: formData.fov,
				cartage: formData.cartage,
				total: formData.total,
				sgst: formData.sgst,
				cgst: formData.cgst,
				igst: formData.igst,
				grandTotal: formData.grandTotal,
				addedBy: formData.addedBy,
				companyId: userBranchDetails?.companyId
					? userBranchDetails?.companyId
					: 0,
				truckNumber: formData.truckNumber ? formData.truckNumber : '',
				bookingDetails: [] as BookingDetailsInterface[],
			};

			if (!location.state) {
				data = {
					...data,
					bookingDetails: [...formData.bookingDetails].map((data) => {
						return {
							bookingId: 0,
							bookingDetailId: 0,
							goodsType: data.goodsType,
							shape: data.shape,
							articleRateTypeId: +data.articleRateTypeId,
							article: +data.article,
							rate: +data.rate,
							weight: +data.weight,
							chargeWeight: +data.chargeWeight,
							labourRateTypeId: +data.labourRateTypeId,
							labourRate: +data.labourRate,
							totalLabour: +data.totalLabour,
							freight: +data.freight,
							flag: 'A',
						};
					}),
				};

				setIsFormLoading(true);
				const response = await createBookingAsync(data);
				setIsFormLoading(false);

				if (
					response &&
					typeof response !== 'boolean' &&
					response.data.status !== 401
				) {
					if (response.data.status === 200) {
						if (newConsignor) {
							const response = await handleCreateParty({
								...newConsignor,
								phoneNo: formData.consignorPhone
									? formData.consignorPhone
									: '',
							});

							if (response) {
								const newParty: PartyInterface = {
									...newConsignor,
									partyId: response?.data.data,
								};

								setAllConsignorsByCompany((prev) =>
									addIndex.addIndex2([newParty, ...prev])
								);
							}
						}
						if (newConsignee) {
							const response = await handleCreateParty({
								...newConsignee,
								phoneNo: formData.consigneePhone
									? formData.consigneePhone
									: '',
							});

							if (response) {
								const newParty: PartyInterface = {
									...newConsignee,
									partyId: response?.data.data,
								};

								setAllConsigneesByCompany((prev) =>
									addIndex.addIndex2([newParty, ...prev])
								);
							}
						}

						handleOpenAlertDialog(
							'success',
							'Created new booking.'
						);

						handleResetScreen();
						document.getElementById('eway-bill-number')?.focus();

						return true;
					} else {
						handleOpenAlertDialog('warning', response.data.data);
					}
				} else {
					handleLogout();
				}
			} else {
				data = {
					...data,
					bookingId: formData.bookingId ? +formData.bookingId : 0,
					bookingDetails: [...formData.bookingDetails].map(
						(thisData) => {
							return {
								bookingId: formData.bookingId
									? +formData.bookingId
									: 0,
								bookingDetailId: thisData.bookingDetailId
									? thisData.bookingDetailId
									: 0,
								lrNumber: data.lrNumber,
								goodsType: thisData.goodsType,
								shape: thisData.shape,
								articleRateTypeId: +thisData.articleRateTypeId,
								article: +thisData.article,
								rate: +tableRowCopy.rate,
								weight: +thisData.weight,
								chargeWeight: +thisData.chargeWeight,
								labourRateTypeId: +thisData.labourRateTypeId,
								labourRate: +thisData.labourRate,
								totalLabour: +thisData.totalLabour,
								freight: +thisData.freight,
								flag: location.state.bookingDetails.bookingDetails.map(
									(bookingDetail: any) => {
										if (
											thisData.bookingId ===
											bookingDetail.bookingId
										) {
											return 'U';
										} else if (
											!thisData.bookingId ||
											!bookingDetail.bookingId
										) {
											return 'A';
										} else {
											return 'D';
										}
									}
								)[0],
							};
						}
					),

				};



				const bookingDetailsCopy = data.bookingDetails;

				const bookingDetailIdsSet = new Set(
					bookingDetailsCopy.map((obj) => obj.bookingDetailId)
				);

				const filteredArray2 =
					location.state.bookingDetails.bookingDetails.filter(
						(obj: any) =>
							!bookingDetailIdsSet.has(obj.bookingDetailId)
					);

				filteredArray2.map((data: any) => {
					return {
						...data,
						flag: 'D',
					};
				});

				data = {
					...data,
					bookingDetails: [
						...bookingDetailsCopy,
						...filteredArray2.map((data: any) => {
							return {
								...data,
								flag: 'D',
							};
						}),
					],
				};

				setIsFormLoading(true);
				const response = await updateBookingAsync(data);
				setIsFormLoading(false);

				if (
					response &&
					typeof response !== 'boolean' &&
					response.data.status !== 401
				) {
					if (response.data.status === 200) {
						if (newConsignor) {
							const response = await handleCreateParty({
								...newConsignor,
								phoneNo: formData.consignorPhone
									? formData.consignorPhone
									: '',
							});

							if (response) {
								const newParty: PartyInterface = {
									...newConsignor,
									partyId: response?.data.data,
								};

								setAllConsignorsByCompany((prev) =>
									addIndex.addIndex2([newParty, ...prev])
								);
							}
						}
						if (newConsignee) {
							const response = await handleCreateParty({
								...newConsignee,
								phoneNo: formData.consigneePhone
									? formData.consigneePhone
									: '',
							});

							if (response) {
								const newParty: PartyInterface = {
									...newConsignee,
									partyId: response?.data.data,
								};

								setAllConsigneesByCompany((prev) =>
									addIndex.addIndex2([newParty, ...prev])
								);
							}
						}

						handleOpenAlertDialog('success', 'Updated booking.');
						document.getElementById('eway-bill-number')?.focus();

						return true;
					} else {
						handleOpenAlertDialog(
							'warning',
							'Something went wrong.'
						);
					}
				} else {
					handleLogout();
				}
			}
		}
	};


	const submitAndPrint = async () => {
		if (await handleSubmit()) {
			printPDF(
				document.getElementById('bill-print') as HTMLElement,
				'letter'
			);
		}
	};

	const handleDelete = async () => {
		const confirm = window.confirm(
			`Are you sure you want to delete this booking?`
		);
		if (!confirm) return;

		let data = { ...formData };

		const response = await deleteBookingAsync(data);

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			if (response.data.status === 200) {
				handleOpenAlertDialog('success', 'Deleted booking.');

				let billTypeId = formData.billTypeId;

				setformData({ ...defaultFormData, billTypeId });
				setformError(defaultFormError);
				setTableRow(defaultTableRow);
				setEnterConsignorName(defaultEnterConsignorName);
				setEnterConsigneeName(defaultEnterConsigneeName);

				navigate(location.pathname, {
					replace: true,
					state: null,
				});
			} else {
				handleOpenAlertDialog('warning', response.data.data);
			}
		} else {
			handleLogout();
		}
	};



	useEffect(() => {
		if (formData.lrNumber) {
			let stringdata = JSON.stringify(formData.lrNumber);

			QRCode.toDataURL(stringdata, function (err, code) {
				if (err) return console.log('error occurred');
				setQr(code);
			});
		}
	}, [formData.lrNumber]);

	return (
		<>
			<div
				data-component='booking'
				className='container-screen'
			>
				<div
					data-component='booking'
					className='bottom'
				>
					<div
						data-component='booking'
						className='form'
					>
						<div
							data-component='booking'
							className='left'
						>
							<div
								data-component='booking'
								className='container'
							>
								<div
									data-component='booking'
									className='columns-7'
								>
									<FormControl
										size='small'
										variant='outlined'
										fullWidth

									>
										<InputLabel htmlFor='bookingType'>
											Bill Type
										</InputLabel>
										<Select
											onKeyDownCapture={(e) => {
												onEnterFocusNext(e, 'to-branch');
												onTabFocusNext(e, 'to-branch');
											}}
											id='bookingType'
											label='Bill Type'
											onChange={(event: any) => {
												handleResetScreen();
												// setformData((prev) => ({
												// 	...prev,
												// 	goodsType : '',
												// 	goodsTypeId : 0,
												// 	billTypeId : 0,

												// }));
												// setTableRow((prev) => ({
												// 	...prev,
												// 	articleRateTypeId : 0,
												// 	shape : '',

												// }));

												// setQuotations([]);
												// setCurrConsignorQuotation([]);


												let billType = getBillTypeById(
													+event.target.value
												);

												if (billType) {
													handleSetCurrentBillType(
														billType as any
													);
												}
											}}


											value={currentBillType.billTypeId}
										>
											{billTypes.map((type) => {
												return (
													<MenuItem
														key={type.billTypeId}
														value={type.billTypeId}
													>
														{type.billType}
													</MenuItem>
												);
											})}
										</Select>
									</FormControl>
								</div>
								<div
									data-component='booking'
									className='columns-6'
								>
									<FormControl
										size='small'
										variant='outlined'
										fullWidth

									>
										<InputLabel htmlFor='bookingType'>
											Booking Type
										</InputLabel>
										<Select
											id='bookingType'
											label='Booking Type'
											value={formData.bookingTypeId}
											onChange={(e) => {
												setformData((prev) => ({
													...prev,
													bookingTypeId:
														+e.target.value,
												}));
											}}
											data-tabindex='1'
										>
											{bookingTypes.map((type) => {
												return (
													<MenuItem
														key={type.bookingTypeId}
														value={
															type.bookingTypeId
														}
													>
														{type.bookingType}
													</MenuItem>
												);
											})}
										</Select>
									</FormControl>
								</div>
								{currentBillType?.billType === 'Bill' && (
									<div
										data-component='booking'
										className='columns-4'
									>
										<FormControl
											size='small'
											variant='outlined'
											fullWidth

											error={
												formError.eWayBillNumber
													? true
													: false
											}
										>
											<InputLabel htmlFor='eway-bill-number'>
												E-Way Bill Number
											</InputLabel>
											<OutlinedInput
												inputProps={{ maxLength: 12 }}
												label='E-Way Bill Number'
												id='eway-bill-number'
												type='number'
												value={formData.eWayBillNumber}
												onChange={(event) => {
													const value = event.target.value;
													if (value.length <= 12) { // Restrict input to 12 characters
														setformData((prev) => ({
															...prev,
															eWayBillNumber: value,
														}));
													}
												}}


												endAdornment={
													isEwayLoading ? (
														<InputAdornment position='end'>
															<CircularProgress
																size={24}
															/>
														</InputAdornment>
													) : (
														<></>
													)
												}
												onKeyUp={(event) => {
													if (!formData.toBranch || formData.toBranch) {
														onEnterFocusNext(
															event,
															'to-branch'
														);
													} else if (
														!formData.consignorPhone
													) {
														onEnterFocusNext(
															event,
															'to-branch'
														);
													}

												}}
												onBlurCapture={() => validateEwayBill()}
												onKeyDown={(event) => {
													if (!formData.toBranch) {
														onTabFocusNext(
															event,
															'to-branch'
														);
													} else if (
														!formData.consignorPhone
													) {
														onTabFocusNext(
															event,
															'to-branch'
														);
													}

												}}
											/>
											{formError.eWayBillNumber && (
												<FormHelperText error>
													{formError.eWayBillNumber}
												</FormHelperText>
											)}
										</FormControl>
									</div>
								)}
								<div
									data-component='booking'
									className={
										currentBillType?.billType === 'Bill'
											? 'columns-3'
											: 'columns-2'
									}
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
											label='From'
											id='from'
											type='text'
											value={`${!location.state
												? userBranchDetails?.name
													? userBranchDetails?.name
													: ''
												: location.state
													.bookingDetails
													.fromBranch
													? location.state
														.bookingDetails
														.fromBranch
													: '--'
												}`}
											name='branchId'
											contentEditable={false}
										/>
									</FormControl>
								</div>
								<div
									data-component='booking'
									className={
										currentBillType?.billType === 'Bill'
											? 'columns-3'
											: 'columns-2'
									}
								>
									{/* <FormControl
										fullWidth
										error={
											formError.toBranch ? true : false
										}
									>
										<Autocomplete
											id='to-branch'
											disabled={isToBranchDisabled}
											selectOnFocus
											size='small'
											options={activeDeliveryBranches}
											value={formData.toBranch as any}
											onChange={(
												_event,
												newInputValue
											) => {
												if (newInputValue) {
													setformData((prev) => ({
														...prev,
														toBranchId:
															newInputValue.branchId,
														toBranch:
															newInputValue.name,
													}));
												} else {
													setformData((prev) => ({
														...prev,
														toBranchId: 0,
														toBranch: '',
													}));
												}
											}}
											openOnFocus={true}
											renderInput={(params) => (
												<TextField
													{...params}
													size='small'
													label='To'
													data-tabindex='2'
													error={
														formError.toBranch
															? true
															: false
													}
													onBlur={validatetoBranch}
													required
													onKeyUp={(event) => {
														if (
															!formData.consignorGST
														) {
															onEnterFocusNext(
																event,
																'consignor-gst'
															);
														} else if (
															!formData.consignor
														) {
															onEnterFocusNext(
																event,
																'consignor'
															);
														} else if (
															!formData.consignorPhone
														) {
															onEnterFocusNext(
																event,
																'consignor-phone'
															);
														}
													}}
													onKeyDown={(event) => {
														if (
															!formData.consignorGST
														) {
															onTabFocusNext(
																event,
																'consignor-gst'
															);
														} else if (
															!formData.consignor
														) {
															onTabFocusNext(
																event,
																'consignor'
															);
														} else if (
															!formData.consignorPhone
														) {
															onTabFocusNext(
																event,
																'consignor-phone'
															);
														}
													}}
												/>
											)}
										/>
										{formError.toBranch && (
											<FormHelperText error>
												{formError.toBranch}
											</FormHelperText>
										)}
									</FormControl> */}
									<FormControl
										fullWidth
										error={Boolean(formError.toBranch)}

									>
										<Autocomplete
											id='to-branch'
											disabled={isAdmin ? false : formData.paymentType !== 1}
											selectOnFocus
											size='small'
											options={activeDeliveryBranches}

											value={
												formCopy?.bookingId !== 0 ? activeDeliveryBranches.find(item => item.branchId === formCopy?.toBranchId)?.name || formCopy.toBranch :
													formCopy.bookingId !== 0 ?
														activeDeliveryBranches.find(branch => branch?.branchId === formCopy?.toBranchId)?.name :
														activeDeliveryBranches.find(branch => branch?.branchId === formCopy?.toBranchId)?.name as any ||
														formData.toBranch
											}
											onChange={(
												_event,
												newInputValue
											) => {
												// console.log(
												// 	formCopy?.bookingId!==0 ? activeDeliveryBranches.find(item=>item.branchId===formCopy?.toBranchId)?.name ||formCopy.toBranch : 
												// formCopy ?
												//  activeDeliveryBranches.find(branch => branch?.branchId === formData?.toBranchId)?.name :
												// activeDeliveryBranches.find(branch => branch?.branchId === formData?.toBranchId)?.name as any ||
												//  formData.toBranch
												// );
												if (formCopy.bookingId !== 0) {

													if (newInputValue) {

														setFormCopy((prev) => ({
															...prev,
															toBranchId:
																newInputValue.branchId,
															toBranch:
																newInputValue.name,
														}));

														// console.log(formData.toBranchId, 'branch', activeDeliveryBranches, 'bool',activeDeliveryBranches.find(branch=>branch?.branchId === formData?.toBranchId));

													}
													else {
														setformData((prev) => ({
															...prev,
															toBranchId: 0,
															toBranch: '',
														}));
													}
												} else {

													if (newInputValue) {


														setformData((prev) => ({
															...prev,
															toBranchId:
																newInputValue.branchId,
															toBranch:
																newInputValue.name,
														}));

														// console.log(formData.toBranchId, 'branch', activeDeliveryBranches, 'bool',activeDeliveryBranches.find(branch=>branch?.branchId === formData?.toBranchId));

													}
													else {
														setformData((prev) => ({
															...prev,
															toBranchId: 0,
															toBranch: '',
														}));
													}
												}


											}}
											onFocus={() => validateEwayBill()}
											openOnFocus
											onInputChange={(
												_event,
												newInputValue,
												reason
											) => {
												if (
													reason === 'input' &&
													newInputValue
												) {
													const matchedOption =
														activeDeliveryBranches.find(
															(branch) =>
																branch.name
																	.toLowerCase()
																	.startsWith(
																		newInputValue.toLowerCase()
																	)
														);
													if (matchedOption) {

														setformData((prev) => ({
															...prev,
															toBranchId:
																matchedOption.branchId as number,
															toBranch:
																matchedOption.name,
														}));
														setFormCopy((prev) => ({
															...prev,
															toBranchId:
																matchedOption.branchId as number,
															toBranch:
																matchedOption.name,
														}));
													}
												}
											}}
											renderInput={(params) => (
												<TextField
													{...params}
													size='small'
													label='To'
													data-tabindex='2'
													error={Boolean(
														formError.toBranch
													)}
													onBlur={validatetoBranch}
													required
													onKeyUp={(event) => {
														if (
															!formData.consignorGST
														) {
															onEnterFocusNext(
																event,
																'consignor-gst'
															);
														} else if (
															!formData.consignor
														) {
															onEnterFocusNext(
																event,
																'consignor'
															);
														} else if (
															!formData.consignorPhone
														) {
															onEnterFocusNext(
																event,
																'consignor-phone'
															);
														} else if (!formData.consigneePhone) {
															onEnterFocusNext(event, 'consignee-phone')
														} else {
															onEnterFocusNext(event, 'payment-type')
														}

													}}
													onKeyDown={(event) => {
														if (
															!formData.consignorGST
														) {
															onTabFocusNext(
																event,
																'consignor-gst'
															);
														} else if (
															!formData.consignor
														) {
															onTabFocusNext(
																event,
																'consignor'
															);
														} else if (
															!formData.consignorPhone
														) {
															onTabFocusNext(
																event,
																'consignor-phone'
															);
														} else if (!formData.consigneePhone) {
															onTabFocusNext(event, 'consignee-phone');
														} else {
															onTabFocusNext(event, 'payment-type');
														}
													}}
												/>
											)}
										/>
										{formError.toBranch && (
											<FormHelperText error>
												{formError.toBranch}
											</FormHelperText>
										)}
									</FormControl>
								</div>
							</div>

							<div
								data-component='booking'
								className='container'
							>
								<div
									data-component='booking'
									className='columns-3'
								>
									<FormControl
										size='small'
										variant='outlined'
										fullWidth

									>
										<InputLabel htmlFor='export-to'>
											Export to
										</InputLabel>
										<OutlinedInput
											label='Export to'
											id='export-to'
											type='text'
											data-tabindex='3'
											value={`${formData.exportTo
												? formData.exportTo
												: ''
												}`}
											onChange={(event: any) => {
												setformData((prev) => ({
													...prev,
													exportTo:
														event.target.value,
												}));
											}}
										/>
									</FormControl>
								</div>
								<div
									data-component='booking'
									className='columns-3'
								>
									<FormControl
										size='small'
										variant='outlined'
										fullWidth
										focused={false}
										disabled={true}
									>
										<InputLabel htmlFor='lr-number'>
											LR Number
										</InputLabel>
										<OutlinedInput
											label='LR Number'
											id='lr-number'
											type='text'
											contentEditable={false}
											value={formData.lrNumber}
										/>
									</FormControl>
								</div>
								<div
									data-component='booking'
									className='columns-3'
								>
									<LocalizationProvider
										dateAdapter={AdapterDayjs}
									>
										<DatePicker
											label='Date'
											format='DD-MM-YYYY'
											value={
												formData.bookingDate
													? dayjs(
														formData.bookingDate
													)
													: null
											}
											disabled={true}
											onChange={(date: Dayjs | null) => {
												if (date) {
													setformData((prev) => ({
														...prev,
														bookingDate:
															date.toISOString(),
													}));
												} else {
													setformData((prev) => ({
														...prev,
														bookingDate: '',
													}));
												}
											}}
											slotProps={{
												field: {
													shouldRespectLeadingZeros:
														true,
												},
												textField: { size: 'small' },
											}}
										/>
									</LocalizationProvider>
								</div>
								{formData.bookingTypeId === 2 && (
									<div
										data-component='booking'
										className='columns-3'
									>
										<FormControl
											size='small'
											variant='outlined'
											fullWidth
										>
											<InputLabel htmlFor='truck-number'>
												Truck Number
											</InputLabel>
											<OutlinedInput
												label='Truck Number'
												id='truck-number'
												type='text'
												value={formData.truckNumber}
												onChange={(event) => {
													setformData((prev) => ({
														...prev,
														truckNumber:
															event.target.value,
													}));
												}}
											/>
										</FormControl>
									</div>
								)}
							</div>
							<div
								data-component='booking'
								className='container'
							>
								<div
									data-component='booking'
									className='columns-2'
								>
									{currentBillType?.billType === 'Bill' &&
										<FormControl
											size='small'
											variant='outlined'
											fullWidth
											error={
												formError.consignorGST
													? true
													: false
											}

										>
											<InputLabel htmlFor='from'>
												Consignor GST Number
											</InputLabel>
											<OutlinedInput
												id='consignor-gst'
												label='Consignor GST Number'
												type='text'
												value={formData.consignorGST}
												onChange={(event) => {
													setformData((prev) => ({
														...prev,
														consignorGST:
															event.target.value.toLocaleUpperCase(),
													}));
												}}
												onBlur={() => {
													validateconsignor();
												}}
												inputProps={{
													minLength: 15,
													maxLength: 15,
												}}
												className={
													isConsignorHasQuotation
														? 'shine-background'
														: ''
												}
												endAdornment={
													isConsignorLoading ? (
														<InputAdornment position='end'>
															<CircularProgress
																size={24}
															/>
														</InputAdornment>
													) : (
														<></>
													)
												}
												onKeyUp={(event) => {
													if (!formData.consignor) {
														onEnterFocusNext(
															event,
															'consignor'
														);
													} else if (
														!formData.consignorPhone
													) {
														onEnterFocusNext(
															event,
															'consignor-phone'
														);
													}
												}}
												onKeyDown={(event) => {
													if (!formData.consignor) {
														onTabFocusNext(
															event,
															'consignor'
														);
													} else if (
														!formData.consignorPhone
													) {
														onTabFocusNext(
															event,
															'consignor-phone'
														);
													}
												}}
											/>
											{formError.consignorGST && (
												<FormHelperText error>
													{formError.consignorGST}
												</FormHelperText>
											)}
										</FormControl>
									}
									<FormControl

										error={
											formError.consignor ? true : false
										}
									>
										<Autocomplete
											id='consignor'
											selectOnFocus
											size='small'
											value={enterConsignorName}

											onKeyDownCapture={() => handleQuotationData()}
											onChange={(_event, newValue) => {
												if (
													typeof newValue === 'string'
												) {
													setEnterConsignorName({
														partyName: newValue,
													});
												} else if (
													newValue &&
													newValue.inputValue
												) {
													setEnterConsignorName({
														partyName:
															newValue.inputValue,
													});

													setformData(
														(prev: any) => ({
															...prev,
															consignor:
																newValue.inputValue,
															consignorPhone: '',
														})
													);
												} else {
													setEnterConsignorName(
														newValue
													);

													if (newValue) {
														setformData(
															(prev: any) => ({
																...prev,
																consignor:
																	newValue.partyName
																		? newValue.partyName
																		: '',
																consignorPhone:
																	newValue.phoneNo,
																consignorGST:
																	newValue.gstNo,
															})
														);
													} else {
														setformData(
															(prev: any) => ({
																...prev,
																consignor: '',
																consignorPhone:
																	'',
																consignorGST:
																	'',
															})
														);
													}
												}
											}}
											filterOptions={(
												options,
												params
											) => {
												const filtered =
													consignorFilter(
														options,
														params
													);

												const { inputValue } = params;

												const isExisting = options.some(
													(option) =>
														inputValue ===
														option.partyName
												);
												if (
													inputValue !== '' &&
													!isExisting
												) {
													filtered.push({
														inputValue,
														partyName: `Add "${inputValue}"`,
													});
												}

												return filtered;
											}}
											clearOnBlur
											handleHomeEndKeys
											options={consignors}
											getOptionLabel={(option) => {
												if (
													typeof option === 'string'
												) {
													return option;
												}
												if (option.inputValue) {
													return option.inputValue;
												}
												return option.partyName;
											}}
											renderOption={(props, option) => (
												<li {...props}>
													{option.partyName}
												</li>
											)}
											freeSolo
											renderInput={(params) => (
												<TextField
													onKeyDownCapture={() => handleQuotationData()}
													required
													{...params}
													label={
														isConsignorHasQuotation
															? 'Consignor (With quotation)'
															: 'Consignor'
													}
													error={
														formError.consignor
															? true
															: false
													}
													onBlur={validateconsignor}
													className={
														isConsignorHasQuotation
															? 'shine-background'
															: ''
													}
													onKeyUp={(event) => {
														if (
															!formData.consignorPhone
														) {
															onEnterFocusNext(
																event,
																'consignor-phone'
															);
														} else if (
															!formData.consigneeGST
														) {
															onEnterFocusNext(
																event,
																'consignee-gst'
															);
														}
													}}
													onKeyDown={(event) => {
														if (
															!formData.consignorPhone
														) {
															onTabFocusNext(
																event,
																'consignor-phone'
															);
														} else if (
															!formData.consigneeGST
														) {
															onTabFocusNext(
																event,
																'consignee-gst'
															);
														}
													}}
												/>
											)}
										/>
										{formError.consignor && (
											<FormHelperText error>
												{formError.consignor}
											</FormHelperText>
										)}
									</FormControl>

									<FormControl
										size='small'
										variant='outlined'
										fullWidth

										error={
											formError.consignorPhone
												? true
												: false
										}

										required
									>
										<InputLabel htmlFor='from'

										>

											Consignor Phone Number
										</InputLabel>
										<OutlinedInput
											id='consignor-phone'
											label='Consignor Phone Number'
											type='number'
											value={formData.consignorPhone}
											onBlur={validateconsignorPhone}

											onChange={(event) => {
												setformData((prev) => ({
													...prev,
													consignorPhone:
														event.target.value,
												}));
											}}
											className={
												isConsignorHasQuotation
													? 'shine-background'
													: ''
											}
											onKeyUp={(event) => {
												if (!formData.consigneeGST) {
													onEnterFocusNext(
														event,
														'consignee-gst'
													);
												} else if (
													!formData.consignee
												) {
													onEnterFocusNext(
														event,
														'consignee'
													);
												} else if (
													!formData.consigneePhone
												) {
													onEnterFocusNext(
														event,
														'consignee-phone'
													);
												}
											}}
											onKeyDown={(event) => {
												if (!formData.consigneeGST) {
													onTabFocusNext(
														event,
														'consignee-gst'
													);
												} else if (
													!formData.consignee
												) {
													onTabFocusNext(
														event,
														'consignee'
													);
												} else if (
													!formData.consigneePhone
												) {
													onTabFocusNext(
														event,
														'consignee-phone'
													);
												}
											}}
										/>
										{formError.consignorPhone && (
											<FormHelperText error>
												{formError.consignorPhone}
											</FormHelperText>
										)}
									</FormControl>
								</div>
								<div
									data-component='booking'
									className='columns-2'
								>
									{currentBillType?.billType === 'Bill' &&
										<FormControl
											size='small'
											variant='outlined'
											fullWidth

											error={
												formError.consigneeGST
													? true
													: false
											}
										>
											<InputLabel htmlFor='from'>
												Consignee GST Number
											</InputLabel>
											<OutlinedInput

												id='consignee-gst'
												label='Consignee GST Number'
												type='text'
												value={formData.consigneeGST}

												onChange={(event) => {
													setformData((prev) => ({
														...prev,
														consigneeGST:
															event.target.value.toLocaleUpperCase(),
													}));
												}}
												data-tabindex='8'
												onBlur={() => {
													validateconsignee();
												}}
												inputProps={{
													minLength: 15,
													maxLength: 15,
												}}
												className={
													isConsigneeHasQuotation
														? 'shine-background'
														: ''
												}
												endAdornment={
													isConsigneeLoading ? (
														<InputAdornment position='end'>
															<CircularProgress
																size={24}
															/>
														</InputAdornment>
													) : (
														<></>
													)
												}
												onKeyUp={(event) => {
													if (!formData.consignee) {
														onEnterFocusNext(
															event,
															'consignee'
														);
													} else if (
														!formData.consigneePhone
													) {
														onEnterFocusNext(
															event,
															'consignee-phone'
														);
													}
												}}
												onKeyDown={(event) => {
													if (!formData.consignee) {
														onTabFocusNext(
															event,
															'consignee'
														);
													} else if (
														!formData.consigneePhone
													) {
														onTabFocusNext(
															event,
															'consignee-phone'
														);
													}
													// else if(
													// 	!formData.paymentType
													// )
												}}
											/>
											{formError.consigneeGST && (
												<FormHelperText error>
													{formError.consigneeGST}
												</FormHelperText>
											)}
										</FormControl>
									}
									<FormControl

										error={
											formError.consignee ? true : false
										}
									>
										<Autocomplete
											id='consignee'

											selectOnFocus
											size='small'
											value={enterConsigneeName}

											onKeyDownCapture={() => handleQuotationData()}
											onChange={(_event, newValue) => {
												if (
													typeof newValue === 'string'
												) {
													setEnterConsigneeName({
														partyName: newValue,
													});
												} else if (
													newValue &&
													newValue.inputValue
												) {
													setEnterConsigneeName({
														partyName:
															newValue.inputValue,
													});

													setformData(
														(prev: any) => ({
															...prev,
															consignee:
																newValue.inputValue,
															consigneePhone: '',
														})
													);
												} else {
													setEnterConsigneeName(
														newValue
													);

													if (newValue) {
														setformData(
															(prev: any) => ({
																...prev,
																consignee:
																	newValue.partyName,
																consigneePhone:
																	newValue.phoneNo,
																consigneeGST:
																	newValue.gstNo,
															})
														);
													} else {
														setformData(
															(prev: any) => ({
																...prev,
																consignee: '',
																consigneePhone:
																	'',
																consigneeGST:
																	'',
															})
														);
													}
												}
											}}
											filterOptions={(
												options,
												params
											) => {
												const filtered =
													consigneeFilter(
														options,
														params
													);

												const { inputValue } = params;

												const isExisting = options.some(
													(option) =>
														inputValue ===
														option.partyName
												);
												if (
													inputValue !== '' &&
													!isExisting
												) {
													filtered.push({
														inputValue,
														partyName: `Add "${inputValue}"`,
													});
												}

												return filtered;
											}}
											clearOnBlur
											handleHomeEndKeys
											options={consignees}
											getOptionLabel={(option) => {
												if (
													typeof option === 'string'
												) {
													return option;
												}
												if (option.inputValue) {
													return option.inputValue;
												}
												return option.partyName;
											}}
											renderOption={(props, option) => (
												<li {...props}>
													{option.partyName}
												</li>
											)}
											freeSolo
											renderInput={(params) => (
												<TextField
													{...params}
													required
													label={
														isConsigneeHasQuotation
															? 'Consignee (With quotation)'
															: 'Consignee'
													}
													error={
														formError.consignee
															? true
															: false
													}
													onBlur={validateconsignee}
													className={
														isConsigneeHasQuotation
															? 'shine-background'
															: ''
													}
													onKeyUp={(event) => {
														if (
															!formData.consigneePhone
														) {
															onEnterFocusNext(
																event,
																'consignee-phone'
															);
														}
													}}
													onKeyDown={(event) => {
														if (
															!formData.consigneePhone
														) {
															onTabFocusNext(
																event,
																'consignee-phone'
															);
														}
													}}
												/>
											)}
										/>
										{formError.consignee && (
											<FormHelperText error>
												{formError.consignee}
											</FormHelperText>
										)}
									</FormControl>

									<FormControl
										size='small'
										variant='outlined'
										fullWidth
										error={
											formError.consigneePhone
												? true
												: false
										}

										required
									>
										<InputLabel htmlFor='from'>
											Consignee Phone Number
										</InputLabel>
										<OutlinedInput
											id='consignee-phone'
											label='Consignee Phone Number'
											type='number'
											value={formData.consigneePhone}
											onBlur={validateconsigneePhone}
											onChange={(event) => {
												setformData((prev) => ({
													...prev,
													consigneePhone:
														event.target.value,
												}));
											}}
											className={
												isConsigneeHasQuotation
													? 'shine-background'
													: ''
											}
											onKeyUp={(event) => {
												if (
													isConsignorHasQuotation &&
													isConsigneeHasQuotation
												) {
													onEnterFocusNext(
														event,
														'quotation-to'
													);
												} else {
													onEnterFocusNext(
														event,
														'payment-type'
													);
												}
											}}
											onKeyDown={(event) => {
												if (
													isConsignorHasQuotation &&
													isConsigneeHasQuotation
												) {
													onTabFocusNext(
														event,
														'quotation-to'
													);
												} else {
													onTabFocusNext(
														event,
														'payment-type'
													);
												}
											}}
										/>
										{formError.consigneePhone && (
											<FormHelperText error>
												{formError.consigneePhone}
											</FormHelperText>
										)}
									</FormControl>
								</div>
							</div>

							<div
								data-component='booking'
								className='container'
							>
								{isConsignorHasQuotation &&
									isConsigneeHasQuotation && (
										<div
											data-component='booking'
											className='columns-5'
										>
											<FormControl
												size='small'
												variant='outlined'
												fullWidth
												disabled={!isAdmin && formCopy?.toBranchId !== 0}
											>
												<InputLabel>
													Quotation to
												</InputLabel>
												<Select
													id='quotation-to'
													label='Quotation to'
													value={formData.quotationBy}
													onChange={(event) => {
														setformData((prev) => ({
															...prev,
															quotationBy:
																event.target
																	.value,
														}));
													}}
												>
													<MenuItem value='Consignee'>
														Consignee
													</MenuItem>
													<MenuItem value='Consignor'>
														Consignor
													</MenuItem>
												</Select>
											</FormControl>
										</div>
									)}

								<div
									data-component='booking'
									className='columns-5'
								>
									<FormControl
										size='small'
										variant='outlined'
										fullWidth

										error={
											formError.paymentType ? true : false
										}
										disabled={formCopy.bookingDetails.length > 0 && !isAdmin}
									>
										<InputLabel>Payment Type</InputLabel>
										<Select
											id='payment-type'
											label='Payment Type'
											data-tabindex='14'
											value={formData.paymentType}
											onChange={(event) => {
												setformData((prev) => ({
													...prev,
													paymentType:
														+event.target.value,
												}));
											}}

											onBlur={validatepaymentType}


										>
											{paymentTypes.map((type) => {
												return (
													<MenuItem
														key={`payment-type-${type.paymentTypeId}`}
														value={
															type.paymentTypeId
														}
													>
														{type.paymentType}
													</MenuItem>
												);
											})}
										</Select>
										{formError.paymentType && (
											<FormHelperText error>
												{formError.paymentType}
											</FormHelperText>
										)}
									</FormControl>
								</div>
								<div
									data-component='booking'
									className='columns-4'
								>
									<FormControl
										size='small'
										variant='outlined'
										fullWidth

										error={formError.shape ? true : false}
									>
										<Autocomplete
											selectOnFocus
											size='small'
											options={consignorArticleShape.length > 0 ? consignorArticleShape : articleShape}
											value={tableRow.shape as any}
											onChange={(
												_event,
												newInputValue

											) => {


												if (
													typeof newInputValue ===
													'string'
												) {
													setTableRow((prev) => ({
														...prev,
														shape: newInputValue,
													}));
												} else if (
													newInputValue &&
													newInputValue.inputValue
												) {
													setTableRow((prev) => ({
														...prev,
														shape: newInputValue.inputValue,
													}));
												} else {
													setTableRow((prev) => ({
														...prev,
														shape:
															newInputValue?.articleShape ||
															'',
													}));
												}
											}}
											filterOptions={(
												options,

												params
											) => {

												const filtered = options.filter(
													(option) => option?.articleShape?.toLowerCase().includes(params.inputValue.toLowerCase())
												);

												if (
													params.inputValue !== '' &&
													!options.some(
														(option) =>
															option.articleShape ===
															params.inputValue
													)
												) {
													filtered.push({
														inputValue:
															params.inputValue,
														articleShape: `Add "${params.inputValue}"`,
													});
												}

												return filtered;
											}}
											clearOnBlur
											handleHomeEndKeys
											getOptionLabel={(option) => {
												if (
													typeof option === 'string'
												) {
													return option;
												}
												if (option.inputValue) {
													return option.inputValue;
												}
												return option.articleShape;
											}}
											renderOption={(props, option) => (
												<li {...props}>
													{option.articleShape}
												</li>
											)}
											freeSolo
											openOnFocus
											renderInput={(params) => (
												<TextField
													{...params}
													label='Article Shape'
													data-tabindex='15'
													error={
														formError.shape
															? true
															: false
													}
													onBlur={validateShape}
												/>
											)}
										/>
										{formError.shape && (
											<FormHelperText error>
												{formError.shape}
											</FormHelperText>
										)}
									</FormControl>
								</div>
								<div
									data-component='booking'
									className='columns-2'
								>
									{/* <FormControl
										error={
											formError.goodsTypeId ? true : false
										}
									>
										<Autocomplete
											id='goods-type'
											selectOnFocus
											size='small'
											options={goodsType}
											value={formData.goodsType as any}
											onChange={(
												_event,
												newInputValue
											) => {
												if (
													typeof newInputValue ===
													'string'
												) {
													setformData((prev) => ({
														...prev,
														goodsTypeId: 0,
														goodsType:
															newInputValue,
													}));
													setTableRow((prev) => ({
														...prev,
														goodsType:
															newInputValue,
													}));
												} else if (
													newInputValue &&
													newInputValue.inputValue
												) {
													setformData((prev) => ({
														...prev,
														goodsTypeId: 0,
														goodsType:
															newInputValue.inputValue,
													}));
													setTableRow((prev) => ({
														...prev,
														goodsType:
															newInputValue.inputValue,
													}));
												} else {
													setformData((prev) => ({
														...prev,
														goodsTypeId:
															newInputValue?.goodsTypeId ||
															0,
														goodsType:
															newInputValue?.goodsType ||
															'',
													}));
													setTableRow((prev) => ({
														...prev,
														goodsType:
															newInputValue?.goodsType ||
															'',
													}));
												}
											}}
											filterOptions={(
												options,
												params
											) => {
												const filtered = options.filter(
													(option) =>
														option.goodsType
															.toLowerCase()
															.includes(
																params.inputValue.toLowerCase()
															)
												);

												if (
													params.inputValue !== '' &&
													!options.some(
														(option) =>
															option.goodsType ===
															params.inputValue
													)
												) {
													filtered.push({
														inputValue:
															params.inputValue,
														goodsType: `Add "${params.inputValue}"`,
													});
												}

												return filtered;
											}}
											clearOnBlur
											handleHomeEndKeys
											getOptionLabel={(option) => {
												if (
													typeof option === 'string'
												) {
													return option;
												}
												if (option.inputValue) {
													return option.inputValue;
												}
												return option.goodsType;
											}}
											renderOption={(props, option) => (
												<li {...props}>
													{option.goodsType}
												</li>
											)}
											freeSolo
											renderInput={(params) => (
												<TextField
													{...params}
													size='small'
													label='Goods Type'
													data-tabindex='13'
													value={tableRow.goodsType}
													error={
														formError.goodsTypeId
															? true
															: false
													}
													onBlur={validategoodsTypeId}
												/>
											)}
										/>
										{formError.goodsTypeId && (
											<FormHelperText error>
												{formError.goodsTypeId}
											</FormHelperText>
										)}
									</FormControl> */}
									<FormControl

										error={Boolean(formError.goodsTypeId)}
									>
										<Autocomplete
											id='goods-type'

											selectOnFocus
											size='small'
											options={goodsType}
											value={formData.goodsType as any}
											onChange={(
												_event,
												newInputValue
											) => {
												if (
													typeof newInputValue ===
													'string'
												) {
													setformData((prev) => ({
														...prev,
														goodsTypeId: 0,
														goodsType:
															newInputValue,
													}));
													setTableRow((prev) => ({
														...prev,
														goodsType:
															newInputValue,
													}));
												} else if (
													newInputValue &&
													newInputValue.inputValue
												) {
													setformData((prev) => ({
														...prev,
														goodsTypeId: 0,
														goodsType:
															newInputValue.inputValue,
													}));
													setTableRow((prev) => ({
														...prev,
														goodsType:
															newInputValue.inputValue,
													}));
												} else {
													setformData((prev) => ({
														...prev,
														goodsTypeId:
															newInputValue?.goodsTypeId ||
															0,
														goodsType:
															newInputValue?.goodsType ||
															'',
													}));
													setTableRow((prev) => ({
														...prev,
														goodsType:
															newInputValue?.goodsType ||
															'',
													}));
												}
											}}
											onInputChange={(
												_event,
												newInputValue,
												reason
											) => {
												if (
													reason === 'input' &&
													newInputValue
												) {
													const matchedOption =
														goodsType.find(
															(option) =>
																option.goodsType
																	.toLowerCase()
																	.startsWith(
																		newInputValue.toLowerCase()
																	)
														);
													if (matchedOption) {
														setformData((prev) => ({
															...prev,
															goodsTypeId:
																matchedOption.goodsTypeId,
															goodsType:
																matchedOption.goodsType,
														}));
														setTableRow((prev) => ({
															...prev,
															goodsType:
																matchedOption.goodsType,
														}));
													}
												}
											}}
											filterOptions={(
												options,
												params
											) => {
												const filtered = options.filter(
													(option) =>
														option.goodsType
															.toLowerCase()
															.includes(
																params.inputValue.toLowerCase()
															)
												);

												if (
													params.inputValue !== '' &&
													!options.some(
														(option) =>
															option.goodsType ===
															params.inputValue
													)
												) {
													filtered.push({
														inputValue:
															params.inputValue,
														goodsType: `Add "${params.inputValue}"`,
													});
												}

												return filtered;
											}}
											clearOnBlur
											handleHomeEndKeys
											getOptionLabel={(option) => {
												if (
													typeof option === 'string'
												) {
													return option;
												}
												if (option.inputValue) {
													return option.inputValue;
												}
												return option.goodsType;
											}}
											renderOption={(props, option) => (
												<li {...props}>
													{option.goodsType}
												</li>
											)}
											freeSolo
											openOnFocus
											renderInput={(params) => (
												<TextField
													{...params}
													size='small'
													label='Goods Type'
													data-tabindex='13'
													value={tableRow.goodsType}
													error={Boolean(
														formError.goodsTypeId
													)}
													onBlur={validategoodsTypeId}
												/>
											)}
										/>
										{formError.goodsTypeId && (
											<FormHelperText error>
												{formError.goodsTypeId}
											</FormHelperText>
										)}
									</FormControl>
								</div>


							</div>
							<div
								data-component='booking'
								className='container'
							>
								<div
									data-component='booking'
									className='columns-5'
								>
									<FormControl
										size='small'
										variant='outlined'
										fullWidth

										error={formError.articleRateTypeId ? true : false}
									>
										<InputLabel>Rate Type</InputLabel>
										<Select
											label='Rate Type'
											data-tabindex='15'
											value={
												tableRow.shape ? (
													choosedQuotation
														? rateTypes.find(item => item.rateTypeId == choosedQuotation.rateType)?.rateTypeId
														: quotations && quotations.find(q => q.shapeId === null)
															? rateTypes.find(r => r.rateTypeId == quotations.find(q => q.shapeId === null)?.rateType)?.rateTypeId
															: tableRow.articleRateTypeId
												) : ''
											}


											onChange={(event) => {
												setTableRow((prev) => ({
													...prev,
													articleRateTypeId: event.target.value as number,
												}));
											}}
										>

											{choosedQuotation ? (
												<MenuItem
													key={choosedQuotation.quotationId}
													value={rateTypes.find(item => item.rateTypeId == choosedQuotation.rateType)?.rateTypeId}
												>
													{rateTypes.find(item => item.rateTypeId == choosedQuotation.rateType)?.rateType || 'no'}
												</MenuItem>
											) : quotations && quotations.find(q => q.shapeId === null) ? (
												<MenuItem
													value={rateTypes.find(r => r.rateTypeId == quotations.find(q => q.shapeId === null)?.rateType)?.rateTypeId}
												>
													{rateTypes.find(r => r.rateTypeId == quotations.find(q => q.shapeId === null)?.rateType)?.rateType}
												</MenuItem>
											) : (
												rateTypes.map((type) => (
													<MenuItem
														key={type.rateTypeId}
														value={type.rateTypeId}
													>
														{type.rateType}
													</MenuItem>
												))
											)}
										</Select>

										{formError.articleRateTypeId && (
											<FormHelperText error>
												{formError.articleRateTypeId}
											</FormHelperText>
										)}
									</FormControl>

								</div>
								<div
									data-component='booking'
									className='columns-7'
								>
									<FormControl
										size='small'
										variant='outlined'
										fullWidth
										// disabled={!isAdmin && formCopy?.toBranchId !== 0}
										error={formError.rate ? true : false}
									>
										<InputLabel>Rate</InputLabel>
										<OutlinedInput
											label='Rate'
											type='number'
											data-tabindex='16'
											value={tableRowEditMode && formCopy.bookingId !== 0 ? tableRow.rate : tableRow.shape ? (
												choosedQuotation
													? choosedQuotation?.billRate || choosedQuotation?.rate
													: quotations && quotations.find(q => q.shapeId === null)?.billRate || quotations.find(q => q.shapeId === null)?.rate as any

														? currConsignorQuotation.find(item => item.shapeId == null)?.rate : tableRow.rate
											) : tableRow.rate as number
											}
											onKeyDownCapture={(e) => {
												if (e.key === 'Enter' || e.key === 'Tab') {
													if (formCopy.bookingId === 0) {
														const x = choosedQuotation
															? choosedQuotation?.billRate || choosedQuotation?.rate
															: currConsignorQuotation.find(item => item.shapeId === null)?.rate
														setTableRow((prev) => ({
															...prev,
															rate: x as number,
														}));
														onEnterFocusNext(e, 'article')
													}

												}
											}}
											onChange={(event: any) => {
												setTableRow((prev) => ({
													...prev,
													rate: +event.target.value as number,
												}));



											}}

											onBlurCapture={() => {
												if (userDetails?.userTypeId !== 1 && tableRow.bookingId !== '') {
													if (tableRowCopy.rate > tableRow.rate) {
														setTableRow((prev) => ({
															...prev,
															rate: tableRowCopy.rate,
														}));



														handleOpenAlertDialog('warning', `Value can not be less than ${tableRowCopy?.rate}`)

													}
												}

											}}

										/>

										{formError.rate && (
											<FormHelperText error>
												{formError.rate}
											</FormHelperText>
										)}
									</FormControl>
								</div>
								<div
									data-component='booking'
									className='columns-5'
								>
									<FormControl
										size='small'
										variant='outlined'
										fullWidth

										error={formError.article ? true : false}
									>
										<InputLabel htmlFor='article'>
											Article
										</InputLabel>
										<OutlinedInput
											label='Article'
											id='article'
											type='number'
											value={tableRow.article}
											onChange={(event: any) => {
												setTableRow((prev) => ({
													...prev,
													article: +event.target
														.value as number,
												}));
											}}
											onBlurCapture={() => {
												if (userDetails?.userTypeId !== 1 && tableRow.bookingId !== '') {
													if (tableRowCopy.article > tableRow.article) {
														setTableRow((prev) => ({
															...prev,
															article: tableRowCopy.article,
														}));
														handleOpenAlertDialog('warning', `Value can not be less than ${tableRowCopy?.article}`)

													}
												}

											}}
											onKeyDownCapture={(e) => {
												if (e.key === 'Enter' || e.key === 'Tab') {
													const y = choosedQuotation
														? choosedQuotation?.rateType || choosedQuotation?.rateType

														: quotations.find(item => item.shapeId === null)?.rateType
													const x = choosedQuotation
														? choosedQuotation?.billRate || choosedQuotation?.rate
														: currConsignorQuotation.find(item => item.shapeId === null)?.rate || tableRow.rate
													setTableRow((prev) => ({
														...prev,
														rate: x as number,
													}));
													setTableRow((prev) => ({
														...prev,
														articleRateTypeId: +y,
													}));
													onEnterFocusNext(e, 'weight')

												}
											}}
											onClick={() => {
												const x = choosedQuotation
													? choosedQuotation?.billRate || choosedQuotation?.rate
													: currConsignorQuotation.find(item => item.shapeId === null)?.rate || tableRow.rate
												setTableRow((prev) => ({
													...prev,
													rate: x as number,
												}));

												const y = choosedQuotation
													? choosedQuotation?.rateType || choosedQuotation?.rateType

													: quotations.find(item => item.shapeId === null)?.rateType
												setTableRow((prev) => ({
													...prev,
													articleRateTypeId: +y,
												}));
											}}
										/>
										{formError.article && (
											<FormHelperText error>
												{formError.article}
											</FormHelperText>
										)}
									</FormControl>
								</div>
								<div
									data-component='booking'
									className='columns-5'
								>
									<FormControl
										size='small'
										variant='outlined'
										fullWidth

										error={formError.weight ? true : false}
									>
										<InputLabel htmlFor='from'>
											Weight
										</InputLabel>
										<OutlinedInput
											label='Weight'
											id='weight'
											type='number'
											data-tabindex='18'
											value={tableRow.weight}
											onChange={(event: any) => {
												setTableRow((prev) => ({
													...prev,
													weight: event.target
														.value as number,
												}));
											}}
											onBlurCapture={() => {
												if (userDetails?.userTypeId !== 1 && tableRow.bookingId !== '') {
													if (tableRowCopy.weight > tableRow.weight) {
														setTableRow((prev) => ({
															...prev,
															weight: tableRowCopy.weight,
														}));
														handleOpenAlertDialog('warning', `Value can not be less than ${tableRowCopy?.weight}`)

													}
												}

											}}
										/>
										{formError.weight && (
											<FormHelperText error>
												{formError.weight}
											</FormHelperText>
										)}
									</FormControl>
								</div>
								<div
									data-component='booking'
									className='columns-5'
								>
									<FormControl
										size='small'
										variant='outlined'
										fullWidth

										error={
											formError.chargeWeight
												? true
												: false
										}


									>
										<InputLabel htmlFor='charge-weight'>
											Chg. Weight
										</InputLabel>
										<OutlinedInput
											label='Chg. Weight'
											id='charge-weight'
											type='number'
											data-tabindex='19'
											tabIndex={19}
											value={tableRow.chargeWeight}
											onChange={(event: any) => {
												setTableRow((prev) => ({
													...prev,
													chargeWeight: event.target
														.value as number,
												}));
											}}
											onBlurCapture={() => {
												if (userDetails?.userTypeId !== 1 && tableRow.bookingId !== '') {
													if (tableRowCopy.chargeWeight > tableRow.chargeWeight) {
														setTableRow((prev) => ({
															...prev,
															chargeWeight: tableRowCopy.chargeWeight,
														}));
														handleOpenAlertDialog('warning', `Value can not be less than ${tableRowCopy?.chargeWeight}`)

													}
												}

											}}
											onBlur={validatechargeWeight}
											onKeyUp={(event) => {
												onEnterFocusNext(
													event,
													'add-button'
												);
											}}
											onKeyDown={(event) => {
												onTabFocusNext(
													event,
													'add-button'
												);
											}}
										/>
										{formError.chargeWeight && (
											<FormHelperText error>
												{formError.chargeWeight}
											</FormHelperText>
										)}
									</FormControl>
								</div>
								<div
									data-component='booking'
									className='columns-4'
								>
									<FormControl
										size='small'
										variant='outlined'
										fullWidth
										focused={false}
										disabled={true}
									>
										<InputLabel>Freight</InputLabel>
										<OutlinedInput
											label='Freight'
											type='number'
											data-tabindex='20'
											value={tableRow.freight}
											contentEditable={false}
										/>
									</FormControl>
								</div>
								{/* <div
									data-component='booking'
									className='columns-3'
								>
									<FormControl
										size='small'
										variant='outlined'

										fullWidth
										error={
											formError.labourRateTypeId
												? true
												: false
										}
									>
										<InputLabel>Labour Type</InputLabel>
										<Select
											label='Labour Type'
											data-tabindex='21'
											value={
												tableRow.labourRateTypeId
													? tableRow.labourRateTypeId
													: '0'
											}
											onChange={(event: any) => {
												setTableRow((prev) => ({
													...prev,
													labourRateTypeId: event
														.target.value as number,
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
										{formError.labourRateTypeId && (
											<FormHelperText error>
												{formError.labourRateTypeId}
											</FormHelperText>
										)}
									</FormControl>
								</div> */}

								{/* <div
									data-component='booking'
									className='columns-4'
								>
									<FormControl
										size='small'
										variant='outlined'
										fullWidth

										error={
											formError.labourRate ? true : false
										}
									>
										<InputLabel htmlFor='from'>
											Labour Rate
										</InputLabel>
										<OutlinedInput
											label='Labour Rate'
											type='number'
											data-tabindex='22'
											value={tableRow.labourRate}
											onChange={(event: any) => {
												setTableRow((prev) => ({
													...prev,
													labourRate: event.target
														.value as number,
												}));
											}}
											onBlurCapture={() => {
												if (userDetails?.userTypeId !== 1 && tableRow.bookingId!=='') {
													console.log(tableRowCopy);
													if(tableRowCopy.labourRate>tableRow.labourRate){
														setTableRow((prev) => ({
															...prev,
															labourRate: tableRowCopy.labourRate,
														}));
														handleOpenAlertDialog('warning', `Value can not be less than ${tableRowCopy?.labourRate}`)
	
													}
												}
		
											}}
										/>
										{formError.labourRate && (
											<FormHelperText error>
												{formError.labourRate}
											</FormHelperText>
										)}
									</FormControl>
								</div> */}
								<div
									data-component='booking'
									className='columns-3'
								>
									<div
										data-component='booking'
										className='container'
									>
										{/* <FormControl
											size='small'
											variant='outlined'
											fullWidth
											focused={false}
											disabled={true}
										>
											<InputLabel htmlFor='from'>
												Labour
											</InputLabel>
											<OutlinedInput
												label='Labour'
												type='number'
												data-tabindex='23'
												value={
													tableRow.totalLabour
														? tableRow.totalLabour
														: '0'
												}
												contentEditable={false}
											/>
										</FormControl> */}
										<IconButton
											color='primary'
											onClick={handleAddTableRow}
											id='add-button'
										>
											<Add />
										</IconButton>
									</div>
								</div>
							</div>

							<MaterialReactTable table={table} />

							<div
								data-component='booking'
								className='container'
							>
								<div
									data-component='booking'
									className='columns-5'
								>
									<FormControl
										size='small'
										variant='outlined'
										fullWidth

										error={
											formError.invoiceNumber
												? true
												: false
										}
										required
									>
										<InputLabel>Invoice Number</InputLabel>
										<OutlinedInput
											id='invoice-number'
											label='Invoice Number'
											type='text'
											data-tabindex='24'
											value={`${formData.invoiceNumber
												? formData.invoiceNumber
												: ''
												}`}
											onChange={(event: any) => {
												setformData((prev) => ({
													...prev,
													invoiceNumber:
														event.target.value,
												}));
											}}
											onBlur={validateinvoiceNumber}

											onKeyUp={(event) => {
												if (formData.invoiceNumber) {
													onEnterFocusNext(
														event,
														'declared-value'
													);
												}
											}}
											onKeyDown={(event) => {
												if (formData.invoiceNumber) {
													onTabFocusNext(
														event,
														'declared-value'
													);
												}
											}}
										/>
										{formError.invoiceNumber && (
											<FormHelperText error>
												{formError.invoiceNumber}
											</FormHelperText>
										)}
									</FormControl>
								</div>
								<div
									data-component='booking'
									className='columns-5'
								>
									<FormControl
										size='small'
										// disabled = {!isAdmin && formCopy?.toBranchId!==0}
										variant='outlined'
										fullWidth
										error={
											formError.declaredValue
												? true
												: false
										}
										required
									>
										<InputLabel>Declared Value</InputLabel>
										<OutlinedInput
											id='declared-value'
											label='Declared Value'
											type='number'
											data-tabindex='25'
											value={`${formData.declaredValue
												? formData.declaredValue
												: ''
												}`}
											onChange={(event: any) => {
												setformData((prev) => ({
													...prev,
													declaredValue:
														event.target.value,
												}));
											}}
											onBlur={validatedeclaredValue}
											// disabled={
											// 	gotDataFromEwaybill
											// 		? true
											// 		: formData.eWayBillNumber
											// 			? true
											// 			: false || !isAdmin && formCopy?.toBranchId!==0
											// }
											onKeyUp={(event) => {
												onEnterFocusNext(event, 'mode');
											}}
											onKeyDown={(event) => {
												onTabFocusNext(event, 'mode');
											}}
										/>
										{formError.declaredValue && (
											<FormHelperText error>
												{formError.declaredValue}
											</FormHelperText>
										)}
									</FormControl>
								</div>
								<div
									data-component='booking'
									className='columns-4'
								>
									<FormControl
										error={
											formError.goodsReceivedBy
												? true
												: false
										}
									>
										<Autocomplete
											id='goods-received-by'
											selectOnFocus
											size='small'
											options={allActiveUsers}
											value={
												formData.goodsReceivedBy as any
											}
											disabled={true}
											onChange={(
												_event,
												newInputValue
											) => {
												if (newInputValue) {
													setformData((prev) => ({
														...prev,
														goodsReceivedBy:
															newInputValue.fullName,
													}));
												} else {
													setformData((prev) => ({
														...prev,
														goodsReceivedBy: '',
													}));
												}
											}}
											openOnFocus={true}
											renderInput={(params) => (
												<TextField
													{...params}
													size='small'
													label='Goods Received By'
													data-tabindex='29'
													error={
														formError.goodsReceivedBy
															? true
															: false
													}
													onBlur={
														validategoodsReceivedBy
													}
													onKeyUp={(event) => {
														onEnterFocusNext(
															event,
															'mode'
														);
													}}
													onKeyDown={(event) => {
														onTabFocusNext(
															event,
															'mode'
														);
													}}
												/>
											)}
										/>
										{formError.goodsReceivedBy && (
											<FormHelperText error>
												{formError.goodsReceivedBy}
											</FormHelperText>
										)}
									</FormControl>
								</div>
								<div
									data-component='booking'
									className='columns-3'
								>
									<FormControl
										size='small'
										variant='outlined'
										fullWidth

										error={formError.mode ? true : false}
									>
										<InputLabel>Mode</InputLabel>
										<Select
											id='mode'
											label='Mode'
											data-tabindex='30'
											value={`${formData.mode
												? formData.mode
												: ''
												}`}
											onChange={(event: any) => {
												setformData((prev) => ({
													...prev,
													mode: event.target.value,
												}));

											}}
											onBlur={validatemode}
											onKeyUp={(event) => {
												onEnterFocusNext(
													event,
													'private-mark'
												);
											}}
											onKeyDown={(event) => {
												onTabFocusNext(
													event,
													'private-mark'
												);
											}}
										>
											{formTypes.map((type) => {
												return (
													<MenuItem
														key={type.formType}
														value={type.formType}
													>
														{type.formType}
													</MenuItem>
												);
											})}
										</Select>
										{formError.mode && (
											<FormHelperText error>
												{formError.mode}
											</FormHelperText>
										)}
									</FormControl>
								</div>
							</div>

							<FormControl
								size='small'
								variant='outlined'
								fullWidth

								error={formError.privateMark ? true : false}
								required
							>
								<InputLabel>Private Mark</InputLabel>
								<OutlinedInput
									id='private-mark'
									label='Private Mark'
									type='text'
									data-tabindex='26'
									multiline
									value={`${formData.privateMark
										? formData.privateMark
										: ''
										}`}
									onChange={(event: any) => {
										setformData((prev) => ({
											...prev,
											privateMark: event.target.value,
										}));
									}}
									onBlur={validateprivateMark}
								/>
								{formError.privateMark && (
									<FormHelperText error>
										{formError.privateMark}
									</FormHelperText>
								)}
							</FormControl>

							<FormControl
								size='small'
								variant='outlined'
								fullWidth

							>
								<InputLabel>Note</InputLabel>
								<OutlinedInput
									id='note'
									label='Note'
									type='text'
									multiline
									data-tabindex='31'
									value={formData.note}
									onChange={(event: any) => {
										setformData((prev) => ({
											...prev,
											note: event.target.value,
										}));
									}}
								/>
							</FormControl>

							{currentBillType?.billType === 'Bill' && (
								<div
									data-component='booking'
									className='container'
								>
									<div
										data-component='booking'
										className='columns-2'
									>
										{eWayNumbers.map((number, index) => {
											return (
												<div
													key={`number-${index}`}
													data-component='booking'
													className='eway-bill-number'
												>
													<FormControl

														size='small'
														variant='outlined'
														fullWidth
													>
														<InputLabel htmlFor='eway-bill-number'>
															E-Way Bill Number
														</InputLabel>
														<OutlinedInput
															label='E-Way Bill Number'
															id='eway-bill-number'
															type='number'
															value={number}
															data-tabindex={
																32 + index
															}
															onChange={(e) => {
																const array = [
																	...eWayNumbers,
																];

																array[index] =
																	e.target.value;

																seteWayNumbers(
																	array
																);
															}}
															onKeyUp={(
																event
															) => {
																onEnterFocusNext(
																	event,
																	'right-lr-charge'
																);
															}}
															onKeyDown={(
																event
															) => {
																onTabFocusNext(
																	event,
																	'right-lr-charge'
																);
															}}
															endAdornment={
																eWayNumbers.length ===
																	1 ? (
																	<></>
																) : (
																	<Tooltip title='Remove'>
																		<IconButton
																			edge='end'
																			onClick={() => {
																				let array =
																					[
																						...eWayNumbers,
																					];
																				array.splice(
																					index,
																					1
																				);

																				seteWayNumbers(
																					array
																				);
																			}}
																		>
																			<Close />
																		</IconButton>
																	</Tooltip>
																)
															}
														/>
													</FormControl>
													{eWayNumbers.length ===
														index + 1 && (
															<Tooltip title='Add'>
																<IconButton
																	id='add-new-eway'
																	data-component='booking'
																	className='eway-bill-number-add-button'
																	disabled={
																		eWayNumbers.length ===
																		5
																	}
																	onClick={() => {
																		seteWayNumbers(
																			(
																				prev
																			) => [
																					...prev,
																					'',
																				]
																		);
																	}}
																	onKeyDown={(
																		event
																	) => {
																		onTabFocusNext(
																			event,
																			'right-freight'
																		);
																	}}
																>
																	<Add />
																</IconButton>
															</Tooltip>
														)}
												</div>
											);
										})}
									</div>
									<div
										data-component='booking'
										className='columns-2'
									></div>
								</div>
							)}
						</div>

						<div
							data-component='booking'
							className='right'
						>
							<Typography variant='h6'>Charges</Typography>
							<FormControl
								size='small'

								variant='outlined'
								fullWidth
								focused={false}
							>
								<InputLabel>Freight</InputLabel>
								<OutlinedInput
									id='right-freight'
									label='Freight'
									type='text'
									data-tabindex={31 + eWayNumbers.length}
									value={`${formData.freight ? formData.freight : ''
										}`}
									contentEditable={false}
								/>
							</FormControl>

							<FormControl
								size='small'
								variant='outlined'
								fullWidth
							>
								<InputLabel>LR Charge</InputLabel>
								<OutlinedInput
									id='right-lr-charge'
									label='LR Charge'
									type='text'
									data-tabindex={32 + eWayNumbers.length}

									value={`${formData.lrCharge
										? formData.lrCharge
										: ''
										}`}

									onBlurCapture={() => {
										if (userDetails?.userTypeId !== 1) {
											if (formCopy.lrCharge <= formData.lrCharge) {
												console.log('Updated')
											} else {
												setformData((prev) => ({
													...prev,
													lrCharge: formCopy.lrCharge
												}))
												handleOpenAlertDialog('warning', `Value can not be less than ${formCopy.lrCharge}`)
											}
										}

									}}

									onChange={(event: any) => {
										if (
											(formData.quotationBy ===
												'Consignor' &&
												isConsignorHasQuotation) ||
											(formData.quotationBy ===
												'Consignee' &&
												isConsigneeHasQuotation)
										) {
											handleOpenAlertDialog(
												'warning',
												"Cannot edit LR Charge if it's auto filled."
											);
											return;
										}
										setformData((prev) => ({
											...prev,
											lrCharge: +event.target.value,
										}));
									}}
									contentEditable={
										(formData.quotationBy === 'Consignor' &&
											isConsignorHasQuotation) ||
										(formData.quotationBy === 'Consignee' &&
											isConsigneeHasQuotation)
									}
								/>
							</FormControl>

							<FormControl
								size='small'
								variant='outlined'
								fullWidth
							>
								<InputLabel>Hamali</InputLabel>
								<OutlinedInput
									label='Hamali'
									type='number'
									data-tabindex={33 + eWayNumbers.length}
									value={`${formData.labour
										? formData.labour
										: ''
										}`}
									onBlurCapture={() => {
										if (userDetails?.userTypeId !== 1 && userDetails?.userTypeId !== 1) {
											if (formCopy.labour <= formData.labour) {
												console.log('Updated')
											} else {
												setformData((prev) => ({
													...prev,
													labour: formCopy.labour
												}))
												handleOpenAlertDialog('warning', `Value can not be less than ${formCopy.doorDelivery}`)
											}
										}

									}}


									onChange={(event: any) => {
										setformData((prev) => ({
											...prev,
											labour: +event.target.value,
										}));
									}}
								/>
							</FormControl>

							<FormControl
								size='small'
								variant='outlined'
								fullWidth
							>
								<InputLabel>AOC</InputLabel>
								<OutlinedInput
									label='AOC'
									type='text'
									data-tabindex={34 + eWayNumbers.length}
									value={`${formData.aoc ? formData.aoc : ''}`}

									onBlur={() => {
										if (userDetails?.userTypeId !== 1 && formCopy.aoc > formData.aoc) {
											setformData((prev) => ({
												...prev,
												aoc: formCopy.aoc
											}));
											handleOpenAlertDialog('warning', `Value cannot be less than ${formCopy.aoc}`);
										}
									}}

									onChange={(event: any) => {
										setformData((prev) => ({
											...prev,
											aoc: +event.target.value,
										}));
									}}
								/>
							</FormControl>


							<FormControl
								size='small'
								variant='outlined'
								fullWidth
							>
								<InputLabel>Collection</InputLabel>
								<OutlinedInput
									label='Collection'
									type='text'
									data-tabindex={35 + eWayNumbers.length}
									value={`${formData.collection
										? formData.collection
										: ''
										}`}

									onBlurCapture={() => {
										if (userDetails?.userTypeId !== 1 && userDetails?.userTypeId !== 1) {
											if (formCopy.collection <= formData.collection) {
												console.log('Updated')
											} else {
												setformData((prev) => ({
													...prev,
													collection: formCopy.collection
												}))
												handleOpenAlertDialog('warning', `Value can not be less than ${formCopy.collection}`)
											}
										}

									}}

									onChange={(event: any) => {
										setformData((prev) => ({
											...prev,
											collection: +event.target.value,
										}));
									}}
								/>
							</FormControl>

							<FormControl
								size='small'
								variant='outlined'
								fullWidth
								required={formData.mode !== "GODOWN"}
								error={formError.doorDelivery ? true : false}
							>
								<InputLabel>Door Delivery</InputLabel>
								<OutlinedInput
									label='Door Delivery'
									type='text'
									onBlur={validateDoorDelivery}

									id='right-door-delivery'
									data-tabindex={36 + eWayNumbers.length}
									value={`${formData.doorDelivery
										? formData.doorDelivery
										: ''
										}`}


									onBlurCapture={() => {
										if (userDetails?.userTypeId !== 1 && userDetails?.userTypeId !== 1) {
											if (formCopy.doorDelivery <= formData.doorDelivery) {
												console.log('Updated')
											} else {
												setformData((prev) => ({
													...prev,
													doorDelivery: formCopy.doorDelivery
												}))
												handleOpenAlertDialog('warning', `Value can not be less than ${formCopy.doorDelivery}`)
											}
										}

									}}
									onChange={(event: any) => {
										setformData((prev) => ({
											...prev,
											doorDelivery: +event.target.value,
										}));
									}}

								/>
								{formError.doorDelivery && (
									<FormHelperText error>
										{formError.doorDelivery}
									</FormHelperText>
								)}
							</FormControl>

							<FormControl
								size='small'
								variant='outlined'
								fullWidth
							>
								<InputLabel>OL/OC</InputLabel>
								<OutlinedInput
									label='OL/OC'
									type='text'
									data-tabindex={37 + eWayNumbers.length}
									value={`${formData.oloc ? formData.oloc : ''
										}`}


									onBlurCapture={() => {
										if (userDetails?.userTypeId !== 1 && userDetails?.userTypeId !== 1) {
											if (formCopy.oloc <= formData.oloc) {
												console.log('Updated')
											} else {
												setformData((prev) => ({
													...prev,
													oloc: formCopy.oloc
												}))
												handleOpenAlertDialog('warning', `Value can not be less than ${formCopy.oloc}`)
											}
										}

									}}
									onChange={(event: any) => {
										setformData((prev) => ({
											...prev,
											oloc: +event.target.value,
										}));
									}}
								/>
							</FormControl>

							<FormControl
								size='small'
								variant='outlined'
								fullWidth
							>
								<InputLabel>CR/INSUR</InputLabel>
								<OutlinedInput
									label='CR/INSUR'
									type='text'
									data-tabindex={38 + eWayNumbers.length}
									value={`${formData.insurance
										? formData.insurance
										: ''
										}`}

									onBlurCapture={() => {
										if (userDetails?.userTypeId !== 1 && userDetails?.userTypeId !== 1) {
											if (formCopy.insurance <= formData.insurance) {
												console.log('Updated')
											} else {
												setformData((prev) => ({
													...prev,
													insurance: formCopy.insurance
												}))
												handleOpenAlertDialog('warning', `Value can not be less than ${formCopy.insurance}`)
											}
										}

									}}

									onChange={(event: any) => {
										setformData((prev) => ({
											...prev,
											insurance: +event.target.value,
										}));
									}}
								/>
							</FormControl>

							<FormControl
								size='small'
								variant='outlined'
								fullWidth
							>
								<InputLabel>Other</InputLabel>
								<OutlinedInput
									label='Other'
									type='text'
									data-tabindex={39 + eWayNumbers.length}
									value={`${formData.other ? formData.other : ''
										}`}
									onBlurCapture={() => {
										if (userDetails?.userTypeId !== 1 && userDetails?.userTypeId !== 1) {
											if (formCopy.other <= formData.other) {
												console.log('Updated')
											} else {
												setformData((prev) => ({
													...prev,
													other: formCopy.other
												}))
												handleOpenAlertDialog('warning', `Value can not be less than ${formCopy.other}`)
											}
										}

									}}
									onChange={(event: any) => {
										setformData((prev) => ({
											...prev,
											other: +event.target.value,
										}));
									}}
								/>
							</FormControl>

							<FormControl
								size='small'
								variant='outlined'
								fullWidth
							>
								<InputLabel>Carrier Risk</InputLabel>
								<OutlinedInput
									label='Carrier Risk'
									type='text'
									data-tabindex={40 + eWayNumbers.length}
									value={`${formData.carrierRisk
										? formData.carrierRisk
										: ''
										}`}
									onBlurCapture={() => {
										if (userDetails?.userTypeId !== 1 && userDetails?.userTypeId !== 1) {
											if (formCopy.carrierRisk <= formData.carrierRisk) {
												console.log('Updated')
											} else {
												setformData((prev) => ({
													...prev,
													carrierRisk: formCopy.carrierRisk
												}))
												handleOpenAlertDialog('warning', `Value can not be less than ${formCopy.carrierRisk}`)
											}
										}

									}}
									onChange={(event: any) => {
										setformData((prev) => ({
											...prev,
											carrierRisk: +event.target.value,
										}));
									}}
								/>
							</FormControl>

							<FormControl
								size='small'
								variant='outlined'
								fullWidth
							>
								<InputLabel>B.H Charge</InputLabel>
								<OutlinedInput
									label='B.H Charge'
									type='text'
									data-tabindex={41 + eWayNumbers.length}
									value={`${formData.bhCharge
										? formData.bhCharge
										: ''
										}`}
									onBlurCapture={() => {
										if (userDetails?.userTypeId !== 1 && userDetails?.userTypeId !== 1) {
											if (formCopy.bhCharge <= formData.bhCharge) {
												console.log('Updated')
											} else {
												setformData((prev) => ({
													...prev,
													bhCharge: formCopy.bhCharge
												}))
												handleOpenAlertDialog('warning', `Value can not be less than ${formCopy.bhCharge}`)
											}
										}

									}}
									onChange={(event: any) => {
										setformData((prev) => ({
											...prev,
											bhCharge: +event.target.value,
										}));
									}}
								/>
							</FormControl>

							<FormControl
								size='small'
								variant='outlined'
								fullWidth
							>
								<InputLabel>FOV</InputLabel>
								<OutlinedInput
									label='FOV'
									type='text'

									data-tabindex={42 + eWayNumbers.length}
									value={`${formData.fov ? formData.fov : ''
										}`}
									onChange={(event: any) => {
										setformData((prev) => ({
											...prev,
											fov: +event.target.value,
										}));
									}}


									onBlurCapture={() => {
										if (userDetails?.userTypeId !== 1 && userDetails?.userTypeId !== 1) {
											if (formCopy.fov <= formData.fov && formCopy.fov) {
												console.log('Updated')
											} else {
												setformData((prev) => ({
													...prev,
													fov: formCopy.fov,
												}))
												handleOpenAlertDialog('warning', `Value can not be less than ${formCopy.fov}`)
											}
										}

									}}
								/>
							</FormControl>

							<FormControl
								size='small'
								variant='outlined'
								fullWidth
							>
								<InputLabel>Cartage</InputLabel>
								<OutlinedInput
									label='Cartage'
									type='text'
									data-tabindex={43 + eWayNumbers.length}
									value={`${formData.cartage ? formData.cartage : ''
										}`}
									onChange={(event: any) => {
										setformData((prev) => ({
											...prev,
											cartage: +event.target.value,
										}));
									}}

									onBlurCapture={() => {
										if (userDetails?.userTypeId !== 1 && userDetails?.userTypeId !== 1) {
											if (formCopy.cartage <= formData.cartage) {
												console.log('Updated')
											} else {
												setformData((prev) => ({
													...prev,
													cartage: formCopy.cartage
												}))
												handleOpenAlertDialog('warning', `Value can not be less than ${formCopy.cartage}`)
											}
										}

									}}



								/>
							</FormControl>

							<FormControl
								size='small'
								variant='outlined'
								fullWidth
								focused={false}
							>
								<InputLabel>Total</InputLabel>
								<OutlinedInput
									label='Total'
									type='text'
									data-tabindex={43 + eWayNumbers.length}
									value={`${formData.total ? formData.total : ''
										}`}
									contentEditable={false}
								/>
							</FormControl>
						</div>
					</div>

					<Divider
						data-component='booking'
						className='divider'
					/>

					<div
						data-component='booking'
						className='buttons-container'
					>
						{location.state &&
							location.state.bookingDetails.fromBranchId !==
							userDetails?.branchId ? (
							<></>
						) : (
							<>
								{(!location.state || isAdmin || formCopy.paymentType === 1) &&

									<>
										{formCopy?.status !== 5 &&
											<>
												<LoadingButton
													variant='contained'
													color='primary'
													onClick={submitAndPrint}
													id='save-print-button'
													loading={isFormLoading}
													disabled={isSubmitDisabled}
												>
													{!location.state
														? 'Save & Print'
														: 'Update & Print'}
												</LoadingButton>
												<LoadingButton
													id='save-button'
													variant='contained'
													color='primary'
													onClick={handleSubmit}
													loading={isFormLoading}
													disabled={isSubmitDisabled}
												>
													{!location.state ? 'Save' : 'Update'}
												</LoadingButton>
											</>
										}
									</>
								}
							</>
						)}

						<Button
							onClick={handleResetScreen}
							disabled={isFormLoading}
						>
							Clear
						</Button>
						{location.state && (
							<>
								<Button
									onClick={() => {
										printPDF(
											document.getElementById(
												'bill-print-old'
											) as HTMLElement,
											'letter'
										);
									}}
									disabled={isFormLoading}
								>
									Print
								</Button>
								{location.state &&
									location.state.bookingDetails.fromBranchId !==
									userDetails?.branchId ? (
									<></>
								) : (

									<>
										{userDetails?.userTypeId === 1 && formCopy.status !== 5 &&
											<Button
												onClick={handleDelete}
												disabled={isFormLoading}
											>
												Delete
											</Button>
										}
									</>

								)}
							</>
						)}
					</div>
				</div>
			</div>

			<Alert
				{...alertDialog}
				onClose={handleCloseAlertDialog}
			/>

			{/* {userDetails && userBranchDetails && (
				<div
					data-component='booking'
					className='pdf'
					id='bill-print'
				>
					{new Array(3).fill(null).map(() => {
						return (
							<div
								data-component='booking'
								className='section'
							>
								<div
									data-component='booking'
									className='top-section'
								>
									<div
										data-component='booking'
										className='top-section-left'
									>
										<div
											data-component='booking'
											className='container'
										>
											<div
												data-component='booking'
												className='column-4'
											>
												<div
													data-component='booking'
													className='label'
												>
													G.C.No.:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{formData.lrNumber}
												</div>
											</div>
											<div
												data-component='booking'
												className='column-4'
											>
												<div
													data-component='booking'
													className='label'
												>
													Date:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{format(
														formData.bookingDate,
														'dd-MM-yyyy'
													)}
												</div>
											</div>
											<div
												data-component='booking'
												className='column-4'
											>
												<div
													data-component='booking'
													className='label'
												>
													From:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{userBranchDetails.name
														? userBranchDetails.name
														: '--'}
												</div>
											</div>
											<div
												data-component='booking'
												className='column-4'
											>
												<div
													data-component='booking'
													className='label'
												>
													To:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{formData.toBranch}
												</div>
											</div>
										</div>
										<div
											data-component='booking'
											className='container'
										>
											<div
												data-component='booking'
												className='column-4'
											>
												<div
													data-component='booking'
													className='label'
												>
													E-Way No.:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{formData.eWayBillNumber
														? formData.eWayBillNumber
														: '--'}
												</div>
											</div>

											<div
												data-component='booking'
												className='column-4'
											>
											</div>
											<div
												data-component='booking'
												className='column-4'
											></div>
											<div
												data-component='booking'
												className='column-4'
											>
												<div
													data-component='booking'
													className='label'
												>
													Delivery Contact:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{formData.transporterPhone
														? formData.transporterPhone
														: '--'}
												</div>
											</div>
										</div>
										<div
											data-component='booking'
											className='container'
										>
											<div
												data-component='booking'
												className='column-1'
											>
												<div
													data-component='booking'
													className='label'
												>
													Narration.:
												</div>
												<div
													data-component='booking'
													className='value'
													style={{
														textWrap: 'wrap',
													}}
												>
													{formData.note
														? formData.note
														: '--'}
												</div>
											</div>
										</div>
									</div>
									<div
										data-component='booking'
										className='top-section-right'
									>
										<img
											data-component='booking'
											className='qr-code'
											src={qr}
										/>
									</div>
								</div>
								<div
									data-component='booking'
									className='bottom-section'
								>
									<div
										data-component='booking'
										className='details'
									>
										<div
											data-component='booking'
											className='party'
										>
											<div
												data-component='booking'
												className='container'
											>
												<div
													data-component='booking'
													className='column-2'
												>
													<div
														data-component='booking'
														className='label'
													>
														Consignor:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{formData.consignor
															? formData.consignor
															: '--'}
													</div>
												</div>
												<div
													data-component='booking'
													className='column-2'
												>
													<div
														data-component='booking'
														className='label'
													>
														Tin No:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{formData.consignorGST
															? formData.consignorGST
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='booking'
												className='container'
												style={{
													margin: '4px 0 0 0',
												}}
											>
												<div
													data-component='booking'
													className='column-1'
												>
													<div
														data-component='booking'
														className='label'
													>
														Consignor Phone:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{formData.consignorPhone
															? formData.consignorPhone
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='booking'
												className='container'
												style={{
													margin: '4px 0 0 0',
												}}
											>
												<div
													data-component='booking'
													className='column-2'
												>
													<div
														data-component='booking'
														className='label'
													>
														Consignee:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{formData.consignee
															? formData.consignee
															: '--'}
													</div>
												</div>
												<div
													data-component='booking'
													className='column-2'
												>
													<div
														data-component='booking'
														className='label'
													>
														Tin No:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{formData.consigneeGST
															? formData.consigneeGST
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='booking'
												className='container'
												style={{
													margin: '4px 0 0 0',
												}}
											>
												<div
													data-component='booking'
													className='column-1'
												>
													<div
														data-component='booking'
														className='label'
													>
														Consignee Phone:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{formData.consigneePhone
															? formData.consigneePhone
															: '--'}
													</div>
												</div>
											</div>
										</div>
										<div
											data-component='booking'
											className='values-srction'
										>
											{formData.bookingDetails.length !==
												0 && (
												<>
													{formData.bookingDetails.map(
														(data) => {
															return (
																<div
																	data-component='booking'
																	className='container'
																>
																	<div
																		data-component='booking'
																		className='column-4'
																	>
																		<div
																			data-component='booking'
																			className='label'
																		>
																			Article:
																		</div>
																		<div
																			data-component='booking'
																			className='value'
																		>
																			{
																				data.article
																			}
																		</div>
																	</div>
																	<div
																		data-component='booking'
																		className='column-2'
																	>
																		<div
																			data-component='booking'
																			className='label'
																		>
																			Description:
																		</div>
																		<div
																			data-component='booking'
																			className='value'
																			style={{
																				textWrap:
																					'wrap',
																			}}
																		>
																			{
																				data.goodsType
																			}
																		</div>
																	</div>
																	<div
																		data-component='booking'
																		className='column-4'
																	>
																		<div
																			data-component='booking'
																			className='label'
																		>
																			Weight:
																		</div>
																		<div
																			data-component='booking'
																			className='value'
																		>
																			{
																				data.weight
																			}
																		</div>
																	</div>
																	<div
																		data-component='booking'
																		className='column-4'
																	>
																		<div
																			data-component='booking'
																			className='label'
																		>
																			Charge
																			Weight:
																		</div>
																		<div
																			data-component='booking'
																			className='value'
																		>
																			{
																				data.chargeWeight
																			}
																		</div>
																	</div>
																</div>
															);
														}
													)}
												</>
											)}
											<div
												data-component='booking'
												className='container total-table'
											>
												<div
													data-component='booking'
													className='column-4'
												>
													<div
														data-component='booking'
														className='label'
													>
														Total Article:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{formData.bookingDetails.reduce(
															(
																sum: any,
																detail: any
															) =>
																sum +
																detail.article,
															0
														)}
													</div>
												</div>
												<div
													data-component='booking'
													className='column-2'
												>
													<div
														data-component='booking'
														className='label'
													></div>
													<div
														data-component='booking'
														className='value'
														style={{
															textWrap: 'wrap',
														}}
													></div>
												</div>
												<div
													data-component='booking'
													className='column-4'
												>
													<div
														data-component='booking'
														className='label'
													>
														Total Weight:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{formData.bookingDetails.reduce(
															(
																sum: any,
																detail: any
															) =>
																sum +
																detail.weight,
															0
														)}
													</div>
												</div>
												<div
													data-component='booking'
													className='column-4'
												>
													<div
														data-component='booking'
														className='label'
													>
														Total Chg. Weight
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{formData.bookingDetails.reduce(
															(
																sum: any,
																detail: any
															) =>
																sum +
																detail.chargeWeight,
															0
														)}
													</div>
												</div>
											</div>
											<div
												data-component='booking'
												className='container'
												style={{
													margin: '4px 0 0 0',
												}}
											>
												<div
													data-component='booking'
													className='column-4'
												>
													<div
														data-component='booking'
														className='label'
													>
														Invoice No.:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{formData.invoiceNumber
															? formData.invoiceNumber
															: '--'}
													</div>
												</div>
												<div
													data-component='booking'
													className='column-2'
												>
													<div
														data-component='booking'
														className='label'
													>
														D.Mode:
													</div>
													<div
														data-component='booking'
														className='value'
														style={{
															textWrap: 'wrap',
														}}
													>
														{formData.mode
															? formData.mode
															: '--'}
													</div>
												</div>
												<div
													data-component='booking'
													className='column-4'
												>
													<div
														data-component='booking'
														className='label'
													>
														Booking Time:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{formData.dateAdded
															? format(
																	formData.dateAdded,
																	'hh:mm a'
															  )
															: format(
																	currentTime,
																	'hh:mm a'
															  )}
													</div>
												</div>
											</div>
											<div
												data-component='booking'
												className='container'
												style={{
													margin: '4px 0 0 0',
												}}
											>
												<div
													data-component='booking'
													className='column-4'
												>
													<div
														data-component='booking'
														className='label'
													>
														Goods Value:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{formData.declaredValue}
													</div>
												</div>
												<div
													data-component='booking'
													className='column-2'
												>
													<div
														data-component='booking'
														className='label'
													>
														Private Mark:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{formData.privateMark
															? formData.privateMark
															: '--'}
													</div>
												</div>
												<div
													data-component='booking'
													className='column-4'
												>
													<div
														data-component='booking'
														className='label'
													>
														Booking By:
													</div>
													<div
														data-component='booking'
														className='value'
														style={{
															textWrap: 'nowrap',
														}}
													>
														{userDetails.fullName
															? userDetails.fullName
															: '--'}
													</div>
												</div>
											</div>
										</div>
									</div>
									<div
										data-component='booking'
										className='total'
									>
										<div
											data-component='booking'
											className='total-top'
										>
											<div
												data-component='booking'
												className='left-total'
											>
												{formData.paymentType
													? getPaymentTypeById(
															formData.paymentType
													  )
													: '--'}
											</div>
											<div
												data-component='booking'
												className='right-total'
											>
												{formData.freight &&
												formData.freight != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														Freight: &#8377;
														{formData.freight}
													</div>
												) : (
													<></>
												)}

												{formData.lrCharge &&
												formData.lrCharge != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														LR Charge: &#8377;
														{formData.lrCharge}
													</div>
												) : (
													<></>
												)}

												{formData.labour &&
												formData.labour != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														Labour: &#8377;
														{formData.labour}
													</div>
												) : (
													<></>
												)}

												{formData.aoc &&
												formData.aoc != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														AOC: &#8377;
														{formData.aoc}0
													</div>
												) : (
													<></>
												)}

												{formData.collection &&
												formData.collection != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														Collection: &#8377;
														{formData.collection}
													</div>
												) : (
													<></>
												)}

												{formData.doorDelivery &&
												formData.doorDelivery != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														Door Delivery: &#8377;
														{formData.doorDelivery}
													</div>
												) : (
													<></>
												)}

												{formData.oloc &&
												formData.oloc != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														OL/OC: &#8377;
														{formData.oloc}
													</div>
												) : (
													<></>
												)}

												{formData.insurance &&
												formData.insurance != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														CR/INSUR: &#8377;
														{formData.insurance}
													</div>
												) : (
													<></>
												)}

												{formData.other &&
												formData.other != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														Other: &#8377;
														{formData.other}
													</div>
												) : (
													<></>
												)}

												{formData.carrierRisk &&
												formData.carrierRisk != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														Carrier Risk: &#8377;
														{formData.carrierRisk}
													</div>
												) : (
													<></>
												)}
												{formData.bhCharge &&
												formData.bhCharge != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														B.H Charge: &#8377;
														{formData.bhCharge}
													</div>
												) : (
													<></>
												)}

												{formData.fov &&
												formData.fov != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														FOV: &#8377;
														{formData.fov}
													</div>
												) : (
													<></>
												)}

												{formData.cartage &&
												formData.cartage != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														Cartage: &#8377;
														{formData.cartage}
													</div>
												) : (
													<></>
												)}
											</div>
										</div>
										<div
											data-component='booking'
											className='grand-total'
										>
											Grand Total: &#8377;
											{formData.grandTotal
												? formData.grandTotal
												: '--'}
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
			{userDetails && userBranchDetails && location.state && (
				<div
					data-component='booking'
					className='pdf'
					id='bill-print-old'
				>
					{new Array(3).fill(null).map(() => {
						return (
							<div
								data-component='booking'
								className='section'
							>
								<div
									data-component='booking'
									className='top-section'
								>
									<div
										data-component='booking'
										className='top-section-left'
									>
										<div
											data-component='booking'
											className='container'
										>
											<div
												data-component='booking'
												className='column-4'
											>
												<div
													data-component='booking'
													className='label'
												>
													G.C.No.:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{
														location.state
															.bookingDetails
															.lrNumber
													}
												</div>
											</div>
											<div
												data-component='booking'
												className='column-4'
											>
												<div
													data-component='booking'
													className='label'
												>
													Date:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{format(
														location.state
															.bookingDetails
															.bookingDate,
														'dd-MM-yyyy'
													)}
												</div>
											</div>
											<div
												data-component='booking'
												className='column-4'
											>
												<div
													data-component='booking'
													className='label'
												>
													From:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{userBranchDetails.name
														? userBranchDetails.name
														: '--'}
												</div>
											</div>
											<div
												data-component='booking'
												className='column-4'
											>
												<div
													data-component='booking'
													className='label'
												>
													To:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{
														location.state
															.bookingDetails
															.toBranch
													}
												</div>
											</div>
										</div>
										<div
											data-component='booking'
											className='container'
										>
											<div
												data-component='booking'
												className='column-4'
											>
												<div
													data-component='booking'
													className='label'
												>
													E-Way No.:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{location.state
														.bookingDetails
														.eWayBillNumber
														? location.state
																.bookingDetails
																.eWayBillNumber
														: '--'}
												</div>
											</div>

											<div
												data-component='booking'
												className='column-4'
											>
											</div>
											<div
												data-component='booking'
												className='column-4'
											></div>
											<div
												data-component='booking'
												className='column-4'
											>
												<div
													data-component='booking'
													className='label'
												>
													Delivery Contact:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{formData.transporterPhone
														? formData.transporterPhone
														: '--'}
												</div>
											</div>
										</div>
										<div
											data-component='booking'
											className='container'
										>
											<div
												data-component='booking'
												className='column-1'
											>
												<div
													data-component='booking'
													className='label'
												>
													Narration.:
												</div>
												<div
													data-component='booking'
													className='value'
													style={{
														textWrap: 'wrap',
													}}
												>
													{location.state
														.bookingDetails.note
														? location.state
																.bookingDetails
																.note
														: '--'}
												</div>
											</div>
										</div>
									</div>
									<div
										data-component='booking'
										className='top-section-right'
									>
										<img
											data-component='booking'
											className='qr-code'
											src={qr}
										/>
									</div>
								</div>
								<div
									data-component='booking'
									className='bottom-section'
								>
									<div
										data-component='booking'
										className='details'
									>
										<div
											data-component='booking'
											className='party'
										>
											<div
												data-component='booking'
												className='container'
											>
												<div
													data-component='booking'
													className='column-2'
												>
													<div
														data-component='booking'
														className='label'
													>
														Consignor:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.consignor
															? location.state
																	.bookingDetails
																	.consignor
															: '--'}
													</div>
												</div>
												<div
													data-component='booking'
													className='column-2'
												>
													<div
														data-component='booking'
														className='label'
													>
														Tin No:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.consignorGST
															? location.state
																	.bookingDetails
																	.consignorGST
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='booking'
												className='container'
												style={{
													margin: '4px 0 0 0',
												}}
											>
												<div
													data-component='booking'
													className='column-1'
												>
													<div
														data-component='booking'
														className='label'
													>
														Consignor Phone:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.consignorPhone
															? location.state
																	.bookingDetails
																	.consignorPhone
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='booking'
												className='container'
												style={{
													margin: '4px 0 0 0',
												}}
											>
												<div
													data-component='booking'
													className='column-2'
												>
													<div
														data-component='booking'
														className='label'
													>
														Consignee:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.consignee
															? location.state
																	.bookingDetails
																	.consignee
															: '--'}
													</div>
												</div>
												<div
													data-component='booking'
													className='column-2'
												>
													<div
														data-component='booking'
														className='label'
													>
														Tin No:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.consigneeGST
															? location.state
																	.bookingDetails
																	.consigneeGST
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='booking'
												className='container'
												style={{
													margin: '4px 0 0 0',
												}}
											>
												<div
													data-component='booking'
													className='column-1'
												>
													<div
														data-component='booking'
														className='label'
													>
														Consignee Phone:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.consigneePhone
															? location.state
																	.bookingDetails
																	.consigneePhone
															: '--'}
													</div>
												</div>
											</div>
										</div>
										<div
											data-component='booking'
											className='values-srction'
										>
											{location.state.bookingDetails
												.bookingDetails.length !==
												0 && (
												<>
													{location.state.bookingDetails.bookingDetails.map(
														(data: any) => {
															return (
																<div
																	data-component='booking'
																	className='container'
																>
																	<div
																		data-component='booking'
																		className='column-4'
																	>
																		<div
																			data-component='booking'
																			className='label'
																		>
																			Article:
																		</div>
																		<div
																			data-component='booking'
																			className='value'
																		>
																			{
																				data.article
																			}
																		</div>
																	</div>
																	<div
																		data-component='booking'
																		className='column-2'
																	>
																		<div
																			data-component='booking'
																			className='label'
																		>
																			Description:
																		</div>
																		<div
																			data-component='booking'
																			className='value'
																			style={{
																				textWrap:
																					'wrap',
																			}}
																		>
																			{
																				data.goodsType
																			}
																		</div>
																	</div>
																	<div
																		data-component='booking'
																		className='column-4'
																	>
																		<div
																			data-component='booking'
																			className='label'
																		>
																			Weight:
																		</div>
																		<div
																			data-component='booking'
																			className='value'
																		>
																			{
																				data.weight
																			}
																		</div>
																	</div>
																	<div
																		data-component='booking'
																		className='column-4'
																	>
																		<div
																			data-component='booking'
																			className='label'
																		>
																			Charge
																			Weight:
																		</div>
																		<div
																			data-component='booking'
																			className='value'
																		>
																			{
																				data.chargeWeight
																			}
																		</div>
																	</div>
																</div>
															);
														}
													)}
												</>
											)}

											<div
												data-component='booking'
												className='container total-table'
											>
												<div
													data-component='booking'
													className='column-4'
												>
													<div
														data-component='booking'
														className='label'
													>
														Total Article:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state.bookingDetails.bookingDetails.reduce(
															(
																sum: any,
																detail: any
															) =>
																sum +
																detail.article,
															0
														)}
													</div>
												</div>
												<div
													data-component='booking'
													className='column-2'
												>
													<div
														data-component='booking'
														className='label'
													></div>
													<div
														data-component='booking'
														className='value'
														style={{
															textWrap: 'wrap',
														}}
													></div>
												</div>
												<div
													data-component='booking'
													className='column-4'
												>
													<div
														data-component='booking'
														className='label'
													>
														Total Weight:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state.bookingDetails.bookingDetails.reduce(
															(
																sum: any,
																detail: any
															) =>
																sum +
																detail.weight,
															0
														)}
													</div>
												</div>
												<div
													data-component='booking'
													className='column-4'
												>
													<div
														data-component='booking'
														className='label'
													>
														Total Chg. Weight
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state.bookingDetails.bookingDetails.reduce(
															(
																sum: any,
																detail: any
															) =>
																sum +
																detail.chargeWeight,
															0
														)}
													</div>
												</div>
											</div>
											<div
												data-component='booking'
												className='container'
												style={{
													margin: '4px 0 0 0',
												}}
											>
												<div
													data-component='booking'
													className='column-4'
												>
													<div
														data-component='booking'
														className='label'
													>
														Invoice No.:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.invoiceNumber
															? location.state
																	.bookingDetails
																	.invoiceNumber
															: '--'}
													</div>
												</div>
												<div
													data-component='booking'
													className='column-2'
												>
													<div
														data-component='booking'
														className='label'
													>
														D.Mode:
													</div>
													<div
														data-component='booking'
														className='value'
														style={{
															textWrap: 'wrap',
														}}
													>
														{location.state
															.bookingDetails.mode
															? location.state
																	.bookingDetails
																	.mode
															: '--'}
													</div>
												</div>
												<div
													data-component='booking'
													className='column-4'
												>
													<div
														data-component='booking'
														className='label'
													>
														Booking Time:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.dateAdded
															? format(
																	location
																		.state
																		.bookingDetails
																		.dateAdded,
																	'hh:mm a'
															  )
															: format(
																	currentTime,
																	'hh:mm a'
															  )}
													</div>
												</div>
											</div>
											<div
												data-component='booking'
												className='container'
												style={{
													margin: '4px 0 0 0',
												}}
											>
												<div
													data-component='booking'
													className='column-4'
												>
													<div
														data-component='booking'
														className='label'
													>
														Goods Value:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{
															location.state
																.bookingDetails
																.declaredValue
														}
													</div>
												</div>
												<div
													data-component='booking'
													className='column-2'
												>
													<div
														data-component='booking'
														className='label'
													>
														Private Mark:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.privateMark
															? location.state
																	.bookingDetails
																	.privateMark
															: '--'}
													</div>
												</div>
												<div
													data-component='booking'
													className='column-4'
												>
													<div
														data-component='booking'
														className='label'
													>
														Booking By:
													</div>
													<div
														data-component='booking'
														className='value'
														style={{
															textWrap: 'nowrap',
														}}
													>
														{userDetails.fullName
															? userDetails.fullName
															: '--'}
													</div>
												</div>
											</div>
										</div>
									</div>
									<div
										data-component='booking'
										className='total'
									>
										<div
											data-component='booking'
											className='total-top'
										>
											<div
												data-component='booking'
												className='left-total'
											>
												{location.state.bookingDetails
													.paymentType
													? getPaymentTypeById(
															location.state
																.bookingDetails
																.paymentType
													  )
													: '--'}
											</div>
											<div
												data-component='booking'
												className='right-total'
											>
												{location.state.bookingDetails
													.freight &&
												location.state.bookingDetails
													.freight != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														Freight: &#8377;
														{
															location.state
																.bookingDetails
																.freight
														}
													</div>
												) : (
													<></>
												)}

												{location.state.bookingDetails
													.lrCharge &&
												location.state.bookingDetails
													.lrCharge != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														LR Charge: &#8377;
														{
															location.state
																.bookingDetails
																.lrCharge
														}
													</div>
												) : (
													<></>
												)}

												{location.state.bookingDetails
													.labour &&
												location.state.bookingDetails
													.labour != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														Labour: &#8377;
														{
															location.state
																.bookingDetails
																.labour
														}
													</div>
												) : (
													<></>
												)}

												{location.state.bookingDetails
													.aoc &&
												location.state.bookingDetails
													.aoc != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														AOC: &#8377;
														{
															location.state
																.bookingDetails
																.aoc
														}
														0
													</div>
												) : (
													<></>
												)}

												{location.state.bookingDetails
													.collection &&
												location.state.bookingDetails
													.collection != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														Collection: &#8377;
														{
															location.state
																.bookingDetails
																.collection
														}
													</div>
												) : (
													<></>
												)}

												{location.state.bookingDetails
													.doorDelivery &&
												location.state.bookingDetails
													.doorDelivery != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														Door Delivery: &#8377;
														{
															location.state
																.bookingDetails
																.doorDelivery
														}
													</div>
												) : (
													<></>
												)}

												{location.state.bookingDetails
													.oloc &&
												location.state.bookingDetails
													.oloc != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														OL/OC: &#8377;
														{
															location.state
																.bookingDetails
																.oloc
														}
													</div>
												) : (
													<></>
												)}

												{location.state.bookingDetails
													.insurance &&
												location.state.bookingDetails
													.insurance != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														CR/INSUR: &#8377;
														{
															location.state
																.bookingDetails
																.insurance
														}
													</div>
												) : (
													<></>
												)}

												{location.state.bookingDetails
													.other &&
												location.state.bookingDetails
													.other != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														Other: &#8377;
														{
															location.state
																.bookingDetails
																.other
														}
													</div>
												) : (
													<></>
												)}

												{location.state.bookingDetails
													.carrierRisk &&
												location.state.bookingDetails
													.carrierRisk != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														Carrier Risk: &#8377;
														{
															location.state
																.bookingDetails
																.carrierRisk
														}
													</div>
												) : (
													<></>
												)}
												{location.state.bookingDetails
													.bhCharge &&
												location.state.bookingDetails
													.bhCharge != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														B.H Charge: &#8377;
														{
															location.state
																.bookingDetails
																.bhCharge
														}
													</div>
												) : (
													<></>
												)}

												{location.state.bookingDetails
													.fov &&
												location.state.bookingDetails
													.fov != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														FOV: &#8377;
														{
															location.state
																.bookingDetails
																.fov
														}
													</div>
												) : (
													<></>
												)}

												{location.state.bookingDetails
													.cartage &&
												location.state.bookingDetails
													.cartage != 0 ? (
													<div
														data-component='booking'
														className='parameter'
													>
														Cartage: &#8377;
														{
															location.state
																.bookingDetails
																.cartage
														}
													</div>
												) : (
													<></>
												)}
											</div>
										</div>
										<div
											data-component='booking'
											className='grand-total'
										>
											Grand Total: &#8377;
											{location.state.bookingDetails
												.grandTotal
												? location.state.bookingDetails
														.grandTotal
												: '--'}
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)} */}

			{/* Latest PDF */}
			{/* {userDetails && userBranchDetails && company && (
				 <div
					className='a5-pdf'
					data-component='booking'
					id='bill-print-old'
				>
					<div
						className='box'
						data-component='booking'
					>
						<div
							className='top'
							data-component='booking'
						>
							<div
								className='top-left'
								data-component='booking'
							>
								<div
									className='top-box'
									data-component='booking'
								>
									<div
										className='top-box-left'
										data-component='booking'
									>
										<div
											className='top-box-left-top'
											data-component='booking'
										>
											<img
												className='top-box-left-top-logo'
												data-component='booking'
												src={LogoDark}
											/>
											<div
												className='top-box-left-top-address label'
												data-component='booking'
											>
												{company.address
													? company.address
													: '--'}
												<div>
													{company.phone &&
														`Company Contact No.: ${userBranchDetails.phone}`}
												</div>
											</div>
										</div>
										<div
											className='top-box-left-bottom'
											data-component='booking'
										>
											<div
												className='top-box-left-bottom-address label'
												data-component='booking'
											>
												{userBranchDetails.address
													? userBranchDetails.address
													: '--'}
												<div>
													{userBranchDetails.phone &&
														`Branch Contact No.: ${userBranchDetails.phone}`}
												</div>
											</div>
										</div>
									</div>
									<div
										className='top-box-right'
										data-component='booking'
									>
										<div
											className='qr-headline'
											data-component='booking'
										>
											Consignor Copy
										</div>
										<img
											data-component='booking'
											className='qr-code'
											src={qr}
										/>
									</div>
								</div>
								<div
									className='bottom-box'
									data-component='booking'
								>
									<div
										className='value-container'
										data-component='booking'
									>
										<div
											className='label'
											data-component='booking'
										>
											Transport E-Way Bill Id:
										</div>
										<div
											className='value'
											data-component='booking'
										>
											{location.state.bookingDetails
												.eWayBillNumber
												? location.state.bookingDetails
														.eWayBillNumber
												: '--'}
										</div>
									</div> 
									<div
										className='value-container'
										data-component='booking'
									>
										<div
											className='label'
											data-component='booking'
										>
											Narration:
										</div>
										<div
											className='value'
											data-component='booking'
										>
											{location.state.bookingDetails.note
												? location.state.bookingDetails
														.note
												: '--'}
										</div>
									</div>
								</div>
							</div>
							<div
								className='top-right'
								data-component='booking'
							>
								<div
									className='value-container'
									data-component='booking'
								>
									<div
										className='label'
										data-component='booking'
									>
										LR No.:
									</div>
									<div
										className='value'
										data-component='booking'
									>
										{location.state.bookingDetails.lrNumber
											? location.state.bookingDetails
													.lrNumber
											: '--'}
									</div>
								</div>
								<div
									className='value-container'
									data-component='booking'
								>
									<div
										className='label'
										data-component='booking'
									>
										Date:
									</div>
									<div
										className='value'
										data-component='booking'
									>
										{format(
											location.state.bookingDetails
												.bookingDate,
											'dd-MM-yyyy'
										)}
									</div>
								</div>
								<div
									className='border'
									data-component='booking'
								></div>
								<div
									className='value-container'
									data-component='booking'
								>
									<div
										className='label'
										data-component='booking'
									>
										E-Way Bill No.:
									</div>
									<div
										className='value'
										data-component='booking'
									>
										{location.state.bookingDetails
											.eWayBillNumber
											? location.state.bookingDetails
													.eWayBillNumber
											: '--'}
									</div>
								</div>
								<div
									className='border'
									data-component='booking'
								></div>
								<div
									className='value-container'
									data-component='booking'
								>
									<div
										className='label'
										data-component='booking'
									>
										From:
									</div>
									<div
										className='value'
										data-component='booking'
									>
										{location.state.bookingDetails
											.fromBranch
											? location.state.bookingDetails
													.fromBranch
											: '--'}
									</div>
								</div>
								<div
									className='value-container'
									data-component='booking'
								>
									<div
										className='label'
										data-component='booking'
									>
										To:
									</div>
									<div
										className='value'
										data-component='booking'
									>
										{location.state.bookingDetails.toBranch
											? location.state.bookingDetails
													.toBranch
											: '--'}
									</div>
								</div>
								<div
									className='value-container'
									data-component='booking'
								>
									<div
										className='label'
										data-component='booking'
									>
										Delivery At:
									</div>
									<div
										className='value'
										data-component='booking'
									>
										{formData.transporterName
											? formData.transporterName
											: '--'}
									</div>
								</div>
								<div
									className='value-container'
									data-component='booking'
								>
									<div
										className='label'
										data-component='booking'
									>
										Contact No.:
									</div>
									<div
										className='value'
										data-component='booking'
									>
										{formData.transporterPhone
											? formData.transporterPhone
											: '--'}
									</div>
								</div>
							</div>
						</div>
						<div
							className='bottom'
							data-component='booking'
						>
							<div
								className='bottom-left'
								data-component='booking'
							>
								<div
									className='party-box'
									data-component='booking'
								>
									<div>
										<div
											className='value-container'
											data-component='booking'
										>
											<div
												className='label'
												data-component='booking'
											>
												Consignor:
											</div>
											<div
												className='value'
												data-component='booking'
											>
												{location.state.bookingDetails
													.consignor
													? location.state
															.bookingDetails
															.consignor
													: '--'}
											</div>
										</div>
										<div
											className='value-container'
											data-component='booking'
										>
											<div
												className='label'
												data-component='booking'
											>
												Consignor Contact No.:
											</div>
											<div
												className='value'
												data-component='booking'
											>
												{location.state.bookingDetails
													.consignorPhone
													? location.state
															.bookingDetails
															.consignorPhone
													: '--'}
											</div>
										</div>
									</div>
									<div
										className='value-container'
										data-component='booking'
									>
										<div
											className='label'
											data-component='booking'
										>
											Consignor GST No.:
										</div>
										<div
											className='value'
											data-component='booking'
										>
											{location.state.bookingDetails
												.consignorGST
												? location.state.bookingDetails
														.consignorGST
												: '--'}
										</div>
									</div>
								</div>
								<div
									className='party-box'
									data-component='booking'
								>
									<div>
										<div
											className='value-container'
											data-component='booking'
										>
											<div
												className='label'
												data-component='booking'
											>
												Consignee:
											</div>
											<div
												className='value'
												data-component='booking'
											>
												{location.state.bookingDetails
													.consignee
													? location.state
															.bookingDetails
															.consignee
													: '--'}
											</div>
										</div>
										<div
											className='value-container'
											data-component='booking'
										>
											<div
												className='label'
												data-component='booking'
											>
												Consignee Contact No.:
											</div>
											<div
												className='value'
												data-component='booking'
											>
												{location.state.bookingDetails
													.consigneePhone
													? location.state
															.bookingDetails
															.consigneePhone
													: '--'}
											</div>
										</div>
									</div>
									<div
										className='value-container'
										data-component='booking'
									>
										<div
											className='label'
											data-component='booking'
										>
											Consignee GST No.:
										</div>
										<div
											className='value'
											data-component='booking'
										>
											{location.state.bookingDetails
												.consigneeGST
												? location.state.bookingDetails
														.consigneeGST
												: '--'}
										</div>
									</div>
								</div>
								<div
									data-component='booking'
									className='table-values'
								>
									<div
										data-component='booking'
										className='container table-head'
									>
										<div
											data-component='booking'
											className='column-4'
										>
											<div
												data-component='booking'
												className='label'
											>
												Article
											</div>
										</div>
										<div
											data-component='booking'
											className='column-2'
										>
											<div
												data-component='booking'
												className='label'
											>
												Description
											</div>
										</div>
										<div
											data-component='booking'
											className='column-4'
										>
											<div
												data-component='booking'
												className='label'
											>
												Weight
											</div>
										</div>
										<div
											data-component='booking'
											className='column-4'
										>
											<div
												data-component='booking'
												className='label'
											>
												Charge Weight
											</div>
										</div>
									</div>
									{location.state.bookingDetails
										.bookingDetails.length !== 0 && (
										<>
											{location.state.bookingDetails.bookingDetails.map(
												(
													data: BookingDetailsInterface
												) => {
													return (
														<div
															data-component='booking'
															className='container table-row'
														>
															<div
																data-component='booking'
																className='column-4'
															>
																<div
																	data-component='booking'
																	className='value'
																>
																	{
																		data.article
																	}
																</div>
															</div>
															<div
																data-component='booking'
																className='column-2'
															>
																<div
																	data-component='booking'
																	className='value'
																	style={{
																		textWrap:
																			'wrap',
																	}}
																>
																	{
																		data.goodsType
																	}
																</div>
															</div>
															<div
																data-component='booking'
																className='column-4'
															>
																<div
																	data-component='booking'
																	className='value'
																>
																	{
																		data.weight
																	}
																</div>
															</div>
															<div
																data-component='booking'
																className='column-4'
															>
																<div
																	data-component='booking'
																	className='value'
																>
																	{
																		data.chargeWeight
																	}
																</div>
															</div>
														</div>
													);
												}
											)}
										</>
									)}
									<div
										data-component='booking'
										className='container total-table'
									>
										<div
											data-component='booking'
											className='column-4'
										>
											<div
												data-component='booking'
												className='label'
											>
												Total Article:
											</div>
											<div
												data-component='booking'
												className='value'
											>
												{formData.bookingDetails.reduce(
													(sum: any, detail: any) =>
														sum + detail.article,
													0
												)}
											</div>
										</div>
										<div
											data-component='booking'
											className='column-4'
										>
											<div
												data-component='booking'
												className='label'
											></div>
											<div
												data-component='booking'
												className='value'
												style={{
													textWrap: 'wrap',
												}}
											></div>
										</div>
										<div
											data-component='booking'
											className='column-4'
										>
											<div
												data-component='booking'
												className='label'
											>
												Total Weight:
											</div>
											<div
												data-component='booking'
												className='value'
											>
												{formData.bookingDetails.reduce(
													(sum: any, detail: any) =>
														sum + detail.weight,
													0
												)}
											</div>
										</div>
										<div
											data-component='booking'
											className='column-3'
										>
											<div
												data-component='booking'
												className='label'
											>
												Total Chg. Weight
											</div>
											<div
												data-component='booking'
												className='value'
											>
												{formData.bookingDetails.reduce(
													(sum: any, detail: any) =>
														sum +
														detail.chargeWeight,
													0
												)}
											</div>
										</div>
									</div>
									<div
										data-component='booking'
										className='container row-1'
									>
										<div
											data-component='booking'
											className='column-4'
										>
											<div
												data-component='booking'
												className='label'
											>
												Invoice No.:
											</div>
											<div
												data-component='booking'
												className='value'
											>
												{formData.invoiceNumber
													? formData.invoiceNumber
													: '--'}
											</div>
										</div>
										<div
											data-component='booking'
											className='column-2'
										>
											<div
												data-component='booking'
												className='label'
											>
												D.Mode:
											</div>
											<div
												data-component='booking'
												className='value'
												style={{
													textWrap: 'wrap',
												}}
											>
												{formData.mode
													? formData.mode
													: '--'}
											</div>
										</div>
										<div
											data-component='booking'
											className='column-4'
										>
											<div
												data-component='booking'
												className='label'
											>
												Booking Time:
											</div>
											<div
												data-component='booking'
												className='value'
											>
												{formData.dateAdded
													? format(
															formData.dateAdded,
															'hh:mm a'
													  )
													: format(
															currentTime,
															'hh:mm a'
													  )}
											</div>
										</div>
									</div>
									<div
										data-component='booking'
										className='container row-1'
									>
										<div
											data-component='booking'
											className='column-4'
										>
											<div
												data-component='booking'
												className='label'
											>
												Goods Value:
											</div>
											<div
												data-component='booking'
												className='value'
											>
												{formData.declaredValue}
											</div>
										</div>
										<div
											data-component='booking'
											className='column-2'
										>
											<div
												data-component='booking'
												className='label'
											>
												Private Mark:
											</div>
											<div
												data-component='booking'
												className='value'
											>
												{formData.privateMark
													? formData.privateMark
													: '--'}
											</div>
										</div>
										<div
											data-component='booking'
											className='column-3'
										>
											<div
												data-component='booking'
												className='label'
											>
												Booking By:
											</div>
											<div
												data-component='booking'
												className='value'
												style={{
													textWrap: 'nowrap',
												}}
											>
												{userDetails.fullName
													? userDetails.fullName
													: '--'}
											</div>
										</div>
									</div>
								</div>
							</div>
							<div
								className='bottom-right'
								data-component='booking'
							>
								<div
									className='payment-type-value'
									data-component='booking'
								>
									{location.state.bookingDetails.paymentType
										? getPaymentTypeById(
												location.state.bookingDetails
													.paymentType
										  )
										: '--'}
								</div>
								<div
									className='list-of-total'
									data-component='booking'
								>
									<div
										data-component='booking'
										className='right-total'
									>
										{location.state.bookingDetails
											.freight &&
										location.state.bookingDetails.freight !=
											0 ? (
											<div
												data-component='booking'
												className='parameter'
											>
												Freight: &#8377;
												{
													location.state
														.bookingDetails.freight
												}
											</div>
										) : (
											<></>
										)}

										{location.state.bookingDetails
											.lrCharge &&
										location.state.bookingDetails
											.lrCharge != 0 ? (
											<div
												data-component='booking'
												className='parameter'
											>
												LR Charge: &#8377;
												{
													location.state
														.bookingDetails.lrCharge
												}
											</div>
										) : (
											<></>
										)}

										{location.state.bookingDetails.labour &&
										location.state.bookingDetails.labour !=
											0 ? (
											<div
												data-component='booking'
												className='parameter'
											>
												Labour: &#8377;
												{
													location.state
														.bookingDetails.labour
												}
											</div>
										) : (
											<></>
										)}

										{location.state.bookingDetails.aoc &&
										location.state.bookingDetails.aoc !=
											0 ? (
											<div
												data-component='booking'
												className='parameter'
											>
												AOC: &#8377;
												{
													location.state
														.bookingDetails.aoc
												}
												0
											</div>
										) : (
											<></>
										)}

										{location.state.bookingDetails
											.collection &&
										location.state.bookingDetails
											.collection != 0 ? (
											<div
												data-component='booking'
												className='parameter'
											>
												Collection: &#8377;
												{
													location.state
														.bookingDetails
														.collection
												}
											</div>
										) : (
											<></>
										)}

										{location.state.bookingDetails
											.doorDelivery &&
										location.state.bookingDetails
											.doorDelivery != 0 ? (
											<div
												data-component='booking'
												className='parameter'
											>
												Door Delivery: &#8377;
												{
													location.state
														.bookingDetails
														.doorDelivery
												}
											</div>
										) : (
											<></>
										)}

										{location.state.bookingDetails.oloc &&
										location.state.bookingDetails.oloc !=
											0 ? (
											<div
												data-component='booking'
												className='parameter'
											>
												OL/OC: &#8377;
												{
													location.state
														.bookingDetails.oloc
												}
											</div>
										) : (
											<></>
										)}

										{location.state.bookingDetails
											.insurance &&
										location.state.bookingDetails
											.insurance != 0 ? (
											<div
												data-component='booking'
												className='parameter'
											>
												CR/INSUR: &#8377;
												{
													location.state
														.bookingDetails
														.insurance
												}
											</div>
										) : (
											<></>
										)}

										{location.state.bookingDetails.other &&
										location.state.bookingDetails.other !=
											0 ? (
											<div
												data-component='booking'
												className='parameter'
											>
												Other: &#8377;
												{
													location.state
														.bookingDetails.other
												}
											</div>
										) : (
											<></>
										)}

										{location.state.bookingDetails
											.carrierRisk &&
										location.state.bookingDetails
											.carrierRisk != 0 ? (
											<div
												data-component='booking'
												className='parameter'
											>
												Carrier Risk: &#8377;
												{
													location.state
														.bookingDetails
														.carrierRisk
												}
											</div>
										) : (
											<></>
										)}
										{location.state.bookingDetails
											.bhCharge &&
										location.state.bookingDetails
											.bhCharge != 0 ? (
											<div
												data-component='booking'
												className='parameter'
											>
												B.H Charge: &#8377;
												{
													location.state
														.bookingDetails.bhCharge
												}
											</div>
										) : (
											<></>
										)}

										{location.state.bookingDetails.fov &&
										location.state.bookingDetails.fov !=
											0 ? (
											<div
												data-component='booking'
												className='parameter'
											>
												FOV: &#8377;
												{
													location.state
														.bookingDetails.fov
												}
											</div>
										) : (
											<></>
										)}

										{location.state.bookingDetails
											.cartage &&
										location.state.bookingDetails.cartage !=
											0 ? (
											<div
												data-component='booking'
												className='parameter'
											>
												Cartage: &#8377;
												{
													location.state
														.bookingDetails.cartage
												}
											</div>
										) : (
											<></>
										)}
									</div>
									<div
										className='grand-total'
										data-component='booking'
									>
										Grand Total:{' '}
										{location.state.grandTotal
											? formatToRupees(
													location.state.grandTotal
											  )
											: '--'}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)} */}

			{userDetails && userBranchDetails && articleShape && (
				<div
					data-component='booking'
					className='pdf-new'
					id='bill-print'
				>
					{new Array(3).fill(null).map(() => {
						return (
							<div
								data-component='booking'
								className='section'
							>
								<div
									data-component='booking'
									className='section-box'
								>
									<div
										data-component='booking'
										className='column-container'
									>
										<div
											data-component='booking'
											className='columns-2 large-value border-right'
										>
											<div
												data-component='booking'
												className='value-container'
											>
												<div
													data-component='booking'
													className='label'
												>
													From:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{userBranchDetails.name
														? userBranchDetails.name
														: '--'}
													{userBranchDetails.phone
														? `-${userBranchDetails.phone}`
														: ''}
												</div>
											</div>
										</div>
										<div
											data-component='booking'
											className='columns-2 large-value'
										>
											<div
												data-component='booking'
												className='value-container'
											>
												<div
													data-component='booking'
													className='label'
												>
													To:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{formData.toBranch
														? formData.toBranch
														: '--'}
													{`-${findObjectInArray(
														activeDeliveryBranches,
														'branchId',
														formData.toBranchId
													).phone
														}`}
												</div>
											</div>
										</div>
									</div>
								</div>
								<div
									data-component='booking'
									className='section-box'
								>
									<div
										data-component='booking'
										className='column-container'
									>
										<div
											data-component='booking'
											className='columns-4 medium-value'
										>
											<div
												data-component='booking'
												className='value-container'
											>
												<div
													data-component='booking'
													className='label'
												>
													E-Way Bill No.:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{formData.eWayBillNumber
														? formData.eWayBillNumber
														: '--'}
												</div>
											</div>
										</div>
										<div
											data-component='booking'
											className='columns-4 border-right border-left'
										>
											<div
												data-component='booking'
												className='qr-container'
											>
												<img
													data-component='booking'
													className='qr-code'
													src={qr}
												/>
											</div>
										</div>
										<div
											data-component='booking'
											className='columns-4 border-right medium-value'
										>
											<div
												data-component='booking'
												className='value-container'
											>
												<div
													data-component='booking'
													className='label'
												>
													Date:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{formData.bookingDate
														? format(
															formData.bookingDate,
															'dd-MM-yyyy'
														)
														: format(
															currentTime,
															'dd-MM-yyyy'
														)}
												</div>
											</div>
										</div>
										<div
											data-component='booking'
											className='columns-4 large-value'
										>
											<div
												data-component='booking'
												className='value-container'
											>
												<div
													data-component='booking'
													className='label'
												>
													LR Number:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{formData.lrNumber
														? formData.lrNumber
														: '--'}
												</div>
											</div>
										</div>
									</div>
								</div>
								<div
									data-component='booking'
									className='section-box'
								>
									<div
										data-component='booking'
										className='column-container'
									>
										<div
											data-component='booking'
											className='columns-2 border-right'
										>
											<div
												data-component='booking'
												className='value-container border-bottom'
											>
												<div
													data-component='booking'
													className='label'
												>
													Consignor:
												</div>
												<div
													data-component='booking'
													className='value adjust-font-size'
												>
													{formData.consignor
														? formData.consignor
														: '--'}
												</div>
											</div>
											<div
												data-component='booking'
												className='value-container border-bottom'
											>
												<div
													data-component='booking'
													className='label'
												>
													Consignor Phone No.:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{formData.consignorPhone
														? formData.consignorPhone
														: '--'}
												</div>
											</div>
											<div
												data-component='booking'
												className='value-container border-bottom'
											>
												<div
													data-component='booking'
													className='label'
												>
													GSTN:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{formData.consignorGST
														? formData.consignorGST
														: '--'}
												</div>
											</div>
											<div
												data-component='booking'
												className='column-container border-bottom'
											>
												<div
													data-component='booking'
													className='columns-4'
												>
													<div
														data-component='booking'
														className='value padding center'
													>
														Art.
													</div>
												</div>
												<div
													data-component='booking'
													className='columns-1'
												>
													<div
														data-component='booking'
														className='value padding center border-left'
													>
														Article Details
													</div>
												</div>
											</div>
											{formData.bookingDetails.length !==
												0 && (
													<>
														{formData.bookingDetails.map(
															(data: any) => {
																return (
																	<div
																		data-component='booking'
																		className='column-container border-bottom'
																	>
																		<div
																			data-component='booking'
																			className='columns-4'
																		>
																			<div
																				data-component='booking'
																				className='label padding center'
																			>
																				{
																					data.article
																				}
																			</div>
																		</div>
																		<div
																			data-component='booking'
																			className='columns-1 border-left'
																		>
																			<div
																				data-component='booking'
																				className='label padding center'
																				style={{
																					textWrap:
																						'wrap',
																				}}
																			>
																				{
																					data.goodsType
																				}
																				-
																				{
																					data.shape
																				}
																			</div>
																		</div>
																	</div>
																);
															}
														)}
													</>
												)}
										</div>
										<div
											data-component='booking'
											className='columns-2 border-right'
										>
											<div
												data-component='booking'
												className='value-container border-bottom'
											>
												<div
													data-component='booking'
													className='label'
												>
													Consignee:
												</div>
												<div
													data-component='booking'
													className='value adjust-font-size'
												>
													{formData.consignee
														? formData.consignee
														: '--'}
												</div>
											</div>
											<div
												data-component='booking'
												className='value-container border-bottom'
											>
												<div
													data-component='booking'
													className='label'
												>
													Consignee Phone No.:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{formData.consigneePhone
														? formData.consigneePhone
														: '--'}
												</div>
											</div>
											<div
												data-component='booking'
												className='value-container'
											>
												<div
													data-component='booking'
													className='label'
												>
													GSTN:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{formData.consigneeGST
														? formData.consigneeGST
														: '--'}
												</div>
											</div>
											<div
												data-component='booking'
												className='column-container border-top'
											>
												<div
													data-component='booking'
													className='columns-2 border-right'
												>
													<div
														data-component='booking'
														className='value-container '
													>
														<div
															data-component='booking'
															className='label'
														>
															Act. Weight:
														</div>
														<div
															data-component='booking'
															className='value'
														>
															{formData.bookingDetails.reduce(
																(
																	sum: any,
																	detail: any
																) =>
																	sum +
																	detail.weight,
																0
															)}
														</div>
													</div>
												</div>
												<div
													data-component='booking'
													className='columns-2'
												>
													<div
														data-component='booking'
														className='value-container'
													>
														<div
															data-component='booking'
															className='label'
														>
															Chg. Weight:
														</div>
														<div
															data-component='booking'
															className='value'
														>
															{formData.bookingDetails.reduce(
																(
																	sum: any,
																	detail: any
																) =>
																	sum +
																	detail.chargeWeight,
																0
															)}
														</div>
													</div>
												</div>
											</div>
											<div
												data-component='booking'
												className='column-container border-top'
											>
												<div
													data-component='booking'
													className='columns-2 border-right'
												>
													<div
														data-component='booking'
														className='value-container '
													>
														<div
															data-component='booking'
															className='label'
														>
															Invoice No.:
														</div>
														<div
															data-component='booking'
															className='value'
														>
															{formData.invoiceNumber
																? formData.invoiceNumber
																: '--'}
														</div>
													</div>
												</div>
												<div
													data-component='booking'
													className='columns-2'
												>
													<div
														data-component='booking'
														className='value-container'
													>
														<div
															data-component='booking'
															className='label'
														>
															Dec. Value:
														</div>
														<div
															data-component='booking'
															className='value'
														>
															{formData.declaredValue
																? (+formData.declaredValue).toFixed(
																	2
																)
																: '--'}
														</div>
													</div>
												</div>
											</div>
											<div
												data-component='booking'
												className='value-container border-top'
											>
												<div
													data-component='booking'
													className='label'
												>
													Delivery At:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{formData.mode
														? formData.mode
														: '--'}
												</div>
											</div>
											<div
												data-component='booking'
												className='value-container border-top'
											>
												<div
													data-component='booking'
													className='label'
												>
													Remark:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{formData.note
														? formData.note
														: '--'}
												</div>
											</div>
										</div>
										<div
											data-component='booking'
											className='columns-4 calculations-container'
										>
											<div
												data-component='booking'
												className='calculations'
											>
												<div
													data-component='booking'
													className='payment-type-container border-right'
												>
													{formData.paymentType
														? getPaymentTypeById(
															formData.paymentType
														)
														: '--'}
												</div>
												<div
													data-component='booking'
													className='totals'
												>
													<div
														data-component='booking'
														className='right-total'
													>
														{formData.freight &&
															formData.freight !=
															0 ? (
															<div
																data-component='booking'
																className='parameter'
															>
																Freight:
																<div
																	data-component='booking'
																	className='parameter-value'
																>
																	{formData.freight.toFixed(
																		2
																	)}
																</div>
															</div>
														) : (
															<></>
														)}

														{formData.lrCharge &&
															formData.lrCharge !=
															0 ? (
															<div
																data-component='booking'
																className='parameter'
															>
																LR Chg.:
																<div
																	data-component='booking'
																	className='parameter-value'
																>
																	{formData?.lrCharge?.toFixed(
																		2
																	)}
																</div>
															</div>
														) : (
															<></>
														)}

														{formData.labour &&
															formData.labour != 0 ? (
															<div
																data-component='booking'
																className='parameter'
															>
																Labour:
																<div
																	data-component='booking'
																	className='parameter-value'
																>
																	{formData.labour.toFixed(
																		2
																	)}
																</div>
															</div>
														) : (
															<></>
														)}

														{formData.aoc &&
															formData.aoc != 0 ? (
															<div
																data-component='booking'
																className='parameter'
															>
																AOC:
																<div
																	data-component='booking'
																	className='parameter-value'
																>
																	{formData.aoc.toFixed(
																		2
																	)}
																</div>
															</div>
														) : (
															<></>
														)}

														{formData.collection &&
															formData.collection !=
															0 ? (
															<div
																data-component='booking'
																className='parameter'
															>
																Collection:
																<div
																	data-component='booking'
																	className='parameter-value'
																>
																	{formData.collection.toFixed(
																		2
																	)}
																</div>
															</div>
														) : (
															<></>
														)}

														{formData.doorDelivery &&
															formData.doorDelivery !=
															0 ? (
															<div
																data-component='booking'
																className='parameter'
															>
																D.D.:
																<div
																	data-component='booking'
																	className='parameter-value'
																>
																	{formData.doorDelivery.toFixed(
																		2
																	)}
																</div>
															</div>
														) : (
															<></>
														)}

														{formData.oloc &&
															formData.oloc != 0 ? (
															<div
																data-component='booking'
																className='parameter'
															>
																OL/OC:
																<div
																	data-component='booking'
																	className='parameter-value'
																>
																	{formData.oloc.toFixed(
																		2
																	)}
																</div>
															</div>
														) : (
															<></>
														)}

														{formData.insurance &&
															formData.insurance !=
															0 ? (
															<div
																data-component='booking'
																className='parameter'
															>
																CR/INSUR:
																<div
																	data-component='booking'
																	className='parameter-value'
																>
																	{formData.insurance.toFixed(
																		2
																	)}
																</div>
															</div>
														) : (
															<></>
														)}

														{formData.other &&
															formData.other != 0 ? (
															<div
																data-component='booking'
																className='parameter'
															>
																Other:
																<div
																	data-component='booking'
																	className='parameter-value'
																>
																	{
																		formData.other
																	}
																</div>
															</div>
														) : (
															<></>
														)}

														{formData.carrierRisk &&
															formData.carrierRisk !=
															0 ? (
															<div
																data-component='booking'
																className='parameter'
															>
																Carrier Risk:
																<div
																	data-component='booking'
																	className='parameter-value'
																>
																	{
																		formData.carrierRisk
																	}
																</div>
															</div>
														) : (
															<></>
														)}
														{formData.bhCharge &&
															formData.bhCharge !=
															0 ? (
															<div
																data-component='booking'
																className='parameter'
															>
																B.H Chg.:
																<div
																	data-component='booking'
																	className='parameter-value'
																>
																	{
																		formData.bhCharge
																	}
																</div>
															</div>
														) : (
															<></>
														)}

														{formData.fov &&
															formData.fov != 0 ? (
															<div
																data-component='booking'
																className='parameter'
															>
																FOV:
																<div
																	data-component='booking'
																	className='parameter-value'
																>
																	{
																		formData.fov
																	}
																</div>
															</div>
														) : (
															<></>
														)}

														{formData.cartage &&
															formData.cartage !=
															0 ? (
															<div
																data-component='booking'
																className='parameter'
															>
																Cartage:
																<div
																	data-component='booking'
																	className='parameter-value'
																>
																	{
																		formData.cartage
																	}
																</div>
															</div>
														) : (
															<></>
														)}
														<div
															data-component='booking'
															className='total-bottom-stick'
														>
															<div
																data-component='booking'
																className='parameter value border-top'
															>
																Total:
																<div
																	data-component='booking'
																	className='parameter-value value'
																>
																	{formData.grandTotal
																		? formData.grandTotal.toFixed(
																			2
																		)
																		: '--'}
																</div>
															</div>
															<div
																data-component='booking'
																className='parameter'
															>
																{userDetails.fullName
																	? userDetails.fullName
																	: '--'}{' '}
																{formData.dateAdded
																	? format(
																		formData.dateAdded,
																		'hh:mm a'
																	)
																	: format(
																		currentTime,
																		'hh:mm a'
																	)}
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div
									data-component='booking'
									className='section-box stick-bottom'
								>
									<div
										data-component='booking'
										className='column-container'
									>
										<div
											data-component='booking'
											className='columns-4 border-right'
										>
											<div
												data-component='booking'
												className='value-container'
											>
												<div
													data-component='booking'
													className='label'
												>
													Total Article:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{formData.bookingDetails.reduce(
														(
															sum: any,
															detail: any
														) =>
															sum +
															detail.article,
														0
													)}
												</div>
											</div>
										</div>
										<div
											data-component='booking'
											className='columns-1'
										>
											<div
												data-component='booking'
												className='value-container'
											>
												<div
													data-component='booking'
													className='label'
												>
													Private Mark:
												</div>
												<div
													data-component='booking'
													className='value'
												>
													{formData.privateMark
														? formData.privateMark
														: '--'}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{userDetails &&
				userBranchDetails &&
				location.state &&
				articleShape &&
				activeDeliveryBranches && (
					<div
						data-component='booking'
						className='pdf-new'
						id='bill-print-old'
					>
						{new Array(3).fill(null).map(() => {
							return (
								<div
									data-component='booking'
									className='section'
								>
									<div
										data-component='booking'
										className='section-box'
									>
										<div
											data-component='booking'
											className='column-container'
										>
											<div
												data-component='booking'
												className='columns-2 large-value border-right'
											>
												<div
													data-component='booking'
													className='value-container'
												>
													<div
														data-component='booking'
														className='label'
													>
														From:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.fromBranch
															? location.state
																.bookingDetails
																.fromBranch
															: '--'}
														{userBranchDetails.phone
															? `-${userBranchDetails.phone}`
															: ''}
													</div>
												</div>
											</div>
											<div
												data-component='booking'
												className='columns-2 large-value'
											>
												<div
													data-component='booking'
													className='value-container'
												>
													<div
														data-component='booking'
														className='label'
													>
														To:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.toBranch
															? location.state
																.bookingDetails
																.toBranch
															: '--'}
														{`-${findObjectInArray(
															activeDeliveryBranches,
															'branchId',
															location.state
																.bookingDetails
																.toBranchId
														).phone
															}`}
													</div>
												</div>
											</div>
										</div>
									</div>
									<div
										data-component='booking'
										className='section-box'
									>
										<div
											data-component='booking'
											className='column-container'
										>
											<div
												data-component='booking'
												className='columns-4 medium-value'
											>
												<div
													data-component='booking'
													className='value-container'
												>
													<div
														data-component='booking'
														className='label'
													>
														E-Way Bill No.:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.eWayBillNumber
															? location.state
																.bookingDetails
																.eWayBillNumber
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='booking'
												className='columns-4 border-right border-left'
											>
												<div
													data-component='booking'
													className='qr-container'
												>
													<img
														data-component='booking'
														className='qr-code'
														src={qr}
													/>
												</div>
											</div>
											<div
												data-component='booking'
												className='columns-4 border-right medium-value'
											>
												<div
													data-component='booking'
													className='value-container'
												>
													<div
														data-component='booking'
														className='label'
													>
														Date:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.bookingDate
															? format(
																location
																	.state
																	.bookingDetails
																	.bookingDate,
																'dd-MM-yyyy'
															)
															: format(
																currentTime,
																'dd-MM-yyyy'
															)}
													</div>
												</div>
											</div>
											<div
												data-component='booking'
												className='columns-4 large-value'
											>
												<div
													data-component='booking'
													className='value-container'
												>
													<div
														data-component='booking'
														className='label'
													>
														LR Number:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.lrNumber
															? location.state
																.bookingDetails
																.lrNumber
															: '--'}
													</div>
												</div>
											</div>
										</div>
									</div>
									<div
										data-component='booking'
										className='section-box'
									>
										<div
											data-component='booking'
											className='column-container'
										>
											<div
												data-component='booking'
												className='columns-2 border-right'
											>
												<div
													data-component='booking'
													className='value-container border-bottom'
												>
													<div
														data-component='booking'
														className='label'
													>
														Consignor:
													</div>
													<div
														data-component='booking'
														className='value adjust-font-size'
													>
														{location.state
															.bookingDetails
															.consignor
															? location.state
																.bookingDetails
																.consignor
															: '--'}
													</div>
												</div>
												<div
													data-component='booking'
													className='value-container border-bottom'
												>
													<div
														data-component='booking'
														className='label'
													>
														Consignor Phone No.:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.consignorPhone
															? location.state
																.bookingDetails
																.consignorPhone
															: '--'}
													</div>
												</div>
												<div
													data-component='booking'
													className='value-container border-bottom'
												>
													<div
														data-component='booking'
														className='label'
													>
														GSTN:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.consignorGST
															? location.state
																.bookingDetails
																.consignorGST
															: '--'}
													</div>
												</div>
												<div
													data-component='booking'
													className='column-container border-bottom'
												>
													<div
														data-component='booking'
														className='columns-4'
													>
														<div
															data-component='booking'
															className='value padding center'
														>
															Art.
														</div>
													</div>
													<div
														data-component='booking'
														className='columns-1'
													>
														<div
															data-component='booking'
															className='value padding center border-left'
														>
															Article Details
														</div>
													</div>
												</div>
												{location.state.bookingDetails
													.bookingDetails.length !==
													0 && (
														<>
															{location.state.bookingDetails.bookingDetails.map(
																(data: any) => {
																	return (
																		<div
																			data-component='booking'
																			className='column-container border-bottom'
																		>
																			<div
																				data-component='booking'
																				className='columns-4'
																			>
																				<div
																					data-component='booking'
																					className='label padding center'
																				>
																					{
																						data.article
																					}
																				</div>
																			</div>
																			<div
																				data-component='booking'
																				className='columns-1 border-left'
																			>
																				<div
																					data-component='booking'
																					className='label padding center'
																					style={{
																						textWrap:
																							'wrap',
																					}}
																				>
																					{
																						data.goodsType
																					}

																					-
																					{
																						data.shape
																					}
																				</div>
																			</div>
																		</div>
																	);
																}
															)}
														</>
													)}
											</div>
											<div
												data-component='booking'
												className='columns-2 border-right'
											>
												<div
													data-component='booking'
													className='value-container border-bottom'
												>
													<div
														data-component='booking'
														className='label'
													>
														Consignee:
													</div>
													<div
														data-component='booking'
														className='value adjust-font-size'
													>
														{location.state
															.bookingDetails
															.consignee
															? location.state
																.bookingDetails
																.consignee
															: '--'}
													</div>
												</div>
												<div
													data-component='booking'
													className='value-container border-bottom'
												>
													<div
														data-component='booking'
														className='label'
													>
														Consignee Phone No.:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.consigneePhone
															? location.state
																.bookingDetails
																.consignorPhone
															: '--'}
													</div>
												</div>
												<div
													data-component='booking'
													className='value-container'
												>
													<div
														data-component='booking'
														className='label'
													>
														GSTN:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.consigneeGST
															? location.state
																.bookingDetails
																.consigneeGST
															: '--'}
													</div>
												</div>
												<div
													data-component='booking'
													className='column-container border-top'
												>
													<div
														data-component='booking'
														className='columns-2 border-right'
													>
														<div
															data-component='booking'
															className='value-container '
														>
															<div
																data-component='booking'
																className='label'
															>
																Act. Weight:
															</div>
															<div
																data-component='booking'
																className='value'
															>
																{location.state.bookingDetails.bookingDetails.reduce(
																	(
																		sum: any,
																		detail: any
																	) =>
																		sum +
																		detail.weight,
																	0
																)}
															</div>
														</div>
													</div>
													<div
														data-component='booking'
														className='columns-2'
													>
														<div
															data-component='booking'
															className='value-container'
														>
															<div
																data-component='booking'
																className='label'
															>
																Chg. Weight:
															</div>
															<div
																data-component='booking'
																className='value'
															>
																{location.state.bookingDetails.bookingDetails.reduce(
																	(
																		sum: any,
																		detail: any
																	) =>
																		sum +
																		detail.chargeWeight,
																	0
																)}
															</div>
														</div>
													</div>
												</div>
												<div
													data-component='booking'
													className='column-container border-top'
												>
													<div
														data-component='booking'
														className='columns-2 border-right'
													>
														<div
															data-component='booking'
															className='value-container '
														>
															<div
																data-component='booking'
																className='label'
															>
																Invoice No.:
															</div>
															<div
																data-component='booking'
																className='value'
															>
																{location.state
																	.bookingDetails
																	.invoiceNumber
																	? location
																		.state
																		.bookingDetails
																		.invoiceNumber
																	: '--'}
															</div>
														</div>
													</div>
													<div
														data-component='booking'
														className='columns-2'
													>
														<div
															data-component='booking'
															className='value-container'
														>
															<div
																data-component='booking'
																className='label'
															>
																Dec. Value:
															</div>
															<div
																data-component='booking'
																className='value'
															>
																{location.state
																	.bookingDetails
																	.declaredValue
																	? (+location
																		.state
																		.bookingDetails
																		.declaredValue).toFixed(
																			2
																		)
																	: '--'}
															</div>
														</div>
													</div>
												</div>
												<div
													data-component='booking'
													className='value-container border-top'
												>
													<div
														data-component='booking'
														className='label'
													>
														Delivery At:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails.mode
															? location.state
																.bookingDetails
																.mode
															: '--'}
													</div>
												</div>
												<div
													data-component='booking'
													className='value-container border-top'
												>
													<div
														data-component='booking'
														className='label'
													>
														Remark:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails.note
															? location.state
																.bookingDetails
																.note
															: '--'}
													</div>
												</div>
											</div>
											<div
												data-component='booking'
												className='columns-4 calculations-container'
											>
												<div
													data-component='booking'
													className='calculations'
												>
													<div
														data-component='booking'
														className='payment-type-container border-right'
													>
														{location.state
															.bookingDetails
															.paymentType
															? getPaymentTypeById(
																location
																	.state
																	.bookingDetails
																	.paymentType
															)
															: '--'}
													</div>
													<div
														data-component='booking'
														className='totals'
													>
														<div
															data-component='booking'
															className='right-total'
														>
															{location.state
																.bookingDetails
																.freight &&
																location.state
																	.bookingDetails
																	.freight !=
																0 ? (
																<div
																	data-component='booking'
																	className='parameter'
																>
																	Freight:
																	<div
																		data-component='booking'
																		className='parameter-value'
																	>
																		{location.state.bookingDetails.freight.toFixed(
																			2
																		)}
																	</div>
																</div>
															) : (
																<></>
															)}

															{location.state
																.bookingDetails
																.lrCharge &&
																location.state
																	.bookingDetails
																	.lrCharge !=
																0 ? (
																<div
																	data-component='booking'
																	className='parameter'
																>
																	LR Chg.:
																	<div
																		data-component='booking'
																		className='parameter-value'
																	>
																		{location.state.bookingDetails.lrCharge.toFixed(
																			2
																		)}
																	</div>
																</div>
															) : (
																<></>
															)}

															{location.state
																.bookingDetails
																.labour &&
																location.state
																	.bookingDetails
																	.labour != 0 ? (
																<div
																	data-component='booking'
																	className='parameter'
																>
																	Labour:
																	<div
																		data-component='booking'
																		className='parameter-value'
																	>
																		{location.state.bookingDetails.labour.toFixed(
																			2
																		)}
																	</div>
																</div>
															) : (
																<></>
															)}

															{location.state
																.bookingDetails
																.aoc &&
																location.state
																	.bookingDetails
																	.aoc != 0 ? (
																<div
																	data-component='booking'
																	className='parameter'
																>
																	AOC:
																	<div
																		data-component='booking'
																		className='parameter-value'
																	>
																		{location.state.bookingDetails.aoc.toFixed(
																			2
																		)}
																		0
																	</div>
																</div>
															) : (
																<></>
															)}

															{location.state
																.bookingDetails
																.collection &&
																location.state
																	.bookingDetails
																	.collection !=
																0 ? (
																<div
																	data-component='booking'
																	className='parameter'
																>
																	Collection:
																	<div
																		data-component='booking'
																		className='parameter-value'
																	>
																		{location.state.bookingDetails.collection.toFixed(
																			2
																		)}
																	</div>
																</div>
															) : (
																<></>
															)}

															{location.state
																.bookingDetails
																.doorDelivery &&
																location.state
																	.bookingDetails
																	.doorDelivery !=
																0 ? (
																<div
																	data-component='booking'
																	className='parameter'
																>
																	D.D.:
																	<div
																		data-component='booking'
																		className='parameter-value'
																	>
																		{location.state.bookingDetails.doorDelivery.toFixed(
																			2
																		)}
																	</div>
																</div>
															) : (
																<></>
															)}

															{location.state
																.bookingDetails
																.oloc &&
																location.state
																	.bookingDetails
																	.oloc != 0 ? (
																<div
																	data-component='booking'
																	className='parameter'
																>
																	OL/OC:
																	<div
																		data-component='booking'
																		className='parameter-value'
																	>
																		{location.state.bookingDetails.oloc.toFixed(
																			2
																		)}
																	</div>
																</div>
															) : (
																<></>
															)}

															{location.state
																.bookingDetails
																.insurance &&
																location.state
																	.bookingDetails
																	.insurance !=
																0 ? (
																<div
																	data-component='booking'
																	className='parameter'
																>
																	CR/INSUR:
																	<div
																		data-component='booking'
																		className='parameter-value'
																	>
																		{location.state.bookingDetails.insurance.toFixed(
																			2
																		)}
																	</div>
																</div>
															) : (
																<></>
															)}

															{location.state
																.bookingDetails
																.other &&
																location.state
																	.bookingDetails
																	.other != 0 ? (
																<div
																	data-component='booking'
																	className='parameter'
																>
																	Other:
																	<div
																		data-component='booking'
																		className='parameter-value'
																	>
																		{location.state.bookingDetails.other.toFixed(
																			2
																		)}
																	</div>
																</div>
															) : (
																<></>
															)}

															{location.state
																.bookingDetails
																.carrierRisk &&
																location.state
																	.bookingDetails
																	.carrierRisk !=
																0 ? (
																<div
																	data-component='booking'
																	className='parameter'
																>
																	Carrier
																	Risk:
																	<div
																		data-component='booking'
																		className='parameter-value'
																	>
																		{location.state.bookingDetails.carrierRisk.toFixed(
																			2
																		)}
																	</div>
																</div>
															) : (
																<></>
															)}
															{location.state
																.bookingDetails
																.bhCharge &&
																location.state
																	.bookingDetails
																	.bhCharge !=
																0 ? (
																<div
																	data-component='booking'
																	className='parameter'
																>
																	B.H Chg.:
																	<div
																		data-component='booking'
																		className='parameter-value'
																	>
																		{location.state.bookingDetails.bhCharge.toFixed(
																			2
																		)}
																	</div>
																</div>
															) : (
																<></>
															)}

															{location.state
																.bookingDetails
																.fov &&
																location.state
																	.bookingDetails
																	.fov != 0 ? (
																<div
																	data-component='booking'
																	className='parameter'
																>
																	FOV:
																	<div
																		data-component='booking'
																		className='parameter-value'
																	>
																		{location.state.bookingDetails.fov.toFixed(
																			2
																		)}
																	</div>
																</div>
															) : (
																<></>
															)}

															{location.state
																.bookingDetails
																.cartage &&
																location.state
																	.bookingDetails
																	.cartage !=
																0 ? (
																<div
																	data-component='booking'
																	className='parameter'
																>
																	Cartage:
																	<div
																		data-component='booking'
																		className='parameter-value'
																	>
																		{location.state.bookingDetails.cartage.toFixed(
																			2
																		)}
																	</div>
																</div>
															) : (
																<></>
															)}
															<div
																data-component='booking'
																className='total-bottom-stick'
															>
																<div
																	data-component='booking'
																	className='parameter value border-top'
																>
																	Total:
																	<div
																		data-component='booking'
																		className='parameter-value value'
																	>
																		{location
																			.state
																			.bookingDetails
																			.grandTotal
																			? location.state.bookingDetails.grandTotal.toFixed(
																				2
																			)
																			: '--'}
																	</div>
																</div>
																<div
																	data-component='booking'
																	className='parameter'
																>
																	{userDetails.fullName
																		? userDetails.fullName + ' '
																		: '--'}
																	{location
																		.state
																		.bookingDetails
																		.dateAdded
																		? format(
																			location
																				.state
																				.bookingDetails
																				.dateAdded,
																			'hh:mm a'
																		)
																		: format(
																			currentTime,
																			'hh:mm a'
																		)}
																</div>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div
										data-component='booking'
										className='section-box stick-bottom'
									>
										<div
											data-component='booking'
											className='column-container'
										>
											<div
												data-component='booking'
												className='columns-4 border-right'
											>
												<div
													data-component='booking'
													className='value-container'
												>
													<div
														data-component='booking'
														className='label'
													>
														Total Article:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state.bookingDetails.bookingDetails.reduce(
															(
																sum: any,
																detail: any
															) =>
																sum +
																detail.article,
															0
														)}
													</div>
												</div>
											</div>
											<div
												data-component='booking'
												className='columns-1'
											>
												<div
													data-component='booking'
													className='value-container'
												>
													<div
														data-component='booking'
														className='label'
													>
														Private Mark:
													</div>
													<div
														data-component='booking'
														className='value'
													>
														{location.state
															.bookingDetails
															.privateMark
															? location.state
																.bookingDetails
																.privateMark
															: '--'}
													</div>
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

export default Booking;

// -------------------------------------------------------------------------------------------
