"use client";

import { VehicleTableRowCompact } from "./vehicle-table-row-compact";
import type { Vehicle } from "../types";

type VehicleTableCompactProps = {
  vehicles: Vehicle[];
  startIndex: number;
  onDeleteClick: (vehicle: Vehicle) => void;
};

export function VehicleTableCompact({ vehicles, startIndex, onDeleteClick }: VehicleTableCompactProps) {
  return (
    <div className="hidden lg:block xl:hidden border rounded-lg overflow-hidden bg-white shadow-sm">
      <table className="w-full table-fixed">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
          <tr>
            <th className="px-2 lg:px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-12 lg:w-16">
              <span className="text-gray-500">#</span>
            </th>
            <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20 lg:w-24">
              Photo
            </th>
            <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[20%]">
              Véhicule
            </th>
            <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[15%] hidden lg:table-cell">
              Caract.
            </th>
            <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[10%]">
              Statut
            </th>
            <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[12%]">
              Tarifs
            </th>
            <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[12%] hidden lg:table-cell">
              Localisation
            </th>
            <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[8%] hidden lg:table-cell">
              Activité
            </th>
            <th className="px-2 lg:px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-[8%]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {vehicles.map((vehicle, index) => (
            <VehicleTableRowCompact
              key={vehicle.id}
              vehicle={vehicle}
              index={index}
              startIndex={startIndex}
              onDeleteClick={onDeleteClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

