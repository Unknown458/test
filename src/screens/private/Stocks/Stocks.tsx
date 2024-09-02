// -------------------------------------------------------------------------------------------

import "./Stocks.scss";

import { format } from "date-fns";
import Decimal from "decimal.js";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import { LoadingButton } from "@mui/lab";
import {
  Checkbox,
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
} from "@mui/material";

import Logo from "../../../assets/logos/logo.png";
import Alert from "../../../components/Alert/Alert";
import {
  AlertInterface,
  AlertStates,
} from "../../../components/Alert/Alert.types";
import Fallback from "../../../components/Fallback/Fallback";
import { FallbackStateType } from "../../../components/Fallback/Fallback.types";
import { useApi } from "../../../contexts/Api/Api";
import { useApp } from "../../../contexts/App/App";
import { useAuth } from "../../../contexts/Auth/Auth";
import { getBookingsForLoadingMemoAsync } from "../../../services/booking/booking";
import { BookingInterface } from "../../../services/booking/booking.types";
import { getBranchByIdAsync } from "../../../services/branch/branch";
import {
  BranchInterface,
  RegionInterface,
} from "../../../services/branch/branch.types";
import { CompanyInterface } from "../../../services/company/company.types";
import { UserInterface } from "../../../services/user/user.types";
import { printMultiplePDF } from "../../../utils/printPDF";
import { divideArrayIntoChunks } from "../../../utils/splitArray";
import trimWords from "../../../utils/trimWords";

// -------------------------------------------------------------------------------------------

const defaultFormData = {
  regionId: "",
  toBranchId: "",
  fromBranchId: "",
};

const defaultFormErrors = {
  regionId: "",
  toBranchId: "",
  fromBranchId: "",
};

// -------------------------------------------------------------------------------------------

