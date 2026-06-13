'use client';

interface SocialGalleryProps {
    socialImages: string[];
}

export default function SocialGallery({ socialImages }: SocialGalleryProps) {
    return (
        <section className="py-24 bg-stone-100">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 text-center mb-12">
                <span className="text-[10px] uppercase tracking-[0.4em] text-stone-400">
                    Social Gallery
                </span>
                <h2 className="font-serif text-3xl tracking-tighter mt-2">
                    Shop the Look
                </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 px-2">
                {socialImages.map((id, i) => (
                    <div
                        key={i}
                        className="relative group aspect-square overflow-hidden bg-stone-200"
                    >
                        <img
                            src={`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=600`}
                            className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                            alt="Atelier Social"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]">
                            <span className="text-white text-[10px] border border-white px-4 py-2 uppercase tracking-widest">
                                Shop Item
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
