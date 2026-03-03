// src/context/BusinessContext.js
import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api"; // <--- 1. FIX: Import API

const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [businesses, setBusinesses] = useState([]); // List of all businesses
  const [loading, setLoading] = useState(true);

 // Inside BusinessProvider...
  
 

const fetchBusinesses = async () => {
  const userStr = localStorage.getItem("user");

  // 🚫 DO NOT CALL API IF NOT LOGGED IN
  if (!userStr) return;

  try {
    const { data } = await api.get("/businesses");
    setBusinesses(data || []);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log("Not authenticated. Skipping fetch.");
      return; // STOP LOOP
    }

    console.error("Failed to fetch businesses", error);
  }
};

  // 2. FIX: Combined useEffect for App Load (Persistence + Fetching)
  useEffect(() => {
    const initBusinessContext = async () => {
      // A. Restore Active Business from LocalStorage (Prevents blank page on refresh)
      const storedBusiness = localStorage.getItem("activeBusiness");
      if (storedBusiness) {
        try {
          setActiveBusiness(JSON.parse(storedBusiness));
        } catch (e) {
          localStorage.removeItem("activeBusiness");
        }
      }

      // B. Fetch the list of businesses
      await fetchBusinesses();
      
      setLoading(false);
    };

    initBusinessContext();
  }, []);

  // 3. Set Business (Login)
  const setBusiness = async (businessData) => {
    if (!businessData) return;
    
    // Save to State & Storage
    setActiveBusiness(businessData);
    localStorage.setItem("activeBusiness", JSON.stringify(businessData));

    // Refresh the list (in case it's the first login)
    await fetchBusinesses(); 
  };

  // 4. Logout Business
  const logoutBusiness = () => {
    setActiveBusiness(null);
    setBusinesses([]); // Clear the list so next user doesn't see it
    localStorage.removeItem("activeBusiness");
  };

  return (
    <BusinessContext.Provider value={{ 
        activeBusiness, 
        setBusiness, 
        businesses, 
        logoutBusiness, 
        loading,
        fetchBusinesses // Optional: Export if you need to manually refresh list elsewhere
    }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);