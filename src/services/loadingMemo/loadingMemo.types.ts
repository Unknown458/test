// -------------------------------------------------------------------------------------------

export interface LoadingMemoInterface {
	loadingMemoId?: number;
	ldmNo: number;
	ldmDate: string;
	regionId: string;
	fromStationId: number;
	toStationId: number;
	truckNo: string;
	driverName: string;
	driverContactNo: string;
	brokerName: string;
	brokerContactNo: string;
	userId: number;
	bookingIds: string;
	companyId?: number;
	gdmUnloadBy?: number;
	unloadDate?: string | null;
	consolidateEWayBillNo?: string;
	totalLR?: number;
	article?: number;
	actualWeight?: number;
	chargeWeight?: number;
	paid?: number;
	toPay?: number;
	tbb?: number;
}

export interface HireSlipInterface {
	hireSlipId?: number;
	loadingMemoId: number;
	hireSlipNo: number;
	boliWeight: number;
	ratePMT: number;
	lorryHire: number;
	halting: number;
	overWeight: number;
	overHeight: number;
	overLength: number;
	localCollection: number;
	doorDelivery: number;
	other1: number;
	advance: number;
	refund: number;
	delayedCharges: number;
	other2: number;
	balanceHire: number;
	userId: number;
	companyId?: number;
	bankName: string;
	partyName: string;
	accountNo: string;
	ifscCode: string;
	bankBranchName: string;
	remark: string;
}

export interface ReceivableSummaryInterface {
	loadingMemoId: number;
	ldmNo: number;
	ldmDate: string;
	regionId: string;
	fromStationId: number;
	toStationId: number;
	truckNo: string;
	driverName: string;
	driverContactNo: string;
	brokerName: string;
	brokerContactNo: string;
	userId: number;
	bookingIds: null;
	companyId?: number;
	gdmUnloadBy: number;
	unloadDate: string;
	consolidateEWayBillNo?: string;
	totalLR: number;
	article: number;
	actualWeight: number;
	chargeWeight: number;
	paid: number;
	toPay: number;
	tbb: number;
}

// -------------------------------------------------------------------------------------------
