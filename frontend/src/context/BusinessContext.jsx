import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [businesses, setBusinesses] = useState([]); 
  const [loading, setLoading] = useState(true);

  // 1. Memoized Fetch Function (Prevents Infinite Loops)
  const fetchBusinesses = useCallback(async () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;

    try {
      const { data } = await api.get("/businesses");
      const businessList = data || [];
      setBusinesses(businessList);

      // Professional UX: If no active business is set, but we have businesses, 
      // automatically set the first one as active.
      const storedActive = localStorage.getItem("activeBusiness");
      if (!storedActive && businessList.length > 0) {
        selectBusiness(businessList[0]);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("Session expired or unauthenticated.");
      } else {
        console.error("Failed to fetch businesses", error);
      }
    }
  }, []);

  // 2. Select Business (Persistence Logic)
  const selectBusiness = (businessData) => {
    if (!businessData) return;
    setActiveBusiness(businessData);
    localStorage.setItem("activeBusiness", JSON.stringify(businessData));
  };

  // 3. Initialization on App Load
  useEffect(() => {
    const initBusinessContext = async () => {
      setLoading(true);
      
      // A. Restore Active Business from LocalStorage
      const storedBusiness = localStorage.getItem("activeBusiness");
      if (storedBusiness) {
        try {
          setActiveBusiness(JSON.parse(storedBusiness));
        } catch (e) {
          localStorage.removeItem("activeBusiness");
        }
      }

      // B. Fetch the list (memoized function)
      await fetchBusinesses();
      
      setLoading(false);
    };

    initBusinessContext();
  }, [fetchBusinesses]); // Depend on memoized function

  // 4. Logout Logic
  const logoutBusiness = () => {
    setActiveBusiness(null);
    setBusinesses([]);
    localStorage.removeItem("activeBusiness");
  };

  return (
    <BusinessContext.Provider value={{ 
        activeBusiness, 
        setBusiness: selectBusiness, // Renamed for clarity
        businesses, 
        logoutBusiness, 
        loading,
        fetchBusinesses 
    }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);