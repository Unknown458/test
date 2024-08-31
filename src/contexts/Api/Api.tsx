// -------------------------------------------------------------------------------------------

import { createContext, useContext, useState } from 'react';

import {getAllProductsAsync,getProduct} from '../../services/products/products';
import {ProductInterface,RateTypeInterface} from '../../services/products/products.types';
import {getRateTypeAsync} from '../../services/products/products'

import addIndex from '../../utils/addIndex';
import { useAuth } from '../Auth/Auth';
import { ApiContextInterface, ApiProviderInterface } from './Api.types';

// -------------------------------------------------------------------------------------------

const ApiContext = createContext<ApiContextInterface | undefined>(undefined);

// -------------------------------------------------------------------------------------------

export const useApi = () => {
	const context = useContext(ApiContext);
	if (!context) {
		throw new Error('useApiContext must be used within an ApiProvider');
	}
	return context;
};

// -------------------------------------------------------------------------------------------

export const ApiProvider = ({ children }: ApiProviderInterface) => {
	const { handleLogout } = useAuth();

	const [product, setProduct] = useState<ProductInterface[]>([]);
	const [AllProducts, setAllProducts] = useState<ProductInterface[]>([]);
	const [rateType,setRateType] = useState<RateTypeInterface[]>([]);

		
	const getProducts = async () => {
		if(product.length !== 0){
			return product
		}
		else{
			const response  = await getProduct();
			if(
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401 
			){
				const data: ProductInterface[] = addIndex.addIndex1(
					response.data.data.reverse()
				);
				setProduct(data);
				return data;
			}else{
				handleLogout();
				return [];
			}
		}
	};

	const getAllProducts = async () => {
		if(AllProducts.length !== 0){
			return AllProducts
		}
		else{
			const response  = await getAllProductsAsync();
			if(
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401 
			){
				const data: ProductInterface[] = (
					response.data.data
				);
				const sortedProducts = data.sort((a, b) => {
					if (a.productName < b.productName) {
					  return -1;
					}
					if (a.productName > b.productName) {
					  return 1;
					}
					return 0;
				  });
				 const indexData = addIndex.addIndex1(sortedProducts)
				setAllProducts(indexData);
				return data;
			}else{
				handleLogout();
				return [];
			}
		}
	};


	const getRateTypes = async () => {
		if (rateType.length !== 0) {
			return rateType;
		} else {
			const response = await getRateTypeAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: RateTypeInterface[] = addIndex.addIndex1(
					response.data.data
				);

				setRateType(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};



	return (
		<ApiContext.Provider
			value={{
				getProducts,
				getAllProducts,
				getRateTypes,

				setRateType,
				setProduct,
				setAllProducts
			}}
		>
			{children}
		</ApiContext.Provider>
	);
};

// -------------------------------------------------------------------------------------------