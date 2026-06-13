'use client';

export default function EditorialSection() {
    return (
        <section className="py-24 bg-stone-100">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12">
                <div className="text-center mb-16">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold">
                        Inspiration
                    </span>
                    <h2 className="font-serif text-5xl tracking-tighter mt-4">
                        The Journal
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="group cursor-pointer">
                        <div className="aspect-[16/9] overflow-hidden mb-6">
                            <img
                                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80"
                                className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                                alt="Editorial 1"
                            />
                        </div>
                        <h4 className="font-serif text-2xl mb-3 italic">
                            Modern Minimalism: A Guide to Capsule Wardrobes
                        </h4>
                        <p className="text-stone-500 text-sm font-light mb-4">
                            Kam cheezon mein behtareen dikhne ka fan seekhein hamare naye style
                            guide ke saath.
                        </p>
                        <button className="text-[10px] uppercase tracking-widest font-bold border-b border-black pb-1">
                            Read Article
                        </button>
                    </div>

                    <div className="group cursor-pointer">
                        <div className="aspect-[16/9] overflow-hidden mb-6">
                            <img
                                src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80"
                                className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                                alt="Editorial 2"
                            />
                        </div>
                        <h4 className="font-serif text-2xl mb-3 italic">
                            Sustainability in Craft: Behind the Seams
                        </h4>
                        <p className="text-stone-500 text-sm font-light mb-4">
                            Janiye kaise hamara brand environment ko mehfooz rakhne mein apna
                            kirdar ada kar raha hai.
                        </p>
                        <button className="text-[10px] uppercase tracking-widest font-bold border-b border-black pb-1">
                            Read Article
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
