import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Edit2, Trash2, CheckCircle2, ShieldAlert, Tag, Package, Image, LinkIcon } from 'lucide-react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { OutboundTabs } from '../../../components/admin/outbound/OutboundTabs';
import { useAdminTheme } from '../../../contexts/AdminThemeContext';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { listProducts, createProduct, updateProduct, deleteProduct, OutboundProduct } from '../../../services/outboundAIService';

export const ProductsPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();
  const { user } = useAdminAuth();

  const [products, setProducts] = useState<OutboundProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<OutboundProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    price: 0,
    currency: 'USD',
    category: '',
    status: 'ACTIVE',
    tags: '',
    search_keywords: '',
    brochure_pdf: '',
    features: '',
    benefits: '',
    images: '',
  });

  const fetchProducts = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const data = await listProducts(clientId);
      setProducts(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load products');
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenCreate = () => {
    setEditProduct(null);
    setFormData({
      name: '',
      description: '',
      short_description: '',
      price: 0,
      currency: 'USD',
      category: '',
      status: 'ACTIVE',
      tags: '',
      search_keywords: '',
      brochure_pdf: '',
      features: '',
      benefits: '',
      images: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: OutboundProduct) => {
    setEditProduct(p);
    setFormData({
      name: p.name,
      description: p.description,
      short_description: p.short_description,
      price: p.price,
      currency: p.currency,
      category: p.category,
      status: p.status,
      tags: p.tags.join(', '),
      search_keywords: p.search_keywords.join(', '),
      brochure_pdf: p.brochure_pdf || '',
      features: p.features.join(', '),
      benefits: p.benefits.join(', '),
      images: p.images.join(', '),
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setError('');
    setSuccess('');

    const formattedPayload = {
      name: formData.name,
      description: formData.description,
      short_description: formData.short_description,
      price: Number(formData.price),
      currency: formData.currency,
      category: formData.category,
      status: formData.status as 'ACTIVE' | 'INACTIVE',
      tags: formData.tags.split(',').map(s => s.trim()).filter(Boolean),
      search_keywords: formData.search_keywords.split(',').map(s => s.trim()).filter(Boolean),
      brochure_pdf: formData.brochure_pdf.trim() || null,
      features: formData.features.split(',').map(s => s.trim()).filter(Boolean),
      benefits: formData.benefits.split(',').map(s => s.trim()).filter(Boolean),
      images: formData.images.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      if (editProduct) {
        await updateProduct(clientId, editProduct.product_id, formattedPayload);
        setSuccess(`Product '${formattedPayload.name}' updated successfully!`);
      } else {
        await createProduct(clientId, formattedPayload);
        setSuccess(`Product '${formattedPayload.name}' added successfully!`);
      }
      setIsModalOpen(false);
      fetchProducts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to save product');
    }
  };

  const handleDelete = async (productId: string, name: string) => {
    if (!clientId) return;
    if (!confirm(`Are you sure you want to delete '${name}'?`)) return;
    setError('');
    setSuccess('');
    try {
      await deleteProduct(clientId, productId);
      setSuccess(`Product '${name}' deleted successfully.`);
      fetchProducts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to delete product');
    }
  };

  const cardClass = `rounded-xl border p-5 backdrop-blur-sm transition-all duration-200 relative group overflow-hidden ${
    isDark ? 'bg-slate-800/80 border-slate-700/50 text-white hover:bg-slate-800' : 'bg-white border-gray-200 text-gray-900 hover:shadow-md'
  }`;

  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
    isDark
      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
  }`;

  const labelClass = `block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
    isDark ? 'text-slate-400' : 'text-gray-500'
  }`;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (user?.role === 'client_admin') {
                navigate(`/${clientId}/dashboard`);
              } else {
                navigate(`/admin/clients/${clientId}`);
              }
            }}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Product Catalog
            </h1>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Manage product listings for the AI sales agent catalog search tools
            </p>
          </div>
        </div>
        <div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-500/25"
          >
            <Plus size={18} /> New Product
          </button>
        </div>
      </div>

      {/* Tabs */}
      <OutboundTabs />

      {/* Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : products.length === 0 ? (
        <div className={`text-center py-20 rounded-2xl border border-dashed ${isDark ? 'border-slate-700 text-slate-400 bg-slate-800/10' : 'border-gray-300 text-gray-400 bg-gray-50/50'}`}>
          <Package className="mx-auto mb-4 text-slate-500" size={48} />
          <h3 className="font-bold text-lg">No Products Found</h3>
          <p className="text-sm mt-1 max-w-sm mx-auto">Create products so the Outbound AI agent can recommend, discuss pricing, and retrieve specifications during sales calls.</p>
          <button onClick={handleOpenCreate} className="mt-4 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl text-sm hover:bg-indigo-700 transition-colors">
            Create First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.product_id} className={cardClass}>
              <div className="flex justify-between items-start mb-3">
                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                  p.status === 'ACTIVE'
                    ? isDark ? 'bg-green-500/15 text-green-400' : 'bg-green-50 text-green-700'
                    : isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'
                }`}>
                  {p.status}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEdit(p)} className={`p-1.5 rounded-lg border transition-colors ${
                    isDark ? 'border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white' : 'border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-900'
                  }`}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(p.product_id, p.name)} className={`p-1.5 rounded-lg border transition-colors ${
                    isDark ? 'border-slate-700 hover:bg-red-950 text-slate-400 hover:text-red-400' : 'border-gray-200 hover:bg-red-50 text-gray-500 hover:text-red-600'
                  }`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-lg mb-1 truncate">{p.name}</h3>
              <p className={`text-xs font-medium mb-3 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {p.category}
              </p>
              
              <p className={`text-sm mb-4 line-clamp-2 h-10 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                {p.short_description || p.description}
              </p>

              <div className="flex justify-between items-center border-t border-slate-700/50 pt-4 mt-4">
                <span className="text-xl font-black">
                  {p.currency} {Number(p.price).toLocaleString()}
                </span>
                <div className="flex gap-1">
                  {p.brochure_pdf && <LinkIcon size={14} className="text-indigo-500" />}
                  {p.images.length > 0 && <Image size={14} className="text-purple-500" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-3xl rounded-2xl border shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col ${
            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <h2 className="text-xl font-bold border-b pb-4 mb-4 border-slate-700/50">
              {editProduct ? `Edit Product: ${editProduct.name}` : 'Create New Product'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. LeadEngine Enterprise CRM"
                  />
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Software, Services, Automation"
                  />
                </div>
                <div>
                  <label className={labelClass}>Price</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Currency</label>
                  <input
                    type="text"
                    required
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Short Description</label>
                <input
                  type="text"
                  required
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  className={inputClass}
                  placeholder="One sentence summary shown to agent"
                />
              </div>

              <div>
                <label className={labelClass}>Full Description</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`${inputClass} resize-none`}
                  placeholder="Complete specifications details..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Features (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    className={inputClass}
                    placeholder="Auto dialer, Analytics, Lead Capture"
                  />
                </div>
                <div>
                  <label className={labelClass}>Benefits (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    className={inputClass}
                    placeholder="Save 20 hours/week, 2x Conversion"
                  />
                </div>
                <div>
                  <label className={labelClass}>Tags / Keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className={inputClass}
                    placeholder="crm, outbound, automation"
                  />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={inputClass}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Brochure PDF Link (External PDF URL)</label>
                <input
                  type="url"
                  value={formData.brochure_pdf}
                  onChange={(e) => setFormData({ ...formData, brochure_pdf: e.target.value })}
                  className={inputClass}
                  placeholder="https://example.com/brochures/crm.pdf"
                />
              </div>

              <div>
                <label className={labelClass}>Gallery Image Links (comma-separated URLs)</label>
                <input
                  type="text"
                  value={formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  className={inputClass}
                  placeholder="https://example.com/img1.png, https://example.com/img2.png"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-700/50 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    isDark ? 'border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white' : 'border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-all"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
