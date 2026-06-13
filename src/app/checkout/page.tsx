export default function CheckoutPage() {
  return (
    <div>
      <header className="fixed top-0 w-full z-50 px-6 md:px-12 py-6 flex justify-between items-center bg-stone-50/80 backdrop-blur-xl">
        <div className="font-serif text-2xl font-bold tracking-widest text-primary uppercase">
          THE ATELIER
        </div>
      </header>

      <main className="pt-32 pb-20 px-4 md:px-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-serif text-5xl tracking-tighter mb-12">Checkout</h1>

          {/* Progress Steps */}
          <div className="flex gap-8 mb-12">
            {['Shipping', 'Payment', 'Review'].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i === 0
                    ? 'bg-primary text-on-primary'
                    : i <= 0
                    ? 'bg-surface-container-high text-primary'
                    : 'bg-surface-dim text-secondary'
                }`}>
                  {i + 1}
                </div>
                <span className="uppercase tracking-widest text-sm font-bold">{step}</span>
              </div>
            ))}
          </div>

          <form className="space-y-12">
            {/* Shipping Address */}
            <section>
              <h2 className="font-serif text-2xl mb-6 tracking-tighter">Shipping Address</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First Name"
                    className="col-span-1 bg-surface border-b border-outline-variant py-3 px-0 text-sm focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    className="col-span-1 bg-surface border-b border-outline-variant py-3 px-0 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full bg-surface border-b border-outline-variant py-3 px-0 text-sm focus:outline-none focus:border-primary"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full bg-surface border-b border-outline-variant py-3 px-0 text-sm focus:outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="Street Address"
                  className="w-full bg-surface border-b border-outline-variant py-3 px-0 text-sm focus:outline-none focus:border-primary"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    className="col-span-1 bg-surface border-b border-outline-variant py-3 px-0 text-sm focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="State / Province"
                    className="col-span-1 bg-surface border-b border-outline-variant py-3 px-0 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Zip Code"
                    className="col-span-1 bg-surface border-b border-outline-variant py-3 px-0 text-sm focus:outline-none focus:border-primary"
                  />
                  <select className="col-span-1 bg-surface border-b border-outline-variant py-3 px-0 text-sm focus:outline-none focus:border-primary">
                    <option>Select Country</option>
                    <option>United States</option>
                    <option>Canada</option>
                    <option>United Kingdom</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Billing Address */}
            <section>
              <label className="flex items-center gap-3 mb-6">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="uppercase tracking-widest text-sm font-bold">
                  Same as shipping address
                </span>
              </label>
            </section>

            {/* Payment Method */}
            <section>
              <h2 className="font-serif text-2xl mb-6 tracking-tighter">Payment Method</h2>
              <div className="space-y-4">
                {['Credit Card', 'Debit Card', 'PayPal'].map((method) => (
                  <label key={method} className="flex items-center gap-4 p-4 border border-outline-variant cursor-pointer hover:bg-surface-container-low">
                    <input type="radio" name="payment" defaultChecked={method === 'Credit Card'} />
                    <span className="uppercase tracking-widest text-sm font-bold">{method}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Order Summary */}
            <section className="bg-surface-container-low p-8">
              <h2 className="font-serif text-2xl mb-6 tracking-tighter">Order Summary</h2>
              <div className="space-y-4 mb-6 pb-6 border-b border-surface-variant">
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
              <div className="flex justify-between font-serif text-lg">
                <span>Total</span>
                <span>$848.20</span>
              </div>
            </section>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="button"
                className="flex-1 px-6 py-4 border border-outline-variant text-sm uppercase tracking-widest font-bold hover:bg-surface-container-high transition"
              >
                Continue Shopping
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-4 bg-primary text-on-primary text-sm uppercase tracking-widest font-bold hover:bg-primary-container transition"
              >
                Place Order
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
