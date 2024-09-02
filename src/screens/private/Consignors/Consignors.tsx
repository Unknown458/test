// -------------------------------------------------------------------------------------------

import "./Consignors.scss";

import {
  MaterialReactTable,
  MRT_ColumnDef,
  useMaterialReactTable,
} from "material-react-table";
import {
  ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  AddOutlined,
  Clear,
  Close,
  DeleteOutline,
  Done,
  DownloadOutlined,
  EditOutlined,
  ListAltOutlined,
  PrintOutlined,
  StickyNote2Outlined,
} from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import {
  Button,
  Chip,
  CircularProgress,
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
} from "@mui/material";

import masterGstErrorCodes from "../../../app/masterGstErrorCodes";
import RouterPath from "../../../app/routerPath";
import ActiveToggle from "../../../components/ActiveToggle/ActiveToggle";
import Alert from "../../../components/Alert/Alert";
import {
  AlertInterface,
  AlertStates,
} from "../../../components/Alert/Alert.types";
import Fallback from "../../../components/Fallback/Fallback";
import { FallbackStateType } from "../../../components/Fallback/Fallback.types";
import QuotationPDF from "../../../components/QuotationPDF/QuotationPDF";
import { QuotationPDFdataInterface } from "../../../components/QuotationPDF/QuotationPDF.type";
import Search from "../../../components/Search/Search";
import { useApi } from "../../../contexts/Api/Api";
import { useApp } from "../../../contexts/App/App";
import { useAuth } from "../../../contexts/Auth/Auth";
import { getBranchByIdAsync } from "../../../services/branch/branch";
import {
  BranchInterface,
  StateInterface,
} from "../../../services/branch/branch.types";
import { BillTypeInterface } from "../../../services/branchLrNumber/branchLrNumber.types";
import { CompanyInterface } from "../../../services/company/company.types";
import { GoodsTypeInterface } from "../../../services/goodsType/goodsType.types";
import { getGSTINdetails } from "../../../services/gst/gst";
import {
  createPartyAsync,
  createSubPartyAsync,
  deletePartyAsync,
  deleteSubPartyAsync,
  getSubPartyDetailsAsync,
  updatePartyAsync,
} from "../../../services/party/party";
import {
  PartyInterface,
  PaymentTypeInterface,
  SubPartyInterface,
} from "../../../services/party/party.types";
import { getQuotationsByPartyAsync } from "../../../services/quotation/quotation";
import { QuotationInterface } from "../../../services/quotation/quotation.types";
import { UserInterface } from "../../../services/user/user.types";
import addIndex from "../../../utils/addIndex";
import findObjectInArray from "../../../utils/findObjectInArray";
import generatePDF from "../../../utils/generatePDF";
import printPDF from "../../../utils/printPDF";

// -------------------------------------------------------------------------------------------

const defaultFormData: PartyInterface = {
  partyName: "",
  gstNo: "",
  address: "",
  branchId: 0,
  watsappNo: "",
  phoneNo: "",
  contactPerson: "",
  comments: "",
  quotationComment: "",
  headerText: "",
  botttomText: "",
  paymentTypeId: 0,
  biltyCharge: 0,
  carting: 0,
  commission: 0,
  partyType: 1,
  isActive: true,
  marketingPerson: "",
  billTypeId: 1,
};

const defaultFormErrors = {
  partyName: "",
  gstNo: "",
  address: "",
  branchId: "",
  watsappNo: "",
  phoneNo: "",
  comments: "",
  quotationComment: "",
  headerText: "",
  bottomText: "",
  paymentTypeId: "",
  biltyCharge: "",
  carting: "",
  commission: "",
  partyType: "",
  billTypeId: "",
};

const defaultSubPartyForm: SubPartyInterface = {
  partyId: 0,
  subPartyId: 0,
  isActive: true,
};

const defaultSubPartyFormError = {
  subPartyId: "",
};

// -------------------------------------------------------------------------------------------

