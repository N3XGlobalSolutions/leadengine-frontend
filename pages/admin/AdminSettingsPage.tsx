import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Moon, Save, Shield, Mail } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { PageContainer, PageHeader, Card, Field, Input, Button, Switch, Mark, tone } from '../../components/admin/ui/kit';
import { cn } from '../../utils/cn';

/** Card title with the 34px grey icon tile (design `.h2` + tile). */
const SectionTitle: React.FC<{ isDark: boolean; icon: React.ReactNode; children: React.ReactNode }> = ({ isDark, icon, children }) => (
    <h2 className={cn('m-0 flex items-center gap-3 text-[18px] font-extrabold tracking-[-0.02em]', tone(isDark).text)}>
        <span className={cn('w-[34px] h-[34px] flex-none rounded-[10px] flex items-center justify-center', tone(isDark).subtle, tone(isDark).text)}>
            {icon}
        </span>
        {children}
    </h2>
);

/** Setting row: 14px/700 title + 12.5px hint on the left, control on the right. */
const SettingRow: React.FC<{ isDark: boolean; title: string; description: string; children: React.ReactNode }> = ({ isDark, title, description, children }) => (
    <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className={cn('text-sm font-bold', tone(isDark).text)}>{title}</span>
            <span className={cn('text-[12.5px] leading-[1.5]', tone(isDark).hint)}>{description}</span>
        </span>
        {children}
    </div>
);

export const AdminSettingsPage = () => {
    const { user } = useAdminAuth();
    const { isDark, toggleTheme } = useAdminTheme();
    const navigate = useNavigate();

    // Mock States for form inputs
    const [fullName, setFullName] = useState(user?.full_name || 'Admin User');
    const [email, setEmail] = useState(user?.email || 'admin@example.com');
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        marketing: false
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock save
        alert('Settings saved successfully!');
    };

    const iconProps = { size: 17, strokeWidth: 1.9, 'aria-hidden': true } as const;

    return (
        <AdminLayout breadcrumb={[{ label: 'Platform' }, { label: 'Settings' }]}>
            <PageContainer className="max-w-[900px]">
                <PageHeader
                    isDark={isDark}
                    eyebrow="Platform"
                    title={<Mark isDark={isDark}>Settings</Mark>}
                    description="Manage your account preferences and system settings."
                />

                {/* Profile Section */}
                <Card isDark={isDark}>
                    <SectionTitle isDark={isDark} icon={<User {...iconProps} />}>Profile Information</SectionTitle>
                    <form onSubmit={handleSave} className="flex flex-col gap-[18px]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <Field isDark={isDark} label="Full Name" htmlFor="settings-full-name">
                                <Input
                                    isDark={isDark}
                                    id="settings-full-name"
                                    type="text"
                                    autoComplete="name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </Field>
                            <Field isDark={isDark} label="Email Address" htmlFor="settings-email">
                                <div className={cn(
                                    'flex items-center gap-2 h-[46px] px-3.5 rounded-[10px] border-[1.5px] transition-shadow focus-within:ring-[3px]',
                                    isDark
                                        ? 'bg-neutral-950 border-neutral-700 focus-within:border-white focus-within:ring-white/15'
                                        : 'bg-white border-[#E5E5E5] focus-within:border-[#111111] focus-within:ring-black/10',
                                )}>
                                    <Mail size={16} strokeWidth={1.8} aria-hidden="true" className={cn('flex-none', tone(isDark).hint)} />
                                    <input
                                        id="settings-email"
                                        type="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={cn(
                                            'flex-1 min-w-0 border-none outline-none bg-transparent text-sm font-medium',
                                            isDark ? 'text-white placeholder-neutral-500' : 'text-[#0A0A0A] placeholder-[#A3A3A3]',
                                        )}
                                    />
                                </div>
                            </Field>
                        </div>
                        <Button isDark={isDark} variant="primary" type="submit" className="self-stretch sm:self-end">
                            <Save size={15} strokeWidth={2} aria-hidden="true" />
                            Save Changes
                        </Button>
                    </form>
                </Card>

                {/* Appearance Section */}
                <Card isDark={isDark}>
                    <SectionTitle isDark={isDark} icon={<Moon {...iconProps} />}>Appearance</SectionTitle>
                    <SettingRow isDark={isDark} title="Dark Mode" description="Adjust the appearance of the admin panel to reduce eye strain.">
                        <Switch isDark={isDark} on={isDark} onToggle={toggleTheme} label="Dark Mode" />
                    </SettingRow>
                </Card>

                {/* Notifications Section */}
                <Card isDark={isDark}>
                    <SectionTitle isDark={isDark} icon={<Bell {...iconProps} />}>Notifications</SectionTitle>
                    {[
                        { id: 'email', label: 'Email Notifications', desc: 'Receive daily summaries and alerts via email.' },
                        { id: 'push', label: 'Push Notifications', desc: 'Get real-time browser alerts for new leads.' },
                        { id: 'marketing', label: 'Marketing Updates', desc: 'Receive news about new features and promotions.' }
                    ].map((item) => {
                        const key = item.id as keyof typeof notifications;
                        return (
                            <SettingRow key={item.id} isDark={isDark} title={item.label} description={item.desc}>
                                <Switch
                                    isDark={isDark}
                                    on={notifications[key]}
                                    onToggle={() => setNotifications({ ...notifications, [key]: !notifications[key] })}
                                    label={item.label}
                                />
                            </SettingRow>
                        );
                    })}
                </Card>

                {/* Security Section (Mock) */}
                <Card isDark={isDark}>
                    <SectionTitle isDark={isDark} icon={<Shield {...iconProps} />}>Security</SectionTitle>
                    <SettingRow isDark={isDark} title="Password" description="Last changed 3 months ago">
                        <Button
                            isDark={isDark}
                            variant="secondary"
                            className="min-h-[40px] text-[13px]"
                            onClick={() => navigate(`/admin/users?highlight=${user?.user_id}`)}
                        >
                            Change Password
                        </Button>
                    </SettingRow>
                </Card>
            </PageContainer>
        </AdminLayout>
    );
};
