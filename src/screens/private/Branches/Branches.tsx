// -------------------------------------------------------------------------------------------

import "./Branches.scss";

import {
  MaterialReactTable,
  MRT_ColumnDef,
  useMaterialReactTable,
} from "material-react-table";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  AddBoxOutlined,
  AddOutlined,
  Clear,
  Close,
  CurrencyRupeeOutlined,
  DeleteOutline,
  Done,
  EditOutlined,
  PercentOutlined,
} from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import {
  Button,
  Chip,
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

import ActiveToggle from "../../../components/ActiveToggle/ActiveToggle";
import Alert from "../../../components/Alert/Alert";
import {
  AlertInterface,
  AlertStates,
} from "../../../components/Alert/Alert.types";
import Fallback from "../../../components/Fallback/Fallback";
import { FallbackStateType } from "../../../components/Fallback/Fallback.types";
import Search from "../../../components/Search/Search";
import { useApi } from "../../../contexts/Api/Api";
import { useApp } from "../../../contexts/App/App";
import { useAuth } from "../../../contexts/Auth/Auth";
import { AgentInterface } from "../../../services/agent/agent.types";
import {
  createBranchAsync,
  createRegionAsync,
  deleteBranchAsync,
  updateBranchAsync,
} from "../../../services/branch/branch";
import {
  BranchInterface,
  BranchType,
  CommisionType,
  RegionInterface,
  StateInterface,
} from "../../../services/branch/branch.types";
import { UserInterface } from "../../../services/user/user.types";
import {
  arrangeBranches,
  removeBranchById,
} from "../../../utils/arrangeBranches";
import findObjectInArray from "../../../utils/findObjectInArray";

// -------------------------------------------------------------------------------------------

const defaultFormData: BranchInterface = {
  name: "",
  address: "",
  stateId: 0,
  regionId: 0,
  phone: "",
  email: "",
  managerName: "",
  managerPhone: "",
  managerEmail: "",
  isActive: true,
  isSubBranch: false,
  parentBranchId: 0,
  commisionType: CommisionType.OwnOffice,
  commissionBy: "",
  commissionValue: 0,
  ftlValue: 0,
  branchType: BranchType.SelectBranch,
  agentId: 0,
  pincode: "",
  marketingPerson: "",
};

const defaultFormErrors = {
  name: "",
  stateId: "",
  branchCode: "",
  regionId: "",
  managerName: "",
  commissionBy: "",
  commissionValue: "",
  branchType: "",
  ftlValue: "",
  pincode: "",
};

const defaultRegionForm: RegionInterface = {
  region: "",
};

const defaultRegionFormErrors = {
  region: "",
};

// -------------------------------------------------------------------------------------------

const Branches = () => {
  const { setTitle } = useApp();
  const { handleLogout } = useAuth();
  const {
    getStates,
    getAllActiveAgents,
    getAllBranchess,
    getRegions,
    setAllBranches,
    setRegions,
  } = useApi();

  const [pinCodes, setPinCodes] = useState([""]);
  const [pinCodeErrors, setPinCodeErrors] = useState([""]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isFormDialogEditMode, setIsFormDialogEditMode] = useState(false);
  const [isFormDialogLoading, setIsFormDialogLoading] = useState(false);
  const [isFormSubBranchMode, setIsFormSubBranchMode] = useState(false);
  const [fallbackState, setFallbackState] =
    useState<FallbackStateType>("loading");
  const [Branches, _setBranches] = useState<BranchInterface[]>([]);
  const [userDetails, _setUserDetails] = useState<UserInterface | null>(null);
  const [states, _setStates] = useState<StateInterface[]>([]);
  const [allActiveAgents, _setAllActiveAgents] = useState<AgentInterface[]>([]);
  const [regions, _setRegions] = useState<RegionInterface[]>([]);
  const [formData, setFormData] = useState<BranchInterface>(defaultFormData);
  const [formErrors, setFormErrors] = useState(defaultFormErrors);
  const [alertDialog, setAlertDialog] = useState<AlertInterface>({
    state: "success",
    label: "",
    isActive: false,
  });
  const [isRegionFormDialogOpen, setRegionIsFormDialogOpen] = useState(false);
  const [regionFormLoading, setRegionFormLLoading] = useState(false);
  const [regionFormData, setRegionFormData] =
    useState<RegionInterface>(defaultRegionForm);
  const [regionFormError, setRegionFormError] = useState(defaultRegionForm);

  const theme = useTheme();
  const isDialogFullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    setTitle("Branches");
    initialFetch();
  }, [
    getStates,
    getAllActiveAgents,
    getAllBranchess,
    userDetails,
    getRegions,
    setTitle,
  ]);

  useEffect(() => {
    const updateWindowWidth = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", updateWindowWidth);
    return () => window.removeEventListener("resize", updateWindowWidth);
  }, []);

  const initialFetch = useCallback(async () => {
    const BranchesData = await getAllBranchess();
    const statesData = await getStates();
    const allActiveAgentsData = await getAllActiveAgents();
    const regionsData = await getRegions();

    if (
      statesData.length !== 0 &&
      allActiveAgentsData.length !== 0 &&
      regionsData.length !== 0
    ) {
      _setBranches(arrangeBranches(BranchesData));
      _setStates(statesData);
      _setAllActiveAgents([
        {
          agentId: 0,
          name: "No Agent",
          phoneNumber: "",
          rateType: "",
          rate: null,
          isActive: true,
        },
        ...allActiveAgentsData,
      ]);
      _setRegions(regionsData);
      setFallbackState("hidden");
    } else {
      setFallbackState("not-found");
    }

    if (BranchesData.length !== 0) {
      setFallbackState("hidden");
    } else {
      setFallbackState("not-found");
    }
  }, [getStates, getAllActiveAgents, getAllBranchess, getRegions, userDetails]);

  const handleOpenFormDialog = useCallback((data?: BranchInterface) => {
    setIsFormDialogOpen(true);
    if (data) {
      setFormData(data);
      setIsFormDialogEditMode(true);
      setPinCodes(data.pincode?.split(",") ?? []);
    }
  }, []);

  const handleCloseFormDialog = useCallback(() => {
    setIsFormDialogOpen(false);
    setFormData(defaultFormData);
    setFormErrors(defaultFormErrors);
    setIsFormDialogEditMode(false);
    setIsFormDialogLoading(false);
    handleCloseAlertDialog();
    setIsFormSubBranchMode(false);

    setPinCodes([""]);
    setPinCodeErrors([""]);
  }, []);

  const handleRegionFormDialogOpen = () => {
    setRegionIsFormDialogOpen(true);
  };

  const handleRegionFormDialogClose = () => {
    setRegionIsFormDialogOpen(false);
    setRegionFormData(defaultRegionForm);
    setRegionFormError(defaultRegionFormErrors);
  };

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
    setAlertDialog({ state: "success", label: "", isActive: false });
  }, []);

  const handleSubBranchFormOpen = (branch: BranchInterface) => {
    setFormData((prev) => ({
      ...prev,
      parentBranchId: branch.branchId as number,
      isSubBranch: true,
    }));
    setIsFormSubBranchMode(true);
    handleOpenFormDialog();
  };

  const handleSearch = async (keyword: string) => {
    const array = await getAllBranchess();
    if (!keyword || keyword.trim() === "") {
      _setBranches(arrangeBranches(array));
      return;
    }

    const regex = new RegExp(keyword.trim(), "i");

    const filteredBranches = array.filter((branch: BranchInterface) => {
      const name = branch.name || "";
      const address = branch.address || "";
      const phone = branch.phone || "";
      const email = branch.email || "";
      const managerName = branch.managerName || "";
      const managerPhone = branch.managerPhone || "";
      const managerEmail = branch.managerEmail || "";
      const commisionType = branch.commisionType || "";
      const commissionBy = branch.commissionBy || "";
      const commissionValue = branch.commissionValue!.toString() || "";
      const ftlValue = branch.ftlValue!.toString() || "";
      const branchCode = branch.branchCode || "";
      const transporterName = branch.transporterName || "";
      const transporterPhone = branch.transporterPhone || "";
      const marketingPerson = branch.marketingPerson || "";
      const stateId = branch.stateId
        ? findObjectInArray(states, "stateId", branch.stateId).state
        : "";
      const pincode = branch.pincode || "";

      return (
        regex.test(name) ||
        regex.test(address) ||
        regex.test(phone) ||
        regex.test(email) ||
        regex.test(managerName) ||
        regex.test(managerPhone) ||
        regex.test(managerEmail) ||
        regex.test(commisionType) ||
        regex.test(commissionBy) ||
        regex.test(commissionValue) ||
        regex.test(ftlValue) ||
        regex.test(branchCode) ||
        regex.test(transporterName) ||
        regex.test(transporterPhone) ||
        regex.test(marketingPerson) ||
        regex.test(stateId) ||
        regex.test(pincode)
      );
    });

    _setBranches(arrangeBranches(filteredBranches));
  };

  const validatePincode = useCallback((numbers: string[], length = 6) => {
    const errorsArray = numbers.map((number) => {
      if (!number) return "Pincode is required";
      if (number.length < length || number.length > length + 1)
        return `Pincode is invalid.`;
      return "";
    });
    return errorsArray;
  }, []);

  const validateBranch = useCallback(() => {
    let isValid = true;
    const errors = { ...defaultFormErrors };

    if (!formData.name) {
      errors.name = "Branch name is required.";
      isValid = false;
    }
    if (!formData.branchCode) {
      errors.branchCode = "Branch code is required.";
      isValid = false;
    }

    if (!formData.stateId) {
      errors.stateId = "State is required.";
      isValid = false;
    }

    if (!formData.regionId) {
      errors.regionId = "Region is required.";
      isValid = false;
    }

    if (!formData.managerName) {
      errors.managerName = "Manager name is required.";
      isValid = false;
    }

    if (formData.branchType === BranchType.SelectBranch) {
      errors.branchType = "Please select a valid branch type.";
      isValid = false;
    }

    if (formData.commisionType === "ON COMMISSION") {
      if (!formData.commissionBy) {
        errors.commissionBy = "Commission by is required.";
        isValid = false;
      }

      if (!formData.commissionValue) {
        errors.commissionValue = "Commission value is required.";
        isValid = false;
      }

      if (!formData.ftlValue) {
        errors.ftlValue = "FTL value is required.";
        isValid = false;
      }
    }

    const pincodeErrors = validatePincode(pinCodes);

    setPinCodeErrors(pincodeErrors);
	if (pincodeErrors.some(error => error !== "")) {
		isValid = false;
	  }

    setFormErrors(errors);
    return isValid;
  }, [formData, pinCodes, validatePincode]);

  const handleCreateBranch = useCallback(async () => {
    if (!validateBranch()) return;

    setIsFormDialogLoading(true);

    const data = {
      name: formData.name,
      branchCode: formData.branchCode,
      address: formData.address ? formData.address : null,
      stateId: formData.stateId,
      phone: formData.phone ? formData.phone : null,
      email: formData.email ? formData.email : null,
      managerName: formData.managerName ? formData.managerName : null,
      managerPhone: formData.managerPhone ? formData.managerPhone : null,
      managerEmail: formData.managerEmail ? formData.managerEmail : null,
      isActive: formData.isActive,
      commisionType: formData.commisionType,
      commissionBy: formData.commissionBy ? formData.commissionBy : null,
      commissionValue: formData.commissionValue?.toString(),
      ftlValue: formData.ftlValue?.toString(),
      isSubBranch: formData.isSubBranch,
      parentBranchId: formData.parentBranchId ? formData.parentBranchId : null,
      regionId: formData.regionId,
      transporterName: formData.transporterName
        ? formData.transporterName
        : null,
      transporterPhone: formData.transporterPhone
        ? formData.transporterPhone
        : null,
      branchType: formData.branchType ? formData.branchType : null,
      marketingPerson: formData.marketingPerson ? formData.marketingPerson : "",
      agentId: formData.agentId ? formData.agentId : 0,
      pincode: pinCodes.filter((pincode) => pincode).join(","),
    };

    try {
      const response = await createBranchAsync(data);
      if (
        response &&
        typeof response !== "boolean" &&
        response.data.status !== 401
      ) {
        if (response.data.status === 200) {
          const newBranch: BranchInterface = {
            ...formData,
            branchId: response.data.data, pincode: data.pincode,
          };

          setAllBranches((prev) => arrangeBranches([newBranch, ...prev]));

          handleCloseFormDialog();
          handleOpenAlertDialog("success", "Created new Branch.");
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
    validateBranch,
    pinCodes,
    handleCloseFormDialog,
    handleOpenAlertDialog,
    handleLogout,
  ]);

  const handleUpdateBranch = useCallback(async () => {
    if (!validateBranch()) return;

    setIsFormDialogLoading(true);

    const data = {
      branchId: formData.branchId,
      branchCode: formData.branchCode,
      name: formData.name,
      address: formData.address ? formData.address : null,
      stateId: formData.stateId,
      phone: formData.phone ? formData.phone : null,
      email: formData.email ? formData.email : null,
      managerName: formData.managerName ? formData.managerName : null,
      managerPhone: formData.managerPhone ? formData.managerPhone : null,
      managerEmail: formData.managerEmail ? formData.managerEmail : null,
      isActive: formData.isActive,
      commisionType: formData.commisionType,
      commissionBy: formData.commissionBy ? formData.commissionBy : null,
      commissionValue: formData.commissionValue?.toString(),
      ftlValue: formData.ftlValue?.toString(),
      isSubBranch: formData.isSubBranch,
      parentBranchId: formData.parentBranchId ? formData.parentBranchId : null,
      regionId: formData.regionId,
      transporterName: formData.transporterName
        ? formData.transporterName
        : null,
      transporterPhone: formData.transporterPhone
        ? formData.transporterPhone
        : null,
      branchType: formData.branchType ? formData.branchType : null,
      marketingPerson: formData.marketingPerson ? formData.marketingPerson : "",
      agentId: formData.agentId ? formData.agentId : 0,
      pincode: pinCodes.filter((pincode) => pincode).join(","),
    };

    try {
      const response = await updateBranchAsync(data);
      if (
        response &&
        typeof response !== "boolean" &&
        response.data.status !== 401
      ) {
        if (response.data.status === 200) {
          const updatedBranches: BranchInterface[] = Branches.map((branch) =>
            branch.branchId === formData.branchId ? { ...formData, pincode: data.pincode }: branch
          );

          setAllBranches(arrangeBranches(updatedBranches));

          handleCloseFormDialog();
          handleOpenAlertDialog("success", "Updated Branch.");
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
    validateBranch,
    pinCodes,
    handleCloseFormDialog,
    handleOpenAlertDialog,
    handleLogout,
    Branches,
  ]);

  const handleDeleteBranch = useCallback(
    async (branch: BranchInterface) => {
      if (userDetails && userDetails.branchId === branch.branchId) {
        handleOpenAlertDialog("error", "You can't delete your own branch.");
        return;
      }

      let parentBranch = () => {
        for (let i = 0; i < Branches.length; i++) {
          const thisBranch = Branches[i];
          if (thisBranch.branchId === branch.branchId) {
            return branch;
          }
        }
      };

      const branchToDelete = parentBranch();

      if (
        branchToDelete &&
        branchToDelete.subBranches &&
        branchToDelete.subBranches.length !== 0
      ) {
        handleOpenAlertDialog(
          "error",
          "To delete parent branch, first delete all sub-branches in it."
        );

        return;
      }

      const confirm = window.confirm(
        `Are you sure you want to delete branch '${branch.name}'?`
      );

      if (!confirm) return;

      try {
        const branchId = branch.branchId as number;

        const response = await deleteBranchAsync(branchId);
        if (
          response &&
          typeof response !== "boolean" &&
          response.data.status !== 401
        ) {
          if (response.data.status === 200) {
            setAllBranches((prev) => removeBranchById(prev, branchId));

            handleOpenAlertDialog("success", "Deleted Branch.");
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
    [Branches, handleLogout, handleOpenAlertDialog]
  );

  const validateRegionForm = (): boolean => {
    if (!regionFormData?.region) {
      setRegionFormError((prev) => ({
        ...prev,
        region: "Region is required.",
      }));
    } else {
      setRegionFormError((prev) => ({ ...prev, region: "" }));
    }

    if (regionFormData?.region !== "") {
      return true;
    } else {
      return false;
    }
  };

  const handleCreateRegion = useCallback(async () => {
    if (!validateRegionForm()) return;

    setRegionFormLLoading(true);
    try {
      const response = await createRegionAsync(regionFormData);

      if (
        response &&
        typeof response !== "boolean" &&
        response.data.status !== 401
      ) {
        if (response.data.status === 200) {
          const newRegion: RegionInterface = {
            ...regionFormData,
            regionId: response.data.data,
          };

          setRegions((prev) => [newRegion, ...prev]);

          handleRegionFormDialogClose();
          handleOpenAlertDialog("success", "Created new Region.");
        } else {
          handleOpenAlertDialog("warning", response.data.data);
        }
      } else {
        handleLogout();
      }
    } catch (error) {
      handleLogout();
    } finally {
      setRegionFormLLoading(false);
    }
  }, [
    regionFormData,
    validateBranch,
    handleCloseFormDialog,
    handleOpenAlertDialog,
    handleLogout,
  ]);

  const branchTypeMap: Record<BranchType, string> = {
    [BranchType.SelectBranch]: "Select Branch",
    [BranchType.BookingBranch]: "Booking",
    [BranchType.DeliveryBranch]: "Delivery",
    [BranchType.Both]: "Both",
  };

  const columns = useMemo<MRT_ColumnDef<BranchInterface>[]>(
    () => [
      {
        accessorKey: "id",
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
                <Tooltip title="Active Branch">
                  <Chip icon={<Done />} color="success" />
                </Tooltip>
              ) : (
                <Tooltip title="Disabled Branch">
                  <Chip icon={<Clear />} color="error" />
                </Tooltip>
              )}
              {row.original.reverseIndex}
            </div>
          </>
        ),
      },
      {
        accessorKey: "name",
        header: "Branch Name",
        enableResizing: true,
        size: 180,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
      },
      {
        accessorKey: "branchType",
        header: "Branch Type",
        enableResizing: true,
        size: 150,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
        accessorFn: (row) => branchTypeMap[row.branchType],
      },
	  {
		accessorKey: "pincode",
		header: "Pincode",
		enableResizing: true,
		size: 150,
		muiTableHeadCellProps: { align: "left" },
		muiTableBodyCellProps: { align: "left" },
		muiTableFooterCellProps: { align: "left" },
		Cell: ({ cell }) => {
		  const pincodes = cell.getValue<string>().split(",");
		  return (
			<div>
			  {pincodes.map((pincode, index) => (
				<div key={index}>{pincode}</div>
			  ))}
			</div>
		  );
		},
	  },
      {
        accessorKey: "regionId",
        header: "Region",
        enableResizing: true,
        size: 150,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
        accessorFn: (row) =>
          `${
            findObjectInArray(regions, "regionId", row.regionId)?.region || "—"
          }`,
      },
      {
        accessorKey: "branchCode",
        header: "Branch Code",
        enableResizing: true,
        size: 150,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
        accessorFn: (row) => row.branchCode || "—",
      },
      {
        accessorKey: "actions",
        header: "Actions",
        enableResizing: false,
        enableColumnFilter: false,
        enableSorting: false,
        size: 120,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        muiTableFooterCellProps: { align: "right" },
        Cell: ({ row }) => (
          <>
            <Tooltip title="Delete Branch">
              <IconButton onClick={() => handleDeleteBranch(row.original)}>
                <DeleteOutline />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Branch">
              <IconButton onClick={() => handleOpenFormDialog(row.original)}>
                <EditOutlined />
              </IconButton>
            </Tooltip>
            {row.original.subBranches && !row.original.parentBranchId && (
              <Tooltip title="Add Sub-Branch">
                <IconButton
                  onClick={() => handleSubBranchFormOpen(row.original)}
                >
                  <AddBoxOutlined />
                </IconButton>
              </Tooltip>
            )}
          </>
        ),
      },
    ],
    [handleDeleteBranch, handleOpenFormDialog, states, regions]
  );

  const table = useMaterialReactTable({
    columns,
    data: Branches,
    filterFromLeafRows: true,
    paginateExpandedRows: false,
    enableColumnResizing: true,
    enablePagination: true,
    layoutMode: "grid",
    enableDensityToggle: false,
    initialState: {
      pagination: { pageSize: 100, pageIndex: 0 },
      density: "compact",
      sorting: [{ id: "name", desc: false }],
    },

    muiPaginationProps: { rowsPerPageOptions: [100, 200, 500, 1000] },
    muiTablePaperProps: {
      sx: {
        borderRadius: "var(--shape-medium)",
        boxShadow: "var(--elevation-extra-small)",
      },
    },
    muiTableHeadCellProps: {
      sx: {
        "&:first-of-type": {
          width: 30,
          minWidth: 30,
          maxWidth: 30,
          paddingLeft: 0,
          paddingRight: 0,
        },
      },
    },
    muiTableBodyCellProps: {
      sx: {
        paddingTop: 0,
        paddingBottom: 0,
        "&:first-of-type": {
          width: 30,
          minWidth: 30,
          maxWidth: 30,
          paddingLeft: 0,
          paddingRight: 0,
        },
      },
    },
    enableExpandAll: true,
    enableExpanding: true,
    getSubRows: (row) => row.subBranches,
  });

  return (
    <>
      <div data-component="branches" className="container">
        <div data-component="branches" className="top">
          <Search
            onChange={handleSearch}
            isDisabled={fallbackState !== "hidden"}
          />
          {windowWidth > 600 && (
            <Tooltip title="Create New Branch">
              <Fab
                variant="extended"
                color="primary"
                data-component="branches"
                className="fab"
                onClick={() => handleOpenFormDialog()}
              >
                <AddOutlined />
                Create new
              </Fab>
            </Tooltip>
          )}
        </div>
        <div data-component="branches" className="bottom">
          {fallbackState !== "hidden" ? (
            <Fallback state={fallbackState} />
          ) : (
            <div data-component="branches" className="table-container">
              <MaterialReactTable table={table} />
            </div>
          )}
        </div>
      </div>

      {windowWidth < 600 && (
        <div data-component="branches" className="fab-container">
          <Tooltip title="Create New Branch">
            <Fab
              variant="extended"
              color="primary"
              data-component="branches"
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
        data-component="branches"
        className="dialog"
      >
        <DialogTitle data-component="branches" className="dialog-title">
          {!isFormSubBranchMode
            ? !isFormDialogEditMode
              ? "Add New Branch"
              : "Edit Branch"
            : !isFormDialogEditMode
            ? "Add New Sub-Branch"
            : "Edit Sub-Branch"}
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
        <DialogContent data-component="branches" className="dialog-content">
          <div data-component="branches" className="container">
            <div data-component="branches" className="columns-3">
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
                error={formErrors.name ? true : false}
              >
                <InputLabel htmlFor="branch-name">Branch name</InputLabel>
                <OutlinedInput
                  label="Branch name"
                  id="branch-name"
                  type="text"
                  value={formData?.name ? formData?.name : ""}
                  name="name"
                  onChange={handleChange}
                />
                {formErrors.name && (
                  <FormHelperText error>{formErrors.name}</FormHelperText>
                )}
              </FormControl>
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
                error={formErrors.stateId ? true : false}
              >
                <InputLabel>State</InputLabel>
                <Select
                  label="State"
                  value={formData?.stateId ? formData?.stateId : ""}
                  name="stateId"
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      stateId: e.target.value as number,
                    }));
                  }}
                >
                  {states.map((state) => {
                    return (
                      <MenuItem
                        key={`state-${state.stateId}`}
                        value={state.stateId}
                      >
                        {state.state}
                      </MenuItem>
                    );
                  })}
                </Select>
                {formErrors.stateId && (
                  <FormHelperText error>{formErrors.stateId}</FormHelperText>
                )}
              </FormControl>
              <div data-component="branches" className="region-input">
                <FormControl
                  variant="outlined"
                  fullWidth
                  disabled={isFormDialogLoading}
                  error={formErrors.regionId ? true : false}
                >
                  <InputLabel>Region</InputLabel>
                  <Select
                    label="Region"
                    value={formData.regionId ? formData.regionId : ""}
                    onChange={(event: any) => {
                      setFormData((prev) => ({
                        ...prev,
                        regionId: +event.target.value as number,
                      }));
                    }}
                  >
                    {regions.map((region) => {
                      return (
                        <MenuItem key={region.regionId} value={region.regionId}>
                          {region.region}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  {formErrors.regionId && (
                    <FormHelperText error>{formErrors.regionId}</FormHelperText>
                  )}
                </FormControl>
                <Button
                  disabled={isFormDialogLoading}
                  className="add-region-button"
                  onClick={handleRegionFormDialogOpen}
                >
                  Add region
                </Button>
              </div>
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
              >
                <InputLabel htmlFor="branch-address">Branch Address</InputLabel>
                <OutlinedInput
                  multiline
                  rows={4}
                  label="Branch Address"
                  id="branch-address"
                  type="text"
                  value={formData?.address ? formData?.address : ""}
                  name="address"
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
                error={formErrors.branchType ? true : false}
              >
                <InputLabel>Branch Type</InputLabel>
                <Select
                  label="Branch Type"
                  value={formData?.branchType}
                  name="branchType"
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      branchType: e.target.value as BranchType,
                    }));
                  }}
                >
                  <MenuItem value={BranchType.SelectBranch}>
                    Select Branch
                  </MenuItem>
                  <MenuItem value={BranchType.BookingBranch}>Booking</MenuItem>
                  <MenuItem value={BranchType.DeliveryBranch}>
                    Delivery
                  </MenuItem>
                  <MenuItem value={BranchType.Both}>Both</MenuItem>
                </Select>
                {formErrors.branchType && (
                  <FormHelperText error>{formErrors.branchType}</FormHelperText>
                )}
              </FormControl>
            </div>

            <div data-component="branches" className="columns-3">
              {pinCodes.map((number, index) => (
                <div
                  key={`pincode-${index}`}
                  data-component="branches"
                  className="input-container"
                >
                  <FormControl
                    size="medium"
                    disabled={isFormDialogLoading}
                    variant="outlined"
                    fullWidth
                    error={!!pinCodeErrors[index]}
                  >
                    <InputLabel htmlFor="pincode">Pincode</InputLabel>
                    <OutlinedInput
                      label="Pincode"
                      id="pincode"
                      type="number"
                      value={number}
                      name="pincode"
                      onChange={(e) => {
                        const array = [...pinCodes];
                        array[index] = e.target.value;
                        setPinCodes(array);
                      }}
                      endAdornment={
                        pinCodes.length === 1 ? null : (
                          <Tooltip title="Remove">
                            <IconButton
                              edge="end"
                              onClick={() => {
                                const array = [...pinCodes];
                                array.splice(index, 1);
                                setPinCodes(array);
                                const errorsArray = [...pinCodeErrors];
                                errorsArray.splice(index, 1);
                                setPinCodeErrors(errorsArray);
                              }}
                            >
                              <Close />
                            </IconButton>
                          </Tooltip>
                        )
                      }
                    />
                    {pinCodeErrors[index] && (
                      <FormHelperText error>
                        {pinCodeErrors[index]}
                      </FormHelperText>
                    )}
                  </FormControl>
                  {pinCodes.length === index + 1 && (
                    <Tooltip title="Add">
                      <IconButton data-component="branches"
					  className="pin-add-button"
					  disabled={pinCodes.length === 10} onClick={() => {
						  if(pinCodes.length !== 10 && !pinCodeErrors[index]) {
							  setPinCodes((prev) => [...prev, '']);
							  setPinCodeErrors((prev) => [...prev, '']);
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
                error={formErrors.branchCode ? true : false}
              >
                <InputLabel htmlFor="branchCode">Branch Code</InputLabel>
                <OutlinedInput
                  inputProps={{ maxLength: 4 }}
                  label="Branch name"
                  id="branchCode"
                  type="text"
                  value={
                    formData?.branchCode
                      ? formData?.branchCode.toUpperCase()
                      : ""
                  }
                  name="branchCode"
                  onChange={handleChange}
                />
                {formErrors.branchCode && (
                  <FormHelperText error>{formErrors.branchCode}</FormHelperText>
                )}
              </FormControl>
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
              >
                <InputLabel htmlFor="branch-phone">
                  Branch Phone Number
                </InputLabel>
                <OutlinedInput
                  label="Branch Phone Number"
                  id="branch-phone"
                  type="number"
                  value={formData?.phone ? formData?.phone : ""}
                  name="phone"
                  onChange={handleChange}
                />
              </FormControl>
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
              >
                <InputLabel htmlFor="branch-email">Branch Email</InputLabel>
                <OutlinedInput
                  label="Branch Email "
                  id="branch-email"
                  type="email"
                  value={formData?.email ? formData?.email : ""}
                  name="email"
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
              >
                <InputLabel htmlFor="manager-phone-number">
                  Manager Phone Number
                </InputLabel>
                <OutlinedInput
                  label="Manager Phone Number"
                  id="manager-phone-number"
                  type="number"
                  value={formData?.managerPhone}
                  name="managerPhone"
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
              >
                <InputLabel htmlFor="marketingPerson">
                  Marketing Person
                </InputLabel>
                <OutlinedInput
                  label="Marketing Person"
                  id="marketingPerson"
                  type="text"
                  value={
                    formData?.marketingPerson ? formData?.marketingPerson : ""
                  }
                  name="marketingPerson"
                  onChange={handleChange}
                />
              </FormControl>
            </div>
            <div data-component="branches" className="columns-3">
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
                error={formErrors.managerName ? true : false}
              >
                <InputLabel htmlFor="manager-name">Manager Name</InputLabel>
                <OutlinedInput
                  label="Manager Name"
                  id="manager-name"
                  type="text"
                  value={formData?.managerName ? formData?.managerName : ""}
                  name="managerName"
                  onChange={handleChange}
                />
                {formErrors.managerName && (
                  <FormHelperText error>
                    {formErrors.managerName}
                  </FormHelperText>
                )}
              </FormControl>
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
              >
                <InputLabel htmlFor="manager-email">Manager Email</InputLabel>
                <OutlinedInput
                  label="Manager Email "
                  id="manager-email"
                  type="email"
                  value={formData?.managerEmail ? formData?.managerEmail : ""}
                  name="managerEmail"
                  onChange={handleChange}
                />
              </FormControl>
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
              >
                <InputLabel htmlFor="transporter-name">
                  Transporter Name
                </InputLabel>
                <OutlinedInput
                  label="Transporter Name"
                  id="transporter-name"
                  type="text"
                  value={
                    formData?.transporterName ? formData?.transporterName : ""
                  }
                  name="transporterName"
                  onChange={handleChange}
                />
              </FormControl>
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
              >
                <InputLabel htmlFor="transporter-phone">
                  Transporter Phone
                </InputLabel>
                <OutlinedInput
                  label="Transporter Phone"
                  id="transporter-phone"
                  type="number"
                  value={
                    formData?.transporterPhone ? formData?.transporterPhone : ""
                  }
                  name="transporterPhone"
                  onChange={handleChange}
                />
              </FormControl>
              <FormControl
                variant="outlined"
                fullWidth
                disabled={isFormDialogLoading}
              >
                <InputLabel>Agent</InputLabel>
                <Select
                  label="Agent"
                  value={formData.agentId ? formData.agentId : 0}
                  onChange={(event: any) => {
                    setFormData((prev) => ({
                      ...prev,
                      agentId: +event.target.value as number,
                    }));
                  }}
                >
                  {allActiveAgents.map((agent) => {
                    return (
                      <MenuItem key={agent.agentId} value={agent.agentId}>
                        {agent.name}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
              >
                <InputLabel>Commission Type</InputLabel>
                <Select
                  label="Commission Type"
                  value={formData?.commisionType}
                  name="commisionType"
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      commisionType: e.target.value as CommisionType,
                    }));
                  }}
                >
                  <MenuItem value={CommisionType.OwnOffice}>
                    Own office
                  </MenuItem>
                  <MenuItem value={CommisionType.OnCommission}>
                    On commission
                  </MenuItem>
                </Select>
              </FormControl>
              {formData.commisionType === CommisionType.OnCommission && (
                <>
                  <div data-component="branches" className="container">
                    <div data-component="branches" className="columns-2">
                      <FormControl
                        size="medium"
                        disabled={isFormDialogLoading}
                        variant="outlined"
                        fullWidth
                        error={formErrors.commissionBy ? true : false}
                      >
                        <InputLabel>Commission By</InputLabel>
                        <Select
                          label="Commission By"
                          value={formData?.commissionBy}
                          name="commissionBy"
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              commissionBy: e.target.value as
                                | "ARTICLE"
                                | "WEIGHT"
                                | "VASULI",
                            }));
                          }}
                        >
                          <MenuItem value="ARTICLE">By article</MenuItem>
                          <MenuItem value="WEIGHT">By weight</MenuItem>
                          <MenuItem value="VASULI">By vasuli</MenuItem>
                        </Select>
                        {formErrors.commissionBy && (
                          <FormHelperText error>
                            {formErrors.commissionBy}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </div>
                    <div data-component="branches" className="columns-2">
                      <FormControl
                        size="medium"
                        disabled={isFormDialogLoading}
                        variant="outlined"
                        fullWidth
                        error={formErrors.commissionValue ? true : false}
                      >
                        <InputLabel htmlFor="commissionValue">
                          Commission Value
                        </InputLabel>
                        <OutlinedInput
                          label="Commission Value"
                          id="commissionValue"
                          type="number"
                          value={formData?.commissionValue}
                          name="commissionValue"
                          onChange={handleChange}
                          startAdornment={
                            (formData?.commissionBy === "ARTICLE" ||
                              formData?.commissionBy === "WEIGHT") && (
                              <CurrencyRupeeOutlined />
                            )
                          }
                          endAdornment={
                            formData?.commissionBy === "VASULI" && (
                              <PercentOutlined />
                            )
                          }
                        />
                        {formErrors.commissionValue && (
                          <FormHelperText error>
                            {formErrors.commissionValue}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </div>
                  </div>
                  <FormControl
                    size="medium"
                    disabled={isFormDialogLoading}
                    variant="outlined"
                    fullWidth
                    error={formErrors.ftlValue ? true : false}
                  >
                    <InputLabel htmlFor="ftl">FTL</InputLabel>
                    <OutlinedInput
                      label="FTL "
                      id="ftl"
                      type="number"
                      value={formData.ftlValue ? formData.ftlValue : ""}
                      name="ftlValue"
                      onChange={handleChange}
                      startAdornment={<CurrencyRupeeOutlined />}
                    />
                    {formErrors.ftlValue && (
                      <FormHelperText error>
                        {formErrors.ftlValue}
                      </FormHelperText>
                    )}
                  </FormControl>
                </>
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormDialog}>Close</Button>
          <LoadingButton
            color="primary"
            onClick={
              !isFormDialogEditMode ? handleCreateBranch : handleUpdateBranch
            }
            loading={isFormDialogLoading}
            type="submit"
          >
            Save
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isRegionFormDialogOpen}
        onClose={handleRegionFormDialogClose}
        data-component="branches"
        className="dialog"
        fullWidth={true}
      >
        <DialogTitle>Add new region</DialogTitle>
        <DialogContent data-component="branches" className="dialog-content">
          <FormControl
            size="medium"
            disabled={regionFormLoading}
            variant="outlined"
            fullWidth
            error={regionFormError.region ? true : false}
          >
            <InputLabel htmlFor="region">Region</InputLabel>
            <OutlinedInput
              label="Region"
              id="region"
              type="text"
              value={regionFormData?.region ? regionFormData?.region : ""}
              name="region"
              onChange={(e) => {
                setRegionFormData((prev) => ({
                  ...prev,
                  region: e.target.value,
                }));
              }}
            />
            {regionFormError.region && (
              <FormHelperText error>{regionFormError.region}</FormHelperText>
            )}
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            data-component="branches"
            className="text-button"
            onClick={handleRegionFormDialogClose}
            disabled={regionFormLoading}
          >
            Cancel
          </Button>
          <LoadingButton
            data-component="branches"
            className="text-button"
            color="primary"
            onClick={handleCreateRegion}
            loading={regionFormLoading}
            type="submit"
          >
            Save
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Alert {...alertDialog} onClose={handleCloseAlertDialog} />
    </>
  );
};

// -------------------------------------------------------------------------------------------

export default Branches;

// -------------------------------------------------------------------------------------------
