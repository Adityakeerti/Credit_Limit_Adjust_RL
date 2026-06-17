import React, { useState } from 'react'
import './Table.css'

const Table = ({ 
  columns = [], 
  data = [], 
  searchable = false,
  filterable = false,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})

  const filteredData = data.filter((row) => {
    if (searchable && searchTerm) {
      const searchableText = Object.values(row).join(' ').toLowerCase()
      if (!searchableText.includes(searchTerm.toLowerCase())) {
        return false
      }
    }
    
    if (filterable) {
      for (const [key, value] of Object.entries(filters)) {
        if (value && row[key] !== value) {
          return false
        }
      }
    }
    
    return true
  })

  const getUniqueValues = (columnKey) => {
    return [...new Set(data.map(row => row[columnKey]))].filter(Boolean)
  }

  return (
    <div className={`table-container ${className}`}>
      {(searchable || filterable) && (
        <div className="table-controls">
          {searchable && (
            <div className="table-search">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          )}
          
          {filterable && columns.map((col) => {
            if (!col.filterable) return null
            const uniqueValues = getUniqueValues(col.key)
            return (
              <div key={col.key} className="table-filter">
                <select
                  value={filters[col.key] || ''}
                  onChange={(e) => setFilters({ ...filters, [col.key]: e.target.value })}
                  className="filter-select"
                >
                  <option value="">All {col.label}</option>
                  {uniqueValues.map((val) => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      )}

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-empty">
                  No data available
                </td>
              </tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Table

