import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { FormHeader } from '@/components/ui/form-header';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { can } from '@/features/auth/permissions';
import { type PartyKind, useParties, useSaveParty } from '@/features/money/api';
import type { Party } from '@/features/money/model';
import { errorMessage } from '@/lib/api/messages';
import { leave } from '@/lib/navigation';
import { useAuth } from '@/store/auth';

/** Add or edit a customer or supplier. */
export default function PersonScreen() {
  const params = useLocalSearchParams<{ kind?: string; id?: string }>();
  const kind: PartyKind = params.kind === 'suppliers' ? 'suppliers' : 'customers';
  const people = useParties(kind);
  const existing = params.id ? (people.data ?? []).find((p) => p.id === params.id) : undefined;
  if (params.id && people.isPending) return null;
  return <PersonForm key={existing?.id ?? 'new'} kind={kind} existing={existing ?? null} />;
}

function PersonForm({ kind, existing }: { kind: PartyKind; existing: Party | null }) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const save = useSaveParty(kind, existing?.id);
  const isCustomers = kind === 'customers';
  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [gst, setGst] = useState(existing?.gstNumber ?? '');
  const [supplies, setSupplies] = useState(existing?.suppliesType ?? '');
  const [tried, setTried] = useState(false);

  const module = isCustomers ? 'CUSTOMER' : 'SUPPLIER';
  const canSave = can(user, module, existing ? 'UPDATE' : 'CREATE');
  const phoneDigits = phone.replace(/\D/g, '');
  const errors = {
    name: name.trim().length >= 2 ? undefined : t('money.nameRequired'),
    phone: !phone.trim() || phoneDigits.length >= 10 ? undefined : t('money.phoneInvalid'),
  };
  const valid = !errors.name && !errors.phone;

  async function onSave() {
    setTried(true);
    if (!valid) return;
    await save.mutateAsync({
      name: name.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      gstNumber: gst.trim() || undefined,
      ...(isCustomers ? {} : { suppliesType: supplies.trim() || undefined }),
    });
    leave({ pathname: '/money/people', params: { kind } });
  }

  const title = existing
    ? t('money.editPerson')
    : isCustomers
      ? t('money.addCustomer')
      : t('money.addSupplier');

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader kind="close" title={title} />
      <TextField label={t('money.name')} value={name} onChangeText={setName} error={tried ? errors.name : undefined} testID="person-name" />
      <TextField
        label={t('money.phoneOptional')}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        hint={t('money.phoneHint')}
        error={tried ? errors.phone : undefined}
        testID="person-phone"
      />
      {!isCustomers && (
        <TextField label={t('money.suppliesOptional')} placeholder={t('money.suppliesPlaceholder')} value={supplies} onChangeText={setSupplies} />
      )}
      <TextField label={t('money.addressOptional')} value={address} onChangeText={setAddress} multiline />
      <TextField label={t('money.gstNumberOptional')} value={gst} onChangeText={setGst} autoCapitalize="characters" />
      {!canSave && <Banner tone="warning" message={t('form.noPermission')} />}
      {save.isError && <Banner message={errorMessage(save.error, t)} />}
      <Button
        label={existing ? t('form.saveChanges') : t('form.save')}
        icon="check"
        onPress={() => void onSave().catch(() => {})}
        loading={save.isPending}
        disabled={!canSave}
        testID="save-person"
      />
    </Screen>
  );
}
