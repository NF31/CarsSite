import { useState, useEffect, useRef, startTransition } from "react";
import { getPublicVehicleByIdAction } from "@/actions/public/vehicles/get-by-id";
import type { Vehicle } from "../types";

export function useVehicleData(vehicleId: string | null) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevVehicleIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevVehicleIdRef.current === vehicleId) {
      return;
    }

    const currentVehicleId = vehicleId;
    prevVehicleIdRef.current = currentVehicleId;

    if (!currentVehicleId) {
      // Utiliser startTransition pour éviter les cascading renders
      startTransition(() => {
        setVehicle(null);
        setLoading(false);
        setError(null);
      });
      return;
    }

    startTransition(() => {
      setLoading(true);
      setError(null);
    });

    getPublicVehicleByIdAction(currentVehicleId)
      .then((result) => {
        // Vérifier que le vehicleId n'a pas changé pendant le chargement
        if (prevVehicleIdRef.current !== currentVehicleId) {
          return;
        }

        if (result.success && result.data) {
          // Convertir null en undefined pour correspondre au type Vehicle
          const vehicleData: Vehicle = {
            ...result.data,
            pricePerWeek: result.data.pricePerWeek ?? undefined,
            pricePerMonth: result.data.pricePerMonth ?? undefined,
            description: result.data.description ?? undefined,
            location: {
              ...result.data.location,
              address: result.data.location.address ?? undefined,
            },
          };
          startTransition(() => {
            setVehicle(vehicleData);
          });
        } else {
          startTransition(() => {
            setError(result.error || "Erreur lors du chargement");
          });
        }
      })
      .catch((err) => {
        // Vérifier que le vehicleId n'a pas changé pendant le chargement
        if (prevVehicleIdRef.current !== currentVehicleId) {
          return;
        }
        startTransition(() => {
          setError("Erreur lors du chargement");
        });
        console.error(err);
      })
      .finally(() => {
        // Vérifier que le vehicleId n'a pas changé pendant le chargement
        if (prevVehicleIdRef.current !== currentVehicleId) {
          return;
        }
        startTransition(() => {
          setLoading(false);
        });
      });
  }, [vehicleId]);

  return { vehicle, loading, error };
}

