
// 'use client';

// import { useCallback, useEffect, useState, useRef } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { supabase } from '../../lib/supabase';

// type Category = {
//     id: string;
//     name: string;
//     is_active: boolean;
//     sort_order: number;
// };

// type Product = {
//     id: string;
//     category_id: string | null;
//     name: string;
//     description: string | null;
//     sku: string | null;
//     unit: string;
//     price: number | string;
//     mrp: number | string;
//     stock_quantity: number;
//     image_url: string | null;
//     is_active: boolean;
//     is_featured: boolean;
//     created_at: string;
//     updated_at: string;
// };

// type ProductForm = {
//     category_id: string;
//     name: string;
//     description: string;
//     sku: string;
//     unit: string;
//     price: string;
//     mrp: string;
//     stock_quantity: string;
//     image_url: string;
//     is_active: boolean;
//     is_featured: boolean;
// };

// const emptyForm: ProductForm = {
//     category_id: '',
//     name: '',
//     description: '',
//     sku: '',
//     unit: 'piece',
//     price: '',
//     mrp: '',
//     stock_quantity: '0',
//     image_url: '',
//     is_active: true,
//     is_featured: false,
// };

// const money = (value: number | string) =>
//     `₹${Number(value || 0).toLocaleString('en-IN', {
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2,
//     })}`;


// const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

// async function uploadProductImage(file: File): Promise<string> {
//     if (!file.type.startsWith('image/')) {
//         throw new Error('Please select an image file.');
//     }

//     if (file.size > MAX_IMAGE_SIZE) {
//         throw new Error('Image must be 5 MB or smaller.');
//     }

//     const extensions: Record<string, string> = {
//         'image/jpeg': 'jpg',
//         'image/png': 'png',
//         'image/webp': 'webp',
//         'image/gif': 'gif',
//         'image/avif': 'avif',
//     };

//     const extension = extensions[file.type];

//     if (!extension) {
//         throw new Error('Please use JPG, PNG, WebP, GIF, or AVIF.');
//     }

//     const filePath = `products/${crypto.randomUUID()}.${extension}`;

//     const { data, error } = await supabase.storage
//         .from('product-image')
//         .upload(filePath, file, {
//             cacheControl: '3600',
//             contentType: file.type,
//             upsert: false,
//         });

//     if (error) {
//         console.error('Image upload failed:', error);
//         throw new Error(`Image upload failed: ${error.message}`);
//     }

//     const { data: publicData } = supabase.storage
//         .from('product-image')
//         .getPublicUrl(data.path);

//     console.log('Uploaded file:', data.path);
//     console.log('Public image URL:', publicData.publicUrl);

//     return publicData.publicUrl;
// }



// export default function ProductsPage() {
//     const router = useRouter();

//     const [authorized, setAuthorized] = useState(false);
//     const [authChecking, setAuthChecking] = useState(true);
//     const [products, setProducts] = useState<Product[]>([]);
//     const [categories, setCategories] = useState<Category[]>([]);
//     const [loading, setLoading] = useState(false);
//     const [saving, setSaving] = useState(false);
//     const [error, setError] = useState('');
//     const [message, setMessage] = useState('');
//     const [search, setSearch] = useState('');
//     const [activeFilter, setActiveFilter] = useState('all');
//     const [showForm, setShowForm] = useState(false);
//     const [editingId, setEditingId] = useState<string | null>(null);
//     const [form, setForm] = useState<ProductForm>(emptyForm);
//     const [selectedImage, setSelectedImage] = useState<File | null>(null);
//     const [imagePreview, setImagePreview] = useState('');
//     const [uploadingImage, setUploadingImage] = useState(false);
//     const fileInputRef = useRef<HTMLInputElement>(null);

//     const loadData = useCallback(async () => {
//         setLoading(true);
//         setError('');

//         try {
//             const [
//                 { data: productData, error: productError },
//                 { data: categoryData, error: categoryError },
//             ] = await Promise.all([
//                 supabase
//                     .from('products')
//                     .select(
//                         'id, category_id, name, description, sku, unit, price, mrp, stock_quantity, image_url, is_active, is_featured, created_at, updated_at'
//                     )
//                     .order('created_at', { ascending: false }),

//                 supabase
//                     .from('categories')
//                     .select('id, name, is_active, sort_order')
//                     .order('sort_order', { ascending: true }),
//             ]);

//             if (productError) throw productError;
//             if (categoryError) throw categoryError;

