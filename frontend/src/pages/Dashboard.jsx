import { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import { useBusiness } from '../context/BusinessContext';
import api from '../services/api';
import {
  TrendingUp, Users, FileText, Clock,
  Plus, Download, ChevronRight, Wallet,
  RefreshCw, X, Calendar, CheckCircle2,
  IndianRupee, FileSpreadsheet, ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-800">{value}</h3>
        {trend && (
          <p className={`text-[10px] mt-1 font-bold ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend} <span className="text-slate-300 font-normal ml-1">vs last month</span>
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        {Icon && <Icon size={22} className={color.replace('bg-', 'text-')} />}
      </div>
    </div>
  </div>
);

// ─── Export Modal ─────────────────────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: '3_months',   label: 'Last 3 Months' },
  { value: '6_months',   label: 'Last 6 Months' },
  { value: 'this_year',  label: 'This Year' },
  { value: 'last_year',  label: 'Last Year' },
  { value: 'custom',     label: 'Custom Range' },
];

const ExportModal = ({ businessId, onClose }) => {
  const [period,     setPeriod]     = useState('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo,   setCustomTo]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [done,       setDone]       = useState(false);

  const handleExport = async () => {
    if (period === 'custom' && (!customFrom || !customTo)) {
      alert('Please select both From and To dates.');
      return;
    }
    setLoading(true);
    try {
      let url = `/reports/export?businessId=${businessId}&period=${period}`;
      if (period === 'custom') url += `&customFrom=${customFrom}&customTo=${customTo}`;

      const response = await api.get(url, { responseType: 'blob' });
      const blobUrl  = window.URL.createObjectURL(new Blob([response.data]));
      const link     = document.createElement('a');
      link.href      = blobUrl;
      link.setAttribute('download', `TravelBill-Report-${period}-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setDone(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      alert('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 px-7 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={20} className="text-emerald-400" />
            <div>
              <h3 className="text-white font-black text-sm uppercase tracking-widest">Export Report</h3>
              <p className="text-slate-400 text-[10px] font-bold mt-0.5">3-sheet Excel workbook</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-7 space-y-5">

          {/* Period selector */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">
              Select Period
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PERIOD_OPTIONS.filter(o => o.value !== 'custom').map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border ${
                    period === opt.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                      : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-blue-200 hover:text-blue-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <button
                onClick={() => setPeriod('custom')}
                className={`col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border ${
                  period === 'custom'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                    : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-indigo-200 hover:text-indigo-600'
                }`}
              >
                <Calendar size={13} /> Custom Date Range
              </button>
            </div>
          </div>

          {/* Custom date inputs */}
          {period === 'custom' && (
            <div className="grid grid-cols-2 gap-3 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <div>
                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1.5">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1.5">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
          )}

          {/* What's included */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Report Includes</p>
            <div className="space-y-2">
              {[
                ['Invoice Ledger',      'All invoices with full breakdown'],
                ['Monthly Summary',     'Month-by-month revenue totals'],
                ['Client Summary',      'Top clients ranked by revenue'],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                  <div>
                    <span className="text-[11px] font-black text-slate-700">{title}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 pb-7">
          <button
            onClick={handleExport}
            disabled={loading || done}
            className={`w-full py-3.5 rounded-2xl font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl ${
              done
                ? 'bg-emerald-500 text-white shadow-emerald-100'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100 active:scale-95'
            } disabled:opacity-70`}
          >
            {done ? (
              <><CheckCircle2 size={16} /> Downloaded!</>
            ) : loading ? (
              <><RefreshCw size={16} className="animate-spin" /> Generating…</>
            ) : (
              <><Download size={16} /> Download Excel Report</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { activeBusiness } = useBusiness();
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [showExport,  setShowExport]  = useState(false);
  const [chartPeriod, setChartPeriod] = useState('6_months');

  const fetchStats = () => {
    if (!activeBusiness) return;
    setLoading(true);
    api.get(`/reports/dashboard?businessId=${activeBusiness._id}`)
       .then(res => setStats(res.data))
       .catch(err => console.error(err))
       .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStats(); }, [activeBusiness]);

  if (loading || !stats) {
    return (
      <div className="p-8 ml-64 flex flex-col items-center justify-center min-h-screen text-slate-400">
        <div className="animate-spin mb-4"><RefreshCw size={32} /></div>
        <p className="font-bold uppercase tracking-widest text-xs">Assembling your data...</p>
      </div>
    );
  }

  return (
    <div className="p-8 ml-64 bg-slate-50 min-h-screen font-sans">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Executive Dashboard</h2>
          <p className="text-slate-400 text-sm">
            Reporting for <span className="text-blue-600 font-bold uppercase">{activeBusiness?.name}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchStats}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
          >
            <RefreshCw size={18} />
          </button>
          <Link
            to="/invoices/create"
            className="bg-white text-slate-700 px-4 py-2 rounded-xl font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-all"
          >
            <Plus size={16} /> New Booking
          </Link>
          <button
            onClick={() => setShowExport(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all"
          >
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Revenue"
          value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
          icon={TrendingUp} color="bg-emerald-500"
          trend={stats.revTrend}
        />
        <StatCard
          title="Receivables"
          value={`₹${stats.pendingPayments.toLocaleString('en-IN')}`}
          icon={Clock} color="bg-amber-500"
        />
        <StatCard
          title="Bookings"
          value={stats.totalBookings}
          icon={FileText} color="bg-blue-500"
        />
        <StatCard
          title="Clients"
          value={stats.totalCustomers}
          icon={Users} color="bg-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-800 text-lg">Revenue Performance</h3>
            <select
              value={chartPeriod}
              onChange={e => setChartPeriod(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase px-3 py-2 outline-none cursor-pointer text-slate-600"
            >
              <option value="6_months">Last 6 Months</option>
              <option value="this_year">This Year</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40}>
                  {stats.chartData.map((_, index) => (
                    <Cell key={`cell-${index}`}
                      fill={index === stats.chartData.length - 1 ? '#2563eb' : '#93c5fd'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 text-lg mb-6">Action Center</h3>
          <div className="space-y-4">
            <Link to="/invoices"
              className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Wallet size={18} /></div>
                <div>
                  <p className="text-xs font-black text-slate-700">Collect Payments</p>
                  <p className="text-[10px] text-slate-400 font-bold">{stats.pendingCount} Pending Invoice{stats.pendingCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
            </Link>

            <Link to="/customers"
              className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-indigo-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Users size={18} /></div>
                <div>
                  <p className="text-xs font-black text-slate-700">View Client Ledger</p>
                  <p className="text-[10px] text-slate-400 font-bold">Manage {stats.totalCustomers} Customers</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500" />
            </Link>

            <button
              onClick={() => setShowExport(true)}
              className="w-full p-4 bg-slate-50 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-emerald-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><FileSpreadsheet size={18} /></div>
                <div>
                  <p className="text-xs font-black text-slate-700">Export Excel Report</p>
                  <p className="text-[10px] text-slate-400 font-bold">Monthly, Yearly & Custom</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500" />
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-100">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Revenue This Month</p>
              <h4 className="text-xl font-black mb-1">
                ₹{stats.totalRevenue.toLocaleString('en-IN')}
              </h4>
              <p className="text-[10px] opacity-80">{stats.revTrend} vs last month</p>
              <div className="w-full bg-blue-400 bg-opacity-30 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-white h-full rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-black text-slate-800">Recent Invoices</h3>
          <Link to="/invoices" className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 flex items-center gap-1">
            View All <ChevronRight size={13} />
          </Link>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50/60">
            <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
              <th className="px-8 py-3">Invoice</th>
              <th className="px-8 py-3">Client</th>
              <th className="px-8 py-3">Date</th>
              <th className="px-8 py-3 text-right">Amount</th>
              <th className="px-8 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {stats.recentInvoices.map(inv => (
              <tr key={inv._id} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-8 py-4 font-mono font-bold text-blue-600 text-sm">{inv.invoiceNumber}</td>
                <td className="px-8 py-4 text-xs font-bold text-slate-700 uppercase">{inv.customerName}</td>
                <td className="px-8 py-4 text-xs text-slate-400">{new Date(inv.invoiceDate).toLocaleDateString('en-GB')}</td>
                <td className="px-8 py-4 text-right font-black text-slate-900">
                  ₹{inv.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-8 py-4 text-center">
                  <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                    inv.status === 'Paid'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Modal */}
      {showExport && (
        <ExportModal
          businessId={activeBusiness._id}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;