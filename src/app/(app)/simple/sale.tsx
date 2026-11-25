import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BigCounter } from '@/components/simple/big-counter';
import { type Choice, PictureChoice } from '@/components/simple/picture-choice';
import { StepScaffold } from '@/components/simple/step-scaffold';
import { SuccessView } from '@/components/simple/success-view';
import { Banner } from '@/components/ui/banner';
import { Text } from '@/components/ui/text';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { useLastSale, useParties } from '@/features/money/api';
import { SALE_ICONS } from '@/features/money/icons';
import { composeNotes, EGGS_PER_TRAY, parseNotes, round2, type SaleType, type SaleUnit } from '@/features/money/model';
import { usePendingSave } from '@/features/simple/pending-save';
import { api } from '@/lib/api/client';
import { localDayIso } from '@/lib/dates';
import { formatCurrency, formatNumber } from '@/lib/format';

type Kind = Exclude<SaleType, 'OTHER'>;
type Step = 'what' | 'count' | 'price' | 'paid' | 'who' | 'review' | 'done';

/** The unit a worker counts in for each kind of sale. */
const UNIT: Record<Kind, SaleUnit> = { EGG_SALE: 'TRAY', CHICKEN_SALE: 'BIRD', MANURE_SALE: 'BAG' };

/** Simple mode sale: what, how many, price for one, paid or not, then save with Undo. */
export default function SimpleSale() {
  const { t } = useTranslation();
  const { farm } = useWorkingFarm();
  const schedule = usePendingSave((s) => s.schedule);
  const customers = useParties('customers');
  const [kind, setKind] = useState<Kind | null>(null);
  const [step, setStep] = useState<Step>('what');
  const [trays, setTrays] = useState(1);
  const [loose, setLoose] = useState(0);
  const [count, setCount] = useState(1);
  const [price, setPrice] = useState<number | null>(null);
  const [paid, setPaid] = useState<'yes' | 'no' | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const last = useLastSale(kind ?? 'EGG_SALE', farm?.id ?? null);

  // Price for one tray / bird / bag; start from the last sale of the same kind.
  const lastUnitPrice = (() => {
    if (!kind || !last.data) return null;
    const unit = parseNotes(last.data.notes).unit;
    if (kind === 'EGG_SALE' && (unit === 'EGG' || !unit)) return round2(last.data.rate * EGGS_PER_TRAY);
    return last.data.rate;
  })();
  const unitPrice = price ?? lastUnitPrice ?? 0;

  const eggs = trays * EGGS_PER_TRAY + loose;
  const amount = kind === 'EGG_SALE' ? eggs : count;
  const total = kind === 'EGG_SALE' ? round2((eggs * unitPrice) / EGGS_PER_TRAY) : round2(count * unitPrice);
  const unitName = kind ? t(`money.units.${UNIT[kind]}`) : '';
  const what = kind ? t(`money.saleTypes.${kind}`) : '';
  const countText = kind === 'EGG_SALE' ? t('simple.sale.eggsCount', { count: eggs }) : `${formatNumber(count)} ${unitName}`;
  const savedSay = t('simple.sale.savedSay', { what, total: formatCurrency(total) });
  const customers_ = customers.data ?? [];

  function save() {
    if (!kind || !farm) return;
    // Loose eggs: record by the egg so the total is exact; otherwise by the tray.
    const byEgg = kind === 'EGG_SALE' && loose > 0;
    const quantity = kind === 'EGG_SALE' ? (byEgg ? eggs : trays) : count;
    const rate = byEgg ? unitPrice / EGGS_PER_TRAY : unitPrice;
    schedule(savedSay, () =>
      api.post('/revenue', {
        farmId: farm.id,
        type: kind,
        quantity,
        rate,
        paymentStatus: paid === 'no' ? 'UNPAID' : 'PAID',
        customerId: paid === 'no' && customerId ? customerId : undefined,
        date: localDayIso(),
        notes: composeNotes({ text: '', unit: byEgg ? 'EGG' : UNIT[kind] }),
      }),
    );
    setStep('done');
  }

  if (step === 'done') return <SuccessView summary={savedSay} />;

  if (step === 'what') {
    const kinds: Kind[] = ['EGG_SALE', 'CHICKEN_SALE', 'MANURE_SALE'];
    const choices: Choice<Kind>[] = kinds.map((k) => ({ value: k, label: t(`money.saleTypes.${k}`), icon: SALE_ICONS[k] }));
    return (
      <StepScaffold
        icon="cash-plus"
        prompt={t('simple.sale.whatQ')}
        onBack={() => router.back()}
        primary={{ label: t('common.next'), icon: 'arrow-right', onPress: () => setStep('count'), disabled: !kind }}>
        <PictureChoice
          choices={choices}
          value={kind}
          onChange={(k) => {
            setKind(k);
            setPrice(null);
          }}
        />
        {!farm && <Banner tone="warning" message={t('form.noFarm')} />}
      </StepScaffold>
    );
  }

  if (step === 'count') {
    return (
      <StepScaffold
        icon={kind ? SALE_ICONS[kind] : 'cash-plus'}
        prompt={t('simple.sale.countQ', { what })}
        onBack={() => setStep('what')}
        primary={{ label: t('common.next'), icon: 'arrow-right', onPress: () => setStep('price'), disabled: amount <= 0 }}>
        {kind === 'EGG_SALE' ? (
          <>
            <BigCounter label={t('simple.eggs.trays')} icon="egg-outline" value={trays} onChange={setTrays} testID="sale-trays" />
            <BigCounter label={t('simple.eggs.loose')} value={loose} max={EGGS_PER_TRAY - 1} onChange={setLoose} />
            <Text variant="display" numeric style={{ textAlign: 'center' }}>
              {t('simple.eggs.total', { total: formatNumber(eggs) })}
            </Text>
          </>
        ) : (
          <BigCounter label={unitName} icon={kind ? SALE_ICONS[kind] : undefined} value={count} onChange={setCount} testID="sale-count" />
        )}
      </StepScaffold>
    );
  }

  if (step === 'price') {
    return (
      <StepScaffold
        icon="currency-inr"
        prompt={t('simple.sale.priceQ', { unit: unitName })}
        onBack={() => setStep('count')}
        primary={{ label: t('common.next'), icon: 'arrow-right', onPress: () => setStep('paid'), disabled: unitPrice <= 0 }}>
        <BigCounter label={`₹ / ${unitName}`} icon="currency-inr" value={unitPrice} step={kind === 'MANURE_SALE' ? 10 : 5} decimal onChange={setPrice} testID="sale-price" />
        <Text variant="display" numeric style={{ textAlign: 'center' }}>
          {t('simple.sale.total', { total: formatCurrency(total) })}
        </Text>
      </StepScaffold>
    );
  }

  if (step === 'paid') {
    return (
      <StepScaffold
        icon="hand-coin-outline"
        prompt={t('simple.sale.paidQ')}
        onBack={() => setStep('price')}
        primary={{
          label: t('common.next'),
          icon: 'arrow-right',
          onPress: () => setStep(paid === 'no' && customers_.length > 0 ? 'who' : 'review'),
          disabled: !paid,
        }}>
        <PictureChoice
          value={paid}
          onChange={setPaid}
          choices={[
            { value: 'yes', label: t('simple.sale.paidYes'), icon: 'cash-check' },
            { value: 'no', label: t('simple.sale.paidNo'), icon: 'progress-clock' },
          ]}
        />
      </StepScaffold>
    );
  }

  if (step === 'who') {
    return (
      <StepScaffold
        icon="account-cash-outline"
        prompt={t('simple.sale.whoQ')}
        onBack={() => setStep('paid')}
        primary={{ label: t('common.next'), icon: 'arrow-right', onPress: () => setStep('review'), disabled: !customerId }}>
        <PictureChoice list value={customerId} onChange={setCustomerId} choices={customers_.map((c) => ({ value: c.id, label: c.name, icon: 'account-outline' }))} />
      </StepScaffold>
    );
  }

  const who = customers_.find((c) => c.id === customerId)?.name;
  return (
    <StepScaffold
      icon="clipboard-check-outline"
      iconTint="success"
      prompt={t('simple.sale.review', { what, count: countText, total: formatCurrency(total) })}
      onBack={() => setStep(paid === 'no' && customers_.length > 0 ? 'who' : 'paid')}
      primary={{ label: t('simple.save'), icon: 'check-bold', onPress: save, disabled: !farm }}>
      <PictureChoice
        list
        value={null}
        onChange={(v) => setStep(v as Step)}
        choices={[
          { value: 'count', label: countText, icon: kind ? SALE_ICONS[kind] : 'cash-plus' },
          { value: 'price', label: t('simple.sale.priceEach', { price: formatCurrency(unitPrice), unit: unitName }), icon: 'currency-inr' },
          {
            value: 'paid',
            label: paid === 'no' ? (who ? `${t('simple.sale.paidNo')} · ${who}` : t('simple.sale.paidNo')) : t('simple.sale.paidYes'),
            icon: paid === 'no' ? 'progress-clock' : 'cash-check',
          },
        ]}
      />
    </StepScaffold>
  );
}
