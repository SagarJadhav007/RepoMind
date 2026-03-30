import { UserRole } from "@/lib/roleService";
import { Badge } from "@/components/ui/badge";

interface RoleBadgeProps {
  role: UserRole;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const roleConfig = {
  admin: {
    label: "Admin",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    description: "Full control over repository",
  },
  maintainer: {
    label: "Maintainer",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    description: "Can create and manage planning items",
  },
  contributor: {
    label: "Contributor",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    description: "Read-only access to repository",
  },
};

export function RoleBadge({ role, size = "md", showLabel = true }: RoleBadgeProps) {
  if (!role) return null;

  const config = roleConfig[role];
  const sizeClass = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  }[size];

  return (
    <Badge variant="outline" className={`${config.color} ${sizeClass} cursor-help`} title={config.description}>
      {showLabel ? config.label : role}
    </Badge>
  );
}

export function RoleIcon({ role }: { role: UserRole }) {
  if (!role) return null;

  const icons = {
    admin: "👑",
    maintainer: "🔧",
    contributor: "👤",
  };

  return <span className="mr-2">{icons[role]}</span>;
}
