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
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { can } from '@/features/auth/permissions';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { useDeleteRenewal, useRenewalDone, useRenewals, useSaveRenewal } from '@/features/money/api';
import { RENEWAL_ICONS } from '@/features/money/icons';
import { REMIND_CHOICES, RENEWAL_KINDS, REPEAT_CHOICES, type Renewal, type RenewalKind } from '@/features/money/renewals';
import { errorMessage } from '@/lib/api/messages';
import { confirm } from '@/lib/confirm';
import { addDays, formatDay, localDayIso, startOfLocalDay } from '@/lib/dates';
import { leave } from '@/lib/navigation';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/use-theme';

/** Add or edit a renewal. `id` = edit (found in the farm's open renewals). */
export default function RenewalScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const renewals = useRenewals(null);
  if (id && renewals.isPending) return <ActivityIndicator color={colors.primary} style={styles.loading} />;
  const existing = id ? ((renewals.data ?? []).find((r) => r.id === id) ?? null) : null;
  return <RenewalForm key={existing?.id ?? 'new'} existing={existing} />;
}

type RepeatKey = 'once' | '1' | '3' | '6' | '12';
const repeatKey = (m: number | null) => (m === null ? 'once' : String(m)) as RepeatKey;

function RenewalForm({ existing }: { existing: Renewal | null }) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const { farm } = useWorkingFarm();
  const farmId = existing?.farmId ?? farm?.id ?? null;
  const save = useSaveRenewal(existing?.id);
  const done = useRenewalDone();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [kind, setKind] = useState<RenewalKind>(existing?.kind ?? 'LICENCE');
  const [dueDate, setDueDate] = useState(() => startOfLocalDay(existing ? new Date(existing.dueDate) : addDays(new Date(), 30)));
  const [repeat, setRepeat] = useState<number | null>(existing?.repeatMonths ?? 12);
  const [amount, setAmount] = useState<number | undefined>(existing?.amount ?? undefined);
  const [remind, setRemind] = useState<number>(existing?.remindDaysBefore ?? 7);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [tried, setTried] = useState(false);

  const canSave = can(user, 'RENEWAL', existing ? 'UPDATE' : 'CREATE');
  const titleError = title.trim().length >= 2 ? undefined : t('insights.renewals.titleRequired');

  async function onSave() {
    setTried(true);
    if (titleError || !farmId) return;
    await save.mutateAsync({
      farmId,
      title: title.trim(),
      kind,
      dueDate: localDayIso(dueDate),
      repeatMonths: repeat,
      amount: amount ?? null,
      remindDaysBefore: remind,
      notes: notes.trim() || null,
    });
    leave('/money/renewals');
  }

  async function onDone() {
    if (!existing) return;
    await done.mutateAsync(existing.id);
    leave('/money/renewals');
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader kind="close" title={existing ? t('insights.renewals.edit') : t('insights.renewals.add')} />
      {existing && can(user, 'RENEWAL', 'UPDATE') && (
        <>
          <Button
            label={existing.repeatMonths ? t('insights.renewals.doneRepeat') : t('insights.renewals.doneOnce')}
            icon="check-circle-outline"
            variant="secondary"
            onPress={() => void onDone().catch(() => {})}
            loading={done.isPending}
            testID="renewal-done"
          />
          {existing.repeatMonths && (
            <Text variant="caption" tone="muted">
              {t('insights.renewals.doneRepeatHint', { date: formatDay(nextDue(existing)) })}
            </Text>
          )}
          {done.isError && <Banner message={errorMessage(done.error, t)} />}
        </>
      )}
      <ChoiceChips<RenewalKind>
        label={t('insights.renewals.kind')}
        value={kind}
        onChange={setKind}
        options={RENEWAL_KINDS.map((k) => ({ value: k, label: t(`insights.renewals.kinds.${k}`), icon: RENEWAL_ICONS[k] }))}
      />
      <TextField
        label={t('insights.renewals.titleLabel')}
        placeholder={t('insights.renewals.titlePlaceholder')}
        value={title}
        onChangeText={setTitle}
        error={tried ? titleError : undefined}
        testID="renewal-title"
      />
      <DateStepper label={t('insights.renewals.dueDate')} value={dueDate} onChange={(d) => setDueDate(startOfLocalDay(d))} max={null} />
      <ChoiceChips<string>
        value=""
        onChange={(v) => setDueDate(inMonths(Number(v)))}
        options={[1, 3, 6, 12].map((m) => ({ value: String(m), label: t('insights.renewals.inMonths', { count: m }) }))}
        testID="renewal-jump"
      />
      <ChoiceChips<string>
        label={t('insights.renewals.repeatLabel')}
        value={repeatKey(repeat)}
        onChange={(v) => setRepeat(v === 'once' ? null : Number(v))}
        options={REPEAT_CHOICES.map((m) => ({ value: repeatKey(m), label: t(`insights.renewals.repeat.${repeatKey(m)}`) }))}
      />
      <NumberField label={t('insights.renewals.amount')} value={amount} onChange={setAmount} decimal unit="₹" step={500} />
      <ChoiceChips<string>
        label={t('insights.renewals.remindLabel')}
        value={String(remind)}
        onChange={(v) => setRemind(Number(v))}
        options={REMIND_CHOICES.map((d) => ({ value: String(d), label: t('insights.renewals.remindDays', { count: d }) }))}
      />
      <TextField label={t('form.notesOptional')} value={notes} onChangeText={setNotes} multiline />
      {!farmId && <Banner tone="warning" message={t('form.noFarm')} />}
      {!canSave && <Banner tone="warning" message={t('form.noPermission')} />}
      {save.isError && <Banner message={errorMessage(save.error, t)} />}
      <Button
        label={existing ? t('form.saveChanges') : t('form.save')}
        icon="check"
        onPress={() => void onSave().catch(() => {})}
        loading={save.isPending}
        disabled={!canSave || !farmId}
        testID="save-renewal"
      />
      {existing && can(user, 'RENEWAL', 'DELETE') && <DeleteRenewal id={existing.id} />}
    </Screen>
  );
}

/** Today plus whole months, for the quick due-date buttons. */
function inMonths(months: number): Date {
  const d = startOfLocalDay();
  d.setMonth(d.getMonth() + months);
  return d;
}

function nextDue(r: Renewal): Date {
  const d = new Date(r.dueDate);
  d.setMonth(d.getMonth() + (r.repeatMonths ?? 0));
  return d;
}

function DeleteRenewal({ id }: { id: string }) {
  const { t } = useTranslation();
  const remove = useDeleteRenewal();
  async function onDelete() {
    const ok = await confirm(t('insights.renewals.deleteConfirm'), t('money.delete'), t('common.cancel'));
    if (!ok) return;
    await remove.mutateAsync(id);
    leave('/money/renewals');
  }
  return (
    <>
      {remove.isError && <Banner message={errorMessage(remove.error, t)} />}
      <Button label={t('money.delete')} icon="delete-outline" variant="danger" onPress={() => void onDelete().catch(() => {})} loading={remove.isPending} />
    </>
  );
}

const styles = StyleSheet.create({ loading: { flex: 1 } });
