import About from './pages/About';
import Admin from './pages/Admin';
import Home from './pages/Home';
import Platforms from './pages/Platforms';
import Portfolio from './pages/Portfolio';
import PortfolioDashboard from './pages/PortfolioDashboard';
import VentureManagement from './pages/VentureManagement';
import VentureDetail from './pages/VentureDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "Admin": Admin,
    "Home": Home,
    "Platforms": Platforms,
    "Portfolio": Portfolio,
    "PortfolioDashboard": PortfolioDashboard,
    "VentureManagement": VentureManagement,
    "VentureDetail": VentureDetail,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};