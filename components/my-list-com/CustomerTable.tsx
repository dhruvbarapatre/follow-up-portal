"use client";

export default function CustomerTable({ list, onEdit }: any) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-sky-100">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">#</th>
            <th className="px-4 py-3 text-left font-semibold">Name</th>
            <th className="px-4 py-3 text-left font-semibold">Phone</th>
            <th className="px-4 py-3 text-left font-semibold">Action</th>
          </tr>
        </thead>

        <tbody>
          {list.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="text-center text-gray-500 py-6"
              >
                No customers found.
              </td>
            </tr>
          ) : (list.map((c: any, i: number) => (
            <tr
              key={c._id}
              className="border-t hover:bg-gray-50 transition cursor-pointer"
            >
              <td className="px-4 py-3">{i + 1}</td>
              <td className="px-4 py-3">{c.name}</td>
              <td className="px-4 py-3">{c.phoneNumber}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onEdit(c)}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                >
                  View
                </button>
              </td>
            </tr>
          )))}

          {list.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-gray-500">
                No customers found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
