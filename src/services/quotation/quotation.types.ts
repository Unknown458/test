// -------------------------------------------------------------------------------------------

export interface QuotationInterface {
	quotationId?: number;
	billTypeId?: number;
	quotationDate: string;
	fromBranchId: number;
	toBranchId: number;
	fromId?: number;
	partyId: number;
	branchId: number;
	goodsTypeId: number;
	agentId: number;
	shapeId: number;
	rateType: number;
	branchRate: number;
	billRate: number;
	hamaliType: number;
	branchHamali: number;
	billHamali: number;
	branchCollectionCharges: number;
	billCollectionCharges: number;
	branchDoorDeliveryCharges: number;
	billDoorDeliveryCharges: number;
	deliverydays: number;
	isActive: boolean;
	addedBy?: number;
	rate? : number;
}

export interface RateTypeInterface {
	rateTypeId: number;
	rateType: string;
}

export interface CompanyQuotationInterface {
	companyQuotationId?: number;
	fromId: number;
	toId: number;
	goodsTypeId: number;
	shapeId: number;
	rateType: string;
	rate: number;
	billTypeId : number;
	companyId: number;
	userId: number;
}

// -------------------------------------------------------------------------------------------
