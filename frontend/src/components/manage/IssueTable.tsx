import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Issue = {
  id: number;
  title: string;
  labels: string[];
  comments: number;
};

type Props = {
  issues: Issue[];
  selected: number[];
  onToggle: (id: number) => void;
};

export function IssueTable({ issues, selected, onToggle }: Props) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Labels</TableHead>
            <TableHead className="text-right">Comments</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {issues.map((issue) => (
            <TableRow key={issue.id} className="hover:bg-muted/50">
              <TableCell>
                <Checkbox
                  checked={selected.includes(issue.id)}
                  onCheckedChange={() => onToggle(issue.id)}
                />
              </TableCell>

              <TableCell className="font-mono text-sm">
                #{issue.id}
              </TableCell>

              <TableCell className="font-medium">
                {issue.title}
              </TableCell>

              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {issue.labels.map((l) => (
                    <Badge key={l} variant="outline" className="text-xs">
                      {l}
                    </Badge>
                  ))}
                </div>
              </TableCell>

              <TableCell className="text-right text-muted-foreground">
                {issue.comments}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
