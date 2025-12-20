import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Book } from '../types/catalog';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { getBooks, getDatabaseSchema } from '../services/api';
import { DatabaseSchemaTable } from '../types/database';
import {
  BookOpen,
  CheckCircle2,
  CircleOff,
  Lock,
  LogOut,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Wrench,
  Database,
} from 'lucide-react';

interface AdminOrder {
  id: string;
  customer: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  total: number;
  items: number;
  createdAt: string;
}

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'admin123';

const defaultBook: Book = {
  id: 'placeholder',
  title_en: '',
  title_he: '',
  description_en: '',
  description_he: '',
  author_id: null,
  publisher_id: null,
  category_id: null,
  price_usd: 0,
  price_ils: 0,
  image_url: '',
  size: '',
  color: '',
  volumes: 1,
  binding: '',
  language: 'he',
  original_text: true,
  in_stock: true,
  featured: false,
  item_number: null,
  dimensions: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function AdminPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';

  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('admin-auth') === 'true');
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([
    {
      id: 'ORD-1001',
      customer: 'Leah Levi',
      status: 'pending',
      total: 280,
      items: 3,
      createdAt: '2024-09-12',
    },
    {
      id: 'ORD-1002',
      customer: 'David Cohen',
      status: 'processing',
      total: 450,
      items: 5,
      createdAt: '2024-09-10',
    },
    {
      id: 'ORD-1003',
      customer: 'Sarah Azulay',
      status: 'shipped',
      total: 180,
      items: 2,
      createdAt: '2024-09-08',
    },
  ]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [databaseSchema, setDatabaseSchema] = useState<DatabaseSchemaTable[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [newBook, setNewBook] = useState<Pick<Book, 'title_en' | 'title_he' | 'price_ils' | 'price_usd'>>({
    title_en: '',
    title_he: '',
    price_ils: 0,
    price_usd: 0,
  });

  const loadSchema = useCallback(async () => {
    try {
      setSchemaError('');
      setLoadingSchema(true);
      const schema = await getDatabaseSchema();
      setDatabaseSchema(schema);
    } catch (error) {
      console.error('Failed to load database schema for admin panel', error);
      setDatabaseSchema([]);
      setSchemaError(t('admin.schemaError'));
    } finally {
      setLoadingSchema(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadBooks = async () => {
      try {
        setLoadingBooks(true);
        const fetchedBooks = await getBooks();
        setBooks(fetchedBooks);
      } catch (error) {
        console.error('Failed to load books for admin panel', error);
        setBooks([]);
      } finally {
        setLoadingBooks(false);
      }
    };

    loadBooks();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadSchema();
  }, [isAuthenticated, loadSchema]);

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

  const handleBookUpdate = (bookId: string, updates: Partial<Book>) => {
    setBooks((prev) => prev.map((book) => (book.id === bookId ? { ...book, ...updates, updated_at: new Date().toISOString() } : book)));
  };

  const handleAddBook = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const now = new Date().toISOString();
    const createdBook: Book = {
      ...defaultBook,
      id: `book-${Date.now()}`,
      title_en: newBook.title_en || newBook.title_he || 'Untitled',
      title_he: newBook.title_he || newBook.title_en || 'ללא שם',
      description_en: t('admin.newBookDefaultDescription'),
      description_he: t('admin.newBookDefaultDescription'),
      price_ils: Number(newBook.price_ils) || 0,
      price_usd: Number(newBook.price_usd) || 0,
      created_at: now,
      updated_at: now,
    };

    setBooks((prev) => [createdBook, ...prev]);
    setNewBook({ title_en: '', title_he: '', price_ils: 0, price_usd: 0 });
  };

  const handleOrderStatusChange = (orderId: string, status: AdminOrder['status']) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
  };

  const summary = useMemo(() => {
    const pendingOrders = orders.filter((order) => order.status === 'pending').length;
    const processingOrders = orders.filter((order) => order.status === 'processing').length;
    const inStockBooks = books.filter((book) => book.in_stock).length;
    const featuredBooks = books.filter((book) => book.featured).length;

    return {
      pendingOrders,
      processingOrders,
      inStockBooks,
      featuredBooks,
    };
  }, [books, orders]);

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
            icon={<ShoppingBag className="w-6 h-6 text-yellow-700" />}
            title={t('admin.ordersPending')}
            value={summary.pendingOrders}
            tone="amber"
          />
          <SummaryCard
            icon={<Wrench className="w-6 h-6 text-blue-700" />}
            title={t('admin.ordersProcessing')}
            value={summary.processingOrders}
            tone="blue"
          />
          <SummaryCard
            icon={<BookOpen className="w-6 h-6 text-emerald-700" />}
            title={t('admin.inStockBooks')}
            value={summary.inStockBooks}
            tone="emerald"
          />
          <SummaryCard
            icon={<CheckCircle2 className="w-6 h-6 text-purple-700" />}
            title={t('admin.featuredBooks')}
            value={summary.featuredBooks}
            tone="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{t('admin.books')}</h2>
                <p className="text-sm text-gray-600">{t('admin.booksDescription')}</p>
              </div>
              <span className="text-sm text-gray-600">{`${t('admin.totalItems')}: ${books.length}`}</span>
            </div>

            {loadingBooks ? (
              <div className="flex items-center justify-center py-10 text-gray-500">{t('admin.loading')}</div>
            ) : (
              <div className="space-y-3">
                {books.slice(0, 6).map((book) => (
                  <article key={book.id} className="border border-gray-200 rounded-xl p-4 flex items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{book.id}</p>
                          <h3 className="text-lg font-semibold text-gray-900">{book.title_he || book.title_en}</h3>
                          <p className="text-sm text-gray-600">{book.title_en}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            label={book.in_stock ? t('admin.inStock') : t('admin.outOfStock')}
                            tone={book.in_stock ? 'emerald' : 'red'}
                          />
                          {book.featured && <StatusBadge label={t('admin.featured')} tone="purple" />}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <PackageCheck className="w-4 h-4 text-gray-500" />
                          <span>
                            {t('admin.priceIls')}: ₪{book.price_ils.toFixed(2)} | {t('admin.priceUsd')}: ${book.price_usd.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleBookUpdate(book.id, { in_stock: !book.in_stock })}
                            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
                          >
                            <CircleOff className="w-4 h-4" />
                            {book.in_stock ? t('admin.markOutOfStock') : t('admin.markInStock')}
                          </button>
                          <button
                            onClick={() => handleBookUpdate(book.id, { featured: !book.featured })}
                            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-100 rounded-lg hover:bg-purple-100"
                          >
                            <StarIcon active={book.featured} />
                            {book.featured ? t('admin.removeFeatured') : t('admin.addFeatured')}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="w-40 space-y-2">
                      <label className="text-xs font-medium text-gray-700">
                        {t('admin.priceIls')}
                        <input
                          type="number"
                          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                          value={book.price_ils}
                          onChange={(event) => handleBookUpdate(book.id, { price_ils: Number(event.target.value) })}
                        />
                      </label>
                      <label className="text-xs font-medium text-gray-700">
                        {t('admin.priceUsd')}
                        <input
                          type="number"
                          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                          value={book.price_usd}
                          onChange={(event) => handleBookUpdate(book.id, { price_usd: Number(event.target.value) })}
                        />
                      </label>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">{t('admin.addBook')}</h2>
          <p className="text-sm text-gray-600">{t('admin.addBookDescription')}</p>
            <form className="space-y-4" onSubmit={handleAddBook}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800" htmlFor="title-he">
                  {t('admin.titleHebrew')}
                </label>
                <input
                  id="title-he"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={newBook.title_he}
                  onChange={(event) => setNewBook((prev) => ({ ...prev, title_he: event.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800" htmlFor="title-en">
                  {t('admin.titleEnglish')}
                </label>
                <input
                  id="title-en"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={newBook.title_en}
                  onChange={(event) => setNewBook((prev) => ({ ...prev, title_en: event.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-800" htmlFor="price-ils">
                    {t('admin.priceIls')}
                  </label>
                  <input
                    id="price-ils"
                    type="number"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={newBook.price_ils}
                    onChange={(event) => setNewBook((prev) => ({ ...prev, price_ils: Number(event.target.value) }))}
                    min={0}
                    step={1}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-800" htmlFor="price-usd">
                    {t('admin.priceUsd')}
                  </label>
                  <input
                    id="price-usd"
                    type="number"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={newBook.price_usd}
                    onChange={(event) => setNewBook((prev) => ({ ...prev, price_usd: Number(event.target.value) }))}
                    min={0}
                    step={1}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-700 text-white px-4 py-3 text-sm font-semibold hover:bg-yellow-800"
              >
                <BookOpen className="w-4 h-4" />
                {t('admin.createBook')}
              </button>
            </form>
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            {t('admin.environmentNotice')}
          </p>
        </section>
      </div>

      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{t('admin.schemaTitle')}</h2>
              <p className="text-sm text-gray-600">{t('admin.schemaDescription')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{`${t('admin.schemaTablesLabel')}: ${databaseSchema.length}`}</span>
            <button
              onClick={loadSchema}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              <RefreshCcw className="w-4 h-4" />
              {t('admin.schemaRetry')}
            </button>
          </div>
        </div>

        {loadingSchema ? (
          <div className="flex items-center justify-center py-8 text-gray-500">{t('admin.loading')}</div>
        ) : schemaError ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <p className="text-sm">{schemaError}</p>
            <button
              onClick={loadSchema}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              <RefreshCcw className="w-4 h-4" />
              {t('admin.schemaRetry')}
            </button>
          </div>
        ) : databaseSchema.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-500">{t('admin.schemaEmpty')}</div>
        ) : (
          <div className="space-y-4">
            {databaseSchema.map((table) => (
              <article key={table.name} className="border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-t-xl">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">{table.type}</p>
                    <h3 className="text-lg font-semibold text-gray-900">{table.name}</h3>
                  </div>
                  <StatusBadge label={`${table.columns.length} ${t('admin.schemaColumnsLabel')}`} tone="blue" />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">{t('admin.schemaColumn')}</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">{t('admin.schemaType')}</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">{t('admin.schemaNullable')}</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">{t('admin.schemaKey')}</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">{t('admin.schemaDefault')}</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">{t('admin.schemaExtra')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {table.columns.length === 0 ? (
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-500" colSpan={6}>
                            {t('admin.schemaNoColumns')}
                          </td>
                        </tr>
                      ) : (
                        table.columns.map((column) => (
                          <tr key={`${table.name}-${column.name}`}>
                            <td className="px-4 py-3 font-medium text-gray-900">{column.name}</td>
                            <td className="px-4 py-3 text-gray-700">{column.type}</td>
                            <td className="px-4 py-3 text-gray-700">{column.nullable ? t('admin.yes') : t('admin.no')}</td>
                            <td className="px-4 py-3 text-gray-700">{column.key || '-'}</td>
                            <td className="px-4 py-3 text-gray-700">{column.default ?? '-'}</td>
                            <td className="px-4 py-3 text-gray-700">{column.extra || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{t('admin.orders')}</h2>
            <p className="text-sm text-gray-600">{t('admin.ordersDescription')}</p>
          </div>
          <span className="text-sm text-gray-600">{`${t('admin.totalItems')}: ${orders.length}`}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {orders.map((order) => (
              <article key={order.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{order.id}</p>
                    <h3 className="text-lg font-semibold text-gray-900">{order.customer}</h3>
                  </div>
                  <StatusBadge label={t(`admin.status.${order.status}`)} tone="blue" />
                </div>

                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    {t('admin.orderDate')}: {order.createdAt}
                  </p>
                  <p>
                    {`${t('admin.itemsCount')}: ${order.items}`} · {t('admin.totalAmount')}: ₪{order.total.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700" htmlFor={`status-${order.id}`}>
                    {t('admin.updateStatus')}
                  </label>
                  <select
                    id={`status-${order.id}`}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={order.status}
                    onChange={(event) => handleOrderStatusChange(order.id, event.target.value as AdminOrder['status'])}
                  >
                    <option value="pending">{t('admin.status.pending')}</option>
                    <option value="processing">{t('admin.status.processing')}</option>
                    <option value="shipped">{t('admin.status.shipped')}</option>
                    <option value="delivered">{t('admin.status.delivered')}</option>
                  </select>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}

type BadgeTone = 'emerald' | 'red' | 'purple' | 'blue' | 'amber';

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

type SummaryTone = 'amber' | 'blue' | 'emerald' | 'purple';

function SummaryCard({ icon, title, value, tone }: { icon: ReactNode; title: string; value: number; tone: SummaryTone }) {
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
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function StarIcon({ active }: { active: boolean }) {
  return active ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l1.519 3.652 3.957.342c1.164.101 1.636 1.545.749 2.305l-3.002 2.57.911 3.828c.268 1.125-.964 2.02-1.96 1.43L12 15.986l-3.386 1.35c-.996.59-2.228-.305-1.96-1.43l.912-3.828-3.002-2.57c-.887-.76-.415-2.204.749-2.305l3.957-.342 1.518-3.652Z"
        clipRule="evenodd"
      />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l1.517 3.674a.563.563 0 00.475.345l3.993.342c.499.043.701.663.321.988l-3.04 2.573a.563.563 0 00-.182.557l.908 3.892a.562.562 0 01-.84.61l-3.399-2.04a.563.563 0 00-.586 0l-3.4 2.04a.562.562 0 01-.839-.61l.908-3.892a.563.563 0 00-.182-.557l-3.04-2.572a.563.563 0 01.32-.989l3.994-.341a.563.563 0 00.474-.345l1.518-3.674z"
      />
    </svg>
  );
}
