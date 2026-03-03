import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  // 1. FIX: Assign default empty array to 'businesses' to prevent map crash
  // 2. NOTE: Ensure your Context returns 'setBusiness' (based on previous code) or 'setActiveBusiness'
  const { activeBusiness, setBusiness, businesses = [] } = useBusiness();
  const { user } = useAuth();

  const handleBusinessChange = (e) => {
    const businessId = e.target.value;
    // Safety check: ensure businesses array exists
    const selectedBusiness = businesses?.find(b => b._id === businessId);
    if (selectedBusiness) {
      setBusiness(selectedBusiness);
    }
  };

  return (
    <div className="h-16 bg-white shadow-sm flex items-center justify-between px-6 ml-64">
      <div>
        <select 
          className="bg-gray-100 border-none rounded px-4 py-2 font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer"
          value={activeBusiness?._id || ''} // Handle null activeBusiness
          onChange={handleBusinessChange}
        >
          {/* 3. FIX: Use optional chaining (?.) */}
          {businesses?.length > 0 ? (
            businesses.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))
          ) : (
            // Fallback if list is empty or undefined
            <option value="" disabled>
              {activeBusiness ? activeBusiness.name : "No Businesses Found"}
            </option>
          )}
        </select>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-gray-600">Welcome, {user?.name}</span>
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
          {user?.name?.charAt(0) || 'U'}
        </div>
      </div>
    </div>
  );
};

export default Navbar;