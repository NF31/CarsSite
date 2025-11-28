import { useEffect, useRef } from "react";
import { format } from "date-fns";
import type { EventInput } from "@fullcalendar/core";
import type { RefObject } from "react";
import type FullCalendar from "@fullcalendar/react";

interface UseDayBackgroundsProps {
  events: EventInput[];
  availability: unknown;
  calendarRef: RefObject<FullCalendar | null>;
}

export function useDayBackgrounds({ events, availability, calendarRef }: UseDayBackgroundsProps) {
  useEffect(() => {
    const updateDayBackgrounds = () => {
      console.log('🔄 [Calendar] Mise à jour des fonds des jours...');
      const allDays = document.querySelectorAll('.fc-daygrid-day:not(.fc-day-past):not(.fc-today)');
      console.log(`📅 [Calendar] ${allDays.length} jours trouvés (hors passés et aujourd'hui)`);
      
      const isDateCoveredByEvent = (date: Date): boolean => {
        return events.some((event) => {
          if (!event.start || !event.end) return false;
          
          const eventStart = event.start instanceof Date ? event.start : new Date(event.start as string | number);
          const eventEnd = event.end instanceof Date ? event.end : new Date(event.end as string | number);
          
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);
          
          return eventStart <= dayEnd && eventEnd >= dayStart;
        });
      };
      
      let daysWithEvents = 0;
      let daysWithoutEvents = 0;
      
      allDays.forEach((day) => {
        const dayElement = day as HTMLElement;
        const dayNumber = dayElement.querySelector('.fc-daygrid-day-number')?.textContent || '?';
        
        const dayDateAttr = dayElement.getAttribute('data-date');
        let dayDate: Date | null = null;
        
        if (dayDateAttr) {
          dayDate = new Date(dayDateAttr + 'T00:00:00');
        } else {
          const calendarApi = calendarRef.current?.getApi();
          if (calendarApi) {
            const view = calendarApi.view;
            if (view && 'activeStart' in view) {
              const activeStart = (view as { activeStart: Date }).activeStart;
              const dayIndex = Array.from(allDays).indexOf(day);
              if (dayIndex !== -1 && activeStart) {
                dayDate = new Date(activeStart);
                dayDate.setDate(activeStart.getDate() + dayIndex);
              }
            }
          }
        }
        
        const hasEventClass = dayElement.classList.contains('fc-has-event');
        const eventElements = dayElement.querySelectorAll('.fc-event, .fc-daygrid-event');
        const eventCount = eventElements.length;
        const hasVisibleEvents = eventCount > 0;
        const isCoveredByEventData = dayDate ? isDateCoveredByEvent(dayDate) : false;
        const hasEvents = hasEventClass || hasVisibleEvents || isCoveredByEventData;
        
        console.log(`📆 [Calendar] Jour ${dayNumber}:`, {
          dayDate: dayDate ? format(dayDate, 'yyyy-MM-dd') : 'non trouvée',
          hasEventClass,
          eventCount,
          hasVisibleEvents,
          isCoveredByEventData,
          hasEvents,
        });
        
        if (hasEvents) {
          const reason = isCoveredByEventData ? 'couvert par données' : `a ${eventCount} événement(s) visible(s)`;
          console.log(`  ➡️ Jour ${dayNumber}: FORCER FOND TRANSPARENT (${reason})`);
          dayElement.style.cssText += 'background: transparent !important; background-color: transparent !important; background-image: none !important;';
          
          const frame = dayElement.querySelector('.fc-daygrid-day-frame') as HTMLElement;
          if (frame) {
            frame.style.cssText += 'background: transparent !important; background-color: transparent !important; background-image: none !important;';
          }
          
          const numberContainer = dayElement.querySelector('.fc-daygrid-day-number')?.parentElement as HTMLElement;
          if (numberContainer) {
            numberContainer.style.cssText += 'background: transparent !important; background-color: transparent !important;';
          }
          
          daysWithEvents++;
        } else {
          console.log(`  ➡️ Jour ${dayNumber}: FORCER FOND VERT (pas d'événements)`);
          dayElement.style.cssText += 'background: linear-gradient(135deg, #ecfdf5, #d1fae5) !important; background-color: #ecfdf5 !important; border: 1px solid #a7f3d0 !important;';
          
          const frame = dayElement.querySelector('.fc-daygrid-day-frame') as HTMLElement;
          if (frame) {
            frame.style.cssText += 'background: linear-gradient(135deg, #ecfdf5, #d1fae5) !important; background-color: #ecfdf5 !important;';
          }
          
          const numberContainer = dayElement.querySelector('.fc-daygrid-day-number')?.parentElement as HTMLElement;
          if (numberContainer) {
            numberContainer.style.cssText += 'background: transparent !important;';
          }
          
          daysWithoutEvents++;
        }
        
        const computedBg = window.getComputedStyle(dayElement).backgroundColor;
        console.log(`  ✓ Jour ${dayNumber}: Background appliqué =`, computedBg);
      });
      
      console.log(`✅ [Calendar] Résumé: ${daysWithEvents} jours avec événements (transparent), ${daysWithoutEvents} jours disponibles (vert)`);
    };

    console.log('🚀 [Calendar] Initialisation de la mise à jour des fonds');
    console.log(`📊 [Calendar] Événements disponibles: ${events.length}`);
    console.log(`📊 [Calendar] Disponibilité chargée:`, availability ? 'Oui' : 'Non');
    
    updateDayBackgrounds();
    
    const timers = [
      setTimeout(() => { console.log('⏰ [Calendar] Timer 50ms'); updateDayBackgrounds(); }, 50),
      setTimeout(() => { console.log('⏰ [Calendar] Timer 100ms'); updateDayBackgrounds(); }, 100),
      setTimeout(() => { console.log('⏰ [Calendar] Timer 200ms'); updateDayBackgrounds(); }, 200),
      setTimeout(() => { console.log('⏰ [Calendar] Timer 300ms'); updateDayBackgrounds(); }, 300),
      setTimeout(() => { console.log('⏰ [Calendar] Timer 500ms'); updateDayBackgrounds(); }, 500),
      setTimeout(() => { console.log('⏰ [Calendar] Timer 1000ms'); updateDayBackgrounds(); }, 1000),
    ];

    const observer = new MutationObserver((mutations) => {
      console.log('👀 [Calendar] Mutation détectée:', mutations.length, 'changements');
      updateDayBackgrounds();
    });

    const calendarContainer = document.querySelector('.fullcalendar-container');
    if (calendarContainer) {
      observer.observe(calendarContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    return () => {
      timers.forEach(timer => clearTimeout(timer));
      observer.disconnect();
    };
  }, [events, availability, calendarRef]);
}

