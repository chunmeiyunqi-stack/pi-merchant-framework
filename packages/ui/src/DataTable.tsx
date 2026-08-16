import React from 'react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor: (row: T) => string | number;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = '暂无相关记录',
  keyExtractor,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="w-full rounded-3xl bg-slate-900/60 border border-slate-800 p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-800 rounded-xl w-1/4" />
        <div className="h-10 bg-slate-800/60 rounded-xl w-full" />
        <div className="h-10 bg-slate-800/60 rounded-xl w-full" />
        <div className="h-10 bg-slate-800/60 rounded-xl w-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full rounded-3xl bg-slate-900/40 border border-slate-800 p-12 text-center text-slate-500 text-xs font-medium">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-4 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.map((row) => (
              <tr key={keyExtractor(row)} className="hover:bg-slate-800/40 transition-colors">
                {columns.map((col, idx) => (
                  <td key={idx} className={`px-6 py-4 ${col.className || ''}`}>
                    {typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : (row[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
