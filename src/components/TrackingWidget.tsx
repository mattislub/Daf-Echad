import { FormEvent, useMemo, useState } from 'react';
import { CheckCircle, Clock, Truck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { trackHfdShipment, TrackingResponse, TrackingStatusEntry } from '../services/api';

interface TrackingWidgetProps {
  defaultCourier?: string;
  defaultTrackingNumber?: string;
}

function StatusBadge({ delivered }: { delivered: boolean }) {
  const { t } = useLanguage();

  if (delivered) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold bg-green-100 text-green-800 rounded-full">
        <CheckCircle className="w-4 h-4" />
        {t('tracking.delivered')}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold bg-yellow-100 text-yellow-800 rounded-full">
      <Clock className="w-4 h-4" />
      {t('tracking.inTransit')}
    </span>
  );
}

function StatusTimeline({ statuses }: { statuses: TrackingStatusEntry[] }) {
  const { t } = useLanguage();

  if (!statuses?.length) {
    return <p className="text-sm text-gray-600">{t('tracking.noStatuses')}</p>;
  }

  return (
    <ol className="space-y-3">
      {statuses.map((status, index) => (
        <li key={`${status.code}-${status.date}-${index}`} className="flex items-start gap-3">
          <div className="mt-1">
            <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-yellow-600' : 'bg-gray-300'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{status.description || '-'}</p>
            <p className="text-xs text-gray-600">
              {status.date || '-'} {status.time || ''}
            </p>
            {status.code && <p className="text-xs text-gray-500">{t('tracking.codeLabel')}: {status.code}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function TrackingWidget({ defaultCourier = 'HFD', defaultTrackingNumber = '' }: TrackingWidgetProps) {
  const { t } = useLanguage();
  const [trackingNumber, setTrackingNumber] = useState(defaultTrackingNumber);
  const [courier, setCourier] = useState(defaultCourier);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackingResponse | null>(null);

  const carriers = useMemo(
    () => [
      { value: 'HFD', label: 'HFD' },
      { value: 'Israel Post', label: t('account.israelPost') || 'Israel Post' },
      { value: 'FedEx', label: 'FedEx' },
      { value: 'DHL', label: 'DHL' },
      { value: 'Aramex', label: 'Aramex' },
    ],
    [t],
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!trackingNumber) return;

    if (courier !== 'HFD') {
      setError(t('tracking.carrierUnsupported'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await trackHfdShipment({ shipmentNumber: trackingNumber.trim() });

      if (response.status !== 'ok') {
        setError(response.message || t('tracking.errorGeneric'));
        return;
      }

      setResult(response);
    } catch (err) {
      console.error('Tracking lookup failed', err);
      setError(t('tracking.errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

  const latestStatus = result?.statuses?.[0];

  return (
    <div className="space-y-4">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-800" htmlFor="trackingNumber">
            {t('tracking.numberLabel')}
          </label>
          <input
            id="trackingNumber"
            name="trackingNumber"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="w-full rounded-lg border border-yellow-200 bg-white px-3 py-2 text-sm focus:border-yellow-400 focus:ring-yellow-300"
            placeholder={t('tracking.placeholder')}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-800" htmlFor="courier">
            {t('tracking.courierLabel')}
          </label>
          <select
            id="courier"
            name="courier"
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            className="w-full rounded-lg border border-yellow-200 bg-white px-3 py-2 text-sm focus:border-yellow-400 focus:ring-yellow-300"
          >
            {carriers.map((carrier) => (
              <option key={carrier.value} value={carrier.value}>
                {carrier.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-700 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-800 disabled:opacity-60"
          disabled={!trackingNumber || isLoading}
        >
          <Truck className="w-4 h-4" />
          {isLoading ? t('tracking.loading') : t('tracking.submit')}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      {result && result.status === 'ok' && (
        <div className="rounded-lg border border-yellow-100 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-gray-500">{t('tracking.statusHeader')}</p>
              <p className="text-lg font-semibold text-gray-900">{result.shipmentNumber || trackingNumber}</p>
              {result.referenceNumber2 && (
                <p className="text-sm text-gray-600">
                  {t('tracking.referenceLabel')}: {result.referenceNumber2}
                </p>
              )}
            </div>
            <StatusBadge delivered={!!result.delivered} />
          </div>

          {latestStatus && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-100 p-3">
              <p className="text-xs uppercase tracking-wide text-yellow-800 font-semibold">{t('tracking.latestUpdate')}</p>
              <p className="text-sm font-semibold text-gray-900">{latestStatus.description || '-'}</p>
              <p className="text-xs text-gray-700">
                {latestStatus.date || '-'} {latestStatus.time || ''}
              </p>
            </div>
          )}

          <StatusTimeline statuses={result.statuses || []} />
        </div>
      )}
    </div>
  );
}
