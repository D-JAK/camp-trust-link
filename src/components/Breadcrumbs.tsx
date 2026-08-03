import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export type Crumb = {
  label: string;
  to?: string;
  search?: Record<string, unknown>;
};

/** Compact breadcrumb trail. The last item is always the current page. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {index > 0 ? <ChevronRight className="size-3 shrink-0 opacity-60" /> : null}
              {item.to && !last ? (
                <Link
                  to={item.to as "/"}
                  search={(item.search ?? {}) as never}
                  className="max-w-[12rem] truncate hover:text-foreground hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={last ? "max-w-[16rem] truncate font-medium text-foreground" : "max-w-[12rem] truncate"}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
