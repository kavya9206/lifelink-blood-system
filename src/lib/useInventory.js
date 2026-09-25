import { useCallback, useEffect, useState } from "react";
import { isApiMode, apiListInventory } from "@/lib/api";
import { mapInventoryRow } from "@/lib/mappers";
import { useApp } from "@/lib/store";

/**
 * useInventory — single source of truth for inventory.
 * In Flask mode: fetches from `GET /api/inventory` and returns normalized rows.
 * In demo mode: returns store's in-memory inventory directly.
 * Provides `refresh()` to re-fetch after mutations (fulfill, adjust, donation).
 */
export function useInventory() {
  const app = useApp();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRows = useCallback(async () => {
    if (!isApiMode) return; // demo mode uses store directly
    setLoading(true);
    setError(null);
    try {
      const res = await apiListInventory();
      setRows((res.inventory ?? []).map(mapInventoryRow));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isApiMode) fetchRows();
  }, [fetchRows]);

  if (!isApiMode) {
    return {
      inventory: app.data.inventory,
      hospitals: app.data.hospitals,
      loading: false,
      error: null,
      refresh: () => {},
      isApiMode: false,
    };
  }

  return { inventory: rows, loading, error, refresh: fetchRows, isApiMode: true };
}
