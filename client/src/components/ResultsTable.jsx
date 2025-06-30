import React, { useReducer, useMemo, useEffect, memo } from 'react';
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

// --- STATE MANAGEMENT ---
const initialState = {
  searchInput: '',
  debouncedSearchTerm: '',
  sortConfig: { key: null, direction: 'ascending' },
  currentPage: 1,
  rowsPerPage: 10,
};

function tableReducer(state, action) {
  switch (action.type) {
    case 'SET_SEARCH_INPUT':
      return { ...state, searchInput: action.payload, currentPage: 1 };
    case 'SET_DEBOUNCED_SEARCH_TERM':
      return { ...state, debouncedSearchTerm: action.payload };
    case 'SET_SORT_CONFIG':
      return { ...state, sortConfig: action.payload, currentPage: 1 };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_ROWS_PER_PAGE':
      return { ...state, rowsPerPage: action.payload, currentPage: 1 };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

// --- UTILITIES & HOOKS ---
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const getColumnTypes = (data, headers) => {
  const types = {};
  if (!data || data.length === 0) return types;
  const sample = data.slice(0, 10);

  headers.forEach(header => {
    const nonNullValues = sample.map(row => row[header]).filter(v => v !== null && v !== undefined && v !== '');
    if (nonNullValues.length === 0) {
      types[header] = 'string';
      return;
    }
    // Check for number
    if (nonNullValues.every(v => !isNaN(Number(v)))) {
      types[header] = 'number';
      return;
    }
    // Check for date
    if (nonNullValues.every(v => !isNaN(Date.parse(v)))) {
      types[header] = 'date';
      return;
    }
    types[header] = 'string';
  });
  return types;
};

// --- UI COMPONENTS ---
const SortIndicator = memo(({ direction }) => (
  <span className="ml-2">
    {direction === 'ascending' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
  </span>
));

const TableToolbar = memo(({ searchInput, onSearchChange, totalRecords, isSearching }) => (
  <div className="p-4 relative">
    <input
      type="text"
      placeholder={`Search in ${totalRecords} records...`}
      value={searchInput}
      onChange={(e) => onSearchChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
    />
    {isSearching && <div className="absolute top-1/2 right-8 -translate-y-1/2 text-xs text-gray-500">Searching...</div>}
  </div>
));

const TableHead = memo(({ headers, sortConfig, onSort }) => (
  <thead className="bg-gray-50 dark:bg-gray-700">
    <tr>
      {headers.map((header) => (
        <th
          key={header}
          scope="col"
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
          onClick={() => onSort(header)}
        >
          <div className="flex items-center">
            {header.replace(/_/g, ' ')}
            {sortConfig.key === header && <SortIndicator direction={sortConfig.direction} />}
          </div>
        </th>
      ))}
    </tr>
  </thead>
));

const TableBody = memo(({ rows, headers }) => (
  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
    {rows.map((row, rowIndex) => (
      <tr key={rowIndex} className="hover:bg-gray-100 dark:hover:bg-gray-600">
        {headers.map((header) => (
          <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
            {String(row[header])}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
));

const PaginationControls = memo(({ currentPage, totalPages, totalRows, rowsPerPage, onPageChange, onRowsPerPageChange }) => (
  <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 flex-wrap gap-4">
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <span>Rows per page:</span>
      <select
        value={rowsPerPage}
        onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
        className="border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      >
        {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
      </select>
    </div>
    <div className="text-sm text-gray-600 dark:text-gray-400">
      Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
      <span className="hidden sm:inline"> | Total {totalRows} rows</span>
    </div>
    <div className="flex items-center gap-2">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 border border-gray-300 rounded-md disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages || totalRows === 0} className="p-2 border border-gray-300 rounded-md disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  </div>
));

const SkeletonLoader = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg animate-pulse">
    <div className="p-4"><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div></div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>{Array.from({ length: 5 }).map((_, i) => <th key={i} className="px-6 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div></th>)}</tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: 10 }).map((_, i) => <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div></td>)}</tr>)}
        </tbody>
      </table>
    </div>
    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700"><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div></div>
  </div>
);

// --- MAIN COMPONENT ---
const ResultsTable = ({ data }) => {
  const [state, dispatch] = useReducer(tableReducer, initialState);
  const { searchInput, debouncedSearchTerm, sortConfig, currentPage, rowsPerPage } = state;

  const debouncedValue = useDebounce(searchInput, 300);
  useEffect(() => {
    dispatch({ type: 'SET_DEBOUNCED_SEARCH_TERM', payload: debouncedValue });
  }, [debouncedValue]);

  const headers = useMemo(() => (data && data.length > 0 ? Object.keys(data[0]) : []), [data]);
  const columnTypes = useMemo(() => getColumnTypes(data, headers), [data, headers]);

  const processedRows = useMemo(() => {
    if (!data) return null;
    if (data.length === 0) return [];

    const filteredData = debouncedSearchTerm
      ? data.filter(row => headers.some(header => String(row[header]).toLowerCase().includes(debouncedSearchTerm.toLowerCase())))
      : [...data];

    if (sortConfig.key) {
      const sortKey = sortConfig.key;
      const sortDirection = sortConfig.direction === 'ascending' ? 1 : -1;
      const columnType = columnTypes[sortKey];

      filteredData.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (columnType === 'number') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
          return (valA - valB) * sortDirection;
        } else if (columnType === 'date') {
          valA = Date.parse(valA) || 0;
          valB = Date.parse(valB) || 0;
          return (valA - valB) * sortDirection;
        } else {
          valA = String(valA || '').toLowerCase();
          valB = String(valB || '').toLowerCase();
          return valA.localeCompare(valB) * sortDirection;
        }
      });
    }
    return filteredData;
  }, [data, debouncedSearchTerm, sortConfig, headers, columnTypes]);

  const totalRows = processedRows ? processedRows.length : 0;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const pagedRows = useMemo(() => processedRows ? processedRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage) : [], [processedRows, currentPage, rowsPerPage]);

  if (!processedRows) return <SkeletonLoader />;
  if (processedRows.length === 0 && !debouncedSearchTerm) {
    return <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg"><p className="text-gray-500 dark:text-gray-400">No data to display.</p></div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      <TableToolbar
        searchInput={searchInput}
        onSearchChange={(value) => dispatch({ type: 'SET_SEARCH_INPUT', payload: value })}
        totalRecords={data ? data.length : 0}
        isSearching={searchInput !== debouncedSearchTerm}
      />
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <TableHead
            headers={headers}
            sortConfig={sortConfig}
            onSort={(key) => {
              const direction = sortConfig.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
              dispatch({ type: 'SET_SORT_CONFIG', payload: { key, direction } });
            }}
          />
          <TableBody rows={pagedRows} headers={headers} />
        </table>
      </div>
      {pagedRows.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalRows={totalRows}
          rowsPerPage={rowsPerPage}
          onPageChange={(page) => dispatch({ type: 'SET_CURRENT_PAGE', payload: page })}
          onRowsPerPageChange={(size) => dispatch({ type: 'SET_ROWS_PER_PAGE', payload: size })}
        />
      )}
    </div>
  );
};

export default ResultsTable; 