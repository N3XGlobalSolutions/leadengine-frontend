import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Trash2, Edit2, Check, X, Eye, EyeOff, Key, Copy, UserPlus, ShieldAlert } from 'lucide-react';
import { User, UserRole, UserRegister } from '../../types/auth'; // Ensure this path is correct based on your project structure
import { getUsers, updateUser, deleteUser, createUser, resetUserPassword } from '../../services/adminService';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
    PageContainer, PageHeader, Mark, Card, SearchField, TableCard, Table, Th, Td, StatusPill, Select, IconButton,
    Field, Input, Button, tone,
} from '../../components/admin/ui/kit';
import { cn } from '../../utils/cn';

/* ── Local presentational helpers (module level so inputs keep focus across renders) ── */

/** Centered white 16px dialog card on a dimmed backdrop. Escape closes. */
const ModalShell: React.FC<{
    isDark: boolean;
    titleId: string;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    icon?: React.ReactNode;
    iconTone?: 'neutral' | 'danger';
    onClose: () => void;
    children: React.ReactNode;
}> = ({ isDark, titleId, title, subtitle, icon, iconTone = 'neutral', onClose, children }) => {
    const t = tone(isDark);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm font-jakarta" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div className={cn('w-full max-w-md max-h-[calc(100vh-24px)] overflow-y-auto rounded-2xl border p-5 sm:p-6 flex flex-col gap-5 shadow-2xl', t.card)}>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                        {icon && (
                            <span className={cn('w-11 h-11 flex-none rounded-xl flex items-center justify-center',
                                iconTone === 'danger'
                                    ? (isDark ? 'bg-red-500/10 text-red-300' : 'bg-[#FEE2E2] text-[#B91C1C]')
                                    : (isDark ? 'bg-white text-black' : 'bg-[#111111] text-white'))}>
                                {icon}
                            </span>
                        )}
                        <div className="flex flex-col gap-1 min-w-0 pt-0.5">
                            <h3 id={titleId} className={cn('m-0 text-[18px] font-extrabold tracking-[-0.02em]', t.text)}>{title}</h3>
                            {subtitle && <p className={cn('m-0 text-[13px] break-all', t.hint)}>{subtitle}</p>}
                        </div>
                    </div>
                    <IconButton isDark={isDark} label="Close" size={36} onClick={onClose}
                        className={cn('border-transparent bg-transparent', isDark ? 'hover:bg-neutral-800' : 'hover:bg-[#F2F2F2]')}>
                        <X size={18} />
                    </IconButton>
                </div>
                {children}
            </div>
        </div>
    );
};

