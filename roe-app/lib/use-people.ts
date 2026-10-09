// Live people with demo fallback (client). Tries /api/people (session cookie);
// falls back to localStorage demo data when the backend is unreachable so the
// prototype stays reviewable. `live=false` + banner means demo data.
"use client";
import { useEffect, useState } from "react";
import { loadPeople, type Person } from "./data";

export function usePeople() {
  const [remote, setRemote] = useState<Person[] | null>(null);
  const [tried, setTried] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    fetch("/api/people", { credentials: "same-origin" })
      .then((r) => {
        if (r.status === 403) {
          setForbidden(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((j) => {
        if (j?.data) setRemote(j.data as Person[]);
      })
      .catch(() => {})
      .finally(() => setTried(true));
  }, []);

  const demo = tried && remote === null && !forbidden;
  return {
    people: remote ?? loadPeopleSafe(),
    live: remote !== null,
    demo,
    forbidden,
  };
}

function loadPeopleSafe(): Person[] {
  try {
    return loadPeople();
  } catch {
    return [];
  }
}
