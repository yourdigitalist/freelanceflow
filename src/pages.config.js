import BillingSettings from './pages/BillingSettings';
import Clients from './pages/Clients';
import CompanySettings from './pages/CompanySettings';
import Dashboard from './pages/Dashboard';
import InvoiceSettings from './pages/InvoiceSettings';
import Invoices from './pages/Invoices';
import Onboarding from './pages/Onboarding';
import PersonalPreferences from './pages/PersonalPreferences';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import PublicInvoiceView from './pages/PublicInvoiceView';
import PublicReviewView from './pages/PublicReviewView';
import ReviewRequests from './pages/ReviewRequests';
import TaskStatuses from './pages/TaskStatuses';
import TimeTracking from './pages/TimeTracking';
import OnboardingWizard from './pages/OnboardingWizard';
import Landing from './pages/Landing';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BillingSettings": BillingSettings,
    "Clients": Clients,
    "CompanySettings": CompanySettings,
    "Dashboard": Dashboard,
    "InvoiceSettings": InvoiceSettings,
    "Invoices": Invoices,
    "Onboarding": Onboarding,
    "PersonalPreferences": PersonalPreferences,
    "ProjectDetail": ProjectDetail,
    "Projects": Projects,
    "PublicInvoiceView": PublicInvoiceView,
    "PublicReviewView": PublicReviewView,
    "ReviewRequests": ReviewRequests,
    "TaskStatuses": TaskStatuses,
    "TimeTracking": TimeTracking,
    "OnboardingWizard": OnboardingWizard,
    "Landing": Landing,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};