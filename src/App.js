import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import LandingLayout from "./components/layout/LandingLayout";
import StartPage from "./pages/StartPage";
import LandingPage from "./pages/LandingPage";
import BetCreatePage from "./pages/BetCreatePage";
import { ThemeContextProvider } from "./contexts/ThemeContext";
import { ConfigProvider } from "./contexts/ConfigContext";
import { QubicConnectProvider } from "./components/qubic/connect/QubicConnectContext";
import { QuotteryProvider } from "./contexts/QuotteryContext";
import { SnackbarProvider } from "./contexts/SnackbarContext";

function App() {
  return (
    <ThemeContextProvider>
      <ConfigProvider>
        <QubicConnectProvider>
          <QuotteryProvider>
            <SnackbarProvider>
              <BrowserRouter>
                <Routes>
                  {/* Landing page */}
                  <Route
                    path='/landing'
                    element={
                      <LandingLayout>
                        <LandingPage />
                      </LandingLayout>
                    }
                  />
                  {/* All other pages WITH header/footer */}
                  <Route
                    path='*'
                    element={
                      <MainLayout>
                        <Routes>
                          <Route path='/' element={<StartPage />} />
                          <Route path='/create' element={<BetCreatePage />} />
                        </Routes>
                      </MainLayout>
                    }
                  />
                </Routes>
              </BrowserRouter>
            </SnackbarProvider>
          </QuotteryProvider>
        </QubicConnectProvider>
      </ConfigProvider>
    </ThemeContextProvider>
  );
}

export default App;
