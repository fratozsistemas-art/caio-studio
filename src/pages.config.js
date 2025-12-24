import About from './pages/About';
import Home from './pages/Home';
import Platforms from './pages/Platforms';
import Portfolio from './pages/Portfolio';
import Admin from './pages/Admin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "Home": Home,
    "Platforms": Platforms,
    "Portfolio": Portfolio,
    "Admin": Admin,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};