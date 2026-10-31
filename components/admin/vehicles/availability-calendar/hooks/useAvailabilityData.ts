import { useState, useEffect, useRef, useCallback } from "react";
import { getVehicleAvailabilityAction, type VehicleAvailabilityData } from "@/actions/admin/vehicles";
import { startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";

export function useAvailabilityData(vehicleId: string) {
  const [availability, setAvailability] = useState<VehicleAvailabilityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentViewStart, setCurrentViewStart] = useState<Date | null>(null);
  const [currentViewEnd, setCurrentViewEnd] = useState<Date | null>(null);
  const isRefreshingRef = useRef(false);
  const lastDatesRef = useRef<{ start: string | null; end: string | null }>({ start: null, end: null });

  const refreshAvailability = useCallback(async (startDate: Date, endDate: Date) => {
    if (isRefreshingRef.current) return;
    
    isRefreshingRef.current = true;
    try {
      const result = await getVehicleAvailabilityAction(vehicleId, startDate, endDate);
      if (result.success && result.data) {
        setAvailability(result.data);
      }
    } catch (error) {
      console.error("Error refreshing availability:", error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [vehicleId]);

  useEffect(() => {
    const loadAvailability = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const start = startOfMonth(subMonths(new Date(), 1));
        const end = endOfMonth(addMonths(new Date(), 1));
        
        setCurrentViewStart(start);
        setCurrentViewEnd(end);
        
        const normalizeDate = (date: Date) => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d.toISOString().split('T')[0];
        };
        lastDatesRef.current = {
          start: normalizeDate(start),
          end: normalizeDate(end),
        };
        
        const result = await getVehicleAvailabilityAction(vehicleId, start, end);
        
        if (result.success && result.data) {
          setAvailability(result.data);
        } else {
          setError(result.error || "Erreur lors du chargement");
        }
      } catch (err) {
        setError("Une erreur inattendue s'est produite");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailability();
  }, [vehicleId]);

  return {
    availability,
    isLoading,
    error,
    currentViewStart,
    currentViewEnd,
    setCurrentViewStart,
    setCurrentViewEnd,
    refreshAvailability,
    isRefreshingRef,
    lastDatesRef,
  };
}

