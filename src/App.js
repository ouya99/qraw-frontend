import React from 'react'
import { BrowserRouter } from "react-router-dom"
import { Route, Routes } from "react-router-dom"
import Header from './components/layout/Header'
import StartPage from './pages/StartPage'
import BetDetailsPage from './pages/BetDetailsPage'
import BetCreatePage from './pages/BetCreatePage'
import BetPublishPage from './pages/BetPublishPage'
import './App.css'
import { QubicConnectProvider } from './components/qubic/connect/QubicConnectContext'
import { QuotteryProvider } from './contexts/QuotteryContext'
import Footer from './components/layout/Footer'
import {ConfigProvider} from "./contexts/ConfigContext"

function App() {
  return (
    <ConfigProvider>
    <QubicConnectProvider>
      <QuotteryProvider>
        <BrowserRouter>
          <Header />
          <Routes>
            <Route>
              <Route path="/" element={<StartPage />} />
            </Route>
            <Route>
              <Route path="/bet/:id" element={<BetDetailsPage />} />
            </Route>
            <Route>
              <Route path="/create" element={<BetCreatePage />} />
            </Route>
            <Route>
              <Route path="/publish/:id" element={<BetPublishPage />} />
            </Route>
          </Routes>
          <Footer />
        </BrowserRouter>
      </QuotteryProvider>
    </QubicConnectProvider>
    </ConfigProvider>
  )
}

export default App
