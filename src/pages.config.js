import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import TimeTracking from './pages/TimeTracking';
import Invoices from './pages/Invoices';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Clients": Clients,
    "Projects": Projects,
    "ProjectDetail": ProjectDetail,
    "TimeTracking": TimeTracking,
    "Invoices": Invoices,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};