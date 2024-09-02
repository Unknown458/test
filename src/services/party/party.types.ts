// -------------------------------------------------------------------------------------------

export interface PartyInterface {
	index?: number;
	partyId?: number;
	partyName: string;
	gstNo: string;
	address: string;
	branchId: number;
	watsappNo: string;
	phoneNo: string;
	contactPerson: string;
	comments: string;
	quotationComment: string;
	headerText: string;
	botttomText: string;
	paymentTypeId: number;
	biltyCharge: number;
	carting: number;
	commission: number;
	partyType: number;
	isActive: boolean;
	addedBy?: number;
	companyId?: number;
	billTypeId: number;
	marketingPerson: string;
}

export interface SubPartyInterface {
	subPartyDetailId?: number;
	partyId: number;
	subPartyId: number;
	isActive: boolean;
	addedBy?: number;
}

export interface PaymentTypeInterface {
	paymentTypeId: number;
	paymentType: string;
	isActive: boolean;
}

// -------------------------------------------------------------------------------------------
