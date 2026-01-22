import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import TaskStatuses from './pages/TaskStatuses';
import TimeTracking from './pages/TimeTracking';
import InvoiceSettings from './pages/InvoiceSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Clients": Clients,
    "Dashboard": Dashboard,
    "Invoices": Invoices,
    "ProjectDetail": ProjectDetail,
    "Projects": Projects,
    "TaskStatuses": TaskStatuses,
    "TimeTracking": TimeTracking,
    "InvoiceSettings": InvoiceSettings,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};