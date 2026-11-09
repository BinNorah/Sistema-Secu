export default function SchoolTable({ columns, rows, rowKey = 'id', emptyMessage = 'No hay registros para mostrar.' }) {
  return (
    <div className="school-table-wrap">
      <table className="school-table">
        <thead>
          <tr>{columns.map((column) => <th key={column.key} className={column.align || ''}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={row[rowKey] ?? index}>
              {columns.map((column) => (
                <td key={column.key} className={column.align || ''}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          )) : (
            <tr><td className="school-table-empty" colSpan={columns.length}>{emptyMessage}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
