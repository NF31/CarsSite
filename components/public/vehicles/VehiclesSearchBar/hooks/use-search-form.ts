import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VehiclesSearchBarProps, SearchFormData } from "../types";
import { buildSearchParams } from "../utils/search-params";

export function useSearchForm(props: VehiclesSearchBarProps) {
  const router = useRouter();
  const {
    initialPickup = "",
    initialPickupPlaceId = "",
    initialReturnLocation = "",
    initialReturnPlaceId = "",
    initialStartDate = "",
    initialEndDate = "",
    initialStartTime = "",
    initialEndTime = "",
    initialCategory = "cars",
  } = props;

  const [pickupValue, setPickupValue] = useState(initialPickup);
  const [pickupPlaceId, setPickupPlaceId] = useState(initialPickupPlaceId);
  const [returnValue, setReturnValue] = useState(initialReturnLocation);
  const [returnPlaceId, setReturnPlaceId] = useState(initialReturnPlaceId);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [category, setCategory] = useState(initialCategory);
  const [showDifferentReturn, setShowDifferentReturn] = useState(
    initialReturnLocation !== initialPickup && initialReturnLocation !== ""
  );

  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Validation des champs requis
    if (!pickupValue || !pickupPlaceId) {
      return;
    }
    if (!startDate || !startTime || !endDate || !endTime) {
      return;
    }

    const formData: SearchFormData = {
      pickupValue,
      pickupPlaceId,
      returnValue,
      returnPlaceId,
      startDate,
      endDate,
      startTime,
      endTime,
      category,
      showDifferentReturn,
    };

    const params = buildSearchParams(formData);
    router.push(`/vehicles?${params.toString()}`);
  };

  return {
    pickupValue,
    setPickupValue,
    pickupPlaceId,
    setPickupPlaceId,
    returnValue,
    setReturnValue,
    returnPlaceId,
    setReturnPlaceId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    category,
    setCategory,
    showDifferentReturn,
    setShowDifferentReturn,
    handleSearch,
  };
}

