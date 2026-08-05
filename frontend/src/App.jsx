import { Route, Routes } from 'react-router-dom'
import SiteLayout from './components/SiteLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import MarketplacePage from './pages/MarketplacePage.jsx'
import EmergencyPage from './pages/EmergencyPage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import ProviderProfilePage from './pages/ProviderProfilePage.jsx'
import BookingPage from './pages/BookingPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import ApplicationPage from './pages/ApplicationPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="home" element={<HomePage />} />
        <Route path="providers" element={<MarketplacePage />} />
        <Route path="how-it-works" element={<BookingPage />} />
        <Route path="emergency" element={<EmergencyPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="auth" element={<AuthPage />} />
        <Route path="profile" element={<ProviderProfilePage />} />
        <Route path="booking" element={<BookingPage />} />
        <Route path="application" element={<ApplicationPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
