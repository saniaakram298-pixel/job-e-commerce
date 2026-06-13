export default function AdminProducts() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-surface-variant bg-surface-container-low p-6 fixed h-screen left-0 top-0">
        <div className="font-serif text-2xl font-bold tracking-widest mb-12">
          ADMIN
        </div>
        <nav className="space-y-2">
          {[
            { label: 'Dashboard', href: '/admin', icon: 'dashboard', active: false },
            { label: 'Products', href: '/admin/products', icon: 'inventory_2', active: true },
            { label: 'Orders', href: '/admin/orders', icon: 'shopping_cart', active: false },
            { label: 'Customers', href: '/admin/customers', icon: 'group', active: false },
            { label: 'Analytics', href: '/admin/analytics', icon: 'analytics', active: false },
            { label: 'Settings', href: '/admin/settings', icon: 'settings', active: false },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-none text-sm uppercase tracking-widest transition ${
                item.active ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="border-b border-surface-variant p-6 flex justify-between items-center bg-surface sticky top-0 z-40">
          <h1 className="font-serif text-3xl tracking-tighter">Products</h1>
          <button className="px-4 py-3 bg-primary text-on-primary text-sm uppercase tracking-widest hover:bg-primary-container transition">
            Add Product
          </button>
        </header>

        {/* Content */}
        <div className="p-8">
          {/* Filters */}
          <div className="mb-8 flex gap-4 flex-wrap">
            <input
              type="text"
              placeholder="Search products..."
              className="input-base flex-1 min-w-64"
            />
            <select className="input-base">
              <option>All Categories</option>
              <option>Women</option>
              <option>Men</option>
              <option>Accessories</option>
            </select>
            <select className="input-base">
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>

          {/* Products Table */}
          <div className="bg-surface-container-low border border-surface-variant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-surface-variant bg-surface">
                  <tr>
                    <th className="text-left p-4 uppercase tracking-widest font-bold text-xs">Name</th>
                    <th className="text-left p-4 uppercase tracking-widest font-bold text-xs">Category</th>
                    <th className="text-left p-4 uppercase tracking-widest font-bold text-xs">Price</th>
                    <th className="text-left p-4 uppercase tracking-widest font-bold text-xs">Stock</th>
                    <th className="text-left p-4 uppercase tracking-widest font-bold text-xs">Rating</th>
                    <th className="text-left p-4 uppercase tracking-widest font-bold text-xs">Status</th>
                    <th className="text-left p-4 uppercase tracking-widest font-bold text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Silk Slip Dress', category: 'Women', price: '$380.00', stock: 24, rating: 4.5, status: 'Active' },
                    { name: 'Premium Blazer', category: 'Women', price: '$520.00', stock: 12, rating: 4.8, status: 'Active' },
                    { name: 'Classic Trousers', category: 'Men', price: '$245.00', stock: 0, rating: 4.2, status: 'Inactive' },
                    { name: 'Leather Bag', category: 'Accessories', price: '$650.00', stock: 8, rating: 4.9, status: 'Active' },
                  ].map((product, i) => (
                    <tr key={i} className="border-b border-surface-variant hover:bg-surface-container-high">
                      <td className="p-4 font-medium">{product.name}</td>
                      <td className="p-4">{product.category}</td>
                      <td className="p-4">{product.price}</td>
                      <td className="p-4">{product.stock}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <span className="text-primary">★</span>
                          {product.rating}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 ${
                          product.status === 'Active'
                            ? 'bg-primary-fixed text-on-primary-fixed'
                            : 'bg-surface-container-high'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <button className="text-primary hover:text-primary-fixed mr-4">Edit</button>
                        <button className="text-error hover:text-on-error">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-secondary">Showing 1-4 of 28 products</p>
            <div className="flex gap-2">
              <button className="px-3 py-2 border border-outline-variant hover:bg-surface-container-high text-sm">
                Previous
              </button>
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  className={`px-3 py-2 text-sm ${
                    page === 1
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant hover:bg-surface-container-high'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button className="px-3 py-2 border border-outline-variant hover:bg-surface-container-high text-sm">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
