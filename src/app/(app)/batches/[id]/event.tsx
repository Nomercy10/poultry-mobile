import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { DateStepper } from '@/components/ui/date-stepper';
import { FormHeader } from '@/components/ui/form-header';
import { NumberField } from '@/components/ui/number-field';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { BATCH_STATUSES, type BatchStatus, type EventType, useAddEvent, useBatch } from '@/features/chickens/api';
import { errorMessage } from '@/lib/api/messages';
import { leave } from '@/lib/navigation';
import { localDayIso, startOfLocalDay } from '@/lib/dates';
import { formatNumber } from '@/lib/format';
import { radius, space, touch } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const TYPES: EventType[] = ['VACCINATION', 'MEDICINE', 'MORTALITY', 'WEIGHT_CHECK', 'STATUS_CHANGE', 'NOTE'];

/** Records one batch event: deaths, weight, medicine, vaccine given, a note or a status change. */
export default function BatchEventScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id: string; type?: string }>();
  const type: EventType = TYPES.includes(params.type as EventType) ? (params.type as EventType) : 'NOTE';
  const batch = useBatch(params.id);
  const add = useAddEvent(params.id);
  const b = batch.data;

  const [day, setDay] = useState(() => startOfLocalDay());
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [medicine, setMedicine] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<BatchStatus | null>(null);
  const [tried, setTried] = useState(false);

  const error = (() => {
    if (type === 'MORTALITY') {
      if (!quantity || quantity <= 0) return t('form.moreThanZero');
      if (b && quantity > b.currentCount) return t('batches.moreThanBirds', { count: formatNumber(b.currentCount) });
    }
    if (type === 'WEIGHT_CHECK' && (!weight || weight <= 0)) return t('form.moreThanZero');
    if (type === 'MEDICINE' && !medicine.trim()) return t('form.required');
    if (type === 'VACCINATION' && !description.trim()) return t('form.required');
    if (type === 'NOTE' && !description.trim()) return t('form.required');
    if (type === 'STATUS_CHANGE' && !status) return t('form.required');
    return undefined;
  })();

  async function onSave() {
    setTried(true);
    if (error) return;
    await add.mutateAsync({
      type,
      eventDate: localDayIso(day),
      description: description.trim() || undefined,
      quantity: type === 'MORTALITY' || type === 'MEDICINE' ? quantity : undefined,
      weightKg: type === 'WEIGHT_CHECK' ? weight : undefined,
      medicineName: type === 'MEDICINE' ? medicine.trim() : undefined,
      newStatus: type === 'STATUS_CHANGE' ? (status ?? undefined) : undefined,
    });
    leave('/flock');
  }

  const shown = tried ? error : undefined;

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader kind="close" title={t(`batches.actions.${type}`)} subtitle={b ? `${b.batchNumber} · ${t('batches.birdsCount', { count: formatNumber(b.currentCount) })}` : undefined} />
      <DateStepper label={t('form.date')} value={day} onChange={(d) => setDay(startOfLocalDay(d))} />

      {type === 'MORTALITY' && (
        <NumberField label={t('batches.howManyDied')} value={quantity} onChange={setQuantity} error={shown} testID="mortality-count" />
      )}
      {type === 'WEIGHT_CHECK' && (
        <NumberField label={t('batches.avgWeightKg')} value={weight} onChange={setWeight} decimal step={0.1} unit="kg" error={shown} />
      )}
      {type === 'MEDICINE' && (
        <TextField label={t('batches.medicineName')} value={medicine} onChangeText={setMedicine} error={shown} />
      )}
      {type === 'STATUS_CHANGE' && (
        <View style={styles.statusGrid}>
          <Text variant="label">{t('batches.newStatus')}</Text>
          {BATCH_STATUSES.map((s) => {
            const selected = s === status;
            return (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[
                  styles.option,
                  { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.card },
                ]}>
                <Text variant="body">{t(`batches.status.${s}`)}</Text>
              </Pressable>
            );
          })}
          {shown && <Text variant="caption" tone="danger">{shown}</Text>}
        </View>
      )}

      <TextField
        label={
          type === 'VACCINATION'
            ? t('batches.vaccineName')
            : type === 'NOTE'
              ? t('batches.note')
              : type === 'MORTALITY'
                ? t('batches.causeOptional')
                : t('form.notesOptional')
        }
        value={description}
        onChangeText={setDescription}
        multiline={type === 'NOTE'}
        error={type === 'VACCINATION' || type === 'NOTE' ? shown : undefined}
      />

      {add.isError && <Banner message={errorMessage(add.error, t)} />}
      <Button label={t('form.save')} icon="check" onPress={() => void onSave().catch(() => {})} loading={add.isPending} disabled={!b} testID="event-save" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusGrid: { gap: space.sm },
  option: { minHeight: touch.min, borderWidth: 1, borderRadius: radius.md, justifyContent: 'center', paddingHorizontal: space.lg },
});
