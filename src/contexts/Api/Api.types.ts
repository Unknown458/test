// -------------------------------------------------------------------------------------------

import { Dispatch, ReactNode, SetStateAction } from 'react';

import { ProductInterface,RateTypeInterface } from '../../services/products/products.types';


// -------------------------------------------------------------------------------------------

export interface ApiContextInterface {
	getProducts: () => Promise<ProductInterface[]>;
	getAllProducts: () => Promise<ProductInterface[]>;
	getRateTypes: () => Promise<RateTypeInterface[]>;
	
	setProduct: Dispatch<SetStateAction<ProductInterface[]>>;
	setRateType: Dispatch<SetStateAction<RateTypeInterface[]>>;
	setAllProducts: Dispatch<SetStateAction<ProductInterface[]>>;

}

export interface ApiProviderInterface {
	children: ReactNode;
}

// -------------------------------------------------------------------------------------------