import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import { formatPrice } from '../../lib/utils';
import { useDispatch } from 'react-redux';
import { addToast } from '../../redux/slices/uiSlice';
import api from '../../services/api';

export default function SellerProducts() {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products/seller/my-products', { params: { page } });
      setProducts(data.products || []);
      setPagination(data.pagination || {});
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to load products' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page]);
  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories || []));
  }, []);

  const openCreate = () => {
    setEditProduct(null);
    reset({});
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditProduct(product);
    reset({
      title: product.title,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice,
      stock: product.stock,
      brand: product.brand,
      category: product.category?._id,
      sku: product.sku,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (key !== 'images' && val !== undefined && val !== '') formData.append(key, val);
      });
      if (data.images?.[0]) {
        Array.from(data.images).forEach((file) => formData.append('images', file));
      }

      if (editProduct) {
        const res = await api.put(`/products/${editProduct._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setProducts((prev) => prev.map((p) => p._id === editProduct._id ? res.data.product : p));
        dispatch(addToast({ type: 'success', message: 'Product updated' }));
      } else {
        const res = await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setProducts((prev) => [res.data.product, ...prev]);
        dispatch(addToast({ type: 'success', message: 'Product created' }));
      }
      setModalOpen(false);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.response?.data?.message || 'Failed' }));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async () => {
    try {
      await api.delete(`/products/${deleteModal._id}`);
      setProducts((prev) => prev.filter((p) => p._id !== deleteModal._id));
      setDeleteModal(null);
      dispatch(addToast({ type: 'success', message: 'Product deleted' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to delete' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Products</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination.total} products</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                      No products yet. <button onClick={openCreate} className="text-indigo-600 hover:underline">Add your first product</button>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images?.[0] || 'https://placehold.co/40x40'}
                            alt={product.title}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium line-clamp-1">{product.title}</p>
                            {product.sku && <p className="text-xs text-gray-500">SKU: {product.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-500">{product.category?.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-semibold">{formatPrice(product.price)}</p>
                        {product.discountPrice > 0 && (
                          <p className="text-xs text-emerald-600">{formatPrice(product.discountPrice)}</p>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={product.stock <= 5 ? 'text-red-500 font-medium' : ''}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={product.isActive ? 'success' : 'secondary'}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteModal(product)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page || 1} pages={pagination.pages || 1} onPageChange={setPage} />
        </CardContent>
      </Card>

      {/* Product Form Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editProduct ? 'Edit Product' : 'Add Product'} size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Product Title" {...register('title', { required: 'Required' })} error={errors.title?.message} className="sm:col-span-2" />
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                {...register('description', { required: 'Required' })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <Input label="Price ($)" type="number" step="0.01" {...register('price', { required: 'Required', min: 0 })} error={errors.price?.message} />
            <Input label="Discount Price ($)" type="number" step="0.01" {...register('discountPrice')} />
            <Input label="Stock Quantity" type="number" {...register('stock', { required: 'Required', min: 0 })} error={errors.stock?.message} />
            <Input label="Brand" {...register('brand')} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select {...register('category', { required: 'Required' })} className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <Input label="SKU" {...register('sku')} />
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product Images (up to 5)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                {...register('images')}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editProduct ? 'Update' : 'Create'} Product</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Product" size="sm">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete <strong>{deleteModal?.title}</strong>?
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="destructive" onClick={deleteProduct}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