const Consignors = memo(() => {
  const { setTitle } = useApp();
  const { handleLogout } = useAuth();
  const {
    getAllConsignorsByCompany,
    getBillTypes,
    getUserDetails,
    getPaymentTypes,
    getAllActiveBookingBranches,
    getGoodsTypes,
    getCompanyDetailsById,
    getDeliveryBranches,
    getStates,
  } = useApi();
  const navigate = useNavigate();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isFormDialogEditMode, setIsFormDialogEditMode] = useState(false);
  const [isFormDialogLoading, setIsFormDialogLoading] = useState(false);
  const [fallbackState, setFallbackState] =
    useState<FallbackStateType>("loading");
  const [consignors, _setConsignors] = useState<PartyInterface[]>([]);
  const [formData, setFormData] = useState<PartyInterface>(defaultFormData);
  const [formErrors, setFormErrors] = useState(defaultFormErrors);
  const [alertDialog, setAlertDialog] = useState<AlertInterface>({
    state: "success",
    label: "",
    isActive: false,
  });
  const [billTypes, _setBillTypes] = useState<BillTypeInterface[]>([]);
  const [user, _setUser] = useState<UserInterface>();
  const [paymentTypes, _setPaymentTypes] = useState<PaymentTypeInterface[]>([]);
  const [states, _setStates] = useState<StateInterface[]>([]);
  const [activeBookingBranches, _setActiveBookingBranches] = useState<
    BranchInterface[]
  >([]);
  const [phoneNumbers, setPhoneNumbers] = useState([""]);
  const [phoneNumbersError, setPhoneNumbersError] = useState([""]);
  const [whatsAppNumber, setWhatsAppNumber] = useState([""]);
  const [whatsAppNumberError, setWhatsAppNumberError] = useState([""]);
  const [loadingSubConsignors, setLoadingSubConsignors] = useState(true);
  const [isSubPartyFormOpen, setIsSubPartyFormOpen] = useState(false);
  const [subPartyForm, setSubPartyForm] =
    useState<SubPartyInterface>(defaultSubPartyForm);
  const [subPartyFormError, setSubPartyFormError] = useState(
    defaultSubPartyFormError
  );
  const [subConsignors, setSubConsignors] = useState<PartyInterface[]>([]);
  const theme = useTheme();
  const isDialogFullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [subPartyFormLoading, setSubPartyFormLoading] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState<number>(-1);
  const [loadingPrint, setLoadingPrint] = useState<number>(-1);
  const [quotationPDFdata, setQuotationPDFdata] =
    useState<QuotationPDFdataInterface | null>();
  const [goodsTypes, _setGoodsTypes] = useState<GoodsTypeInterface[]>([]);
  const [userBranchDetails, setUserBranchDetails] = useState<BranchInterface>();
  const [company, _setCompany] = useState<CompanyInterface>();
  const [quotations, setQuotations] = useState<QuotationInterface[]>([]);
  const [deliveryBranches, setDeliveryBranches] = useState<BranchInterface[]>(
    []
  );
  useEffect(() => {
    setTitle("Consignors");
    initialFetch();
  }, [setTitle]);

  useEffect(() => {
    const updateWindowWidth = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", updateWindowWidth);
    return () => window.removeEventListener("resize", updateWindowWidth);
  }, []);

  useEffect(() => {
    if (
      formData.gstNo &&
      formData.gstNo.length === 15 &&
      !isFormDialogEditMode
    ) {
      handleGetGSTdetails(formData.gstNo);
    }
  }, [formData.gstNo]);

  const handleGetGSTdetails = async (gstNumber: string) => {
    const response: any = await getGSTINdetails(gstNumber);

    if (response.data.data.status_cd !== "1") {
      const errorCode = +JSON.parse(response.data.data.error?.message)
        ?.errorCodes;

      if (errorCode) {
        handleOpenAlertDialog(
          "warning",
          findObjectInArray(masterGstErrorCodes, "errorCode", errorCode).message
        );
      }

      setFormData((prev) => ({
        ...prev,
        partyName: "",
        address: "",
      }));
    } else {
      const data = response.data.data.data;

      if (data.gstin || data.tradeName) {
        setFormData((prev) => ({
          ...prev,
          gstNo: data.gstin ? data.gstin : "",
          partyName: data.tradeName ? data.tradeName : "",
          address: `${data.address1}, ${data.address2}, ${
            findObjectInArray(states, "gstStateCode", +data.stateCode).state
          }, ${data.pinCode}`,
        }));
      }
    }
  };

  const initialFetch = useCallback(async () => {
    try {
      const [
        consignorsData,
        billTypesData,
        userData,
        paymentTypeData,
        allActiveBookingBranches,
        goodsTypeData,
        companyDetailsByIdData,
        statesData,
      ] = await Promise.all([
        getAllConsignorsByCompany(),
        getBillTypes(),
        getUserDetails(),
        getPaymentTypes(),
        getAllActiveBookingBranches(),
        getGoodsTypes(),
        getCompanyDetailsById(),
        getStates(),
      ]);

      if (
        billTypesData.length &&
        userData &&
        paymentTypeData.length &&
        allActiveBookingBranches.length &&
        goodsTypeData.length &&
        statesData.length
      ) {
        _setConsignors(consignorsData);
        _setBillTypes(billTypesData);
        _setUser(userData);
        _setPaymentTypes(paymentTypeData);
        _setActiveBookingBranches(allActiveBookingBranches);
        _setGoodsTypes(goodsTypeData);
        _setCompany(companyDetailsByIdData);
        _setStates(statesData);
        if (user) {
          handleGetBranchById(user.branchId as number);
        }
        setFallbackState("hidden");
      } else {
        setFallbackState("not-found");
      }

      if (consignorsData.length !== 0) {
        setFallbackState("hidden");
      } else {
        setFallbackState("not-found");
      }
    } catch (error) {
      handleLogout();
    }
  }, [
    getAllConsignorsByCompany,
    getBillTypes,
    getUserDetails,
    getPaymentTypes,
    handleLogout,
  ]);

  const handleGetBranchById = async (branchId: number) => {
    const response = await getBranchByIdAsync(branchId);

    if (
      response &&
      typeof response !== "boolean" &&
      response.data.status !== 401
    ) {
      const data: any = response.data.data;
      setUserBranchDetails(data);
    } else {
      handleLogout();
    }
  };

  const validateNumbers = useCallback((numbers: string[], lengthCheck = 10) => {
    const errorsArray = numbers.map((number) => {
      if (!number) return "Number is required.";
      if (number.length < lengthCheck || number.length > lengthCheck + 1)
        return "Number is invalid.";
      return "";
    });
    return errorsArray;
  }, []);

  const validateConsignor = useCallback((): boolean => {
    const errors = { ...defaultFormErrors };

    if (formData.billTypeId === 1) {
      if (!formData.gstNo) {
        errors.gstNo = "GST Number is required.";
      } else if (formData.gstNo.length !== 15) {
        errors.gstNo = "Invalid GST Number.";
      }
    }

    if (!formData.partyName) errors.partyName = "Consignor Name is required.";
    if (!formData.branchId) errors.branchId = "City is required.";
    if (!formData.address) errors.address = "Address is required.";
    if (!formData.paymentTypeId)
      errors.paymentTypeId = "Payment Type is required.";
    if (!formData.biltyCharge) errors.biltyCharge = "LR Charge is required.";
    if (user?.displayEstimate && !formData.billTypeId)
      errors.billTypeId = "Bill Type is required.";

    const phoneErrors = validateNumbers(phoneNumbers);
    const whatsappErrors = validateNumbers(whatsAppNumber, 10);

    setPhoneNumbersError(phoneErrors);
    setWhatsAppNumberError(whatsappErrors);
    setFormErrors(errors);

    const hasErrors =
      Object.values(errors).some((error) => error) ||
      phoneErrors.some((error) => error) ||
      whatsappErrors.some((error) => error);

    return !hasErrors;
  }, [
    formData,
    phoneNumbers,
    user?.displayEstimate,
    validateNumbers,
    whatsAppNumber,
  ]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleOpenFormDialog = useCallback((data?: PartyInterface) => {
    setIsFormDialogOpen(true);
    if (data) {
      setFormData(data);
      setIsFormDialogEditMode(true);
      setPhoneNumbers(data.phoneNo.split(","));
      setWhatsAppNumber(data.watsappNo.split(","));
    }
  }, []);

  const handleCloseFormDialog = useCallback(() => {
    setIsFormDialogOpen(false);
    setFormData(defaultFormData);
    setFormErrors(defaultFormErrors);
    setIsFormDialogEditMode(false);
    setIsFormDialogLoading(false);
    handleCloseAlertDialog();

    setPhoneNumbers([""]);
    setPhoneNumbersError([""]);
    setWhatsAppNumber([""]);
    setWhatsAppNumberError([""]);
  }, []);

  const handleOpenAlertDialog = useCallback(
    (state: AlertStates, label: string) => {
      setAlertDialog({ state, label, isActive: true });
    },
    []
  );

  const handleCloseAlertDialog = useCallback(() => {
    setAlertDialog({ state: "success", label: "", isActive: false });
  }, []);

  const handleSearch = useCallback(
    async (keyword: string) => {
      const array = await getAllConsignorsByCompany();
      if (!keyword || keyword.trim() === "") {
        _setConsignors(array);
        return;
      }
      const regex = new RegExp(keyword.trim(), "i");
      const filteredConsignors = array.filter((consignor) =>
        regex.test(consignor.partyName)
      );
      _setConsignors(addIndex.addIndex3(filteredConsignors));
    },
    [getAllConsignorsByCompany]
  );

  const handleCreateConsignor = useCallback(async () => {
    if (!validateConsignor()) return;

    const data = {
      ...formData,
      watsappNo: whatsAppNumber.filter((number) => number).join(","),
      phoneNo: phoneNumbers.filter((number) => number).join(","),
    };

    setIsFormDialogLoading(true);

    try {
      const response = await createPartyAsync(data);
      if (
        response &&
        typeof response !== "boolean" &&
        response.data.status !== 401
      ) {
        if (response.data.status === 200) {
          const newConsignor: PartyInterface = {
            ...formData,
            partyId: response.data.data,
          };
          _setConsignors((prev) => addIndex.addIndex3([newConsignor, ...prev]));
          handleCloseFormDialog();
          handleOpenAlertDialog("success", "Created new Consignor.");
        } else {
          handleOpenAlertDialog("warning", response.data.data);
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
    handleCloseFormDialog,
    handleOpenAlertDialog,
    handleLogout,
    _setConsignors,
    user?.branchId,
    validateConsignor,
    phoneNumbers,
    whatsAppNumber,
  ]);

  const handleUpdateConsignor = useCallback(async () => {
    if (!validateConsignor()) return;

    const data = {
      ...formData,
      watsappNo: whatsAppNumber.filter((number) => number).join(","),
      phoneNo: phoneNumbers.filter((number) => number).join(","),
    };

    setIsFormDialogLoading(true);

    try {
      const response = await updatePartyAsync(data);
      if (
        response &&
        typeof response !== "boolean" &&
        response.data.status !== 401
      ) {
        if (response.data.status === 200) {
          const updatedConsignors = consignors.map((obj) =>
            obj.partyId === data.partyId ? { ...data } : obj
          );
          _setConsignors(addIndex.addIndex3(updatedConsignors));
          handleCloseFormDialog();
          handleOpenAlertDialog("success", "Updated Consignor.");
        } else {
          handleOpenAlertDialog("warning", response.data.data);
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
    handleCloseFormDialog,
    handleOpenAlertDialog,
    handleLogout,
    _setConsignors,
    user?.branchId,
    validateConsignor,
    consignors,
    phoneNumbers,
    whatsAppNumber,
  ]);

  const handleDeleteConsignor = useCallback(
    async (data: PartyInterface) => {
      const confirm = window.confirm(
        `Are you sure you want to delete Consignor '${data.partyName}'?`
      );
      if (!confirm) return;

      const partyId = data.partyId as number;

      try {
        const response = await deletePartyAsync(partyId);
        if (
          response &&
          typeof response !== "boolean" &&
          response.data.status !== 401
        ) {
          if (response.data.status === 200) {
            const updatedConsignors = consignors.filter(
              (obj) => obj.partyId !== partyId
            );
            _setConsignors(addIndex.addIndex3(updatedConsignors));
            handleOpenAlertDialog("success", "Deleted Consignor.");
          } else {
            handleOpenAlertDialog("warning", response.data.data);
          }
        } else {
          handleLogout();
        }
      } catch (error) {
        handleLogout();
      }
    },
    [consignors, handleLogout, handleOpenAlertDialog, _setConsignors]
  );

  const validateSubPartyForm = () => {
    if (!subPartyForm.subPartyId) {
      setSubPartyFormError((prev) => ({
        ...prev,
        subPartyId: "Consignor is required.",
      }));
    } else {
      setSubPartyFormError((prev) => ({ ...prev, subPartyId: "" }));
    }

    if (subPartyForm.subPartyId && subPartyForm.subPartyId !== 0) {
      return true;
    } else {
      return false;
    }
  };

  const handleCreateSubParty = async () => {
    const isValid = validateSubPartyForm();

    if (isValid) {
      setSubPartyFormLoading(true);

      const data = {
        ...subPartyForm,
      };

      const response = await createSubPartyAsync(data);

      setSubPartyFormLoading(false);

      if (
        response &&
        typeof response !== "boolean" &&
        response.data.status !== 401
      ) {
        if (response.data.status === 200) {
          for (const consignor of consignors) {
            if (subPartyForm.subPartyId === consignor.partyId) {
              setSubConsignors((prev) => addIndex.addIndex3([consignor, ...prev]));
            }
          }

          setSubPartyForm(defaultSubPartyForm);

          handleOpenAlertDialog("success", "Created new Sub-Consignor.");
        } else {
          handleOpenAlertDialog("warning", response.data.data);
        }
      } else {
        handleLogout();
      }
    }
  };

  const handleDeleteSubParty = async (subConsignor: PartyInterface & any) => {
    const confirm = window.confirm(
      `Are you sure you want to delete Sub-Consignor '${subConsignor.partyName}'?`
    );

    if (confirm) {
      const subPartyDetailId = subConsignor.subPartyDetailId as number;

      const response = await deleteSubPartyAsync(subPartyDetailId);

      if (
        response &&
        typeof response !== "boolean" &&
        response.data.status !== 401
      ) {
        if (response.data.status === 200) {
          let subConsignorsCopy = subConsignors.filter(
            (obj) => obj.partyId !== subConsignor.partyId
          );

          setSubConsignors(addIndex.addIndex3(subConsignorsCopy));
          handleOpenAlertDialog("success", "Deleted Sub-Consignor.");
        } else {
          handleOpenAlertDialog("warning", response.data.data);
        }
      } else {
        handleLogout();
      }
    }
  };

  const handleGetSubPartyDetails = async (
    party: any,
    allParties: PartyInterface[]
  ) => {
    setLoadingSubConsignors(true);
    const response = await getSubPartyDetailsAsync(party.partyId as number);
    setLoadingSubConsignors(false);

    if (
      response &&
      typeof response !== "boolean" &&
      response.data.status !== 401
    ) {
      const data: any = response.data.data.reverse();

      const array: PartyInterface[] & SubPartyInterface[] = [];

      for (const party of allParties) {
        for (const subParty of data) {
          if (subParty.subPartyId === party.partyId) {
            array.push({
              ...party,
              ...subParty,
            });
          }
        }
      }

      return [...array];
    } else {
      handleLogout();
      return [];
    }
  };

  const handleSubPartyFormOpen = async (party: PartyInterface) => {
    setIsSubPartyFormOpen(true);
    setSubPartyForm((prev) => ({
      ...prev,
      partyId: party.partyId as number,
    }));

    const subParties = await handleGetSubPartyDetails(party, consignors);

    if (subParties) {
      setSubConsignors(addIndex.addIndex3(subParties));
    }
  };

  const handleSubPartyFormClose = () => {
    setIsSubPartyFormOpen(false);
    setSubPartyForm(defaultSubPartyForm);
    setSubPartyFormError(defaultSubPartyFormError);
    setSubConsignors([]);
  };

  const handleGetQuotationsByParty = async (partyId: number) => {
    const response = await getQuotationsByPartyAsync(partyId);

    if (
      response &&
      typeof response !== "boolean" &&
      response.data.status !== 401
    ) {
      const data: any = response.data.data.reverse();

      return data;
    } else {
      handleLogout();
    }
  };

  const handlePDFdownload = async (party: PartyInterface) => {
    setLoadingDownload(party.partyId as number);

    setQuotationPDFdata({
      htmlId: `${party.partyId}`,
      party: party,
      goodsTypes: [...goodsTypes],
      branch: userBranchDetails as any,
      company: company as CompanyInterface,
    });

    const quotationsArray = await handleGetQuotationsByParty(
      party.partyId as number
    );

    const deliveryBranchesArray: BranchInterface[] =
      await getDeliveryBranches();

    if (quotationsArray && quotationsArray.length !== 0) {
      setQuotations(quotationsArray);
      setDeliveryBranches(deliveryBranchesArray);

      setTimeout(() => {
        generatePDF(
          document.getElementById(`${party.partyId}`) as HTMLElement,
          `${party.partyName} - Quotations`
        );
        setQuotations([]);
        setQuotationPDFdata(null);
      }, 1000);
    } else {
      handleOpenAlertDialog("error", "No quotations found.");
    }

    setTimeout(() => {
      setLoadingDownload(-1);
    }, 3000);
  };

  const handlePDFprint = async (party: PartyInterface) => {
    setLoadingPrint(party.partyId as number);

    setQuotationPDFdata({
      htmlId: `${party.partyId}`,
      party: party,
      goodsTypes: [...goodsTypes],
      branch: userBranchDetails as any,
      company: company as CompanyInterface,
    });

    const quotationsArray = await handleGetQuotationsByParty(
      party.partyId as number
    );

    const deliveryBranchesArray: BranchInterface[] =
      await getDeliveryBranches();

    if (quotationsArray && quotationsArray.length !== 0) {
      setQuotations(quotationsArray);
      setDeliveryBranches(deliveryBranchesArray);

      setTimeout(() => {
        printPDF(document.getElementById(`${party.partyId}`) as HTMLElement);

        setQuotations([]);
        setQuotationPDFdata(null);
      }, 1000);
    } else {
      handleOpenAlertDialog("error", "No quotations found.");
    }

    setTimeout(() => {
      setLoadingPrint(-1);
    }, 3000);
  };

  const columnsWithBillType = useMemo<MRT_ColumnDef<PartyInterface>[]>(
    () => [
      {
        accessorKey: "index",
        header: "#",
        enableResizing: false,
        size: 80,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
        Cell: ({ row }) => (
          <>
            <div className="table-index">
              {row.original.isActive ? (
                <Tooltip title="Active Consignor">
                  <Chip icon={<Done />} color="success" />
                </Tooltip>
              ) : (
                <Tooltip title="Disabled Consignor">
                  <Chip icon={<Clear />} color="error" />
                </Tooltip>
              )}
              {row.original.index}
            </div>
          </>
        ),
      },
      {
        accessorKey: "partyName",
        header: "Full Name",
        enableResizing: true,
        size: 80,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
      },
      {
        accessorKey: "gstNo",
        header: "GST Number",
        enableResizing: true,
        size: 80,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
      },
      {
        accessorKey: "billTypeId",
        header: "Bill Type",
        enableResizing: true,
        size: 80,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
        accessorFn: (row) =>
          `${
            findObjectInArray(billTypes, "billTypeId", row.billTypeId)
              ?.billType || ""
          }`,
      },
      {
        accessorKey: "actions",
        header: "Actions",
        enableResizing: false,
        enableColumnFilter: false,
        enableSorting: false,
        size: 180,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        muiTableFooterCellProps: { align: "right" },
        Cell: ({ row }) => (
          <>
            {loadingDownload !== row.original.partyId ? (
              <Tooltip title="Download Quotations">
                <IconButton onClick={() => handlePDFdownload(row.original)}>
                  <DownloadOutlined />
                </IconButton>
              </Tooltip>
            ) : (
              <IconButton>
                <CircularProgress size={24} />
              </IconButton>
            )}
            {loadingPrint !== row.original.partyId ? (
              <Tooltip title="Print Quotations">
                <IconButton onClick={() => handlePDFprint(row.original)}>
                  <PrintOutlined />
                </IconButton>
              </Tooltip>
            ) : (
              <IconButton>
                <CircularProgress size={24} />
              </IconButton>
            )}
            <Tooltip title="Quotations">
              <IconButton
                onClick={() => {
                  navigate(RouterPath.Quotations, {
                    state: {
                      party: row.original,
                    },
                  });
                }}
              >
                <StickyNote2Outlined />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sub-Consignors">
              <IconButton onClick={() => handleSubPartyFormOpen(row.original)}>
                <ListAltOutlined />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Consignor">
              <IconButton onClick={() => handleDeleteConsignor(row.original)}>
                <DeleteOutline />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Consignor">
              <IconButton onClick={() => handleOpenFormDialog(row.original)}>
                <EditOutlined />
              </IconButton>
            </Tooltip>
          </>
        ),
      },
    ],
    [handleDeleteConsignor, handleOpenFormDialog, billTypes]
  );

  const columnsWithoutBillType = useMemo<MRT_ColumnDef<PartyInterface>[]>(
    () => [
      {
        accessorKey: "index",
        header: "#",
        enableResizing: false,
        size: 80,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
        Cell: ({ row }) => (
          <>
            <div className="table-index">
              {row.original.isActive ? (
                <Tooltip title="Active Consignor">
                  <Chip icon={<Done />} color="success" />
                </Tooltip>
              ) : (
                <Tooltip title="Disabled Consignor">
                  <Chip icon={<Clear />} color="error" />
                </Tooltip>
              )}
              {row.original.index}
            </div>
          </>
        ),
      },
      {
        accessorKey: "partyName",
        header: "Full Name",
        enableResizing: true,
        size: 80,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
      },
      {
        accessorKey: "gstNo",
        header: "GST Number",
        enableResizing: true,
        size: 80,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
      },
      {
        accessorKey: "actions",
        header: "Actions",
        enableResizing: false,
        enableColumnFilter: false,
        enableSorting: false,
        size: 180,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        muiTableFooterCellProps: { align: "right" },
        Cell: ({ row }) => (
          <>
            {loadingDownload !== row.original.partyId ? (
              <Tooltip title="Download Quotations">
                <IconButton onClick={() => handlePDFdownload(row.original)}>
                  <DownloadOutlined />
                </IconButton>
              </Tooltip>
            ) : (
              <IconButton>
                <CircularProgress size={24} />
              </IconButton>
            )}
            {loadingPrint !== row.original.partyId ? (
              <Tooltip title="Print Quotations">
                <IconButton onClick={() => handlePDFprint(row.original)}>
                  <PrintOutlined />
                </IconButton>
              </Tooltip>
            ) : (
              <IconButton>
                <CircularProgress size={24} />
              </IconButton>
            )}
            <Tooltip title="Quotations">
              <IconButton
                onClick={() => {
                  navigate(RouterPath.Quotations, {
                    state: {
                      party: row.original,
                    },
                  });
                }}
              >
                <StickyNote2Outlined />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sub-Consignors">
              <IconButton onClick={() => handleSubPartyFormOpen(row.original)}>
                <ListAltOutlined />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Consignor">
              <IconButton onClick={() => handleDeleteConsignor(row.original)}>
                <DeleteOutline />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Consignor">
              <IconButton onClick={() => handleOpenFormDialog(row.original)}>
                <EditOutlined />
              </IconButton>
            </Tooltip>
          </>
        ),
      },
    ],
    [handleDeleteConsignor, handleOpenFormDialog, billTypes]
  );

  const table = useMaterialReactTable({
    columns: user?.displayEstimate
      ? columnsWithBillType
      : columnsWithoutBillType,
    data: consignors,
    filterFromLeafRows: true,
    paginateExpandedRows: false,
    enableColumnResizing: true,
    enablePagination: true,
    layoutMode: "grid",
    enableDensityToggle: false,
    initialState: {
      pagination: { pageSize: 100, pageIndex: 0 },
      density: "compact",
      sorting: [{ id: "partyName", desc: false}],
    },
    muiPaginationProps: { rowsPerPageOptions: [100, 200, 500, 1000] },
    muiTablePaperProps: {
      sx: {
        borderRadius: "var(--shape-medium)",
        boxShadow: "var(--elevation-extra-small)",
      },
    },
    muiTableBodyCellProps: { sx: { paddingTop: 0, paddingBottom: 0 } },
  });

  const subPartyColumns = useMemo<MRT_ColumnDef<PartyInterface, any>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        enableResizing: false,
        size: 80,
        muiTableHeadCellProps: {
          align: "left",
        },
        muiTableBodyCellProps: {
          align: "left",
        },
        muiTableFooterCellProps: {
          align: "left",
        },
        Cell: ({ row }) => {
          return (
            <>
              <div className="table-index">
                {row.original.isActive ? (
                  <Tooltip title="Active Sub-Consignor">
                    <Chip icon={<Done />} color="success" />
                  </Tooltip>
                ) : (
                  <Tooltip title="Disabled Sub-Consignor">
                    <Chip icon={<Clear />} color="error" />
                  </Tooltip>
                )}
                {row.original.index}
              </div>
            </>
          );
        },
      },
      {
        accessorKey: "partyName",
        header: "Full Name",
        enableResizing: true,
        muiTableHeadCellProps: {
          align: "left",
        },
        muiTableBodyCellProps: {
          align: "left",
        },
        muiTableFooterCellProps: {
          align: "left",
        },
      },
      {
        accessorKey: "gstNo",
        header: "GST Number",
        enableResizing: true,
        muiTableHeadCellProps: {
          align: "left",
        },
        muiTableBodyCellProps: {
          align: "left",
        },
        muiTableFooterCellProps: {
          align: "left",
        },
      },
      {
        accessorKey: "actions",
        header: "Actions",
        enableResizing: false,
        enableColumnFilter: false,
        enableSorting: false,
        size: 280,
        muiTableHeadCellProps: {
          align: "right",
        },
        muiTableBodyCellProps: {
          align: "right",
        },
        muiTableFooterCellProps: {
          align: "right",
        },
        Cell: ({ row }) => {
          return (
            <>
              <Tooltip title="Delete">
                <IconButton onClick={() => handleDeleteSubParty(row.original)}>
                  <DeleteOutline />
                </IconButton>
              </Tooltip>
            </>
          );
        },
      },
    ],
    [subConsignors]
  );

  const subPartyTable = useMaterialReactTable({
    columns: subPartyColumns,
    data: subConsignors,
    filterFromLeafRows: true,
    paginateExpandedRows: false,
    enableColumnResizing: true,
    enablePagination: true,
    layoutMode: "grid",
    enableDensityToggle: false,
    initialState: {
      pagination: { pageSize: 100, pageIndex: 0 },
      density: "compact",
      
    },
    muiPaginationProps: { rowsPerPageOptions: [100, 200, 500, 1000] },
    muiTablePaperProps: {
      sx: {
        borderRadius: "var(--shape-medium)",
        boxShadow: "var(--elevation-extra-small)",
      },
    },
    muiTableBodyCellProps: { sx: { paddingTop: 0, paddingBottom: 0 } },
  });

  return (
    <>
      <div data-component="consignors" className="container">
        <div data-component="consignors" className="top">
          <Search
            onChange={handleSearch}
            isDisabled={fallbackState !== "hidden"}
          />
          {windowWidth > 600 && (
            <Tooltip title="Create New Consignor">
              <Fab
                variant="extended"
                color="primary"
                data-component="consignors"
                className="fab"
                onClick={() => handleOpenFormDialog()}
              >
                <AddOutlined />
                Create new
              </Fab>
            </Tooltip>
          )}
        </div>
        <div data-component="consignors" className="bottom">
          {fallbackState !== "hidden" ? (
            <Fallback state={fallbackState} />
          ) : (
            <div data-component="consignors" className="table-container">
              <MaterialReactTable table={table} />
            </div>
          )}
        </div>
      </div>

      {windowWidth < 600 && (
        <div data-component="consignors" className="fab-container">
          <Tooltip title="Create New Consignor">
            <Fab
              variant="extended"
              color="primary"
              data-component="consignors"
              className="fab"
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
        maxWidth="lg"
        fullScreen={isDialogFullScreen}
        data-component="consignors"
        className="dialog"
      >
        <DialogTitle data-component="consignors" className="dialog-title">
          {!isFormDialogEditMode ? "Create New Consignor" : "Edit Consignor"}
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
        <DialogContent data-component="consignors" className="dialog-content">
          <div data-component="consignors" className="container">
            <div data-component="consignors" className="columns-3">
              <FormControl
                size="medium"
                disabled={isFormDialogLoading || isFormDialogEditMode}
                variant="outlined"
                fullWidth
                error={!!formErrors.gstNo}
              >
                <InputLabel htmlFor="gst-number">GST Number</InputLabel>
                <OutlinedInput
                  label="GST Number"
                  id="gst-number"
                  type="text"
                  value={formData.gstNo || ""}
                  name="gstNo"
                  onChange={handleChange}
                  inputProps={{
                    minLength: 15,
                    maxLength: 15,
                  }}
                />
                {formErrors.gstNo && (
                  <FormHelperText error>{formErrors.gstNo}</FormHelperText>
                )}
              </FormControl>
              <FormControl
                size="medium"
                disabled={isFormDialogLoading || isFormDialogEditMode}
                variant="outlined"
                fullWidth
                error={!!formErrors.partyName}
              >
                <InputLabel htmlFor="part-name">Consignor Name</InputLabel>
                <OutlinedInput
                  label="Consignor Name"
                  id="part-name"
                  type="text"
                  value={formData.partyName || ""}
                  name="partyName"
                  onChange={handleChange}
                />
                {formErrors.partyName && (
                  <FormHelperText error>{formErrors.partyName}</FormHelperText>
                )}
              </FormControl>
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
                error={!!formErrors.branchId}
              >
                <InputLabel>City</InputLabel>
                <Select
                  label="City"
                  value={formData.branchId || ""}
                  name="branchId"
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      branchId: e.target.value as number,
                    }));
                  }}
                >
                  {activeBookingBranches.map((branch) => (
                    <MenuItem
                      key={`branch-${branch.branchId}`}
                      value={branch.branchId}
                    >
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.branchId && (
                  <FormHelperText error>{formErrors.branchId}</FormHelperText>
                )}
              </FormControl>
              {phoneNumbers.map((number, index) => (
                <div
                  key={`number-${index}`}
                  data-component="consignors"
                  className="phone-container"
                >
                  <FormControl
                    size="medium"
                    disabled={isFormDialogLoading}
                    variant="outlined"
                    fullWidth
                    error={!!phoneNumbersError[index]}
                  >
                    <InputLabel htmlFor="phone-number">Phone Number</InputLabel>
                    <OutlinedInput
                      label="Phone Number"
                      id="phone-number"
                      type="number"
                      name="phoneNo"
                      value={number}
                      onChange={(e) => {
                        const array = [...phoneNumbers];
                        array[index] = e.target.value;
                        setPhoneNumbers(array);
                      }}
                      endAdornment={
                        phoneNumbers.length === 1 ? null : (
                          <Tooltip title="Remove">
                            <IconButton
                              edge="end"
                              onClick={() => {
                                const array = [...phoneNumbers];
                                array.splice(index, 1);
                                setPhoneNumbers(array);
                                const errorsArray = [...phoneNumbersError];
                                errorsArray.splice(index, 1);
                                setPhoneNumbersError(errorsArray);
                              }}
                            >
                              <Close />
                            </IconButton>
                          </Tooltip>
                        )
                      }
                    />
                    {phoneNumbersError[index] && (
                      <FormHelperText error>
                        {phoneNumbersError[index]}
                      </FormHelperText>
                    )}
                  </FormControl>
                  {phoneNumbers.length === index + 1 && (
                    <Tooltip title="Add">
                      <IconButton
                        data-component="consignors"
                        className="phone-add-button"
                        disabled={phoneNumbers.length === 5}
                        onClick={() => {
                          if (
                            phoneNumbers.length !== 5 &&
                            !phoneNumbersError[index]
                          ) {
                            setPhoneNumbers((prev) => [...prev, ""]);
                            setPhoneNumbersError((prev) => [...prev, ""]);
                          }
                        }}
                      >
                        <AddOutlined />
                      </IconButton>
                    </Tooltip>
                  )}
                </div>
              ))}
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
                error={!!formErrors.address}
              >
                <InputLabel htmlFor="address">Address</InputLabel>
                <OutlinedInput
                  multiline
                  rows={user?.displayEstimate ? 7 : 4}
                  label="Address"
                  id="address"
                  type="text"
                  value={formData.address || ""}
                  name="address"
                  onChange={handleChange}
                />
                {formErrors.address && (
                  <FormHelperText error>{formErrors.address}</FormHelperText>
                )}
              </FormControl>
            </div>
            <div data-component="consignors" className="columns-3">
              {whatsAppNumber.map((number, index) => (
                <div
                  key={`number-${index}`}
                  data-component="consignors"
                  className="phone-container"
                >
                  <FormControl
                    size="medium"
                    disabled={isFormDialogLoading}
                    variant="outlined"
                    fullWidth
                    error={!!whatsAppNumberError[index]}
                  >
                    <InputLabel htmlFor="whats-app-number">
                      WhatsApp Number
                    </InputLabel>
                    <OutlinedInput
                      label="WhatsApp Number"
                      id="whats-app-number"
                      type="number"
                      value={number}
                      onChange={(e) => {
                        const array = [...whatsAppNumber];
                        array[index] = e.target.value;
                        setWhatsAppNumber(array);
                      }}
                      endAdornment={
                        whatsAppNumber.length === 1 ? null : (
                          <Tooltip title="Remove">
                            <IconButton
                              edge="end"
                              onClick={() => {
                                const array = [...whatsAppNumber];
                                array.splice(index, 1);
                                setWhatsAppNumber(array);
                                const errorsArray = [...whatsAppNumberError];
                                errorsArray.splice(index, 1);
                                setWhatsAppNumberError(errorsArray);
                              }}
                            >
                              <Close />
                            </IconButton>
                          </Tooltip>
                        )
                      }
                    />
                    {whatsAppNumberError[index] && (
                      <FormHelperText error>
                        {whatsAppNumberError[index]}
                      </FormHelperText>
                    )}
                  </FormControl>
                  {whatsAppNumber.length === index + 1 && (
                    <Tooltip title="Add">
                      <IconButton
                        data-component="consignors"
                        className="phone-add-button"
                        disabled={whatsAppNumber.length === 5}
                        onClick={() => {
                          if (
                            whatsAppNumber.length !== 5 &&
                            !whatsAppNumberError[index]
                          ) {
                            setWhatsAppNumber((prev) => [...prev, ""]);
                            setWhatsAppNumberError((prev) => [...prev, ""]);
                          }
                        }}
                      >
                        <AddOutlined />
                      </IconButton>
                    </Tooltip>
                  )}
                </div>
              ))}
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
              >
                <InputLabel htmlFor="contact-person">
                  Contact Person Name
                </InputLabel>
                <OutlinedInput
                  label="Contact Person Name"
                  id="contact-person"
                  type="text"
                  value={formData.contactPerson || ""}
                  name="contactPerson"
                  onChange={handleChange}
                />
              </FormControl>
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
                error={!!formErrors.paymentTypeId}
              >
                <InputLabel>Payment Type</InputLabel>
                <Select
                  label="Payment Type"
                  value={formData.paymentTypeId || ""}
                  name="paymentTypeId"
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      paymentTypeId: e.target.value as number,
                    }));
                  }}
                >
                  {paymentTypes.map((type) => (
                    <MenuItem
                      key={`payment-type-${type.paymentTypeId}`}
                      value={type.paymentTypeId}
                    >
                      {type.paymentType}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.paymentTypeId && (
                  <FormHelperText error>
                    {formErrors.paymentTypeId}
                  </FormHelperText>
                )}
              </FormControl>
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
                error={!!formErrors.biltyCharge}
              >
                <InputLabel htmlFor="bilty-charges">LR Charge</InputLabel>
                <OutlinedInput
                  label="LR Charge"
                  id="bilty-charges"
                  type="number"
                  value={formData.biltyCharge || ""}
                  name="biltyCharge"
                  onChange={handleChange}
                />
                {formErrors.biltyCharge && (
                  <FormHelperText error>
                    {formErrors.biltyCharge}
                  </FormHelperText>
                )}
              </FormControl>
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
                error={!!formErrors.comments}
              >
                <InputLabel htmlFor="comments">Comments</InputLabel>
                <OutlinedInput
                  multiline
                  rows={user?.displayEstimate ? 7 : 4}
                  label="Comments"
                  id="comments"
                  type="text"
                  value={formData.comments || ""}
                  name="comments"
                  onChange={handleChange}
                />
                {formErrors.comments && (
                  <FormHelperText error>{formErrors.comments}</FormHelperText>
                )}
              </FormControl>
            </div>
            <div data-component="consignors" className="columns-3">
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
                error={!!formErrors.carting}
              >
                <InputLabel htmlFor="carting">Carting</InputLabel>
                <OutlinedInput
                  label="Carting"
                  id="carting"
                  type="number"
                  value={formData.carting || ""}
                  name="carting"
                  onChange={handleChange}
                />
                {formErrors.carting && (
                  <FormHelperText error>{formErrors.carting}</FormHelperText>
                )}
              </FormControl>
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
                error={!!formErrors.commission}
              >
                <InputLabel htmlFor="commission">Commission</InputLabel>
                <OutlinedInput
                  label="Commission"
                  id="commission"
                  type="number"
                  value={formData.commission || ""}
                  name="commission"
                  onChange={handleChange}
                />
                {formErrors.commission && (
                  <FormHelperText error>{formErrors.commission}</FormHelperText>
                )}
              </FormControl>
              {user?.displayEstimate && (
                <FormControl
                  size="medium"
                  disabled={isFormDialogLoading}
                  variant="outlined"
                  fullWidth
                  error={!!formErrors.billTypeId}
                >
                  <InputLabel>Bill Type</InputLabel>
                  <Select
                    label="Bill Type"
                    value={formData.billTypeId || ""}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        billTypeId: e.target.value as number,
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
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
              >
                <InputLabel htmlFor="marketing-person">
                  Marketing Person Name
                </InputLabel>
                <OutlinedInput
                  label="Marketing Person Name"
                  id="marketing-person"
                  type="text"
                  value={formData.marketingPerson || ""}
                  name="marketingPerson"
                  onChange={handleChange}
                />
              </FormControl>
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
                error={!!formErrors.headerText}
              >
                <InputLabel htmlFor="headerText">Header Text</InputLabel>
                <OutlinedInput
                  label="Header Text"
                  id="headerText"
                  type="text"
                  value={formData.headerText || ""}
                  name="headerText"
                  onChange={handleChange}
                />
                {formErrors.headerText && (
                  <FormHelperText error>{formErrors.headerText}</FormHelperText>
                )}
              </FormControl>
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
                error={!!formErrors.bottomText}
              >
                <InputLabel htmlFor="bottomText">Bottom Text</InputLabel>
                <OutlinedInput
                  label="Bottom Text"
                  id="bottomText"
                  type="text"
                  value={formData.botttomText || ""}
                  name="bottomText"
                  onChange={handleChange}
                />
                {formErrors.bottomText && (
                  <FormHelperText error>{formErrors.bottomText}</FormHelperText>
                )}
              </FormControl>
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
                error={!!formErrors.quotationComment}
              >
                <InputLabel htmlFor="quotationComment">
                  Quotation Comment
                </InputLabel>
                <OutlinedInput
                  label="Quotation Comment"
                  id="quotationComment"
                  type="text"
                  value={formData.quotationComment || ""}
                  name="quotationComment"
                  onChange={handleChange}
                />
                {formErrors.quotationComment && (
                  <FormHelperText error>
                    {formErrors.quotationComment}
                  </FormHelperText>
                )}
              </FormControl>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormDialog}>Close</Button>
          <LoadingButton
            color="primary"
            onClick={
              !isFormDialogEditMode
                ? handleCreateConsignor
                : handleUpdateConsignor
            }
            loading={isFormDialogLoading}
            type="submit"
          >
            Save
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isSubPartyFormOpen}
        onClose={handleSubPartyFormClose}
        data-component="consignors"
        className="dialog"
        fullWidth={true}
        maxWidth="md"
        fullScreen={isDialogFullScreen}
      >
        <DialogTitle>
          Sub-Consignors (
          {
            findObjectInArray(consignors, "partyId", subPartyForm.partyId)
              .partyName
          }
          )
        </DialogTitle>
        <DialogContent data-component="consignors" className="dialog-content">
          <div data-component="consignors" className="input-container">
            <FormControl
              size="medium"
              disabled={subPartyFormLoading}
              variant="outlined"
              fullWidth
              error={subPartyFormError.subPartyId ? true : false}
            >
              <InputLabel>Consignors</InputLabel>
              <Select
                label="Consignors"
                value={subPartyForm.subPartyId ? subPartyForm?.subPartyId : ""}
                onChange={(e) => {
                  setSubPartyForm((prev) => ({
                    ...prev,
                    subPartyId: e.target.value as number,
                  }));
                }}
              >
                {consignors.map((party) => {
                  return (
                    <MenuItem
                      key={`payment-type-${party.partyId}`}
                      value={party.partyId as number}
                    >
                      {party.partyName}
                    </MenuItem>
                  );
                })}
              </Select>
              {subPartyFormError.subPartyId && (
                <FormHelperText error>
                  {subPartyFormError.subPartyId}
                </FormHelperText>
              )}
            </FormControl>

            <LoadingButton
              data-component="consignors"
              className="text-button"
              color="primary"
              onClick={handleCreateSubParty}
              loading={subPartyFormLoading}
              type="submit"
            >
              Save
            </LoadingButton>
          </div>

          <div data-component="consignors" className="table-container">
            {loadingSubConsignors ? (
              <Fallback state="loading" />
            ) : (
              <>
                {" "}
                {!loadingSubConsignors && subConsignors.length === 0 ? (
                  <Fallback state="not-found" />
                ) : (
                  <MaterialReactTable table={subPartyTable} />
                )}
              </>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            data-component="consignors"
            className="text-button"
            onClick={handleSubPartyFormClose}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Alert {...alertDialog} onClose={handleCloseAlertDialog} />

      {quotations.length !== 0 &&
        quotationPDFdata &&
        deliveryBranches.length !== 0 && (
          <QuotationPDF
            htmlId={quotationPDFdata.htmlId}
            party={quotationPDFdata.party}
            deliveryBranches={deliveryBranches}
            goodsTypes={quotationPDFdata.goodsTypes}
            branch={quotationPDFdata.branch}
            quotations={quotations}
            company={quotationPDFdata.company}
          />
        )}
    </>
  );
});

// -------------------------------------------------------------------------------------------

export default Consignors;

// -------------------------------------------------------------------------------------------
