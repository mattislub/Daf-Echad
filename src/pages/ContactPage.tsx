import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

interface ContactPageProps {
  onNavigate?: (page: string) => void;
}

export default function ContactPage({ onNavigate }: ContactPageProps) {
  const { language } = useLanguage();
  const isRTL = language === 'he';

  const content = {
    he: {
      title: 'יצירת קשר',
      intro: 'נשמח לעמוד לשירותכם בכל שאלה לגבי הזמנות, משלוחים והמלצות ספרים.',
      phoneLabel: 'טלפון שירות לקוחות',
      phone: '076-598-9131',
      addressLabel: 'כתובת פיזית',
      address: 'רחוב הלב 10, ירושלים, ישראל',
      emailLabel: 'דואר אלקטרוני',
      email: 'info@daf-ehad.co.il',
      hoursLabel: 'שעות פעילות',
      hours: 'א׳-ה׳ 09:00-18:00, ו׳ עד 13:00',
    },
    en: {
      title: 'Contact Us',
      intro: 'We are here to help with orders, shipping questions, and book recommendations.',
      phoneLabel: 'Customer service phone',
      phone: '+972-76-598-9131',
      addressLabel: 'Physical address',
      address: '10 Halev St, Jerusalem, Israel',
      emailLabel: 'Email',
      email: 'info@daf-ehad.co.il',
      hoursLabel: 'Hours',
      hours: 'Sun-Thu 09:00-18:00, Fri until 13:00',
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

        <section className="grid gap-6 md:grid-cols-2">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">{copy.phoneLabel}</h2>
            <p className="text-gray-800 text-lg">{copy.phone}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">{copy.addressLabel}</h2>
            <p className="text-gray-800 text-lg">{copy.address}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">{copy.emailLabel}</h2>
            <p className="text-gray-800 text-lg">{copy.email}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">{copy.hoursLabel}</h2>
            <p className="text-gray-800 text-lg">{copy.hours}</p>
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
