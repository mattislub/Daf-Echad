import { Book, BookOpen, Bookmark, Users } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function CategoryCards() {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';

  const categories = [
    {
      icon: Book,
      title: t('categories.likutey'),
      color: 'from-gray-800 to-gray-900',
    },
    {
      icon: BookOpen,
      title: t('categories.prayer'),
      color: 'from-slate-700 to-slate-900',
    },
    {
      icon: Bookmark,
      title: t('categories.stories'),
      color: 'from-zinc-700 to-zinc-900',
    },
    {
      icon: Users,
      title: t('categories.children'),
      color: 'from-gray-700 to-gray-900',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {categories.map((category, index) => {
        const Icon = category.icon;
        return (
          <button
            key={index}
            className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-yellow-600/20 hover:border-yellow-600/40"
          >
            <div className={`bg-gradient-to-br ${category.color} p-10 text-white`}>
              <div className="flex flex-col items-center gap-4">
                <Icon className="w-16 h-16 stroke-[1.5]" />
                <h3 className="text-xl font-semibold text-center">{category.title}</h3>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/0 to-yellow-900/0 group-hover:from-yellow-600/10 group-hover:to-yellow-900/10 transition-colors" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
