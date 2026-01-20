import React, { useState, useEffect } from 'react';
import { Search, Trash2, Edit2, Check, X, User as UserIcon, Shield, Mail, Building2 } from 'lucide-react';
import { User, UserRole, UserRegister } from '../../types/auth'; // Ensure this path is correct based on your project structure
import { getUsers, updateUser, deleteUser, createUser } from '../../services/adminService';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { AdminLayout } from '../../components/admin/AdminLayout';

export const AdminUsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { isDark } = useAdminTheme();

    // Modal States
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<User>>({});
    const [createData, setCreateData] = useState<Partial<UserRegister>>({
        role: UserRole.CLIENT_ADMIN
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const data = await getUsers();
        setUsers(data);
        setLoading(false);
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setFormData({
            full_name: user.full_name,
            role: user.role,
            is_active: user.is_active,
            tenant_id: user.tenant_id
        });
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;
        setSaveLoading(true);
        try {
            const updated = await updateUser(editingUser.user_id, formData);
            setUsers(users.map(u => u.user_id === updated.user_id ? updated : u));
            setEditingUser(null);
        } catch (e) {
            console.error("Failed to update user", e);
            alert("Failed to update user");
        }
        setSaveLoading(false);
    };

    const handleDeleteClick = (user: User) => {
        setDeletingUser(user);
    };

    const confirmDelete = async () => {
        if (!deletingUser) return;
        setSaveLoading(true);
        try {
            await deleteUser(deletingUser.user_id);
            setUsers(users.filter(u => u.user_id !== deletingUser.user_id));
            setDeletingUser(null);
        } catch (e) {
            console.error("Failed to delete user", e);
            alert("Failed to delete user");
        }
        setSaveLoading(false);
    };

    const filteredUsers = users.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Styles
    const inputClass = `w-full px-3 sm:px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`;
    const labelClass = `block text-xs sm:text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`;
    const modalClass = `fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm`;
    const modalContentClass = `w-full max-w-md p-4 sm:p-6 rounded-xl shadow-2xl ${isDark ? 'bg-slate-800' : 'bg-white'}`;

    const handleCreateUser = async () => {
        if (!createData.email || !createData.password || !createData.full_name) {
            alert("Please fill in all required fields");
            return;
        }

        setSaveLoading(true);
        try {
            const newUser = await createUser(createData as UserRegister);
            setUsers([...users, newUser]);
            setIsCreating(false);
            setCreateData({ role: UserRole.CLIENT_ADMIN });
        } catch (e: any) {
            console.error("Failed to create user", e);
            alert(e.response?.data?.detail || "Failed to create user");
        }
        setSaveLoading(false);
    };

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Manage Users</h1>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        View and manage all registered users across the platform.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setCreateData({ role: UserRole.CLIENT_ADMIN });
                        setIsCreating(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-600/20 w-full sm:w-auto"
                >
                    <UserIcon size={18} />
                    <span>Add User</span>
                </button>
            </div>

            {/* Search */}
            <div className={`p-4 rounded-xl border mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} size={18} />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${isDark
                            ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500'
                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                            }`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className={`border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                                <th className={`p-3 sm:p-4 text-xs sm:text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>User</th>
                                <th className={`p-3 sm:p-4 text-xs sm:text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Role</th>
                                <th className={`p-3 sm:p-4 text-xs sm:text-sm font-semibold hidden md:table-cell ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Tenant ID</th>
                                <th className={`p-3 sm:p-4 text-xs sm:text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Status</th>
                                <th className={`p-3 sm:p-4 text-xs sm:text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className={`p-8 text-center ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Loading users...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className={`p-8 text-center ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No users found.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.user_id} className={`border-b last:border-0 hover:bg-opacity-50 transition-colors ${isDark ? 'border-slate-700 hover:bg-slate-700' : 'border-gray-100 hover:bg-gray-50'}`}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${isDark ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                                                    {user.full_name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.full_name}</p>
                                                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === UserRole.PLATFORM_ADMIN ? 'bg-purple-100 text-purple-800' :
                                                user.role === UserRole.CLIENT_ADMIN ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className={`p-3 sm:p-4 text-xs sm:text-sm hidden md:table-cell ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                            {user.tenant_id || '-'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEditClick(user)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-600 text-indigo-400' : 'hover:bg-gray-200 text-indigo-600'}`}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteClick(user)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-600 text-red-400' : 'hover:bg-gray-200 text-red-600'}`}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {isCreating && (
                <div className={modalClass}>
                    <div className={modalContentClass}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Create New User</h3>
                            <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={createData.full_name || ''}
                                    onChange={(e) => setCreateData({ ...createData, full_name: e.target.value })}
                                    className={inputClass}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Email</label>
                                <input
                                    type="email"
                                    required
                                    value={createData.email || ''}
                                    onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                                    className={inputClass}
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={createData.password || ''}
                                    onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                                    className={inputClass}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Role</label>
                                <select
                                    value={createData.role}
                                    onChange={(e) => setCreateData({ ...createData, role: e.target.value as UserRole })}
                                    className={inputClass}
                                >
                                    {Object.values(UserRole).map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                            {createData.role !== UserRole.PLATFORM_ADMIN && (
                                <div>
                                    <label className={labelClass}>Tenant ID</label>
                                    <input
                                        type="text"
                                        value={createData.tenant_id || ''}
                                        onChange={(e) => setCreateData({ ...createData, tenant_id: e.target.value })}
                                        className={inputClass}
                                        placeholder="UUID"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Required for non-platform users.</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className={`px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateUser}
                                    disabled={saveLoading}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {saveLoading ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingUser && (
                <div className={modalClass}>
                    <div className={modalContentClass}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Edit User</h3>
                            <button onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.full_name || ''}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    className={inputClass}
                                >
                                    {Object.values(UserRole).map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Status</label>
                                <select
                                    value={formData.is_active ? 'active' : 'inactive'}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                                    className={inputClass}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className={`px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={saveLoading}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {saveLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deletingUser && (
                <div className={modalClass}>
                    <div className={modalContentClass}>
                        <div className="flex items-center gap-3 mb-4 text-red-500">
                            <Shield size={24} />
                            <h3 className="text-lg font-bold">Delete User</h3>
                        </div>
                        <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            Are you sure you want to delete <strong>{deletingUser.full_name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeletingUser(null)}
                                className={`px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={saveLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                                {saveLoading ? 'Deleting...' : 'Delete User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};
