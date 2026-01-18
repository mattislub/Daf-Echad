import { FormEvent, useState } from 'react';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import {
  checkCustomerEmailExists,
  loginCustomer,
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
  const [loginStatus, setLoginStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [loginError, setLoginError] = useState('');
  const [customerProfile, setCustomerProfile] = useState<CustomerAccount | null>(null);
  const [loginMethod, setLoginMethod] = useState<'password' | 'email'>('password');
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeStatus, setEmailCodeStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [emailCodeError, setEmailCodeError] = useState('');
  const [emailCodeMode, setEmailCodeMode] = useState<'code' | 'temporary_password' | null>(null);

  const emailDirection = email ? detectTextDirection(email) : isRTL ? 'rtl' : 'ltr';

  const attemptAutoRegistration = async () => {
    try {
      const exists = await checkCustomerEmailExists(email);
      if (exists) {
        return false;
      }

      const result = await requestCustomerEmailLoginCode({ email, language });
      if (result.mode === 'temporary_password') {
        setEmailCodeStatus('sent');
        setEmailCodeMode('temporary_password');
        setEmailCode('');
        setLoginError('');
        setLoginStatus('idle');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Auto registration failed:', error);
      return false;
    }
  };

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

      if (!isEmailLogin && normalizedMessage.includes('invalid email or password')) {
        const autoRegistered = await attemptAutoRegistration();
        if (autoRegistered) {
          return;
        }
      }

      setCustomerProfile(null);
      setLoginStatus('error');
      setLoginError(userFriendlyMessage);
    }
  };

  const handleEmailCodeRequest = async () => {
    if (!email) return;

    setEmailCodeStatus('loading');
    setEmailCodeError('');
    setEmailCodeMode(null);

    try {
      const result = await requestCustomerEmailLoginCode({ email, language });
      setEmailCodeStatus('sent');
      setEmailCodeMode(result.mode);
      if (result.mode === 'temporary_password') {
        setLoginMethod('password');
        setEmailCode('');
      }
    } catch (error) {
      console.error('Email login request failed:', error);
      setEmailCodeStatus('error');
      setEmailCodeError(error instanceof Error ? error.message : t('login.accountRequestError'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">{t('login.title')}</h1>
            <p className="text-gray-600">{t('login.subtitle')}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm font-semibold text-gray-800">
              <button
                type="button"
                onClick={() => setLoginMethod('password')}
                className={`flex-1 px-4 py-3 rounded-xl border ${
                  loginMethod === 'password'
                    ? 'border-yellow-600 text-yellow-800 bg-yellow-50'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('login.passwordMethod')}
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 px-4 py-3 rounded-xl border ${
                  loginMethod === 'email'
                    ? 'border-blue-600 text-blue-800 bg-blue-50'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
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
                      setEmailCodeMode(null);
                    }}
                    dir={emailDirection}
                    className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-yellow-500 focus:ring-yellow-200 ${
                      emailDirection === 'rtl' ? 'pr-10' : 'pl-10'
                    }`}
                    placeholder="name@email.com"
                  />
                </div>
                {emailCodeStatus === 'sent' && emailCodeMode === 'temporary_password' && (
                  <p className="text-sm text-green-700">{t('login.tempPasswordSent')}</p>
                )}
              </div>

              {loginMethod === 'password' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-800" htmlFor="password">
                    {t('login.password')}
                  </label>
                  <div className="relative">
                    <Lock
                      className={`w-5 h-5 text-gray-400 absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`}
                    />
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
                      {emailCodeStatus === 'sent' && emailCodeMode === 'code' && (
                        <span className="text-sm text-green-700">{t('login.emailCodeSent')}</span>
                      )}
                      {emailCodeStatus === 'sent' && emailCodeMode === 'temporary_password' && (
                        <span className="text-sm text-green-700">{t('login.tempPasswordSent')}</span>
                      )}
                      {emailCodeStatus === 'error' && (
                        <span className="text-sm text-red-700">{emailCodeError || t('login.accountRequestError')}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
            </form>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
