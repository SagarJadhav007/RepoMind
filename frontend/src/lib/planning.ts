import { supabase } from "./supabase";

const API_URL =
  import.meta.env.VITE_API_URL || "https://localhost:8080/";

export interface PlanningCard {
  id: string;
  title: string;
  description: string;
  linkedPR?: number | null;
  linkedIssue?: number | null;
}

export interface PlanningColumn {
  id: string;
  title: string;
  description: string;
  color: string;
  position: number;
  cards: PlanningCard[];
}

export interface PlanningBoard {
  id: string;
  columns: PlanningColumn[];
}

// Helper to get auth token
async function getAuthToken() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Not authenticated");
  return data.session.access_token;
}

// Helper for API calls
async function apiCall(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown,
) {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("API ERROR:", error);

    throw new Error(
      typeof error.detail === "string"
        ? error.detail
        : JSON.stringify(error.detail, null, 2),
    );
  }

  return response.json();
}

// ==================== Board API ====================
export async function getBoard(repo: string): Promise<PlanningBoard> {
  return apiCall(`/planning/board?repo=${encodeURIComponent(repo)}`);
}

export async function deleteBoard(repo: string) {
  return apiCall(`/planning/board?repo=${encodeURIComponent(repo)}`, "DELETE");
}

// ==================== Column API ====================
export async function createColumn(
  repo: string,
  data: { title: string; description: string; color: string },
) {
  return apiCall(
    `/planning/columns?repo=${encodeURIComponent(repo)}`,
    "POST",
    data,
  );
}

export async function updateColumn(
  columnId: string,
  data: { title: string; description: string; color: string },
) {
  return apiCall(`/planning/columns/${columnId}`, "PUT", data);
}

export async function deleteColumn(columnId: string) {
  return apiCall(`/planning/columns/${columnId}`, "DELETE");
}

export async function reorderColumns(repo: string, columnIds: string[]) {
  return apiCall(
    `/planning/columns/reorder?repo=${encodeURIComponent(repo)}`,
    "PUT",
    {
      column_ids: columnIds.filter(Boolean),
    },
  );
}

// ==================== Card API ====================
export async function createCard(
  columnId: string,
  data: {
    title: string;
    description: string;
    linkedPR?: number | null;
    linkedIssue?: number | null;
  },
) {
  return apiCall(`/planning/columns/${columnId}/cards`, "POST", data);
}

export async function updateCard(
  cardId: string,
  data: {
    title: string;
    description: string;
    linkedPR?: number | null;
    linkedIssue?: number | null;
  },
) {
  return apiCall(`/planning/cards/${cardId}`, "PUT", data);
}

export async function deleteCard(cardId: string) {
  return apiCall(`/planning/cards/${cardId}`, "DELETE");
}

export async function moveCard(
  cardId: string,
  toColumnId: string,
  position: number,
) {
  return apiCall(
    `/planning/cards/move?card_id=${cardId}&to_column_id=${toColumnId}&position=${position}`,
    "PUT",
  );
}

export async function reorderCards(columnId: string, cardIds: string[]) {
  return apiCall(`/planning/cards/reorder?column_id=${columnId}`, "PUT", {
    card_ids: cardIds.filter(Boolean),
  });
}
