import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

// Pages that should be publicly accessible without authentication
const PUBLIC_PAGES = ['Landing', 'PublicInvoice', 'PublicInvoiceSimple', 'PublicReviewView', 'OnboardingWizard'];

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <Routes>
            {/* Root route */}
            <Route path="/" element={
              PUBLIC_PAGES.includes(mainPageKey) ? (
                <LayoutWrapper currentPageName={mainPageKey}>
                  <MainPage />
                </LayoutWrapper>
              ) : (
                <AuthGuard>
                  <LayoutWrapper currentPageName={mainPageKey}>
                    <MainPage />
                  </LayoutWrapper>
                </AuthGuard>
              )
            } />
            
            {/* All other page routes */}
            {Object.entries(Pages).map(([path, Page]) => (
              <Route
                key={path}
                path={`/${path}`}
                element={
                  PUBLIC_PAGES.includes(path) ? (
                    // Public pages - no auth required
                    <LayoutWrapper currentPageName={path}>
                      <Page />
                    </LayoutWrapper>
                  ) : (
                    // Private pages - require authentication
                    <AuthGuard>
                      <LayoutWrapper currentPageName={path}>
                        <Page />
                      </LayoutWrapper>
                    </AuthGuard>
                  )
                }
              />
            ))}
            
            {/* 404 page */}
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
