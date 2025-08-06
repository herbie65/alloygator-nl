'use client'

import { useState, useEffect } from 'react'

interface TableData {
  tableName: string
  columns: string[]
  rows: any[]
}

export default function DatabaseViewer() {
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [tableData, setTableData] = useState<TableData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/database/tables')
      const data = await response.json()
      setTables(data.tables)
    } catch (error) {
      console.error('Error fetching tables:', error)
    }
  }

  const fetchTableData = async (tableName: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/database/table/${tableName}`)
      const data = await response.json()
      setTableData(data)
      setSelectedTable(tableName)
    } catch (error) {
      console.error('Error fetching table data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">Database Viewer</h2>
      
      {/* Table Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Selecteer Tabel:</label>
        <select 
          className="w-full border rounded px-3 py-2"
          value={selectedTable}
          onChange={(e) => fetchTableData(e.target.value)}
        >
          <option value="">Kies een tabel...</option>
          {tables.map(table => (
            <option key={table} value={table}>{table}</option>
          ))}
        </select>
      </div>

      {/* Table Data */}
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Laden...</p>
        </div>
      )}

      {tableData && !loading && (
        <div className="overflow-x-auto">
          <h3 className="text-md font-medium mb-3">Tabel: {tableData.tableName}</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {tableData.columns.map((column, index) => (
                  <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {tableData.columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row[column] !== null && row[column] !== undefined ? String(row[column]) : 'NULL'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-sm text-gray-600">
            {tableData.rows.length} rijen gevonden
          </div>
        </div>
      )}
    </div>
  )
} 