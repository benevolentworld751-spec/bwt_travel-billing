import { Search } from 'lucide-react';

const CustomerFilters = ({ searchTerm, setSearchTerm, filterType, setFilterType, filterTag, setFilterTag }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 flex flex-wrap gap-4 items-center">
    <div className="relative flex-1 min-w-[300px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <input 
        type="text" placeholder="Search customer name or phone..." 
        className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
    
    <select className="border rounded-lg px-3 py-2" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
      <option value="Active">Active Customers</option>
      <option value="Archived">Archived</option>
      <option value="All">All Status</option>
    </select>

    <select className="border rounded-lg px-3 py-2" value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
      <option value="All">All Tags</option>
      <option value="VIP">VIP Only</option>
      <option value="Regular">Regular</option>
      <option value="One-time">One-time</option>
    </select>
  </div>
);

export default CustomerFilters;