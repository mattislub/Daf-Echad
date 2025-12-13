import { useMemo, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

interface PaymentPageProps {
  checkoutUrl: string | null;
  orderId?: string | null;
  onNavigate?: (page: string) => void;
}

export default function PaymentPage({ checkoutUrl, orderId, onNavigate }: PaymentPageProps) {
  const { t, language } = useLanguage();
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const isRTL = language === 'he';

  const iframeTitle = useMemo(
    () => (language === 'he' ? 'טופס תשלום מאובטח' : 'Secure payment form'),
    [language],
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onNavigate={onNavigate} />

      <main className="container mx-auto px-4 py-10 flex-1">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">
            <div className={`flex flex-col gap-4 ${isRTL ? 'text-right' : ''}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">
                    {t('payment.subtitle')}
                  </p>
                  <h1 className="text-3xl font-bold text-gray-900">{t('payment.title')}</h1>
                  <p className="text-gray-600 mt-2 max-w-2xl">{t('payment.helper')}</p>
                </div>
                {orderId && (
                  <div className="px-4 py-2 bg-yellow-50 text-yellow-800 rounded-xl text-sm font-semibold border border-yellow-200">
                    {t('payment.orderLabel')} {orderId}
                  </div>
                )}
              </div>

              {checkoutUrl ? (
                <div className="relative bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                  {!iframeLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/70 to-white/30">
                      <div className="flex flex-col items-center gap-3 text-gray-600">
                        <div className="h-12 w-12 rounded-full border-4 border-yellow-200 border-t-yellow-600 animate-spin" />
                        <p className="text-sm font-medium">{t('payment.loading')}</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    title={iframeTitle}
                    src={checkoutUrl}
                    onLoad={() => setIframeLoaded(true)}
                    className="w-full h-[70vh] min-h-[640px]"
                    allow="payment *; clipboard-write;"
                  />
                </div>
              ) : (
                <div className="text-center py-16 space-y-4">
                  <p className="text-lg text-gray-700 font-semibold">{t('payment.missing')}</p>
                  <p className="text-gray-500">{t('payment.missingHelper')}</p>
                  <button
                    type="button"
                    onClick={() => onNavigate?.('cart')}
                    className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-yellow-600 text-white font-semibold shadow-sm hover:bg-yellow-700 transition"
                  >
                    {t('payment.backToCart')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
