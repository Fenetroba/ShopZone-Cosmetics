import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Folder, Layers, HelpCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import { useDispatch } from 'react-redux';
import { addToast } from '../../redux/slices/uiSlice';
import api from '../../services/api';

export default function AdminCategories() {
  const dispatch = useDispatch();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories || []);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to load categories' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditCategory(null);
    reset({
      name: '',
      description: '',
      parent: '',
      sortOrder: 0,
      isActive: true,
      image: null
    });
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setEditCategory(category);
    reset({
      name: category.name,
      description: category.description || '',
      parent: category.parent?._id || category.parent || '',
      sortOrder: category.sortOrder || 0,
      isActive: category.isActive !== undefined ? category.isActive : true,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const hasImage = data.image && data.image[0];

      let res;
      if (hasImage) {
        // Send as multipart only when an image file is actually selected
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description || '');
        formData.append('parent', data.parent || '');
        formData.append('sortOrder', data.sortOrder || 0);
        formData.append('isActive', data.isActive ? 'true' : 'false');
        formData.append('image', data.image[0]);

        const config = { headers: { 'Content-Type': 'multipart/form-data' } };
        res = editCategory
          ? await api.put(`/categories/${editCategory._id}`, formData, config)
          : await api.post('/categories', formData, config);
      } else {
        // No image — send plain JSON so Cloudinary middleware is skipped
        const payload = {
          name: data.name,
          description: data.description || '',
          parent: data.parent || undefined,
          sortOrder: Number(data.sortOrder) || 0,
          isActive: data.isActive !== false,
        };
        res = editCategory
          ? await api.put(`/categories/${editCategory._id}`, payload)
          : await api.post('/categories', payload);
      }

      if (editCategory) {
        setCategories((prev) =>
          prev.map((c) => (c._id === editCategory._id ? res.data.category : c))
        );
        dispatch(addToast({ type: 'success', message: 'Category updated successfully' }));
      } else {
        dispatch(addToast({ type: 'success', message: 'Category created successfully' }));
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: err.response?.data?.message || 'Failed to save category',
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/categories/${deleteModal._id}`);
      setCategories((prev) => prev.filter((c) => c._id !== deleteModal._id));
      setDeleteModal(null);
      dispatch(addToast({ type: 'success', message: 'Category deleted successfully' }));
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: err.response?.data?.message || 'Failed to delete category',
        })
      );
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const mainCategories = categories.filter((c) => !c.parent);
  const subCategories = categories.filter((c) => c.parent);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">Manage product categories and hierarchy</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl">
              <Folder className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{categories.length}</p>
              <p className="text-sm text-gray-500">Total Categories</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mainCategories.length}</p>
              <p className="text-sm text-gray-500">Main Categories</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
              <Folder className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{subCategories.length}</p>
              <p className="text-sm text-gray-500">Sub Categories</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Image</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Parent Category</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Sort Order</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500">
                      No categories found
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr key={category._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-3">
                        <img
                          src={category.image || 'https://placehold.co/40x40?text=No+Img'}
                          alt={category.name}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-850"
                        />
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-900 dark:text-gray-100">
                        {category.name}
                      </td>
                      <td className="py-3 px-3 text-gray-500 max-w-xs truncate">
                        {category.description || '-'}
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        {category.parent?.name || category.parent || '-'}
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        {category.sortOrder}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={category.isActive ? 'success' : 'secondary'}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(category)} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteModal(category)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
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
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editCategory ? 'Edit Category' : 'Create Category'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. Electronics"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Provide a brief description of this category..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Parent Category"
              {...register('parent')}
            >
              <option value="">None (Top Level)</option>
              {categories
                .filter((c) => !editCategory || c._id !== editCategory._id) // Prevent self-parenting
                .map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
            </Select>

            <Input
              label="Sort Order"
              type="number"
              defaultValue={0}
              {...register('sortOrder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category Image
            </label>
            <input
              type="file"
              accept="image/*"
              {...register('image')}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                defaultChecked={true}
                {...register('isActive')}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active (Visible to users)
              </span>
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editCategory ? 'Update' : 'Create'} Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Category"
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete category <strong>{deleteModal?.name}</strong>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteModal(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
