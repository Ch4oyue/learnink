import * as React from "react";
import { Table as HeroTable } from "@heroui/react";
import { cn } from "@/lib/utils";
type NodeProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
  colSpan?: number;
};
function nodes(children: React.ReactNode): React.ReactElement<NodeProps>[] {
  return React.Children.toArray(children).flatMap((child) =>
    React.isValidElement<NodeProps>(child)
      ? child.type === React.Fragment
        ? nodes(child.props.children)
        : [child]
      : [],
  );
}
// These compatibility markers are consumed by Table and converted into the HeroUI collection.
function TableHeader({ children }: NodeProps) {
  return <>{children}</>;
}
function TableBody({ children }: NodeProps) {
  return <>{children}</>;
}
function TableRow({ children }: NodeProps) {
  return <>{children}</>;
}
function TableHead({ children }: NodeProps) {
  return <>{children}</>;
}
function TableCell({ children }: NodeProps) {
  return <>{children}</>;
}
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, children, ...props }, ref) => {
  const parts = nodes(children);
  const header = parts.find((p) => p.type === TableHeader);
  const body = parts.find((p) => p.type === TableBody);
  const columns = nodes(header?.props.children).flatMap((p) =>
    p.type === TableRow ? nodes(p.props.children) : [p],
  );
  const rows = nodes(body?.props.children);
  return (
    <HeroTable className="relative w-full overflow-hidden" variant="secondary">
      <HeroTable.ScrollContainer tabIndex={0} role="region" aria-label={`${props["aria-label"] ?? "Data table"} scroll area`} className="w-full overflow-auto focus-visible:outline-2 focus-visible:outline-primary">
        <HeroTable.Content
          {...props}
          ref={ref}
          aria-label={props["aria-label"] ?? "Data table"}
          className={cn("w-full caption-bottom text-sm", className)}
        >
          <HeroTable.Header className={cn("[&_tr]:border-b",header?.props.className)}>
            {columns.map((column, index) => (
              <HeroTable.Column
                key={`column-${index}`}
                id={`column-${index}`}
                isRowHeader={index === 0}
                aria-label={
                  typeof column.props.children === "string"
                    ? column.props.children
                    : index === columns.length - 1
                      ? "Actions"
                      : `Column ${index + 1}`
                }
                className={cn(
                  "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
                  column.props.className,
                )}
              >
                {column.props.children ?? " "}
              </HeroTable.Column>
            ))}
          </HeroTable.Header>
          <HeroTable.Body className={cn("[&_tr:last-child]:border-0",body?.props.className)}>
            {rows.map((row, index) => {
              const cells = nodes(row.props.children);
              return (
                <HeroTable.Row
                  key={row.key ?? `row-${index}`}
                  id={String(row.key ?? `row-${index}`)}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50",
                    row.props.className,
                  )}
                >
                  {cells.map((cell, cellIndex) => (
                    <HeroTable.Cell
                      key={`cell-${cellIndex}`}
                      focusMode="child"
                      colSpan={cell.props.colSpan}
                      className={cn("p-4 align-middle", cell.props.className)}
                    >
                      {cell.props.children ?? null}
                    </HeroTable.Cell>
                  ))}
                </HeroTable.Row>
              );
            })}
          </HeroTable.Body>
        </HeroTable.Content>
      </HeroTable.ScrollContainer>
    </HeroTable>
  );
});
Table.displayName = "Table";
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
