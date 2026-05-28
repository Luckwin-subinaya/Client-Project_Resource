export default function EntityTable({ data, columns, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-black border border-red-800 rounded-xl shadow-lg overflow-hidden">
        <thead>
          <tr className="bg-black">
            {columns.map(col => (
              <th key={col.key} className="px-6 py-3 text-left text-sm font-semibold text-red-800 tracking-wide">
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="px-6 py-3 text-left text-sm font-semibold text-red-800 tracking-wide">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row._id} className="border-t border-black hover:bg-gray-600/50 transition-colors duration-200">
              {columns.map(col => (
                <td key={col.key} className="px-6 py-4 text-gray-200 text-sm ">
                  {row[col.key]}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-6 py-4 flex gap-3">
                  {onEdit && (
                    <button
                      className="px-3 py-1  text-green-800 rounded-lg  text-sm font-medium"
                      onClick={() => onEdit(row)
                      }
                    >
                      Edit
                    </button>
                  )} 
                  {onDelete && ( 

                    <button
                      className="px-3 py-1 b text-red-700 rounded-lg text-sm font-medium"
                      onClick={() => onDelete(row._id)
                      }
                    >
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}