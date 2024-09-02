// -------------------------------------------------------------------------------------------

export interface AgentInterface {
	agentId?: number;
	name: string;
	phoneNumber: string;
	rateType: string;
	rate: number | null;
	isActive: boolean;
	companyId?: number;
	addedBy?: number;
}

// -------------------------------------------------------------------------------------------
