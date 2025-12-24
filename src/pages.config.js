import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import Platforms from './pages/Platforms';
import About from './pages/About';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Portfolio": Portfolio,
    "Platforms": Platforms,
    "About": About,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};