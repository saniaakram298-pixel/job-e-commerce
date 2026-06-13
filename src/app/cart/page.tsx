export default function CartPage() {
  return (
    <div>
      <header className="fixed top-0 w-full z-50 px-6 md:px-12 py-6 flex justify-between items-center bg-stone-50/80 backdrop-blur-xl">
        <div className="font-serif text-2xl font-bold tracking-widest text-primary uppercase">
          THE ATELIER
        </div>
        <nav className="hidden md:flex space-x-12">
          <a href="/" className="text-secondary hover:text-primary uppercase tracking-widest text-xs">
            Home
          </a>
          <a href="/collections" className="text-secondary hover:text-primary uppercase tracking-widest text-xs">
            Collections
          </a>
        </nav>
        <div className="flex items-center space-x-6">
          <button className="material-symbols-outlined text-primary text-[24px]">favorite</button>
          <button className="material-symbols-outlined text-primary text-[24px]">shopping_bag</button>
        </div>
      </header>

      <main className="pt-32 pb-20 px-4 md:px-12 max-w-7xl mx-auto">
        <h1 className="font-serif text-5xl tracking-tighter mb-12">Shopping Bag</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-6 pb-8 border-b border-surface-variant">
                  <div className="w-24 h-32 bg-surface-container-low flex-shrink-0">
                    <img
                      src={`https://via.placeholder.com/100x150?text=Item+${i}`}
                      alt={`Cart item ${i}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg mb-2">Premium Piece {i}</h3>
                    <p className="text-sm text-secondary mb-3">Size: M | Color: Black</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <label className="text-sm uppercase tracking-widest font-bold">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          defaultValue="1"
                          className="w-12 border-b border-outline-variant py-1 text-center focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-light">$380.00</p>
                        <button className="text-primary text-sm uppercase tracking-widest hover:text-primary-fixed">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-surface-container-low p-8 sticky top-32">
              <h2 className="font-serif text-2xl mb-6 tracking-tighter">Order Summary</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>$760.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>$25.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>$63.20</span>
                </div>
              </div>
              <div className="border-t border-surface-variant pt-4 mb-6">
                <div className="flex justify-between font-serif text-lg">
                  <span>Total</span>
                  <span>$848.20</span>
                </div>
              </div>
              <a
                href="/checkout"
                className="w-full px-6 py-4 bg-primary text-on-primary text-sm uppercase tracking-widest font-bold text-center hover:bg-primary-container transition block"
              >
                Proceed to Checkout
              </a>
              <a
                href="/collections"
                className="w-full px-6 py-4 border border-outline-variant text-sm uppercase tracking-widest font-bold text-center hover:bg-surface-container-high transition block mt-4"
              >
                Continue Shopping
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
