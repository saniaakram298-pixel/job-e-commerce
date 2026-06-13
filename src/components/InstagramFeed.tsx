'use client';

export default function InstagramFeed() {
  const instagramImages = [
    "photo-1515886657613-9f3515b0c78f",
    "photo-1594633312681-425c7b97ccd1",
    "photo-1490481651871-ab68de25d43d",
    "photo-1488161628813-04466f872be2",
    "photo-1523275335684-37898b6baf30",
    "photo-1509631179647-0177331693ae"
  ];

  return (
    <section className="py-24 max-w-[1440px] mx-auto px-6 md:px-12">
      <div className="text-center mb-16">
        <h2 className="font-serif text-3xl tracking-tighter italic hover:opacity-70 transition cursor-pointer">
          @TheAtelier_Official
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mt-2">
          Tag us to be featured
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {instagramImages.map((img, i) => (
          <div
            key={i}
            className="aspect-square overflow-hidden group relative cursor-pointer"
          >
            <img
              src={`https://images.unsplash.com/${img}?auto=format&fit=crop&q=80`}
              className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
              alt={`Social ${i + 1}`}
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="material-symbols-outlined text-white">
                favorite
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
