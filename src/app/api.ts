// -------------------------------------------------------------------------------------------

enum Api {
	CreateAgentAsync = '/api/Agent/CreateAgentAsync',
	UpdateAgentAsync = '/api/Agent/UpdateAgentAsync',
	DeleteAgentAsync = '/api/Agent/DeleteAgentAsync',
	GetAllAgentsAsync = '/api/Agent/GetAllAgentsAsync',
	GetAllActiveAgentsAsync = '/api/Agent/GetAllActiveAgentsAsync',

	CreateArticleShapeAsync = '/api/ArticleShape/CreateArticleShapeAsync',
	DeleteArticleShapeAsync = '/api/ArticleShape/DeleteArticleShapeAsync',
	GetArticleShapeAsync = '/api/ArticleShape/GetArticleShapeAsync',
	UpdateArticleShapeAsync = '/api/ArticleShape/UpdateArticleShapeAsync',

	GetBookingTypesAsync = '/api/Booking/GetBookingTypesAsync',
	GetFormTypesAsync = '/api/Booking/GetFormTypesAsync',
	GetNextLRNumberAsync = '/api/Booking/GetNextLRNumberAsync',
	CreateBookingAsync = '/api/Booking/CreateBookingAsync',
	GetBookingDetailsAsync = '/api/Booking/GetBookingDetailsAsync',
	UpdateBookingAsync = '/api/Booking/UpdateBookingAsync',
	DeleteBookingAsync = '/api/Booking/DeleteBookingAsync',
	GetBookingsForLoadingMemoAsync = '/api/Booking/GetBookingsForLoadingMemoAsync',
	GetBookingByLDMNoAsync = '/api/Booking/GetBookingByLDMNoAsync',
	GetBookingForCashMemoAsync = '/api/Booking/GetBookingForCashMemoAsync',

	GetStatesAsync = '/api/Branch/GetStatesAsync',
	GetRegionsAsync = '/api/Branch/GetRegionsAsync',
	GetBookingBranchesAsync = '/api/Branch/GetBookingBranchesAsync',
	GetDeliveryBranchesAsync = '/api/Branch/GetDeliveryBranchesAsync',
	CreateBranchAsync = '/api/Branch/CreateBranchAsync',
	DeleteBranchAsync = '/api/Branch/DeleteBranchAsync',
	UpdateBranchAsync = '/api/Branch/UpdateBranchAsync',
	CreateRegionAsync = '/api/Branch/CreateRegionAsync',
	UpdateRegionAsync = '/api/Branch/UpdateRegionAsync',
	DeleteRegionAsync = '/api/Branch/DeleteRegionAsync',
	GetAllBranchesByCompanyAsync = '/api/Branch/GetAllBranchesByCompanyAsync',
	GetAllActiveBookingBranchesAsync = '/api/Branch/GetAllActiveBookingBranchesAsync',
	GetAllActiveDeliveryBranchesAsync = '/api/Branch/GetAllActiveDeliveryBranchesAsync',
	GetBranchByIdAsync = '/api/Branch/GetBranchByIdAsync',
	GetAllBranches = '/api/Branch/GetAllBranches',

	CreateBranchLRNumberAsync = '/api/BranchLRNumber/CreateBranchLRNumberAsync',
	UpdateBranchLRNumberAsync = '/api/BranchLRNumber/UpdateBranchLRNumberAsync',
	GetAllBranchLRNumbersAsync = '/api/BranchLRNumber/GetAllBranchLRNumbersAsync',
	GetBillTypesAsync = '/api/BranchLRNumber/GetBillTypesAsync',

	GetLdmSequenceAsync = '/api/BranchLRNumber/CreateLSSequenceAsync',
	UpdateLdmSequenceAsync = '/api/BranchLRNumber/UpdateLSSequenceAsync',
	getAllLdmSequencesAsync = '/api/BranchLRNumber/GetAllBranchLSSequenceAsync',


	GetCompanyDetailsByIdAsync = '/api/Company/GetCompanyDetailsByIdAsync',

	CreateGoodsTypesAsync = '/api/GoodsType/CreateGoodsTypesAsync',
	DeleteGoodsTypeAsync = '/api/GoodsType/DeleteGoodsTypeAsync',
	GetGoodsTypeAsync = '/api/GoodsType/GetGoodsTypeAsync',
	UpdateGoodsTypeAsync = '/api/GoodsType/UpdateGoodsTypeAsync',

