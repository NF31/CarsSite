"use client";

import { VehicleTableRowFull } from "./vehicle-table-row-full";
import type { Vehicle } from "../types";

type VehicleTableFullProps = {
  vehicles: Vehicle[];
  startIndex: number;
  onDeleteClick: (vehicle: Vehicle) => void;
};

export function VehicleTableFull({ vehicles, startIndex, onDeleteClick }: VehicleTableFullProps) {
  return (
    <div className="hidden xl:block border rounded-lg overflow-hidden bg-white shadow-sm">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
          <tr>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
              <span className="text-gray-500">#</span>
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Photo
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Véhicule
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Caractéristiques
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Statut
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Tarifs
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Localisation
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Activité
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {vehicles.map((vehicle, index) => (
            <VehicleTableRowFull
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

