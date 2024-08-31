// -------------------------------------------------------------------------------------------

import "./Product.scss";

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

import { AddOutlined, DeleteOutline, EditOutlined } from "@mui/icons-material";
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
  insertProductAsync,
  updateProductAsync,
  deleteProductAsync,
} from "../../../services/products/products";
import { ProductInterface,RateTypeInterface } from "../../../services/products/products.types";
import findObjectInArray from "../../../utils/findObjectInArray";
import addIndex from "../../../utils/addIndex";

// -------------------------------------------------------------------------------------------

const defaultFormData: ProductInterface = { productName: "",rateTypeId: 1, rate: 0 };
const defaultFormErrors = { productName: "",rateTypeId: "", rate: "" };

// -------------------------------------------------------------------------------------------

const Product = memo(() => {
  const { setTitle } = useApp();
  const { handleLogout } = useAuth();
  const { getAllProducts, setAllProducts,getRateTypes} = useApi();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isFormDialogEditMode, setIsFormDialogEditMode] = useState(false);
  const [isFormDialogLoading, setIsFormDialogLoading] = useState(false);
  const [fallbackState, setFallbackState] =
    useState<FallbackStateType>("loading");

  const [products, _setProducts] = useState<ProductInterface[]>([]);
 const [rateTypes,_setRateTypes] = useState<RateTypeInterface[]>([]);
  const [formData, setFormData] = useState<ProductInterface>(defaultFormData);
  const [formErrors, setFormErrors] = useState(defaultFormErrors);
  const [alertDialog, setAlertDialog] = useState<AlertInterface>({
    state: "success",
    label: "",
    isActive: false,
  });

  const theme = useTheme();
  const isDialogFullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    setTitle("Products");
    initialFetch();
  }, [getAllProducts, setTitle]);

  useEffect(() => {
    const updateWindowWidth = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", updateWindowWidth);
    return () => window.removeEventListener("resize", updateWindowWidth);
  }, []);

  const initialFetch = useCallback(async () => {
    const allProductsData = await getAllProducts();
    const rateTypeData = await getRateTypes();

    if (allProductsData.length !== 0 &&
      rateTypeData.length !== 0
    ) {
      _setProducts(allProductsData);
      _setRateTypes(rateTypeData);
      setFallbackState("hidden");
    } else {
      setFallbackState("not-found");
    }
  }, [getAllProducts,getRateTypes]);

  const handleOpenFormDialog = useCallback((data?: ProductInterface) => {
    setIsFormDialogOpen(true);
    if (data) {
      setFormData(data);
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


  useEffect(() => {
    for (const product of products) {
      if (!isFormDialogEditMode) {
        if (
          product.productName === formData.productName &&
          product.rateTypeId === formData.rateTypeId
        ) {
         
          setFormData(() => ({
            ...product,
          }));
          setFormErrors(defaultFormErrors);
          return;
        } else {
        
          setFormData((prev) => ({
            ...prev,
            rate:0
          }));
        }
      }
    }
  }, [formData.productName,formData.rateTypeId]);



  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "rate" ? (value === "" ? null : parseFloat(value)) : value,
    }));

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
    const array = await getAllProducts();
    
    if (!keyword || keyword.trim() === "") {
      _setProducts(array);
      return;
    }
    
    const regex = new RegExp(keyword.trim(), "i");
    const filteredTypes = array.filter((type) => 
      regex.test(type.productName) || regex.test(type.rate.toString())
    );
    
    _setProducts(addIndex.addIndex1(filteredTypes));
  };




  const validateProduct = useCallback((): boolean => {
   

    if (!formData.productName) {
      setFormErrors((prev) =>({ ...prev, productName: "Product name is required." }));
          }
    else {
      setFormErrors((prev) => ({ ...prev, productName: "" }));
    }

    if (!formData.rateTypeId) {
      setFormErrors((prev) =>({ ...prev, rateTypeId: "Rate Type is required." }));
          }
    else {
      setFormErrors((prev) => ({ ...prev, rateTypeId: "" }));
    }

    if ( !formData.rate) {
      setFormErrors((prev) =>({ ...prev, rate: "rate is required." }));
    }
    else {
      setFormErrors((prev) => ({ ...prev, rate: "" }));
    }
  
    if(
formData.productName &&
formData.productName !== "" &&
formData.rateTypeId &&
formData.rateTypeId !== 0 &&
formData.rate &&
formData.rate !== 0

    ){
      return true
    }
    else{
      return false
    }
    
  }, [formData]);

  const handleCreateGoodsType = useCallback(async () => {
    if (!validateProduct()) return;

    const data = { ...formData };
    console.log(data);
    setIsFormDialogLoading(true);
    try {
      const response = await insertProductAsync(data);
      if (
        response &&
        typeof response !== "boolean" &&
        response.data.status !== 401
      ) {
        if (response.data.status === 200) {
          const newProduct: ProductInterface = {
            ...formData,

            productId: response.data.data,
          };
          _setProducts((prev) => addIndex.addIndex1([newProduct, ...prev]));
          handleCloseFormDialog();
          handleOpenAlertDialog("success", "Created new Product.");
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
    validateProduct,
    handleCloseFormDialog,
    handleOpenAlertDialog,
    handleLogout,
    setAllProducts,
  ]);

  const handleUpdateGoodsType = useCallback(async () => {
    if (!validateProduct()) return;

    const data = { ...formData };

    setIsFormDialogLoading(true);
    try {
      const response = await updateProductAsync(data);
      if (
        response &&
        typeof response !== "boolean" &&
        response.data.status !== 401
      ) {
        if (response.data.status === 200) {
          const updatedGoodsTypes = products.map((obj) =>
            obj.productId === formData.productId ? data : obj
          );

          _setProducts(addIndex.addIndex1(updatedGoodsTypes));
          handleCloseFormDialog();
          handleOpenAlertDialog("success", "Updated Product.");
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
    validateProduct,
    handleCloseFormDialog,
    handleOpenAlertDialog,
    handleLogout,
    products,
    setAllProducts,
  ]);

  const handleDeleteGoodsType = useCallback(
    async (data: ProductInterface) => {
      const confirm = window.confirm(
        `Are you sure you want to delete Product '${data.productName}'?`
      );
      if (!confirm) return;

      const productId = data.productId as number;

      try {
        const response = await deleteProductAsync(productId);
        if (
          response &&
          typeof response !== "boolean" &&
          response.data.status !== 401
        ) {
          if (response.data.status === 200) {
            const updatedProduct = products.filter(
              (obj) => obj.productId !== productId
            );
            setAllProducts(addIndex.addIndex1(updatedProduct));
            handleOpenAlertDialog("success", "Deleted Product.");
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
    [products, handleLogout, handleOpenAlertDialog, setAllProducts]
  );

  const columns = useMemo<MRT_ColumnDef<ProductInterface>[]>(
    () => [
      {
        accessorKey: "index",
        header: "#",
        enableResizing: false,
        size: 0,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
      },
      {
        accessorKey: "productName",
        header: "Product Name",
        enableResizing: true,
        size: 50,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
      },
      {
        accessorKey: "rateTypeId",
        header: "Rate Type",
        enableResizing: true,
        size: 50,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
        muiTableFooterCellProps: { align: "left" },
        accessorFn: (row) =>
          `${
            findObjectInArray(rateTypes, "rateTypeId", row.rateTypeId).rateType || "—"
          }`,
      },
      {
        accessorKey: "rate",
        header: "Rate",
        enableResizing: true,
        size: 50,
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
            <Tooltip title="Delete Product">
              <IconButton onClick={() => handleDeleteGoodsType(row.original)}>
                <DeleteOutline />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Product">
              <IconButton onClick={() => handleOpenFormDialog(row.original)}>
                <EditOutlined />
              </IconButton>
            </Tooltip>
          </>
        ),
      },
    ],
    [handleDeleteGoodsType, handleOpenFormDialog]
  );

  const table = useMaterialReactTable({
    columns,
    data: products,
    filterFromLeafRows: true,
    paginateExpandedRows: false,
    enableColumnResizing: true,
    enablePagination: true,
    layoutMode: "grid",
    enableDensityToggle: false,
    initialState: {
      pagination: { pageSize: 100, pageIndex: 0 },
      density: "compact",
      sorting: [{ id: "productName", desc: false }],
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
      <div data-component="goods-types" className="container">
        <div data-component="goods-types" className="top">
          <Search
            onChange={handleSearch}
            isDisabled={fallbackState !== "hidden"}
          />
          {windowWidth > 600 && (
            <Tooltip title="Create New Product">
              <Fab
                variant="extended"
                color="primary"
                data-component="goods-types"
                className="fab"
                onClick={() => handleOpenFormDialog()}
              >
                <AddOutlined />
                Create new
              </Fab>
            </Tooltip>
          )}
        </div>
        <div data-component="goods-types" className="bottom">
          {fallbackState !== "hidden" ? (
            <Fallback state={fallbackState} />
          ) : (
            <div data-component="goods-types" className="table-container">
              <MaterialReactTable table={table} />
            </div>
          )}
        </div>
      </div>

      {windowWidth < 600 && (
        <div data-component="goods-types" className="fab-container">
          <Tooltip title="Create New Product">
            <Fab
              variant="extended"
              color="primary"
              data-component="goods-types"
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
        data-component="goods-types"
        className="dialog"
      >
        <DialogTitle>
          {!isFormDialogEditMode ? "Create New Product" : "Edit Product"}
        </DialogTitle>
        <DialogContent data-component="goods-types" className="dialog-content">
          <div data-component="goods-types" className="container">
            <div data-component="goods-types" className="columns-3">
              <FormControl
                size="medium"
                variant="outlined"
                fullWidth
                error={formErrors.productName ? true : false}
                disabled={isFormDialogLoading}
                margin="dense"
              >
                <InputLabel htmlFor="product-name">Product</InputLabel>
                <OutlinedInput
                  label="Product Name"
                  id="product-name"
                  type="text"
                  name="productName"
                  value={formData.productName ? formData.productName : ""}
                  onChange={handleChange}
                 
                />
                {formErrors.productName && (
                  <FormHelperText>{formErrors.productName}</FormHelperText>
                )}
              </FormControl>
            </div>
            <div data-component="goods-types" className="columns-3">
              <FormControl
                size="medium"
                variant="outlined"
                fullWidth
                error={formErrors.rateTypeId ? true : false}
                disabled={isFormDialogLoading}
                margin="dense"
              >
                <InputLabel htmlFor="rate-type">Rate Type</InputLabel>
                <Select
                  label="Rate Type"
                  id="rate-type"
                   value={formData.rateTypeId ? formData?.rateTypeId : ""}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      rateTypeId: e.target.value as number,
                    }));
                  }}
                 
                >
                  
                  {
                    rateTypes
                   
                    .map((type) => {
                      return (
                        <MenuItem
                        key={`rate-type-${type.rateTypeId}`}
                        value={type.rateTypeId as number}
                        >
                        {type.rateType}
                        </MenuItem>
                      )
                    })
                  }

                </Select>
                {formErrors.rateTypeId && (
                  <FormHelperText>{formErrors.rateTypeId}</FormHelperText>
                )}
              </FormControl>
            </div>
            <div data-component="goods-types" className="columns-3">
              <FormControl
                size="medium"
                disabled={isFormDialogLoading}
                variant="outlined"
                fullWidth
                margin="dense"
                error={formErrors.rate ? true : false}
              >
                <InputLabel htmlFor="product-rate">Rate</InputLabel>
                <OutlinedInput
                  label="Rate"
                  id="product-rate"
                  type="number"
                  value={formData.rate ? formData.rate : ""}
                  name="rate"
                  onChange={handleChange}
                 
                />
                {formErrors.rate && (
                  <FormHelperText error>{formErrors.rate}</FormHelperText>
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
                ? handleCreateGoodsType
                : handleUpdateGoodsType
            }
            loading={isFormDialogLoading}
            type="submit"
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

export default Product;

// -------------------------------------------------------------------------------------------