	CreatePartyAsync = '/api/Party/CreatePartyAsync',
	UpdatePartyAsync = '/api/Party/UpdatePartyAsync',
	DeletePartyAsync = '/api/Party/DeletePartyAsync',
	GetAllConsignorsByCompanyAsync = '/api/Party/GetAllConsignorsByCompanyAsync',
	GetAllConsigneesByCompanyAsync = '/api/Party/GetAllConsigneesByCompanyAsync',
	GetAllActiveConsignorsByCompanyAsync = '/api/Party/GetAllActiveConsignorsByCompanyAsync',
	GetAllActiveConsigneesByCompanyAsync = '/api/Party/GetAllActiveConsigneesByCompanyAsync',
	GetPaymentTypesAsync = '/api/Party/GetPaymentTypesAsync',
	CreateSubPartyAsync = '/api/Party/CreateSubPartyAsync',
	DeleteSubPartyAsync = '/api/Party/DeleteSubPartyAsync',
	GetSubPartyDetailsAsync = '/api/Party/GetSubPartyDetailsAsync',

	CreateQuotationAsync = '/api/Quotation/CreateQuotationAsync',
	UpdateQuotationAsync = '/api/Quotation/UpdateQuotationAsync',
	DeleteQuotationAsync = '/api/Quotation/DeleteQuotationAsync',
	GetQuotationsByPartyAsync = '/api/Quotation/GetQuotationsByPartyAsync',
	GetRateTypeAsync = '/api/Quotation/GetRateTypeAsync',
	CreateCompanyQuotationAsync = '/api/Quotation/CreateCompanyQuotationAsync',
	UpdateCompanyQuotationAsync = '/api/Quotation/UpdateCompanyQuotationAsync',
	DeleteCompanyQuotationAsync = '/api/Quotation/DeleteCompanyQuotationAsync',
	GetCompanyQuotationsByCompanyAsync = '/api/Quotation/GetCompanyQuotationsByCompanyAsync',
	GetCompanyQuotationsByBranchAsync = '/api/Quotation/GetCompanyQuotationsByBranchAsync',

	VerifyUser = '/api/User/VerifyUser',
	RefreshToken = '/api/User/RefreshToken',
	GetUserDeails = '/api/User/GetUserDeails',
	GetCurrentTime = '/api/User/GetCurerntTime',
	GetAllUserByCompany = '/api/User/GetAllUserByCompany',
	CreateUserAsync = '/api/User/CreateUserAsync',
	UpdateUserAsync = '/api/User/UpdateUserAsync',
	DeleteUserAsync = '/api/User/DeleteUserAsync',
	GetUserTypesAsync = '/api/User/GetUserTypesAsync',

	CreateLoadingMemoAsync = '/api/LoadingMemo/CreateLoadingMemoAsync',
	GetNextLDMNoAsync = '/api/LoadingMemo/GetNextLDMNoAsync',
	GetLoadingMemoByLDMNoAsync = '/api/LoadingMemo/GetLoadingMemoByLDMNoAsync',
	CreateHireSlipAsync = '/api/LoadingMemo/CreateHireSlipAsync',
	GetHireSlipAsync = '/api/LoadingMemo/GetHireSlipAsync',
	UpdateLoadingMemoAsync = '/api/LoadingMemo/UpdateLoadingMemoAsync',
	GetUnLoadingMemoByLDMNoAsync = '/api/LoadingMemo/GetUnLoadingMemoByLDMNoAsync',
	UpdateUnloadReportAsync = '/api/LoadingMemo/UpdateUnloadReportAsync',
	GetBankDetailsByTruckNumberAsync = '/api/LoadingMemo/GetBankDetailsByTruckNumberAsync',
	GetReceivableSummaryAsync = '/api/LoadingMemo/GetReceivableSummaryAsync',

	GetNextCashMemoNoAsync = '/api/CashMemo/GetNextCashMemoNoAsync',
	CreateCashMemoAsync = '/api/CashMemo/CreateCashMemoAsync',
	UpdateCashMemoAsync = '/api/CashMemo/UpdateCashMemoAsync',
	DeleteCashMemoAsync = '/api/CashMemo/DeleteCashMemoAsync',
	GetCashMemoByCashMemoNoAsync = '/api/CashMemo/GetCashMemoByCashMemoNoAsync',
	GetCashMemoByLRNumberAsync = '/api/CashMemo/GetCashMemoByLRNumberAsync',

	RecaptchaSiteVerify = '/recaptcha/api/siteverify',

	MastergstAuthentication = 'https://api.mastergst.com/ewaybillapi/v1.03/authenticate',
	GetEwayBillDetails = 'https://api.mastergst.com/ewaybillapi/v1.03/ewayapi/getewaybill',
	GetGSTINdetails = 'https://api.mastergst.com/ewaybillapi/v1.03/ewayapi/getgstindetails',
	GenerateConsolidatedEwaybill = 'https://api.mastergst.com/ewaybillapi/v1.03/ewayapi/gencewb',
	GetConsolidatedEwaybill = 'https://api.mastergst.com/ewaybillapi/v1.03/ewayapi/gettripsheet',

	GetMyIpAddress = 'https://api.ipify.org',
}

// -------------------------------------------------------------------------------------------

export default Api;

// -------------------------------------------------------------------------------------------
