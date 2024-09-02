// -------------------------------------------------------------------------------------------

export interface BranchLrNumberInterface {
	id?: number;
	branchId: number;
	toBranchId:number;
	regionId: number;
	billTypeId: number;
	minRange: number;
	maxRange: number;
	nextValue: number;
	companyId?: number;
}

export interface BillTypeInterface {
	billTypeId: number;
	billType: string;
}

// -------------------------------------------------------------------------------------------
