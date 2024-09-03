// -------------------------------------------------------------------------------------------

import './Navigation.scss';

import { memo, useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
	CategoryOutlined,
	ClearOutlined,
	DashboardOutlined,
	ExpandLess,
	ExpandMore,
	Inventory2Outlined,
	InventoryOutlined,
	ListAltOutlined,
	NumbersOutlined,
	PeopleOutline,
	PersonOutline,
	PlaceOutlined,
	ReceiptOutlined,
	SummarizeOutlined,
	TableChartOutlined,
} from '@mui/icons-material';
import {
	Collapse,
	IconButton,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Tooltip,
} from '@mui/material';

import RouterPath from '../../app/routerPath';
import { useApi } from '../../contexts/Api/Api';
import { BranchInterface } from '../../services/branch/branch.types';
import { UserInterface } from '../../services/user/user.types';
import findObjectInArray from '../../utils/findObjectInArray';
import AppLogo from '../AppLogo/AppLogo';
import {
	NavigationInterface,
	NavigationScopeInterface,
	NavigationStateType,
} from './Navigation.types';

var isUserAdmin = true;

// -------------------------------------------------------------------------------------------

const NestedNavigationButton = memo(
	({
		data,
		closeMenu,
		navigationState,
	}: {
		data: NavigationScopeInterface;
		closeMenu: () => void;
		navigationState: NavigationStateType;
	}) => {
		const [open, setOpen] = useState(() =>
			JSON.parse(
				localStorage.getItem(`nestedButton-${data.label}`) || 'false'
			)
		);
		const location = useLocation();

		const handleClick = useCallback(() => {
			const newState = !open;
			setOpen(newState);
			localStorage.setItem(
				`nestedButton-${data.label}`,
				JSON.stringify(newState)
			);
		}, [data.label, open]);

		const isActive = useCallback(() => {
			if (!data.routes) return false;
			return data.routes.some(
				(route) => location.pathname === route.route
			);
		}, [data.routes, location.pathname]);

		return (
			<List
				component='nav'
				data-component='navigation'
				className={`navigation-button ${open ? 'open-nest' : ''}`}
			>
				<Link
					to={data.route as string}
					onClick={() => {
						if (!isActive() && !data.routes) closeMenu();
					}}
				>
					<ListItem
						button
						onClick={handleClick}
						data-component='navigation'
						className={
							location.pathname === data.route
								? 'child-navigation-button active'
								: 'child-navigation-button'
						}
					>
						<Tooltip
							title={data.label}
							placement='right'
						>
							<ListItemIcon
								data-component='navigation'
								className='icon'
							>
								{data.icon}
							</ListItemIcon>
						</Tooltip>
						{navigationState === 'open' && (
							<>
								<ListItemText
									data-component='navigation'
									className='label'
									primary={data.label}
								/>
								{data.routes !== undefined &&
									data.routes.length !== 0 &&
									(open ? <ExpandLess /> : <ExpandMore />)}
							</>
						)}
					</ListItem>
				</Link>
				{data.routes !== undefined && data.routes.length !== 0 && (
					<Collapse
						in={open}
						timeout='auto'
						unmountOnExit
					>
						<List
							component='div'
							disablePadding
							data-component='navigation'
							className='list'
						>
							{data.routes.map((nestedButton, index) => (
								<NestedNavigationButton
									key={`nested-button-${index}`}
									data={nestedButton}
									closeMenu={closeMenu}
									navigationState={navigationState}
								/>
							))}
						</List>
					</Collapse>
				)}
			</List>
		);
	}
);

// -------------------------------------------------------------------------------------------

const NavigationButton = memo(
	({
		data,
		closeMenu,
		navigationState,
	}: {
		data: NavigationScopeInterface;
		closeMenu: () => void;
		navigationState: NavigationStateType;
	}) => {
		const location = useLocation();

		const isActive = useCallback(
			() => location.pathname === data.route,
			[data.route, location.pathname]
		);

		return (
			<Link
				to={data.route as string}
				onClick={() => {
					if (!isActive()) closeMenu();
				}}
			>
				<List
					component='nav'
					data-component='navigation'
					className='navigation-button'
				>
					<ListItem
						button
						data-component='navigation'
						className={
							isActive()
								? 'parent-navigation-button active'
								: 'parent-navigation-button'
						}
					>
						<Tooltip
							title={data.label}
							placement='right'
						>
							<ListItemIcon
								data-component='navigation'
								className='icon'
							>
								{data.icon}
							</ListItemIcon>
						</Tooltip>
						{navigationState === 'open' && (
							<ListItemText
								data-component='navigation'
								className='label'
								primary={data.label}
							/>
						)}
					</ListItem>
				</List>
			</Link>
		);
	}
);

// -------------------------------------------------------------------------------------------

