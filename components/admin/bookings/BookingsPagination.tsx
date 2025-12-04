"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface BookingsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
  startIndex: number;
  itemsPerPage: number;
  totalItems: number;
}

export function BookingsPagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNext,
  hasPrev,
  startIndex,
  itemsPerPage,
  totalItems,
}: BookingsPaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i += 1) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 3; i <= totalPages; i += 1) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = currentPage - 1; i <= currentPage + 1; i += 1) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="bg-white px-3 sm:px-4 lg:px-6 py-4 flex items-center justify-between border-t border-gray-200 mt-6 rounded-lg shadow-sm">
      {totalPages > 1 && (
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPrev}
            className="relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Précédent
          </button>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNext}
            className="ml-2 sm:ml-3 relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Suivant
          </button>
        </div>
      )}

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-shrink">
          <p className="text-xs sm:text-sm text-gray-700 whitespace-nowrap font-medium">
            Affichage de <span className="font-semibold text-gray-900">{startIndex + 1}</span> à{" "}
            <span className="font-semibold text-gray-900">
              {Math.min(startIndex + itemsPerPage, totalItems)}
            </span>{" "}
            sur <span className="font-semibold text-gray-900">{totalItems}</span> réservation
            {totalItems > 1 ? "s" : ""}
          </p>
        </div>
        {totalPages > 1 && (
          <div className="flex-shrink-0">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!hasPrev}
                className="relative inline-flex items-center px-2 sm:px-2.5 py-2 rounded-l-md border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              {getPageNumbers().map((page, index) => (
                <button
                  type="button"
                  key={`page-${page}-${index}`}
                  onClick={() => typeof page === "number" && onPageChange(page)}
                  disabled={typeof page !== "number"}
                  className={`relative inline-flex items-center px-2.5 sm:px-4 py-2 border text-xs sm:text-sm font-medium transition-colors ${
                    page === currentPage
                      ? "z-10 bg-amber-50 border-amber-500 text-amber-600"
                      : page === "..."
                      ? "border-gray-300 bg-white text-gray-700 cursor-default"
                      : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasNext}
                className="relative inline-flex items-center px-2 sm:px-2.5 py-2 rounded-r-md border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}


