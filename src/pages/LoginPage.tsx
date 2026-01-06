import { FormEvent, useState } from 'react';
import { ArrowRight, Home, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import {
  loginCustomer,
  requestTemporaryPassword,
  sendAccountAccessEmail,
  requestCustomerEmailLoginCode,
  verifyCustomerEmailLoginCode,
} from '../services/api';
import { CustomerAccount } from '../types';

interface LoginPageProps {
  onNavigate?: (page: string) => void;
  onLoginSuccess?: (account: CustomerAccount) => void;
}

const hebrewCharRegex = /\p{Script=Hebrew}/u;
const detectTextDirection = (value: string) => (hebrewCharRegex.test(value) ? 'rtl' : 'ltr');

export default function LoginPage({ onNavigate, onLoginSuccess }: LoginPageProps) {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [loginStatus, setLoginStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [loginError, setLoginError] = useState('');
  const [customerProfile, setCustomerProfile] = useState<CustomerAccount | null>(null);
  const [loginMethod, setLoginMethod] = useState<'password' | 'email'>('password');
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeStatus, setEmailCodeStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [emailCodeError, setEmailCodeError] = useState('');
  const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [requestError, setRequestError] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resetError, setResetError] = useState('');

  const emailDirection = email ? detectTextDirection(email) : isRTL ? 'rtl' : 'ltr';
  const accountEmailDirection = accountEmail ? detectTextDirection(accountEmail) : isRTL ? 'rtl' : 'ltr';
  const resetEmailDirection = resetEmail ? detectTextDirection(resetEmail) : isRTL ? 'rtl' : 'ltr';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const isEmailLogin = loginMethod === 'email';
    const missingPasswordFields = !email || !password;
    const missingEmailCodeFields = !email || !emailCode;

    if (isEmailLogin ? missingEmailCodeFields : missingPasswordFields) {
      setLoginError(t('login.error.missingFields'));
      setLoginStatus('error');
      return;
    }

    setLoginStatus('loading');
    setLoginError('');

    try {
      const profile = isEmailLogin
        ? await verifyCustomerEmailLoginCode({ email, code: emailCode })
        : await loginCustomer({ email, password });
      setCustomerProfile(profile);
      setLoginStatus('success');
      setLoginError('');
      onLoginSuccess?.(profile);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const normalizedMessage = message.toLowerCase();
      const userFriendlyMessage = (() => {
        if (normalizedMessage.includes('invalid email or password')) return t('login.error.invalidCredentials');
        if (normalizedMessage.includes('invalid code')) return t('login.error.invalidCode');
        if (normalizedMessage.includes('expired') || normalizedMessage.includes('missing code')) return t('login.error.invalidCode');
        if (normalizedMessage.includes('too many')) return t('login.error.tooManyAttempts');
        return t('login.error.generic');
      })();

      setCustomerProfile(null);
      setLoginStatus('error');
      setLoginError(userFriendlyMessage);
    }
  };

  const handleEmailCodeRequest = async () => {
    if (!email) return;

    setEmailCodeStatus('loading');
    setEmailCodeError('');

    try {
      await requestCustomerEmailLoginCode({ email, language });
      setEmailCodeStatus('sent');
    } catch (error) {
      setEmailCodeStatus('error');
      setEmailCodeError(error instanceof Error ? error.message : t('login.accountRequestError'));
    }
  };

  const handleAccountRequest = async (event: FormEvent) => {
    event.preventDefault();

    if (!accountEmail) return;

    setRequestStatus('loading');
    setRequestError('');

    try {
      await sendAccountAccessEmail({ email: accountEmail, language });
      setRequestStatus('success');
    } catch (error) {
      setRequestStatus('error');
      setRequestError(error instanceof Error ? error.message : t('login.accountRequestError'));
    }
  };

  const handlePasswordReset = async (event: FormEvent) => {
    event.preventDefault();

    if (!resetEmail) return;

    setResetStatus('loading');
    setResetError('');

    try {
      await requestTemporaryPassword({ email: resetEmail, language });
      setResetStatus('success');
    } catch (error) {
      setResetStatus('error');
      setResetError(error instanceof Error ? error.message : t('login.resetError'));
    }
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
            <div className="md:col-span-3 space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900">{t('login.title')}</h2>
                  <p className="text-sm text-gray-600">{t('login.security')}</p>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('password')}
                    className={`px-3 py-2 rounded-lg border ${
                      loginMethod === 'password'
                        ? 'border-yellow-600 text-yellow-800 bg-yellow-50'
                        : 'border-transparent text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t('login.passwordMethod')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('email')}
                    className={`px-3 py-2 rounded-lg border ${
                      loginMethod === 'email'
                        ? 'border-blue-600 text-blue-800 bg-blue-50'
                        : 'border-transparent text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t('login.emailMethod')}
                  </button>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800" htmlFor="email">
                      {t('login.email')}
                    </label>
                    <div className="relative">
                      <Mail
                        className={`w-5 h-5 text-gray-400 absolute ${
                          emailDirection === 'rtl' ? 'right-3' : 'left-3'
                        } top-1/2 -translate-y-1/2`}
                      />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setEmailCodeStatus('idle');
                          setEmailCode('');
                        }}
                        dir={emailDirection}
                        className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-yellow-500 focus:ring-yellow-200 ${
                          emailDirection === 'rtl' ? 'pr-10' : 'pl-10'
                        }`}
                        placeholder="name@email.com"
                      />
                    </div>
                  </div>

                  {loginMethod === 'password' ? (
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
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-800" htmlFor="email-code">
                        {t('login.emailCode')}
                      </label>
                      <div className="flex flex-col gap-3">
                        <div className="relative">
                          <ShieldCheck
                            className={`w-5 h-5 text-gray-400 absolute ${
                              emailDirection === 'rtl' ? 'right-3' : 'left-3'
                            } top-1/2 -translate-y-1/2`}
                          />
                          <input
                            id="email-code"
                            name="email-code"
                            type="text"
                            inputMode="numeric"
                            value={emailCode}
                            onChange={(event) => setEmailCode(event.target.value)}
                            className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-blue-500 focus:ring-blue-200 ${
                              emailDirection === 'rtl' ? 'pr-10' : 'pl-10'
                            }`}
                            placeholder={t('login.emailCodePlaceholder')}
                          />
                        </div>

                  <div className="flex items-center gap-3 flex-wrap">
                          <button
                            type="button"
                            onClick={handleEmailCodeRequest}
                            disabled={!email || emailCodeStatus === 'loading'}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60"
                          >
                            {emailCodeStatus === 'loading'
                              ? t('login.emailCodeRequestWorking')
                              : t('login.emailCodeRequest')}
                          </button>
                          {emailCodeStatus === 'sent' && (
                            <span className="text-sm text-green-700">{t('login.emailCodeSent')}</span>
                          )}
                          {emailCodeStatus === 'error' && (
                            <span className="text-sm text-red-700">{emailCodeError || t('login.accountRequestError')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                <div className="flex items-center justify-between text-sm text-gray-700">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-yellow-700 focus:ring-yellow-500" />
                    <span className="font-medium">{t('login.remember')}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const resetInput = document.getElementById('reset-email');
                      resetInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      resetInput?.focus();
                    }}
                    className="font-semibold text-yellow-700 hover:text-yellow-800"
                  >
                    {t('login.forgot')}
                  </button>
                </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-yellow-700 to-yellow-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:from-yellow-800 hover:to-yellow-700 disabled:opacity-60"
                    disabled={
                      loginStatus === 'loading' ||
                      (loginMethod === 'password' ? !email || !password : !email || !emailCode || emailCodeStatus !== 'sent')
                    }
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {loginStatus === 'loading' ? t('login.status.loading') : t('login.submit')}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {loginError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {loginError}
                    </div>
                  )}

                  {loginStatus === 'success' && customerProfile && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 space-y-1">
                      <p className="font-semibold">{t('login.status.success')}</p>
                      <p className="text-green-900">
                        {customerProfile.firstName || customerProfile.lastName
                          ? `${customerProfile.firstName ?? ''} ${customerProfile.lastName ?? ''}`.trim()
                          : customerProfile.email}
                      </p>
                    </div>
                  )}

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

              <div className="bg-white border border-yellow-100 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-50 border border-yellow-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-yellow-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">{t('login.accountRequestTitle')}</p>
                    <p className="text-gray-700">{t('login.accountRequestDescription')}</p>
                  </div>
                </div>

                <form className="grid grid-cols-1 md:grid-cols-[1.2fr,auto] gap-3" onSubmit={handleAccountRequest}>
                  <div className="relative">
                    <Mail
                      className={`w-4 h-4 text-gray-400 absolute ${
                        accountEmailDirection === 'rtl' ? 'right-3' : 'left-3'
                      } top-1/2 -translate-y-1/2`}
                    />
                    <input
                      type="email"
                      value={accountEmail}
                      onChange={(event) => {
                        setAccountEmail(event.target.value);
                        if (requestStatus !== 'idle') {
                          setRequestStatus('idle');
                          setRequestError('');
                        }
                      }}
                      dir={accountEmailDirection}
                      className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-yellow-500 focus:ring-yellow-200 ${
                        accountEmailDirection === 'rtl' ? 'pr-10' : 'pl-10'
                      }`}
                      placeholder={t('login.accountRequestPlaceholder')}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!accountEmail || requestStatus === 'loading'}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-yellow-700 rounded-lg hover:bg-yellow-800 disabled:opacity-60"
                  >
                    <Sparkles className="w-4 h-4" />
                    {requestStatus === 'loading' ? t('login.accountRequestWorking') : t('login.accountRequestSubmit')}
                  </button>
                </form>

                {requestStatus === 'success' && (
                  <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                    {t('login.accountRequestSuccess')}
                  </p>
                )}

                    {requestStatus === 'error' && (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {requestError || t('login.accountRequestError')}
                  </p>
                )}
              </div>

              <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-800">{t('login.resetTitle')}</p>
                    <p className="text-gray-700">{t('login.resetDescription')}</p>
                  </div>
                </div>

                <form className="grid grid-cols-1 md:grid-cols-[1.2fr,auto] gap-3" onSubmit={handlePasswordReset}>
                  <div className="relative">
                    <Mail
                      className={`w-4 h-4 text-gray-400 absolute ${
                        resetEmailDirection === 'rtl' ? 'right-3' : 'left-3'
                      } top-1/2 -translate-y-1/2`}
                    />
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(event) => {
                        setResetEmail(event.target.value);
                        if (resetStatus !== 'idle') {
                          setResetStatus('idle');
                          setResetError('');
                        }
                      }}
                      dir={resetEmailDirection}
                      className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-blue-500 focus:ring-blue-200 ${
                        resetEmailDirection === 'rtl' ? 'pr-10' : 'pl-10'
                      }`}
                      placeholder={t('login.resetPlaceholder')}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!resetEmail || resetStatus === 'loading'}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {resetStatus === 'loading' ? t('login.resetWorking') : t('login.resetSubmit')}
                  </button>
                </form>

                {resetStatus === 'success' && (
                  <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                    {t('login.resetSuccess')}
                  </p>
                )}

                {resetStatus === 'error' && (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {resetError || t('login.resetError')}
                  </p>
                )}
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
