import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

interface TermsPageProps {
  onNavigate?: (page: string) => void;
}

export default function TermsPage({ onNavigate }: TermsPageProps) {
  const { language } = useLanguage();
  const isRTL = language === 'he';

  const content = {
    he: {
      title: 'תקנון האתר',
      intro:
        'שימוש באתר וביצוע הזמנה מהווים הסכמה לתקנון. לפני מעבר לתשלום יש לאשר את תנאי התקנון ואת מדיניות הביטול והאספקה.',
      sections: [
        {
          title: 'מהות השירות',
          body: 'האתר מאפשר רכישת ספרי ברסלב ומוצרים נלווים, כולל משלוחים והזמנות מיוחדות.',
        },
        {
          title: 'אישור עסקה',
          body: 'השלמת רכישה דורשת הזנת פרטים מדויקים ואישור הלקוח לתנאי התקנון והמדיניות המפורסמת באתר.',
        },
        {
          title: 'אחריות ושירות',
          body: 'נעניק שירות לקוחות, עדכוני משלוח ואפשרות ביטול לפי חוק הגנת הצרכן, תשמ"א – 1981.',
        },
      ],
    },
    en: {
      title: 'Website Terms',
      intro:
        'Using the site and placing an order constitute acceptance of these terms. Before checkout you must confirm the terms along with the published cancellation and delivery policies.',
      sections: [
        {
          title: 'Service Scope',
          body: 'The site enables purchasing Breslov books and related products, including shipping and special orders.',
        },
        {
          title: 'Order Confirmation',
          body: 'Completing a purchase requires accurate details and your consent to the site terms and posted policies.',
        },
        {
          title: 'Responsibility & Support',
          body: 'We provide customer care, shipping updates, and cancellation rights per the Israeli Consumer Protection Law, 1981.',
        },
      ],
    },
  } as const;

  const copy = content[language];

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />

      <main className="container mx-auto px-4 py-12 space-y-8">
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">{copy.title}</h1>
          <p className="text-lg text-gray-700 leading-relaxed">{copy.intro}</p>
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          {copy.sections.map((section) => (
            <div key={section.title} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
              <p className="text-gray-700 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
