// -------------------------------------------------------------------------------------------

import "./GdmSequence.scss";

import {
  MaterialReactTable,
  MRT_ColumnDef,
  useMaterialReactTable,
} from "material-react-table";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { AddOutlined, EditOutlined } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
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
} from "@mui/material";

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
import {
  BranchInterface,
  RegionInterface,
} from "../../../services/branch/branch.types";

import {
  createBranchLdmNumberAsync,
  updateBranchLdmAsync,
} from "../../../services/branchLdmNumber/branchLDMNumber";
import {
  BillTypeInterface,
  BranchLrNumberInterface,
} from "../../../services/branchLrNumber/branchLrNumber.types";
import { UserInterface } from "../../../services/user/user.types";
import addIndex from "../../../utils/addIndex";
import findObjectInArray from "../../../utils/findObjectInArray";

// -------------------------------------------------------------------------------------------

const defaultFormData: BranchLrNumberInterface = {
  branchId: 0,
  toBranchId: 0,
  regionId: 0,
  billTypeId: 1,
  minRange: 0,
  maxRange: 0,
  nextValue: 0,
};

const defaultFormErrors = {
  branchId: "",
  toBranchId: "",
  regionId: "",
  billTypeId: "",
  minRange: "",
  maxRange: "",
  nextValue: "",
};

// -------------------------------------------------------------------------------------------