const navigation: NavigationScopeInterface[] = [
	{
		icon: <DashboardOutlined />,
		label: 'Dashboard',
		route: RouterPath.Dashboard,
	},
	{
		icon: <TableChartOutlined />,
		label: 'Operations',
		routes: [
			{
				icon: <ReceiptOutlined />,
				label: 'Booking',
				route: RouterPath.Booking,
			},
			{
				icon: <InventoryOutlined />,
				label: 'Stock',
				route: RouterPath.Stocks,
			},
			{
				icon: <ReceiptOutlined />,
				label: 'CashMemo',
				route: RouterPath.CashMemo,
			},
			{
				icon: <ListAltOutlined />,
				label: 'Loading Memo',
				route: RouterPath.LoadingMemo,
			},
			{
				icon: <SummarizeOutlined />,
				label: 'Receivable Summary',
				route: RouterPath.ReceivableSummary,
			},
			{
				icon: <ListAltOutlined />,
				label: 'Import Loading Memo',
				route: RouterPath.ImportLoadingMemo,
			},
		],
	},
	
	...(isUserAdmin
        ? [{
            icon: <TableChartOutlined />,
            label: 'Masters',
            routes: [
                { icon: <PlaceOutlined />, label: 'Regions', route: RouterPath.Regions },
                {
					icon: <ReceiptOutlined />,
					label: 'Branches',
					route: RouterPath.Branches,
                },
                {
                    icon: <NumbersOutlined />,
                    label: 'Sequence Counter',
                    routes: [
                        { icon: <ListAltOutlined />, label: 'LR Sequence', route: RouterPath.LrSequence },
                        { icon: <ListAltOutlined />, label: 'LDM Sequence', route: RouterPath.LDMSequence },
                    ],
                },
                { icon: <Inventory2Outlined />, label: 'Goods Types', route: RouterPath.GoodsTypes },
                { icon: <CategoryOutlined />, label: 'Article Shapes', route: RouterPath.ArticleShapes },
                { icon: <PeopleOutline />, label: 'Users', route: RouterPath.Users },
                { icon: <PeopleOutline />, label: 'Consignors', route: RouterPath.Consignors },
                { icon: <PeopleOutline />, label: 'Consignees', route: RouterPath.Consignees },
                { icon: <PeopleOutline />, label: 'Agents', route: RouterPath.Agents },
                { icon: <PeopleOutline />, label: 'Company Quotation', route: RouterPath.CompanyQuotation },
            ],
        }]
        : []
    ),
];

// -------------------------------------------------------------------------------------------

const NavigationScope = memo(
	({
		closeMenu,
		navigationState,
		user,
	}: {
		closeMenu: () => void;
		navigationState: NavigationStateType;
		user: UserInterface;
	}) => {
		return (
			<div
				data-component='navigation'
				className='scope'
			>
				{navigation.map((data, index) => {
					
					if (index === 2 && user.userTypeId !== 1) {
						
						return null;
					}

					return data.route === undefined ? (
						<NestedNavigationButton
							key={`navigation-${index}`}
							data={data}
							closeMenu={closeMenu}
							navigationState={navigationState}
						/>
					) : (
						<NavigationButton
							key={`navigation-${index}`}
							data={data}
							closeMenu={closeMenu}
							navigationState={navigationState}
						/>
					);
				})}
			</div>
		);
	}
);


// -------------------------------------------------------------------------------------------

const Navigation = memo(({ onClick, navigationState }: NavigationInterface) => {
	const { getUserDetails, getAllBranchess } =
		useApi();
	const [user, setUser] = useState<UserInterface>();

	const [deliveryBranches, _setDeliveryBranches] = useState<
		BranchInterface[]
	>([]);

	useEffect(() => {
		initialFetch();
	}, []);

	const initialFetch = async () => {
		const userData = await getUserDetails();
		const deliveryBranchesData = await getAllBranchess();
			if (userData) {
			setUser(userData);
			if(userData.userTypeId ===1){
				isUserAdmin = true;
			}
			
			_setDeliveryBranches(deliveryBranchesData);
		}
	};

	const renderCloseButton = useCallback(() => {
		if (window.innerWidth < 600) {
			return (
				<div
					data-component='navigation'
					className='right'
				>
					<Tooltip
						title='Close Menu'
						placement='right'
					>
						<IconButton onClick={onClick}>
							<ClearOutlined
								data-component='navigation'
								className='icon'
							/>
						</IconButton>
					</Tooltip>
				</div>
			);
		}
		return null;
	}, [onClick]);

	return (
		<div
			data-component='navigation'
			className={`container ${navigationState}`}
		>
			<div
				data-component='navigation'
				className='top'
			>
				<div
					data-component='navigation'
					className='left'
				>
					<AppLogo
						variant='light'
						iconOnly={
							navigationState === 'semi-open' ||
							navigationState === 'closed'
						}
					/>
				</div>
				{navigationState === 'open' && user && (
					<Tooltip
						title={`Full Name: ${
							user.fullName ? user.fullName : '--'
						}, Branch: ${
							user.branchId
								? findObjectInArray(
										[
												...deliveryBranches,
										],
										'branchId',
										user.branchId
								  ).name
								: '--'
						}`}
					>
						<div
							data-component='navigation'
							className='user'
						>
							<div
								data-component='navigation'
								className='left'
							>
								<div
									data-component='navigation'
									className='icon'
								>
									<PersonOutline />
								</div>
							</div>
							<div
								data-component='navigation'
								className='right'
							>
								<div
									data-component='navigation'
									className='fullname label-large'
								>
									{user.fullName}
								</div>
								<div
									data-component='navigation'
									className='branch body-small'
								>
									{user.branchId
										? findObjectInArray(
												[
                                               ...deliveryBranches,
												],
												'branchId',
												user.branchId
										  ).name
										: '--'}
								</div>
							</div>
						</div>
					</Tooltip>
				)}
				{renderCloseButton()}
			</div>
			<div
				data-component='navigation'
				className='bottom'
			>
				{user &&
				<NavigationScope
					user={user}
					closeMenu={() => {}}
					navigationState={navigationState}
				/>
			}
		
			</div>
		</div>
	);
});

// -------------------------------------------------------------------------------------------

export default Navigation;

// -------------------------------------------------------------------------------------------
