"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
// Les styles CSS de FullCalendar doivent être importés via un CDN ou un fichier CSS local
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import { getVehicleAvailabilityAction, unblockVehicleDatesAction } from "@/actions/admin/vehicles";
import { BlockDatesDialog } from "./BlockDatesDialog";
import { UnblockDatesDialog } from "./UnblockDatesDialog";
import { EventDetailsDialog } from "./EventDetailsDialog";
import { EditBlockedDatesDialog } from "./EditBlockedDatesDialog";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import type { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import frLocale from "@fullcalendar/core/locales/fr";
import "@/app/calendar.css";

interface AvailabilityCalendarProps {
  vehicleId: string;
}

export function AvailabilityCalendar({ vehicleId }: AvailabilityCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [availability, setAvailability] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isUnblockDialogOpen, setIsUnblockDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEventDetailsDialogOpen, setIsEventDetailsDialogOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<{
    id: string;
    startDate: Date;
    endDate: Date;
    reason?: string | null;
  } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<{
    title: string;
    startDate: Date;
    endDate: Date;
    type: "BOOKING" | "MAINTENANCE" | "MERGED_BLOCKS";
    details?: any;
  } | null>(null);
  const [currentViewStart, setCurrentViewStart] = useState<Date | null>(null);
  const [currentViewEnd, setCurrentViewEnd] = useState<Date | null>(null);
  const isRefreshingRef = useRef(false);
  const lastDatesRef = useRef<{ start: string | null; end: string | null }>({ start: null, end: null });

  const refreshAvailability = useCallback(async (startDate: Date, endDate: Date) => {
    // Éviter les appels multiples simultanés
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

  // Charger la disponibilité initiale (une seule fois au montage)
  useEffect(() => {
    const loadAvailability = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const start = startOfMonth(subMonths(new Date(), 1));
        const end = endOfMonth(addMonths(new Date(), 1));
        
        // Sauvegarder la période initiale
        setCurrentViewStart(start);
        setCurrentViewEnd(end);
        
        // Initialiser lastDatesRef pour éviter les appels inutiles
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
  }, [vehicleId]); // Seulement quand vehicleId change

  // Fonction pour fusionner les blocages qui se chevauchent
  const mergeOverlappingBlocks = (maintenances: any[]) => {
    const blockedMaintenances = maintenances.filter((m: any) => m.type === "BLOCKED");
    const otherMaintenances = maintenances.filter((m: any) => m.type !== "BLOCKED");
    
    if (blockedMaintenances.length === 0) {
      return { merged: [], others: otherMaintenances };
    }

    // Trier par date de début
    const sorted = [...blockedMaintenances].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const merged: Array<{
      startDate: Date;
      endDate: Date;
      blocks: any[];
      allIds: string[];
    }> = [];
    
    for (const block of sorted) {
      const blockStart = new Date(block.startDate);
      const blockEnd = new Date(block.endDate);
      
      // Chercher un groupe existant qui chevauche ce blocage
      let foundGroup = false;
      for (const group of merged) {
        const groupStart = group.startDate instanceof Date ? group.startDate : new Date(group.startDate);
        const groupEnd = group.endDate instanceof Date ? group.endDate : new Date(group.endDate);
        
        // Vérifier si les périodes se chevauchent (pas besoin de vérifier les adjacents pour la fusion)
        if (blockStart <= groupEnd && blockEnd >= groupStart) {
          // Fusionner : prendre le min start et max end
          group.startDate = blockStart < groupStart ? blockStart : groupStart;
          group.endDate = blockEnd > groupEnd ? blockEnd : groupEnd;
          group.blocks.push(block);
          group.allIds.push(block.id);
          foundGroup = true;
          break;
        }
      }
      
      if (!foundGroup) {
        // Créer un nouveau groupe
        merged.push({
          startDate: blockStart,
          endDate: blockEnd,
          blocks: [block],
          allIds: [block.id],
        });
      }
    }

    return { merged, others: otherMaintenances };
  };

  // Transformer les données en événements pour FullCalendar
  const { merged: mergedBlocks, others: otherMaintenances } = availability
    ? mergeOverlappingBlocks(availability.maintenances)
    : { merged: [], others: [] };

  const events: EventInput[] = availability
    ? [
        // Réservations
        ...availability.bookings.map((booking: any) => {
          // Appliquer les couleurs selon le statut selon la charte graphique
          let backgroundColor = "#dc2626";
          let borderColor = "#b91c1c";
          let className = "booking-event";
          
          if (booking.status === "CONFIRMED") {
            backgroundColor = "#dbeafe"; // primary-100
            borderColor = "#3b82f6"; // primary-500
            className += " status-confirmed";
          } else if (booking.status === "COMPLETED") {
            backgroundColor = "#34d399"; // secondary-400
            borderColor = "#10b981"; // secondary-500
            className += " status-completed";
          } else if (booking.status === "CANCELLED") {
            backgroundColor = "#ef4444"; // error
            borderColor = "#dc2626";
            className += " status-cancelled";
          } else if (booking.status === "PENDING") {
            backgroundColor = "#f59e0b"; // warning
            borderColor = "#d97706";
            className += " status-pending";
          }
          
          return {
            id: `booking-${booking.id}`,
            title: `Réservation ${booking.reference}`,
            start: new Date(booking.startDate),
            end: new Date(booking.endDate),
            backgroundColor,
            borderColor,
            className,
            allDay: false, // Permettre l'affichage des heures
            extendedProps: {
              type: "BOOKING",
              id: booking.id,
              reference: booking.reference,
              status: booking.status,
            },
          };
        }),
        // Blocages fusionnés (pour éviter l'illisibilité)
        ...mergedBlocks.map((mergedBlock) => {
          const blockCount = mergedBlock.blocks.length;
          const start = mergedBlock.startDate;
          const end = mergedBlock.endDate;
          
          // Formater le titre avec le nombre de blocages fusionnés
          let title = blockCount === 1 
            ? "Dates bloquées" 
            : `Dates bloquées (${blockCount} blocages)`;
          
          // Vérifier si les heures sont différentes de minuit/minuit
          const hasSpecificHours = 
            start.getHours() !== 0 || start.getMinutes() !== 0 ||
            end.getHours() !== 23 || end.getMinutes() !== 59;
          
          if (hasSpecificHours) {
            title = blockCount === 1
              ? `Bloqué ${format(start, "HH:mm")} - ${format(end, "HH:mm")}`
              : `Bloqué ${format(start, "HH:mm")} - ${format(end, "HH:mm")} (${blockCount} blocages)`;
          }
          
          return {
            id: `merged-blocks-${mergedBlock.allIds.join("-")}`,
            title,
            start,
            end,
            backgroundColor: "#6b7280", // neutral-500
            borderColor: "#4b5563", // neutral-600
            className: "booking-event status-blocked",
            allDay: false,
            extendedProps: {
              type: "MERGED_BLOCKS",
              blockIds: mergedBlock.allIds,
              blocks: mergedBlock.blocks.map((block: any) => ({
                id: block.id,
                startDate: block.startDate,
                endDate: block.endDate,
                description: block.description,
              })), // Stocker tous les blocages avec leurs IDs pour l'édition
              count: blockCount,
            },
          };
        }),
        // Autres maintenances (non-bloquées)
        ...otherMaintenances.map((maintenance: any) => {
          const backgroundColor = "#f59e0b"; // warning
          const borderColor = "#d97706";
          const className = "booking-event status-pending";
          
          return {
            id: `maintenance-${maintenance.id}`,
            title: `Maintenance - ${maintenance.type}`,
            start: new Date(maintenance.startDate),
            end: new Date(maintenance.endDate),
            backgroundColor,
            borderColor,
            className,
            allDay: false,
            extendedProps: {
              type: "MAINTENANCE",
              id: maintenance.id,
              status: maintenance.status,
              maintenanceType: maintenance.type,
              description: maintenance.description,
            },
          };
        }),
      ]
    : [];

  console.log('🎯 [Calendar] Total événements créés:', events.length);
  events.forEach((event, index) => {
    console.log(`  Événement ${index + 1}:`, {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      type: (event.extendedProps as any)?.type,
    });
  });

  // Forcer le fond vert pour les jours disponibles et transparent pour ceux avec événements
  useEffect(() => {
    const updateDayBackgrounds = () => {
      console.log('🔄 [Calendar] Mise à jour des fonds des jours...');
      // Trouver TOUS les jours du calendrier
      const allDays = document.querySelectorAll('.fc-daygrid-day:not(.fc-day-past):not(.fc-today)');
      console.log(`📅 [Calendar] ${allDays.length} jours trouvés (hors passés et aujourd'hui)`);
      
      // Fonction pour vérifier si une date est couverte par un événement
      const isDateCoveredByEvent = (date: Date): boolean => {
        return events.some((event) => {
          if (!event.start || !event.end) return false;
          
          // Convertir les dates d'événement en Date
          const eventStart = event.start instanceof Date ? event.start : new Date(event.start as string | number);
          const eventEnd = event.end instanceof Date ? event.end : new Date(event.end as string | number);
          
          // Normaliser les dates au début de journée pour la comparaison
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);
          
          // Vérifier si le jour chevauche avec l'événement
          return eventStart <= dayEnd && eventEnd >= dayStart;
        });
      };
      
      let daysWithEvents = 0;
      let daysWithoutEvents = 0;
      
      allDays.forEach((day) => {
        const dayElement = day as HTMLElement;
        const dayNumber = dayElement.querySelector('.fc-daygrid-day-number')?.textContent || '?';
        
        // Obtenir la date du jour depuis l'attribut data-date de FullCalendar
        // FullCalendar ajoute un attribut data-date au format "YYYY-MM-DD"
        const dayDateAttr = dayElement.getAttribute('data-date');
        let dayDate: Date | null = null;
        
        if (dayDateAttr) {
          // Format: "2025-11-07"
          dayDate = new Date(dayDateAttr + 'T00:00:00');
        } else {
          // Fallback: essayer de construire depuis le calendrier actuel
          // Utiliser le calendrier pour obtenir la date
          const calendarApi = calendarRef.current?.getApi();
          if (calendarApi) {
            // Essayer de trouver la date depuis le view actuel
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
        
        // Vérifier si le jour a des événements visibles dans le DOM
        const hasEventClass = dayElement.classList.contains('fc-has-event');
        const eventElements = dayElement.querySelectorAll('.fc-event, .fc-daygrid-event');
        const eventCount = eventElements.length;
        const hasVisibleEvents = eventCount > 0;
        
        // Vérifier si le jour est couvert par un événement dans les données
        const isCoveredByEventData = dayDate ? isDateCoveredByEvent(dayDate) : false;
        
        // Un jour a des événements s'il y en a dans le DOM OU s'il est couvert par les données d'événements
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
          // Si le jour a des événements, forcer le fond transparent
          const reason = isCoveredByEventData ? 'couvert par données' : `a ${eventCount} événement(s) visible(s)`;
          console.log(`  ➡️ Jour ${dayNumber}: FORCER FOND TRANSPARENT (${reason})`);
          dayElement.style.cssText += 'background: transparent !important; background-color: transparent !important; background-image: none !important;';
          
          // Forcer aussi sur le frame et tous les enfants
          const frame = dayElement.querySelector('.fc-daygrid-day-frame') as HTMLElement;
          if (frame) {
            frame.style.cssText += 'background: transparent !important; background-color: transparent !important; background-image: none !important;';
          }
          
          // Forcer aussi sur le conteneur de numéro
          const numberContainer = dayElement.querySelector('.fc-daygrid-day-number')?.parentElement as HTMLElement;
          if (numberContainer) {
            numberContainer.style.cssText += 'background: transparent !important; background-color: transparent !important;';
          }
          
          daysWithEvents++;
        } else {
          // Si le jour n'a PAS d'événements, forcer le fond vert
          console.log(`  ➡️ Jour ${dayNumber}: FORCER FOND VERT (pas d'événements)`);
          dayElement.style.cssText += 'background: linear-gradient(135deg, #ecfdf5, #d1fae5) !important; background-color: #ecfdf5 !important; border: 1px solid #a7f3d0 !important;';
          
          // Forcer aussi sur le frame
          const frame = dayElement.querySelector('.fc-daygrid-day-frame') as HTMLElement;
          if (frame) {
            frame.style.cssText += 'background: linear-gradient(135deg, #ecfdf5, #d1fae5) !important; background-color: #ecfdf5 !important;';
          }
          
          // Forcer aussi sur le conteneur de numéro
          const numberContainer = dayElement.querySelector('.fc-daygrid-day-number')?.parentElement as HTMLElement;
          if (numberContainer) {
            numberContainer.style.cssText += 'background: transparent !important;';
          }
          
          daysWithoutEvents++;
        }
        
        // Vérifier après application
        const computedBg = window.getComputedStyle(dayElement).backgroundColor;
        console.log(`  ✓ Jour ${dayNumber}: Background appliqué =`, computedBg);
      });
      
      console.log(`✅ [Calendar] Résumé: ${daysWithEvents} jours avec événements (transparent), ${daysWithoutEvents} jours disponibles (vert)`);
    };

    console.log('🚀 [Calendar] Initialisation de la mise à jour des fonds');
    console.log(`📊 [Calendar] Événements disponibles: ${events.length}`);
    console.log(`📊 [Calendar] Disponibilité chargée:`, availability ? 'Oui' : 'Non');
    
    // Exécuter immédiatement
    updateDayBackgrounds();
    
    // Exécuter après plusieurs délais pour s'assurer que le calendrier est rendu
    const timers = [
      setTimeout(() => { console.log('⏰ [Calendar] Timer 50ms'); updateDayBackgrounds(); }, 50),
      setTimeout(() => { console.log('⏰ [Calendar] Timer 100ms'); updateDayBackgrounds(); }, 100),
      setTimeout(() => { console.log('⏰ [Calendar] Timer 200ms'); updateDayBackgrounds(); }, 200),
      setTimeout(() => { console.log('⏰ [Calendar] Timer 300ms'); updateDayBackgrounds(); }, 300),
      setTimeout(() => { console.log('⏰ [Calendar] Timer 500ms'); updateDayBackgrounds(); }, 500),
      setTimeout(() => { console.log('⏰ [Calendar] Timer 1000ms'); updateDayBackgrounds(); }, 1000),
    ];

    // Observer les changements du DOM pour réappliquer les styles
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
  }, [events, availability]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const start = new Date(selectInfo.start);
    const end = new Date(selectInfo.end);
    
    // Vérifier que la date de début n'est pas dans le passé
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    
    if (start < today) {
      alert("Vous ne pouvez pas sélectionner des dates passées. Veuillez sélectionner une date à partir d'aujourd'hui.");
      selectInfo.view.calendar.unselect();
      return;
    }
    
    // Si la date de fin est la même que la date de début, mettre la fin de journée
    if (end.getTime() === start.getTime()) {
      end.setHours(23, 59, 59, 999);
    }
    
    setSelectedDates({
      start,
      end,
    });
    
    // Ouvrir automatiquement le dialog de blocage
    setIsBlockDialogOpen(true);
    
    // Réinitialiser la sélection après avoir capturé les dates
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const extendedProps = event.extendedProps as any;
    
    // Gérer les blocages fusionnés
    if (extendedProps.type === "MERGED_BLOCKS") {
      // Afficher les détails avec tous les blocages fusionnés
      setSelectedEvent({
        title: `Dates bloquées (${extendedProps.count} blocages)`,
        startDate: new Date(event.start!),
        endDate: new Date(event.end!),
        type: "MERGED_BLOCKS",
        details: {
          ...extendedProps,
          blocks: extendedProps.blocks, // Liste de tous les blocages
        },
      });
      setIsEventDetailsDialogOpen(true);
    } else if (extendedProps.type === "MAINTENANCE" && extendedProps.maintenanceType === "BLOCKED" && extendedProps.status !== "CANCELLED") {
      // Ouvrir le dialog de déblocage pour un blocage individuel
      setSelectedMaintenance({
        id: extendedProps.id,
        startDate: new Date(event.start!),
        endDate: new Date(event.end!),
        reason: extendedProps.description || null,
      });
      setIsUnblockDialogOpen(true);
    } else {
      // Afficher les détails de l'événement
      setSelectedEvent({
        title: event.title,
        startDate: new Date(event.start!),
        endDate: new Date(event.end!),
        type: extendedProps.type === "BOOKING" ? "BOOKING" : "MAINTENANCE",
        details: extendedProps,
      });
      setIsEventDetailsDialogOpen(true);
    }
  };

  const handleUnblockConfirm = async () => {
    if (!selectedMaintenance) return;
    
    const result = await unblockVehicleDatesAction(selectedMaintenance.id);
    if (result.success) {
      // Rafraîchir avec la période actuelle
      if (currentViewStart && currentViewEnd) {
        refreshAvailability(currentViewStart, currentViewEnd);
      }
    } else {
      // Afficher une erreur (vous pouvez utiliser toast ici)
      console.error(result.error || "Erreur lors du déblocage");
    }
  };

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    // Rafraîchir avec la période actuelle
    if (currentViewStart && currentViewEnd) {
      refreshAvailability(currentViewStart, currentViewEnd);
    }
  };

  const handleDatesSet = useCallback((arg: any) => {
    // Éviter les appels si déjà en cours de rafraîchissement
    if (isRefreshingRef.current) return;
    
    const newStart = new Date(arg.start);
    const newEnd = new Date(arg.end);
    
    // Normaliser les dates pour la comparaison (format YYYY-MM-DD)
    const normalizeDate = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.toISOString().split('T')[0]; // Format YYYY-MM-DD
    };
    
    const newStartStr = normalizeDate(newStart);
    const newEndStr = normalizeDate(newEnd);
    
    // Comparer avec les dernières dates chargées (stockées dans useRef pour éviter les re-renders)
    if (lastDatesRef.current.start !== newStartStr || lastDatesRef.current.end !== newEndStr) {
      // Mettre à jour les références
      lastDatesRef.current.start = newStartStr;
      lastDatesRef.current.end = newEndStr;
      
      // Mettre à jour l'état
      setCurrentViewStart(newStart);
      setCurrentViewEnd(newEnd);
      
      // Charger les données pour la période affichée
      refreshAvailability(newStart, newEnd);
    }
  }, [refreshAvailability]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Chargement du calendrier...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-4" />
            <p className="text-destructive font-medium">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendrier de disponibilité
            {availability?.vehicle && (
              <span className="text-base font-normal text-muted-foreground ml-2">
                - {availability.vehicle.brand} {availability.vehicle.model} ({availability.vehicle.licensePlate})
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <BlockDatesDialog
              vehicleId={vehicleId}
              selectedStartDate={selectedDates.start || undefined}
              selectedEndDate={selectedDates.end || undefined}
              open={isBlockDialogOpen}
              onOpenChange={setIsBlockDialogOpen}
              onSuccess={() => {
                setIsBlockDialogOpen(false);
                setSelectedDates({ start: null, end: null });
                // Rafraîchir avec la période actuelle
                if (currentViewStart && currentViewEnd) {
                  refreshAvailability(currentViewStart, currentViewEnd);
                }
              }}
            />
            
            {selectedMaintenance && (
              <>
                <UnblockDatesDialog
                  open={isUnblockDialogOpen}
                  onOpenChange={setIsUnblockDialogOpen}
                  maintenanceId={selectedMaintenance.id}
                  startDate={selectedMaintenance.startDate}
                  endDate={selectedMaintenance.endDate}
                  reason={selectedMaintenance.reason}
                  onConfirm={handleUnblockConfirm}
                  onEdit={handleEditClick}
                />
                <EditBlockedDatesDialog
                  open={isEditDialogOpen}
                  onOpenChange={setIsEditDialogOpen}
                  maintenanceId={selectedMaintenance.id}
                  currentStartDate={selectedMaintenance.startDate}
                  currentEndDate={selectedMaintenance.endDate}
                  currentReason={selectedMaintenance.reason}
                  onSuccess={handleEditSuccess}
                />
              </>
            )}
            
            {selectedEvent && (
              <EventDetailsDialog
                open={isEventDetailsDialogOpen}
                onOpenChange={setIsEventDetailsDialogOpen}
                title={selectedEvent.title}
                startDate={selectedEvent.startDate}
                endDate={selectedEvent.endDate}
                type={selectedEvent.type}
                details={selectedEvent.details}
                onEditBlock={(blockId, startDate, endDate, reason) => {
                  // Trouver le blocage dans les maintenances pour obtenir l'ID complet
                  const maintenance = availability?.maintenances.find((m: any) => m.id === blockId);
                  if (maintenance) {
                    setSelectedMaintenance({
                      id: maintenance.id,
                      startDate,
                      endDate,
                      reason: reason || null,
                    });
                    setIsEditDialogOpen(true);
                  }
                }}
              />
            )}
          </div>
        </div>
        
        {/* Instructions et Légende */}
        <div className="mt-4 pt-4 border-t space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>💡 Comment utiliser :</strong> Cliquez et glissez sur le calendrier pour sélectionner une période à bloquer, ou cliquez sur un événement &quot;Dates bloquées&quot; pour le débloquer ou le modifier.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Légende des statuts :</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Disponible */}
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <div className="w-4 h-4 rounded bg-green-50 border-2 border-green-200 flex-shrink-0"></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Disponible</span>
                  <span className="text-xs text-muted-foreground">Aucune réservation ni blocage</span>
                </div>
              </div>
              
              {/* Réservé (Confirmé) */}
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <div className="w-4 h-4 rounded bg-blue-50 border-2 border-blue-500 flex-shrink-0"></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Réservé (Confirmé)</span>
                  <span className="text-xs text-muted-foreground">Réservation confirmée - Statut: CONFIRMED</span>
                </div>
              </div>
              
              {/* Terminé */}
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <div className="w-4 h-4 rounded bg-green-200 border-2 border-green-500 flex-shrink-0"></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Terminé</span>
                  <span className="text-xs text-muted-foreground">Réservation terminée - Statut: COMPLETED</span>
                </div>
              </div>
              
              {/* En attente */}
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <div className="w-4 h-4 rounded bg-orange-200 border-2 border-orange-500 flex-shrink-0"></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">En attente</span>
                  <span className="text-xs text-muted-foreground">Réservation en attente - Statut: PENDING</span>
                </div>
              </div>
              
              {/* Annulé */}
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <div className="w-4 h-4 rounded bg-red-200 border-2 border-red-500 flex-shrink-0"></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Annulé</span>
                  <span className="text-xs text-muted-foreground">Réservation annulée - Statut: CANCELLED</span>
                </div>
              </div>
              
              {/* Bloqué */}
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: "#6b7280", border: "2px solid #4b5563" }}></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Bloqué</span>
                  <span className="text-xs text-muted-foreground">Dates bloquées manuellement - Type: BLOCKED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="fullcalendar-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            locale={frLocale}
            firstDay={1}
            selectable={true}
            selectMirror={true}
            selectOverlap={false}
            selectConstraint={{
              start: new Date().toISOString().split('T')[0], // Aujourd'hui au format YYYY-MM-DD
            }}
            // Configuration spécifique pour les vues timeGrid (semaine et jour)
            views={{
              timeGridWeek: {
                selectable: true,
                selectMirror: true,
              },
              timeGridDay: {
                selectable: true,
                selectMirror: true,
              },
              dayGridMonth: {
                selectable: true,
                selectMirror: true,
              },
            }}
            dayMaxEvents={true}
            weekends={true}
            events={events}
            select={handleDateSelect}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            height="auto"
            eventDisplay="block"
            allDaySlot={true}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            buttonText={{
              today: "Aujourd'hui",
              month: "Mois",
              week: "Semaine",
              day: "Jour",
            }}
          />
        </div>

        {availability?.bookings && availability.bookings.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="font-semibold mb-3">Réservations actives</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availability.bookings.map((booking: any) => (
                <div key={booking.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="destructive" className="text-xs">
                      {booking.reference}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {booking.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(booking.startDate), "dd/MM/yyyy")} - {format(new Date(booking.endDate), "dd/MM/yyyy")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {availability?.maintenances && availability.maintenances.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="font-semibold mb-3">Maintenances programmées</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availability.maintenances.map((maintenance: any) => (
                <div key={maintenance.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant="outline" 
                      className={maintenance.type === "BLOCKED" ? "bg-gray-100 text-gray-700 border-gray-300" : "bg-orange-50 text-orange-700 border-orange-200"}
                    >
                      {maintenance.type === "BLOCKED" ? "Bloqué" : maintenance.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {maintenance.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(maintenance.startDate), "dd/MM/yyyy")} - {format(new Date(maintenance.endDate), "dd/MM/yyyy")}
                  </p>
                  {maintenance.description && (
                    <p className="text-xs text-muted-foreground mt-1">{maintenance.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
