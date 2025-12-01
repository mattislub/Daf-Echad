import { FormEvent, useState } from 'react';
import { ArrowRight, Home, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

interface LoginPageProps {
  onNavigate?: (page: string) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password) return;

    console.info('Login attempt', { email });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
                <Sparkles className="w-4 h-4" />
                {t('login.welcome')}
              </p>
              <h1 className="text-3xl font-bold text-gray-900">{t('login.title')}</h1>
              <p className="text-gray-600 max-w-2xl">{t('login.subtitle')}</p>
            </div>
            <button
              onClick={() => onNavigate?.('catalog')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100"
            >
              <Home className="w-4 h-4" />
              {t('login.cta')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-3">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900">{t('login.title')}</h2>
                  <p className="text-sm text-gray-600">{t('login.security')}</p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800" htmlFor="email">
                      {t('login.email')}
                    </label>
                    <div className="relative">
                      <Mail className={`w-5 h-5 text-gray-400 absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-yellow-500 focus:ring-yellow-200 ${
                          isRTL ? 'pr-10' : 'pl-10'
                        }`}
                        placeholder="name@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800" htmlFor="password">
                      {t('login.password')}
                    </label>
                    <div className="relative">
                      <Lock className={`w-5 h-5 text-gray-400 absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-yellow-500 focus:ring-yellow-200 ${
                          isRTL ? 'pr-10' : 'pl-10'
                        }`}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300 text-yellow-700 focus:ring-yellow-500" />
                      <span className="font-medium">{t('login.remember')}</span>
                    </label>
                    <button type="button" className="font-semibold text-yellow-700 hover:text-yellow-800">
                      {t('login.forgot')}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-yellow-700 to-yellow-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:from-yellow-800 hover:to-yellow-700 disabled:opacity-60"
                    disabled={!email || !password}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {t('login.submit')}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span>{t('login.alt')}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                    onClick={() => onNavigate?.('catalog')}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
                  >
                    <Home className="w-4 h-4" />
                    {t('nav.books')}
                  </button>
                    <button
                      type="button"
                      onClick={() => onNavigate?.('account')}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-lg hover:bg-yellow-100"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {t('account.title')}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-8 flex flex-col gap-6 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-600/20 border border-yellow-500/40 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-yellow-200">{t('account.security')}</p>
                    <p className="text-lg font-semibold">{t('account.securityStatus')}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2" />
                    <div>
                      <p className="font-semibold">{t('account.trackOrdersTitle')}</p>
                      <p className="text-gray-300">{t('account.trackOrdersDescription')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2" />
                    <div>
                      <p className="font-semibold">{t('account.supportTitle')}</p>
                      <p className="text-gray-300">{t('account.supportDescription')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                  <p className="text-sm text-yellow-200">{t('account.membership')}</p>
                  <p className="text-2xl font-bold">{language === 'he' ? 'חבר זהב' : 'Gold member'}</p>
                  <p className="text-sm text-gray-200">{t('account.creditDescription')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
