import { ArrowUpRight, Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type LatestPost = {
  id: string;
  title: {
    he: string;
    en: string;
  };
  excerpt: {
    he: string;
    en: string;
  };
  date: string;
};

interface LatestPostsProps {
  posts: LatestPost[];
}

export default function LatestPosts({ posts }: LatestPostsProps) {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';
  const locale = isRTL ? 'he-IL' : 'en-US';

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));

  const getText = (value: { he: string; en: string }) => (isRTL ? value.he : value.en);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{t('news.latestPosts')}</h2>
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Calendar className="w-4 h-4 text-yellow-600" />
              <span>{formatDate(post.date)}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">{getText(post.title)}</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">{getText(post.excerpt)}</p>
            <button className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 inline-flex items-center gap-1">
              {t('news.readMore')}
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
