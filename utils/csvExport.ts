import { DashboardLead } from '../types/admin';
import { formatBookingDateTime, getCallBooking } from './bookingFormat';

// Metadata keys exported with a readable value/label instead of raw JSON
const CALL_BOOKING_KEY = 'call_booking';

export const exportLeadsToCSV = (leads: DashboardLead[], clientName: string) => {
    // 1. Gather all unique metadata/captured data keys to create separate columns
    const metaKeysMap = new Map<string, string>(); // key in metadata -> column header label
    
    leads.forEach(lead => {
        if (lead.metadata) {
            const isS3Mapping = !!(lead.metadata as any).s3_mapping_lead_output;
            const hiddenKeys = new Set([
                's3_mapping_lead_output', 's2_lead_output', 's3_lead_output', 's3_max_lead_output', 
                's3_international_lead_output', 'email', 'phone', '_s3_priority', '_s2_priority',
                ...(isS3Mapping ? ['lead_priority', 'source'] : []),
            ]);
            
            Object.entries(lead.metadata).forEach(([key, value]) => {
                if (hiddenKeys.has(key)) return;

                if (key === CALL_BOOKING_KEY) {
                    metaKeysMap.set(key, 'Call Booked');
                } else if (typeof value === 'object' && value !== null && 'label' in value) {
                    const label = (value as any).label || key;
                    metaKeysMap.set(key, label);
                } else {
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    metaKeysMap.set(key, label);
                }
            });
        }
    });

const dynamicMetaKeys = Array.from(metaKeysMap.keys()).sort((a, b) => {
    const sampleLead = leads.find(
        lead => lead.metadata?.[a] || lead.metadata?.[b]
    );

    const orderA = sampleLead?.metadata?.[a]?.order ?? 999;
    const orderB = sampleLead?.metadata?.[b]?.order ?? 999;

    return orderA - orderB;
});


    const dynamicHeaders = dynamicMetaKeys.map(k => metaKeysMap.get(k) || k);

    // 2. Define headers
    const headers = [
        'Lead Name',
        'Status',
        'Priority',
        'Email',
        'Phone',
        'Captured Date',
        ...dynamicHeaders
    ];

    // Helper to escape CSV cell values
    const escapeCSVValue = (val: any) => {
        if (val === undefined || val === null) return '';
        let strVal = '';
        if (typeof val === 'object' && val !== null && 'answer' in val) {
            strVal = String(val.answer || '');
        } else if (typeof val === 'object') {
            strVal = JSON.stringify(val);
        } else {
            strVal = String(val);
        }
        // Escape quotes by doubling them, wrap in quotes
        return `"${strVal.replace(/"/g, '""')}"`;
    };

    // 3. Map leads to rows
    const rows = leads.map(lead => {
        const leadPriority = (lead as any).metadata?.s3_mapping_lead_output?.lead_priority ||
            (lead as any).metadata?.s3_max_lead_output?.lead_priority ||
            (lead as any).metadata?.s3_lead_output?.lead_priority ||
            (lead as any).metadata?.s2_lead_output?.lead_priority ||
            (lead as any).metadata?._s3_priority ||
            (lead as any).metadata?._s2_priority ||
            '—';

        const rowData = [
            escapeCSVValue(lead.name),
            escapeCSVValue(lead.status),
            escapeCSVValue(leadPriority),
            escapeCSVValue(lead.email),
            escapeCSVValue(lead.phone),
            escapeCSVValue(new Date(lead.created_at).toLocaleString()),
        ];

        // Add values for dynamic metadata keys
        dynamicMetaKeys.forEach(key => {
            if (key === CALL_BOOKING_KEY) {
                const booking = getCallBooking(lead);
                rowData.push(escapeCSVValue(
                    booking ? `${formatBookingDateTime(booking.start_time, booking.timezone)} (${booking.timezone})` : ''
                ));
                return;
            }
            const val = lead.metadata ? lead.metadata[key] : undefined;
            rowData.push(escapeCSVValue(val));
        });

        return rowData.join(',');
    });

    // 4. Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // 5. Create Blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${clientName.replace(/\s+/g, '_')}_leads.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
