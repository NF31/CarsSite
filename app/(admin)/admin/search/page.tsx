import { globalSearchAction, type SearchResult } from "@/actions/admin/search";
import { SearchPageClient } from "@/components/admin/search";

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const searchTerm = query.trim();

  let result: SearchResult | null = null;

  if (searchTerm) {
    const searchResult = await globalSearchAction(searchTerm);
    if (searchResult.success && searchResult.data) {
      result = searchResult.data;
    }
  }

  return <SearchPageClient initialResult={result} />;
}
