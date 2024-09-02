// -------------------------------------------------------------------------------------------

import { createContext, useContext, useState } from 'react';

import {
	getAllActiveAgentsAsync,
	getAllAgentsAsync,
} from '../../services/agent/agent';
import { AgentInterface } from '../../services/agent/agent.types';
import { getArticleShapeAsync } from '../../services/articleShape/articleShape';
import { ArticleShapeInterface } from '../../services/articleShape/articleShape.types';
import {
	getBookingTypesAsync,
	getFormTypesAsync,
} from '../../services/booking/booking';
import {
	BookingTypeInterface,
	FormTypeInterface,
} from '../../services/booking/booking.types';
import {
	getAllActiveBookingBranchesAsync,
	getAllActiveDeliveryBranchesAsync,
	getAllBranchesByCompanyAsync,
	getBookingBranchesAsync,
	getDeliveryBranchesAsync,
	getAllBranches,
	getRegionsAsync,
	getStatesAsync,
} from '../../services/branch/branch';
import {
	BranchInterface,
	RegionInterface,
	StateInterface,
} from '../../services/branch/branch.types';
import {
	getAllBranchLRNumbersAsync,
	getBillTypesAsync,
} from '../../services/branchLrNumber/branchLrNumber';

import { getAllBranchLdmSequence } from '../../services/branchLdmNumber/branchLDMNumber';

import {
	BillTypeInterface,
	BranchLrNumberInterface,
} from '../../services/branchLrNumber/branchLrNumber.types';
import { getCompanyDetailsByIdAsync } from '../../services/company/company';
import { CompanyInterface } from '../../services/company/company.types';
import { getGoodsTypeAsync } from '../../services/goodsType/goodsType';
import { GoodsTypeInterface } from '../../services/goodsType/goodsType.types';
import {
	getAllActiveConsigneesByCompanyAsync,
	getAllActiveConsignorsByCompanyAsync,
	getAllConsigneesByCompanyAsync,
	getAllConsignorsByCompanyAsync,
	getPaymentTypesAsync,
} from '../../services/party/party';
import {
	PartyInterface,
	PaymentTypeInterface,
} from '../../services/party/party.types';
import {
	getCompanyQuotationsByCompanyAsync,
	getRateTypeAsync,
} from '../../services/quotation/quotation';
import {
	CompanyQuotationInterface,
	RateTypeInterface,
} from '../../services/quotation/quotation.types';
import {
	getAllUserByCompanyAsync,
	getUserDetailsAsync,
	getUserTypesAsync,
} from '../../services/user/user';
import {
	UserInterface,
	UserTypeInterface,
} from '../../services/user/user.types';
import addIndex from '../../utils/addIndex';
import { useAuth } from '../Auth/Auth';
import { ApiContextInterface, ApiProviderInterface } from './Api.types';

// -------------------------------------------------------------------------------------------

const ApiContext = createContext<ApiContextInterface | undefined>(undefined);

// -------------------------------------------------------------------------------------------

export const useApi = () => {
	const context = useContext(ApiContext);
	if (!context) {
		throw new Error('useApiContext must be used within an ApiProvider');
	}
	return context;
};

// -------------------------------------------------------------------------------------------

