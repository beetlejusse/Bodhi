import { ReactNode } from "react"

interface Column<T> {
  header: string
  accessor: keyof T | ((item: T) => ReactNode)
  className?: string
  hideOnMobile?: boolean
  hideOnTablet?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onDelete?: (item: T) => void
  getKey: (item: T) => string | number
}

export function DataTable<T>({ columns, data, onDelete, getKey }: DataTableProps<T>) {
  return (
    <div className="rounded-2xl border border-[rgba(55,50,47,0.10)] bg-white shadow-[0px_2px_8px_rgba(55,50,47,0.06)] overflow-hidden animate-fade-in-up">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[rgba(55,50,47,0.08)] bg-[rgba(55,50,47,0.02)]">
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-6 py-3 text-xs font-semibold text-[rgba(55,50,47,0.45)] uppercase tracking-wider ${
                  col.hideOnMobile ? "hidden md:table-cell" : ""
                } ${col.hideOnTablet ? "hidden lg:table-cell" : ""} ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
            {onDelete && (
              <th className="px-6 py-3 text-xs font-semibold text-[rgba(55,50,47,0.45)] uppercase tracking-wider text-right">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr
              key={getKey(item)}
              className={`border-b border-[rgba(55,50,47,0.06)] hover:bg-[rgba(55,50,47,0.02)] transition-colors ${
                i === data.length - 1 ? "border-b-0" : ""
              }`}
            >
              {columns.map((col, j) => {
                const value =
                  typeof col.accessor === "function"
                    ? col.accessor(item)
                    : item[col.accessor]
                
                return (
                  <td
                    key={j}
                    className={`px-6 py-4 ${
                      j === 0 ? "font-semibold text-[#37322F]" : "text-[rgba(55,50,47,0.65)]"
                    } ${col.hideOnMobile ? "hidden md:table-cell" : ""} ${
                      col.hideOnTablet ? "hidden lg:table-cell" : ""
                    }`}
                  >
                    {value as ReactNode}
                  </td>
                )
              })}
              {onDelete && (
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onDelete(item)}
                    className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors px-3 py-1 rounded-full hover:bg-red-50"
                  >
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
