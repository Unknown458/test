// -------------------------------------------------------------------------------------------

export interface VerifyUserInterface {
	username: string;
	password: string;
	companyCode: string;
}

export interface AuthTokensInterface {
	accessToken: string;
	accessTokenExpiry: string;
	refreshToken: string;
	refreshTokenExpiry: string;
}

export interface UserInterface {
	index?: number;
	userId?: number;
	userName: string;
	Password?: string;
	confirmPassword?: string;
	fullName: string;
	userTypeId: number;
	phone: string;
	email: string;
	branchId: number;
	isActive: boolean;
	companyId: number;
	aadharNo: string;
	panNo: string;
	address: string;
	joiningDate: string;
	salary: number;
	addedBy: number;
	loginByOTP: boolean;
	displayEstimate?: boolean;
}

export interface UserTypeInterface {
	userTypeId: number;
	userType: string;
	isActive: boolean;
}

// -------------------------------------------------------------------------------------------
