import BillingSettings from './pages/BillingSettings';
import Clients from './pages/Clients';
import CompanySettings from './pages/CompanySettings';
import Dashboard from './pages/Dashboard';
import InvoiceSettings from './pages/InvoiceSettings';
import Invoices from './pages/Invoices';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import OnboardingWizard from './pages/OnboardingWizard';
import PersonalPreferences from './pages/PersonalPreferences';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import PublicInvoiceView from './pages/PublicInvoiceView';
import PublicReviewView from './pages/PublicReviewView';
import ReviewRequests from './pages/ReviewRequests';
import TaskStatuses from './pages/TaskStatuses';
import TimeTracking from './pages/TimeTracking';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BillingSettings": BillingSettings,
    "Clients": Clients,
    "CompanySettings": CompanySettings,
    "Dashboard": Dashboard,
    "InvoiceSettings": InvoiceSettings,
    "Invoices": Invoices,
    "Landing": Landing,
    "Onboarding": Onboarding,
    "OnboardingWizard": OnboardingWizard,
    "PersonalPreferences": PersonalPreferences,
    "ProjectDetail": ProjectDetail,
    "Projects": Projects,
    "PublicInvoiceView": PublicInvoiceView,
    "PublicReviewView": PublicReviewView,
    "ReviewRequests": ReviewRequests,
    "TaskStatuses": TaskStatuses,
    "TimeTracking": TimeTracking,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};