export const ApiProvider = ({ children }: ApiProviderInterface) => {
	const { handleLogout } = useAuth();

	const [allAgents, setAllAgents] = useState<AgentInterface[]>([]);
	const [allActiveAgents, setAllActiveAgents] = useState<AgentInterface[]>(
		[]
	);
	const [articleShapes, setArticleShapes] = useState<ArticleShapeInterface[]>(
		[]
	);
	const [bookingTypes, setBookingTypes] = useState<BookingTypeInterface[]>(
		[]
	);
	const [formTypes, setFormTypes] = useState<FormTypeInterface[]>([]);
	const [states, setStates] = useState<StateInterface[]>([]);
	const [regions, setRegions] = useState<RegionInterface[]>([]);
	const [bookingBranches, setBookingBranches] = useState<BranchInterface[]>(
		[]
	);
	const [deliveryBranches, setDeliveryBranches] = useState<BranchInterface[]>(
		[]
	);
   
	const [allBranches , setAllBranches] = useState<BranchInterface[]>([]);

	const [allBranchesByCompany, setAllBranchesByCompany] = useState<
		BranchInterface[]
	>([]);
	const [_allActiveBookingBranches, setAllActiveBookingBranches] = useState<
		BranchInterface[]
	>([]);
	const [_allActiveDeliveryBranches, setAllActiveDeliveryBranches] = useState<
		BranchInterface[]
	>([]);
	const [allBranchLRNumbers, setAllBranchLRNumbers] = useState<
		BranchLrNumberInterface[]
	>([]);
	const [allBranchLdmSequences, setAllBranchLdmSequences] = useState<
		BranchLrNumberInterface[]
	>([]);
	const [billTypes, setBillTypes] = useState<BillTypeInterface[]>([]);
	const [companyDetailsById, setCompanyDetailsById] =
		useState<CompanyInterface>();
	const [goodsTypes, setGoodsTypes] = useState<GoodsTypeInterface[]>([]);
	const [_allConsignorsByCompany, setAllConsignorsByCompany] = useState<
		PartyInterface[]
	>([]);
	const [_allConsigneesByCompany, setAllConsigneesByCompany] = useState<
		PartyInterface[]
	>([]);
	const [_allActiveConsignorsByCompany, setAllActiveConsignorsByCompany] =
		useState<PartyInterface[]>([]);
	const [_allActiveConsigneesByCompany, setAllActiveConsigneesByCompany] =
		useState<PartyInterface[]>([]);
	const [paymentTypes, setPaymentTypes] = useState<PaymentTypeInterface[]>(
		[]
	);
	const [rateTypes, setRateTypes] = useState<RateTypeInterface[]>([]);
	const [userDetails, setUserDetails] = useState<UserInterface>();
	const [allUserByCompany, setAllUserByCompany] = useState<UserInterface[]>(
		[]
	);
	const [userTypes, setUserTypes] = useState<UserTypeInterface[]>([]);
	const [companyQuotationsByCompany, setCompanyQuotationsByCompany] =
		useState<CompanyQuotationInterface[]>([]);

	const getAllAgents = async () => {
		if (allAgents.length !== 0) {
			return allAgents;
		} else {
			const response = await getAllAgentsAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: AgentInterface[] = addIndex.addIndex4(
					response.data.data.reverse()
				);

				setAllAgents(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};

	const getAllActiveAgents = async () => {
		if (allActiveAgents.length !== 0) {
			return allActiveAgents;
		} else {
			const response = await getAllActiveAgentsAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: AgentInterface[] = addIndex.addIndex2(
					response.data.data.reverse()
				);

				setAllActiveAgents(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};

	const getArticleShapes = async () => {
		if (articleShapes.length !== 0) {
			return articleShapes;
		} else {
			const response = await getArticleShapeAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: ArticleShapeInterface[] = addIndex.addIndex3(
					response.data.data.reverse()
				);

				setArticleShapes(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};

	const getBookingTypes = async () => {
		if (bookingTypes.length !== 0) {
			return bookingTypes;
		} else {
			const response = await getBookingTypesAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: BookingTypeInterface[] = addIndex.addIndex2(
					response.data.data.reverse()
				);

				setBookingTypes(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};

	const getFormTypes = async () => {
		if (formTypes.length !== 0) {
			return formTypes;
		} else {
			const response = await getFormTypesAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: FormTypeInterface[] = addIndex.addIndex2(
					response.data.data.reverse()
				);

				setFormTypes(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};

	const getStates = async () => {
		if (states.length !== 0) {
			return states;
		} else {
			const response = await getStatesAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: StateInterface[] = addIndex.addIndex2(
					response.data.data.reverse()
				);

				setStates(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};

	const getRegions = async () => {
		if (regions.length !== 0) {
			return regions;
		} else {
			const response = await getRegionsAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: RegionInterface[] = addIndex.addIndex3(
					response.data.data.reverse()
				);

				setRegions(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};

	const getBookingBranches = async () => {
		if (bookingBranches.length !== 0) {
			return bookingBranches;
		} else {
			const response = await getBookingBranchesAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: BranchInterface[] = response.data.data.reverse();

				setBookingBranches(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};

	const getDeliveryBranches = async () => {
		if (deliveryBranches.length !== 0) {
			return deliveryBranches;
		} else {
			const response = await getDeliveryBranchesAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: BranchInterface[] = addIndex.addIndex2(
					response.data.data.reverse()
				);

				setDeliveryBranches(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};



	const getAllBranchess = async () =>{
		if(allBranches.length !== 0){
			return allBranches;
		}else{
			const response = await getAllBranches();
			
			if(
				response && typeof response !== 'boolean' 
				&& response.data.status !== 401 
			){
				const data: BranchInterface[] = addIndex.addIndex2(
					response.data.data.reverse()
				);
				setAllBranches(data);
				return data;
			}else{
				handleLogout();
				return[]
			}
		}
	};


	const getAllBranchesByCompany = async () => {
		if (allBranchesByCompany.length !== 0) {
			return allBranchesByCompany;
		} else {
			const response = await getAllBranchesByCompanyAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: BranchInterface[] = addIndex.addIndex2(
					response.data.data.reverse()
				);

				setAllBranchesByCompany(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};

	const getAllActiveBookingBranches = async () => {
		const response = await getAllActiveBookingBranchesAsync();

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: BranchInterface[] = addIndex.addIndex2(
				response.data.data.reverse()
			);

			setAllActiveBookingBranches(data);
			return data;
		} else {
			handleLogout();
			return [];
		}
	};

	const getAllActiveDeliveryBranches = async () => {
		const response = await getAllActiveDeliveryBranchesAsync();

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: BranchInterface[] = addIndex.addIndex2(
				response.data.data.reverse()
			);

			setAllActiveDeliveryBranches(data);
			return data;
		} else {
			handleLogout();
			return [];
		}
	};

	const getAllBranchLdmSequences = async () => {
		if (allBranchLdmSequences.length !== 0) {
			return allBranchLdmSequences;
		} else {
			const response = await getAllBranchLdmSequence();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: BranchLrNumberInterface[] = addIndex.addIndex1(
					response.data.data.reverse()
				);

				setAllBranchLdmSequences(data);
				return data;
			} else {
				// handleLogout();
				return [];
			}
		}
	};


	const getAllBranchLRNumbers = async () => {
		if (allBranchLRNumbers.length !== 0) {
			return allBranchLRNumbers;
		} else {
			const response = await getAllBranchLRNumbersAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: BranchLrNumberInterface[] = addIndex.addIndex1(
					response.data.data.reverse()
				);

				setAllBranchLRNumbers(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};

	const getBillTypes = async () => {
		if (billTypes.length !== 0) {
			return billTypes;
		} else {
			const response = await getBillTypesAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: BillTypeInterface[] = addIndex.addIndex2(
					response.data.data.reverse()
				);

				setBillTypes(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};

	const getCompanyDetailsById = async () => {
		if (companyDetailsById) {
			return companyDetailsById;
		} else {
			const response = await getCompanyDetailsByIdAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: CompanyInterface = response.data.data;

				setCompanyDetailsById(data);
				return data;
			} else {
				handleLogout();
				return {};
			}
		}
	};

	const getGoodsTypes = async () => {
		if (goodsTypes.length !== 0) {
			return goodsTypes;
		} else {
			const response = await getGoodsTypeAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: GoodsTypeInterface[] = addIndex.addIndex3(
					response.data.data.reverse()
				);

				setGoodsTypes(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};

	const getAllConsignorsByCompany = async () => {
		const response = await getAllConsignorsByCompanyAsync();

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: PartyInterface[] = addIndex.addIndex3(
				response.data.data.reverse()
			);

			setAllConsignorsByCompany(data);
			return data;
		} else {
			handleLogout();
			return [];
		}
	};

	const getAllConsigneesByCompany = async () => {
		const response = await getAllConsigneesByCompanyAsync();

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: PartyInterface[] = addIndex.addIndex3(
				response.data.data.reverse()
			);

			setAllConsigneesByCompany(data);
			return data;
		} else {
			handleLogout();
			return [];
		}
	};

	const getAllActiveConsignorsByCompany = async () => {
		const response = await getAllActiveConsignorsByCompanyAsync();

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: PartyInterface[] = addIndex.addIndex2(
				response.data.data.reverse()
			);

			setAllActiveConsignorsByCompany(data);
			return data;
		} else {
			handleLogout();
			return [];
		}
	};

	const getAllActiveConsigneesByCompany = async () => {
		const response = await getAllActiveConsigneesByCompanyAsync();

		if (
			response &&
			typeof response !== 'boolean' &&
			response.data.status !== 401
		) {
			const data: PartyInterface[] = addIndex.addIndex2(
				response.data.data.reverse()
			);

			setAllActiveConsigneesByCompany(data);
			return data;
		} else {
			handleLogout();
			return [];
		}
	};

	const getPaymentTypes = async () => {
		if (paymentTypes.length !== 0) {
			return paymentTypes;
		} else {
			const response = await getPaymentTypesAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: PaymentTypeInterface[] = addIndex.addIndex2(
					response.data.data.reverse()
				);

				setPaymentTypes(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};

	const getRateTypes = async () => {
		if (rateTypes.length !== 0) {
			return rateTypes;
		} else {
			const response = await getRateTypeAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: RateTypeInterface[] = addIndex.addIndex2(
					response.data.data.reverse()
				);

				setRateTypes(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};

	const getUserDetails = async () => {
		if (userDetails) {
			return userDetails;
		} else {
			const response = await getUserDetailsAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: UserInterface = response.data.data;

				setUserDetails(data);
				return data;
			} else {
				handleLogout();
				return {};
			}
		}
	};

	const getAllUserByCompany = async () => {
		if (allUserByCompany.length !== 0) {
			return allUserByCompany;
		} else {
			const response = await getAllUserByCompanyAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: UserInterface[] = addIndex.addIndex3(
					response.data.data.reverse()
				);

				setAllUserByCompany(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};

	const getUserTypes = async () => {
		if (userTypes.length !== 0) {
			return userTypes;
		} else {
			const response = await getUserTypesAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: UserTypeInterface[] = addIndex.addIndex2(
					response.data.data.reverse()
				);

				setUserTypes(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};

	const getCompanyQuotationsByCompany = async () => {
		if (companyQuotationsByCompany.length !== 0) {
			return companyQuotationsByCompany;
		} else {
			const response = await getCompanyQuotationsByCompanyAsync();

			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				const data: CompanyQuotationInterface[] = addIndex.addIndex5(
					response.data.data.reverse()
				);

				setCompanyQuotationsByCompany(data);
				return data;
			} else {
				handleLogout();
				return [];
			}
		}
	};

	return (
		<ApiContext.Provider
			value={{
				getAllAgents,
				getAllActiveAgents,
				getArticleShapes,
				getBookingTypes,
				getFormTypes,
				getStates,
				getRegions,
				getBookingBranches,
				getDeliveryBranches,
				getAllBranchesByCompany,
				getAllActiveBookingBranches,
				getAllActiveDeliveryBranches,
				getAllBranchess,
				getAllBranchLRNumbers,
				getAllBranchLdmSequences,
				getBillTypes,
                getCompanyDetailsById,
				getGoodsTypes,
				getAllConsignorsByCompany,
				getAllConsigneesByCompany,
				getAllActiveConsignorsByCompany,
				getAllActiveConsigneesByCompany,
				getPaymentTypes,
				getRateTypes,
				getUserDetails,
				getAllUserByCompany,
				getUserTypes,
				getCompanyQuotationsByCompany,

				setAllAgents,
				setAllActiveAgents,
				setArticleShapes,
				setBookingTypes,
				setFormTypes,
				setStates,
				setRegions,
				setBookingBranches,
				setDeliveryBranches,
				setAllBranches,
				setAllBranchesByCompany,
				setAllActiveBookingBranches,
				setAllActiveDeliveryBranches,
				setAllBranchLRNumbers,
				setAllBranchLdmSequences,
				setBillTypes,
				setCompanyDetailsById,
				setGoodsTypes,
				setAllConsignorsByCompany,
				setAllConsigneesByCompany,
				setAllActiveConsignorsByCompany,
				setAllActiveConsigneesByCompany,
				setPaymentTypes,
				setRateTypes,
				setUserDetails,
				setAllUserByCompany,
				setUserTypes,
				setCompanyQuotationsByCompany,
			}}
		>
			{children}
		</ApiContext.Provider>
	);
};

// -------------------------------------------------------------------------------------------