const Stocks = memo(() => {
  const { setTitle } = useApp();
  const {
    getRegions,
    getAllActiveDeliveryBranches,
    getAllActiveBookingBranches,
    getUserDetails,
    getCompanyDetailsById,
  } = useApi();
  const { handleLogout } = useAuth();

  const [fallbackState, setFallbackState] =
    useState<FallbackStateType>("loading");
  const [regions, _setRegions] = useState<RegionInterface[]>([]);
  const [deliveryBranches, _setDeliveryBranches] = useState<BranchInterface[]>(
    []
  );
  const [bookingBranches, _setBookingBranches] = useState<BranchInterface[]>(
    []
  );
  const [formData, setFormData] = useState(defaultFormData);
  const [formErrors, setFormErrors] = useState(defaultFormErrors);

  const [alertDialog, setAlertDialog] = useState<AlertInterface>({
    state: "success",
    label: "",
    isActive: false,
  });
  const [bookings, setBookings] = useState<BookingInterface[]>([]);
  const [isFormLoading, setIsFormLoading] = useState<boolean>(false);
  const [user, _setUser] = useState<UserInterface>();
  const [selectedRegions, setSelectedRegions] = useState<number[]>([]);
  const [selectedFromBranches, setSelectedFromBranches] = useState<number[]>(
    []
  );
  const [selectedToBranches, setSelectedToBranches] = useState<number[]>([]);
  const [stockPrint, setStockPrint] = useState<BookingInterface[][]>([]);
  const stockSummaryRowHeight = useRef<
    {
      rowHeight: number;
      boookings: BookingInterface[];
    }[]
  >([]);
  const [stockRemainingBookingsSummary, setStockRemainingBookingsSummary] =
    useState<BookingInterface[][][]>([]);

  const [transitReport, setTransitReport] = useState<BookingInterface[][]>([]);
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

  const [company, _setCompany] = useState<CompanyInterface>();
  const [userBranchDetails, setUserBranchDetails] = useState<BranchInterface>();

  useEffect(() => {
    setTitle("Stocks");
    initialFetch();
  }, [setTitle]);

  useEffect(() => {
    const rowHeights = transitReportSummaryRowHeight.current;
    let transitReportContainer = document.getElementById(
      "transit-report-summary-container"
    );
    const summaryRowsContainer = document.getElementById(
      "transit-report-rows-container"
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

      summaryRowsContainer.style.height = `${
        notShownRows.length === 0
          ? firstPageRowContainerHeight + 35
          : firstPageRowContainerHeight
      }px`;

      setTransitReportRemainingBookingsSummary(
        divideArrayIntoChunks(notShownRows, 24)
      );
    }
  }, [transitReportSummaryRowHeight.current, transitReport]);

  useEffect(() => {
    const rowHeights = stockSummaryRowHeight.current;
    let stockContainer = document.getElementById("stock-summary-container");
    const summaryRowsContainer = document.getElementById(
      "stock-rows-container"
    );

    let stockContainerHeight = stockContainer?.offsetHeight;
    const summaryRowsContainerHeight = summaryRowsContainer?.offsetHeight;

    if (
      rowHeights &&
      rowHeights.length !== 0 &&
      stockContainerHeight &&
      summaryRowsContainerHeight
    ) {
      stockContainerHeight = stockContainerHeight - 94;

      let firstPageRowContainerHeight = 0;
      const shownRows = [];
      const notShownRows = [];

      for (const row of rowHeights) {
        if (
          firstPageRowContainerHeight + row.rowHeight <=
          stockContainerHeight
        ) {
          firstPageRowContainerHeight =
            firstPageRowContainerHeight + row.rowHeight;
          shownRows.push(row);
        } else {
          notShownRows.push(row.boookings);
        }
      }

      summaryRowsContainer.style.height = `${
        notShownRows.length === 0
          ? firstPageRowContainerHeight + 35
          : firstPageRowContainerHeight
      }px`;

      setStockRemainingBookingsSummary(divideArrayIntoChunks(notShownRows, 24));
    }
  }, [stockSummaryRowHeight.current, stockPrint]);

  const initialFetch = useCallback(async () => {
    const regionsData = await getRegions();
    const deliveryBranchesData = await getAllActiveDeliveryBranches();
    const bookingBranchesData = await getAllActiveBookingBranches();
    const userData = await getUserDetails();
    const companyData = await getCompanyDetailsById();

    if (regionsData.length !== 0 && deliveryBranchesData.length !== 0) {
      _setRegions(regionsData);
      _setDeliveryBranches(deliveryBranchesData);
      _setBookingBranches(bookingBranchesData);
      _setUser(userData);
      _setCompany(companyData);
      if (userData) {
        handleGetBranchById(userData.branchId);
      }
      setFallbackState("hidden");
    } else {
      setFallbackState("not-found");
    }
  }, []);

  const validateRegion = (): boolean => {
    if (!formData?.regionId) {
      setFormErrors((prev) => ({
        ...prev,
        regionId: "Region is required.",
      }));
      return false;
    } else {
      setFormErrors((prev) => ({
        ...prev,
        regionId: "",
      }));
      return true;
    }
  };

  const validateToBranch = (): boolean => {
    if (!formData?.toBranchId) {
      setFormErrors((prev) => ({
        ...prev,
        toBranchId: "To Branch is required.",
      }));
      return false;
    } else {
      setFormErrors((prev) => ({
        ...prev,
        toBranchId: "",
      }));
      return true;
    }
  };

  const validateFromBranch = (): boolean => {
    if (!formData?.fromBranchId) {
      setFormErrors((prev) => ({
        ...prev,
        fromBranchId: "From Branch is required.",
      }));
      return false;
    } else {
      setFormErrors((prev) => ({
        ...prev,
        fromBranchId: "",
      }));
      return true;
    }
  };

  const validateForm = (): boolean => {
    const isRegionValid = validateRegion();
    const isToBranchValid = validateToBranch();
    const isFromBranchValid = validateFromBranch();

    return isRegionValid && isToBranchValid && isFromBranchValid;
  };

  useEffect(() => {
    const stringOfSelectedRegions = selectedRegions.join(",");

    const stringOfSelectedFromBranches = selectedFromBranches.join(",");

    const stringOfSelectedToBranches = selectedToBranches.join(",");

    setFormData((prev) => ({
      ...prev,
      regionId: selectedRegions.length !== 0 ? stringOfSelectedRegions : "",
      fromBranchId:
        selectedFromBranches.length !== 0 ? stringOfSelectedFromBranches : "",
      toBranchId:
        selectedToBranches.length !== 0 ? stringOfSelectedToBranches : "",
    }));
  }, [selectedRegions, selectedFromBranches, selectedToBranches]);

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

  const searchData = (
    data: BookingInterface[],
    toSearch: { fromBranchIds: number[]; toBranchIds: number[] }
  ): BookingInterface[] => {
    return data.filter(
      (item) =>
        toSearch.fromBranchIds.includes(item.fromBranchId) &&
        toSearch.toBranchIds.includes(item.toBranchId)
    );
  };

  const createPrint = async (variant: "stock" | "stock-transit") => {
    setStockPrint([]);
    setStockRemainingBookingsSummary([]);
    stockSummaryRowHeight.current = [];

    setTransitReport([]);
    setTransitReportRemainingBookingsSummary([]);
    transitReportSummaryRowHeight.current = [];

    if (!validateForm()) return;

    const responseBookings = await handleGetBookingsForLoadingMemoAsync(
      formData.regionId,
      user?.branchId ? user?.branchId : 0
    );

    if (responseBookings) {
      if (responseBookings.length !== 0) {
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

          const result: BookingInterface[][] = Object.values(groupedBookings);
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

        setStockPrint(
          divideArrayIntoChunks(
            ungroupBookings(
              orderByLrNumber(
                orderByToBranch(groupByToBranch(responseBookings))
              )
            ),
            24
          )
        );

        setTransitReport(
          divideArrayIntoChunks(
            responseBookings.sort((a, b) => +a.lrNumber - +b.lrNumber),
            50
          )
        );

        setTimeout(() => {
          if (variant === "stock") {
            const elements = Array.from(
              document.getElementsByClassName("stock-print")
            ) as HTMLElement[];
            printMultiplePDF(elements, "a4");
          }

          if (variant === "stock-transit") {
            const elements = Array.from(
              document.getElementsByClassName("transit-print")
            ) as HTMLElement[];
            printMultiplePDF(elements, "a4");
          }

          setIsFormLoading(false);
        }, 1000);
      }
    } else {
      setIsFormLoading(false);
    }
  };

  const handleOpenAlertDialog = useCallback(
    (state: AlertStates, label: string) => {
      setAlertDialog({ state, label, isActive: true });
    },
    []
  );

  const handleCloseAlertDialog = useCallback(() => {
    setAlertDialog({ state: "success", label: "", isActive: false });
  }, []);

  const handleGetBookingsForLoadingMemoAsync = async (
    regionId: string,
    branchId: number
  ): Promise<BookingInterface[]> => {
    setIsFormLoading(true);

    const response = await getBookingsForLoadingMemoAsync(regionId, branchId);

    if (
      response &&
      typeof response !== "boolean" &&
      response.data.status !== 401
    ) {
      const data: any = response.data.data.reverse();

      if (data && data.length !== 0) {
        const bookings: BookingInterface[] = searchData(data, {
          fromBranchIds: selectedFromBranches,
          toBranchIds: selectedToBranches,
        });
        if (bookings.length !== 0) {
          setBookings(bookings);
          return bookings;
        } else {
          setBookings([]);
          handleOpenAlertDialog("warning", `No bookings found.`);
          setIsFormLoading(false);
          return [];
        }
      } else {
        handleOpenAlertDialog("warning", `No bookings found.`);
        setIsFormLoading(false);
        return [];
      }
    } else {
      handleLogout();
      return [];
    }
  };

  return (
    <>
      <div data-component="stock" className="container">
        <div data-component="stock" className="bottom">
          {fallbackState !== "hidden" ? (
            <Fallback state={fallbackState} />
          ) : (
            <>
              <div data-component="stock" className="container">
                <div data-component="stock" className="columns-3">
                  <FormControl
                    size="small"
                    error={!!formErrors.regionId}
                    disabled={false}
                  >
                    <InputLabel>Regions</InputLabel>
                    <Select
                      multiple
                      value={selectedRegions}
                      onChange={(event) => {
                        const value = event.target.value as number[];

                        const hasZero =
                          value.find((id) => id === 0) === 0 && true;

                        if (hasZero) {
                          if (selectedRegions.length !== regions.length) {
                            const allRegionIds = regions.map(
                              (region) => region.regionId as number
                            );
                            setSelectedRegions(allRegionIds);
                          } else {
                            setSelectedRegions([]);
                          }
                        } else {
                          setSelectedRegions(value);
                        }
                      }}
                      input={<OutlinedInput label="Regions" />}
                      renderValue={(selected) =>
                        (selected as number[])
                          .map(
                            (regionId) =>
                              regions.find(
                                (region) => region.regionId === regionId
                              )?.region
                          )
                          .join(", ")
                      }
                    >
                      <MenuItem value={0}>
                        <Checkbox
                          checked={selectedRegions.length === regions.length}
                        />
                        <ListItemText primary="All" />
                      </MenuItem>
                      {regions.map((region) => (
                        <MenuItem key={region.regionId} value={region.regionId}>
                          <Checkbox
                            checked={
                              selectedRegions.indexOf(
                                region.regionId as number
                              ) > -1
                            }
                          />
                          <ListItemText primary={region.region} />
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.regionId && (
                      <FormHelperText>{formErrors.regionId}</FormHelperText>
                    )}
                  </FormControl>
                </div>
                <div data-component="stock" className="columns-3">
                  <FormControl
                    size="small"
                    error={!!formErrors.fromBranchId}
                    disabled={false}
                  >
                    <InputLabel>From</InputLabel>
                    <Select
                      multiple
                      value={selectedFromBranches}
                      onChange={(event) => {
                        const value = event.target.value as number[];

                        const hasZero =
                          value.find((id) => id === 0) === 0 && true;

                        if (hasZero) {
                          if (
                            selectedFromBranches.length !==
                            bookingBranches.length
                          ) {
                            const allFromBranches = bookingBranches.map(
                              (branch) => branch.branchId as number
                            );
                            setSelectedFromBranches(allFromBranches);
                          } else {
                            setSelectedFromBranches([]);
                          }
                        } else {
                          setSelectedFromBranches(value);
                        }
                      }}
                      input={<OutlinedInput label="From" />}
                      renderValue={(selected) =>
                        (selected as number[])
                          .map(
                            (branchId) =>
                              bookingBranches.find(
                                (branch) => branch.branchId === branchId
                              )?.name
                          )
                          .join(", ")
                      }
                    >
                      <MenuItem value={0}>
                        <Checkbox
                          checked={
                            selectedFromBranches.length ===
                            bookingBranches.length
                          }
                        />
                        <ListItemText primary="All" />
                      </MenuItem>
                      {bookingBranches.map((branch) => (
                        <MenuItem key={branch.branchId} value={branch.branchId}>
                          <Checkbox
                            checked={
                              selectedFromBranches.indexOf(
                                branch.branchId as number
                              ) > -1
                            }
                          />
                          <ListItemText primary={branch.name} />
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.fromBranchId && (
                      <FormHelperText>{formErrors.fromBranchId}</FormHelperText>
                    )}
                  </FormControl>
                </div>
                <div data-component="stock" className="columns-3">
                  <FormControl
                    size="small"
                    error={!!formErrors.toBranchId}
                    disabled={false}
                  >
                    <InputLabel>To</InputLabel>
                    <Select
                      multiple
                      value={selectedToBranches}
                      onChange={(event) => {
                        const value = event.target.value as number[];

                        const hasZero =
                          value.find((id) => id === 0) === 0 && true;

                        if (hasZero) {
                          if (
                            selectedToBranches.length !==
                            deliveryBranches.length
                          ) {
                            const allToBranches = deliveryBranches.map(
                              (branch) => branch.branchId as number
                            );
                            setSelectedToBranches(allToBranches);
                          } else {
                            setSelectedToBranches([]);
                          }
                        } else {
                          setSelectedToBranches(value);
                        }
                      }}
                      input={<OutlinedInput label="To" />}
                      renderValue={(selected) =>
                        (selected as number[])
                          .map(
                            (branchId) =>
                              deliveryBranches.find(
                                (branch) => branch.branchId === branchId
                              )?.name
                          )
                          .join(", ")
                      }
                    >
                      <MenuItem value={0}>
                        <Checkbox
                          checked={
                            selectedToBranches.length ===
                            deliveryBranches.length
                          }
                        />
                        <ListItemText primary="All" />
                      </MenuItem>
                      {deliveryBranches.map((branch) => (
                        <MenuItem key={branch.branchId} value={branch.branchId}>
                          <Checkbox
                            checked={
                              selectedToBranches.indexOf(
                                branch.branchId as number
                              ) > -1
                            }
                          />
                          <ListItemText primary={branch.name} />
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.toBranchId && (
                      <FormHelperText>{formErrors.toBranchId}</FormHelperText>
                    )}
                  </FormControl>
                </div>
              </div>
              <div data-component="stock" className="buttons-container">
                <LoadingButton
                  variant="contained"
                  onClick={() => createPrint("stock")}
                  loading={isFormLoading}
                >
                  Print Stock
                </LoadingButton>
                <LoadingButton
                  variant="contained"
                  onClick={() => createPrint("stock-transit")}
                  loading={isFormLoading}
                >
                  Print Stock Transit
                </LoadingButton>
              </div>
            </>
          )}
        </div>
      </div>

      <Alert {...alertDialog} onClose={handleCloseAlertDialog} />

      {bookings && regions && deliveryBranches && stockPrint && (
        <div
          data-component="loading-memo"
          className="pdf-container"
          id="stock-prints-container"
        >
          {stockPrint.map((page, index) => {
            const pageArray = page;

            let leftBookings = [...pageArray].splice(0, 12);
            let rightBookings = [...pageArray].splice(12, 24);

            const sortByToBranch = (bookings: BookingInterface[]) => {
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

            const leftSideBookings = orderByLrNumber(
              orderByToBranch(sortByToBranch(leftBookings))
            );
            const rightSideBookings = orderByLrNumber(
              orderByToBranch(sortByToBranch(rightBookings))
            );

            let usedToBranches: string[] = [];

            let allShownBookingsArray = [];

            for (let i = 0; i < stockPrint.length; i++) {
              const bookingsArray = stockPrint[i];

              for (let i = 0; i < bookingsArray.length; i++) {
                const thisBooking = bookingsArray[i];
                allShownBookingsArray.push(thisBooking);
              }
            }

            let allDestinations = sortByToBranch(allShownBookingsArray);

            let allDestination = [];

            for (let i = 0; i < allDestinations.length; i++) {
              const thisDestination = allDestinations[i];

              allDestination.push(thisDestination[0].toBranch);
            }

            return (
              <div
                data-component="loading-memo"
                className="page stock-print"
                id={`stock-print-${index}`}
              >
                <div data-component="loading-memo" className="body-small">
                  Page No.{index + 1}
                </div>
				<div data-component="loading-memo" className="head-container">
                <div data-component="loading-memo" className="logo-container">
                  <img
                    data-component="loading-memo"
                    className="logo"
                    src={Logo}
                  />
                </div>
                <div
                  data-component="loading-memo"
                  className="headline title-large"
                >
                  {company?.companyName ? company?.companyName : "--"}
                  <div
                    data-component="loading-memo"
                    className="body-small"
                    style={{
                      margin: "8px 0 8px 0",
                    }}
                  >
                    {userBranchDetails?.address
                      ? userBranchDetails?.address
                      : "--"}
                  </div>
                  <div data-component="loading-memo" className="body-small">
                    Phone No.:{" "}
                    {userBranchDetails?.phone ? userBranchDetails?.phone : "--"}
                  </div>
                </div>
				</div>
                <div data-component="loading-memo" className="text body-small">
                  STOCK
                </div>
                <div data-component="loading-memo" className="top-section">
                  <div data-component="loading-memo" className="container">
                    <div data-component="loading-memo" className="columns-1">
                      <div
                        data-component="loading-memo"
                        className="value-container"
                      >
                        <div
                          data-component="loading-memo"
                          className="label body-medium"
                        >
                          Destination:
                        </div>
                        <div
                          data-component="loading-memo"
                          className="value body-medium"
                        >
                          {formData.toBranchId
                            ? allDestination.join(", ")
                            : "--"}
                        </div>
                      </div>
                    </div>
                    <div data-component="loading-memo" className="columns-3">
                      <div
                        data-component="loading-memo"
                        className="value-container"
                      >
                        <div
                          data-component="loading-memo"
                          className="label body-medium"
                        >
                          Print Time:
                        </div>
                        <div
                          data-component="loading-memo"
                          className="value body-medium"
                        >
                          {format(
                            new Date().toISOString(),
                            "dd-MM-yyyy hh:mm a"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div data-component="loading-memo" className="middle-section">
                  <div data-component="loading-memo" className="container">
                    <div data-component="loading-memo" className="columns-2">
                      <div
                        data-component="loading-memo"
                        className="container table-head"
                      >
                        <div
                          data-component="loading-memo"
                          className="columns-5 body-small"
                        >
                          From
                        </div>
                        <div
                          data-component="loading-memo"
                          className="columns-8 body-small align-center"
                        >
                          LR No.
                        </div>
                        <div
                          data-component="loading-memo"
                          className="columns-10 body-small align-center"
                        >
                          Art.
                        </div>
                        <div
                          data-component="loading-memo"
                          className="columns-3 body-small align-center"
                        >
                          Pvt.mrk.
                        </div>
                        <div
                          data-component="loading-memo"
                          className="columns-10 body-small align-center"
                        >
                          Wgt.
                        </div>
                        <div
                          data-component="loading-memo"
                          className="columns-5 body-small align-right"
                        >
                          Amount
                        </div>
                      </div>

                      {leftSideBookings.map((array) => {
                        let totalArticleInToStation = 0;
                        let totalWeightInToStation = 0;
                        let totalInToStation = 0;

                        const exists = usedToBranches.includes(
                          array[0].toBranch
                        );

                        if (exists === false) {
                          usedToBranches.push(array[0].toBranch);
                        }

                        return (
                          <>
                            {!exists && (
                              <div
                                data-component="loading-memo"
                                className="to-station-top body-small"
                              >
                                To: {array[0].toBranch}
                              </div>
                            )}
                            <div
                              data-component="loading-memo"
                              className="to-station-middle body-small"
                            >
                              {array.map((row) => {
                                let totalArticleInRow =
                                  row.bookingDetails.reduce(
                                    (sum: any, detail: any) =>
                                      sum + detail.article,
                                    0
                                  );

                                let totalWeightInRow =
                                  row.bookingDetails.reduce(
                                    (sum: any, detail: any) =>
                                      sum + detail.weight,
                                    0
                                  );

                                totalArticleInToStation += totalArticleInRow;

                                totalWeightInToStation += totalWeightInRow;

                                totalInToStation += row.grandTotal
                                  ? row.grandTotal
                                  : 0;

                                return (
                                  <div
                                    data-component="loading-memo"
                                    className="container table-row"
                                  >
                                    <div
                                      data-component="loading-memo"
                                      className="columns-5 body-small"
                                      style={{
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {array[0].fromBranch
                                        ? trimWords(array[0].fromBranch, 5)
                                        : "--"}
                                    </div>
                                    <div
                                      data-component="loading-memo"
                                      className="columns-8 body-small align-center"
                                    >
                                      {row.lrNumber ? row.lrNumber : "--"}
                                    </div>
                                    <div
                                      data-component="loading-memo"
                                      className="columns-10 body-small align-center"
                                    >
                                      {totalArticleInRow
                                        ? totalArticleInRow
                                        : "--"}
                                    </div>
                                    <div
                                      data-component="loading-memo"
                                      className="columns-3 body-small align-center"
                                      style={{
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {row.privateMark
                                        ? trimWords(row.privateMark, 6)
                                        : "--"}
                                    </div>
                                    <div
                                      data-component="loading-memo"
                                      className="columns-10 body-small align-center"
                                    >
                                      {totalWeightInRow
                                        ? totalWeightInRow
                                        : "--"}
                                    </div>
                                    <div
                                      data-component="loading-memo"
                                      className="columns-5 body-small align-right"
                                    >
                                      {row.grandTotal
                                        ? (+row.grandTotal).toFixed(2)
                                        : "--"}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                      })}
                    </div>
                    {rightSideBookings.length !== 0 && (
                      <div data-component="loading-memo" className="columns-2">
                        <div
                          data-component="loading-memo"
                          className="container table-head"
                        >
                          <div
                            data-component="loading-memo"
                            className="columns-5 body-small"
                          >
                            From
                          </div>
                          <div
                            data-component="loading-memo"
                            className="columns-8 body-small align-center"
                          >
                            LR No.
                          </div>
                          <div
                            data-component="loading-memo"
                            className="columns-10 body-small align-center"
                          >
                            Art.
                          </div>
                          <div
                            data-component="loading-memo"
                            className="columns-3 body-small align-center"
                          >
                            Pvt.mrk.
                          </div>
                          <div
                            data-component="loading-memo"
                            className="columns-10 body-small align-center"
                          >
                            Wgt.
                          </div>
                          <div
                            data-component="loading-memo"
                            className="columns-5 body-small align-right"
                          >
                            Amount
                          </div>
                        </div>

                        {rightSideBookings.map((array) => {
                          let totalArticleInToStation = 0;
                          let totalWeightInToStation = 0;
                          let totalInToStation = 0;

                          const exists = usedToBranches.includes(
                            array[0].toBranch
                          );

                          if (exists === false) {
                            usedToBranches.push(array[0].toBranch);
                          }

                          return (
                            <>
                              {!exists && (
                                <div
                                  data-component="loading-memo"
                                  className="to-station-top body-small"
                                >
                                  To: {array[0].toBranch}
                                </div>
                              )}
                              <div
                                data-component="loading-memo"
                                className="to-station-middle body-small"
                              >
                                {array.map((row) => {
                                  let totalArticleInRow =
                                    row.bookingDetails.reduce(
                                      (sum: any, detail: any) =>
                                        sum + detail.article,
                                      0
                                    );

                                  let totalWeightInRow =
                                    row.bookingDetails.reduce(
                                      (sum: any, detail: any) =>
                                        sum + detail.weight,
                                      0
                                    );

                                  totalArticleInToStation += totalArticleInRow;

                                  totalWeightInToStation += totalWeightInRow;

                                  totalInToStation += row.grandTotal
                                    ? row.grandTotal
                                    : 0;

                                  return (
                                    <div
                                      data-component="loading-memo"
                                      className="container table-row"
                                    >
                                      <div
                                        data-component="loading-memo"
                                        className="columns-5 body-small"
                                        style={{
                                          wordBreak: "break-word",
                                        }}
                                      >
                                        {array[0].fromBranch
                                          ? trimWords(array[0].fromBranch, 5)
                                          : "--"}
                                      </div>
                                      <div
                                        data-component="loading-memo"
                                        className="columns-8 body-small align-center"
                                      >
                                        {row.lrNumber ? row.lrNumber : "--"}
                                      </div>
                                      <div
                                        data-component="loading-memo"
                                        className="columns-10 body-small align-center"
                                      >
                                        {totalArticleInRow
                                          ? totalArticleInRow
                                          : "--"}
                                      </div>
                                      <div
                                        data-component="loading-memo"
                                        className="columns-3 body-small align-center"
                                        style={{
                                          wordBreak: "break-word",
                                        }}
                                      >
                                        {row.privateMark
                                          ? trimWords(row.privateMark, 6)
                                          : "--"}
                                      </div>
                                      <div
                                        data-component="loading-memo"
                                        className="columns-10 body-small align-center"
                                      >
                                        {totalWeightInRow
                                          ? totalWeightInRow
                                          : "--"}
                                      </div>
                                      <div
                                        data-component="loading-memo"
                                        className="columns-5 body-small align-right"
                                      >
                                        {row.grandTotal
                                          ? (+row.grandTotal).toFixed(2)
                                          : "--"}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                {stockPrint.length === index + 1 && (
                  <>
                    <div
                      data-component="loading-memo"
                      className="summary-container"
                      id="stock-summary-container"
                    >
                      <div
                        data-component="loading-memo"
                        className="middle-section"
                        style={{
                          margin: "24px 0 0 0",
                        }}
                      >
                        <div
                          data-component="loading-memo"
                          className="container table-head"
                        >
                          <div
                            data-component="loading-memo"
                            className="columns-4 body-small"
                          >
                            To
                          </div>
                          <div
                            data-component="loading-memo"
                            className="columns-4 body-small align-center"
                          >
                            Article
                          </div>
                          <div
                            data-component="loading-memo"
                            className="columns-4 body-small align-center"
                          >
                            Actual Weight
                          </div>
                          <div
                            data-component="loading-memo"
                            className="columns-4 body-small align-right"
                          >
                            Total
                          </div>
                        </div>
                      </div>

                      <div
                        data-component="loading-memo"
                        className="summary-rows-container"
                        id="stock-rows-container"
                      >
                        {new Array(1).fill(null).map(() => {
                          let grandTotalLrInToStation = 0;
                          let grandTotalArticleInToStation = 0;
                          let grandTotalWeightInToStation = 0;
                          let grandTotalChargeWeightInToStation = 0;
                          let grandTotalToPayInToStation = 0;
                          let grandTotalToPaidInToStation = 0;
                          let grandTotalToTBBInToStation = 0;
                          let grandTotalInToStation = 0;
                          let grandTotalVasuliInToStation = 0;

                          const allBookingsToDisplay = [];

                          for (let i = 0; i < stockPrint.length; i++) {
                            const thisBookings = stockPrint[i];

                            for (let i = 0; i < thisBookings.length; i++) {
                              const bookings = thisBookings[i];
                              allBookingsToDisplay.push(bookings);
                            }
                          }

                          const groupedBookings: {
                            [key: number]: any[];
                          } = {};

                          allBookingsToDisplay.forEach((booking) => {
                            const { toBranchId } = booking;

                            if (!groupedBookings[toBranchId]) {
                              groupedBookings[toBranchId] = [];
                            }

                            groupedBookings[toBranchId].push(booking);
                          });

                          let result: BookingInterface[][] =
                            Object.values(groupedBookings).reverse();

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

                          result = orderByToBranch(result);

                          return (
                            <>
                              {result.map((array) => {
                                let totalArticleInToStation = 0;
                                let totalWeightInToStation = 0;
                                let totalChargeWeightInToStation = 0;
                                let totalInToStation = 0;
                                let totalLr = array.length;

                                array.map((row) => {
                                  let totalArticleInRow =
                                    row.bookingDetails.reduce(
                                      (sum: any, detail: any) =>
                                        sum + detail.article,
                                      0
                                    );

                                  let totalWeightInRow =
                                    row.bookingDetails.reduce(
                                      (sum: any, detail: any) =>
                                        sum + detail.weight,
                                      0
                                    );

                                  let totalChargeWeightInRow =
                                    row.bookingDetails.reduce(
                                      (sum: any, detail: any) =>
                                        sum + detail.chargeWeight,
                                      0
                                    );

                                  totalWeightInToStation += totalWeightInRow;

                                  totalChargeWeightInToStation +=
                                    totalChargeWeightInRow;

                                  totalArticleInToStation += totalArticleInRow;

                                  totalInToStation += row.grandTotal
                                    ? row.grandTotal
                                    : 0;
                                });

                                const selectedTotal = array.reduce(
                                  (acc, booking) => {
                                    if (booking.paymentType === 1) {
                                      let prevFreightToPay = new Decimal(
                                        acc.totalFreightToPay
                                      );
                                      let freight = new Decimal(
                                        +booking.grandTotal
                                      );
                                      let totalFreightToPay =
                                        +prevFreightToPay.plus(freight);
                                      acc.totalFreightToPay = totalFreightToPay;
                                    } else if (booking.paymentType === 2) {
                                      let prevFreightPaid = new Decimal(
                                        acc.totalFreightPaid
                                      );
                                      let freight = new Decimal(
                                        +booking.grandTotal
                                      );
                                      let totalFreightPaid =
                                        +prevFreightPaid.plus(freight);
                                      acc.totalFreightPaid = totalFreightPaid;
                                    } else if (booking.paymentType === 3) {
                                      let prevFreightTBB = new Decimal(
                                        acc.totalFreightTBB
                                      );
                                      let freight = new Decimal(
                                        +booking.grandTotal
                                      );
                                      let totalFreightTBB =
                                        +prevFreightTBB.plus(freight);
                                      acc.totalFreightTBB = totalFreightTBB;
                                    }
                                    return acc;
                                  },
                                  {
                                    totalFreightToPay: 0,
                                    totalFreightPaid: 0,
                                    totalFreightTBB: 0,
                                  }
                                );

                                const totalVasuli = new Decimal(
                                  +selectedTotal.totalFreightToPay
                                )
                                  .plus(+selectedTotal.totalFreightPaid)
                                  .plus(+selectedTotal.totalFreightTBB);

                                grandTotalLrInToStation += totalLr;

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

                                grandTotalInToStation += totalInToStation;

                                grandTotalVasuliInToStation += +totalVasuli;

                                return (
                                  <>
                                    <div
                                      data-component="loading-memo"
                                      className="table-row body-small"
                                      ref={(e) => {
                                        if (e) {
                                          stockSummaryRowHeight.current.push({
                                            rowHeight: e.offsetHeight,
                                            boookings: array,
                                          });
                                        }
                                      }}
                                    >
                                      <div
                                        data-component="loading-memo"
                                        className="container"
                                      >
                                        <div
                                          data-component="loading-memo"
                                          className="columns-4 body-small"
                                        >
                                          {array[0].toBranch}
                                        </div>
                                        <div
                                          data-component="loading-memo"
                                          className="columns-4 body-small align-center"
                                        >
                                          {totalArticleInToStation}
                                        </div>
                                        <div
                                          data-component="loading-memo"
                                          className="columns-4 body-small align-center"
                                        >
                                          {totalWeightInToStation}
                                        </div>
                                        <div
                                          data-component="loading-memo"
                                          className="columns-4 body-small align-right"
                                        >
                                          {`${(+totalVasuli).toFixed(2)}`}
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                );
                              })}

                              <div
                                data-component="loading-memo"
                                className="middle-section"
                              >
                                <div
                                  data-component="loading-memo"
                                  className="container table-head"
                                >
                                  <div
                                    data-component="loading-memo"
                                    className="columns-4 body-small"
                                  >
                                    Total
                                  </div>
                                  <div
                                    data-component="loading-memo"
                                    className="columns-4 body-small align-center"
                                  >
                                    {grandTotalArticleInToStation}
                                  </div>
                                  <div
                                    data-component="loading-memo"
                                    className="columns-4 body-small align-center"
                                  >
                                    {grandTotalWeightInToStation}
                                  </div>
                                  <div
                                    data-component="loading-memo"
                                    className="columns-4 body-small align-right"
                                  >
                                    {(+grandTotalVasuliInToStation).toFixed(2)}
                                  </div>
                                </div>
                              </div>
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
          {stockRemainingBookingsSummary &&
            stockRemainingBookingsSummary.length !== 0 && (
              <>
                {stockRemainingBookingsSummary.map((data, index) => {
                  let finalTotalLr = 0;
                  let finalTotalArticle = 0;
                  let finalTotalWeight = 0;
                  let finalTotalChargeWeight = 0;
                  let finalTotalToPay = 0;
                  let finalTotalToPaid = 0;
                  let finalTotalToTBB = 0;
                  let finalTotalVasuli = 0;

                  for (let i = 0; i < stockPrint.length; i++) {
                    const thisBooking = stockPrint[i];

                    const totals = thisBooking.reduce(
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

                          let prevChargeWeight = new Decimal(
                            acc.totalChargeWeight
                          );

                          let chargeWeight = new Decimal(+detail.chargeWeight);

                          let totalChargeWeight =
                            +prevChargeWeight.plus(chargeWeight);
                          acc.totalChargeWeight = totalChargeWeight;
                        });

                        if (booking.paymentType === 1) {
                          let prevFreightToPay = new Decimal(
                            acc.totalFreightToPay
                          );
                          let freight = new Decimal(+booking.grandTotal);
                          let totalFreightToPay =
                            +prevFreightToPay.plus(freight);
                          acc.totalFreightToPay = totalFreightToPay;
                        } else if (booking.paymentType === 2) {
                          let prevFreightPaid = new Decimal(
                            acc.totalFreightPaid
                          );
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

                    const totalVasuli = new Decimal(+totals.totalFreightToPay)
                      .plus(+totals.totalFreightPaid)
                      .plus(+totals.totalFreightTBB);

                    finalTotalLr = finalTotalLr + thisBooking.length;
                    finalTotalArticle = finalTotalArticle + totals.totalArticle;
                    finalTotalWeight = finalTotalWeight + totals.totalWeight;
                    finalTotalChargeWeight =
                      finalTotalChargeWeight + totals.totalChargeWeight;
                    finalTotalToPay =
                      finalTotalToPay + totals.totalFreightToPay;
                    finalTotalToPaid =
                      finalTotalToPaid + totals.totalFreightPaid;
                    finalTotalToTBB = finalTotalToTBB + totals.totalFreightTBB;
                    finalTotalVasuli = finalTotalVasuli + +totalVasuli;
                  }

                  const sortByToBranch = (bookings: BookingInterface[]) => {
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

                  let allShownBookingsArray = [];

                  for (let i = 0; i < stockPrint.length; i++) {
                    const bookingsArray = stockPrint[i];

                    for (let i = 0; i < bookingsArray.length; i++) {
                      const thisBooking = bookingsArray[i];
                      allShownBookingsArray.push(thisBooking);
                    }
                  }

                  let allDestinations = sortByToBranch(allShownBookingsArray);

                  let allDestination = [];

                  for (let i = 0; i < allDestinations.length; i++) {
                    const thisDestination = allDestinations[i];

                    allDestination.push(thisDestination[0].toBranch);
                  }

                  return (
                    <div
                      data-component="loading-memo"
                      className="page stock-print"
                    >
                      <div data-component="loading-memo" className="body-small">
                        Page No.
                        {stockPrint.length + (index + 1)}
                      </div>
					  <div data-component="loading-memo" className="head-container">
                      <div
                        data-component="loading-memo"
                        className="logo-container"
                      >
                        <img
                          data-component="loading-memo"
                          className="logo"
                          src={Logo}
                        />
                      </div>
                      <div
                        data-component="loading-memo"
                        className="headline title-large"
                      >
                        {company?.companyName ? company?.companyName : "--"}
                        <div
                          data-component="loading-memo"
                          className="body-small"
                          style={{
                            margin: "8px 0 8px 0",
                          }}
                        >
                          {userBranchDetails?.address
                            ? userBranchDetails?.address
                            : "--"}
                        </div>
                        <div
                          data-component="loading-memo"
                          className="body-small"
                        >
                          Phone No.:{" "}
                          {userBranchDetails?.phone
                            ? userBranchDetails?.phone
                            : "--"}
                        </div>
                      </div>
					  </div>
                      <div
                        data-component="loading-memo"
                        className="text body-small"
                      >
                        STOCK
                      </div>
                      <div
                        data-component="loading-memo"
                        className="top-section"
                      >
                        <div
                          data-component="loading-memo"
                          className="container"
                        >
                          <div
                            data-component="loading-memo"
                            className="columns-1"
                          >
                            <div
                              data-component="loading-memo"
                              className="value-container"
                            >
                              <div
                                data-component="loading-memo"
                                className="label body-medium"
                              >
                                Destination:
                              </div>
                              <div
                                data-component="loading-memo"
                                className="value body-medium"
                              >
                                {formData.toBranchId
                                  ? allDestination.join(", ")
                                  : "--"}
                              </div>
                            </div>
                          </div>
                          <div
                            data-component="loading-memo"
                            className="columns-3"
                          >
                            <div
                              data-component="loading-memo"
                              className="value-container"
                            >
                              <div
                                data-component="loading-memo"
                                className="label body-medium"
                              >
                                Print Time:
                              </div>
                              <div
                                data-component="loading-memo"
                                className="value body-medium"
                              >
                                {format(
                                  new Date().toISOString(),
                                  "dd-MM-yyyy hh:mm a"
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        data-component="loading-memo"
                        className="summary-container"
                      >
                        <div
                          data-component="loading-memo"
                          className="middle-section"
                          style={{
                            margin: "24px 0 0 0",
                          }}
                        >
                          <div
                            data-component="loading-memo"
                            className="container table-head"
                          >
                            <div
                              data-component="loading-memo"
                              className="columns-4 body-small"
                            >
                              To
                            </div>
                            <div
                              data-component="loading-memo"
                              className="columns-4 body-small align-center"
                            >
                              Article
                            </div>
                            <div
                              data-component="loading-memo"
                              className="columns-4 body-small align-center"
                            >
                              Actual Weight
                            </div>
                            <div
                              data-component="loading-memo"
                              className="columns-4 body-small align-right"
                            >
                              Total
                            </div>
                          </div>
                        </div>

                        <div
                          data-component="loading-memo"
                          className="summary-rows-container"
                        >
                          {new Array(1).fill(null).map(() => {
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
                                {data.map((array) => {
                                  let totalArticleInToStation = 0;
                                  let totalWeightInToStation = 0;
                                  let totalChargeWeightInToStation = 0;
                                  let totalInToStation = 0;
                                  let totalLr = array.length;

                                  array.map((row) => {
                                    let totalArticleInRow =
                                      row.bookingDetails.reduce(
                                        (sum: any, detail: any) =>
                                          sum + detail.article,
                                        0
                                      );

                                    let totalWeightInRow =
                                      row.bookingDetails.reduce(
                                        (sum: any, detail: any) =>
                                          sum + detail.weight,
                                        0
                                      );

                                    let totalChargeWeightInRow =
                                      row.bookingDetails.reduce(
                                        (sum: any, detail: any) =>
                                          sum + detail.chargeWeight,
                                        0
                                      );

                                    totalWeightInToStation += totalWeightInRow;

                                    totalChargeWeightInToStation +=
                                      totalChargeWeightInRow;

                                    totalArticleInToStation +=
                                      totalArticleInRow;

                                    totalInToStation += row.grandTotal
                                      ? row.grandTotal
                                      : 0;
                                  });

                                  const selectedTotal = array.reduce(
                                    (acc, booking) => {
                                      if (booking.paymentType === 1) {
                                        let prevFreightToPay = new Decimal(
                                          acc.totalFreightToPay
                                        );
                                        let freight = new Decimal(
                                          +booking.grandTotal
                                        );
                                        let totalFreightToPay =
                                          +prevFreightToPay.plus(freight);
                                        acc.totalFreightToPay =
                                          totalFreightToPay;
                                      } else if (booking.paymentType === 2) {
                                        let prevFreightPaid = new Decimal(
                                          acc.totalFreightPaid
                                        );
                                        let freight = new Decimal(
                                          +booking.grandTotal
                                        );
                                        let totalFreightPaid =
                                          +prevFreightPaid.plus(freight);
                                        acc.totalFreightPaid = totalFreightPaid;
                                      } else if (booking.paymentType === 3) {
                                        let prevFreightTBB = new Decimal(
                                          acc.totalFreightTBB
                                        );
                                        let freight = new Decimal(
                                          +booking.grandTotal
                                        );
                                        let totalFreightTBB =
                                          +prevFreightTBB.plus(freight);
                                        acc.totalFreightTBB = totalFreightTBB;
                                      }
                                      return acc;
                                    },
                                    {
                                      totalFreightToPay: 0,
                                      totalFreightPaid: 0,
                                      totalFreightTBB: 0,
                                    }
                                  );

                                  const totalVasuli = new Decimal(
                                    +selectedTotal.totalFreightToPay
                                  )
                                    .plus(+selectedTotal.totalFreightPaid)
                                    .plus(+selectedTotal.totalFreightTBB);

                                  grandTotalLrInToStation += totalLr;
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
                                  grandTotalInToStation += totalInToStation;
                                  grandTotalVasuliInToStation += +totalVasuli;

                                  return (
                                    <>
                                      <div
                                        data-component="loading-memo"
                                        className="table-row body-small"
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
                                          data-component="loading-memo"
                                          className="container"
                                        >
                                          <div
                                            data-component="loading-memo"
                                            className="columns-4 body-small"
                                          >
                                            {array[0].toBranch}
                                          </div>
                                          <div
                                            data-component="loading-memo"
                                            className="columns-4 body-small align-center"
                                          >
                                            {totalArticleInToStation}
                                          </div>
                                          <div
                                            data-component="loading-memo"
                                            className="columns-4 body-small align-center"
                                          >
                                            {totalWeightInToStation}
                                          </div>
                                          <div
                                            data-component="loading-memo"
                                            className="columns-4 body-small align-right"
                                          >
                                            {`${(+totalVasuli).toFixed(2)}`}
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  );
                                })}

                                {stockRemainingBookingsSummary.length ===
                                  index + 1 && (
                                  <div
                                    data-component="loading-memo"
                                    className="middle-section"
                                  >
                                    <div
                                      data-component="loading-memo"
                                      className="container table-head"
                                    >
                                      <div
                                        data-component="loading-memo"
                                        className="columns-4 body-small"
                                      >
                                        Total
                                      </div>
                                      <div
                                        data-component="loading-memo"
                                        className="columns-4 body-small align-center"
                                      >
                                        {finalTotalArticle}
                                      </div>
                                      <div
                                        data-component="loading-memo"
                                        className="columns-4 body-small align-center"
                                      >
                                        {finalTotalWeight}
                                      </div>
                                      <div
                                        data-component="loading-memo"
                                        className="columns-4 body-small align-right"
                                      >
                                        {(+finalTotalVasuli).toFixed(2)}
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
                })}
              </>
            )}
        </div>
      )}

      {bookings &&
        regions &&
        bookingBranches &&
        deliveryBranches &&
        userBranchDetails && (
          <div
            data-component="loading-memo"
            className="pdf-container"
            id="stock-transit-prints-container"
          >
            {transitReport.map((page, index) => {
              const pageArray = page.reverse();

              let leftSideBookings = [...pageArray].splice(0, 25);
              let rightSideBookings = [...pageArray].splice(25, 50);

              return (
                <div
                  data-component="loading-memo"
                  className="page transit-print"
                  id={`transit-print-${index}`}
                >
                  <div data-component="loading-memo" className="body-small">
                    Page No.{index + 1}
                  </div>
				  <div data-component="loading-memo" className="head-container">
                  <div data-component="loading-memo" className="logo-container">
                    <img
                      data-component="loading-memo"
                      className="logo"
                      src={Logo}
                    />
                  </div>
                  <div
                    data-component="loading-memo"
                    className="headline title-large"
                  >
                    {company?.companyName ? company?.companyName : "--"}
                    <div
                      data-component="loading-memo"
                      className="body-small"
                      style={{
                        margin: "8px 0 8px 0",
                      }}
                    >
                      {userBranchDetails?.address
                        ? userBranchDetails?.address
                        : "--"}
                    </div>
                    <div data-component="loading-memo" className="body-small">
                      Phone No.:{" "}
                      {userBranchDetails?.phone
                        ? userBranchDetails?.phone
                        : "--"}
                    </div>
                  </div>
				  </div>
                  <div
                    data-component="loading-memo"
                    className="text body-small"
                  >
                    STOCK TRANSIT REPORT
                  </div>
                  <div data-component="loading-memo" className="top-section">
                    <div data-component="loading-memo" className="container">
                      <div data-component="loading-memo" className="columns-2">
                        <div
                          data-component="loading-memo"
                          className="value-container"
                        >
                          <div
                            data-component="loading-memo"
                            className="label body-medium"
                          >
                            Print Time:
                          </div>
                          <div
                            data-component="loading-memo"
                            className="value body-medium"
                          >
                            {format(
                              new Date().toISOString(),
                              "dd-MM-yyyy hh:mm a"
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div data-component="loading-memo" className="middle-section">
                    <div data-component="loading-memo" className="container">
                      <div data-component="loading-memo" className="columns-2">
                        <div
                          data-component="loading-memo"
                          className="container table-head"
                        >
                          <div
                            data-component="loading-memo"
                            className="columns-10 body-small"
                          >
                            Src
                          </div>
                          <div
                            data-component="loading-memo"
                            className="columns-6 body-small align-center"
                          >
                            LR No.
                          </div>
                          <div
                            data-component="loading-memo"
                            className="columns-10 body-small align-center"
                          >
                            Art.
                          </div>
                          <div
                            data-component="loading-memo"
                            className="columns-10 body-small align-center"
                          >
                            Wgt.
                          </div>
                          <div
                            data-component="loading-memo"
                            className="columns-4 body-small align-center"
                          >
                            Pvt.mrk.
                          </div>
                          <div
                            data-component="loading-memo"
                            className="columns-5 body-small align-center"
                          >
                            Bkg.dt.
                          </div>
                          <div
                            data-component="loading-memo"
                            className="columns-6 body-small align-center"
                          >
                            Desti.
                          </div>
                        </div>
                        {leftSideBookings.map((row) => {
                          return (
                            <div
                              data-component="loading-memo"
                              className="container table-row"
                            >
                              <div
                                data-component="loading-memo"
                                className="columns-10 body-small"
                              >
                                {row.fromBranch
                                  ? trimWords(row.fromBranch, 3)
                                  : "--"}
                              </div>
                              <div
                                data-component="loading-memo"
                                className="columns-6 body-small align-center"
                              >
                                {row.lrNumber ? row.lrNumber : "--"}
                              </div>
                              <div
                                data-component="loading-memo"
                                className="columns-10 body-small align-center"
                              >
                                {row.bookingDetails
                                  ? row.bookingDetails.reduce(
                                      (sum: any, detail: any) =>
                                        sum + detail.article,
                                      0
                                    )
                                  : "--"}
                              </div>
                              <div
                                data-component="loading-memo"
                                className="columns-10 body-small align-center"
                              >
                                {row.bookingDetails
                                  ? row.bookingDetails.reduce(
                                      (sum: any, detail: any) =>
                                        sum + detail.weight,
                                      0
                                    )
                                  : "--"}
                              </div>
                              <div
                                data-component="loading-memo"
                                className="columns-4 body-small align-center"
                                style={{
                                  wordBreak: "break-word",
                                }}
                              >
                                {row.privateMark
                                  ? trimWords(row.privateMark, 6)
                                  : "--"}
                              </div>
                              <div
                                data-component="loading-memo"
                                className="columns-5 label-medium align-center"
                                style={{
                                  fontWeight: "700",
                                }}
                              >
                                {row.bookingDate
                                  ? format(row.bookingDate, "dd-MM-yyyy")
                                  : "--"}
                              </div>
                              <div
                                data-component="loading-memo"
                                className="columns-6 body-small align-center"
                                style={{
                                  wordBreak: "break-word",
                                }}
                              >
                                {row.toBranch
                                  ? trimWords(row.toBranch, 3)
                                  : "--"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {rightSideBookings.length !== 0 && (
                        <div
                          data-component="loading-memo"
                          className="columns-2"
                        >
                          <div
                            data-component="loading-memo"
                            className="container table-head"
                          >
                            <div
                              data-component="loading-memo"
                              className="columns-10 body-small"
                            >
                              Src
                            </div>
                            <div
                              data-component="loading-memo"
                              className="columns-6 body-small align-center"
                            >
                              LR No.
                            </div>
                            <div
                              data-component="loading-memo"
                              className="columns-10 body-small align-center"
                            >
                              Art.
                            </div>
                            <div
                              data-component="loading-memo"
                              className="columns-10 body-small align-center"
                            >
                              Wgt.
                            </div>
                            <div
                              data-component="loading-memo"
                              className="columns-4 body-small align-center"
                            >
                              Pvt.mrk.
                            </div>
                            <div
                              data-component="loading-memo"
                              className="columns-5 body-small align-center"
                            >
                              Bkg.dt.
                            </div>
                            <div
                              data-component="loading-memo"
                              className="columns-6 body-small align-center"
                            >
                              Desti.
                            </div>
                          </div>
                          {rightSideBookings.map((row) => {
                            return (
                              <div
                                data-component="loading-memo"
                                className="container table-row"
                              >
                                <div
                                  data-component="loading-memo"
                                  className="columns-10 body-small"
                                >
                                  {row.fromBranch
                                    ? trimWords(row.fromBranch, 3)
                                    : "--"}
                                </div>
                                <div
                                  data-component="loading-memo"
                                  className="columns-6 body-small align-center"
                                >
                                  {row.lrNumber ? row.lrNumber : "--"}
                                </div>
                                <div
                                  data-component="loading-memo"
                                  className="columns-10 body-small align-center"
                                >
                                  {row.bookingDetails
                                    ? row.bookingDetails.reduce(
                                        (sum: any, detail: any) =>
                                          sum + detail.article,
                                        0
                                      )
                                    : "--"}
                                </div>
                                <div
                                  data-component="loading-memo"
                                  className="columns-10 body-small align-center"
                                >
                                  {row.bookingDetails
                                    ? row.bookingDetails.reduce(
                                        (sum: any, detail: any) =>
                                          sum + detail.weight,
                                        0
                                      )
                                    : "--"}
                                </div>
                                <div
                                  data-component="loading-memo"
                                  className="columns-4 body-small align-center"
                                  style={{
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {row.privateMark
                                    ? trimWords(row.privateMark, 6)
                                    : "--"}
                                </div>
                                <div
                                  data-component="loading-memo"
                                  className="columns-5 label-medium align-center"
                                  style={{
                                    fontWeight: "700",
                                  }}
                                >
                                  {row.bookingDate
                                    ? format(row.bookingDate, "dd-MM-yyyy")
                                    : "--"}
                                </div>
                                <div
                                  data-component="loading-memo"
                                  className="columns-6 body-small align-center"
                                  style={{
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {row.toBranch
                                    ? trimWords(row.toBranch, 3)
                                    : "--"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {transitReport.length === index + 1 && (
                    <>
                      <div
                        data-component="loading-memo"
                        className="summary-container"
                        id="transit-report-summary-container"
                      >
                        <div
                          data-component="loading-memo"
                          className="middle-section"
                          style={{
                            margin: "24px 0 0 0",
                          }}
                        >
                          <div
                            data-component="loading-memo"
                            className="container table-head"
                          >
                            <div
                              data-component="loading-memo"
                              className="columns-6 body-small"
                            >
                              To
                            </div>
                            <div
                              data-component="loading-memo"
                              className="columns-12 body-small align-center"
                            >
                              LR
                            </div>
                            <div
                              data-component="loading-memo"
                              className="columns-10 body-small align-center"
                            >
                              Article
                            </div>
                            <div
                              data-component="loading-memo"
                              className="columns-8 body-small align-center"
                            >
                              Actual Weight
                            </div>
                            <div
                              data-component="loading-memo"
                              className="columns-8 body-small align-center"
                            >
                              Charge Weight
                            </div>
                            <div
                              data-component="loading-memo"
                              className="columns-10 body-small align-right"
                            >
                              TOPAY
                            </div>
                            <div
                              data-component="loading-memo"
                              className="columns-10 body-small align-right"
                            >
                              PAID
                            </div>
                            <div
                              data-component="loading-memo"
                              className="columns-10 body-small align-right"
                            >
                              TBB
                            </div>
                            <div
                              data-component="loading-memo"
                              className="columns-10 body-small align-right"
                            >
                              Vasuli
                            </div>
                          </div>
                        </div>

                        <div
                          data-component="loading-memo"
                          className="summary-rows-container"
                          id="transit-report-rows-container"
                        >
                          {new Array(1).fill(null).map(() => {
                            let grandTotalLrInToStation = 0;
                            let grandTotalArticleInToStation = 0;
                            let grandTotalWeightInToStation = 0;
                            let grandTotalChargeWeightInToStation = 0;
                            let grandTotalToPayInToStation = 0;
                            let grandTotalToPaidInToStation = 0;
                            let grandTotalToTBBInToStation = 0;
                            let grandTotalInToStation = 0;
                            let grandTotalVasuliInToStation = 0;

                            const allBookingsToDisplay = [];

                            for (let i = 0; i < transitReport.length; i++) {
                              const thisBookings = transitReport[i];

                              for (let i = 0; i < thisBookings.length; i++) {
                                const bookings = thisBookings[i];
                                allBookingsToDisplay.push(bookings);
                              }
                            }

                            const groupedBookings: {
                              [key: number]: any[];
                            } = {};

                            allBookingsToDisplay.forEach((booking) => {
                              const { toBranchId } = booking;

                              if (!groupedBookings[toBranchId]) {
                                groupedBookings[toBranchId] = [];
                              }

                              groupedBookings[toBranchId].push(booking);
                            });

                            let result: BookingInterface[][] =
                              Object.values(groupedBookings).reverse();

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

                            result = orderByToBranch(result);

                            return (
                              <>
                                {result.map((array) => {
                                  let totalArticleInToStation = 0;
                                  let totalWeightInToStation = 0;
                                  let totalChargeWeightInToStation = 0;
                                  let totalInToStation = 0;
                                  let totalLr = array.length;

                                  array.map((row) => {
                                    let totalArticleInRow =
                                      row.bookingDetails.reduce(
                                        (sum: any, detail: any) =>
                                          sum + detail.article,
                                        0
                                      );

                                    let totalWeightInRow =
                                      row.bookingDetails.reduce(
                                        (sum: any, detail: any) =>
                                          sum + detail.weight,
                                        0
                                      );

                                    let totalChargeWeightInRow =
                                      row.bookingDetails.reduce(
                                        (sum: any, detail: any) =>
                                          sum + detail.chargeWeight,
                                        0
                                      );

                                    totalWeightInToStation += totalWeightInRow;

                                    totalChargeWeightInToStation +=
                                      totalChargeWeightInRow;

                                    totalArticleInToStation +=
                                      totalArticleInRow;

                                    totalInToStation += row.grandTotal
                                      ? row.grandTotal
                                      : 0;
                                  });

                                  const selectedTotal = array.reduce(
                                    (acc, booking) => {
                                      if (booking.paymentType === 1) {
                                        let prevFreightToPay = new Decimal(
                                          acc.totalFreightToPay
                                        );
                                        let freight = new Decimal(
                                          +booking.grandTotal
                                        );
                                        let totalFreightToPay =
                                          +prevFreightToPay.plus(freight);
                                        acc.totalFreightToPay =
                                          totalFreightToPay;
                                      } else if (booking.paymentType === 2) {
                                        let prevFreightPaid = new Decimal(
                                          acc.totalFreightPaid
                                        );
                                        let freight = new Decimal(
                                          +booking.grandTotal
                                        );
                                        let totalFreightPaid =
                                          +prevFreightPaid.plus(freight);
                                        acc.totalFreightPaid = totalFreightPaid;
                                      } else if (booking.paymentType === 3) {
                                        let prevFreightTBB = new Decimal(
                                          acc.totalFreightTBB
                                        );
                                        let freight = new Decimal(
                                          +booking.grandTotal
                                        );
                                        let totalFreightTBB =
                                          +prevFreightTBB.plus(freight);
                                        acc.totalFreightTBB = totalFreightTBB;
                                      }
                                      return acc;
                                    },
                                    {
                                      totalFreightToPay: 0,
                                      totalFreightPaid: 0,
                                      totalFreightTBB: 0,
                                    }
                                  );

                                  const totalVasuli = new Decimal(
                                    +selectedTotal.totalFreightToPay
                                  )
                                    .plus(+selectedTotal.totalFreightPaid)
                                    .plus(+selectedTotal.totalFreightTBB);

                                  grandTotalLrInToStation += totalLr;

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

                                  grandTotalInToStation += totalInToStation;

                                  grandTotalVasuliInToStation += +totalVasuli;

                                  return (
                                    <>
                                      <div
                                        data-component="loading-memo"
                                        className="table-row body-small"
                                        ref={(e) => {
                                          if (e) {
                                            transitReportSummaryRowHeight.current.push(
                                              {
                                                rowHeight: e.offsetHeight,
                                                boookings: array,
                                              }
                                            );
                                          }
                                        }}
                                      >
                                        <div
                                          data-component="loading-memo"
                                          className="container"
                                        >
                                          <div
                                            data-component="loading-memo"
                                            className="columns-6 body-small"
                                          >
                                            {array[0].toBranch}
                                          </div>
                                          <div
                                            data-component="loading-memo"
                                            className="columns-12 body-small align-center"
                                          >
                                            {totalLr}
                                          </div>
                                          <div
                                            data-component="loading-memo"
                                            className="columns-10 body-small align-center"
                                          >
                                            {totalArticleInToStation}
                                          </div>
                                          <div
                                            data-component="loading-memo"
                                            className="columns-8 body-small align-center"
                                          >
                                            {totalWeightInToStation}
                                          </div>
                                          <div
                                            data-component="loading-memo"
                                            className="columns-8 body-small align-center"
                                          >
                                            {totalChargeWeightInToStation}
                                          </div>
                                          <div
                                            data-component="loading-memo"
                                            className="columns-10 body-small align-right"
                                          >
                                            {(+selectedTotal.totalFreightToPay).toFixed(
                                              2
                                            )}
                                          </div>
                                          <div
                                            data-component="loading-memo"
                                            className="columns-10 body-small align-right"
                                          >
                                            {(+selectedTotal.totalFreightPaid).toFixed(
                                              2
                                            )}
                                          </div>
                                          <div
                                            data-component="loading-memo"
                                            className="columns-10 body-small align-right"
                                          >
                                            {(+selectedTotal.totalFreightTBB).toFixed(
                                              2
                                            )}
                                          </div>
                                          <div
                                            data-component="loading-memo"
                                            className="columns-10 body-small align-right"
                                          >
                                            {`${(+totalVasuli).toFixed(2)}`}
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  );
                                })}

                                <div
                                  data-component="loading-memo"
                                  className="middle-section"
                                >
                                  <div
                                    data-component="loading-memo"
                                    className="container table-head"
                                  >
                                    <div
                                      data-component="loading-memo"
                                      className="columns-6 body-small"
                                    >
                                      Total
                                    </div>
                                    <div
                                      data-component="loading-memo"
                                      className="columns-12 body-small align-center"
                                    >
                                      {grandTotalLrInToStation}
                                    </div>
                                    <div
                                      data-component="loading-memo"
                                      className="columns-10 body-small align-center"
                                    >
                                      {grandTotalArticleInToStation}
                                    </div>
                                    <div
                                      data-component="loading-memo"
                                      className="columns-8 body-small align-center"
                                    >
                                      {grandTotalWeightInToStation}
                                    </div>
                                    <div
                                      data-component="loading-memo"
                                      className="columns-8 body-small align-center"
                                    >
                                      {grandTotalChargeWeightInToStation}
                                    </div>
                                    <div
                                      data-component="loading-memo"
                                      className="columns-10 body-small align-right"
                                    >
                                      {(+grandTotalToPayInToStation).toFixed(2)}
                                    </div>
                                    <div
                                      data-component="loading-memo"
                                      className="columns-10 body-small align-right"
                                    >
                                      {(+grandTotalToPaidInToStation).toFixed(
                                        2
                                      )}
                                    </div>
                                    <div
                                      data-component="loading-memo"
                                      className="columns-10 body-small align-right"
                                    >
                                      {(+grandTotalToTBBInToStation).toFixed(2)}
                                    </div>
                                    <div
                                      data-component="loading-memo"
                                      className="columns-10 body-small align-right"
                                    >
                                      {(+grandTotalVasuliInToStation).toFixed(
                                        2
                                      )}
                                    </div>
                                  </div>
                                </div>
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
              transitReportRemainingBookingsSummary.length !== 0 && (
                <>
                  {transitReportRemainingBookingsSummary.map((data, index) => {
                    let finalTotalLr = 0;
                    let finalTotalArticle = 0;
                    let finalTotalWeight = 0;
                    let finalTotalChargeWeight = 0;
                    let finalTotalToPay = 0;
                    let finalTotalToPaid = 0;
                    let finalTotalToTBB = 0;
                    let finalTotalVasuli = 0;

                    for (let i = 0; i < transitReport.length; i++) {
                      const thisBooking = transitReport[i];

                      const totals = thisBooking.reduce(
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

                            let prevChargeWeight = new Decimal(
                              acc.totalChargeWeight
                            );

                            let chargeWeight = new Decimal(
                              +detail.chargeWeight
                            );

                            let totalChargeWeight =
                              +prevChargeWeight.plus(chargeWeight);
                            acc.totalChargeWeight = totalChargeWeight;
                          });

                          if (booking.paymentType === 1) {
                            let prevFreightToPay = new Decimal(
                              acc.totalFreightToPay
                            );
                            let freight = new Decimal(+booking.grandTotal);
                            let totalFreightToPay =
                              +prevFreightToPay.plus(freight);
                            acc.totalFreightToPay = totalFreightToPay;
                          } else if (booking.paymentType === 2) {
                            let prevFreightPaid = new Decimal(
                              acc.totalFreightPaid
                            );
                            let freight = new Decimal(+booking.grandTotal);
                            let totalFreightPaid =
                              +prevFreightPaid.plus(freight);
                            acc.totalFreightPaid = totalFreightPaid;
                          } else if (booking.paymentType === 3) {
                            let prevFreightTBB = new Decimal(
                              acc.totalFreightTBB
                            );
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

                      const totalVasuli = new Decimal(+totals.totalFreightToPay)
                        .plus(+totals.totalFreightPaid)
                        .plus(+totals.totalFreightTBB);

                      finalTotalLr = finalTotalLr + thisBooking.length;
                      finalTotalArticle =
                        finalTotalArticle + totals.totalArticle;
                      finalTotalWeight = finalTotalWeight + totals.totalWeight;
                      finalTotalChargeWeight =
                        finalTotalChargeWeight + totals.totalChargeWeight;
                      finalTotalToPay =
                        finalTotalToPay + totals.totalFreightToPay;
                      finalTotalToPaid =
                        finalTotalToPaid + totals.totalFreightPaid;
                      finalTotalToTBB =
                        finalTotalToTBB + totals.totalFreightTBB;
                      finalTotalVasuli = finalTotalVasuli + +totalVasuli;
                    }

                    return (
                      <div
                        data-component="loading-memo"
                        className="page transit-print"
                      >
                        <div
                          data-component="loading-memo"
                          className="body-small"
                        >
                          Page No.{index + 1}
                        </div>
						<div data-component="loading-memo" className="head-container">
                        <div
                          data-component="loading-memo"
                          className="logo-container"
                        >
                          <img
                            data-component="loading-memo"
                            className="logo"
                            src={Logo}
                          />
                        </div>
                        <div
                          data-component="loading-memo"
                          className="headline title-large"
                        >
                          {company?.companyName ? company?.companyName : "--"}
                          <div
                            data-component="loading-memo"
                            className="body-small"
                            style={{
                              margin: "8px 0 8px 0",
                            }}
                          >
                            {userBranchDetails?.address
                              ? userBranchDetails?.address
                              : "--"}
                          </div>
                          <div
                            data-component="loading-memo"
                            className="body-small"
                          >
                            Phone No.:{" "}
                            {userBranchDetails?.phone
                              ? userBranchDetails?.phone
                              : "--"}
                          </div>
                        </div>
						</div>
                        <div
                          data-component="loading-memo"
                          className="text body-small"
                        >
                          STOCK TRANSIT REPORT
                        </div>
                        <div
                          data-component="loading-memo"
                          className="top-section"
                        >
                          <div
                            data-component="loading-memo"
                            className="container"
                          >
                            <div
                              data-component="loading-memo"
                              className="columns-2"
                            >
                              <div
                                data-component="loading-memo"
                                className="value-container"
                              >
                                <div
                                  data-component="loading-memo"
                                  className="label body-medium"
                                >
                                  Print Time:
                                </div>
                                <div
                                  data-component="loading-memo"
                                  className="value body-medium"
                                >
                                  {format(
                                    new Date().toISOString(),
                                    "dd-MM-yyyy hh:mm a"
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          data-component="loading-memo"
                          className="summary-container"
                        >
                          <div
                            data-component="loading-memo"
                            className="middle-section"
                            style={{
                              margin: "24px 0 0 0",
                            }}
                          >
                            <div
                              data-component="loading-memo"
                              className="container table-head"
                            >
                              <div
                                data-component="loading-memo"
                                className="columns-6 body-small"
                              >
                                To
                              </div>
                              <div
                                data-component="loading-memo"
                                className="columns-12 body-small align-center"
                              >
                                LR
                              </div>
                              <div
                                data-component="loading-memo"
                                className="columns-10 body-small align-center"
                              >
                                Article
                              </div>
                              <div
                                data-component="loading-memo"
                                className="columns-8 body-small align-center"
                              >
                                Actual Weight
                              </div>
                              <div
                                data-component="loading-memo"
                                className="columns-8 body-small align-center"
                              >
                                Charge Weight
                              </div>
                              <div
                                data-component="loading-memo"
                                className="columns-10 body-small align-right"
                              >
                                TOPAY
                              </div>
                              <div
                                data-component="loading-memo"
                                className="columns-10 body-small align-right"
                              >
                                PAID
                              </div>
                              <div
                                data-component="loading-memo"
                                className="columns-10 body-small align-right"
                              >
                                TBB
                              </div>
                              <div
                                data-component="loading-memo"
                                className="columns-10 body-small align-right"
                              >
                                Vasuli
                              </div>
                            </div>
                          </div>

                          <div
                            data-component="loading-memo"
                            className="summary-rows-container"
                          >
                            {new Array(1).fill(null).map(() => {
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
                                  {data.map((array) => {
                                    let totalArticleInToStation = 0;
                                    let totalWeightInToStation = 0;
                                    let totalChargeWeightInToStation = 0;
                                    let totalInToStation = 0;
                                    let totalLr = array.length;

                                    array.map((row) => {
                                      let totalArticleInRow =
                                        row.bookingDetails.reduce(
                                          (sum: any, detail: any) =>
                                            sum + detail.article,
                                          0
                                        );

                                      let totalWeightInRow =
                                        row.bookingDetails.reduce(
                                          (sum: any, detail: any) =>
                                            sum + detail.weight,
                                          0
                                        );

                                      let totalChargeWeightInRow =
                                        row.bookingDetails.reduce(
                                          (sum: any, detail: any) =>
                                            sum + detail.chargeWeight,
                                          0
                                        );

                                      totalWeightInToStation +=
                                        totalWeightInRow;

                                      totalChargeWeightInToStation +=
                                        totalChargeWeightInRow;

                                      totalArticleInToStation +=
                                        totalArticleInRow;

                                      totalInToStation += row.grandTotal
                                        ? row.grandTotal
                                        : 0;
                                    });

                                    const selectedTotal = array.reduce(
                                      (acc, booking) => {
                                        if (booking.paymentType === 1) {
                                          let prevFreightToPay = new Decimal(
                                            acc.totalFreightToPay
                                          );
                                          let freight = new Decimal(
                                            +booking.grandTotal
                                          );
                                          let totalFreightToPay =
                                            +prevFreightToPay.plus(freight);
                                          acc.totalFreightToPay =
                                            totalFreightToPay;
                                        } else if (booking.paymentType === 2) {
                                          let prevFreightPaid = new Decimal(
                                            acc.totalFreightPaid
                                          );
                                          let freight = new Decimal(
                                            +booking.grandTotal
                                          );
                                          let totalFreightPaid =
                                            +prevFreightPaid.plus(freight);
                                          acc.totalFreightPaid =
                                            totalFreightPaid;
                                        } else if (booking.paymentType === 3) {
                                          let prevFreightTBB = new Decimal(
                                            acc.totalFreightTBB
                                          );
                                          let freight = new Decimal(
                                            +booking.grandTotal
                                          );
                                          let totalFreightTBB =
                                            +prevFreightTBB.plus(freight);
                                          acc.totalFreightTBB = totalFreightTBB;
                                        }
                                        return acc;
                                      },
                                      {
                                        totalFreightToPay: 0,
                                        totalFreightPaid: 0,
                                        totalFreightTBB: 0,
                                      }
                                    );

                                    const totalVasuli = new Decimal(
                                      +selectedTotal.totalFreightToPay
                                    )
                                      .plus(+selectedTotal.totalFreightPaid)
                                      .plus(+selectedTotal.totalFreightTBB);

                                    grandTotalLrInToStation += totalLr;
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
                                    grandTotalInToStation += totalInToStation;
                                    grandTotalVasuliInToStation += +totalVasuli;

                                    return (
                                      <>
                                        <div
                                          data-component="loading-memo"
                                          className="table-row body-small"
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
                                            data-component="loading-memo"
                                            className="container"
                                          >
                                            <div
                                              data-component="loading-memo"
                                              className="columns-6 body-small"
                                            >
                                              {array[0].toBranch}
                                            </div>
                                            <div
                                              data-component="loading-memo"
                                              className="columns-12 body-small align-center"
                                            >
                                              {totalLr}
                                            </div>
                                            <div
                                              data-component="loading-memo"
                                              className="columns-10 body-small align-center"
                                            >
                                              {totalArticleInToStation}
                                            </div>
                                            <div
                                              data-component="loading-memo"
                                              className="columns-8 body-small align-center"
                                            >
                                              {totalWeightInToStation}
                                            </div>
                                            <div
                                              data-component="loading-memo"
                                              className="columns-8 body-small align-center"
                                            >
                                              {totalChargeWeightInToStation}
                                            </div>
                                            <div
                                              data-component="loading-memo"
                                              className="columns-10 body-small align-right"
                                            >
                                              {(+selectedTotal.totalFreightToPay).toFixed(
                                                2
                                              )}
                                            </div>
                                            <div
                                              data-component="loading-memo"
                                              className="columns-10 body-small align-right"
                                            >
                                              {(+selectedTotal.totalFreightPaid).toFixed(
                                                2
                                              )}
                                            </div>
                                            <div
                                              data-component="loading-memo"
                                              className="columns-10 body-small align-right"
                                            >
                                              {(+selectedTotal.totalFreightTBB).toFixed(
                                                2
                                              )}
                                            </div>
                                            <div
                                              data-component="loading-memo"
                                              className="columns-10 body-small align-right"
                                            >
                                              {`${(+totalVasuli).toFixed(2)}`}
                                            </div>
                                          </div>
                                        </div>
                                      </>
                                    );
                                  })}

                                  {transitReportRemainingBookingsSummary.length ===
                                    index + 1 && (
                                    <div
                                      data-component="loading-memo"
                                      className="middle-section"
                                    >
                                      <div
                                        data-component="loading-memo"
                                        className="container table-head"
                                      >
                                        <div
                                          data-component="loading-memo"
                                          className="columns-6 body-small"
                                        >
                                          Total
                                        </div>
                                        <div
                                          data-component="loading-memo"
                                          className="columns-12 body-small align-center"
                                        >
                                          {finalTotalLr}
                                        </div>
                                        <div
                                          data-component="loading-memo"
                                          className="columns-10 body-small align-center"
                                        >
                                          {finalTotalArticle}
                                        </div>
                                        <div
                                          data-component="loading-memo"
                                          className="columns-8 body-small align-center"
                                        >
                                          {finalTotalWeight}
                                        </div>
                                        <div
                                          data-component="loading-memo"
                                          className="columns-8 body-small align-center"
                                        >
                                          {finalTotalChargeWeight}
                                        </div>
                                        <div
                                          data-component="loading-memo"
                                          className="columns-10 body-small align-right"
                                        >
                                          {(+finalTotalToPay).toFixed(2)}
                                        </div>
                                        <div
                                          data-component="loading-memo"
                                          className="columns-10 body-small align-right"
                                        >
                                          {(+finalTotalToPaid).toFixed(2)}
                                        </div>
                                        <div
                                          data-component="loading-memo"
                                          className="columns-10 body-small align-right"
                                        >
                                          {(+finalTotalToTBB).toFixed(2)}
                                        </div>
                                        <div
                                          data-component="loading-memo"
                                          className="columns-10 body-small align-right"
                                        >
                                          {(+finalTotalVasuli).toFixed(2)}
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
                  })}
                </>
              )}
          </div>
        )}
    </>
  );
});

// -------------------------------------------------------------------------------------------

export default Stocks;

// -------------------------------------------------------------------------------------------
