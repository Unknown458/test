import './Navigation.scss';
import { memo, useCallback, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    ExpandLess,
    ExpandMore,
    TableChartOutlined,
    ReceiptOutlined,
    ClearOutlined,
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
import AppLogo from '../AppLogo/AppLogo';
import {
    NavigationInterface,
    NavigationScopeInterface,
    NavigationStateType,
} from './Navigation.types';

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

const navigation: NavigationScopeInterface[] = [
    {
        icon: <TableChartOutlined />,
        label: 'Masters',
        routes: [
            {
                icon: <ReceiptOutlined />,
                label: 'Products',
                route: RouterPath.Product,
            },
        ],
    },
];

const NavigationScope = memo(
    ({
        closeMenu,
        navigationState,
    }: {
        closeMenu: () => void;
        navigationState: NavigationStateType;
    }) => {
        return (
            <div
                data-component='navigation'
                className='scope'
            >
                {navigation.map((data, index) => {
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

const Navigation = memo(({ onClick, navigationState }: NavigationInterface) => {
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
                {renderCloseButton()}
            </div>
            <div
                data-component='navigation'
                className='bottom'
            >
                <NavigationScope
                    closeMenu={() => {}}
                    navigationState={navigationState}
                />
            </div>
        </div>
    );
});

export default Navigation;