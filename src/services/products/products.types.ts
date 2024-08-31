export interface ProductInterface {
	productId?: number;
	productName: string;
	rateTypeId:number;
	rate: number ;
}


export interface RateTypeInterface {
	rateTypeId: number;
	rateType: string;
}
