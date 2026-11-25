import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { DateStepper } from '@/components/ui/date-stepper';
import { FormHeader } from '@/components/ui/form-header';
import { NumberField } from '@/components/ui/number-field';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { can } from '@/features/auth/permissions';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { useDeleteExpense, useExpense, useParties, useSaveExpense } from '@/features/money/api';
import { EXPENSE_ICONS, PAYMENT_MODE_ICONS } from '@/features/money/icons';
import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory, PAYMENT_MODES, type PaymentMode } from '@/features/money/model';
import { errorMessage } from '@/lib/api/messages';
import { confirm } from '@/lib/confirm';
import { localDayIso, startOfLocalDay } from '@/lib/dates';
import { leave } from '@/lib/navigation';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/use-theme';

export default function ExpenseScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const expense = useExpense(id);
  if (id && expense.isPending) return <ActivityIndicator color={colors.primary} style={styles.loading} />;
  return <ExpenseForm key={expense.data?.id ?? 'new'} existing={expense.data ?? null} />;
}

function ExpenseForm({ existing }: { existing: Expense | null }) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const { farm } = useWorkingFarm();
  const farmId = existing?.farmId ?? farm?.id ?? null;
  const save = useSaveExpense(existing?.id);
  const suppliers = useParties('suppliers');

  const [category, setCategory] = useState<ExpenseCategory | null>(existing?.category ?? null);
  const [amount, setAmount] = useState<number | undefined>(existing?.amount);
  const [gst, setGst] = useState<number | undefined>(existing?.gstAmount ?? undefined);
  const [mode, setMode] = useState<PaymentMode>(existing?.paymentMode ?? 'CASH');
  const [vendor, setVendor] = useState(existing?.vendor ?? '');
  const [bill, setBill] = useState(existing?.invoiceNumber ?? '');
  const [day, setDay] = useState(() => startOfLocalDay(existing ? new Date(existing.date) : new Date()));
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [tried, setTried] = useState(false);

  const canSave = existing ? can(user, 'EXPENSE', 'UPDATE') : can(user, 'EXPENSE', 'CREATE');
  const errors = {
    category: category ? undefined : t('money.pickCategory'),
    amount: amount && amount > 0 ? undefined : t('form.moreThanZero'),
    gst: gst === undefined || (amount !== undefined && gst <= amount) ? undefined : t('money.gstTooBig'),
  };
  const valid = !errors.category && !errors.amount && !errors.gst;

  async function onSave() {
    setTried(true);
    if (!valid || !farmId || !category) return;
    await save.mutateAsync({
      farmId,
      category,
      amount: amount!,
      gstAmount: gst,
      vendor: vendor.trim() || undefined,
      paymentMode: mode,
      invoiceNumber: bill.trim() || undefined,
      date: localDayIso(day),
      notes: notes.trim() || undefined,
    });
    leave({ pathname: '/money', params: { tab: 'expenses' } });
  }

  const supplierNames = (suppliers.data ?? []).map((s) => s.name).slice(0, 8);

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader kind="close" title={existing ? t('money.editExpense') : t('money.newExpense')} subtitle={existing?.farm?.name ?? farm?.name} />
      <ChoiceChips<ExpenseCategory>
        label={t('money.spentOn')}
        value={category}
        onChange={setCategory}
        options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: t(`money.categories.${c}`), icon: EXPENSE_ICONS[c] }))}
        testID="expense-category"
      />
      {tried && errors.category && <Banner tone="warning" message={errors.category} />}
      <NumberField label={t('money.amount')} value={amount} onChange={setAmount} decimal step={100} unit="₹" error={tried ? errors.amount : undefined} testID="expense-amount" />
      <ChoiceChips<PaymentMode>
        label={t('money.paidBy')}
        value={mode}
        onChange={setMode}
        options={PAYMENT_MODES.map((m) => ({ value: m, label: t(`money.modes.${m}`), icon: PAYMENT_MODE_ICONS[m] }))}
      />
      <TextField label={t('money.paidTo')} placeholder={t('money.paidToPlaceholder')} value={vendor} onChangeText={setVendor} />
      {supplierNames.length > 0 && (
        <ChoiceChips<string> value={vendor} onChange={setVendor} options={supplierNames.map((n) => ({ value: n, label: n }))} />
      )}
      <DateStepper label={t('form.date')} value={day} onChange={(d) => setDay(startOfLocalDay(d))} />
      <NumberField label={t('money.gstOptional')} value={gst} onChange={setGst} decimal unit="₹" hint={t('money.gstHint')} error={tried ? errors.gst : undefined} />
      <TextField label={t('money.billOptional')} value={bill} onChangeText={setBill} />
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
        testID="save-expense"
      />
      {existing && can(user, 'EXPENSE', 'DELETE') && <DeleteExpense id={existing.id} />}
    </Screen>
  );
}

function DeleteExpense({ id }: { id: string }) {
  const { t } = useTranslation();
  const remove = useDeleteExpense(id);
  async function onDelete() {
    const ok = await confirm(t('money.deleteExpenseConfirm'), t('money.delete'), t('common.cancel'));
    if (!ok) return;
    await remove.mutateAsync();
    leave({ pathname: '/money', params: { tab: 'expenses' } });
  }
  return (
    <>
      {remove.isError && <Banner message={errorMessage(remove.error, t)} />}
      <Button label={t('money.delete')} icon="delete-outline" variant="danger" onPress={() => void onDelete().catch(() => {})} loading={remove.isPending} />
    </>
  );
}

const styles = StyleSheet.create({ loading: { flex: 1 } });
