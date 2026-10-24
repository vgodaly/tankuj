import { openDatabaseAsync } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import {
  createVehicle,
  initializeDatabase,
  insertRefuel,
  readSnapshot,
} from '@/data/fuel-repository';
import type { RefuelDraft, Snapshot, Vehicle } from '@/domain/fuel';

let connection: Promise<SQLiteDatabase> | null = null;
function database() {
  if (!connection) {
    connection = openDatabaseAsync('tankuj.db')
      .then(async (db) => {
        await initializeDatabase(db);
        return db;
      })
      .catch((error) => {
        connection = null;
        throw error;
      });
  }
  return connection;
}

type FuelStore = Snapshot & {
  loading: boolean;
  error: string | null;
  retry: () => void;
  saveVehicle: (vehicle: Vehicle) => Promise<void>;
  saveRefuel: (draft: RefuelDraft) => Promise<number>;
};
const FuelContext = createContext<FuelStore | null>(null);
const EMPTY: Snapshot = { vehicle: null, refuels: [], gaps: [] };

export function FuelProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const writing = useRef(false);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    database()
      .then(readSnapshot)
      .then((data) => {
        if (mounted) setSnapshot(data);
      })
      .catch(() => {
        if (mounted)
          setError(
            'Históriu sa nepodarilo načítať. Údaje sme nevymazali. Skús načítanie zopakovať.',
          );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [attempt]);
  const saveVehicle = useCallback(async (vehicle: Vehicle) => {
    if (writing.current) throw new Error('Ukladanie už prebieha.');
    writing.current = true;
    try {
      setSnapshot(await createVehicle(await database(), vehicle));
    } finally {
      writing.current = false;
    }
  }, []);
  const saveRefuel = useCallback(async (draft: RefuelDraft) => {
    if (writing.current) throw new Error('Ukladanie už prebieha.');
    writing.current = true;
    try {
      const result = await insertRefuel(await database(), draft);
      setSnapshot(result.snapshot);
      return result.id;
    } finally {
      writing.current = false;
    }
  }, []);
  return (
    <FuelContext
      value={{
        ...snapshot,
        loading,
        error,
        retry: () => setAttempt((value) => value + 1),
        saveVehicle,
        saveRefuel,
      }}
    >
      {children}
    </FuelContext>
  );
}

export function useFuel() {
  const store = useContext(FuelContext);
  if (!store) throw new Error('FuelProvider is missing.');
  return store;
}
