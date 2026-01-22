import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import TimeTracking from './pages/TimeTracking';
import Invoices from './pages/Invoices';
import TaskStatuses from './pages/TaskStatuses';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Clients": Clients,
    "Projects": Projects,
    "ProjectDetail": ProjectDetail,
    "TimeTracking": TimeTracking,
    "Invoices": Invoices,
    "TaskStatuses": TaskStatuses,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};