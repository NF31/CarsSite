export type ResolvedSearchParams = Record<string, string | string[] | undefined>;

export type SearchParamsInput =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | Promise<Record<string, string | string[] | undefined>>
  | undefined;

export type ReservationsPageProps = {
  searchParams?: SearchParamsInput;
};

export const HISTORY_PAGE_SIZE = 5;

