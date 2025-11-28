import { memo } from "react";

export const CalendarInstructions = memo(function CalendarInstructions() {
  return (
    <>
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
    </>
  );
});

