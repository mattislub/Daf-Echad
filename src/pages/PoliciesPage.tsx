import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

interface PoliciesPageProps {
  onNavigate?: (page: string) => void;
}

export default function PoliciesPage({ onNavigate }: PoliciesPageProps) {
  const { language } = useLanguage();
  const isRTL = language === 'he';

  const content = {
    he: {
      title: 'מדיניות החנות',
      deliveryTitle: 'מדיניות אספקת מוצר או שירות',
      deliveryBody: 'אנו מתחייבים לטיפול מהיר ולשילוח תוך עד 7 ימי עסקים מיום אישור ההזמנה ובכפוף לזמינות המלאי.',
      cancellationTitle: 'מדיניות ביטול עסקה',
      cancellationBody:
        'לקוח רשאי לבטל עסקה בהתאם להוראות חוק הגנת הצרכן, תשמ"א – 1981, ובהתאם לתקנון האתר. ביטול יתאפשר בכתב דרך שירות הלקוחות והחיוב יעודכן לפי שלב ההכנה והמשלוח.',
      privacyTitle: 'פרטיות ואבטחת מידע',
      privacyBody:
        'פרטי הלקוח מאובטחים ולא יועברו לצד ג\' שלא לצורך השימוש באתר. אנו משתמשים באמצעי הגנה מתקדמים כדי לשמור על סודיות ואבטחת העסקאות.',
    },
    en: {
      title: 'Store Policies',
      deliveryTitle: 'Product or Service Supply Policy',
      deliveryBody:
        'We commit to rapid handling and shipping within up to 7 business days from order approval, subject to stock availability.',
      cancellationTitle: 'Cancellation Policy',
      cancellationBody:
        'Customers may cancel an order in accordance with the Israeli Consumer Protection Law, 1981, and the site terms. Cancellation requests must be submitted in writing to customer service, and charges will be adjusted based on preparation and shipping status.',
      privacyTitle: 'Privacy & Security',
      privacyBody:
        "Customer details are secured and will not be shared with third parties except as required to operate the site. We apply advanced safeguards to protect confidentiality and payment security.",
    },
  } as const;

  const copy = content[language];

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />

      <main className="container mx-auto px-4 py-12 space-y-8">
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">{copy.title}</h1>
          <p className="text-gray-700 leading-relaxed">{copy.deliveryBody}</p>
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">{copy.deliveryTitle}</h2>
            <p className="text-gray-700 leading-relaxed">{copy.deliveryBody}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">{copy.cancellationTitle}</h2>
            <p className="text-gray-700 leading-relaxed">{copy.cancellationBody}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">{copy.privacyTitle}</h2>
            <p className="text-gray-700 leading-relaxed">{copy.privacyBody}</p>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
