
// 'use client';

// import { useEffect, useState } from 'react';
// import { supabase } from '../lib/supabase';

// type Order = {
//   id: string;
//   order_number: string | null;
//   total: number;
//   order_status: string;
//   payment_status: string;
//   created_at: string;
// };

// type DashboardStats = {
//   totalOrders: number;
//   totalSales: number;
//   pendingOrders: number;
//   totalProducts: number;
// };

// export default function AdminDashboard() {
//   const [stats, setStats] = useState<DashboardStats>({
//     totalOrders: 0,
//     totalSales: 0,
//     pendingOrders: 0,
//     totalProducts: 0,
//   });

//   const [recentOrders, setRecentOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     async function loadDashboard() {
//       setLoading(true);
//       setError('');

//       try {
//         const [
//           { data: orders, error: ordersError },
//           { count: productCount, error: productsError },
//         ] = await Promise.all([
//           supabase
//             .from('orders')
//             .select(
//               'id, order_number, total, order_status, payment_status, created_at'
//             )
//             .order('created_at', { ascending: false }),

//           supabase
//             .from('products')
//             .select('id', { count: 'exact', head: true }),
//         ]);

//         if (ordersError) throw ordersError;
//         if (productsError) throw productsError;

//         const orderList = (orders ?? []) as Order[];

//         const pending = orderList.filter((order) => {
//           const status = order.order_status.toLowerCase();
//           return !['delivered', 'cancelled', 'canceled'].includes(
//             status
//           );
//         }).length;

//         setStats({
//           totalOrders: orderList.length,
//           totalSales: orderList.reduce(
//             (sum, order) => sum + Number(order.total || 0),
//             0
//           ),
//           pendingOrders: pending,
//           totalProducts: productCount ?? 0,
//         });

//         setRecentOrders(orderList.slice(0, 5));
//       } catch (err) {
//         console.error('Dashboard loading error:', err);

//         setError(
//           err instanceof Error
//             ? err.message
//             : 'Could not load dashboard data.'
//         );
//       } finally {
//         setLoading(false);
//       }
//     }

//     void loadDashboard();
//   }, []);

//   const cards = [
//     {
//       title: 'Total Orders',
//       value: stats.totalOrders.toString(),
//       icon: '📦',
//     },
//     {
//       title: 'Total Sales',
//       value: `₹${stats.totalSales.toLocaleString('en-IN', {
//         maximumFractionDigits: 2,
//       })}`,
//       icon: '💰',
//     },
//     {
//       title: 'Pending Orders',
//       value: stats.pendingOrders.toString(),
//       icon: '🚚',
//     },
//     {
//       title: 'Total Products',
//       value: stats.totalProducts.toString(),
//       icon: '🛒',
//     },
//   ];

//   return (
//     <main className="min-h-screen bg-gray-100 text-gray-900">
//       <header className="bg-green-800 px-6 py-6 text-white shadow">
//         <div className="mx-auto max-w-7xl">
//           <p className="text-sm text-green-100">
//             Grocery Store Management
//           </p>
//           <h1 className="mt-1 text-3xl font-bold">
//             Admin Dashboard
//           </h1>
//           <p className="mt-2 text-sm text-green-100">
//             Overview of your grocery business
//           </p>
//         </div>
//       </header>

//       <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
//         {error && (
//           <div
//             role="alert"
//             className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
//           >
//             <p className="font-semibold">
//               Unable to load dashboard
//             </p>
//             <p className="mt-1 break-words text-sm">{error}</p>
//             <p className="mt-2 text-sm">
//               Check your Supabase credentials, table names, and
//               Row Level Security policies.
//             </p>
//           </div>
//         )}

//         <section>
//           <h2 className="mb-4 text-xl font-bold">
//             Business Overview
//           </h2>

//           <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
//             {cards.map((card) => (
//               <div
//                 key={card.title}
//                 className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
//               >
//                 <div className="flex items-center justify-between">
//                   <p className="text-sm font-medium text-gray-500">
//                     {card.title}
//                   </p>
//                   <span className="text-2xl">
//                     {card.icon}
//                   </span>
//                 </div>

