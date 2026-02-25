import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useBusiness } from '../context/BusinessContext';
import api from '../services/api';
import { DollarSign, Users, FileCheck, AlertCircle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        {Icon && <Icon size={24} className="text-white" />}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { activeBusiness } = useBusiness();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (activeBusiness) {
      api.get(`/reports/dashboard?businessId=${activeBusiness._id}`)
         .then(res => setStats(res.data))
         .catch(err => console.error(err));
    }
  }, [activeBusiness]);

  if (!stats) return <div className="p-8 ml-64">Loading...</div>;

  return (
    <div className="p-8 ml-64 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} color="bg-green-500" />
        <StatCard title="Pending Payments" value={`₹${stats.pendingPayments.toLocaleString()}`} icon={AlertCircle} color="bg-orange-500" />
        <StatCard title="Total Bookings" value={stats.totalBookings} icon={FileCheck} color="bg-blue-500" />
        <StatCard title="Total Customers" value={stats.totalCustomers} icon={Users} color="bg-purple-500" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm h-96">
        <h3 className="font-bold mb-4">Monthly Revenue</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;