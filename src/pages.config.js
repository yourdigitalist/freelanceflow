import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
import InvoiceSettings from './pages/InvoiceSettings';
import Invoices from './pages/Invoices';
import PersonalPreferences from './pages/PersonalPreferences';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import TaskStatuses from './pages/TaskStatuses';
import TimeTracking from './pages/TimeTracking';
import PublicInvoiceView from './pages/PublicInvoiceView';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Clients": Clients,
    "Dashboard": Dashboard,
    "InvoiceSettings": InvoiceSettings,
    "Invoices": Invoices,
    "PersonalPreferences": PersonalPreferences,
    "ProjectDetail": ProjectDetail,
    "Projects": Projects,
    "TaskStatuses": TaskStatuses,
    "TimeTracking": TimeTracking,
    "PublicInvoiceView": PublicInvoiceView,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};