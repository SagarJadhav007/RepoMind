import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type PR = {
  id: number;
  title: string;
  author: string;
  risk: "low" | "medium" | "high";
  filesChanged: number;
};

export function PRTable({ prs }: { prs: PR[] }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead className="text-right">
              Files Changed
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {prs.map((pr) => (
            <TableRow key={pr.id} className="hover:bg-muted/50">
              <TableCell className="font-mono text-sm">
                #{pr.id}
              </TableCell>

              <TableCell className="font-medium">
                {pr.title}
              </TableCell>

              <TableCell>@{pr.author}</TableCell>

              <TableCell>
                <Badge
                  variant={
                    pr.risk === "high"
                      ? "destructive"
                      : pr.risk === "medium"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {pr.risk.toUpperCase()}
                </Badge>
              </TableCell>

              <TableCell className="text-right">
                {pr.filesChanged}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
