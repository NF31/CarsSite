"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, Edit } from "lucide-react";
import { format } from "date-fns";

interface EventDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  startDate: Date;
  endDate: Date;
  type: "BOOKING" | "MAINTENANCE" | "MERGED_BLOCKS";
  details?: {
    reference?: string;
    status?: string;
    maintenanceType?: string;
    description?: string | null;
    blocks?: Array<{
      id: string;
      startDate: Date | string;
      endDate: Date | string;
      description?: string | null;
    }>;
    count?: number;
  };
  onEditBlock?: (blockId: string, startDate: Date, endDate: Date, reason?: string | null) => void;
}

export function EventDetailsDialog({
  open,
  onOpenChange,
  title,
  startDate,
  endDate,
  type,
  details,
  onEditBlock,
}: EventDetailsDialogProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      case "PENDING":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "SCHEDULED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Détails de l&apos;événement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Type :</span>
            <Badge variant="outline">
              {type === "BOOKING" ? "Réservation" : type === "MERGED_BLOCKS" ? "Blocages fusionnés" : "Maintenance"}
            </Badge>
            {details?.status && (
              <Badge className={getStatusColor(details.status)}>
                {details.status}
              </Badge>
            )}
            {type === "MERGED_BLOCKS" && details?.count && (
              <Badge variant="outline" className="bg-gray-100 text-gray-800">
                {details.count} blocage{details.count > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {details?.reference && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Référence :</span>
              <span className="text-sm font-semibold">{details.reference}</span>
            </div>
          )}

          {details?.maintenanceType && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Type de maintenance :</span>
              <Badge variant="outline">{details.maintenanceType}</Badge>
            </div>
          )}

          <div className="space-y-2 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Période globale :</span>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <span className="text-sm font-medium text-muted-foreground">Du</span>
              <span className="text-sm font-semibold">{format(startDate, "dd/MM/yyyy HH:mm")}</span>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <span className="text-sm font-medium text-muted-foreground">Au</span>
              <span className="text-sm font-semibold">{format(endDate, "dd/MM/yyyy HH:mm")}</span>
            </div>
          </div>

          {/* Afficher la liste des blocages individuels si c'est un blocage fusionné */}
          {type === "MERGED_BLOCKS" && details?.blocks && details.blocks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Blocages individuels ({details.blocks.length})
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {details.blocks.map((block, index) => {
                  const blockStart = typeof block.startDate === "string" ? new Date(block.startDate) : block.startDate;
                  const blockEnd = typeof block.endDate === "string" ? new Date(block.endDate) : block.endDate;
                  return (
                    <div key={block.id || index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          Blocage #{index + 1}
                        </Badge>
                        {onEditBlock && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              onEditBlock(block.id, blockStart, blockEnd, block.description);
                              onOpenChange(false);
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Modifier
                          </Button>
                        )}
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Du :</span>
                          <span className="font-semibold">{format(blockStart, "dd/MM/yyyy HH:mm")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Au :</span>
                          <span className="font-semibold">{format(blockEnd, "dd/MM/yyyy HH:mm")}</span>
                        </div>
                        {block.description && (
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <span className="text-muted-foreground">Raison :</span>
                            <p className="text-xs mt-1">{block.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {details?.description && type !== "MERGED_BLOCKS" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Description</span>
              </div>
              <p className="text-sm p-3 bg-muted rounded-lg">{details.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

