// -------------------------------------------------------------------------------------------

const masterGstErrorCodes: { errorCode: number; message: string }[] = [
	{ errorCode: 100, message: 'Invalid Json' },
	{ errorCode: 101, message: 'Invalid Username' },
	{ errorCode: 102, message: 'Invalid Password' },
	{ errorCode: 103, message: 'Invalid Client-Id' },
	{ errorCode: 104, message: 'Invalid Client-Id' },
	{ errorCode: 105, message: 'Invalid Token' },
	{ errorCode: 106, message: 'Token Expired' },
	{
		errorCode: 107,
		message: 'Authentication failed. Pls. inform the helpdesk',
	},
	{ errorCode: 108, message: 'Invalid login credentials.' },
	{ errorCode: 109, message: 'Decryption of data failed' },
	{ errorCode: 110, message: 'Invalid Client-ID/Client-Secret' },
	{ errorCode: 111, message: 'GSTIN is not registered to this GSP' },
	{ errorCode: 112, message: 'IMEI does not belong to the user' },
	{ errorCode: 113, message: 'os-type is mandatory in header' },
	{ errorCode: 201, message: 'Invalid Supply Type' },
	{ errorCode: 202, message: 'Invalid Sub-supply Type' },
	{
		errorCode: 203,
		message: 'Sub-transaction type does not belongs to transaction type',
	},
	{ errorCode: 204, message: 'Invalid Document type' },
	{
		errorCode: 205,
		message:
			'Document type does not match with transaction & Sub trans type',
	},
	{ errorCode: 206, message: 'Invalid Invoice Number' },
	{ errorCode: 207, message: 'Invalid Invoice Date' },
	{ errorCode: 208, message: 'Invalid Supplier GSTIN' },
	{ errorCode: 209, message: 'Blank Supplier Address' },
	{ errorCode: 210, message: 'Invalid or Blank Supplier PIN Code' },
	{ errorCode: 211, message: 'Invalid or Blank Supplier state Code' },
	{ errorCode: 212, message: 'Invalid Consignee GSTIN' },
	{ errorCode: 213, message: 'Invalid Consignee Address' },
	{ errorCode: 214, message: 'Invalid Consignee PIN Code' },
	{ errorCode: 215, message: 'Invalid Consignee State Code' },
	{ errorCode: 216, message: 'Invalid HSN Code' },
	{ errorCode: 217, message: 'Invalid UQC Code' },
	{ errorCode: 218, message: 'Invalid Tax Rate for Intra State Transaction' },
	{ errorCode: 219, message: 'Invalid Tax Rate for Inter State Transaction' },
	{ errorCode: 220, message: 'Invalid Trans mode' },
	{ errorCode: 221, message: 'Invalid Approximate Distance' },
	{ errorCode: 222, message: 'Invalid Transporter Id' },
	{ errorCode: 223, message: 'Invalid Transaction Document Number' },
	{ errorCode: 224, message: 'Invalid Transaction Date' },
	{ errorCode: 225, message: 'Invalid Vehicle Number Format' },
	{ errorCode: 226, message: 'Both Transaction and Vehicle Number Blank' },
	{ errorCode: 227, message: 'User Gstin cannot be blank' },
	{ errorCode: 228, message: 'User id cannot be blank' },
	{ errorCode: 229, message: 'Supplier name is required' },
	{ errorCode: 230, message: 'Supplier place is required' },
	{ errorCode: 231, message: 'Consignee name is required' },
	{ errorCode: 232, message: 'Consignee place is required' },
	{ errorCode: 233, message: 'Eway bill does not contains any items' },
	{ errorCode: 234, message: 'Total amount/Taxable amount is mandatory' },
	{
		errorCode: 235,
		message: 'Tax rates for Intra state transaction is blank',
	},
	{
		errorCode: 236,
		message: 'Tax rates for Inter-state transaction is blank',
	},
	{ errorCode: 237, message: 'Invalid client -Id/client-secret' },
	{ errorCode: 238, message: 'Invalid auth token' },
	{ errorCode: 239, message: 'Invalid action' },
	{
		errorCode: 240,
		message: 'Could not generate eway bill, pls contact helpdesk',
	},
	{ errorCode: 242, message: 'Invalid or Blank Officer StateCode' },
	{ errorCode: 243, message: 'Invalid or Blank IR Number' },
	{
		errorCode: 244,
		message: 'Invalid or Blank Actual Vehicle Number Format',
	},
	{ errorCode: 245, message: 'Invalid Verification Date Format' },
	{ errorCode: 246, message: 'Invalid Vehicle Release Date Format' },
	{ errorCode: 247, message: 'Invalid Verification Time Format' },
	{ errorCode: 248, message: 'Invalid Vehicle Release Date Format' },
	{
		errorCode: 249,
		message: 'Actual Value cannot be less than or equal to zero',
	},
	{ errorCode: 250, message: 'Invalid Vehicle Release Date Format' },
	{ errorCode: 251, message: 'CGST nad SGST TaxRate should be same' },
	{ errorCode: 252, message: 'Invalid CGST Tax Rate' },
	{ errorCode: 253, message: 'Invalid SGST Tax Rate' },
	{ errorCode: 254, message: 'Invalid IGST Tax Rate' },
	{ errorCode: 255, message: 'Invalid CESS Rate' },
	{ errorCode: 256, message: 'Invalid Cess Non Advol value' },
	{
		errorCode: 278,
		message: 'User Gstin does not match with Transporter Id',
	},
	{ errorCode: 280, message: 'Status is not ACTIVE' },
	{
		errorCode: 281,
		message:
			'Eway Bill is already expired hence update transporter is not allowed',
	},
	{ errorCode: 301, message: 'Invalid eway bill number' },
	{ errorCode: 302, message: 'Invalid transporter mode' },
	{ errorCode: 303, message: 'Vehicle number is required' },
	{ errorCode: 304, message: 'Invalid vehicle format' },
	{ errorCode: 305, message: 'Place from is required' },
	{ errorCode: 306, message: 'Invalid from state' },
	{ errorCode: 307, message: 'Invalid reason' },
	{ errorCode: 308, message: 'Invalid remarks' },
	{
		errorCode: 309,
		message: 'Could not update vehicle details, pl contact helpdesk',
	},
	{
		errorCode: 311,
		message: 'Validity period lapsed, you cannot update vehicle details',
	},
	{
		errorCode: 312,
		message: 'This eway bill is either not generated by you or cancelled',
	},
	{
		errorCode: 313,
		message: 'Error in validating ewaybill for vehicle updation',
	},
	{
		errorCode: 315,
		message: 'Validity period lapsed, you cannot cancel this eway bill',
	},
	{
		errorCode: 316,
		message: 'Eway bill is already verified, you cannot cancel it',
	},
	{
		errorCode: 317,
		message: 'Could not cancel eway bill, please contact helpdesk',
	},
	{ errorCode: 320, message: 'Invalid state to' },
	{ errorCode: 321, message: 'Invalid place to' },
	{ errorCode: 322, message: 'Could not generate consolidated eway bill' },
	{ errorCode: 325, message: 'Could not retrieve data' },
	{
		errorCode: 326,
		message: 'Could not retrieve GSTIN details for the given GSTIN number',
	},
	{ errorCode: 327, message: 'Could not retrieve data from hsn' },
	{
		errorCode: 328,
		message: 'Could not retrieve transporter details from gstin',
	},
	{ errorCode: 329, message: 'Could not retrieve States List' },
	{ errorCode: 330, message: 'Could not retrieve UQC list' },
	{ errorCode: 331, message: 'Could not retrieve Error code' },
	{ errorCode: 334, message: 'Could not retrieve user details by userid' },
	{ errorCode: 336, message: 'Could not retrieve transporter data by gstin' },
	{
		errorCode: 337,
		message: 'Could not retrieve HSN details for the given HSN number',
	},
	{
		errorCode: 338,
		message:
			'You cannot update transporter details, as the current tranporter is already entered Part B details of the eway bil',
	},
	{
		errorCode: 339,
		message:
			'You are not assigned to update the tranporter details of this eway bill',
	},
	{
		errorCode: 341,
		message:
			'This e-way bill is generated by you and hence you cannot reject it',
	},
	{
		errorCode: 342,
		message:
			'You cannot reject this e-way bill as you are not the other party to do so',
	},
	{ errorCode: 343, message: 'E-way bill is already rejected' },
	{ errorCode: 344, message: 'Invalid sub-user name' },
	{ errorCode: 345, message: 'Invalid sub-user id' },
	{ errorCode: 346, message: 'Could not get the report' },
	{ errorCode: 347, message: 'Report name is not present' },
	{ errorCode: 348, message: 'Invalid Device Id' },
	{
		errorCode: 349,
		message:
			'Vehicle number is already verified hence you cannot update this vehicle number',
	},
	{
		errorCode: 351,
		message:
			'You cannot extend the validity of this eway bill as it is already expired',
	},
	{ errorCode: 352, message: 'Could not extend the validity of eway bill' },
	{ errorCode: 353, message: 'Could not update Part B of the eway bill' },
	{ errorCode: 354, message: 'Could not cancel this eway bill' },
	{
		errorCode: 355,
		message: 'Validity of the consolidated eway bill cannot be extended',
	},
	{ errorCode: 401, message: 'No Data Found' },
	{ errorCode: 402, message: 'No eWay bill exists with this number' },
	{ errorCode: 501, message: 'Invalid OTP' },
	{ errorCode: 502, message: 'OTP Expired' },
	{ errorCode: 503, message: 'Internal server error. Pls. contact helpdesk' },
	{ errorCode: 504, message: 'OTP limit exceeded' },
	{ errorCode: 505, message: 'OTP already verified' },
	{ errorCode: 507, message: 'Error while verifying OTP' },
	{ errorCode: 601, message: 'Invalid Officer login Id' },
	{ errorCode: 602, message: 'Invalid vehicle release remarks' },
	{ errorCode: 604, message: 'Invalid Detain Status' },
	{ errorCode: 605, message: 'Invalid Vehicle Release Status' },
	{ errorCode: 606, message: 'Invalid Doc Number' },
	{ errorCode: 607, message: 'Invalid Doc Date' },
	{ errorCode: 701, message: 'File does not exist' },
	{ errorCode: 702, message: 'Data File does not exist' },
	{ errorCode: 703, message: 'Error in decrypting the file' },
	{ errorCode: 704, message: 'Internal server error' },
	{ errorCode: 705, message: 'Checksum mismatch' },
	{ errorCode: 706, message: 'IRN is not applicable' },
	{
		errorCode: 801,
		message: "Only e-way bills of 'CS' type can be generated",
	},
	{ errorCode: 802, message: 'Invalid HSN code' },
	{
		errorCode: 803,
		message: 'Vehicle Number is required for consolidated eway bill',
	},
	{ errorCode: 804, message: 'Vehicle number already updated' },
	{ errorCode: 805, message: 'No eway bills to consolidate' },
	{ errorCode: 806, message: 'Invalid Document Date' },
	{ errorCode: 807, message: 'Invalid EWB Number' },
	{
		errorCode: 1000,
		message: 'Exception occurred while generating eway bill',
	},
	{ errorCode: 1001, message: 'Exception occurred while updating eway bill' },
	{
		errorCode: 1002,
		message: 'Exception occurred while cancelling eway bill',
	},
	{
		errorCode: 1003,
		message: 'Exception occurred while updating the vehicle details',
	},
	{ errorCode: 1004, message: 'Invalid HSN Code. Please update' },
];

// -------------------------------------------------------------------------------------------

export default masterGstErrorCodes;

// -------------------------------------------------------------------------------------------
