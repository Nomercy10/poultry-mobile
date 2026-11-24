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
import { type FeedItem, useFeedItems } from '@/features/feed/api';
import { usePendingSave } from '@/features/simple/pending-save';
import { api } from '@/lib/api/client';
import { localDayIso } from '@/lib/dates';
import { formatNumber } from '@/lib/format';

/** Standard feed bag. A per-purchase bag size comes with the backend change in the spec (§1.6). */
const BAG_KG = 50;
type Step = 'which' | 'amount' | 'review' | 'done';

export default function SimpleFeed() {
  const { t } = useTranslation();
  const { filterFarmId } = useWorkingFarm();
  const feed = useFeedItems(filterFarmId);
  const inStock = (feed.data ?? []).filter((f) => f.currentQuantity > 0);
  if (feed.isPending) return null;
  if (inStock.length === 0) {
    return (
      <StepScaffold icon="grain" prompt={t('pick.noFeed')} onBack={() => router.back()}>
        <Text tone="muted">{t('simple.nothingHere')}</Text>
      </StepScaffold>
    );
  }
  return <FeedFlow items={inStock} />;
}

function FeedFlow({ items }: { items: FeedItem[] }) {
  const { t } = useTranslation();
  const schedule = usePendingSave((s) => s.schedule);
  const single = items.length === 1;
  const [feedId, setFeedId] = useState<string | null>(single ? items[0].id : null);
  const [step, setStep] = useState<Step>(single ? 'amount' : 'which');
  const [bags, setBags] = useState(1);
  const [extra, setExtra] = useState(0);
  const item = items.find((f) => f.id === feedId);
  const unit = item ? t(`feed.units.${item.unit}`) : '';
  const byBags = item?.unit === 'KG';
  const amount = byBags ? bags * BAG_KG + extra : bags;
  const tooMuch = !!item && amount > item.currentQuantity;
  const savedSay = t('simple.feed.savedSay', { amount: formatNumber(amount), unit });
  const lowAfter = !!item && item.currentQuantity - amount <= item.lowStockThreshold;

  function save() {
    if (!item) return;
    schedule(lowAfter ? `${savedSay} ${t('simple.feed.lowAfter')}` : savedSay, () =>
      api.post(`/feed/${item.id}/consumption`, { date: localDayIso(), quantityUsed: amount }),
    );
    setStep('done');
  }

  if (step === 'done') return <SuccessView summary={lowAfter ? `${savedSay} ${t('simple.feed.lowAfter')}` : savedSay} />;

  if (step === 'which') {
    const choices: Choice<string>[] = items.map((f) => ({
      value: f.id,
      label: f.feedType,
      icon: 'grain',
      detail: t('feed.leftShort', { left: formatNumber(f.currentQuantity), unit: t(`feed.units.${f.unit}`) }),
    }));
    return (
      <StepScaffold
        icon="grain"
        prompt={t('simple.feed.whichQ')}
        onBack={() => router.back()}
        primary={{ label: t('common.next'), icon: 'arrow-right', onPress: () => setStep('amount'), disabled: !feedId }}>
        <PictureChoice list choices={choices} value={feedId} onChange={setFeedId} />
      </StepScaffold>
    );
  }

  if (step === 'amount') {
    return (
      <StepScaffold
        icon="sack"
        prompt={t('simple.feed.howMuchQ')}
        onBack={() => (single ? router.back() : setStep('which'))}
        primary={{ label: t('common.next'), icon: 'arrow-right', onPress: () => setStep('review'), disabled: amount <= 0 || tooMuch }}>
        {byBags ? (
          <>
            <BigCounter label={t('simple.feed.bags')} icon="sack" value={bags} step={0.5} decimal onChange={setBags} testID="feed-bags" />
            <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
              {t('simple.feed.bagSize', { size: BAG_KG, unit })}
            </Text>
            <BigCounter label={unit} icon="weight-kilogram" value={extra} step={5} onChange={setExtra} />
          </>
        ) : (
          <BigCounter label={unit} icon="sack" value={bags} step={item?.unit === 'BAG' ? 0.5 : 1} decimal onChange={setBags} />
        )}
        <Text variant="display" numeric style={{ textAlign: 'center' }}>
          {t('simple.feed.total', { amount: formatNumber(amount), unit })}
        </Text>
        {tooMuch && <Banner tone="warning" message={t('simple.feed.tooMuch', { left: formatNumber(item?.currentQuantity), unit })} />}
      </StepScaffold>
    );
  }

  return (
    <StepScaffold
      icon="clipboard-check-outline"
      iconTint="success"
      prompt={t('simple.feed.review', { feed: item?.feedType ?? '', amount: formatNumber(amount), unit })}
      onBack={() => setStep('amount')}
      primary={{ label: t('simple.save'), icon: 'check-bold', onPress: save }}>
      <PictureChoice
        list
        value={null}
        onChange={(v) => setStep(v as Step)}
        choices={[
          ...(single ? [] : [{ value: 'which', label: item?.feedType ?? '', icon: 'grain' as const }]),
          { value: 'amount', label: `${formatNumber(amount)} ${unit}`, icon: 'sack' },
        ]}
      />
      {lowAfter && <Banner tone="warning" message={t('simple.feed.lowAfter')} />}
    </StepScaffold>
  );
}
