"use client";

import { memo } from "react";

export const CalendarPageHeader = memo(function CalendarPageHeader() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-bold text-gray-900">Calendrier des réservations</h1>
      <p className="text-gray-600">
        Consultez l&apos;occupation de la flotte en temps réel, identifiez les périodes chargées et
        accédez aux détails clients d&apos;un simple clic.
      </p>
    </div>
  );
});

