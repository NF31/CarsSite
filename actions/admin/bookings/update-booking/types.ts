export type UpdateBookingResult =
  | {
      success: true;
      data: {
        id: string;
        reference: string;
      };
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

