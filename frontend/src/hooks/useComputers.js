import { useState, useEffect } from 'react';
import computerService from '../services/computerService';

const useComputers = () => {
  const [computers, setComputers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComputers = async () => {
      try {
        setLoading(true);
        const response = await computerService.getComputers();
        let computersData;

        if (Array.isArray(response)) computersData = response;
        else if (response && typeof response === 'object') computersData = response.data || response.items || response.computers || [];
        else throw new Error('Unexpected response');

        const formatted = computersData.map(comp => ({
          id: comp.id,
          status: comp.status?.trim().toLowerCase() || 'unknown',
          name: comp.name || `Computer #${comp.id}`,
          cpu: comp.cpu,
          gpu: comp.gpu,
          ram: comp.ram,
          ssd: comp.ssd,
          hdd: comp.hdd,
          monitor: comp.monitor,
          mouse: comp.mouse,
          keyboard: comp.keyboard,
          headset: comp.headset,
          mousepad: comp.mousepad
        }));

        setComputers(formatted);
      } catch (err) {
        console.error(err);
        setError('Cannot load computer data');
      } finally {
        setLoading(false);
      }
    };

    fetchComputers();
  }, []);

  const bookComputer = async (computerId, startTime, endTime) => {
    try {
      await computerService.bookComputer(computerId, startTime, endTime);
      const response = await computerService.getComputers();
      const formatted = (response.data || []).map(comp => ({
        id: comp.id,
        status: comp.status?.trim().toLowerCase() || 'unknown',
        name: comp.name || `Computer #${comp.id}`,
      }));
      setComputers(formatted);
    } catch (err) {
      console.error(err);
      setError('Error booking computer');
    }
  };

  return { computers, loading, error, bookComputer };
};

export default useComputers;