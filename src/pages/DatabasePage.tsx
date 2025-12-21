import { useCallback, useEffect, useMemo, useState } from 'react';
import { Filter, Grid3X3, RefreshCcw, Search, Table2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { getDatabaseSchema, getTableData } from '../services/api';
import { DatabaseSchemaTable } from '../types/database';

interface TableDataState {
  rows: Record<string, unknown>[];
  loading: boolean;
  error: string;
}

export default function DatabasePage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';

  const [schema, setSchema] = useState<DatabaseSchemaTable[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [tableTypeFilter, setTableTypeFilter] = useState<'all' | 'BASE TABLE' | 'VIEW'>('all');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [onlySelected, setOnlySelected] = useState(false);
  const [rowLimit, setRowLimit] = useState(10);
  const [tableData, setTableData] = useState<Record<string, TableDataState>>({});

  const loadSchema = useCallback(async () => {
    try {
      setSchemaError('');
      setLoadingSchema(true);
      const dbSchema = await getDatabaseSchema();
      setSchema(dbSchema);
    } catch (error) {
      console.error('Failed to load database schema', error);
      setSchema([]);
      setSchemaError(t('database.schemaError'));
    } finally {
      setLoadingSchema(false);
    }
  }, [t]);

  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  const filteredTables = useMemo(() => {
    return schema
      .filter((table) =>
        table.name.toLowerCase().includes(tableFilter.trim().toLowerCase()) ||
        table.columns.some((column) => column.name.toLowerCase().includes(tableFilter.trim().toLowerCase())),
      )
      .filter((table) => (tableTypeFilter === 'all' ? true : table.type === tableTypeFilter))
      .filter((table) => (onlySelected && selectedTables.length > 0 ? selectedTables.includes(table.name) : true));
  }, [schema, tableFilter, tableTypeFilter, onlySelected, selectedTables]);

  const toggleSelectedTable = (tableName: string) => {
    setSelectedTables((prev) =>
      prev.includes(tableName) ? prev.filter((name) => name !== tableName) : [...prev, tableName],
    );
  };

  const loadTableData = async (tableName: string) => {
    setTableData((prev) => ({ ...prev, [tableName]: { rows: [], loading: true, error: '' } }));

    try {
      const rows = await getTableData(tableName, rowLimit);
      setTableData((prev) => ({ ...prev, [tableName]: { rows, loading: false, error: '' } }));
    } catch (error) {
      console.error(`Failed to load data for table ${tableName}`, error);
      setTableData((prev) => ({
        ...prev,
        [tableName]: { rows: [], loading: false, error: t('database.tableDataError') },
      }));
    }
  };

  const getColumnsForDisplay = (table: DatabaseSchemaTable) =>
    table.columns.length > 0 ? table.columns : [{ name: 'id', type: 'unknown', nullable: true, key: '', extra: '', default: null }];

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />

      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Table2 className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('database.title')}</p>
              <h1 className="text-3xl font-bold text-gray-900">{t('database.heading')}</h1>
              <p className="text-sm text-gray-600 mt-1">{t('database.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('admin')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
          >
            <RefreshCcw className="w-4 h-4" />
            {t('database.backToAdmin')}
          </button>
        </div>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-gray-700">
              <Grid3X3 className="w-5 h-5" />
              <span className="text-sm font-semibold">{t('database.schemaSummary', { count: schema.length })}</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                {t('database.rowLimit')}
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={rowLimit}
                  onChange={(event) => setRowLimit(Number(event.target.value) || 10)}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm"
                />
              </label>
              <button
                onClick={loadSchema}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                <RefreshCcw className="w-4 h-4" />
                {t('database.refresh')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={tableFilter}
                onChange={(event) => setTableFilter(event.target.value)}
                placeholder={t('database.searchPlaceholder')}
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </label>

            <label className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={tableTypeFilter}
                onChange={(event) => setTableTypeFilter(event.target.value as 'all' | 'BASE TABLE' | 'VIEW')}
                className="flex-1 bg-transparent outline-none text-sm"
              >
                <option value="all">{t('database.filterAll')}</option>
                <option value="BASE TABLE">{t('database.filterTables')}</option>
                <option value="VIEW">{t('database.filterViews')}</option>
              </select>
            </label>

            <label className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white">
              <input
                type="checkbox"
                checked={onlySelected}
                onChange={(event) => setOnlySelected(event.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700">{t('database.showSelectedOnly')}</span>
            </label>
          </div>
        </section>

        <section className="space-y-4">
          {loadingSchema ? (
            <div className="flex items-center justify-center py-10 text-gray-500">{t('database.loading')}</div>
          ) : schemaError ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <p className="text-sm">{schemaError}</p>
              <button
                onClick={loadSchema}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                <RefreshCcw className="w-4 h-4" />
                {t('database.refresh')}
              </button>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-gray-500">{t('database.empty')}</div>
          ) : (
            filteredTables.map((table) => {
              const tableState = tableData[table.name];
              const columns = getColumnsForDisplay(table);

              return (
                <article key={table.name} className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">{table.type}</p>
                      <h2 className="text-lg font-semibold text-gray-900">{table.name}</h2>
                      <p className="text-sm text-gray-600">{t('database.columnsLabel', { count: table.columns.length })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedTables.includes(table.name)}
                          onChange={() => toggleSelectedTable(table.name)}
                          className="h-4 w-4"
                        />
                        {t('database.selectTable')}
                      </label>
                      <button
                        onClick={() => loadTableData(table.name)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                      >
                        <Table2 className="w-4 h-4" />
                        {t('database.viewData')}
                      </button>
                    </div>
                  </header>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">{t('database.column')}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">{t('database.type')}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">{t('database.nullable')}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">{t('database.key')}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">{t('database.default')}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">{t('database.extra')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {columns.map((column) => (
                          <tr key={`${table.name}-${column.name}`}>
                            <td className="px-4 py-3 text-sm text-gray-900">{column.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{column.type}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{column.nullable ? 'YES' : 'NO'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{column.key || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{column.default ?? '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{column.extra || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {tableState && (
                    <div className="border-t border-gray-100">
                      <div className="flex items-center justify-between px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">{t('database.previewTitle')}</p>
                        {tableState.loading && <span className="text-sm text-gray-600">{t('database.loading')}</span>}
                      </div>
                      {tableState.error ? (
                        <div className="px-4 py-3 text-sm text-red-700 bg-red-50 border-t border-red-100">{tableState.error}</div>
                      ) : tableState.rows.length === 0 && !tableState.loading ? (
                        <div className="px-4 py-3 text-sm text-gray-600">{t('database.noData')}</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                              <tr>
                                {Object.keys(tableState.rows[0] ?? {}).map((columnName) => (
                                  <th
                                    key={`${table.name}-data-${columnName}`}
                                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700"
                                  >
                                    {columnName}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {tableState.rows.map((row, index) => (
                                <tr key={`${table.name}-row-${index}`}>
                                  {Object.keys(row).map((columnName) => (
                                    <td key={`${table.name}-row-${index}-${columnName}`} className="px-4 py-3 text-sm text-gray-700">
                                      {String(row[columnName] ?? '')}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