//                 <p className="mt-4 text-3xl font-bold">
//                   {loading ? '—' : card.value}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </section>

//         <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
//           <div className="border-b border-gray-200 px-6 py-5">
//             <h2 className="text-xl font-bold">
//               Recent Orders
//             </h2>
//             <p className="mt-1 text-sm text-gray-500">
//               The five most recent orders visible to this session
//             </p>
//           </div>

//           {loading ? (
//             <p className="p-6 text-gray-500">
//               Loading orders...
//             </p>
//           ) : recentOrders.length === 0 ? (
//             <p className="p-6 text-gray-500">
//               No orders found, or the current session cannot
//               access any orders.
//             </p>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full text-left text-sm">
//                 <thead className="bg-gray-50 text-gray-500">
//                   <tr>
//                     <th className="px-6 py-4 font-semibold">
//                       Order Number
//                     </th>
//                     <th className="px-6 py-4 font-semibold">
//                       Date
//                     </th>
//                     <th className="px-6 py-4 font-semibold">
//                       Amount
//                     </th>
//                     <th className="px-6 py-4 font-semibold">
//                       Status
//                     </th>
//                   </tr>
//                 </thead>

//                 <tbody className="divide-y divide-gray-100">
//                   {recentOrders.map((order) => (
//                     <tr key={order.id}>
//                       <td className="whitespace-nowrap px-6 py-4 font-medium">
//                         {order.order_number ?? order.id.slice(0, 8)}
//                       </td>
//                       <td className="whitespace-nowrap px-6 py-4 text-gray-600">
//                         {new Date(
//                           order.created_at
//                         ).toLocaleDateString('en-IN')}
//                       </td>
//                       <td className="whitespace-nowrap px-6 py-4">
//                         ₹{Number(order.total).toFixed(2)}
//                       </td>
//                       <td className="whitespace-nowrap px-6 py-4">
//                         <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
//                           {order.order_status.replace(/_/g, ' ')}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </section>

//         <p className="text-sm text-gray-500">
//           Admin access control must be configured before using this
//           dashboard for business operations.
//         </p>
//       </div>
//     </main>
//   );
// }



// 'use client';

// import { useCallback, useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { supabase } from '@/lib/supabase';

// type Order = {
//   id: string;
//   order_number: string | null;
//   total: number | string;
//   order_status: string;
//   payment_status: string;
//   created_at: string;
// };

// type DashboardStats = {
//   totalOrders: number;
//   totalSales: number;
//   pendingOrders: number;
//   totalProducts: number;
// };

// const initialStats: DashboardStats = {
//   totalOrders: 0,
//   totalSales: 0,
//   pendingOrders: 0,
//   totalProducts: 0,
// };

// const currency = (amount: number) =>
//   new Intl.NumberFormat('en-IN', {
//     style: 'currency',
//     currency: 'INR',
//     maximumFractionDigits: 2,
//   }).format(amount);

// export default function DashboardPage() {
//   const router = useRouter();

//   const [authChecking, setAuthChecking] = useState(true);
//   const [isAuthorized, setIsAuthorized] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [signingOut, setSigningOut] = useState(false);
//   const [error, setError] = useState('');
//   const [stats, setStats] = useState<DashboardStats>(initialStats);
//   const [recentOrders, setRecentOrders] = useState<Order[]>([]);

//   const loadDashboard = useCallback(async () => {
//     setLoading(true);
//     setError('');

//     try {
//       const [
//         { data: orders, error: ordersError, count: orderCount },
//         { data: products, error: productsError, count: productCount },
//       ] = await Promise.all([
//         supabase
//           .from('orders')
//           .select(
//             'id, order_number, total, order_status, payment_status, created_at',
//             { count: 'exact' }
//           )
//           .order('created_at', { ascending: false })
//           .limit(10),

//         supabase
//           .from('products')
//           .select('id', { count: 'exact', head: true }),
//       ]);

