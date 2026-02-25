import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { businesses, activeBusiness, setActiveBusiness } = useBusiness();
  const { user } = useAuth();

  return (
    <div className="h-16 bg-white shadow-sm flex items-center justify-between px-6 ml-64">
      <div>
        <select 
          className="bg-gray-100 border-none rounded px-4 py-2 font-medium focus:ring-2 focus:ring-blue-500"
          value={activeBusiness?._id || ''}
          onChange={(e) => {
            const bus = businesses.find(b => b._id === e.target.value);
            setActiveBusiness(bus);
          }}
        >
          {businesses.map(b => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
          {businesses.length === 0 && <option>No Business Found</option>}
        </select>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-gray-600">Welcome, {user?.name}</span>
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
          {user?.name?.charAt(0)}
        </div>
      </div>
    </div>
  );
};

export default Navbar;