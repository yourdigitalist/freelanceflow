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
    mainPage: "BillingSettings",
    Pages: PAGES,
    Layout: __Layout,
    publicPages: ["Landing", "PublicInvoiceView", "PublicReviewView"],
};