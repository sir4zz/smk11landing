const CREDITS = [
  { src: '/images/wm/1.jpg', alt: 'Tim IT TKJ 1' },
  { src: '/images/wm/2.jpg', alt: 'Tim IT TKJ 2' },
  { src: '/images/wm/3.jpg', alt: 'Tim IT TKJ 3' },
  { src: '/images/wm/4.jpg', alt: 'Tim IT TKJ 4' },
];

export default function Credits() {
  return (
    <div className="min-h-[60vh] px-4 py-12">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-[#1B2A4A] mb-2">Tim IT TKJ</h1>
        <p className="text-[#5B7088] mb-8">&copy; 2025-2026. Hak cipta dilindungi.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {CREDITS.map((img) => (
            <img
              key={img.src}
              src={img.src}
              alt={img.alt}
              className="w-full rounded-lg shadow-md object-cover"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
