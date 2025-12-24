import About from './pages/About';
import Admin from './pages/Admin';
import Home from './pages/Home';
import Platforms from './pages/Platforms';
import Portfolio from './pages/Portfolio';
import VentureManagement from './pages/VentureManagement';
import PortfolioDashboard from './pages/PortfolioDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "Admin": Admin,
    "Home": Home,
    "Platforms": Platforms,
    "Portfolio": Portfolio,
    "VentureManagement": VentureManagement,
    "PortfolioDashboard": PortfolioDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};