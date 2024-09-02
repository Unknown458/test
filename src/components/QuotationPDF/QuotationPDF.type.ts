// -------------------------------------------------------------------------------------------

import { BranchInterface } from '../../services/branch/branch.types';
import { CompanyInterface } from '../../services/company/company.types';
import { GoodsTypeInterface } from '../../services/goodsType/goodsType.types';
import { PartyInterface } from '../../services/party/party.types';
import { QuotationInterface } from '../../services/quotation/quotation.types';

// -------------------------------------------------------------------------------------------

export interface QuotationPDFInterface {
	htmlId: string;
	party: PartyInterface;
	deliveryBranches: BranchInterface[];
	goodsTypes: GoodsTypeInterface[];
	branch: BranchInterface;
	quotations: QuotationInterface[];
	company: CompanyInterface;
}

export interface QuotationPDFdataInterface {
	htmlId: string;
	party: PartyInterface;
	goodsTypes: GoodsTypeInterface[];
	branch: BranchInterface;
	company: CompanyInterface;
}

// -------------------------------------------------------------------------------------------