const LDMSequence = memo(() => {
  const { setTitle } = useApp();
  const { handleLogout } = useAuth();
  const {
        getAllBranchLdmSequences,
    getBookingBranches,
    getRegions,
    getBillTypes,
	getAllBranchess,
    getAllActiveBookingBranches,
    getUserDetails,
       setAllBranchLdmSequences,
  } = useApi();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [isAllBranchess, _setAllBranches] = useState<BranchInterface[]>([]);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isFormDialogEditMode, setIsFormDialogEditMode] = useState(false);
  const [isFormDialogLoading, setIsFormDialogLoading] = useState(false);
  const [fallbackState, setFallbackState] =
    useState<FallbackStateType>("loading");
  const [allBranchLRNumbers, _setAllBranchLdmSequences] = useState<
    BranchLrNumberInterface[]
  >([]);
  const [bookingBranches, _setBookingBranches] = useState<BranchInterface[]>(
    []
  );
  const [activeBookingBranches, _setActiveBookingBranches] = useState<
    BranchInterface[]
  >([]);
  const [regions, _setRegions] = useState<RegionInterface[]>([]);
  const [billTypes, _setBillTypes] = useState<BillTypeInterface[]>([]);
  const [user, _setUser] = useState<UserInterface>();
  const [formData, setFormData] =
    useState<BranchLrNumberInterface>(defaultFormData);
  const [formErrors, setFormErrors] = useState(defaultFormErrors);
  const [alertDialog, setAlertDialog] = useState<AlertInterface>({
    state: "success",
    label: "",
    isActive: false,
  });
  const [isFormEditWhileCreationMode, setIsFormEditWhileCreationMode] =
    useState(false);

  const theme = useTheme();
  const isDialogFullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    setTitle("LDM Sequence");
    initialFetch();
  }, [getAllBranchLdmSequences, setTitle]);

  useEffect(() => {
    const updateWindowWidth = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", updateWindowWidth);
    return () => window.removeEventListener("resize", updateWindowWidth);
  }, []);

  useEffect(() => {
    for (const branchLRNumber of allBranchLRNumbers) {
      if (!isFormDialogEditMode) {
        if (
          branchLRNumber.branchId === formData.branchId &&
          branchLRNumber.regionId === formData.regionId &&
		            branchLRNumber.billTypeId === formData.billTypeId
        ) {
          setIsFormEditWhileCreationMode(true);
		  setFormData(prev => ({
			...prev,
					  }));
          setFormData(() => ({
            ...branchLRNumber,
          }));
          setFormErrors(defaultFormErrors);
          return;
        } else {
          setIsFormEditWhileCreationMode(false);
          setFormData((prev) => ({
            ...prev,
            minRange: 0,
			toBranchId: 0,
            maxRange: 0,
            nextValue: 0,
          }));
        }
      }
    }
  }, [formData.branchId, formData.regionId, formData.billTypeId]);

  useEffect(() => {
	setFormData(prev => ({
	  ...prev,
	  
	}));
  }, [formData.regionId]);

  const initialFetch = useCallback(async () => {
    const allBranchLRNumbersData = await getAllBranchLdmSequences();
    const bookingBranchesData = await getBookingBranches();
    const activeBookingBranchesData = await getAllActiveBookingBranches();
    const regionsData = await getRegions();
    const billTypesData = await getBillTypes();
    const userData = await getUserDetails();
	const allBranchessData = await getAllBranchess();

    if (
      bookingBranchesData.length !== 0 &&
      activeBookingBranchesData.length !== 0 &&
      regionsData.length !== 0 &&
      billTypesData.length !== 0 &&
      userData
    ) {
      _setAllBranchLdmSequences(allBranchLRNumbersData);
      _setBookingBranches(bookingBranchesData);
      _setActiveBookingBranches(activeBookingBranchesData);
      _setRegions(regionsData);
      _setBillTypes(billTypesData);

	  _setAllBranches(allBranchessData);
      _setUser(userData);
      setFallbackState("hidden");
    } else {
      setFallbackState("not-found");
    }

    if (allBranchLRNumbersData.length !== 0) {
      setFallbackState("hidden");
    } else {
      setFallbackState("not-found");
    }
  }, [getAllBranchLdmSequences]);

  const handleOpenFormDialog = useCallback((data?: BranchLrNumberInterface) => {
    setIsFormDialogOpen(true);
    if (data) {
		setFormData({
			...data,toBranchId: data.toBranchId 
					  });
      setIsFormDialogEditMode(true);
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

  const handleOpenAlertDialog = useCallback(
    (state: AlertStates, label: string) => {
      setAlertDialog({ state, label, isActive: true });
    },
    []
  );

  const handleCloseAlertDialog = useCallback(() => {
    setAlertDialog({ state: "success", label: "", isActive: false });
  }, []);

  const handleSearch = async (keyword: string) => {
    const array = await getAllBranchLdmSequences();
    if (!keyword || keyword.trim() === "") {
      _setAllBranchLdmSequences(array);
      return;
    }

    const regex = new RegExp(keyword.trim(), "i");

    const filteredSequences = array.filter(
      (sequence: BranchLrNumberInterface) => {
        const branchName = sequence.branchId
          ? findObjectInArray(bookingBranches, "branchId", sequence.branchId)
              .name
          : "";
        const regionName = sequence.regionId
          ? findObjectInArray(regions, "regionId", sequence.regionId).region
          : "";
		  const destinationBranchName = sequence.toBranchId
      ? findObjectInArray(isAllBranchess, "branchId", sequence.toBranchId).name
      : "";
        const minRange = sequence.minRange?.toString() || "";
        const maxRange = sequence.maxRange?.toString() || "";
        const nextValue = sequence.nextValue?.toString() || "";

        return (
          regex.test(branchName) ||
          regex.test(regionName) ||
		  regex.test(destinationBranchName) ||
          regex.test(minRange) ||
          regex.test(maxRange) ||
          regex.test(nextValue)
        );
      }
    );

    _setAllBranchLdmSequences(addIndex.addIndex1(filteredSequences));
  };

  const validateLdmSequence = useCallback((): boolean => {
    if (!formData.branchId) {
      setFormErrors((prev) => ({
        ...prev,
        branchId: "Booking Branch is required.",
      }));
    } else {
      setFormErrors((prev) => ({ ...prev, branchId: "" }));
    }


	if (formData.toBranchId === undefined) {
		setFormErrors((prev) => ({
		  ...prev,
		  toBranchId: "Destination Branch is required.",
		}));
	  } else {
		setFormErrors((prev) => ({ ...prev, toBranchId: "" }));
	  }

    if (!formData.regionId) {
      setFormErrors((prev) => ({
        ...prev,
        regionId: "Destination Region is required.",
      }));
    } else {
      setFormErrors((prev) => ({ ...prev, regionId: "" }));
    }


    if (user && user.displayEstimate) {
      if (!formData.billTypeId) {
        setFormErrors((prev) => ({
          ...prev,
          billTypeId: "Bill Type is required.",
        }));
      } else {
        setFormErrors((prev) => ({ ...prev, billTypeId: "" }));
      }
    }

    if (!formData.minRange) {
      setFormErrors((prev) => ({
        ...prev,
        minRange: "Minimum Range is required.",
      }));
    } else {
      setFormErrors((prev) => ({ ...prev, minRange: "" }));
    }

    if (!formData.maxRange) {
      setFormErrors((prev) => ({
        ...prev,
        maxRange: "Maximum Range is required.",
      }));
    } else if (
      formData.minRange &&
      formData.maxRange &&
      formData.minRange >= formData.maxRange
    ) {
      setFormErrors((prev) => ({
        ...prev,
        maxRange: "Maximum Range must be greater than minimum range.",
      }));
    } else {
      setFormErrors((prev) => ({ ...prev, maxRange: "" }));
    }

    if (!formData.nextValue) {
      setFormErrors((prev) => ({
        ...prev,
        nextValue: "Next Value is required.",
      }));
    } else if (
      formData.minRange &&
      formData.maxRange &&
      (formData.nextValue < formData.minRange ||
        formData.nextValue > formData.maxRange)
    ) {
      setFormErrors((prev) => ({
        ...prev,
        nextValue: "Next Value must be between minimum and maximum range.",
      }));
    } else {
      setFormErrors((prev) => ({ ...prev, nextValue: "" }));
    }

    if (
      formData.branchId &&
      formData.branchId !== 0 &&
      formData.regionId &&
      formData.regionId !== 0 &&
      formData.minRange &&
      formData.minRange !== 0 &&
      formData.maxRange &&
      formData.maxRange !== 0 &&
      formData.nextValue &&
      formData.nextValue !== 0 &&
      formData.nextValue >= formData.minRange &&
      formData.nextValue <= formData.maxRange
    ) {
      if (user && user.displayEstimate) {
        return true;
        // if (formData.billTypeId && formData.billTypeId !== 0) {
        // 	return true;
        // } else {
        // 	return false;
        // }
      } else {
        return true;
      }
    } else {
      return false;
    }
  }, [formData]);



  const getFilteredDestinationBranches = useCallback(() => {
	return formData.regionId
	  ? isAllBranchess.filter(branch => branch.regionId === formData.regionId)
	  : isAllBranchess;
  }, [formData.regionId, isAllBranchess]);




  const handleCreateLdmSequence = useCallback(async () => {
    if (!validateLdmSequence()) return;

	const data = { 
		...formData
	  };
	  console.log(' LDM Sequence with data:', data);

    setIsFormDialogLoading(true);
    try {
      const response = await createBranchLdmNumberAsync(data);
      console.log('API response:', response);
      if (
        response &&
        typeof response !== "boolean" &&
        response.data.status !== 401
      ) {
        if (response.data.status === 200) {
          const newLdmSequence: BranchLrNumberInterface = {
            ...formData,
            id: response.data.data,
          };
          setAllBranchLdmSequences((prev) =>
            addIndex.addIndex1([newLdmSequence, ...prev])
          );
          handleCloseFormDialog();
          handleOpenAlertDialog("success", "Created new LDM Sequence.");
        } else {
          handleOpenAlertDialog("warning", response.data.data);
        }
      } else {
        handleLogout();
      }
    } catch (error) {
      console.log(error);
      handleLogout();
    } finally {
      setIsFormDialogLoading(false);
    }
  }, [
    formData,
    validateLdmSequence,
    handleCloseFormDialog,
    handleOpenAlertDialog,
    handleLogout,
    setAllBranchLdmSequences,
  ]);

  const handleUpdateLdmSequence = useCallback(async () => {
    if (!validateLdmSequence()) return;

	const data = { 
		...formData  
			  };

	  
	  console.log('Updating LDM Sequence with data:', data);

    setIsFormDialogLoading(true);
    try {
      const response = await updateBranchLdmAsync(data);
      console.log('API response:', response);
      if (
        response &&
        typeof response !== "boolean" &&
        response.data.status !== 401
      ) {
        if (response.data.status === 200) {
          const updatedLrSequences = allBranchLRNumbers.map((obj) =>
            obj.id === formData.id ? { ...obj, ...data } : obj
          );

          setAllBranchLdmSequences(addIndex.addIndex1(updatedLrSequences));
          handleCloseFormDialog();
          handleOpenAlertDialog("success", "Updated LR Sequence.");
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
    validateLdmSequence,
    handleCloseFormDialog,
    handleOpenAlertDialog,
    handleLogout,
    allBranchLRNumbers,
    setAllBranchLdmSequences,
  ]);

  const columnsWithBillType = useMemo<MRT_ColumnDef<BranchLrNumberInterface>[]>(
    () => [
      {
        accessorKey: "index",
        header: "#",
        enableResizing: false,
        size: 80,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
        enableSorting: true,
        
      },
      {
        accessorKey: "branchId",
        header: "Booking Branch",
        enableResizing: true,
        size: 80,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
        enableSorting: true,
        accessorFn: (row) =>
          `${
            findObjectInArray(bookingBranches, "branchId", row.branchId).name
          }`,
      },
      {
        accessorKey: "regionId",
        header: "Destination Branch",
        enableResizing: true,
        size: 80,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
        accessorFn: (row) =>
          `${findObjectInArray(regions, "regionId", row.regionId).region}`,
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
            findObjectInArray(billTypes, "billTypeId", row.billTypeId).billType 
          }`,
      },
      {
        accessorKey: "minRange",
        header: "Min. Range",
        enableResizing: true,
        size: 80,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
      },
      {
        accessorKey: "maxRange",
        header: "Max. Range",
        enableResizing: true,
        size: 80,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
      },
      {
        accessorKey: "nextValue",
        header: "Next Value",
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
        size: 100,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        muiTableFooterCellProps: { align: "right" },
        Cell: ({ row }) => (
          <>
            <Tooltip title="Edit LR Sequence">
              <IconButton onClick={() => handleOpenFormDialog(row.original)}>
                <EditOutlined />
              </IconButton>
            </Tooltip>
          </>
        ),
      },
    ],
    [handleOpenFormDialog, bookingBranches, regions, billTypes, user]
  );

  const columnsWithoutBillType = useMemo<
    MRT_ColumnDef<BranchLrNumberInterface>[]
  >(
    () => [
      {
        accessorKey: "index",
        header: "#",
        enableResizing: false,
        size: 80,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
        enableSorting: true,
      },
      {
        accessorKey: "branchId",
        header: "Booking Branch",
        enableResizing: true,
        size: 80,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
        enableSorting: true,
        accessorFn: (row) => {
          const branchName = findObjectInArray(bookingBranches, "branchId", row.branchId).name || "Unknown";
          return branchName;
        },
      },
      {
        accessorKey: "regionId",
        header: "Destination Branch",
        enableResizing: true,
        size: 80,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
        accessorFn: (row) =>
          `${findObjectInArray(regions, "regionId", row.regionId).region}`,
      },
      {
        accessorKey: "minRange",
        header: "Min. Range",
        enableResizing: true,
        size: 80,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
      },
      {
        accessorKey: "maxRange",
        header: "Max. Range",
        enableResizing: true,
        size: 80,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
      },
      {
        accessorKey: "nextValue",
        header: "Next Value",
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
        size: 100,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        muiTableFooterCellProps: { align: "right" },
        Cell: ({ row }) => (
          <>
            <Tooltip title="Edit LDM Sequence">
              <IconButton onClick={() => handleOpenFormDialog(row.original)}>
                <EditOutlined />
              </IconButton>
            </Tooltip>
          </>
        ),
      },
    ],
    [handleOpenFormDialog, bookingBranches, regions, billTypes, user]
  );

  const table = useMaterialReactTable({
    columns: user?.displayEstimate
      ? columnsWithBillType
      : columnsWithoutBillType,
      data: allBranchLRNumbers,
    filterFromLeafRows: true,
    paginateExpandedRows: false,
    enableColumnResizing: true,
    enablePagination: true,
    layoutMode: "grid",
    enableDensityToggle: false,
    enableMultiSort: true,
  isMultiSortEvent: () => true,
     initialState: {
      pagination: { pageSize: 100, pageIndex: 0 },
      
      density: "compact",
      sorting: [
        {
          id: 'index',
          desc: false,
        },
           
      ],
      
      
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

  const onEnterFocusNext = (event: any, elementId: string) => {
    if (event.key === "Enter" || (event.key === "Tab" && elementId)) {
      event.preventDefault();
      document.getElementById(elementId)?.focus();
    }
  };

  return (
    <>
      <div data-component="lr-sequence" className="container">
        <div data-component="lr-sequence" className="top">
          <Search
            onChange={handleSearch}
            isDisabled={fallbackState !== "hidden"}
          />
          {windowWidth > 600 && (
            <Tooltip title="Create New LDM Sequence">
              <Fab
                variant="extended"
                color="primary"
                data-component="lr-sequence"
                className="fab"
                onClick={() => handleOpenFormDialog()}
              >
                <AddOutlined />
                Create new
              </Fab>
            </Tooltip>
          )}
        </div>
        <div data-component="lr-sequence" className="bottom">
          {fallbackState !== "hidden" ? (
            <Fallback state={fallbackState} />
          ) : (
            <div data-component="lr-sequence" className="table-container">
              <MaterialReactTable table={table} />
            </div>
          )}
        </div>
      </div>

      {windowWidth < 600 && (
        <div data-component="lr-sequence" className="fab-container">
          <Tooltip title="Create New LR Sequence">
            <Fab
              variant="extended"
              color="primary"
              data-component="lr-sequence"
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
        maxWidth="md"
        fullScreen={isDialogFullScreen}
        data-component="lr-sequence"
        className="dialog"
      >
        <DialogTitle>
          {!isFormDialogEditMode && !isFormEditWhileCreationMode
            ? "Add New LDM Sequence"
            : "Edit LDM Sequence"}
        </DialogTitle>
        <DialogContent data-component="lr-sequence" className="dialog-content">
          <div data-component="lr-sequence" className="container">
            <div data-component="lr-sequence" className="columns-3">
              <FormControl
                size="medium"
                disabled={
                  isFormDialogLoading
                    ? true
                    : isFormDialogEditMode
                    ? true
                    : false
                }
                variant="outlined"
                fullWidth
                error={formErrors.branchId ? true : false}
              >
                <InputLabel>Source Branch</InputLabel>
                <Select
                  label="Source Branch"
                  onKeyDownCapture={() => {
                    onEnterFocusNext(event, "destination-region");
                  }}
                  value={formData.branchId ? formData?.branchId : ""}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      branchId: e.target.value as number,
                    }));
                  }}
                >
                  {activeBookingBranches
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((branch) => {
                      return (
                        <MenuItem
                          key={`active-booking-branch-${branch.branchId}`}
                          value={branch.branchId as number}
                        >
                          {branch.name}
                        </MenuItem>
                      );
                    })}
                </Select>
                {formErrors.branchId && (
                  <FormHelperText error>{formErrors.branchId}</FormHelperText>
                )}
              </FormControl>


			



             
             
			  
			  {user && user.displayEstimate && (
                <FormControl
                  size="medium"
                  disabled={
                    isFormDialogLoading
                      ? true
                      : isFormDialogEditMode
                      ? true
                      : false
                  }
                  variant="outlined"
                  fullWidth
                  error={formErrors.billTypeId ? true : false}
                >
                  <InputLabel>Bill Type</InputLabel>
                  <Select
                    label="Bill Type"
					id="billType"
					onKeyDownCapture={() => {
						onEnterFocusNext(event, "ldm-save");
					  }}
                    value={formData.billTypeId ? formData?.billTypeId : ""}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        billTypeId: e.target.value as number,
                      }));
                    }}
                  >
                    {billTypes.map((type) => {
                      return (
                        <MenuItem
                          key={`payment-type-${type.billTypeId}`}
                          value={type.billTypeId as number}
                        >
                          {type.billType}
                        </MenuItem>
                      );
                    })}
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
                error={formErrors.nextValue ? true : false}
              >
                <InputLabel htmlFor="nextValue">Next Value</InputLabel>
                <OutlinedInput
                  label="Next Value"
                  id="nextValue"
                  onKeyDownCapture={() => {
                    onEnterFocusNext(event, "billType");
                  }}
                  type="number"
                  value={formData.nextValue ? formData.nextValue : ""}
                  name="nextValue"
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      nextValue: +e.target.value,
                    }));
                  }}
                />
                {formErrors.nextValue && (
                  <FormHelperText error>{formErrors.nextValue}</FormHelperText>
                )}
              </FormControl>
            </div>
            <div data-component="lr-sequence" className="columns-3">
              <FormControl
                size="medium"
                disabled={
                  isFormDialogLoading
                    ? true
                    : isFormDialogEditMode
                    ? true
                    : false
                }
                variant="outlined"
                fullWidth
                error={formErrors.regionId ? true : false}
              >
                <InputLabel>Destination Region</InputLabel>
                <Select
                  id="destination-region"
                  onKeyDownCapture={() => {
                    onEnterFocusNext(event, "destination-branch");
                  }}
                  label="Destination Region"
                  value={formData.regionId ? formData?.regionId : ""}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      regionId: e.target.value as number,
                    }));
                  }}
                >
                  {regions
                    .sort((a, b) => a.region.localeCompare(b.region))
                    .map((region) => {
                      return (
                        <MenuItem
                          key={`payment-type-${region.regionId}`}
                          value={region.regionId as number}
                        >
                          {region.region}
                        </MenuItem>
                      );
                    })}
                </Select>
                {formErrors.regionId && (
                  <FormHelperText error>{formErrors.regionId}</FormHelperText>
                )}
              </FormControl>

              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
                error={formErrors.minRange ? true : false}
              >
                <InputLabel htmlFor="minRange">Minimum Range</InputLabel>
                <OutlinedInput
                  label="Minimum Range"
                  id="minRange"
                  onKeyDownCapture={() => {
                    onEnterFocusNext(event, "maxRange");
                  }}
                  type="number"
                  value={formData.minRange ? formData.minRange : ""}
                  name="minRange"
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      minRange: +e.target.value,
                    }));
                  }}
                />
                {formErrors.minRange && (
                  <FormHelperText error>{formErrors.minRange}</FormHelperText>
                )}
              </FormControl>
            
            </div>



            <div data-component="lr-sequence" className="columns-3">


			<FormControl
                size="medium"
                disabled={
                  isFormDialogLoading
                    ? true
                    : isFormDialogEditMode
                    ? true
                    : false
                }
                variant="outlined"
                fullWidth
                error={formErrors.toBranchId ? true : false}
              >
                <InputLabel>Destination Branch</InputLabel>
                <Select
                  label="Destination Branch"
				  id="destination-branch"
                  onKeyDownCapture={() => {
                    onEnterFocusNext(event, "minRange");
                  }}
                  value={formData.toBranchId !== null ? formData.toBranchId : 0}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      toBranchId: e.target.value as number,
                    }));
                  }}
                >
					 <MenuItem value={0}>All</MenuItem>
                  {getFilteredDestinationBranches()
				   .sort((a, b) => a.name.localeCompare(b.name))
                                        .map((branch) => {
                      return (
                        <MenuItem
                          key={`active-branch-${branch.branchId}`}
                          value={branch.branchId as number}
                        >
                          {branch.name}
                        </MenuItem>
                      );
                    })}
                </Select>
                {formErrors.toBranchId && (
                  <FormHelperText error>{formErrors.toBranchId}</FormHelperText>
                )}
              </FormControl>

            
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
                error={formErrors.maxRange ? true : false}
              >
                <InputLabel htmlFor="maxRange">Maximum Range</InputLabel>
                <OutlinedInput
                  label="maxRange"
                  id="maxRange"
                  onKeyDownCapture={() => {
                    onEnterFocusNext(event, "nextValue");
                  }}
                  type="number"
                  value={formData.maxRange ? formData.maxRange : ""}
                  name="maxRange"
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      maxRange: +e.target.value,
                    }));
                  }}
                />
                {formErrors.maxRange && (
                  <FormHelperText error>{formErrors.maxRange}</FormHelperText>
                )}
              </FormControl>
			  
            </div>
			
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormDialog}>Close</Button>
          <LoadingButton
            color="primary"
            onClick={() => {
              if (!isFormDialogEditMode && !isFormEditWhileCreationMode) {
                handleCreateLdmSequence();
              } else {
                handleUpdateLdmSequence();
              }
            }}
            loading={isFormDialogLoading}
            type="submit"
            id="ldm-save"
          >
            Save
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Alert {...alertDialog} onClose={handleCloseAlertDialog} />
    </>
  );
});

// -------------------------------------------------------------------------------------------

export default LDMSequence;

// -------------------------------------------------------------------------------------------
