import { Star, FileText, Edit2, Archive, ArchiveRestore } from 'lucide-react';

const CustomerTable = ({ customers, onFavorite, onEdit, onArchive, onHistory }) => (
  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
    <table className="w-full text-left">
      <thead className="bg-gray-50 text-gray-600 text-sm">
        <tr>
          <th className="p-4 w-10"></th>
          <th className="p-4">Customer Info</th>
          <th className="p-4">Tag</th>
          <th className="p-4">Outstanding</th>
          <th className="p-4">Total Business</th>
          <th className="p-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {customers.length === 0 ? (
          <tr>
            <td colSpan="6" className="p-16 text-center text-gray-300 text-sm font-bold uppercase tracking-widest">
              No customers found
            </td>
          </tr>
        ) : customers.map(c => (
          <tr key={c._id} className={`hover:bg-gray-50 transition-colors ${c.isArchived ? 'opacity-50' : ''}`}>

            {/* Favourite Star */}
            <td className="p-4">
              <button
                onClick={() => onFavorite(c._id, c.isFavorite)}
                title={c.isFavorite ? 'Remove from favourites' : 'Add to favourites'}
              >
                <Star
                  size={20}
                  className={c.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-400 transition-colors'}
                />
              </button>
            </td>

            {/* Customer Info */}
            <td className="p-4">
              <div className="font-bold text-gray-800">{c.name}</div>
              <div className="text-xs text-gray-400">{c.phone}</div>
              {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
            </td>

            {/* Tag */}
            <td className="p-4">
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                c.tag === 'VIP'
                  ? 'bg-purple-100 text-purple-700'
                  : c.tag === 'Corporate'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {c.tag}
              </span>
            </td>

            {/* Outstanding */}
            <td className="p-4">
              <span className={`font-bold ${c.outstanding > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                ₹{(c.outstanding || 0).toLocaleString('en-IN')}
              </span>
            </td>

            {/* Total Business */}
            <td className="p-4 font-mono text-gray-700">
              ₹{(c.totalValue || 0).toLocaleString('en-IN')}
            </td>

            {/* Actions */}
            <td className="p-4">
              <div className="flex justify-end gap-1">

                {/* View Invoice History */}
                <button
                  onClick={() => onHistory(c)}
                  className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                  title="View Invoice History"
                >
                  <FileText size={18} />
                </button>

                {/* Edit */}
                <button
                  onClick={() => onEdit(c)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                  title="Edit Customer"
                >
                  <Edit2 size={18} />
                </button>

                {/* Archive / Unarchive */}
                <button
                  onClick={() => onArchive(c._id, c.isArchived)}
                  className={`p-2 rounded-lg transition-all ${
                    c.isArchived
                      ? 'text-orange-500 hover:text-orange-700 hover:bg-orange-50'
                      : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'
                  }`}
                  title={c.isArchived ? 'Unarchive Customer' : 'Archive Customer'}
                >
                  {c.isArchived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                </button>

              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default CustomerTable;