//       if (ordersError) throw ordersError;
//       if (productsError) throw productsError;

//       const orderList = (orders ?? []) as Order[];

//       const { data: allOrderTotals, error: totalsError } =
//         await supabase
//           .from('orders')
//           .select('total, payment_status, order_status');

//       if (totalsError) throw totalsError;

//       const allOrders = allOrderTotals ?? [];

//       const totalSales = allOrders.reduce((sum, order) => {
//         const status = String(order.order_status ?? '').toLowerCase();
//         const paymentStatus = String(
//           order.payment_status ?? ''
//         ).toLowerCase();

//         // Exclude cancelled orders and unpaid orders from sales.
//         if (
//           status === 'cancelled' ||
//           status === 'canceled' ||
//           paymentStatus === 'pending' ||
//           paymentStatus === 'failed'
//         ) {
//           return sum;
//         }

//         return sum + Number(order.total || 0);
//       }, 0);

//       const pendingOrders = allOrders.filter((order) => {
//         const status = String(order.order_status ?? '').toLowerCase();
//         return status === 'pending';
//       }).length;

//       setStats({
//         totalOrders: orderCount ?? 0,
//         totalSales,
//         pendingOrders,
//         totalProducts: productCount ?? 0,
//       });

//       setRecentOrders(orderList);
//     } catch (err: unknown) {
//       setError(
//         err instanceof Error
//           ? err.message
//           : 'Unable to load dashboard data.'
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     let active = true;

//     async function checkAdminAccess() {
//       try {
//         const {
//           data: { user },
//           error: userError,
//         } = await supabase.auth.getUser();

//         if (userError || !user) {
//           router.replace('/login');
//           return;
//         }

//         const { data: isAdmin, error: adminError } =
//           await supabase.rpc('is_admin');

//         if (adminError || isAdmin !== true) {
//           await supabase.auth.signOut();

//           if (active) {
//             router.replace('/login');
//           }
//           return;
//         }

//         if (active) {
//           setIsAuthorized(true);
//           await loadDashboard();
//         }
//       } catch {
//         if (active) {
//           router.replace('/login');
//         }
//       } finally {
//         if (active) {
//           setAuthChecking(false);
//         }
//       }
//     }

//     checkAdminAccess();

