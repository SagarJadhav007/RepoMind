export interface PlanningCardType {
  id: string;
  title: string;
  description: string;
  linkedPR?: number | null;
  linkedIssue?: number | null;
}

export interface PlanningColumnType {
  id: string;
  title: string;
  description: string;
  color: string;
  cards: PlanningCardType[];
}

export const COLUMN_COLORS = [
  { name: "Slate", value: "hsl(215, 16%, 47%)" },
  { name: "Red", value: "hsl(0, 72%, 51%)" },
  { name: "Orange", value: "hsl(25, 95%, 53%)" },
  { name: "Amber", value: "hsl(45, 93%, 47%)" },
  { name: "Green", value: "hsl(142, 71%, 45%)" },
  { name: "Teal", value: "hsl(168, 76%, 42%)" },
  { name: "Blue", value: "hsl(217, 91%, 60%)" },
  { name: "Indigo", value: "hsl(239, 84%, 67%)" },
  { name: "Purple", value: "hsl(270, 91%, 65%)" },
  { name: "Pink", value: "hsl(330, 81%, 60%)" },
];
