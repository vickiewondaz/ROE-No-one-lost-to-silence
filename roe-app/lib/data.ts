// ROE demo store — client-side only (alpha, single pilot org).
// Mirrors PRD v1.1 field spec + TRD §16 entities. Real backend replaces this
// with Server Actions + Drizzle + RLS; authz stays server-side.
"use client";

export type Channel = "Call" | "WhatsApp" | "Visit" | "Other";
export type ActionStatus = "Open" | "In Progress" | "Completed" | "Paused";
export type ConnStatus =
  | "Suggested"
  | "Introduced"
  | "ParticipationRecorded"
  | "Confirmed";

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  channel: Channel;
  interests?: string;
  journey: "New" | "Assigned" | "Contacted" | "Connecting" | "Connected";
  assignee: string;
  nextAction: string;
  lastContact?: string;
  group?: string;
}

export interface FollowAction {
  id: string;
  personId: string;
  title: string;
  status: ActionStatus;
  due: string; // Today | Tomorrow | date label
  overdue?: boolean;
  outcome?: string;
}

const SEED_PEOPLE: Person[] = [
  {
    id: "sarah",
    firstName: "Sarah",
    lastName: "Johnson",
    phone: "+234 801 234 5678",
    channel: "WhatsApp",
    interests: "Music, Young Adults",
    journey: "Connecting",
    assignee: "You",
    nextAction: "Introduce to Young Adults",
    lastContact: "Tuesday via WhatsApp",
    group: "Young Adults",
  },
  {
    id: "michael",
    firstName: "Michael",
    lastName: "Adeyemi",
    phone: "+234 803 111 2222",
    channel: "Call",
    interests: "Ushering",
    journey: "Assigned",
    assignee: "You",
    nextAction: "Welcome call",
    lastContact: undefined,
  },
  {
    id: "david",
    firstName: "David",
    lastName: "Okafor",
    phone: "+234 805 999 0000",
    channel: "WhatsApp",
    interests: "Media",
    journey: "Contacted",
    assignee: "Grace",
    nextAction: "Record outcome",
    lastContact: "Yesterday",
  },
];

const SEED_ACTIONS: FollowAction[] = [
  { id: "a1", personId: "sarah", title: "Check in", status: "Open", due: "Today" },
  {
    id: "a2",
    personId: "michael",
    title: "Welcome call",
    status: "Open",
    due: "Today",
  },
  {
    id: "a3",
    personId: "david",
    title: "Follow up visit",
    status: "In Progress",
    due: "Yesterday",
    overdue: true,
  },
];

export function loadPeople(): Person[] {
  if (typeof window === "undefined") return SEED_PEOPLE;
  try {
    const raw = localStorage.getItem("roe.people");
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem("roe.people", JSON.stringify(SEED_PEOPLE));
  return SEED_PEOPLE;
}

export function savePeople(p: Person[]) {
  localStorage.setItem("roe.people", JSON.stringify(p));
}

export function loadActions(): FollowAction[] {
  if (typeof window === "undefined") return SEED_ACTIONS;
  try {
    const raw = localStorage.getItem("roe.actions");
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem("roe.actions", JSON.stringify(SEED_ACTIONS));
  return SEED_ACTIONS;
}

export function saveActions(a: FollowAction[]) {
  localStorage.setItem("roe.actions", JSON.stringify(a));
}
