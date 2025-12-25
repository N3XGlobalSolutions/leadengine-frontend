import React from 'react';
import { useParams } from 'react-router-dom';
import { useTenantConfig } from '../hooks/useTenantConfig';

export const DashboardPage = () => {
    const { clientSlug } = useParams<{ clientSlug: string }>();
    const { config, loading } = useTenantConfig(clientSlug);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!config) {
        return <div>Client not found</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{config.companyName} Dashboard</h1>
                    <p className="text-gray-500">Analytics and Leads for {config.shortName}</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Total Leads</h3>
                        <p className="text-3xl font-bold text-indigo-600 mt-2">124</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Qualified</h3>
                        <p className="text-3xl font-bold text-emerald-600 mt-2">45</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Scheduled Calls</h3>
                        <p className="text-3xl font-bold text-blue-600 mt-2">12</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
