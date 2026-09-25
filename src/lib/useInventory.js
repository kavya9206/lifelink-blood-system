import { useCallback, useEffect, useState } from "react";
import { isApiMode, apiListInventory } from "@/lib/api";
import { mapInventoryRow } from "@/lib/mappers";
import { useApp } from "@/lib/store";

/**
 * useInventory — single source of truth for inventory.
 * In Flask mode: fetches from `GET /api/inventory` and returns normalized rows.
 * In demo mode: returns store's in-memory inventory directly.
 * Provides `refresh()` to re-fetch after mutations (fulfill, adjust, donation).
 *
 * State updates happen inside promise callbacks (never synchronously in the
 * effect body) to avoid render cascades flagged by react-hooks lint rules.
 */
export function useInventory() {
  const app = useApp();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(isApiMode);
  const [error, setError] = useState(null);

  const fetchRows = useCallback(() => {
    if (!isApiMode) return Promise.resolve();
    return apiListInventory()
      .then((res) => {
        setRows((res.inventory ?? []).map(mapInventoryRow));
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isApiMode) return;
    let cancelled = false;
    apiListInventory()
      .then((res) => {
        if (cancelled) return;
        setRows((res.inventory ?? []).map(mapInventoryRow));
        setError(null);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
