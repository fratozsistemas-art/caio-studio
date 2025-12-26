import About from './pages/About';
import Admin from './pages/Admin';
import Home from './pages/Home';
import Platforms from './pages/Platforms';
import Portfolio from './pages/Portfolio';
import PortfolioDashboard from './pages/PortfolioDashboard';
import VentureDetail from './pages/VentureDetail';
import VentureManagement from './pages/VentureManagement';
import CollaborationHub from './pages/CollaborationHub';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "Admin": Admin,
    "Home": Home,
    "Platforms": Platforms,
    "Portfolio": Portfolio,
    "PortfolioDashboard": PortfolioDashboard,
    "VentureDetail": VentureDetail,
    "VentureManagement": VentureManagement,
    "CollaborationHub": CollaborationHub,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};