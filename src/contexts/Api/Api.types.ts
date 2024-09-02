// -------------------------------------------------------------------------------------------

import { Dispatch, ReactNode, SetStateAction } from 'react';

import { AgentInterface } from '../../services/agent/agent.types';
import { ArticleShapeInterface } from '../../services/articleShape/articleShape.types';
import {
	BookingTypeInterface,
	FormTypeInterface,
} from '../../services/booking/booking.types';
import {
	BranchInterface,
	RegionInterface,
	StateInterface,
} from '../../services/branch/branch.types';
import {
	BillTypeInterface,
	BranchLrNumberInterface,
} from '../../services/branchLrNumber/branchLrNumber.types';
import { CompanyInterface } from '../../services/company/company.types';
import { GoodsTypeInterface } from '../../services/goodsType/goodsType.types';
import {
	PartyInterface,
	PaymentTypeInterface,
} from '../../services/party/party.types';
import {
	CompanyQuotationInterface,
	RateTypeInterface,
} from '../../services/quotation/quotation.types';
import {
	UserInterface,
	UserTypeInterface,
} from '../../services/user/user.types';

// -------------------------------------------------------------------------------------------

export interface ApiContextInterface {
	getAllAgents: () => Promise<AgentInterface[]>;
	getAllActiveAgents: () => Promise<AgentInterface[]>;
	getArticleShapes: () => Promise<ArticleShapeInterface[]>;
	getBookingTypes: () => Promise<BookingTypeInterface[]>;
	getFormTypes: () => Promise<FormTypeInterface[]>;
	getStates: () => Promise<StateInterface[]>;
	getRegions: () => Promise<RegionInterface[]>;
	getBookingBranches: () => Promise<BranchInterface[]>;
	getDeliveryBranches: () => Promise<BranchInterface[]>;
	getAllBranchess: () => Promise<BranchInterface[]>;
	getAllBranchesByCompany: () => Promise<BranchInterface[]>;
	getAllActiveBookingBranches: () => Promise<BranchInterface[]>;
	getAllActiveDeliveryBranches: () => Promise<BranchInterface[]>;
	getAllBranchLRNumbers: () => Promise<BranchLrNumberInterface[]>;
	getAllBranchLdmSequences: () => Promise<BranchLrNumberInterface[]>;
	getBillTypes: () => Promise<BillTypeInterface[]>;
	getCompanyDetailsById: () => Promise<CompanyInterface | any>;
	getGoodsTypes: () => Promise<GoodsTypeInterface[]>;
	getAllConsignorsByCompany: () => Promise<PartyInterface[]>;
	getAllConsigneesByCompany: () => Promise<PartyInterface[]>;
	getAllActiveConsignorsByCompany: () => Promise<PartyInterface[]>;
	getAllActiveConsigneesByCompany: () => Promise<PartyInterface[]>;
	getPaymentTypes: () => Promise<PaymentTypeInterface[]>;
	getRateTypes: () => Promise<RateTypeInterface[]>;
	getUserDetails: () => Promise<UserInterface | any>;
	getAllUserByCompany: () => Promise<UserInterface[]>;
	getUserTypes: () => Promise<UserTypeInterface[]>;
	getCompanyQuotationsByCompany: () => Promise<CompanyQuotationInterface[]>;

	setAllAgents: Dispatch<SetStateAction<AgentInterface[]>>;
	setAllActiveAgents: Dispatch<SetStateAction<AgentInterface[]>>;
	setArticleShapes: Dispatch<SetStateAction<ArticleShapeInterface[]>>;
	setBookingTypes: Dispatch<SetStateAction<BookingTypeInterface[]>>;
	setFormTypes: Dispatch<SetStateAction<FormTypeInterface[]>>;
	setStates: Dispatch<SetStateAction<StateInterface[]>>;
	setRegions: Dispatch<SetStateAction<RegionInterface[]>>;
	setBookingBranches: Dispatch<SetStateAction<BranchInterface[]>>;
	setDeliveryBranches: Dispatch<SetStateAction<BranchInterface[]>>;
	setAllBranches: Dispatch<SetStateAction<BranchInterface[]>>;
	setAllBranchesByCompany: Dispatch<SetStateAction<BranchInterface[]>>;
	setAllActiveBookingBranches: Dispatch<SetStateAction<BranchInterface[]>>;
	setAllActiveDeliveryBranches: Dispatch<SetStateAction<BranchInterface[]>>;
	setAllBranchLRNumbers: Dispatch<SetStateAction<BranchLrNumberInterface[]>>;
	setAllBranchLdmSequences: Dispatch<SetStateAction<BranchLrNumberInterface[]>>;
	setBillTypes: Dispatch<SetStateAction<BillTypeInterface[]>>;
	setCompanyDetailsById: Dispatch<
		SetStateAction<CompanyInterface | undefined>
	>;
	setGoodsTypes: Dispatch<SetStateAction<GoodsTypeInterface[]>>;
	setAllConsignorsByCompany: Dispatch<SetStateAction<PartyInterface[]>>;
	setAllConsigneesByCompany: Dispatch<SetStateAction<PartyInterface[]>>;
	setAllActiveConsignorsByCompany: Dispatch<SetStateAction<PartyInterface[]>>;
	setAllActiveConsigneesByCompany: Dispatch<SetStateAction<PartyInterface[]>>;
	setPaymentTypes: Dispatch<SetStateAction<PaymentTypeInterface[]>>;
	setRateTypes: Dispatch<SetStateAction<RateTypeInterface[]>>;
	setUserDetails: Dispatch<SetStateAction<UserInterface | undefined>>;
	setAllUserByCompany: Dispatch<SetStateAction<UserInterface[]>>;
	setUserTypes: Dispatch<SetStateAction<UserTypeInterface[]>>;
	setCompanyQuotationsByCompany: Dispatch<
		SetStateAction<CompanyQuotationInterface[]>
	>;
}

export interface ApiProviderInterface {
	children: ReactNode;
}

// -------------------------------------------------------------------------------------------