//     // Recheck the session when authentication changes.
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((event, session) => {
//       if (event === 'SIGNED_OUT' || !session) {
//         setIsAuthorized(false);
//         router.replace('/login');
//       }
//     });

//     return () => {
//       active = false;
//       subscription.unsubscribe();
//     };
//   }, [router, loadDashboard]);

//   async function handleLogout() {
//     setSigningOut(true);
//     setError('');

//     const { error: logoutError } = await supabase.auth.signOut();

//     if (logoutError) {
//       setError(logoutError.message);
//       setSigningOut(false);
//       return;
//     }

//     router.replace('/login');
//     router.refresh();
//   }

//   if (authChecking) {
//     return (
//       <main style={styles.center}>
//         <p>Checking admin access...</p>
//       </main>
//     );
//   }

//   if (!isAuthorized) {
//     return (
//       <main style={styles.center}>
//         <p>Redirecting to login...</p>
//       </main>
//     );
//   }

//   return (
//     <main style={styles.page}>
//       <header style={styles.header}>
//         <div>
//           <h1 style={styles.title}>Grocery Admin</h1>
//           <p style={styles.subtitle}>
//             Manage your grocery store
//           </p>
//         </div>

//         <button
//           onClick={handleLogout}
//           disabled={signingOut}
//           style={styles.logoutButton}
//         >
//           {signingOut ? 'Signing out...' : 'Logout'}
//         </button>
//       </header>

//       {error && (
//         <div style={styles.error}>
//           <strong>Something went wrong:</strong> {error}
//         </div>
//       )}

//       <section style={styles.statsGrid}>
//         <StatCard
//           title="Total Orders"
//           value={stats.totalOrders.toLocaleString('en-IN')}
//           description="All orders"
//         />

//         <StatCard
//           title="Total Sales"
//           value={currency(stats.totalSales)}
//           description="Excludes cancelled and unpaid orders"
//         />

//         <StatCard
//           title="Pending Orders"
//           value={stats.pendingOrders.toLocaleString('en-IN')}
//           description="Awaiting processing"
//         />

//         <StatCard
//           title="Total Products"
//           value={stats.totalProducts.toLocaleString('en-IN')}
//           description="Products in your catalog"
//         />
//       </section>

//       <section style={styles.panel}>
//         <div style={styles.panelHeader}>
//           <div>
//             <h2 style={styles.sectionTitle}>Recent Orders</h2>
//             <p style={styles.subtitle}>
//               The latest orders from your customers
//             </p>
//           </div>

//           <button
//             onClick={loadDashboard}
//             disabled={loading}
//             style={styles.refreshButton}
//           >
//             {loading ? 'Refreshing...' : 'Refresh'}
//           </button>
//         </div>

//         {loading && recentOrders.length === 0 ? (
//           <p style={styles.message}>Loading orders...</p>
//         ) : recentOrders.length === 0 ? (
//           <p style={styles.message}>
//             No orders found.
//           </p>
//         ) : (
//           <div style={styles.tableWrapper}>
//             <table style={styles.table}>
//               <thead>
//                 <tr>
//                   <th style={styles.th}>Order Number</th>
//                   <th style={styles.th}>Date</th>
//                   <th style={styles.th}>Total</th>
//                   <th style={styles.th}>Payment</th>
//                   <th style={styles.th}>Order Status</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {recentOrders.map((order) => (
//                   <tr key={order.id}>
//                     <td style={styles.td}>
//                       {order.order_number || order.id.slice(0, 8)}
//                     </td>
//                     <td style={styles.td}>
//                       {order.created_at
//                         ? new Date(order.created_at).toLocaleString(
//                             'en-IN'
//                           )
//                         : '—'}
//                     </td>
//                     <td style={styles.td}>
//                       {currency(Number(order.total || 0))}
//                     </td>
//                     <td style={styles.td}>
//                       <StatusBadge
//                         value={order.payment_status || 'unknown'}
//                       />
//                     </td>
//                     <td style={styles.td}>
//                       <StatusBadge
//                         value={order.order_status || 'unknown'}
//                       />
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </section>

//       <p style={styles.footer}>
//         Grocery Admin Dashboard
//       </p>
//     </main>
//   );
// }

// function StatCard({
//   title,
//   value,
//   description,
// }: {
//   title: string;
//   value: string;
//   description: string;
// }) {
//   return (
//     <article style={styles.statCard}>
//       <p style={styles.statTitle}>{title}</p>
//       <h2 style={styles.statValue}>{value}</h2>
//       <p style={styles.statDescription}>{description}</p>
//     </article>
//   );
// }

// function StatusBadge({ value }: { value: string }) {
//   return (
//     <span style={styles.badge}>
//       {value.replace(/_/g, ' ')}
//     </span>
//   );
// }

// const styles: Record<string, React.CSSProperties> = {
//   page: {
//     minHeight: '100vh',
//     padding: '32px',
//     background: '#f3f4f6',
//     color: '#111827',
//     fontFamily: 'Arial, sans-serif',
//   },
//   center: {
//     minHeight: '100vh',
//     display: 'grid',
//     placeItems: 'center',
//     fontFamily: 'Arial, sans-serif',
//   },
//   header: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     gap: 16,
//     flexWrap: 'wrap',
//     marginBottom: 32,
//   },
//   title: {
//     fontSize: 30,
//     fontWeight: 700,
//     margin: 0,
//   },
//   subtitle: {
//     color: '#6b7280',
//     marginTop: 8,
//     marginBottom: 0,
//   },
//   logoutButton: {
//     background: '#dc2626',
//     color: '#fff',
//     border: 0,
//     padding: '11px 18px',
//     borderRadius: 7,
//     cursor: 'pointer',
//   },
//   statsGrid: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
//     gap: 20,
//     marginBottom: 32,
//   },
//   statCard: {
//     background: '#fff',
//     padding: 24,
//     borderRadius: 12,
//     border: '1px solid #e5e7eb',
//     boxShadow: '0 2px 8px #00000008',
//   },
//   statTitle: {
//     color: '#6b7280',
//     fontSize: 14,
//     margin: 0,
//   },
//   statValue: {
//     fontSize: 27,
//     fontWeight: 700,
//     margin: '14px 0',
//     overflowWrap: 'anywhere',
//   },
//   statDescription: {
//     color: '#6b7280',
//     fontSize: 12,
//     margin: 0,
//   },
//   panel: {
//     background: '#fff',
//     padding: 24,
//     borderRadius: 12,
//     border: '1px solid #e5e7eb',
//   },
//   panelHeader: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     gap: 16,
//     flexWrap: 'wrap',
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 21,
//     margin: 0,
//   },
//   refreshButton: {
//     border: '1px solid #d1d5db',
//     background: '#fff',
//     borderRadius: 7,
//     padding: '10px 14px',
//     cursor: 'pointer',
//   },
//   tableWrapper: {
//     width: '100%',
//     overflowX: 'auto',
//   },
//   table: {
//     width: '100%',
//     borderCollapse: 'collapse',
//     textAlign: 'left',
//     fontSize: 14,
//   },
//   th: {
//     padding: '14px 12px',
//     borderBottom: '1px solid #e5e7eb',
//     color: '#6b7280',
//     whiteSpace: 'nowrap',
//   },
//   td: {
//     padding: '16px 12px',
//     borderBottom: '1px solid #f3f4f6',
//     whiteSpace: 'nowrap',
//   },
//   badge: {
//     display: 'inline-block',
//     padding: '5px 9px',
//     borderRadius: 20,
//     background: '#f3f4f6',
//     color: '#374151',
//     fontSize: 12,
//     textTransform: 'capitalize',
//   },
//   message: {
//     color: '#6b7280',
//     padding: '20px 0',
//   },
//   error: {
//     background: '#fef2f2',
//     color: '#b91c1c',
//     padding: 16,
//     borderRadius: 8,
//     marginBottom: 24,
//     overflowWrap: 'anywhere',
//   },
//   footer: {
//     textAlign: 'center',
//     color: '#9ca3af',
//     fontSize: 12,
//     marginTop: 32,
//   },
// };



//latest 


'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

type Order = {
  id: string;
  order_number: string | null;
  total: number;
  order_status: string;
  payment_status: string;
  created_at: string;
};

type DashboardStats = {
  totalOrders: number;
  totalSales: number;
  pendingOrders: number;
  totalProducts: number;
};

export default function AdminDashboard() {
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
    totalProducts: 0,
  });

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [
        { data: orders, error: ordersError },
        { count: productCount, error: productsError },
      ] = await Promise.all([
        supabase
          .from('orders')
          .select(
            'id, order_number, total, order_status, payment_status, created_at'
          )
          .order('created_at', { ascending: false }),

        supabase
          .from('products')
          .select('id', { count: 'exact', head: true }),
      ]);

      if (ordersError) throw ordersError;
      if (productsError) throw productsError;

      const orderList = (orders ?? []) as Order[];

      const pending = orderList.filter((order) => {
        const status = (order.order_status ?? '').toLowerCase();

        return !['delivered', 'cancelled', 'canceled'].includes(
          status
        );
      }).length;

      // Count all non-cancelled orders, including COD orders
      // whose payment_status is still pending.
      const sales = orderList.reduce((sum, order) => {
        const status = (order.order_status ?? '').toLowerCase();

        if (['cancelled', 'canceled'].includes(status)) {
          return sum;
        }

        return sum + Number(order.total || 0);
      }, 0);

      setStats({
        totalOrders: orderList.length,
        totalSales: sales,
        pendingOrders: pending,
        totalProducts: productCount ?? 0,
      });

      setRecentOrders(orderList.slice(0, 5));
    } catch (err: unknown) {
      console.error('Dashboard loading error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Could not load dashboard data.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify the signed-in user and admin permission before
  // loading any dashboard data.
  useEffect(() => {
    let active = true;

    async function checkAdminAccess() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace('/login');
          return;
        }

        const { data: admin, error: adminError } =
          await supabase.rpc('is_admin');

        if (adminError) {
          throw adminError;
        }

        if (admin !== true) {
          await supabase.auth.signOut();
          router.replace('/login');
          return;
        }

        if (!active) return;

        setIsAuthorized(true);
        await loadDashboard();
      } catch (err: unknown) {
        console.error('Admin authorization error:', err);

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to verify admin access.'
          );

          router.replace('/login');
        }
      } finally {
        if (active) {
          setAuthChecking(false);
        }
      }
    }

    void checkAdminAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthorized(false);
        router.replace('/login');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, loadDashboard]);

  async function handleLogout() {
    setSigningOut(true);

    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
      setSigningOut(false);
      return;
    }

    router.replace('/login');
    router.refresh();
  }

  // Avoid showing dashboard content while authentication is checked.
  if (authChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-700">
        Checking admin access...
      </main>
    );
  }

  if (!isAuthorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-700">
        Redirecting to login...
      </main>
    );
  }

  const cards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: '📦',
    },
    {
      title: 'Total Sales',
      value: `₹${stats.totalSales.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
      })}`,
      icon: '💰',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders.toString(),
      icon: '🚚',
    },
    {
      title: 'Total Products',
      value: stats.totalProducts.toString(),
      icon: '🛒',
    },
  ];

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-green-800 px-6 py-6 text-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-sm text-green-100">
              Grocery Store Management
            </p>
            <h1 className="mt-1 text-3xl font-bold">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-sm text-green-100">
              Overview of your grocery business
            </p>
          </div>
          <a
          href="/orders"
          className="rounded-lg bg-white px-4 py-2 font-semibold text-green-800 hover:bg-green-50"
        >
          Manage Orders
        </a>
          <button
            onClick={handleLogout}
            disabled={signingOut}
            className="rounded-lg bg-white px-4 py-2 font-semibold text-green-800 hover:bg-green-50 disabled:opacity-60"
          >
            {signingOut ? 'Signing out...' : 'Logout'}
          </button>
        </div>
                


      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
          >
            <p className="font-semibold">
              Unable to load dashboard
            </p>
            <p className="mt-1 break-words text-sm">{error}</p>
            <p className="mt-2 text-sm">
              Check your Supabase credentials, table names, and
              Row Level Security policies.
            </p>
          </div>
        )}

        <section>
          <h2 className="mb-4 text-xl font-bold">
            Business Overview
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">
                    {card.title}
                  </p>
                  <span className="text-2xl">{card.icon}</span>
                </div>

                <p className="mt-4 text-3xl font-bold">
                  {loading ? '—' : card.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold">Recent Orders</h2>
              <p className="mt-1 text-sm text-gray-500">
                The five most recent orders visible to this session
              </p>
            </div>

            <button
              onClick={() => void loadDashboard()}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <p className="p-6 text-gray-500">Loading orders...</p>
          ) : recentOrders.length === 0 ? (
            <p className="p-6 text-gray-500">
              No orders found, or the current session cannot
              access any orders.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">
                      Order Number
                    </th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">
                      Amount
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="whitespace-nowrap px-6 py-4 font-medium">
                        {order.order_number ?? order.id.slice(0, 8)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                        {new Date(
                          order.created_at
                        ).toLocaleDateString('en-IN')}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        ₹{Number(order.total || 0).toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                          {(order.order_status || 'unknown').replace(
                            /_/g,
                            ' '
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-sm text-gray-500">
          Admin access is verified through Supabase authentication
          and the is_admin() database function.
        </p>
      </div>
    </main>
  );
}

