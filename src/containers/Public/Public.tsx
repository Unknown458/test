// -------------------------------------------------------------------------------------------

import "./Public.scss";

import { memo, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { ArrowDropDown, MailOutline, PhoneOutlined } from "@mui/icons-material";
import { Button, Link, Menu, MenuItem } from "@mui/material";

import AppDetails from "../../app/appDetails";
import downloadOptions from "../../app/downloadOptions";
import RouterPath from "../../app/routerPath";
import AppLogo from "../../components/AppLogo/AppLogo";
import { useAuth } from "../../contexts/Auth/Auth";

// -------------------------------------------------------------------------------------------

const Public = memo(() => {
  const { loginStatus } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (loginStatus) {
    return <Navigate to={RouterPath.Dashboard} replace={true} />;
  }

  const handleDownloadButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDownloadButtonClose = () => {
    setAnchorEl(null);
  };

  return (
    <div data-component="public" className="container">
      <div data-component="public" className="section">
        <div data-component="public" className="top">
          <div data-component="public" className="illustration">
            <div data-component="public" className="header">
              <div data-component="public" className="left">
                <AppLogo variant="light" />
              </div>
              <div data-component="public" className="right">
                <Button
                  variant="outlined"
                  onClick={handleDownloadButtonClick}
                  endIcon={<ArrowDropDown />}
                  data-component="public"
                  className="dropdown-button"
                >
                  Download
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleDownloadButtonClose}
                >
                  {downloadOptions.map((option, index) => (
                    <MenuItem
                      key={index}
                      onClick={handleDownloadButtonClose}
                      data-component="public"
                      className="menu-item"
                    >
                      <Link
                        href={option.url}
                        target="_blank"
                        data-component="public"
                        className="link"
                      >
                        {option.label}
                      </Link>
                    </MenuItem>
                  ))}
                </Menu>
              </div>
            </div>
            <div data-component="public" className="support">
              <div data-component="public" className="title title-medium">
                Support Details
              </div>
              <div data-component="public" className="details">
                <SupportItem
                  icon={<PhoneOutlined />}
                  label="Phone Number"
                  content={AppDetails.SupportPhone}
                  href={`tel:${AppDetails.SupportPhone}`}
                />
                <SupportItem
                  icon={<MailOutline />}
                  label="Email Address"
                  content={AppDetails.SupportEmail}
                  href={`mailto:${AppDetails.SupportEmail}`}
                />
              </div>
            </div>
          </div>
          <div data-component="public" className="form">
            <div data-component="public" className="header">
              <div data-component="public" className="left">
                <AppLogo variant="dark" />
              </div>
              <div data-component="public" className="right">
                <Button
                  variant="outlined"
                  onClick={handleDownloadButtonClick}
                  endIcon={<ArrowDropDown />}
                  data-component="public"
                  className="dropdown-button"
                >
                  Download
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleDownloadButtonClose}
                >
                  {downloadOptions.map((option, index) => (
                    <MenuItem
                      key={index}
                      onClick={handleDownloadButtonClose}
                      data-component="public"
                      className="menu-item"
                    >
                      <Link
                        href={option.url}
                        target="_blank"
                        data-component="public"
                        className="link"
                      >
                        {option.label}
                      </Link>
                    </MenuItem>
                  ))}
                </Menu>
              </div>
            </div>
            <div data-component="public" className="body">
              <Outlet />
            </div>
          </div>
        </div>
        <div data-component="public" className="bottom">
          <a
            data-component="public"
            className="rights body-small"
            href="#"
            target="_blank"
          >
            {AppDetails.Rights}
          </a>
        </div>
      </div>
    </div>
  );
});

// -------------------------------------------------------------------------------------------

const SupportItem = memo(
  ({
    icon,
    label,
    content,
    href,
  }: {
    icon: React.ReactNode;
    label: string;
    content: string;
    href: string;
  }) => (
    <div data-component="public" className="item">
      <div data-component="public" className="icon">
        {icon}
      </div>
      <div data-component="public" className="values">
        <div data-component="public" className="label body-small">
          {label}
        </div>
        <a
          data-component="public"
          className="content body-large"
          href={href}
          target="_blank"
        >
          {content}
        </a>
      </div>
    </div>
  )
);

// -------------------------------------------------------------------------------------------

export default Public;

// -------------------------------------------------------------------------------------------
