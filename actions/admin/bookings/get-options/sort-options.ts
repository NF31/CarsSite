import type {
  BookingUserOption,
  BookingServiceOption,
  BookingLocationOption,
} from "./types";

/**
 * Trie les options d'utilisateurs par nom
 */
export function sortUserOptions(users: BookingUserOption[]): void {
  users.sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/**
 * Trie les options de services par nom
 */
export function sortServiceOptions(services: BookingServiceOption[]): void {
  services.sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/**
 * Trie les options d'agences par ville puis par nom
 */
export function sortLocationOptions(locations: BookingLocationOption[]): void {
  locations.sort((a, b) => {
    const cityComparison = a.city.localeCompare(b.city, "fr");
    if (cityComparison !== 0) {
      return cityComparison;
    }
    return a.name.localeCompare(b.name, "fr");
  });
}

