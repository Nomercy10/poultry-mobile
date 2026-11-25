import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { type ChipOption, ChoiceChips } from '@/components/ui/choice-chips';
import { DateStepper } from '@/components/ui/date-stepper';
import { FormHeader } from '@/components/ui/form-header';
import { NumberField } from '@/components/ui/number-field';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { can } from '@/features/auth/permissions';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { useDeleteSale, useLastSale, useParties, useSale, useSaveSale, useUpdateSale } from '@/features/money/api';
import { SALE_ICONS } from '@/features/money/icons';
import {
  amountDue,
  amountPaid,
  applyPayment,
  composeNotes,
  EGGS_PER_TRAY,
  parseNotes,
  type PaymentStatus,
  type Sale,
  SALE_TYPES,
  SALE_UNITS,
  type SaleType,
  type SaleUnit,
  saleTotal,
  statusFor,
} from '@/features/money/model';
import { sendReminder } from '@/features/money/reminder';
import { LockedFeature } from '@/features/plans/locked-feature';
import { hasFeature } from '@/features/plans/catalog';
import { usePlan } from '@/features/plans/use-plan';
import { errorMessage } from '@/lib/api/messages';
import { confirm } from '@/lib/confirm';
import { formatDay, localDayIso, startOfLocalDay } from '@/lib/dates';
import { formatCurrency } from '@/lib/format';
import { leave } from '@/lib/navigation';
import { useAuth } from '@/store/auth';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const NO_CUSTOMER = 'none';

export default function SaleScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const sale = useSale(id);
  if (id && sale.isPending) return <ActivityIndicator color={colors.primary} style={styles.loading} />;
  return <SaleForm key={sale.data?.id ?? 'new'} existing={sale.data ?? null} />;
}

