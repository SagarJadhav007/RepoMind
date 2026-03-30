import { useEffect, useState } from "react";
import { useRepo } from "@/context/RepoContext";
import {
  getCurrentUserRole,
  isAdmin,
  isMaintainerOrAbove,
  hasRepoAccess,
  UserRole,
} from "@/lib/roleService";

export function useUserRole() {
  const { repo } = useRepo();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repo) {
      setRole(null);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const userRole = await getCurrentUserRole(repo);
        setRole(userRole);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load role");
        setRole(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [repo]);

  return { role, loading, error };
}

export function useIsAdmin() {
  const { repo } = useRepo();
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!repo) {
      setIsUserAdmin(false);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const admin = await isAdmin(repo);
        setIsUserAdmin(admin);
      } catch {
        setIsUserAdmin(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [repo]);

  return { isAdmin: isUserAdmin, loading };
}

export function useIsMaintainerOrAbove() {
  const { repo } = useRepo();
  const [isMaintainer, setIsMaintainer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!repo) {
      setIsMaintainer(false);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const maintainer = await isMaintainerOrAbove(repo);
        setIsMaintainer(maintainer);
      } catch {
        setIsMaintainer(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [repo]);

  return { isMaintainerOrAbove: isMaintainer, loading };
}

export function useHasRepoAccess() {
  const { repo } = useRepo();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!repo) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const access = await hasRepoAccess(repo);
        setHasAccess(access);
      } catch {
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [repo]);

  return { hasAccess, loading };
}
