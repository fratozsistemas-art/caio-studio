import About from './pages/About';
import Home from './pages/Home';
import Platforms from './pages/Platforms';
import Portfolio from './pages/Portfolio';
import Admin from './pages/Admin';
import VentureManagement from './pages/VentureManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "Home": Home,
    "Platforms": Platforms,
    "Portfolio": Portfolio,
    "Admin": Admin,
    "VentureManagement": VentureManagement,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};