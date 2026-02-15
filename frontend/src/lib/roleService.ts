import { supabase } from "@/lib/supabase";

export type UserRole = "admin" | "maintainer" | "contributor" | null;

export interface RepoMember {
  id: string;
  repo_full_name: string;
  user_id: string;
  github_username: string;
  role: UserRole;
  added_at: string;
  updated_at: string;
}

interface AddMemberPayload {
  github_username: string;
  role: UserRole;
}

interface UpdateMemberRolePayload {
  role: UserRole;
}

const API_BASE =
  import.meta.env.VITE_API_URL || "https://repomind-577n.onrender.com";

async function getToken(): Promise<string | null> {
  const session = (await supabase.auth.getSession()).data.session;
  return session?.access_token || null;
}

/**
 * Get the current user's role in a specific repository
 */
export async function getCurrentUserRole(repo: string): Promise<UserRole> {
  try {
    const token = await getToken();
    if (!token) return null;

    const response = await fetch(
      `${API_BASE}/contributors/members?repo=${encodeURIComponent(repo)}&limit=100`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) return null;

    const data = await response.json();
    const session = (await supabase.auth.getSession()).data.session;
    const currentUserId = session?.user?.id;

    if (!currentUserId) return null;

    // Find current user in members list
    const currentUserMember = data.members?.find(
      (m: RepoMember) =>
        m.user_id === currentUserId ||
        m.github_username === session?.user?.user_metadata?.user_name,
    );

    return currentUserMember?.role || null;
  } catch (error) {
    console.error("Error fetching current user role:", error);
    return null;
  }
}

/**
 * Get all members of a repository
 */
export async function getRepoMembers(
  repo: string,
  page: number = 1,
  limit: number = 20,
): Promise<{
  members: RepoMember[];
  total: number;
  page: number;
  limit: number;
}> {
  try {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(
      `${API_BASE}/contributors/members?repo=${encodeURIComponent(repo)}&page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch members");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching repo members:", error);
    throw error;
  }
}

/**
 * Add a member to a repository (admin only)
 */
export async function addRepoMember(
  repo: string,
  payload: AddMemberPayload,
): Promise<RepoMember> {
  try {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(
      `${API_BASE}/contributors/members?repo=${encodeURIComponent(repo)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to add member");
    }

    const data = await response.json();
    return data.member;
  } catch (error) {
    console.error("Error adding member:", error);
    throw error;
  }
}

/**
 * Update a member's role (admin only)
 */
export async function updateMemberRole(
  repo: string,
  userId: string,
  payload: UpdateMemberRolePayload,
): Promise<RepoMember> {
  try {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(
      `${API_BASE}/contributors/members/${userId}?repo=${encodeURIComponent(repo)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update member role");
    }

    const data = await response.json();
    return data.member;
  } catch (error) {
    console.error("Error updating member role:", error);
    throw error;
  }
}

/**
 * Remove a member from a repository (admin only)
 */
export async function removeRepoMember(
  repo: string,
  userId: string,
): Promise<void> {
  try {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(
      `${API_BASE}/contributors/members/${userId}?repo=${encodeURIComponent(repo)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to remove member");
    }
  } catch (error) {
    console.error("Error removing member:", error);
    throw error;
  }
}

/**
 * Check if current user is admin
 */
export async function isAdmin(repo: string): Promise<boolean> {
  const role = await getCurrentUserRole(repo);
  return role === "admin";
}

/**
 * Check if current user is maintainer or above
 */
export async function isMaintainerOrAbove(repo: string): Promise<boolean> {
  const role = await getCurrentUserRole(repo);
  return role === "admin" || role === "maintainer";
}

/**
 * Check if current user has any access to repo
 */
export async function hasRepoAccess(repo: string): Promise<boolean> {
  const role = await getCurrentUserRole(repo);
  return role !== null;
}
