import React, { useState, useMemo } from "react";
import { Search, Inbox } from "lucide-react";

export const DataTable = ({
  columns = [],
  data = [],
  searchKey = "name",
  searchPlaceholder = "Search records...",
  filterKey = null,
  filterOptions = [],
  actions = null,
  emptyMessage = "No matching records found in this view.",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Search filter
      const searchVal = item[searchKey] || "";
      const matchesSearch = String(searchVal)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Dropdown filter
      const matchesFilter =
        selectedFilter === "ALL" ||
        (filterKey && String(item[filterKey]) === selectedFilter);

      return matchesSearch && matchesFilter;
    });
  }, [data, searchQuery, selectedFilter, searchKey, filterKey]);

  return (
    <div className="data-table-card">
      <div className="table-toolbar">
        <div className="table-search-box">
          <Search size={16} className="table-search-icon" />
          <input
            type="text"
            className="table-search-input"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="table-filter-group">
          {filterOptions.length > 0 && filterKey && (
            <select
              className="filter-select"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <option value="ALL">All Categories / Status</option>
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {actions}
        </div>
      </div>

      <div className="table-responsive">
        <table className="erp-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row, rowIdx) => (
                <tr key={row._id || row.id || rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx}>
                      {col.render
                        ? col.render(row[col.accessor], row, rowIdx)
                        : row[col.accessor] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>
                  <div className="table-empty-state">
                    <Inbox size={40} className="table-empty-icon" />
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
