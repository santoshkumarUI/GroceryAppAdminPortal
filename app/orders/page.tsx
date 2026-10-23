
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { downloadCsv } from '../../lib/download-csv';
import AdminHeader from '../admin-header';

type Order = {
  id: string;
  order_number: string | null;
  user_id: string;
  address_id: string;
  subtotal: number | string;
  discount: number | string;
  delivery_fee: number | string;
  total: number | string;
  payment_status: string;
  order_status: string;
  created_at: string;
};

type OrderItem = {
  id: string;
  product_name: string;
  product_unit: string;
  quantity: number;
  price: number | string;
  total: number | string;
};

type Address = {
  id: string;
  name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
};

const STATUS_OPTIONS = [
  'placed',
  'confirmed',
  'preparing',
  'packed',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'pending'
];

const money = (value: number | string | null | undefined) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const readable = (value: string | null | undefined) =>
  (value || 'unknown').replace(/_/g, ' ');

const orderDate = (timestamp: string) =>
  new Date(timestamp).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });

const orderTime = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true,
  });

const orderDueDate = (timestamp: string) =>
  new Date(new Date(timestamp).getTime() + 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });

export default function OrdersPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: ordersError } = await supabase
        .from('orders')
        .select(
          'id, order_number, user_id, address_id, subtotal, discount, delivery_fee, total, payment_status, order_status, created_at'
        )
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setOrders((data ?? []) as Order[]);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Unable to load orders.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace('/login');
          return;
        }

        const { data: isAdmin, error: adminError } =
          await supabase.rpc('is_admin');

        if (adminError) throw adminError;

        if (isAdmin !== true) {
          await supabase.auth.signOut();
          router.replace('/login');
          return;
        }

        if (active) {
          setAuthorized(true);
          await loadOrders();
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not verify admin access.'
          );
          router.replace('/login');
        }
      } finally {
        if (active) setAuthChecking(false);
      }
    }

    void checkAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setAuthorized(false);
        router.replace('/login');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, loadOrders]);

  async function openOrder(order: Order) {
    setSelectedOrder(order);
    setItems([]);
    setAddresses([]);
    setError('');
    setMessage('');

    const [
      { data: itemData, error: itemError },
      { data: addressData, error: addressError },
    ] = await Promise.all([
      supabase
        .from('order_items')
        .select('id, product_name, product_unit, quantity, price, total')
        .eq('order_id', order.id),

      supabase
        .from('addresses')
        .select(
          'id, name, phone, address_line1, address_line2, city, state, pincode, landmark'
        )
        .eq('id', order.address_id)
        .limit(1),
    ]);

    if (itemError || addressError) {
      setError(
        itemError?.message ||
          addressError?.message ||
          'Unable to load order details.'
      );
      return;
    }

    setItems((itemData ?? []) as OrderItem[]);
    setAddresses((addressData ?? []) as Address[]);
  }

  async function updateStatus(order: Order, newStatus: string) {
    setUpdatingId(order.id);
    setError('');
    setMessage('');

    try {
      const { data, error: updateError } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', order.id)
        .select(
          'id, order_number, user_id, address_id, subtotal, discount, delivery_fee, total, payment_status, order_status, created_at'
        )
        .single();

      if (updateError) throw updateError;

      setOrders((current) =>
        current.map((entry) => (entry.id === order.id ? (data as Order) : entry))
      );

      setSelectedOrder((current) =>
        current?.id === order.id ? (data as Order) : current
      );

      setMessage(`Order status updated to "${readable(newStatus)}".`);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not update order status.'
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredOrders =
    filter === 'all'
      ? orders
      : orders.filter(
          (order) => order.order_status.toLowerCase() === filter
        );

  function downloadOrders() {
    const rows = filteredOrders.map((order) => [
      order.order_number ?? '',
      order.id,
      order.user_id,
      order.address_id,
      orderDate(order.created_at),
      orderTime(order.created_at),
      orderDueDate(order.created_at),
      order.subtotal,
      order.discount,
      order.delivery_fee,
      order.total,
      order.payment_status,
      readable(order.order_status),
    ]);

    downloadCsv(`fresh-basket-orders-${new Date().toISOString().slice(0, 10)}.csv`, [
      'Order number',
      'Order ID',
      'Customer ID',
      'Address ID',
      'Order date',
      'Order time (IST)',
      'Due date (order date + 1 day)',
      'Subtotal (INR)',
      'Discount (INR)',
      'Delivery fee (INR)',
      'Total (INR)',
      'Payment status',
      'Order status',
    ], rows);
  }

  if (authChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        Checking admin access...
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        Redirecting to login...
      </main>
    );
  }

  const selectedAddress = addresses[0];

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AdminHeader
        title="Order Management"
        description="View customer orders and manage delivery status"
      />

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {error && (
          <div
            role="alert"
            className="break-words rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
          >
            {message}
          </div>
        )}

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Customer Orders</h2>
              <p className="mt-1 text-sm text-gray-500">
                {filteredOrders.length} order(s)
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2"
                aria-label="Filter orders by status"
              >
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {readable(status)}
                  </option>
                ))}
              </select>

              <button
                onClick={downloadOrders}
                disabled={loading || filteredOrders.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-green-800 bg-white px-4 py-2 font-semibold text-green-800 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Download CSV
              </button>

              <button
                onClick={() => void loadOrders()}
                disabled={loading}
                className="rounded-lg bg-green-800 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-gray-500">Loading orders...</p>
          ) : filteredOrders.length === 0 ? (
            <p className="py-8 text-gray-500">No matching orders found.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Due date</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Order status</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold">
                        {order.order_number ?? order.id.slice(0, 8)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                        {orderDate(order.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                        {orderTime(order.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                        {orderDueDate(order.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        {money(order.total)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 capitalize">
                        {readable(order.payment_status)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 capitalize">
                        {readable(order.order_status)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <button
                          onClick={() => void openOrder(order)}
                          className="rounded-lg border border-green-800 px-3 py-2 font-semibold text-green-800 hover:bg-green-50"
                        >
                          View order
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedOrder && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Order details</p>
                <h2 className="mt-1 text-2xl font-bold">
                  {selectedOrder.order_number ?? selectedOrder.id.slice(0, 8)}
                </h2>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50"
              >
                Close details
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-bold">Delivery Address</h3>

                {selectedAddress ? (
                  <div className="mt-3 space-y-1 text-sm text-gray-700">
                    <p className="font-semibold">{selectedAddress.name}</p>
                    <p>{selectedAddress.phone}</p>
                    <p>{selectedAddress.address_line1}</p>
                    {selectedAddress.address_line2 && (
                      <p>{selectedAddress.address_line2}</p>
                    )}
                    <p>
                      {selectedAddress.city}, {selectedAddress.state}
                    </p>
                    <p>PIN: {selectedAddress.pincode}</p>
                    {selectedAddress.landmark && (
                      <p>Landmark: {selectedAddress.landmark}</p>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([
                        selectedAddress.address_line1,
                        selectedAddress.address_line2,
                        selectedAddress.city,
                        selectedAddress.state,
                        selectedAddress.pincode,
                      ].filter(Boolean).join(', '))}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex rounded-lg border border-green-800 px-3 py-2 font-semibold text-green-800 hover:bg-green-50"
                    >
                      📍 Open delivery address in Google Maps
                    </a>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">
                    No delivery address found for this order.
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-bold">Order Summary</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <SummaryRow label="Subtotal" value={money(selectedOrder.subtotal)} />
                  <SummaryRow label="Discount" value={money(selectedOrder.discount)} />
                  <SummaryRow label="Delivery fee" value={money(selectedOrder.delivery_fee)} />
                  <div className="border-t border-gray-200 pt-3">
                    <SummaryRow
                      label="Total"
                      value={money(selectedOrder.total)}
                      strong
                    />
                  </div>
                  <SummaryRow
                    label="Payment"
                    value={readable(selectedOrder.payment_status)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-bold">Ordered Products</h3>

              {items.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">
                  No order items found.
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Quantity</th>
                        <th className="px-4 py-3">Unit price</th>
                        <th className="px-4 py-3">Line total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-xs text-gray-500">
                              {item.product_unit}
                            </p>
                          </td>
                          <td className="px-4 py-3">{item.quantity}</td>
                          <td className="px-4 py-3">{money(item.price)}</td>
                          <td className="px-4 py-3">{money(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <label
                htmlFor="order-status"
                className="mb-2 block font-bold"
              >
                Update Order Status
              </label>

              <div className="flex flex-wrap gap-3">
                <select
                  id="order-status"
                  value={selectedOrder.order_status}
                  disabled={
                    updatingId === selectedOrder.id ||
                    selectedOrder.order_status === 'cancelled'
                  }
                  onChange={(event) =>
                    void updateStatus(selectedOrder, event.target.value)
                  }
                  className="min-w-56 rounded-lg border border-gray-300 bg-white px-3 py-2 capitalize disabled:opacity-60"
                >
                  {!STATUS_OPTIONS.includes(selectedOrder.order_status) && (
                    <option value={selectedOrder.order_status}>
                      {readable(selectedOrder.order_status)}
                    </option>
                  )}

                  {STATUS_OPTIONS.map((status) => (
                    <option
                      key={status}
                      value={status}
                      disabled={
                        status === 'placed' &&
                        selectedOrder.order_status !== 'placed'
                      }
                    >
                      {readable(status)}
                    </option>
                  ))}
                </select>

                {updatingId === selectedOrder.id && (
                  <p className="self-center text-sm text-gray-500">
                    Updating status...
                  </p>
                )}
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Status updates are saved to Supabase immediately.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className={strong ? 'font-bold' : 'text-gray-600'}>
        {label}
      </span>
      <span className={strong ? 'font-bold' : ''}>{value}</span>
    </div>
  );
}
