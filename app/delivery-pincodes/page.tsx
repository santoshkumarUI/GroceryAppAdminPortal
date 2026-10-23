'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { downloadCsv } from '../../lib/download-csv';
import AdminHeader from '../admin-header';

type Country = { id: number; name: string };
type StateRow = { id: number; name: string; country_id: number };
type City = { id: number; name: string; state_id: number };
type ServiceablePincode = {
  pincode: string;
  is_serviceable: boolean;
  city_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const blankForm = { pincode: '', country_id: '', state_id: '', city_id: '', notes: '', is_serviceable: true };

export default function DeliveryPincodesPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [rows, setRows] = useState<ServiceablePincode[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingPincode, setEditingPincode] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [countryResult, stateResult, cityResult, pincodeResult] = await Promise.all([
        supabase.from('countries').select('id, name').eq('is_active', true).order('name'),
        supabase.from('states').select('id, name, country_id').eq('is_active', true).order('name'),
        supabase.from('cities').select('id, name, state_id').eq('is_active', true).order('name'),
        supabase.from('delivery_serviceable_pincodes').select('pincode, is_serviceable, city_id, notes, created_at, updated_at').order('pincode'),
      ]);
      if (countryResult.error) throw countryResult.error;
      if (stateResult.error) throw stateResult.error;
      if (cityResult.error) throw cityResult.error;
      if (pincodeResult.error) throw pincodeResult.error;
      setCountries((countryResult.data ?? []) as Country[]);
      setStates((stateResult.data ?? []) as StateRow[]);
      setCities((cityResult.data ?? []) as City[]);
      setRows((pincodeResult.data ?? []) as ServiceablePincode[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load delivery PIN codes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function checkAdmin() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) { router.replace('/login'); return; }
        const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
        if (adminError) throw adminError;
        if (isAdmin !== true) { await supabase.auth.signOut(); router.replace('/login'); return; }
        if (active) { setAuthorized(true); await loadData(); }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not verify admin access.');
        router.replace('/login');
      } finally {
        if (active) setAuthChecking(false);
      }
    }
    void checkAdmin();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') { setAuthorized(false); router.replace('/login'); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [router, loadData]);

  const filteredRows = useMemo(() => rows.filter((row) => {
    const term = search.trim().toLowerCase();
    const cityName = cities.find((city) => city.id === row.city_id)?.name ?? '';
    const matchesTerm = !term || row.pincode.includes(term) || cityName.toLowerCase().includes(term) || (row.notes ?? '').toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && row.is_serviceable) || (statusFilter === 'inactive' && !row.is_serviceable);
    return matchesTerm && matchesStatus;
  }), [rows, cities, search, statusFilter]);

  function downloadPincodes() {
    const exportRows = filteredRows.map((row) => {
      const city = cities.find((item) => item.id === row.city_id);
      const state = states.find((item) => item.id === city?.state_id);
      return [
        row.pincode,
        city?.name ?? '',
        state?.name ?? '',
        row.is_serviceable ? 'Enabled' : 'Disabled',
        row.notes ?? '',
        row.created_at,
        row.updated_at,
      ];
    });

    downloadCsv(`fresh-basket-delivery-pincodes-${new Date().toISOString().slice(0, 10)}.csv`, [
      'PIN code',
      'City',
      'State / Union Territory',
      'Delivery status',
      'Admin notes',
      'Created at',
      'Updated at',
    ], exportRows);
  }

  function startAdd() {
    setEditingPincode(null);
    setForm({ ...blankForm, country_id: String(countries.find((country) => country.name.toLowerCase() === 'india')?.id ?? '') });
    setError(''); setMessage(''); setShowForm(true);
  }

  function startEdit(row: ServiceablePincode) {
    const city = cities.find((item) => item.id === row.city_id);
    const state = states.find((item) => item.id === city?.state_id);
    setEditingPincode(row.pincode);
    setForm({
      pincode: row.pincode,
      country_id: String(state?.country_id ?? countries.find((country) => country.name.toLowerCase() === 'india')?.id ?? ''),
      state_id: String(state?.id ?? ''),
      city_id: String(row.city_id ?? ''),
      notes: row.notes ?? '',
      is_serviceable: row.is_serviceable,
    });
    setError(''); setMessage(''); setShowForm(true);
  }

  async function savePincode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('');
    if (!/^\d{6}$/.test(form.pincode.trim())) { setError('Enter a valid 6-digit Indian PIN code.'); return; }
    setSaving(true);
    try {
      const payload = {
        pincode: form.pincode.trim(),
        is_serviceable: form.is_serviceable,
        city_id: form.city_id ? Number(form.city_id) : null,
        notes: form.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };
      const result = editingPincode
        ? await supabase.from('delivery_serviceable_pincodes').update(payload).eq('pincode', editingPincode)
        : await supabase.from('delivery_serviceable_pincodes').insert(payload);
      if (result.error) throw result.error;
      setMessage(editingPincode ? `PIN code ${form.pincode} updated.` : `PIN code ${form.pincode} added.`);
      setShowForm(false); setEditingPincode(null); setForm(blankForm);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the PIN code.');
    } finally { setSaving(false); }
  }

  async function toggleServiceability(row: ServiceablePincode) {
    setError(''); setMessage('');
    const { error: updateError } = await supabase.from('delivery_serviceable_pincodes').update({ is_serviceable: !row.is_serviceable, updated_at: new Date().toISOString() }).eq('pincode', row.pincode);
    if (updateError) { setError(updateError.message); return; }
    setMessage(`${row.pincode} is now ${row.is_serviceable ? 'disabled' : 'enabled'} for delivery.`);
    await loadData();
  }

  async function deletePincode(row: ServiceablePincode) {
    if (!window.confirm(`Delete PIN code ${row.pincode}? Checkout will block this PIN code unless it is added again.`)) return;
    setError(''); setMessage('');
    const { error: deleteError } = await supabase.from('delivery_serviceable_pincodes').delete().eq('pincode', row.pincode);
    if (deleteError) { setError(deleteError.message); return; }
    setMessage(`PIN code ${row.pincode} deleted.`); await loadData();
  }

  const formStates = states.filter((state) => !form.country_id || state.country_id === Number(form.country_id));
  const formCities = cities.filter((city) => !form.state_id || city.state_id === Number(form.state_id));

  if (authChecking) return <main className="flex min-h-screen items-center justify-center bg-gray-100">Checking admin access...</main>;
  if (!authorized) return <main className="flex min-h-screen items-center justify-center bg-gray-100">Redirecting to login...</main>;

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AdminHeader
        title="Delivery PIN Codes"
        description="Control which Indian PIN codes Fresh Basket delivers to."
      />
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {error && <div role="alert" className="break-words rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"><p className="font-semibold">Something went wrong</p><p className="mt-1 text-sm">{error}</p></div>}
        {message && <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">{message}</div>}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><h2 className="text-xl font-bold">Serviceability overview</h2><p className="mt-1 text-sm text-gray-500">{rows.filter((row) => row.is_serviceable).length} enabled · {rows.filter((row) => !row.is_serviceable).length} disabled · {rows.length} total</p></div>
            <div className="flex flex-wrap gap-3">
              <button onClick={downloadPincodes} disabled={loading || filteredRows.length === 0} className="inline-flex items-center gap-2 rounded-lg border border-green-800 bg-white px-4 py-2 font-semibold text-green-800 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Download CSV
              </button>
              <button onClick={startAdd} className="rounded-lg bg-green-800 px-4 py-2 font-semibold text-white hover:bg-green-700">+ Add PIN Code</button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search PIN code, city, or notes..." className="min-w-60 flex-1 rounded-lg border border-gray-300 px-4 py-2" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2" aria-label="Filter by delivery status"><option value="all">All PIN codes</option><option value="active">Delivery enabled</option><option value="inactive">Delivery disabled</option></select>
            <button onClick={() => void loadData()} disabled={loading} className="rounded-lg border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-50 disabled:opacity-60">{loading ? 'Refreshing...' : 'Refresh'}</button>
          </div>
          {showForm && <form onSubmit={savePincode} className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
            <h3 className="text-lg font-bold">{editingPincode ? `Edit ${editingPincode}` : 'Add delivery PIN code'}</h3>
            <p className="mt-1 text-sm text-gray-600">Only enable PIN codes your store can actually deliver to.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold">PIN code *<input value={form.pincode} onChange={(e) => setForm((current) => ({ ...current, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} disabled={!!editingPincode} inputMode="numeric" maxLength={6} required placeholder="e.g. 560001" className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal disabled:bg-gray-100" /></label>
              <label className="block text-sm font-semibold">Country<select value={form.country_id} onChange={(e) => setForm((current) => ({ ...current, country_id: e.target.value, state_id: '', city_id: '' }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal"><option value="">Choose country</option>{countries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="block text-sm font-semibold">State / Union Territory<select value={form.state_id} onChange={(e) => setForm((current) => ({ ...current, state_id: e.target.value, city_id: '' }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal"><option value="">Choose state</option>{formStates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="block text-sm font-semibold">City<select value={form.city_id} onChange={(e) => setForm((current) => ({ ...current, city_id: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal"><option value="">No city mapping</option>{formCities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="block text-sm font-semibold md:col-span-2">Admin notes (optional)<input value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} maxLength={500} placeholder="e.g. North Bengaluru route" className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal" /></label>
              <label className="flex items-center gap-3 text-sm font-semibold md:col-span-2"><input type="checkbox" checked={form.is_serviceable} onChange={(e) => setForm((current) => ({ ...current, is_serviceable: e.target.checked }))} className="h-4 w-4" /> Delivery is enabled for this PIN code</label>
            </div>
            <div className="mt-5 flex flex-wrap gap-3"><button type="submit" disabled={saving} className="rounded-lg bg-green-800 px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : editingPincode ? 'Save changes' : 'Add PIN code'}</button><button type="button" onClick={() => { setShowForm(false); setEditingPincode(null); setForm(blankForm); }} className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold">Cancel</button></div>
          </form>}
          {loading ? <p className="py-8 text-gray-500">Loading PIN codes...</p> : filteredRows.length === 0 ? <p className="py-8 text-gray-500">No matching PIN codes. Add a PIN code only after confirming delivery coverage.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-500"><tr><th className="px-4 py-3">PIN code</th><th className="px-4 py-3">City</th><th className="px-4 py-3">Notes</th><th className="px-4 py-3">Delivery status</th><th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-gray-100">{filteredRows.map((row) => { const city = cities.find((item) => item.id === row.city_id); const state = states.find((item) => item.id === city?.state_id); return <tr key={row.pincode} className="hover:bg-gray-50"><td className="px-4 py-3 font-bold">{row.pincode}</td><td className="px-4 py-3">{city ? `${city.name}${state ? `, ${state.name}` : ''}` : <span className="text-gray-400">Not mapped</span>}</td><td className="max-w-xs px-4 py-3">{row.notes || '—'}</td><td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${row.is_serviceable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{row.is_serviceable ? 'Enabled' : 'Disabled'}</span></td><td className="px-4 py-3"><div className="flex flex-wrap gap-2"><button onClick={() => startEdit(row)} className="rounded border border-gray-300 px-3 py-1.5 font-semibold hover:bg-white">Edit</button><button onClick={() => void toggleServiceability(row)} className="rounded border border-gray-300 px-3 py-1.5 font-semibold hover:bg-white">{row.is_serviceable ? 'Disable' : 'Enable'}</button><button onClick={() => void deletePincode(row)} className="rounded border border-red-200 px-3 py-1.5 font-semibold text-red-700 hover:bg-red-50">Delete</button></div></td></tr>; })}</tbody></table></div>}
        </section>
        <p className="text-sm text-gray-500">Checkout blocks a PIN code that is missing from the serviceability table or marked disabled. Add only PIN codes you have verified with your delivery coverage.</p>
      </div>
    </main>
  );
}
