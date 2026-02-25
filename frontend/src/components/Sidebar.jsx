import { LayoutDashboard, Users, FileText, Briefcase, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();
  const navClass = ({ isActive }) => 
    `flex items-center gap-3 p-3 rounded transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`;

  return (
    <div className="h-screen w-64 bg-slate-900 flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white tracking-wider">TRAVEL<span className="text-blue-500">BILL</span></h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <NavLink to="/" className={navClass}><LayoutDashboard size={20} /> Dashboard</NavLink>
        <NavLink to="/invoices" className={navClass}><FileText size={20} /> Invoices</NavLink>
        <NavLink to="/customers" className={navClass}><Users size={20} /> Customers</NavLink>
        <NavLink to="/businesses" className={navClass}><Briefcase size={20} /> Businesses</NavLink>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button onClick={logout} className="flex items-center gap-3 p-3 text-red-400 hover:bg-red-900/20 w-full rounded transition">
          <LogOut size={20} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;