function SaleForm({ existing }: { existing: Sale | null }) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const { farm } = useWorkingFarm();
  const farmId = existing?.farmId ?? farm?.id ?? null;
  const save = useSaveSale(existing?.id);
  const customers = useParties('customers');
  const meta = parseNotes(existing?.notes);

  const [type, setType] = useState<SaleType>(existing?.type ?? 'EGG_SALE');
  const [unit, setUnit] = useState<SaleUnit | undefined>(meta.unit ?? SALE_UNITS[existing?.type ?? 'EGG_SALE'][0]);
  const [quantity, setQuantity] = useState<number | undefined>(existing?.quantity);
  const [rate, setRate] = useState<number | undefined>(existing?.rate);
  const [rateTouched, setRateTouched] = useState(!!existing);
  const [customerId, setCustomerId] = useState<string>(existing?.customerId ?? NO_CUSTOMER);
  const [status, setStatus] = useState<PaymentStatus>(existing?.paymentStatus ?? 'PAID');
  const [paidNow, setPaidNow] = useState<number | undefined>(existing ? amountPaid(existing) : undefined);
  const [day, setDay] = useState(() => startOfLocalDay(existing ? new Date(existing.date) : new Date()));
  const [notes, setNotes] = useState(meta.text);
  const [tried, setTried] = useState(false);

  // Suggest the last rate and unit for this kind of sale (new sales only).
  const last = useLastSale(type, farmId);
  const [suggestedFor, setSuggestedFor] = useState<string | null>(null);
  if (!existing && !rateTouched && last.data && suggestedFor !== last.data.id) {
    setSuggestedFor(last.data.id);
    setRate(last.data.rate);
    // Sales entered on the website carry no unit; their egg prices are per egg.
    const lastUnit = parseNotes(last.data.notes).unit ?? (type === 'EGG_SALE' ? 'EGG' : undefined);
    if (lastUnit && SALE_UNITS[type].includes(lastUnit)) setUnit(lastUnit);
  }

  const total = saleTotal(quantity, rate);
  const finalStatus = status === 'PARTIAL' ? statusFor(total, paidNow ?? 0) : status;
  const canSave = existing ? can(user, 'REVENUE', 'UPDATE') : can(user, 'REVENUE', 'CREATE');
  const errors = {
    quantity: quantity && quantity > 0 ? undefined : t('form.moreThanZero'),
    rate: rate !== undefined && rate >= 0 ? undefined : t('form.required'),
    customer: finalStatus !== 'PAID' && customerId === NO_CUSTOMER ? t('money.customerForDue') : undefined,
  };
  const valid = !errors.quantity && !errors.rate && !errors.customer;
  const unitLabel = unit ? t(`money.units.${unit}`) : '';

  function changeType(next: SaleType) {
    setType(next);
    setUnit(SALE_UNITS[next][0]);
    setRateTouched(false);
    setSuggestedFor(null);
    if (!existing) setRate(undefined);
  }

  async function onSave() {
    setTried(true);
    if (!valid || !farmId) return;
    await save.mutateAsync({
      farmId,
      type,
      customerId: customerId === NO_CUSTOMER ? undefined : customerId,
      quantity: quantity!,
      rate: rate!,
      paymentStatus: finalStatus,
      date: localDayIso(day),
      notes: composeNotes({ text: notes, unit, paid: finalStatus === 'PARTIAL' ? paidNow : undefined }),
    });
    leave('/money');
  }

  const customerOptions: ChipOption<string>[] = [
    { value: NO_CUSTOMER, label: t('money.noName') },
    ...(customers.data ?? []).map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader kind="close" title={existing ? t('money.editSale') : t('money.newSale')} subtitle={existing?.farm?.name ?? farm?.name} />

      {existing && amountDue(existing) > 0 && <PaymentCard sale={existing} />}

      <ChoiceChips<SaleType>
        label={t('money.whatSold')}
        value={type}
        onChange={changeType}
        options={SALE_TYPES.map((v) => ({ value: v, label: t(`money.saleTypes.${v}`), icon: SALE_ICONS[v] }))}
        testID="sale-type"
      />
      {SALE_UNITS[type].length > 0 && (
        <>
          <Text variant="label">{t('money.soldBy')}</Text>
          <SegmentedControl<SaleUnit>
            value={unit ?? SALE_UNITS[type][0]}
            onChange={setUnit}
            options={SALE_UNITS[type].map((u) => ({ value: u, label: t(`money.units.${u}`) }))}
          />
        </>
      )}
      <NumberField
        label={t('money.quantity')}
        value={quantity}
        onChange={setQuantity}
        decimal
        unit={unitLabel}
        hint={unit === 'TRAY' ? t('money.trayHint', { count: EGGS_PER_TRAY }) : undefined}
        error={tried ? errors.quantity : undefined}
        testID="sale-quantity"
      />
      <NumberField
        label={unit ? t('money.ratePer', { unit: unitLabel }) : t('money.rate')}
        value={rate}
        onChange={(v) => {
          setRate(v);
          setRateTouched(true);
        }}
        decimal
        unit="₹"
        hint={!existing && !rateTouched && last.data ? t('money.lastRate', { date: formatDay(last.data.date) }) : undefined}
        error={tried ? errors.rate : undefined}
        testID="sale-rate"
      />
      <Card style={styles.total}>
        <Text variant="label" tone="muted">
          {t('money.total')}
        </Text>
        <Text variant="display" numeric testID="sale-total">
          {formatCurrency(total)}
        </Text>
      </Card>

      <ChoiceChips<string> label={t('money.customer')} value={customerId} onChange={setCustomerId} options={customerOptions} testID="sale-customer" />
      {can(user, 'CUSTOMER', 'CREATE') && (
        <Button
          label={t('money.addCustomer')}
          icon="account-plus-outline"
          variant="ghost"
          compact
          onPress={() => router.push({ pathname: '/money/person', params: { kind: 'customers' } })}
        />
      )}

      {!existing && (
        <>
          <Text variant="label">{t('money.payment')}</Text>
          <SegmentedControl<PaymentStatus>
            value={status}
            onChange={setStatus}
            options={(['PAID', 'PARTIAL', 'UNPAID'] as const).map((v) => ({ value: v, label: t(`money.status.${v}`) }))}
          />
          {status === 'PARTIAL' && (
            <NumberField label={t('money.paidNow')} value={paidNow} onChange={setPaidNow} decimal unit="₹" testID="sale-paid-now" />
          )}
        </>
      )}
      {tried && errors.customer && <Banner tone="warning" message={errors.customer} />}

      <DateStepper label={t('form.date')} value={day} onChange={(d) => setDay(startOfLocalDay(d))} />
      <TextField label={t('form.notesOptional')} value={notes} onChangeText={setNotes} multiline />

      {!farmId && <Banner tone="warning" message={t('form.noFarm')} />}
      {!canSave && <Banner tone="warning" message={t('form.noPermission')} />}
      {save.isError && <Banner message={errorMessage(save.error, t)} />}
      <Button
        label={existing ? t('form.saveChanges') : t('form.save')}
        icon="check"
        onPress={() => void onSave().catch(() => {})}
        loading={save.isPending}
        disabled={!farmId || !canSave}
        testID="save-sale"
      />
      {existing && can(user, 'REVENUE', 'DELETE') && <DeleteSale id={existing.id} />}
    </Screen>
  );
}

