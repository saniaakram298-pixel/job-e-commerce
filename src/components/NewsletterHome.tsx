'use client';

export default function NewsletterHome() {
    return (
        <section className="py-24 bg-stone-900 text-white">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 text-center">
                <div className="max-w-2xl mx-auto space-y-8">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-stone-400 font-bold">
                        Stay Connected
                    </span>
                    <h2 className="font-serif text-4xl md:text-5xl tracking-tighter">
                        Join The Atelier Circle
                    </h2>
                    <p className="text-stone-400 font-light text-sm leading-relaxed">
                        Be the first to know about new collections, private sales, and
                        sartorial inspiration. Hum aapka inbox clutter nahi karenge, sirf
                        quality content bhejenge.
                    </p>
                    <form className="flex flex-col md:flex-row gap-4 mt-10">
                        <input
                            type="email"
                            placeholder="Your Email Address"
                            className="flex-1 bg-transparent border-b border-stone-700 py-3 text-sm outline-none focus:border-white transition-colors uppercase tracking-widest font-light"
                        />
                        <button className="bg-white text-black px-12 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-stone-200 transition-all">
                            Subscribe
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
