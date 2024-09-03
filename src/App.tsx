// -------------------------------------------------------------------------------------------

import './styles/animation.scss';
import './styles/color.scss';
import './styles/elevation.scss';
import './styles/global.scss';
import './styles/layout.scss';
import './styles/motion.scss';
import './styles/shape.scss';
import './styles/scroll.scss';
import './styles/typography.scss';
import './styles/gradients.scss';

import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { ThemeProvider } from '@mui/material';

import RouterPath from './app/routerPath';
import theme from './app/theme';
import OfflineAlert from './components/OfflineAlert/OfflineAlert';
import Private from './containers/Private/Private';
import Public from './containers/Public/Public';
import { AppProvider } from './contexts/App/App';
import { AuthProvider } from './contexts/Auth/Auth';
import Agents from './screens/private/Agents/Agents';
import ArticleShapes from './screens/private/ArticleShapes/ArticleShapes';
import Booking from './screens/private/Booking/Booking';
import BookingBranches from './screens/private/BookingBranches/BookingBranches';
import CashMemo from './screens/private/CashMemo/CashMemo';
import CompanyQuotation from './screens/private/CompanyQuotation/CompanyQuotation';
import Consignees from './screens/private/Consignees/Consignees';
import Consignors from './screens/private/Consignors/Consignors';
import Dashboard from './screens/private/Dashboard/Dashboard';
import DeliveryBranches from './screens/private/Branches/Branches';
import GoodsTypes from './screens/private/GoodsTypes/GoodsTypes';
import HireSlip from './screens/private/HireSlip/HireSlip';
import ImportLoadingMemo from './screens/private/ImportLoadingMemo/ImportLoadingMemo';
import LoadingMemo from './screens/private/LoadingMemo/LoadingMemo';
import LrSequence from './screens/private/LrSequence/LrSequence';
import NotFound from './screens/private/NotFound/NotFound';
import Quotations from './screens/private/Quotations/Quotations';
import ReceivableSummary from './screens/private/ReceivableSummary/ReceivableSummary';
import Regions from './screens/private/Regions/Regions';
import Stocks from './screens/private/Stocks/Stocks';
import Users from './screens/private/Users/Users';
import Login from './screens/public/Login/Login';
import { getCurrentTime } from './services/user/user';
import {
	hasOngoingApiCalls,
	setupAxiosInterceptors,
} from './utils/axiosInterceptors';
import LDMSequence from './screens/private/GDMSequence/GDMSequence';
import Branches from './screens/private/Branches/Branches';

// -------------------------------------------------------------------------------------------

let time: Date = new Date();

export const getTime = (): Date => {
	return time;
};

// -------------------------------------------------------------------------------------------

const App = () => {
	const [isTimeInitialized, setIsTimeInitialized] = useState(false);

	useEffect(() => {
		if (import.meta.env.PROD) {
			const disableDevTools = (e: KeyboardEvent) => {
				if (
					e.key === 'F12' ||
					(e.ctrlKey && e.shiftKey && e.key === 'I') ||
					(e.ctrlKey && e.shiftKey && e.key === 'J') ||
					(e.ctrlKey && e.shiftKey && e.key === 'C') ||
					(e.ctrlKey && e.key === 'U')
				) {
					e.preventDefault();
				}
			};

			const disableRightClick = (e: MouseEvent) => {
				e.preventDefault();
			};

			document.addEventListener('keydown', disableDevTools);
			document.addEventListener('contextmenu', disableRightClick);

			return () => {
				document.removeEventListener('keydown', disableDevTools);
				document.removeEventListener('contextmenu', disableRightClick);
			};
		}
	}, []);

	useEffect(() => {
		setupAxiosInterceptors();

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (hasOngoingApiCalls()) {
				event.preventDefault();
				return false;
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	}, []);

	useEffect(() => {
		const bodyElement = document.getElementsByTagName(
			'body'
		)[0] as HTMLBodyElement;

		bodyElement.style.display = 'block';

		const initializeTime = async () => {
			try {
				const startDate = await currentTime();
				time = startDate;
			} catch {
				time = new Date();
			} finally {
				setIsTimeInitialized(true);
			}
		};

		const updateTime = () => {
			time.setSeconds(time.getSeconds() + 1);
		};

		if (!isTimeInitialized) {
			initializeTime();
		}

		const updateTimeInterval = setInterval(updateTime, 1000);

		return () => {
			clearInterval(updateTimeInterval);
		};
	}, [isTimeInitialized]);

	const currentTime = async (): Promise<Date> => {
		const response = await getCurrentTime();

		if (response && response.data.status === 200) {
			const currentDateTime = response.data.data;
			return currentDateTime;
		} else {
			throw new Error('Failed to fetch current time');
		}
	};

	return (
		<ThemeProvider theme={theme}>
			<AuthProvider>
				<AppProvider>
					<BrowserRouter>
						<Routes>
							<Route element={<Public />}>
								<Route
									index
									element={<Login />}
								/>
								<Route
									path={RouterPath.Login}
									element={<Login />}
								/>
							</Route>
							<Route element={<Private />}>
								<Route
									path={RouterPath.Agents}
									element={<Agents />}
								/>
								<Route
									path={RouterPath.ArticleShapes}
									element={<ArticleShapes />}
								/>
								<Route
									path={RouterPath.Booking}
									element={<Booking />}
								/>
								<Route
									path={RouterPath.BookingBranches}
									element={<BookingBranches />}
								/>
								<Route
									path={RouterPath.CompanyQuotation}
									element={<CompanyQuotation />}
								/>
								<Route
									path={RouterPath.Consignees}
									element={<Consignees />}
								/>
								<Route
									path={RouterPath.Consignors}
									element={<Consignors />}
								/>
								<Route
									path={RouterPath.Dashboard}
									element={<Dashboard />}
								/>
								<Route
									path={RouterPath.DeliveryBranches}
									element={<DeliveryBranches />}
								/>
								<Route
									path={RouterPath.Branches}
									element={<Branches />}
								/>
								<Route
									path={RouterPath.GoodsTypes}
									element={<GoodsTypes />}
								/>
								<Route
									path={RouterPath.LrSequence}
									element={<LrSequence />}
								/>
								<Route
									path={RouterPath.LDMSequence}
									element={<LDMSequence />}
								/>
								<Route
									path={RouterPath.LoadingMemo}
									element={<LoadingMemo />}
								/>
								<Route
									path={RouterPath.NotFound}
									element={<NotFound />}
								/>
								<Route
									path={RouterPath.Quotations}
									element={<Quotations />}
								/>
								<Route
									path={RouterPath.Regions}
									element={<Regions />}
								/>
								<Route
									path={RouterPath.HireSlip}
									element={<HireSlip />}
								/>
								<Route
									path={RouterPath.Users}
									element={<Users />}
								/>
								<Route
									path={RouterPath.Stocks}
									element={<Stocks />}
								/>
								<Route
									path={RouterPath.ImportLoadingMemo}
									element={<ImportLoadingMemo />}
								/>
								<Route
									path={RouterPath.ReceivableSummary}
									element={<ReceivableSummary />}
								/>
								<Route
									path={RouterPath.CashMemo}
									element={<CashMemo />}
								/>
							</Route>
						</Routes>
					</BrowserRouter>
					<OfflineAlert />
				</AppProvider>
			</AuthProvider>
		</ThemeProvider>
	);
};

// -------------------------------------------------------------------------------------------

export default App;

// -------------------------------------------------------------------------------------------
