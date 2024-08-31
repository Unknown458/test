import "./styles/animation.scss";
import "./styles/color.scss";
import "./styles/elevation.scss";
import "./styles/layout.scss";
import "./styles/motion.scss";
import "./styles/global.scss";
import "./styles/shape.scss";
import "./styles/scroll.scss";
import "./styles/typography.scss";
import "./styles/gradients.scss";

import { ThemeProvider } from "@mui/material";
import { AppProvider } from "./contexts/App/App";
import OfflineAlert from "./components/OfflineAlert/OfflineAlert";
import { AuthProvider } from "./contexts/Auth/Auth";
import theme from "./app/theme";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./screens/public/Login";
import Public from "./container/Public/Public";
import RouterPath from "./app/routerPath";
import Product from "./screens/private/Product/Product";
import Private from "./container/Private/Private";

import { getCurrentTime } from "./services/user/user";
import {
  hasOngoingApiCalls,
  setupAxiosInterceptors,
} from "./utils/axiosInterceptors";
import { useState, useEffect } from "react";

// -------------------------------------------------------------------------------------------

let time: Date = new Date();

export const getTime = (): Date => {
  return time;
};

// -------------------------------------------------------------------------------------------

function App() {
  const [isTimeInitialized, setIsTimeInitialized] = useState(false);

  useEffect(() => {
    if (import.meta.env.PROD) {
      const disableDevTools = (e: KeyboardEvent) => {
        if (
          e.key === "F12" ||
          (e.ctrlKey && e.shiftKey && e.key === "I") ||
          (e.ctrlKey && e.shiftKey && e.key === "J") ||
          (e.ctrlKey && e.shiftKey && e.key === "C") ||
          (e.ctrlKey && e.key === "U")
        ) {
          e.preventDefault();
        }
      };

      const disableRightClick = (e: MouseEvent) => {
        e.preventDefault();
      };

      document.addEventListener("keydown", disableDevTools);
      document.addEventListener("contextmenu", disableRightClick);

      return () => {
        document.removeEventListener("keydown", disableDevTools);
        document.removeEventListener("contextmenu", disableRightClick);
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

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const bodyElement = document.getElementsByTagName(
      "body"
    )[0] as HTMLBodyElement;

    bodyElement.style.display = "block";

    const initializeTime = async () => {
      try {
        const startDate = await currentTime();
        time = new Date(startDate);
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
      const currentDateTime = new Date(response.data.data);
      return currentDateTime;
    } else {
      throw new Error("Failed to fetch current time");
    }
  };
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Public />}>
                <Route index element={<Login />} />
                <Route path={RouterPath.Login} element={<Login />} />
              </Route>
              <Route element={<Private />}>
                <Route path={RouterPath.Product} element={<Product />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <OfflineAlert />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