/** Dues on an existing sale: take a payment, or remind the customer. */
function PaymentCard({ sale }: { sale: Sale }) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const plan = usePlan();
  const update = useUpdateSale(sale.id);
  const due = amountDue(sale);
  const [amount, setAmount] = useState<number | undefined>(due);

  async function record() {
    if (!amount || amount <= 0) return;
    await update.mutateAsync(applyPayment(sale, amount));
    leave('/money');
  }

  const message = t('money.reminderText', {
    name: sale.customer?.name ?? '',
    amount: formatCurrency(due),
    item: t(`money.saleTypes.${sale.type}`),
    date: formatDay(sale.date),
  });

  return (
    <Card style={styles.payment}>
      <Text variant="label" tone="warning">
        {t('money.stillDue', { amount: formatCurrency(due) })}
      </Text>
      {can(user, 'REVENUE', 'UPDATE') && (
        <View style={styles.paymentRow}>
          <View style={styles.flex}>
            <NumberField label={t('money.paymentReceived')} value={amount} onChange={setAmount} decimal unit="₹" testID="payment-amount" />
          </View>
        </View>
      )}
      {can(user, 'REVENUE', 'UPDATE') && (
        <Button
          label={t('money.recordPayment')}
          icon="cash-check"
          onPress={() => void record().catch(() => {})}
          loading={update.isPending}
          disabled={!amount || amount <= 0}
          testID="record-payment"
        />
      )}
      {update.isError && <Banner message={errorMessage(update.error, t)} />}
      <Button
        label={t('money.sendReminder')}
        icon="whatsapp"
        variant="secondary"
        onPress={() => void sendReminder(sale.customer?.phone, message).catch(() => {})}
      />
      {!hasFeature(plan, 'paymentReminders') && <LockedFeature feature="paymentReminders" />}
    </Card>
  );
}

function DeleteSale({ id }: { id: string }) {
  const { t } = useTranslation();
  const remove = useDeleteSale(id);
  async function onDelete() {
    const ok = await confirm(t('money.deleteSaleConfirm'), t('money.delete'), t('common.cancel'));
    if (!ok) return;
    await remove.mutateAsync();
    leave('/money');
  }
  return (
    <>
      {remove.isError && <Banner message={errorMessage(remove.error, t)} />}
      <Button label={t('money.delete')} icon="delete-outline" variant="danger" onPress={() => void onDelete().catch(() => {})} loading={remove.isPending} />
    </>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1 },
  total: { alignItems: 'center', gap: space.xs },
  payment: { gap: space.md },
  paymentRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-end' },
  flex: { flex: 1 },
});
