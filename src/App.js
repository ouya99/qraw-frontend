import { BrowserRouter, Routes, Route } from 'react-router-dom';

import LandingLayout from './components/layout/LandingLayout';
import MainLayout from './components/layout/MainLayout';
import { QubicConnectProvider } from './components/qubic/connect/QubicConnectContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { QuotteryProvider } from './contexts/QuotteryContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { ThemeContextProvider } from './contexts/ThemeContext';
import LandingPage from './pages/LandingPage';
import StartPage from './pages/StartPage';

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
                    path="/landing"
                    element={
                      <LandingLayout>
                        <LandingPage />
                      </LandingLayout>
                    }
                  />
                  {/* All other pages WITH header/footer */}
                  <Route
                    path="*"
                    element={
                      <MainLayout>
                        <Routes>
                          <Route path="/" element={<StartPage />} />
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
