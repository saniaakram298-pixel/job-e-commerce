'use client';

export default function WhatsAppButton() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '923001234567';
  const message = encodeURIComponent('Hello, I have a question about a product');
  const href = `https://wa.me/${number}?text=${message}`;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-50">
      <div className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.52 3.48A11.88 11.88 0 0012.03.006 11.95 11.95 0 001.5 11.7c0 2.07.54 4.13 1.57 5.94L.24 23.16l5.79-1.51a11.86 11.86 0 0010 3.35h.02c6.62 0 12-5.36 12-12 0-3.17-1.24-6.15-3.55-8.52z" />
        </svg>
      </div>
    </a>
  );
}
