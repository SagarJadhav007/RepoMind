import { createContext, useContext, useState } from "react";

type RepoContextType = {
  repo: string | null;
  setRepo: (repo: string) => void;
};

const RepoContext = createContext<RepoContextType | null>(null);

export function RepoProvider({ children }: { children: React.ReactNode }) {
  const [repo, setRepoState] = useState<string | null>(
    localStorage.getItem("active_repo")
  );

  const setRepo = (r: string) => {
    setRepoState(r);
    localStorage.setItem("active_repo", r);
  };

  return (
    <RepoContext.Provider value={{ repo, setRepo }}>
      {children}
    </RepoContext.Provider>
  );
}

export function useRepo() {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error("useRepo must be used inside RepoProvider");
  return ctx;
}
