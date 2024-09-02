// -------------------------------------------------------------------------------------------

export interface CashMemoInterface {
	cashMemoId?: number;
	cashMemoNo: number;
	bookingId: number;
	lrNumber: number;
	branchId: number;
	deliveryBranchId: number;
	paymentType: string;
	receivable: string;
	documentNo: string;
	deliveredToName: string;
	deliveredToPhone: string;
	remark: string;
	bookingTotal: number;
	labour: number;
	ds: number;
	doorDelivery: number;
	other: number;
	gi: number;
	demurrage: number;
	discount: number;
	total: number;
	companyId: number;
	userId: number;
	cashMemoDate: string;
	stationary: number;
	convCharge: number;
	subTotal?: number;
}

// -------------------------------------------------------------------------------------------
