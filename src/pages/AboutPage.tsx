import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

interface AboutPageProps {
  onNavigate?: (page: string) => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  const { language } = useLanguage();
  const isRTL = language === 'he';

  const content = {
    he: {
      title: 'אודות דף אחד',
      intro:
        'דף אחד הוא בית לכל ספרי ברסלב, עם קטלוג מקוון עשיר, שירות משלוחים לכל יעד ותמיכה קהילתית.',
      missionTitle: 'מה אנחנו עושים',
      mission:
        'אנחנו מרכזים מהדורות קודש, הוצאות מיוחדות ומוצרים נלווים, ומאפשרים רכישה פשוטה ובטוחה בעברית ובאנגלית.',
      valuesTitle: 'למה לבחור בנו',
      values: [
        'מענה אישי ושירות לקוחות זמין',
        'שילוח מהיר עם התחייבות לאספקה עד 7 ימי עסקים בישראל',
        'חוויית קנייה מאובטחת והתאמה אישית של משלוח ותשלום',
      ],
    },
    en: {
      title: 'About Daf Echad',
      intro:
        'Daf Echad brings authentic Breslov books together in one trusted online catalog with worldwide delivery and community care.',
      missionTitle: 'What We Do',
      mission:
        'We curate sacred editions, special prints, and related products, making it easy to order securely in Hebrew or English.',
      valuesTitle: 'Why Shop With Us',
      values: [
        'Personal support and responsive customer care',
        'Fast handling with a commitment to delivery within 7 business days in Israel',
        'Secure checkout with tailored shipping and payment options',
      ],
    },
  } as const;

  const copy = content[language];

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />

      <main className="container mx-auto px-4 py-12 space-y-10">
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">{copy.title}</h1>
          <p className="text-lg text-gray-700 leading-relaxed">{copy.intro}</p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">{copy.missionTitle}</h2>
            <p className="text-gray-700 leading-relaxed">{copy.mission}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">{copy.valuesTitle}</h2>
            <ul className="list-disc text-gray-700 leading-relaxed space-y-2 pl-5">
              {copy.values.map((value) => (
                <li key={value}>{value}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
