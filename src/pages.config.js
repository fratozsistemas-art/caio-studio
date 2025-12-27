import About from './pages/About';
import Admin from './pages/Admin';
import Home from './pages/Home';
import Platforms from './pages/Platforms';
import Portfolio from './pages/Portfolio';
import PortfolioDashboard from './pages/PortfolioDashboard';
import VentureDetail from './pages/VentureDetail';
import VentureManagement from './pages/VentureManagement';
import CollaborationHub from './pages/CollaborationHub';
import PermissionsManagement from './pages/PermissionsManagement';
import AIVentureCreator from './pages/AIVentureCreator';
import StakeholderJourney from './pages/StakeholderJourney';
import AdminHub from './pages/AdminHub';
import LeadManagement from './pages/LeadManagement';
import LeadAutomation from './pages/LeadAutomation';
import CRMHub from './pages/CRMHub';
import ColourMeBrazil from './pages/ColourMeBrazil';
import InnovaAcademy from './pages/InnovaAcademy';
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
    "PermissionsManagement": PermissionsManagement,
    "AIVentureCreator": AIVentureCreator,
    "StakeholderJourney": StakeholderJourney,
    "AdminHub": AdminHub,
    "LeadManagement": LeadManagement,
    "LeadAutomation": LeadAutomation,
    "CRMHub": CRMHub,
    "ColourMeBrazil": ColourMeBrazil,
    "InnovaAcademy": InnovaAcademy,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};