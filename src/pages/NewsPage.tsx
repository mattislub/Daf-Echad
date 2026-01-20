import { ArrowUpRight, Calendar, Tag } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LatestPosts, { LatestPost } from '../components/LatestPosts';
import { useLanguage } from '../context/LanguageContext';

interface NewsPageProps {
  onNavigate?: (page: string) => void;
}

type NewsPost = LatestPost & {
  tag: {
    he: string;
    en: string;
  };
};

export default function NewsPage({ onNavigate }: NewsPageProps) {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';
  const locale = isRTL ? 'he-IL' : 'en-US';

  const newsPosts: NewsPost[] = [
    {
      id: 'post-1',
      title: {
        he: 'שבוע הספר: מבצעים מיוחדים על מהדורות חדשות',
        en: 'Book Week: special deals on new releases',
      },
      excerpt: {
        he: 'לכבוד שבוע הספר פתחנו מבצעי עומק על סדרות חדשות, מארזים וחבילות מתנה.',
        en: 'Celebrate Book Week with special pricing on new series, curated bundles, and gift sets.',
      },
      date: '2024-11-20',
      tag: {
        he: 'מבצעי החודש',
        en: 'Monthly offers',
      },
    },
    {
      id: 'post-2',
      title: {
        he: 'הגיעו ספרי לימוד לילדים במהדורה מחודשת',
        en: 'Updated children study books just arrived',
      },
      excerpt: {
        he: 'גרסאות צבעוניות עם כריכות חדשות, סיכומים קצרים ועזרים לימודיים.',
        en: 'Colorful editions with refreshed covers, quick summaries, and study aids.',
      },
      date: '2024-11-14',
      tag: {
        he: 'חדשות ילדים',
        en: 'Kids updates',
      },
    },
    {
      id: 'post-3',
      title: {
        he: 'מפגש סופרים אונליין עם צוות ההוצאה',
        en: 'Live online meetup with our publishing team',
      },
      excerpt: {
        he: 'אירוע מקוון שבו נספר על מהדורות נדירות, תרגומים חדשים ותכניות לשנה הקרובה.',
        en: 'A virtual event covering rare editions, new translations, and upcoming plans.',
      },
      date: '2024-11-08',
      tag: {
        he: 'אירועים',
        en: 'Events',
      },
    },
    {
      id: 'post-4',
      title: {
        he: 'סדרת רבי נחמן באנגלית חזרה למלאי',
        en: 'Rabbi Nachman English series back in stock',
      },
      excerpt: {
        he: 'מלאי מחודש של סדרות הפופולריות, עם אפשרות למשלוח בינלאומי מהיר.',
        en: 'Restocked popular series with fast worldwide delivery options.',
      },
      date: '2024-11-02',
      tag: {
        he: 'עדכוני מלאי',
        en: 'Stock updates',
      },
    },
  ];

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));

  const getText = (value: { he: string; en: string }) => (isRTL ? value.he : value.en);

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="max-w-5xl">
          <p className="text-sm text-yellow-700 font-semibold mb-2">{t('news.tagline')}</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('news.title')}</h1>
          <p className="text-gray-700">{t('news.subtitle')}</p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className={`lg:w-80 ${isRTL ? 'lg:order-2' : 'lg:order-1'}`}>
            <LatestPosts posts={newsPosts.slice(0, 3)} />
          </aside>
          <section className={`flex-1 space-y-6 ${isRTL ? 'lg:order-1' : 'lg:order-2'}`}>
            {newsPosts.map((post) => (
              <article key={post.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 text-yellow-700">
                    <Tag className="w-4 h-4" />
                    {getText(post.tag)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-yellow-600" />
                    {formatDate(post.date)}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">{getText(post.title)}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{getText(post.excerpt)}</p>
                <button className="text-sm font-semibold text-yellow-700 hover:text-yellow-800 inline-flex items-center gap-2">
                  {t('news.readMore')}
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </article>
            ))}
          </section>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
