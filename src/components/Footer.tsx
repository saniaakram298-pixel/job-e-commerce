'use client';

export default function Footer() {
  return (
    <footer className="bg-stone-50 pt-24 pb-12 px-6 md:px-12 border-t border-stone-200">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          {/* Column 1: Brand */}
          <div className="space-y-6">
            <h4 className="font-serif text-xl tracking-[0.2em] uppercase">
              THE ATELIER
            </h4>
            <p className="text-stone-500 text-xs leading-relaxed font-light">
              A collective of artisans dedicated to creating timeless silhouettes
              for the modern wardrobe. Quality, ethics, and design at our core.
            </p>
          </div>

          {/* Column 2: Client Service */}
          <div>
            <h5 className="text-[11px] uppercase tracking-widest font-bold mb-8">
              Client Service
            </h5>
            <ul className="space-y-4 text-[11px] text-stone-500 uppercase tracking-widest font-light">
              <li>
                <a href="#" className="hover:text-black transition">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-black transition">
                  Shipping & Returns
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-black transition">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-black transition">
                  Size Guide
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Explore */}
          <div>
            <h5 className="text-[11px] uppercase tracking-widest font-bold mb-8">
              Explore
            </h5>
            <ul className="space-y-4 text-[11px] text-stone-500 uppercase tracking-widest font-light">
              <li>
                <a href="#" className="hover:text-black transition">
                  The Journal
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-black transition">
                  Our Story
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-black transition">
                  Sustainability
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-black transition">
                  Stockists
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Socials */}
          <div>
            <h5 className="text-[11px] uppercase tracking-widest font-bold mb-8">
              Follow Us
            </h5>
            <ul className="space-y-4 text-[11px] text-stone-500 uppercase tracking-widest font-light">
              <li>
                <a href="#" className="hover:text-black transition">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-black transition">
                  Pinterest
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-black transition">
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-stone-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[9px] uppercase tracking-[0.3em] text-stone-400">
            © 2026 THE ATELIER PVT LTD. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-8 text-[9px] uppercase tracking-[0.3em] text-stone-400">
            <a href="#" className="hover:text-black transition">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-black transition">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
