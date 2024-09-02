// -------------------------------------------------------------------------------------------

export interface StateInterface {
	stateId: number;
	state: string;
	alphaCode: string;
	gstStateCode: number;
}

export interface RegionInterface {
	regionId?: number;
	region: string;
	companyId?: number;
	isActive?: boolean;
}

export enum BranchType {
	SelectBranch ='',
	BookingBranch = '1',
	DeliveryBranch = '2',
	Both = '3',
}

export enum CommisionType {
	OnCommission = 'ON COMMISSION',
	OwnOffice = 'OWN OFFICE',
}

export interface BranchInterface {
	reverseIndex?: number;
	branchId?: number;
	name: string;
	address: string;
	companyId?: number;
	stateId: number;
	regionId?: number;
	phone: string;
	email: string;
	managerName: string;
	managerPhone: string;
	managerEmail: string;
	isActive: boolean;
	isSubBranch: boolean;
	parentBranchId: number;
	addedBy?: number;
	transporterName?: string;
	transporterPhone?: string;
	commisionType: CommisionType;
	commissionBy: string;
	commissionValue: number;
	ftlValue: number;
	branchCode?: string;
	branchType: BranchType;
	marketingPerson?: string;
	subBranches?: BranchInterface[];
	agentId?: number;
	pincode?: string;
}

// -------------------------------------------------------------------------------------------
