import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Banner() {
  const { language } = useLanguage();
  const isRTL = language === 'he';
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title_he: 'מבצע מיוחד על ליקוטי מוהר"ן',
      title_en: 'Special Offer on Likutey Moharan',
      subtitle_he: 'הזדמנות נדירה לרכוש את הספר הקדוש במחיר מיוחד',
      subtitle_en: 'A rare opportunity to purchase the holy book at a special price',
      bg: 'from-blue-900 to-blue-700',
    },
    {
      title_he: 'ספרי ילדים חדשים הגיעו',
      title_en: 'New Children Books Arrived',
      subtitle_he: 'סיפורים מרתקים לילדים מעולם ברסלב',
      subtitle_en: 'Fascinating stories for children from the Breslov world',
      bg: 'from-green-900 to-green-700',
    },
    {
      title_he: 'אוסף תפילות מיוחד',
      title_en: 'Special Prayer Collection',
      subtitle_he: 'תפילות ותחינות לכל עת ולכל נושא',
      subtitle_en: 'Prayers for every time and every topic',
      bg: 'from-purple-900 to-purple-700',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative h-80 overflow-hidden rounded-xl shadow-xl" dir={isRTL ? 'rtl' : 'ltr'}>
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className={`w-full h-full bg-gradient-to-r ${slide.bg} flex items-center justify-center text-white`}>
            <div className="text-center px-8">
              <h2 className="text-5xl font-bold mb-4">
                {isRTL ? slide.title_he : slide.title_en}
              </h2>
              <p className="text-xl opacity-90">
                {isRTL ? slide.subtitle_he : slide.subtitle_en}
              </p>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={isRTL ? nextSlide : prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-colors"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>

      <button
        onClick={isRTL ? prevSlide : nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-colors"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
