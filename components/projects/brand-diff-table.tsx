import { Badge } from "@/components/ui/badge";
import type { CompareRow, CompareValue } from "@/lib/projects/compare";
import { cn } from "@/lib/utils";

type Props = {
  rows: CompareRow[];
  caption: string;
  labelA: string;
  labelB: string;
};

function Value({ value }: { value: CompareValue }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {value.colors?.length ? (
        <span className="flex h-4 w-full max-w-32 overflow-hidden rounded-sm border" aria-hidden="true">
          {value.colors.map((hex, index) => (
            <span key={`${hex}-${index}`} className="flex-1" style={{ background: hex }} />
          ))}
        </span>
      ) : null}
      <span className="break-words">{value.text}</span>
    </div>
  );
}

function Status({ changed }: { changed: boolean }) {
  return changed ? <Badge variant="warning">Different</Badge> : <span className="text-muted-foreground">Same</span>;
}

/** Two brands value by value. Changed rows are tinted and say "Different" in text, so it isn't color alone. */
export function BrandDiffTable({ rows, caption, labelA, labelB }: Props) {
  return (
    <>
      <ul aria-label={caption} className="max-h-[55vh] min-w-0 space-y-2 overflow-y-auto text-xs sm:hidden">
        {rows.map((row) => (
          <li
            key={row.id}
            className={cn("rounded-lg border p-3", row.changed && "bg-warning/10")}
            data-changed={row.changed || undefined}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 font-medium break-words">
                <span className="block text-[11px] font-normal text-muted-foreground">{row.group}</span>
                {row.label}
              </h3>
              <Status changed={row.changed} />
            </div>
            <dl className="mt-3 space-y-3">
              <div>
                <dt className="mb-1 font-medium break-words text-muted-foreground">{labelA}</dt>
                <dd>
                  <Value value={row.a} />
                </dd>
              </div>
              <div>
                <dt className="mb-1 font-medium break-words text-muted-foreground">{labelB}</dt>
                <dd>
                  <Value value={row.b} />
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      <div className="hidden max-h-[55vh] overflow-auto rounded-lg border sm:block">
        <table className="w-full border-collapse text-left text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-popover text-muted-foreground">
            <tr className="border-b">
              <th scope="col" className="p-2 font-medium">
                Value
              </th>
              <th scope="col" className="p-2 font-medium">
                {labelA}
              </th>
              <th scope="col" className="p-2 font-medium">
                {labelB}
              </th>
              <th scope="col" className="p-2 font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={cn("border-b align-top last:border-b-0", row.changed && "bg-warning/10")}
                data-changed={row.changed || undefined}
              >
                <th scope="row" className="p-2 font-medium whitespace-nowrap">
                  <span className="block text-[11px] font-normal text-muted-foreground">{row.group}</span>
                  {row.label}
                </th>
                <td className="p-2">
                  <Value value={row.a} />
                </td>
                <td className="p-2">
                  <Value value={row.b} />
                </td>
                <td className="p-2">
                  <Status changed={row.changed} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
