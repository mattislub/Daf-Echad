import { FormEvent, ReactNode, useMemo, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import {
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  FileText,
  Lock,
  LogOut,
  Package,
  RefreshCcw,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';

type UserRole = 'admin' | 'manager' | 'coordinator' | 'support';

type UserStatus = 'active' | 'invited' | 'suspended';

type DonationPageStatus = 'active' | 'draft' | 'paused';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'admin123';

const crmUsers = [
  {
    id: 'USR-102',
    name: 'מיה כהן',
    role: 'manager' as UserRole,
    status: 'active' as UserStatus,
    lastLogin: '2024-09-18',
  },
  {
    id: 'USR-108',
    name: 'יונתן גולד',
    role: 'coordinator' as UserRole,
    status: 'invited' as UserStatus,
    lastLogin: '2024-09-16',
  },
  {
    id: 'USR-121',
    name: 'נועה ברק',
    role: 'support' as UserRole,
    status: 'active' as UserStatus,
    lastLogin: '2024-09-17',
  },
  {
    id: 'USR-135',
    name: 'איתן וייס',
    role: 'admin' as UserRole,
    status: 'suspended' as UserStatus,
    lastLogin: '2024-09-12',
  },
];

const donationPages = [
  {
    id: 'PAGE-401',
    owner: 'משפחת לוי',
    title: 'סיוע למרכז חלוקת מזון',
    status: 'active' as DonationPageStatus,
    raised: 18500,
    goal: 25000,
    updatedAt: '2024-09-18',
  },
  {
    id: 'PAGE-418',
    owner: 'עמותת לב חם',
    title: 'מלגות לימודים חירום',
    status: 'paused' as DonationPageStatus,
    raised: 9200,
    goal: 20000,
    updatedAt: '2024-09-15',
  },
  {
    id: 'PAGE-439',
    owner: 'יעל שקד',
    title: 'ציוד לחיילים בודדים',
    status: 'draft' as DonationPageStatus,
    raised: 0,
    goal: 15000,
    updatedAt: '2024-09-14',
  },
];

const donationItems = [
  {
    id: 'ITEM-18',
    name: 'אריזות מזון לשבת',
    category: 'סיוע חודשי',
    stock: 120,
    reserved: 24,
  },
  {
    id: 'ITEM-27',
    name: 'ערכות חורף לילדים',
    category: 'ציוד חירום',
    stock: 80,
    reserved: 12,
  },
  {
    id: 'ITEM-33',
    name: 'שוברי קניה למשפחות',
    category: 'סיוע מידי',
    stock: 60,
    reserved: 18,
  },
];

const generalGoal = {
  title: 'יעד תרומות כללי לשנת 2024',
  raised: 178000,
  target: 250000,
  donors: 842,
  updatedAt: '2024-09-18',
};

export default function AdminPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';

  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('admin-auth') === 'true');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', {
        maximumFractionDigits: 0,
      }),
    [language],
  );

  const summary = useMemo(() => {
    const activePages = donationPages.filter((page) => page.status === 'active').length;
    const availableItems = donationItems.reduce((total, item) => total + (item.stock - item.reserved), 0);
    const goalProgress = Math.min(100, Math.round((generalGoal.raised / generalGoal.target) * 100));

    return {
      usersTotal: crmUsers.length,
      activePages,
      availableItems,
      goalProgress,
    };
  }, []);

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');

    if (passwordInput.trim() === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin-auth', 'true');
      setPasswordInput('');
      return;
    }

    setLoginError(language === 'he' ? 'סיסמה שגויה' : 'Incorrect password');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin-auth');
  };

  const formatCurrency = (value: number) => numberFormatter.format(value);

  const progressWidth = `${summary.goalProgress}%`;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
        <Header onNavigate={onNavigate} />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto bg-white shadow-lg rounded-2xl border border-gray-200 p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Lock className="w-6 h-6 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('admin.title')}</p>
                <h1 className="text-2xl font-bold text-gray-900">{t('admin.signIn')}</h1>
              </div>
            </div>

            <p className="text-gray-600 text-sm leading-6">{t('admin.disclaimer')}</p>

            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800" htmlFor="admin-password">
                  {t('admin.passwordLabel')}
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={passwordInput}
                  onChange={(event) => setPasswordInput(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-yellow-500 focus:ring-yellow-200"
                  placeholder={t('admin.passwordPlaceholder')}
                />
                {loginError && <p className="text-sm text-red-600">{loginError}</p>}
                <p className="text-xs text-gray-500">{t('admin.passwordHint')}</p>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-yellow-700 to-yellow-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:from-yellow-800 hover:to-yellow-700"
              >
                <ShieldCheck className="w-4 h-4" />
                {t('admin.enterPanel')}
              </button>
            </form>
          </div>
        </main>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />

      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-gray-600">{t('admin.title')}</p>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.dashboard')}</h1>
            <p className="text-gray-600 mt-2">{t('admin.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate?.('home')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
            >
              <RefreshCcw className="w-4 h-4" />
              {t('admin.backToStore')}
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100"
            >
              <LogOut className="w-4 h-4" />
              {t('admin.logout')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            icon={<Users className="w-6 h-6 text-amber-700" />}
            title={t('admin.crm.summaryUsers')}
            value={summary.usersTotal}
            tone="amber"
          />
          <SummaryCard
            icon={<FileText className="w-6 h-6 text-blue-700" />}
            title={t('admin.crm.summaryPages')}
            value={summary.activePages}
            tone="blue"
          />
          <SummaryCard
            icon={<Package className="w-6 h-6 text-emerald-700" />}
            title={t('admin.crm.summaryItems')}
            value={summary.availableItems}
            tone="emerald"
          />
          <SummaryCard
            icon={<Target className="w-6 h-6 text-purple-700" />}
            title={t('admin.crm.summaryGoal')}
            value={summary.goalProgress}
            tone="purple"
            suffix="%"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{t('admin.crm.usersTitle')}</h2>
                <p className="text-sm text-gray-600">{t('admin.crm.usersSubtitle')}</p>
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700">
                {t('admin.crm.addUser')}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-start">{t('admin.crm.userName')}</th>
                    <th className="px-4 py-3 text-start">{t('admin.crm.userRole')}</th>
                    <th className="px-4 py-3 text-start">{t('admin.crm.userStatus')}</th>
                    <th className="px-4 py-3 text-start">{t('admin.crm.lastLogin')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {crmUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{t(`admin.crm.roles.${user.role}`)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge label={t(`admin.crm.status.${user.status}`)} tone={userStatusTone[user.status]} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.lastLogin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{t('admin.crm.goalTitle')}</h2>
                <p className="text-sm text-gray-600">{t('admin.crm.goalSubtitle')}</p>
              </div>
              <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100">
                {t('admin.crm.goalUpdate')}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">{generalGoal.title}</p>
                <p className="text-xs text-gray-500">{t('admin.crm.goalUpdated')}: {generalGoal.updatedAt}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{t('admin.crm.goalProgress')}</span>
                  <span className="font-semibold text-gray-900">{summary.goalProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: progressWidth }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">{t('admin.crm.goalRaised')}</p>
                  <p className="text-lg font-semibold text-gray-900">₪{formatCurrency(generalGoal.raised)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">{t('admin.crm.goalTarget')}</p>
                  <p className="text-lg font-semibold text-gray-900">₪{formatCurrency(generalGoal.target)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">{t('admin.crm.goalDonors')}</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(generalGoal.donors)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">{t('admin.crm.goalProgress')}</p>
                  <p className="text-lg font-semibold text-gray-900">{summary.goalProgress}%</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{t('admin.crm.pagesTitle')}</h2>
                <p className="text-sm text-gray-600">{t('admin.crm.pagesSubtitle')}</p>
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100">
                {t('admin.crm.pagesCreate')}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {donationPages.map((page) => {
                const progress = Math.min(100, Math.round((page.raised / page.goal) * 100));
                return (
                  <article key={page.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500">{page.id}</p>
                        <h3 className="text-lg font-semibold text-gray-900">{page.title}</h3>
                        <p className="text-sm text-gray-600">{page.owner}</p>
                      </div>
                      <StatusBadge label={t(`admin.crm.pageStatus.${page.status}`)} tone={pageStatusTone[page.status]} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{t('admin.crm.pageRaised')} ₪{formatCurrency(page.raised)}</span>
                        <span className="font-semibold text-gray-900">{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{t('admin.crm.pageGoal')} ₪{formatCurrency(page.goal)}</span>
                        <span>{t('admin.crm.pageUpdated')} {page.updatedAt}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{t('admin.crm.itemsTitle')}</h2>
                <p className="text-sm text-gray-600">{t('admin.crm.itemsSubtitle')}</p>
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100">
                {t('admin.crm.itemsManage')}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {donationItems.map((item) => (
                <article key={item.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">{item.id}</p>
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.category}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="w-4 h-4" />
                      <span>{item.stock - item.reserved} {t('admin.crm.itemAvailable')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">{t('admin.crm.itemStock')}</p>
                      <p className="font-semibold text-gray-900">{item.stock}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">{t('admin.crm.itemReserved')}</p>
                      <p className="font-semibold text-gray-900">{item.reserved}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">{t('admin.crm.itemAvailable')}</p>
                      <p className="font-semibold text-gray-900">{item.stock - item.reserved}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-slate-600 font-semibold">{t('admin.crm.insightsTitle')}</p>
            <h2 className="text-2xl font-bold text-gray-900">{t('admin.crm.insightsHeading')}</h2>
            <p className="text-sm text-gray-600 max-w-2xl">{t('admin.crm.insightsSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            <QuickStat
              icon={<BarChart3 className="w-5 h-5 text-blue-700" />}
              label={t('admin.crm.insightsDonationVelocity')}
              value="+18%"
            />
            <QuickStat
              icon={<Calendar className="w-5 h-5 text-emerald-700" />}
              label={t('admin.crm.insightsNextCycle')}
              value={t('admin.crm.insightsNextCycleValue')}
            />
            <QuickStat
              icon={<Target className="w-5 h-5 text-purple-700" />}
              label={t('admin.crm.insightsConversion')}
              value="62%"
            />
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}

type BadgeTone = 'emerald' | 'red' | 'purple' | 'blue' | 'amber';

type SummaryTone = 'amber' | 'blue' | 'emerald' | 'purple';

const userStatusTone: Record<UserStatus, BadgeTone> = {
  active: 'emerald',
  invited: 'amber',
  suspended: 'red',
};

const pageStatusTone: Record<DonationPageStatus, BadgeTone> = {
  active: 'blue',
  draft: 'amber',
  paused: 'red',
};

function StatusBadge({ label, tone }: { label: string; tone: BadgeTone }) {
  const toneClasses: Record<BadgeTone, string> = {
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    red: 'text-red-700 bg-red-50 border-red-100',
    purple: 'text-purple-700 bg-purple-50 border-purple-100',
    blue: 'text-blue-700 bg-blue-50 border-blue-100',
    amber: 'text-amber-700 bg-amber-50 border-amber-100',
  };

  return (
    <span className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full border ${toneClasses[tone]}`}>
      <CheckCircle2 className="w-4 h-4" />
      {label}
    </span>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  tone,
  suffix,
}: {
  icon: ReactNode;
  title: string;
  value: number;
  tone: SummaryTone;
  suffix?: string;
}) {
  const toneClasses: Record<SummaryTone, string> = {
    amber: 'text-amber-700 bg-amber-50 border-amber-100',
    blue: 'text-blue-700 bg-blue-50 border-blue-100',
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    purple: 'text-purple-700 bg-purple-50 border-purple-100',
  };

  return (
    <div className={`flex items-center gap-4 bg-white border rounded-2xl p-4 shadow-sm ${toneClasses[tone]}`}>
      <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center border border-white/80 shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-700">{title}</p>
        <p className="text-2xl font-bold text-gray-900">
          {value}
          {suffix}
        </p>
      </div>
    </div>
  );
}

function QuickStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
      <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
