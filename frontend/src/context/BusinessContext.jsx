import { createContext, useState, useContext } from 'react';
import api from '../services/api';

const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);

  const fetchBusinesses = async () => {
    try {
      const { data } = await api.get('/businesses');
      setBusinesses(data);
      if (data.length > 0 && !activeBusiness) {
        setActiveBusiness(data[0]); // Default to first
      }
    } catch (error) {
      console.error("Failed to fetch businesses");
    }
  };

  return (
    <BusinessContext.Provider value={{ businesses, activeBusiness, setActiveBusiness, fetchBusinesses }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);