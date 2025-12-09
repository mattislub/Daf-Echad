import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { sendEmailRequest } from '../services/api';
import { CreditCard, Shield, Receipt, Mail } from 'lucide-react';

interface CreditChargePageProps {
  onNavigate?: (page: string) => void;
}

interface ChargeFormState {
  orderId: string;
  amount: string;
  currency: 'ILS' | 'USD';
  customerName: string;
  email: string;
  phone: string;
  notes: string;
}

export default function CreditChargePage({ onNavigate }: CreditChargePageProps) {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';

  const [formState, setFormState] = useState<ChargeFormState>({
    orderId: '',
    amount: '',
    currency: 'ILS',
    customerName: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const infoHighlights = useMemo(
    () => [
      {
        title: t('charge.security.title'),
        description: t('charge.security.body'),
        icon: Shield,
      },
      {
        title: t('charge.timelines.title'),
        description: t('charge.timelines.body'),
        icon: CreditCard,
      },
      {
        title: t('charge.receipts.title'),
        description: t('charge.receipts.body'),
        icon: Receipt,
      },
    ],
    [t],
  );

  const handleInputChange = (field: keyof ChargeFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setFormState((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!formState.orderId || !formState.amount || !formState.email) {
      setErrorMessage(t('charge.form.missingRequired'));
      return;
    }

    setSubmitting(true);

    try {
      const currencySymbol = formState.currency === 'ILS' ? '₪' : '$';
      const amountLabel = `${currencySymbol}${Number(formState.amount).toFixed(2)}`;

      const subject = t('charge.email.subject').replace('{orderId}', formState.orderId);

      const textBody = [
        `${t('charge.email.orderId')}: ${formState.orderId}`,
        `${t('charge.email.amount')}: ${amountLabel}`,
        `${t('charge.email.name')}: ${formState.customerName || t('charge.email.notProvided')}`,
        `${t('charge.email.email')}: ${formState.email}`,
        `${t('charge.email.phone')}: ${formState.phone || t('charge.email.notProvided')}`,
        `${t('charge.email.notes')}: ${formState.notes || t('charge.email.notProvided')}`,
      ].join('\n');

      const htmlBody = `
        <h2 style="margin:0 0 12px 0; font-size:18px;">${t('charge.email.subject').replace('{orderId}', formState.orderId)}</h2>
        <ul style="padding:0; margin:0 0 12px 0; list-style:none;">
          <li><strong>${t('charge.email.orderId')}:</strong> ${formState.orderId}</li>
          <li><strong>${t('charge.email.amount')}:</strong> ${amountLabel}</li>
          <li><strong>${t('charge.email.name')}:</strong> ${formState.customerName || t('charge.email.notProvided')}</li>
          <li><strong>${t('charge.email.email')}:</strong> ${formState.email}</li>
          <li><strong>${t('charge.email.phone')}:</strong> ${formState.phone || t('charge.email.notProvided')}</li>
          <li><strong>${t('charge.email.notes')}:</strong> ${formState.notes || t('charge.email.notProvided')}</li>
        </ul>
        <p style="margin:0; font-size:14px; color:#4a5568;">${t('charge.email.footer')}</p>
      `;

      await sendEmailRequest({
        to: 'info@dafechad.com',
        subject,
        text: textBody,
        html: htmlBody,
      });

      setSuccessMessage(t('charge.form.success'));
      setFormState((prev) => ({ ...prev, notes: '' }));
    } catch (error) {
      console.error('Failed to send charge request', error);
      setErrorMessage(t('charge.form.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-3xl p-8 shadow-lg border border-yellow-600/40">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-yellow-300 font-semibold">{t('charge.tagline')}</p>
              <h1 className="text-3xl md:text-4xl font-bold">{t('charge.title')}</h1>
              <p className="text-gray-100 max-w-3xl">{t('charge.subtitle')}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onNavigate?.('cart')}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition"
              >
                {t('charge.backToCart')}
              </button>
              <button
                onClick={() => onNavigate?.('contact')}
                className="px-4 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-xl shadow-md transition"
              >
                {t('charge.contactSupport')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-yellow-100 text-yellow-700">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-yellow-700 font-semibold">{t('charge.j5Label')}</p>
                  <h2 className="text-xl font-bold text-gray-900">{t('charge.j5Title')}</h2>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">{t('charge.j5Description')}</p>
              <ul className="space-y-3">
                <li className="flex gap-3 items-start">
                  <span className="mt-1 w-2 h-2 rounded-full bg-yellow-500" />
                  <p className="text-gray-700">{t('charge.j5Point1')}</p>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="mt-1 w-2 h-2 rounded-full bg-yellow-500" />
                  <p className="text-gray-700">{t('charge.j5Point2')}</p>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="mt-1 w-2 h-2 rounded-full bg-yellow-500" />
                  <p className="text-gray-700">{t('charge.j5Point3')}</p>
                </li>
              </ul>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {infoHighlights.map(({ title, description, icon: Icon }) => (
                <div key={title} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2">
                  <div className="inline-flex p-2 rounded-lg bg-gray-100 text-gray-700">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex items-start gap-4">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-700">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('charge.supportTitle')}</h3>
                <p className="text-gray-700 leading-relaxed">{t('charge.supportDescription')}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-800">
                  <span className="px-3 py-1 bg-gray-100 rounded-full border border-gray-200">{t('kav.phone')}</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full border border-gray-200">info@dafechad.com</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gray-900 text-yellow-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('charge.form.tagline')}</p>
                <h3 className="text-xl font-bold text-gray-900">{t('charge.form.title')}</h3>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">{t('charge.form.orderId')}</label>
                <input
                  type="text"
                  required
                  value={formState.orderId}
                  onChange={handleInputChange('orderId')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder={t('charge.form.orderPlaceholder')}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">{t('charge.form.amount')}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formState.amount}
                    onChange={handleInputChange('amount')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">{t('charge.form.currency')}</label>
                  <select
                    value={formState.currency}
                    onChange={handleInputChange('currency')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="ILS">{t('charge.form.currencyILS')}</option>
                    <option value="USD">{t('charge.form.currencyUSD')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">{t('charge.form.name')}</label>
                <input
                  type="text"
                  value={formState.customerName}
                  onChange={handleInputChange('customerName')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder={t('charge.form.namePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">{t('charge.form.email')}</label>
                <input
                  type="email"
                  required
                  value={formState.email}
                  onChange={handleInputChange('email')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">{t('charge.form.phone')}</label>
                <input
                  type="tel"
                  value={formState.phone}
                  onChange={handleInputChange('phone')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder={t('charge.form.phonePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">{t('charge.form.notes')}</label>
                <textarea
                  value={formState.notes}
                  onChange={handleInputChange('notes')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows={4}
                  placeholder={t('charge.form.notesPlaceholder')}
                />
              </div>

              {successMessage && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">{successMessage}</p>}
              {errorMessage && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{errorMessage}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? t('charge.form.sending') : t('charge.form.submit')}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