/** Password input with a show/hide toggle. */
const PasswordInput: React.FC<{
    isDark: boolean;
    id: string;
    value: string;
    onChange: (v: string) => void;
    visible: boolean;
    onToggle: () => void;
    invalid?: boolean;
    autoFocus?: boolean;
}> = ({ isDark, id, value, onChange, visible, onToggle, invalid, autoFocus }) => (
    <div className="relative">
        <Input
            isDark={isDark}
            id={id}
            type={visible ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete="new-password"
            autoFocus={autoFocus}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="••••••••"
            invalid={invalid}
            className="pr-12"
        />
        <button
            type="button"
            onClick={onToggle}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-controls={id}
            className={cn('absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2',
                isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800 focus-visible:ring-white/40' : 'text-[#6B6B6B] hover:text-[#0A0A0A] hover:bg-[#F2F2F2] focus-visible:ring-black/30')}
        >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
    </div>
);

/** Platform roles get the soft grey pill, tenant roles the outlined one (design: platform_admin vs client_admin). */
const RolePill: React.FC<{ isDark: boolean; role: string }> = ({ isDark, role }) => {
    const platform = role === UserRole.PLATFORM_ADMIN || role === UserRole.PLATFORM_OPERATOR;
    return (
        <span className={cn('inline-block font-techmono text-xs px-2 py-[3px] rounded-full border whitespace-nowrap',
            platform
                ? (isDark ? 'bg-neutral-800 text-white border-neutral-700' : 'bg-[#F2F2F2] text-[#0A0A0A] border-[#E5E5E5]')
                : (isDark ? 'bg-transparent text-neutral-200 border-neutral-700' : 'bg-white text-[#0A0A0A] border-[#D4D4D4]'))}>
            {role}
        </span>
    );
};

const dangerBtn = 'bg-[#B91C1C] text-white border-[#B91C1C] hover:bg-[#991B1B] hover:border-[#991B1B]';

export const AdminUsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { isDark } = useAdminTheme();
    const { user: currentUser } = useAdminAuth();
    const location = useLocation();
    const [highlightedUserId, setHighlightedUserId] = useState<string | null>(null);
    const t = tone(isDark);

    // Refs for scrolling to highlighted user
    const userRowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

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
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password Reset State
    const [resettingUser, setResettingUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmResetPassword, setConfirmResetPassword] = useState('');
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [resetPasswordResult, setResetPasswordResult] = useState('');

    const fetchUsers = async () => {
        const data = await getUsers();
        setUsers(data);
        setLoading(false);

        // Check for highlight param
        const params = new URLSearchParams(location.search);
        const highlightId = params.get('highlight');
        if (highlightId) {
            setHighlightedUserId(highlightId);
            // Scroll to element after a slight delay to ensure rendering
            setTimeout(() => {
                const element = userRowRefs.current[highlightId];
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Remove highlight after 5 seconds
                    setTimeout(() => setHighlightedUserId(null), 5000);
                }
            }, 500);
        }
    };

    useEffect(() => {
        fetchUsers();
        // Load once on mount (unchanged behaviour).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    // Password Reset Handlers
    const handleResetClick = (user: User) => {
        setResettingUser(user);
        setNewPassword('');
        setConfirmResetPassword('');
        setResetSuccess(false);
        setResetPasswordResult('');
    };

    const handleConfirmResetPassword = async () => {
        if (!resettingUser) return;

        if (newPassword !== confirmResetPassword) {
            alert("Passwords do not match");
            return;
        }

        if (newPassword.length < 8) {
            alert("Password must be at least 8 characters long");
            return;
        }

        setSaveLoading(true);
        try {
            await resetUserPassword(resettingUser.user_id, newPassword);
            setResetPasswordResult(newPassword);
            setResetSuccess(true);
        } catch (e) {
            console.error("Failed to reset password", e);
            alert("Failed to reset password");
        }
        setSaveLoading(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Password copied to clipboard");
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

    const handleCreateUser = async () => {
        if (!createData.email || !createData.password || !createData.full_name) {
            alert("Please fill in all required fields");
            return;
        }

        if (createData.password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        if (createData.password.length < 8) {
            alert("Password must be at least 8 characters long");
            return;
        }

        setSaveLoading(true);
        try {
            const newUser = await createUser(createData as UserRegister);
            setUsers([...users, newUser]);
            setIsCreating(false);
            setCreateData({ role: UserRole.CLIENT_ADMIN });
            setConfirmPassword('');
            setShowPassword(false);
            setShowConfirmPassword(false);
        } catch (e: unknown) {
            console.error("Failed to create user", e);
            const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            alert(detail || "Failed to create user");
        }
        setSaveLoading(false);
    };

    const canManageCredentials = currentUser?.role !== 'platform_operator';
    const roleSelectClass = 'w-full h-[46px] text-sm';
    const actionBtnClass = cn('border-transparent bg-transparent', isDark ? 'hover:bg-neutral-800' : 'hover:bg-[#F2F2F2]');

    return (
        <AdminLayout breadcrumb={[{ label: 'Operations' }, { label: 'Users' }]}>
            <PageContainer>
                <PageHeader
                    isDark={isDark}
                    eyebrow="Operations"
                    title={<>Manage <Mark isDark={isDark}>Users</Mark></>}
                    description="View and manage all registered users across the platform."
                    actions={
                        <Button
                            isDark={isDark}
                            variant="primary"
                            onClick={() => {
                                setCreateData({ role: UserRole.CLIENT_ADMIN });
                                setConfirmPassword('');
                                setShowPassword(false);
                                setShowConfirmPassword(false);
                                setIsCreating(true);
                            }}
                        >
                            <UserPlus size={16} aria-hidden="true" />
                            Add User
                        </Button>
                    }
                />

                {/* Search */}
                <Card isDark={isDark} className="p-3.5">
                    <SearchField
                        isDark={isDark}
                        label="Search users"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={setSearchTerm}
                        className="h-[42px]"
                    />
                </Card>

                {/* Users Table */}
                <TableCard isDark={isDark}>
                    <Table className="min-w-[600px]">
                        <thead>
                            <tr>
                                <Th isDark={isDark}>User</Th>
                                <Th isDark={isDark}>Role</Th>
                                <Th isDark={isDark} className="hidden md:table-cell">Tenant ID</Th>
                                <Th isDark={isDark}>Status</Th>
                                <Th isDark={isDark}>Actions</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <Td isDark={isDark} colSpan={5} className={cn('py-10 text-center border-b-0', t.muted)}>Loading users...</Td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <Td isDark={isDark} colSpan={5} className={cn('py-10 text-center border-b-0', t.muted)}>No users found.</Td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const highlighted = highlightedUserId === user.user_id;
                                    return (
                                        <tr
                                            key={user.user_id}
                                            ref={el => { userRowRefs.current[user.user_id] = el; }}
                                            className={cn('[&:last-child>td]:border-b-0 transition-colors duration-500',
                                                highlighted
                                                    ? (isDark ? 'bg-neutral-800' : 'bg-[#F2F2F2]')
                                                    : (isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-[#FAFAFA]'))}
                                        >
                                            <Td isDark={isDark}>
                                                <span className="flex items-center gap-3">
                                                    <span aria-hidden="true" className={cn('w-9 h-9 flex-none rounded-full flex items-center justify-center font-extrabold text-[13px]',
                                                        isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white')}>
                                                        {user.full_name?.charAt(0).toUpperCase()}
                                                    </span>
                                                    <span className="flex flex-col gap-px min-w-0">
                                                        <span className="font-bold">{user.full_name}</span>
                                                        <span className={cn('text-[12.5px] break-all', t.hint)}>{user.email}</span>
                                                    </span>
                                                </span>
                                            </Td>
                                            <Td isDark={isDark}>
                                                <RolePill isDark={isDark} role={user.role} />
                                            </Td>
                                            <Td isDark={isDark} className={cn('hidden md:table-cell font-techmono text-xs max-w-[200px] [overflow-wrap:anywhere]', t.muted)}>
                                                {user.tenant_id || '-'}
                                            </Td>
                                            <Td isDark={isDark}>
                                                <StatusPill isDark={isDark} tone={user.is_active ? 'green' : 'red'} className="h-6 text-[11.5px]">
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </StatusPill>
                                            </Td>
                                            <Td isDark={isDark}>
                                                <span className="flex gap-0.5 -ml-2">
                                                    <IconButton isDark={isDark} size={32} label={`Edit ${user.full_name}`} onClick={() => handleEditClick(user)} className={actionBtnClass}>
                                                        <Edit2 size={15} aria-hidden="true" />
                                                    </IconButton>
                                                    {canManageCredentials && (
                                                        <IconButton isDark={isDark} size={32} label={`Reset password for ${user.full_name}`} onClick={() => handleResetClick(user)} className={actionBtnClass}>
                                                            <Key size={15} aria-hidden="true" />
                                                        </IconButton>
                                                    )}
                                                    {canManageCredentials && (
                                                        <IconButton isDark={isDark} size={32} label={`Delete ${user.full_name}`} onClick={() => handleDeleteClick(user)}
                                                            className={cn(actionBtnClass, isDark ? 'text-red-400' : 'text-[#B91C1C]')}>
                                                            <Trash2 size={15} aria-hidden="true" />
                                                        </IconButton>
                                                    )}
                                                </span>
                                            </Td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </Table>
                </TableCard>
            </PageContainer>

            {/* Create User Modal */}
            {isCreating && (
                <ModalShell isDark={isDark} titleId="create-user-title" title="Create New User" icon={<UserPlus size={20} />} onClose={() => setIsCreating(false)}>
                    <div className="flex flex-col gap-4">
                        <Field isDark={isDark} label="Full Name" htmlFor="create-full-name" required>
                            <Input
                                isDark={isDark}
                                id="create-full-name"
                                type="text"
                                required
                                autoFocus
                                value={createData.full_name || ''}
                                onChange={(e) => setCreateData({ ...createData, full_name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </Field>
                        <Field isDark={isDark} label="Email" htmlFor="create-email" required>
                            <Input
                                isDark={isDark}
                                id="create-email"
                                type="email"
                                required
                                value={createData.email || ''}
                                onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                                placeholder="john@example.com"
                            />
                        </Field>
                        <Field isDark={isDark} label="Password" htmlFor="create-password" required hint="Minimum 8 characters">
                            <PasswordInput
                                isDark={isDark}
                                id="create-password"
                                value={createData.password || ''}
                                onChange={(v) => setCreateData({ ...createData, password: v })}
                                visible={showPassword}
                                onToggle={() => setShowPassword(!showPassword)}
                            />
                        </Field>
                        <Field
                            isDark={isDark}
                            label="Confirm Password"
                            htmlFor="create-confirm-password"
                            required
                            error={confirmPassword && createData.password !== confirmPassword ? 'Passwords do not match' : null}
                        >
                            <PasswordInput
                                isDark={isDark}
                                id="create-confirm-password"
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                visible={showConfirmPassword}
                                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                                invalid={!!confirmPassword && createData.password !== confirmPassword}
                            />
                        </Field>
                        <Field isDark={isDark} label="Role" htmlFor="create-role">
                            <Select
                                isDark={isDark}
                                id="create-role"
                                value={createData.role}
                                onChange={(e) => setCreateData({ ...createData, role: e.target.value as UserRole })}
                                className={roleSelectClass}
                            >
                                {Object.values(UserRole).map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </Select>
                        </Field>
                        {createData.role !== UserRole.PLATFORM_ADMIN && createData.role !== UserRole.PLATFORM_OPERATOR && (
                            <Field isDark={isDark} label="Tenant ID" htmlFor="create-tenant-id" hint="Required for non-platform users.">
                                <Input
                                    isDark={isDark}
                                    id="create-tenant-id"
                                    type="text"
                                    value={createData.tenant_id || ''}
                                    onChange={(e) => setCreateData({ ...createData, tenant_id: e.target.value })}
                                    placeholder="UUID"
                                    className="font-techmono text-[13px]"
                                />
                            </Field>
                        )}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2.5 pt-1">
                        <Button isDark={isDark} variant="secondary" onClick={() => setIsCreating(false)}>
                            Cancel
                        </Button>
                        <Button isDark={isDark} variant="primary" onClick={handleCreateUser} disabled={saveLoading}>
                            {saveLoading ? 'Creating...' : 'Create User'}
                        </Button>
                    </div>
                </ModalShell>
            )}

            {/* Edit Modal */}
            {editingUser && (
                <ModalShell isDark={isDark} titleId="edit-user-title" title="Edit User" subtitle={editingUser.email} icon={<Edit2 size={18} />} onClose={() => setEditingUser(null)}>
                    <div className="flex flex-col gap-4">
                        <Field isDark={isDark} label="Full Name" htmlFor="edit-full-name">
                            <Input
                                isDark={isDark}
                                id="edit-full-name"
                                type="text"
                                autoFocus
                                value={formData.full_name || ''}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </Field>
                        <Field isDark={isDark} label="Role" htmlFor="edit-role">
                            <Select
                                isDark={isDark}
                                id="edit-role"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                className={roleSelectClass}
                            >
                                {Object.values(UserRole).map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field isDark={isDark} label="Status" htmlFor="edit-status">
                            <Select
                                isDark={isDark}
                                id="edit-status"
                                value={formData.is_active ? 'active' : 'inactive'}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                                className={roleSelectClass}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </Select>
                        </Field>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2.5 pt-1">
                        <Button isDark={isDark} variant="secondary" onClick={() => setEditingUser(null)}>
                            Cancel
                        </Button>
                        <Button isDark={isDark} variant="primary" onClick={handleSaveEdit} disabled={saveLoading}>
                            {saveLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </ModalShell>
            )}

            {/* Delete Modal */}
            {deletingUser && (
                <ModalShell isDark={isDark} titleId="delete-user-title" title="Delete User" icon={<ShieldAlert size={20} />} iconTone="danger" onClose={() => setDeletingUser(null)}>
                    <p className={cn('m-0 text-sm leading-[1.55]', t.muted)}>
                        Are you sure you want to delete <strong className={t.text}>{deletingUser.full_name}</strong>? This action cannot be undone.
                    </p>
                    <div className="flex flex-wrap justify-end gap-2.5">
                        <Button isDark={isDark} variant="secondary" onClick={() => setDeletingUser(null)} autoFocus>
                            Cancel
                        </Button>
                        <Button isDark={isDark} variant="primary" onClick={confirmDelete} disabled={saveLoading} className={dangerBtn}>
                            <Trash2 size={16} aria-hidden="true" />
                            {saveLoading ? 'Deleting...' : 'Delete User'}
                        </Button>
                    </div>
                </ModalShell>
            )}

            {/* Password Reset Modal */}
            {resettingUser && (
                <ModalShell isDark={isDark} titleId="reset-password-title" title="Reset Password" icon={<Key size={20} />} onClose={() => setResettingUser(null)}>
                    {!resetSuccess ? (
                        <>
                            <p className={cn('m-0 text-sm leading-[1.55]', t.muted)}>
                                Set a new password for <strong className={t.text}>{resettingUser.full_name}</strong>.
                            </p>
                            <div className="flex flex-col gap-4">
                                <Field isDark={isDark} label="New Password" htmlFor="reset-new-password" required hint="Minimum 8 characters">
                                    <PasswordInput
                                        isDark={isDark}
                                        id="reset-new-password"
                                        autoFocus
                                        value={newPassword}
                                        onChange={setNewPassword}
                                        visible={showResetPassword}
                                        onToggle={() => setShowResetPassword(!showResetPassword)}
                                    />
                                </Field>
                                <Field
                                    isDark={isDark}
                                    label="Confirm Password"
                                    htmlFor="reset-confirm-password"
                                    required
                                    error={confirmResetPassword && newPassword !== confirmResetPassword ? 'Passwords do not match' : null}
                                >
                                    <PasswordInput
                                        isDark={isDark}
                                        id="reset-confirm-password"
                                        value={confirmResetPassword}
                                        onChange={setConfirmResetPassword}
                                        visible={showConfirmResetPassword}
                                        onToggle={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                                        invalid={!!confirmResetPassword && newPassword !== confirmResetPassword}
                                    />
                                </Field>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2.5 pt-1">
                                <Button isDark={isDark} variant="secondary" onClick={() => setResettingUser(null)}>
                                    Cancel
                                </Button>
                                <Button
                                    isDark={isDark}
                                    variant="primary"
                                    onClick={handleConfirmResetPassword}
                                    disabled={saveLoading || !newPassword || newPassword !== confirmResetPassword}
                                >
                                    {saveLoading ? 'Resetting...' : 'Reset Password'}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col gap-5 text-center">
                            <span className={cn('w-14 h-14 rounded-full flex items-center justify-center mx-auto border',
                                isDark ? 'bg-green-500/10 text-green-300 border-green-500/30' : 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]')}>
                                <Check size={28} aria-hidden="true" />
                            </span>
                            <div className="flex flex-col gap-1.5" role="status">
                                <h4 className={cn('m-0 text-base font-extrabold', t.text)}>Password Reset Successful</h4>
                                <p className={cn('m-0 text-sm leading-[1.55]', t.muted)}>
                                    The password for <strong className={t.text}>{resettingUser.full_name}</strong> has been updated.
                                </p>
                            </div>
                            <div className={cn('p-3 pl-4 rounded-xl border flex items-center justify-between gap-3 text-left', t.soft, isDark ? 'border-neutral-800' : 'border-[#E5E5E5]')}>
                                <code className={cn('font-techmono text-[15px] break-all', t.text)}>{resetPasswordResult}</code>
                                <IconButton isDark={isDark} label="Copy Password" size={36} onClick={() => copyToClipboard(resetPasswordResult)}>
                                    <Copy size={16} aria-hidden="true" />
                                </IconButton>
                            </div>
                            <Button isDark={isDark} variant="primary" className="w-full" onClick={() => setResettingUser(null)}>
                                Done
                            </Button>
                        </div>
                    )}
                </ModalShell>
            )}
        </AdminLayout>
    );
};
