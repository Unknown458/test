// -------------------------------------------------------------------------------------------

export interface BookingTypeInterface {
	bookingTypeId: number;
	bookingType: string;
}

export interface FormTypeInterface {
	formTypeId: number;
	formType: string;
}

export interface BookingInterface {
	index?: number;
	billTypeId: number;
	bookingId: number;
	bookingTypeId: number;
	fromBranchId: number;
	toBranchId: number;
	fromBranch: string;
	toBranch: string;
	pinCode : number;
	toBranchPhone?: string;
	exportTo: string;
	lrNumber: number | string;
	bookingDate: string;
	eWayBillNumber: string;
	consignorId: number;
	consignorGST: string;
	consignor: string;
	consignorPhone: string;
	consigneeId: number;
	consigneeGST: string;
	consignee: string;
	consigneePhone: string;
	quotationBy: string;
	paymentType: number;
	goodsTypeId?: number;
	goodsType?: string;
	invoiceNumber: string;
	declaredValue: string;
	privateMark: string;
	goodsReceivedBy: string;
	mode: string;
	note: string;
	freight: number | any;
	lrCharge: number;
	labour: number | any;
	aoc: number;
	collection: number;
	doorDelivery: number;
	oloc: number;
	insurance: number;
	other: number;
	carrierRisk: number;
	bhCharge: number;
	fov: number;
	cartage: number;
	total: number;
	sgst: number;
	cgst: number;
	igst: number;
	grandTotal: number;
	addedBy: number;
	bookingDetails: BookingDetailsInterface[];
	transporterName?: string;
	transporterPhone?: string;
	truckNumber: string;
	dateAdded?: string;
	companyId?: number;
	status?: number;
}
export interface BookingDetailsInterface {
	index?: number;
	bookingDetailId: number | string;
	bookingId: number | string;
	lrNumber?: number | string;
	goodsType: string;
	shape: string;
	articleRateTypeId: number | string;
	article: number | string;
	rate: number | string;
	weight: number | string;
	chargeWeight: number | string;
	labourRateTypeId: number | string;
	labourRate: number | string;
	totalLabour: number | string | any;
	freight: number | string | any;
}

// -------------------------------------------------------------------------------------------
