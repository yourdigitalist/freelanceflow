/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminDashboard from './pages/AdminDashboard';
import BillingSettings from './pages/BillingSettings';
import Clients from './pages/Clients';
import CompanySettings from './pages/CompanySettings';
import HelpCenter from './pages/HelpCenter';
import InvoiceSettings from './pages/InvoiceSettings';
import Invoices from './pages/Invoices';
import Landing from './pages/Landing';
import Notifications from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import PersonalPreferences from './pages/PersonalPreferences';
import Projects from './pages/Projects';
import PublicInvoice from './pages/PublicInvoice';
import PublicReviewView from './pages/PublicReviewView';
import ReviewRequestDetail from './pages/ReviewRequestDetail';
import ReviewRequests from './pages/ReviewRequests';
import TaskStatuses from './pages/TaskStatuses';
import TimeTracking from './pages/TimeTracking';
import OnboardingWizard from './pages/OnboardingWizard';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "BillingSettings": BillingSettings,
    "Clients": Clients,
    "CompanySettings": CompanySettings,
    "HelpCenter": HelpCenter,
    "InvoiceSettings": InvoiceSettings,
    "Invoices": Invoices,
    "Landing": Landing,
    "Notifications": Notifications,
    "Onboarding": Onboarding,
    "PersonalPreferences": PersonalPreferences,
    "Projects": Projects,
    "PublicInvoice": PublicInvoice,
    "PublicReviewView": PublicReviewView,
    "ReviewRequestDetail": ReviewRequestDetail,
    "ReviewRequests": ReviewRequests,
    "TaskStatuses": TaskStatuses,
    "TimeTracking": TimeTracking,
    "OnboardingWizard": OnboardingWizard,
    "Dashboard": Dashboard,
    "ProjectDetail": ProjectDetail,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};