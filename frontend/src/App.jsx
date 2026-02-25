import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BusinessProvider } from './context/BusinessContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup'; // Import Signup
import Businesses from './pages/Businesses';
import Customers from './pages/Customers';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceList from './pages/InvoiceList';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col pl-64"> 
         {/* Added pl-64 to offset fixed sidebar */}
        <Navbar />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <BusinessProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/businesses" element={<ProtectedRoute><Businesses /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><InvoiceList /></ProtectedRoute>} />
            <Route path="/invoices/create" element={<ProtectedRoute><CreateInvoice /></ProtectedRoute>} />
            
            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BusinessProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;