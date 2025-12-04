"use client";

import { useEffect } from "react";

export function FullCalendarStyles() {
  useEffect(() => {
    // Charger les styles CSS de FullCalendar
    const links = [
      "https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.19/main.min.css",
      "https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.19/main.min.css",
      "https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid@6.1.19/main.min.css",
    ];

    links.forEach((href) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    });

    return () => {
      // Nettoyer les liens lors du démontage (optionnel)
      links.forEach((href) => {
        const existingLink = document.querySelector(`link[href="${href}"]`);
        if (existingLink) {
          existingLink.remove();
        }
      });
    };
  }, []);

  return null;
}