//             setProducts((productData ?? []) as Product[]);
//             setCategories((categoryData ?? []) as Category[]);
//         } catch (err: unknown) {
//             setError(
//                 err instanceof Error
//                     ? err.message
//                     : 'Unable to load products.'
//             );
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     useEffect(() => {
//         let active = true;

//         async function checkAccess() {
//             try {
//                 const {
//                     data: { user },
//                     error: userError,
//                 } = await supabase.auth.getUser();

//                 if (userError || !user) {
//                     router.replace('/login');
//                     return;
//                 }

//                 const { data: isAdmin, error: adminError } =
//                     await supabase.rpc('is_admin');

//                 if (adminError) throw adminError;

//                 if (isAdmin !== true) {
//                     await supabase.auth.signOut();
//                     router.replace('/login');
//                     return;
//                 }

//                 if (active) {
//                     setAuthorized(true);
//                     await loadData();
//                 }
//             } catch (err: unknown) {
//                 if (active) {
//                     setError(
//                         err instanceof Error
//                             ? err.message
//                             : 'Could not verify admin access.'
//                     );
//                     router.replace('/login');
//                 }
//             } finally {
//                 if (active) setAuthChecking(false);
//             }
//         }

//         void checkAccess();

//         const {
//             data: { subscription },
//         } = supabase.auth.onAuthStateChange((event) => {
//             if (event === 'SIGNED_OUT') {
//                 setAuthorized(false);
//                 router.replace('/login');
//             }
//         });

//         return () => {
//             active = false;
//             subscription.unsubscribe();
//         };
//     }, [router, loadData]);

//     function startAdd() {
//         setEditingId(null);
//         setForm({
//             ...emptyForm,
//             category_id: categories.find((category) => category.is_active)?.id ?? '',
//         });
//         setError('');
//         setMessage('');
//         setSelectedImage(null);
//         setImagePreview('');
//         setShowForm(true);
//     }

//     function startEdit(product: Product) {
//         setEditingId(product.id);
//         setForm({
//             category_id: product.category_id ?? '',
//             name: product.name,
//             description: product.description ?? '',
//             sku: product.sku ?? '',
//             unit: product.unit,
//             price: String(product.price ?? ''),
//             mrp: String(product.mrp ?? ''),
//             stock_quantity: String(product.stock_quantity ?? 0),
//             image_url: product.image_url ?? '',
//             is_active: product.is_active,
//             is_featured: product.is_featured,
//         });
//         setError('');
//         setMessage('');
//         setSelectedImage(null);
//         setImagePreview(product.image_url ?? '');
//         setShowForm(true);
//     }


//     function handleImageChange(file: File | null) {
//         setSelectedImage(file);

//         if (imagePreview.startsWith('blob:')) {
//             URL.revokeObjectURL(imagePreview);
//         }

//         setImagePreview(file ? URL.createObjectURL(file) : form.image_url);
//     }


//     function updateField<K extends keyof ProductForm>(
//         field: K,
//         value: ProductForm[K]
//     ) {
//         setForm((current) => ({ ...current, [field]: value }));
//     }

//     async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
//         event.preventDefault();
//         setSaving(true);
//         setError('');
//         setMessage('');

//         try {
//             const price = Number(form.price);
//             const mrp = Number(form.mrp);
//             const stock = Number(form.stock_quantity);

//             if (!form.name.trim()) {
//                 throw new Error('Please enter a product name.');
//             }

//             if (!form.category_id) {
//                 throw new Error('Please select a category.');
//             }

//             if (!form.unit.trim()) {
//                 throw new Error('Please enter the product unit.');
//             }

//             if (!Number.isFinite(price) || price < 0) {
//                 throw new Error('Price must be a valid non-negative number.');
//             }

//             if (!Number.isFinite(mrp) || mrp < 0) {
//                 throw new Error('MRP must be a valid non-negative number.');
//             }

//             if (mrp < price) {
//                 throw new Error('MRP should be greater than or equal to the selling price.');
//             }

//             if (!Number.isInteger(stock) || stock < 0) {
//                 throw new Error('Stock quantity must be a non-negative whole number.');
//             }


//             let finalImageUrl = form.image_url.trim() || null;

//             if (selectedImage) {
//                 setUploadingImage(true);

//                 try {
//                     finalImageUrl = await uploadProductImage(selectedImage);
//                 } finally {
//                     setUploadingImage(false);
//                 }
//             }

//             const payload = {
//                 category_id: form.category_id,
//                 name: form.name.trim(),
//                 description: form.description.trim() || null,
//                 sku: form.sku.trim() || null,
//                 unit: form.unit.trim(),
//                 price,
//                 mrp,
//                 stock_quantity: stock,
//                 image_url: finalImageUrl,
//                 is_active: form.is_active,
//                 is_featured: form.is_featured,
//                 updated_at: new Date().toISOString(),
//             };


//             if (editingId) {
//                 const { error: updateError } = await supabase
//                     .from('products')
//                     .update(payload)
//                     .eq('id', editingId);

//                 if (updateError) throw updateError;
//                 setMessage('Product updated successfully.');
//             } else {
//                 const { error: insertError } = await supabase
//                     .from('products')
//                     .insert(payload);

//                 if (insertError) throw insertError;
//                 setMessage('Product added successfully.');
//             }


//             if (imagePreview.startsWith('blob:')) {
//                 URL.revokeObjectURL(imagePreview);
//             }

//             setSelectedImage(null);
//             setImagePreview('');
//             if (fileInputRef.current) {
//                 fileInputRef.current.value = '';
//             }

//             setShowForm(false);
//             setEditingId(null);
//             setForm(emptyForm);

//             await loadData();

//         } catch (err: unknown) {
//             setError(
//                 err instanceof Error
//                     ? err.message
//                     : 'Unable to save product.'
//             );
//         } finally {
//             setSaving(false);
//         }
//     }

//     async function toggleActive(product: Product) {
//         setError('');
//         setMessage('');

//         const { error: updateError } = await supabase
//             .from('products')
//             .update({
//                 is_active: !product.is_active,
//                 updated_at: new Date().toISOString(),
//             })
//             .eq('id', product.id);

//         if (updateError) {
//             setError(updateError.message);
//             return;
//         }

//         setMessage(
//             product.is_active
//                 ? 'Product deactivated.'
//                 : 'Product activated.'
//         );

//         await loadData();
//     }

//     async function toggleFeatured(product: Product) {
//         setError('');
//         setMessage('');

//         const { error: updateError } = await supabase
//             .from('products')
//             .update({
//                 is_featured: !product.is_featured,
//                 updated_at: new Date().toISOString(),
//             })
//             .eq('id', product.id);

//         if (updateError) {
//             setError(updateError.message);
//             return;
//         }

//         setMessage(
//             product.is_featured
//                 ? 'Product removed from featured items.'
//                 : 'Product marked as featured.'
//         );

//         await loadData();
//     }

//     async function deleteProduct(product: Product) {
//         const confirmed = window.confirm(
//             `Delete "${product.name}"? If an order references this product, deletion may be blocked. Deactivating it is safer if it has been sold.`
//         );

//         if (!confirmed) return;

//         setError('');
//         setMessage('');

//         const { error: deleteError } = await supabase
//             .from('products')
//             .delete()
//             .eq('id', product.id);

//         if (deleteError) {
//             setError(
//                 `Could not delete this product. It may be referenced by existing orders. Consider deactivating it instead. Details: ${deleteError.message}`
//             );
//             return;
//         }

//         setMessage('Product deleted successfully.');
//         await loadData();
//     }

//     const filteredProducts = products.filter((product) => {
//         const term = search.trim().toLowerCase();

//         const matchesSearch =
//             !term ||
//             product.name.toLowerCase().includes(term) ||
//             (product.sku ?? '').toLowerCase().includes(term);

//         const matchesStatus =
//             activeFilter === 'all' ||
//             (activeFilter === 'active' && product.is_active) ||
//             (activeFilter === 'inactive' && !product.is_active);

//         return matchesSearch && matchesStatus;
//     });

//     if (authChecking) {
//         return (
//             <main className="flex min-h-screen items-center justify-center bg-gray-100">
//                 Checking admin access...
//             </main>
//         );
//     }

//     if (!authorized) {
//         return (
//             <main className="flex min-h-screen items-center justify-center bg-gray-100">
//                 Redirecting to login...
//             </main>
//         );
//     }

//     const activeCategories = categories.filter((category) => category.is_active);

//     return (
//         <main className="min-h-screen bg-gray-100 text-gray-900">
//             <header className="bg-green-800 px-6 py-6 text-white shadow">
//                 <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
//                     <div>
//                         <p className="text-sm text-green-100">
//                             Grocery Store Management
//                         </p>
//                         <h1 className="mt-1 text-3xl font-bold">
//                             Product Management
//                         </h1>
//                         <p className="mt-2 text-sm text-green-100">
//                             Manage products, prices, stock, and categories
//                         </p>
//                     </div>

//                     <Link
//                         href="/"
//                         className="rounded-lg bg-white px-4 py-2 font-semibold text-green-800 hover:bg-green-50"
//                     >
//                         Back to Dashboard
//                     </Link>
//                 </div>
//             </header>

//             <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
//                 {error && (
//                     <div
//                         role="alert"
//                         className="break-words rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
//                     >
//                         <p className="font-semibold">Something went wrong</p>
//                         <p className="mt-1 text-sm">{error}</p>
//                     </div>
//                 )}

//                 {message && (
//                     <div
//                         role="status"
//                         className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
//                     >
//                         {message}
//                     </div>
//                 )}

//                 <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//                     <div className="flex flex-wrap items-center justify-between gap-4">
//                         <div>
//                             <h2 className="text-xl font-bold">Products</h2>
//                             <p className="mt-1 text-sm text-gray-500">
//                                 {filteredProducts.length} of {products.length} products
//                             </p>
//                         </div>

//                         <button
//                             onClick={startAdd}
//                             className="rounded-lg bg-green-800 px-4 py-2 font-semibold text-white hover:bg-green-700"
//                         >
//                             + Add Product
//                         </button>
//                     </div>

//                     <div className="mt-5 flex flex-wrap gap-3">
//                         <input
//                             type="search"
//                             value={search}
//                             onChange={(event) => setSearch(event.target.value)}
//                             placeholder="Search product name or SKU..."
//                             className="min-w-60 flex-1 rounded-lg border border-gray-300 px-4 py-2"
//                         />

//                         <select
//                             value={activeFilter}
//                             onChange={(event) => setActiveFilter(event.target.value)}
//                             className="rounded-lg border border-gray-300 bg-white px-3 py-2"
//                             aria-label="Filter products by active status"
//                         >
//                             <option value="all">All products</option>
//                             <option value="active">Active only</option>
//                             <option value="inactive">Inactive only</option>
//                         </select>

//                         <button
//                             onClick={() => void loadData()}
//                             disabled={loading}
//                             className="rounded-lg border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-50 disabled:opacity-60"
//                         >
//                             {loading ? 'Refreshing...' : 'Refresh'}
//                         </button>
//                     </div>

//                     {loading ? (
//                         <p className="py-8 text-gray-500">Loading products...</p>
//                     ) : filteredProducts.length === 0 ? (
//                         <p className="py-8 text-gray-500">No products found.</p>
//                     ) : (
//                         <div className="mt-5 overflow-x-auto">
//                             <table className="w-full text-left text-sm">
//                                 <thead className="bg-gray-50 text-gray-500">
//                                     <tr>
//                                         <th className="px-4 py-3">Product</th>
//                                         <th className="px-4 py-3">Category</th>
//                                         <th className="px-4 py-3">Price / MRP</th>
//                                         <th className="px-4 py-3">Stock</th>
//                                         <th className="px-4 py-3">Status</th>
//                                         <th className="px-4 py-3">Actions</th>
//                                     </tr>
//                                 </thead>

//                                 <tbody className="divide-y divide-gray-100">
//                                     {filteredProducts.map((product) => {
//                                         const category = categories.find(
//                                             (item) => item.id === product.category_id
//                                         );

//                                         return (
//                                             <tr key={product.id}>
//                                                 <td className="px-4 py-4">
//                                                     <div className="flex min-w-56 items-center gap-3">
//                                                         {/* {product.image_url ? (
//                                                             <img
//                                                                 src={product.image_url}
//                                                                 alt={product.name}
//                                                                 className="h-14 w-14 rounded-lg border border-gray-200 object-cover"
//                                                             />
//                                                         ) : (
//                                                             <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 text-2xl">
//                                                                 🛒
//                                                             </div>
//                                                         )} */}

//                                                         <div className="space-y-3">
//                                                             <label className="block space-y-2">
//                                                                 <span className="block text-sm font-medium text-gray-700">
//                                                                     Product Image
//                                                                 </span>

//                                                                 <input
//                                                                     ref={fileInputRef}
//                                                                     type="file"
//                                                                     accept="image/*"
//                                                                     onChange={(event) => {
//                                                                         const file = event.target.files?.[0] ?? null;

//                                                                         console.log('Selected image:', file?.name);
//                                                                         console.log('Selected image size:', file?.size);

//                                                                         setSelectedImage(file);
//                                                                         setImagePreview(file ? URL.createObjectURL(file) : '');
//                                                                     }}
//                                                                 />
//                                                             </label>

//                                                             <p className="text-xs text-gray-500">
//                                                                 JPG, PNG, WebP, GIF, or AVIF. Maximum size: 5 MB.
//                                                             </p>

//                                                             {imagePreview && (
//                                                                 <div className="flex items-start gap-4">
//                                                                     <img
//                                                                         src={imagePreview}
//                                                                         alt="Product preview"
//                                                                         className="h-32 w-32 rounded-lg border border-gray-200 object-cover"
//                                                                     />

//                                                                     <button
//                                                                         type="button"
//                                                                         onClick={() => {
//                                                                             if (imagePreview.startsWith('blob:')) {
//                                                                                 URL.revokeObjectURL(imagePreview);
//                                                                             }

//                                                                             setSelectedImage(null);
//                                                                             setImagePreview('');
//                                                                             updateField('image_url', '');
//                                                                             if (fileInputRef.current) {
//                                                                                 fileInputRef.current.value = '';
//                                                                             }
//                                                                         }}
//                                                                         className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
//                                                                     >
//                                                                         Remove image
//                                                                     </button>
//                                                                 </div>
//                                                             )}
//                                                         </div>

//                                                         <Field label="Image URL (optional fallback)">
//                                                             <input
//                                                                 type="url"
//                                                                 value={form.image_url}
//                                                                 onChange={(event) => {
//                                                                     updateField('image_url', event.target.value);
//                                                                     if (!selectedImage) {
//                                                                         setImagePreview(event.target.value);
//                                                                     }
//                                                                 }}
//                                                                 className={inputClass}
//                                                                 placeholder="https://example.com/product.jpg"
//                                                             />
//                                                         </Field>


//                                                         <div>
//                                                             <p className="font-semibold">{product.name}</p>
//                                                             <p className="text-xs text-gray-500">
//                                                                 SKU: {product.sku || '—'}
//                                                             </p>
//                                                             <p className="text-xs text-gray-500">
//                                                                 Unit: {product.unit}
//                                                             </p>
//                                                         </div>
//                                                     </div>
//                                                 </td>

//                                                 <td className="whitespace-nowrap px-4 py-4">
//                                                     {category?.name ?? 'Uncategorized'}
//                                                 </td>

//                                                 <td className="whitespace-nowrap px-4 py-4">
//                                                     <p className="font-semibold">{money(product.price)}</p>
//                                                     <p className="text-xs text-gray-500">
//                                                         MRP: {money(product.mrp)}
//                                                     </p>
//                                                 </td>

//                                                 <td className="whitespace-nowrap px-4 py-4">
//                                                     {product.stock_quantity}
//                                                 </td>

//                                                 <td className="whitespace-nowrap px-4 py-4">
//                                                     <div className="flex flex-col items-start gap-2">
//                                                         <span
//                                                             className={
//                                                                 product.is_active
//                                                                     ? 'rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800'
//                                                                     : 'rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700'
//                                                             }
//                                                         >
//                                                             {product.is_active ? 'Active' : 'Inactive'}
//                                                         </span>

//                                                         {product.is_featured && (
//                                                             <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
//                                                                 Featured
//                                                             </span>
//                                                         )}
//                                                     </div>
//                                                 </td>

//                                                 <td className="px-4 py-4">
//                                                     <div className="flex flex-wrap gap-2">
//                                                         <button
//                                                             onClick={() => startEdit(product)}
//                                                             className="rounded-lg border border-green-800 px-3 py-2 font-semibold text-green-800 hover:bg-green-50"
//                                                         >
//                                                             Edit
//                                                         </button>

//                                                         <button
//                                                             onClick={() => void toggleActive(product)}
//                                                             className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50"
//                                                         >
//                                                             {product.is_active ? 'Deactivate' : 'Activate'}
//                                                         </button>

//                                                         <button
//                                                             onClick={() => void toggleFeatured(product)}
//                                                             className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50"
//                                                         >
//                                                             {product.is_featured ? 'Unfeature' : 'Feature'}
//                                                         </button>

//                                                         <button
//                                                             onClick={() => void deleteProduct(product)}
//                                                             className="rounded-lg border border-red-200 px-3 py-2 text-red-700 hover:bg-red-50"
//                                                         >
//                                                             Delete
//                                                         </button>
//                                                     </div>
//                                                 </td>
//                                             </tr>
//                                         );
//                                     })}
//                                 </tbody>
//                             </table>
//                         </div>
//                     )}
//                 </section>

//                 {showForm && (
//                     <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
//                         <div className="mb-6 flex items-center justify-between gap-3">
//                             <h2 className="text-xl font-bold">
//                                 {editingId ? 'Edit Product' : 'Add New Product'}
//                             </h2>

//                             <button
//                                 type="button"
//                                 onClick={() => setShowForm(false)}
//                                 className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50"
//                             >
//                                 Close
//                             </button>
//                         </div>

//                         {activeCategories.length === 0 && (
//                             <p className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
//                                 No active categories are available. Activate a category before
//                                 adding a product.
//                             </p>
//                         )}

//                         <form onSubmit={saveProduct} className="space-y-5">
//                             <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//                                 <Field label="Product Name *">
//                                     <input
//                                         required
//                                         value={form.name}
//                                         onChange={(event) => updateField('name', event.target.value)}
//                                         className={inputClass}
//                                         placeholder="e.g. Fresh Apples"
//                                     />
//                                 </Field>

//                                 <Field label="Category *">
//                                     <select
//                                         required
//                                         value={form.category_id}
//                                         onChange={(event) =>
//                                             updateField('category_id', event.target.value)
//                                         }
//                                         className={inputClass}
//                                     >
//                                         <option value="">Select category</option>
//                                         {categories.map((category) => (
//                                             <option
//                                                 key={category.id}
//                                                 value={category.id}
//                                                 disabled={!category.is_active}
//                                             >
//                                                 {category.name}
//                                                 {!category.is_active ? ' (Inactive)' : ''}
//                                             </option>
//                                         ))}
//                                     </select>
//                                 </Field>

//                                 <Field label="SKU">
//                                     <input
//                                         value={form.sku}
//                                         onChange={(event) => updateField('sku', event.target.value)}
//                                         className={inputClass}
//                                         placeholder="e.g. FRU-001"
//                                     />
//                                 </Field>

//                                 <Field label="Unit *">
//                                     <input
//                                         required
//                                         value={form.unit}
//                                         onChange={(event) => updateField('unit', event.target.value)}
//                                         className={inputClass}
//                                         placeholder="e.g. kg, litre, piece, pack"
//                                     />
//                                 </Field>

//                                 <Field label="Selling Price (₹) *">
//                                     <input
//                                         required
//                                         type="number"
//                                         min="0"
//                                         step="0.01"
//                                         value={form.price}
//                                         onChange={(event) => updateField('price', event.target.value)}
//                                         className={inputClass}
//                                     />
//                                 </Field>

//                                 <Field label="MRP (₹) *">
//                                     <input
//                                         required
//                                         type="number"
//                                         min="0"
//                                         step="0.01"
//                                         value={form.mrp}
//                                         onChange={(event) => updateField('mrp', event.target.value)}
//                                         className={inputClass}
//                                     />
//                                 </Field>

//                                 <Field label="Stock Quantity *">
//                                     <input
//                                         required
//                                         type="number"
//                                         min="0"
//                                         step="1"
//                                         value={form.stock_quantity}
//                                         onChange={(event) =>
//                                             updateField('stock_quantity', event.target.value)
//                                         }
//                                         className={inputClass}
//                                     />
//                                 </Field>

//                                 <Field label="Image URL">
//                                     <input
//                                         type="url"
//                                         value={form.image_url}
//                                         onChange={(event) =>
//                                             updateField('image_url', event.target.value)
//                                         }
//                                         className={inputClass}
//                                         placeholder="https://example.com/product.jpg"
//                                     />
//                                 </Field>

//                                 <div className="md:col-span-2">
//                                     <Field label="Description">
//                                         <textarea
//                                             rows={3}
//                                             value={form.description}
//                                             onChange={(event) =>
//                                                 updateField('description', event.target.value)
//                                             }
//                                             className={inputClass}
//                                             placeholder="Product description..."
//                                         />
//                                     </Field>
//                                 </div>
//                             </div>

//                             {form.image_url && (
//                                 <div>
//                                     <p className="mb-2 text-sm font-medium text-gray-700">
//                                         Image Preview
//                                     </p>
//                                     <img
//                                         src={form.image_url}
//                                         alt="Product preview"
//                                         className="h-32 w-32 rounded-lg border border-gray-200 object-cover"
//                                     />
//                                 </div>
//                             )}

//                             <div className="flex flex-wrap gap-6">
//                                 <label className="flex items-center gap-2">
//                                     <input
//                                         type="checkbox"
//                                         checked={form.is_active}
//                                         onChange={(event) =>
//                                             updateField('is_active', event.target.checked)
//                                         }
//                                         className="h-4 w-4"
//                                     />
//                                     Active product
//                                 </label>

//                                 <label className="flex items-center gap-2">
//                                     <input
//                                         type="checkbox"
//                                         checked={form.is_featured}
//                                         onChange={(event) =>
//                                             updateField('is_featured', event.target.checked)
//                                         }
//                                         className="h-4 w-4"
//                                     />
//                                     Featured product
//                                 </label>
//                             </div>

//                             <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-5">
//                                 <button
//                                     type="submit"
//                                     disabled={saving || uploadingImage || activeCategories.length === 0}
//                                     className="rounded-lg bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
//                                 >
//                                     {uploadingImage
//                                         ? 'Uploading image...'
//                                         : saving
//                                             ? 'Saving...'
//                                             : editingId
//                                                 ? 'Save Changes'
//                                                 : 'Add Product'}
//                                 </button>

//                                 <button
//                                     type="button"
//                                     onClick={() => setShowForm(false)}
//                                     className="rounded-lg border border-gray-300 px-5 py-3 font-semibold hover:bg-gray-50"
//                                 >
//                                     Cancel
//                                 </button>
//                             </div>
//                         </form>
//                     </section>
//                 )}
//             </div>
//         </main>
//     );
// }

// const inputClass =
//     'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100';

// function Field({
//     label,
//     children,
// }: {
//     label: string;
//     children: React.ReactNode;
// }) {
//     return (
//         <label className="block space-y-2">
//             <span className="block text-sm font-medium text-gray-700">
//                 {label}
//             </span>
//             {children}
//         </label>
//     );
// }

'use client';

import { useCallback, useEffect, useState, useRef } from 'react';

import { useRouter } from 'next/navigation';

import { supabase } from '../../lib/supabase';
import { downloadCsv } from '../../lib/download-csv';

import AdminHeader from '../admin-header';

type Category = {

    id: string;

    name: string;

    is_active: boolean;

    sort_order: number;

};

type Product = {

    id: string;

    category_id: string | null;

    name: string;

    description: string | null;

    sku: string | null;

    unit: string;

    price: number | string;

    mrp: number | string;

    stock_quantity: number;

    image_url: string | null;

    is_active: boolean;

    is_featured: boolean;

    created_at: string;

    updated_at: string;

};

type ProductForm = {

    category_id: string;

    name: string;

    description: string;

    sku: string;

    unit: string;

    price: string;

    mrp: string;

    stock_quantity: string;

    image_url: string;

    is_active: boolean;

    is_featured: boolean;

};

const emptyForm: ProductForm = {

    category_id: '',

    name: '',

    description: '',

    sku: '',

    unit: 'piece',

    price: '',

    mrp: '',

    stock_quantity: '0',

    image_url: '',

    is_active: true,

    is_featured: false,

};

const money = (value: number | string) =>

    `₹${Number(value || 0).toLocaleString('en-IN', {

        minimumFractionDigits: 2,

        maximumFractionDigits: 2,

    })}`;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const PRODUCT_IMAGE_BUCKET = 'product-image';

async function uploadProductImage(file: File): Promise<string> {
    console.log('Starting product image upload:', file.name, file.size, file.type);

    if (!file.type.startsWith('image/')) {

        throw new Error('Please select an image file.');

    }

    if (file.size > MAX_IMAGE_SIZE) {

        throw new Error('Image must be 5 MB or smaller.');

    }

    const extensions: Record<string, string> = {

        'image/jpeg': 'jpg',

        'image/png': 'png',

        'image/webp': 'webp',

        'image/gif': 'gif',

        'image/avif': 'avif',

    };

    const extension = extensions[file.type];

    if (!extension) {

        throw new Error('Please use JPG, PNG, WebP, GIF, or AVIF.');

    }

    const filePath = `products/${crypto.randomUUID()}.${extension}`;

    const { data, error } = await supabase.storage

        .from(PRODUCT_IMAGE_BUCKET)

        .upload(filePath, file, {

            cacheControl: '3600',

            contentType: file.type,

            upsert: false,

        });

    if (error) {

        console.error('Image upload failed:', error);

        throw new Error(`Image upload failed: ${error.message}`);

    }

    const { data: publicData } = supabase.storage

        .from(PRODUCT_IMAGE_BUCKET)

        .getPublicUrl(data.path);

    console.log('Uploaded file:', data.path);

    console.log('Public image URL:', publicData.publicUrl);

    return publicData.publicUrl;

}

export default function ProductsPage() {

    const router = useRouter();

    const [authorized, setAuthorized] = useState(false);

    const [authChecking, setAuthChecking] = useState(true);

    const [products, setProducts] = useState<Product[]>([]);

    const [categories, setCategories] = useState<Category[]>([]);

    const [loading, setLoading] = useState(false);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');

    const [message, setMessage] = useState('');

    const [search, setSearch] = useState('');

    const [activeFilter, setActiveFilter] = useState('all');

    const [showForm, setShowForm] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState<ProductForm>(emptyForm);

    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const [imagePreview, setImagePreview] = useState('');

    const [uploadingImage, setUploadingImage] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadData = useCallback(async () => {

        setLoading(true);

        setError('');

        try {

            const [

                { data: productData, error: productError },

                { data: categoryData, error: categoryError },

            ] = await Promise.all([

                supabase

                    .from('products')

                    .select(

                        'id, category_id, name, description, sku, unit, price, mrp, stock_quantity, image_url, is_active, is_featured, created_at, updated_at'

                    )

                    .order('created_at', { ascending: false }),

                supabase

                    .from('categories')

                    .select('id, name, is_active, sort_order')

                    .order('sort_order', { ascending: true }),

            ]);

            if (productError) throw productError;

            if (categoryError) throw categoryError;

            setProducts((productData ?? []) as Product[]);

            setCategories((categoryData ?? []) as Category[]);

        } catch (err: unknown) {

            setError(

                err instanceof Error

                    ? err.message

                    : 'Unable to load products.'

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

                    await loadData();

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

    }, [router, loadData]);

    function startAdd() {

        setEditingId(null);

        setForm({

            ...emptyForm,

            category_id: categories.find((category) => category.is_active)?.id ?? '',

        });

        setError('');

        setMessage('');

        setSelectedImage(null);

        setImagePreview('');

        setShowForm(true);

    }

    function startEdit(product: Product) {

        setEditingId(product.id);

        setForm({

            category_id: product.category_id ?? '',

            name: product.name,

            description: product.description ?? '',

            sku: product.sku ?? '',

            unit: product.unit,

            price: String(product.price ?? ''),

            mrp: String(product.mrp ?? ''),

            stock_quantity: String(product.stock_quantity ?? 0),

            image_url: product.image_url ?? '',

            is_active: product.is_active,

            is_featured: product.is_featured,

        });

        setError('');

        setMessage('');

        setSelectedImage(null);

        setImagePreview(product.image_url ?? '');

        setShowForm(true);

    }

    function handleImageChange(file: File | null) {

        setSelectedImage(file);

        if (imagePreview.startsWith('blob:')) {

            URL.revokeObjectURL(imagePreview);

        }

        setImagePreview(file ? URL.createObjectURL(file) : form.image_url);

    }

    function updateField<K extends keyof ProductForm>(

        field: K,

        value: ProductForm[K]

    ) {

        setForm((current) => ({ ...current, [field]: value }));

    }

    async function saveProduct(event: React.FormEvent<HTMLFormElement>) {

        event.preventDefault();

        setSaving(true);

        setError('');

        setMessage('');

        try {

            const price = Number(form.price);

            const mrp = Number(form.mrp);

            const stock = Number(form.stock_quantity);

            if (!form.name.trim()) {

                throw new Error('Please enter a product name.');

            }

            if (!form.category_id) {

                throw new Error('Please select a category.');

            }

            if (!form.unit.trim()) {

                throw new Error('Please enter the product unit.');

            }

            if (!Number.isFinite(price) || price < 0) {

                throw new Error('Price must be a valid non-negative number.');

            }

            if (!Number.isFinite(mrp) || mrp < 0) {

                throw new Error('MRP must be a valid non-negative number.');

            }

            if (mrp < price) {

                throw new Error('MRP should be greater than or equal to the selling price.');

            }

            if (!Number.isInteger(stock) || stock < 0) {

                throw new Error('Stock quantity must be a non-negative whole number.');

            }

            let finalImageUrl = form.image_url.trim() || null;

            if (selectedImage) {

                setUploadingImage(true);

                try {

                    finalImageUrl = await uploadProductImage(selectedImage);

                } finally {

                    setUploadingImage(false);

                }

            }

            const payload = {

                category_id: form.category_id,

                name: form.name.trim(),

                description: form.description.trim() || null,

                sku: form.sku.trim() || null,

                unit: form.unit.trim(),

                price,

                mrp,

                stock_quantity: stock,

                image_url: finalImageUrl,

                is_active: form.is_active,

                is_featured: form.is_featured,

                updated_at: new Date().toISOString(),

            };

            if (editingId) {

                const { error: updateError } = await supabase

                    .from('products')

                    .update(payload)

                    .eq('id', editingId);

                if (updateError) throw updateError;

                setMessage('Product updated successfully.');

            } else {

                const { error: insertError } = await supabase

                    .from('products')

                    .insert(payload);

                if (insertError) throw insertError;

                setMessage('Product added successfully.');

            }

            if (imagePreview.startsWith('blob:')) {

                URL.revokeObjectURL(imagePreview);

            }

            setSelectedImage(null);

            setImagePreview('');

            if (fileInputRef.current) {

                fileInputRef.current.value = '';

            }

            setShowForm(false);

            setEditingId(null);

            setForm(emptyForm);

            await loadData();

        } catch (err: unknown) {

            setError(

                err instanceof Error

                    ? err.message

                    : 'Unable to save product.'

            );

        } finally {

            setSaving(false);

        }

    }

    async function toggleActive(product: Product) {

        setError('');

        setMessage('');

        const { error: updateError } = await supabase

            .from('products')

            .update({

                is_active: !product.is_active,

                updated_at: new Date().toISOString(),

            })

            .eq('id', product.id);

        if (updateError) {

            setError(updateError.message);

            return;

        }

        setMessage(

            product.is_active

                ? 'Product deactivated.'

                : 'Product activated.'

        );

        await loadData();

    }

    async function toggleFeatured(product: Product) {

        setError('');

        setMessage('');

        const { error: updateError } = await supabase

            .from('products')

            .update({

                is_featured: !product.is_featured,

                updated_at: new Date().toISOString(),

            })

            .eq('id', product.id);

        if (updateError) {

            setError(updateError.message);

            return;

        }

        setMessage(

            product.is_featured

                ? 'Product removed from featured items.'

                : 'Product marked as featured.'

        );

        await loadData();

    }

    async function deleteProduct(product: Product) {

        const confirmed = window.confirm(

            `Delete "${product.name}"? If an order references this product, deletion may be blocked. Deactivating it is safer if it has been sold.`

        );

        if (!confirmed) return;

        setError('');

        setMessage('');

        const { error: deleteError } = await supabase

            .from('products')

            .delete()

            .eq('id', product.id);

        if (deleteError) {

            setError(

                `Could not delete this product. It may be referenced by existing orders. Consider deactivating it instead. Details: ${deleteError.message}`

            );

            return;

        }

        setMessage('Product deleted successfully.');

        await loadData();

    }

    const filteredProducts = products.filter((product) => {

        const term = search.trim().toLowerCase();

        const matchesSearch =

            !term ||

            product.name.toLowerCase().includes(term) ||

            (product.sku ?? '').toLowerCase().includes(term);

        const matchesStatus =

            activeFilter === 'all' ||

            (activeFilter === 'active' && product.is_active) ||

            (activeFilter === 'inactive' && !product.is_active);

        return matchesSearch && matchesStatus;

    });

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

    const activeCategories = categories.filter((category) => category.is_active);

    function downloadProducts() {
        const rows = filteredProducts.map((product) => [
            product.id,
            categories.find((category) => category.id === product.category_id)?.name ?? '',
            product.name,
            product.description ?? '',
            product.sku ?? '',
            product.unit,
            product.price,
            product.mrp,
            product.stock_quantity,
            product.is_active ? 'Active' : 'Inactive',
            product.is_featured ? 'Yes' : 'No',
            product.image_url ?? '',
            product.created_at,
            product.updated_at,
        ]);

        downloadCsv(`fresh-basket-products-${new Date().toISOString().slice(0, 10)}.csv`, [
            'Product ID',
            'Category',
            'Product name',
            'Description',
            'SKU',
            'Unit',
            'Price (INR)',
            'MRP (INR)',
            'Stock quantity',
            'Status',
            'Featured',
            'Image URL',
            'Created at',
            'Updated at',
        ], rows);
    }

    return (

        <main className="min-h-screen bg-gray-100 text-gray-900">

            <AdminHeader
                title="Product Management"
                description="Manage products, prices, stock, and categories"
            />

            <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">

                {error && (

                    <div

                        role="alert"

                        className="break-words rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"

                    >

                        <p className="font-semibold">Something went wrong</p>

                        <p className="mt-1 text-sm">{error}</p>

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

                            <h2 className="text-xl font-bold">Products</h2>

                            <p className="mt-1 text-sm text-gray-500">

                                {filteredProducts.length} of {products.length} products

                            </p>

                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={downloadProducts}
                                disabled={loading || filteredProducts.length === 0}
                                className="inline-flex items-center gap-2 rounded-lg border border-green-800 bg-white px-4 py-2 font-semibold text-green-800 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                Download CSV
                            </button>
                            <button
                                onClick={startAdd}
                                className="rounded-lg bg-green-800 px-4 py-2 font-semibold text-white hover:bg-green-700"
                            >
                                + Add Product
                            </button>
                        </div>

                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">

                        <input

                            type="search"

                            value={search}

                            onChange={(event) => setSearch(event.target.value)}

                            placeholder="Search product name or SKU..."

                            className="min-w-60 flex-1 rounded-lg border border-gray-300 px-4 py-2"

                        />

                        <select

                            value={activeFilter}

                            onChange={(event) => setActiveFilter(event.target.value)}

                            className="rounded-lg border border-gray-300 bg-white px-3 py-2"

                            aria-label="Filter products by active status"

                        >

                            <option value="all">All products</option>

                            <option value="active">Active only</option>

                            <option value="inactive">Inactive only</option>

                        </select>

                        <button

                            onClick={() => void loadData()}

                            disabled={loading}

                            className="rounded-lg border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-50 disabled:opacity-60"

                        >

                            {loading ? 'Refreshing...' : 'Refresh'}

                        </button>

                    </div>

                    {loading ? (

                        <p className="py-8 text-gray-500">Loading products...</p>

                    ) : filteredProducts.length === 0 ? (

                        <p className="py-8 text-gray-500">No products found.</p>

                    ) : (

                        <div className="mt-5 overflow-x-auto">

                            <table className="w-full text-left text-sm">

                                <thead className="bg-gray-50 text-gray-500">

                                    <tr>

                                        <th className="px-4 py-3">Product</th>

                                        <th className="px-4 py-3">Category</th>

                                        <th className="px-4 py-3">Price / MRP</th>

                                        <th className="px-4 py-3">Stock</th>

                                        <th className="px-4 py-3">Status</th>

                                        <th className="px-4 py-3">Actions</th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-gray-100">

                                    {filteredProducts.map((product) => {

                                        const category = categories.find(

                                            (item) => item.id === product.category_id

                                        );

                                        return (

                                            <tr key={product.id}>

                                                <td className="px-4 py-4">

                                                    <div className="flex min-w-56 items-center gap-3">



                                                        {product.image_url ? (
                                                            <img
                                                                src={product.image_url}
                                                                alt={product.name}
                                                                className="h-14 w-14 shrink-0 rounded-lg border border-gray-200 object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-2xl">
                                                                🛒
                                                            </div>
                                                        )}

                                                        <div>

                                                            <p className="font-semibold">{product.name}</p>

                                                            <p className="text-xs text-gray-500">

                                                                SKU: {product.sku || '—'}

                                                            </p>

                                                            <p className="text-xs text-gray-500">

                                                                Unit: {product.unit}

                                                            </p>

                                                        </div>

                                                    </div>

                                                </td>

                                                <td className="whitespace-nowrap px-4 py-4">

                                                    {category?.name ?? 'Uncategorized'}

                                                </td>

                                                <td className="whitespace-nowrap px-4 py-4">

                                                    <p className="font-semibold">{money(product.price)}</p>

                                                    <p className="text-xs text-gray-500">

                                                        MRP: {money(product.mrp)}

                                                    </p>

                                                </td>

                                                <td className="whitespace-nowrap px-4 py-4">

                                                    {product.stock_quantity}

                                                </td>

                                                <td className="whitespace-nowrap px-4 py-4">

                                                    <div className="flex flex-col items-start gap-2">

                                                        <span

                                                            className={

                                                                product.is_active

                                                                    ? 'rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800'

                                                                    : 'rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700'

                                                            }

                                                        >

                                                            {product.is_active ? 'Active' : 'Inactive'}

                                                        </span>

                                                        {product.is_featured && (

                                                            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">

                                                                Featured

                                                            </span>

                                                        )}

                                                    </div>

                                                </td>

                                                <td className="px-4 py-4">

                                                    <div className="flex flex-wrap gap-2">

                                                        <button

                                                            onClick={() => startEdit(product)}

                                                            className="rounded-lg border border-green-800 px-3 py-2 font-semibold text-green-800 hover:bg-green-50"

                                                        >

                                                            Edit

                                                        </button>

                                                        <button

                                                            onClick={() => void toggleActive(product)}

                                                            className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50"

                                                        >

                                                            {product.is_active ? 'Deactivate' : 'Activate'}

                                                        </button>

                                                        <button

                                                            onClick={() => void toggleFeatured(product)}

                                                            className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50"

                                                        >

                                                            {product.is_featured ? 'Unfeature' : 'Feature'}

                                                        </button>

                                                        <button

                                                            onClick={() => void deleteProduct(product)}

                                                            className="rounded-lg border border-red-200 px-3 py-2 text-red-700 hover:bg-red-50"

                                                        >

                                                            Delete

                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        );

                                    })}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

                {showForm && (

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

                        <div className="mb-6 flex items-center justify-between gap-3">

                            <h2 className="text-xl font-bold">

                                {editingId ? 'Edit Product' : 'Add New Product'}

                            </h2>

                            <button

                                type="button"

                                onClick={() => setShowForm(false)}

                                className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50"

                            >

                                Close

                            </button>

                        </div>

                        {activeCategories.length === 0 && (

                            <p className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">

                                No active categories are available. Activate a category before

                                adding a product.

                            </p>

                        )}

                        <form onSubmit={saveProduct} className="space-y-5">

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                                <Field label="Product Name *">

                                    <input

                                        required

                                        value={form.name}

                                        onChange={(event) => updateField('name', event.target.value)}

                                        className={inputClass}

                                        placeholder="e.g. Fresh Apples"

                                    />

                                </Field>

                                <Field label="Category *">

                                    <select

                                        required

                                        value={form.category_id}

                                        onChange={(event) =>

                                            updateField('category_id', event.target.value)

                                        }

                                        className={inputClass}

                                    >

                                        <option value="">Select category</option>

                                        {categories.map((category) => (

                                            <option

                                                key={category.id}

                                                value={category.id}

                                                disabled={!category.is_active}

                                            >

                                                {category.name}

                                                {!category.is_active ? ' (Inactive)' : ''}

                                            </option>

                                        ))}

                                    </select>

                                </Field>

                                <Field label="SKU">

                                    <input

                                        value={form.sku}

                                        onChange={(event) => updateField('sku', event.target.value)}

                                        className={inputClass}

                                        placeholder="e.g. FRU-001"

                                    />

                                </Field>

                                <Field label="Unit *">

                                    <input

                                        required

                                        value={form.unit}

                                        onChange={(event) => updateField('unit', event.target.value)}

                                        className={inputClass}

                                        placeholder="e.g. kg, litre, piece, pack"

                                    />

                                </Field>

                                <Field label="Selling Price (₹) *">

                                    <input

                                        required

                                        type="number"

                                        min="0"

                                        step="0.01"

                                        value={form.price}

                                        onChange={(event) => updateField('price', event.target.value)}

                                        className={inputClass}

                                    />

                                </Field>

                                <Field label="MRP (₹) *">

                                    <input

                                        required

                                        type="number"

                                        min="0"

                                        step="0.01"

                                        value={form.mrp}

                                        onChange={(event) => updateField('mrp', event.target.value)}

                                        className={inputClass}

                                    />

                                </Field>

                                <Field label="Stock Quantity *">

                                    <input

                                        required

                                        type="number"

                                        min="0"

                                        step="1"

                                        value={form.stock_quantity}

                                        onChange={(event) =>

                                            updateField('stock_quantity', event.target.value)

                                        }

                                        className={inputClass}

                                    />

                                </Field>

                                <div className="md:col-span-2">
                                    <Field label="Product Image">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                                            onChange={(event) => {
                                                handleImageChange(event.target.files?.[0] ?? null);
                                            }}
                                            className={inputClass}
                                        />
                                    </Field>
                                    <p className="mt-2 text-xs text-gray-500">
                                        Choose a separate image for this product. JPG, PNG, WebP, GIF, or AVIF; maximum 5 MB.
                                    </p>
                                    {imagePreview && (
                                        <div className="mt-3 flex items-start gap-4">
                                            <img
                                                src={imagePreview}
                                                alt="Product image preview"
                                                className="h-32 w-32 rounded-lg border border-gray-200 object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (imagePreview.startsWith('blob:')) {
                                                        URL.revokeObjectURL(imagePreview);
                                                    }
                                                    setSelectedImage(null);
                                                    setImagePreview('');
                                                    updateField('image_url', '');
                                                    if (fileInputRef.current) {
                                                        fileInputRef.current.value = '';
                                                    }
                                                }}
                                                className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                                            >
                                                Remove image
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <Field label="Image URL">

                                    <input

                                        type="url"

                                        value={form.image_url}

                                        onChange={(event) =>

                                            updateField('image_url', event.target.value)

                                        }

                                        className={inputClass}

                                        placeholder="https\://example.com/product.jpg"

                                    />

                                </Field>

                                <div className="md:col-span-2">

                                    <Field label="Description">

                                        <textarea

                                            rows={3}

                                            value={form.description}

                                            onChange={(event) =>

                                                updateField('description', event.target.value)

                                            }

                                            className={inputClass}

                                            placeholder="Product description..."

                                        />

                                    </Field>

                                </div>

                            </div>

                            {imagePreview && (

                                <div>

                                    <p className="mb-2 text-sm font-medium text-gray-700">

                                        Image Preview

                                    </p>

                                    <img

                                        src={imagePreview}

                                        alt="Product preview"

                                        className="h-32 w-32 rounded-lg border border-gray-200 object-cover"

                                    />

                                </div>

                            )}

                            <div className="flex flex-wrap gap-6">

                                <label className="flex items-center gap-2">

                                    <input

                                        type="checkbox"

                                        checked={form.is_active}

                                        onChange={(event) =>

                                            updateField('is_active', event.target.checked)

                                        }

                                        className="h-4 w-4"

                                    />

                                    Active product

                                </label>

                                <label className="flex items-center gap-2">

                                    <input

                                        type="checkbox"

                                        checked={form.is_featured}

                                        onChange={(event) =>

                                            updateField('is_featured', event.target.checked)

                                        }

                                        className="h-4 w-4"

                                    />

                                    Featured product

                                </label>

                            </div>

                            <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-5">

                                <button

                                    type="submit"

                                    disabled={saving || uploadingImage || activeCategories.length === 0}

                                    className="rounded-lg bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-60"

                                >

                                    {uploadingImage

                                        ? 'Uploading image...'

                                        : saving

                                            ? 'Saving...'

                                            : editingId

                                                ? 'Save Changes'

                                                : 'Add Product'}

                                </button>

                                <button

                                    type="button"

                                    onClick={() => setShowForm(false)}

                                    className="rounded-lg border border-gray-300 px-5 py-3 font-semibold hover:bg-gray-50"

                                >

                                    Cancel

                                </button>

                            </div>

                        </form>

                    </section>

                )}

            </div>

        </main>

    );

}

const inputClass =

    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100';

function Field({

    label,

    children,

}: {

    label: string;

    children: React.ReactNode;

}) {

    return (

        <label className="block space-y-2">

            <span className="block text-sm font-medium text-gray-700">

                {label}

            </span>

            {children}

        </label>

    );

}
