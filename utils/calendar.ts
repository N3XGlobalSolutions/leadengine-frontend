/**
 * Minimal iCalendar (RFC 5545) export so a visitor can add a booked call to their own calendar.
 * Times are written in UTC, so every calendar app shows them in the viewer's local time.
 */

export interface IcsEvent {
    uid: string;          // stable id, e.g. the booking's meeting_id
    title: string;
    description?: string;
    start: string | Date; // ISO string with offset, or Date
    end: string | Date;
    url?: string;         // e.g. a meeting link
    location?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 20261126T090000Z */
const toIcsUtc = (value: string | Date): string => {
    const d = value instanceof Date ? value : new Date(value);
    return (
        `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
        `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
    );
};

/** TEXT values escape backslash, semicolon, comma and newlines. */
const escapeText = (value: string): string =>
    value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Lines longer than 75 octets are folded: CRLF + a single space, then the rest. */
const foldLine = (line: string): string => {
    const encoder = new TextEncoder();
    const chunks: string[] = [];
    let current = '';
    let bytes = 0;
    for (const char of line) {
        const size = encoder.encode(char).length;
        if (bytes + size > 75) {
            chunks.push(current);
            current = ' ' + char;
            bytes = 1 + size;
        } else {
            current += char;
            bytes += size;
        }
    }
    chunks.push(current);
    return chunks.join('\r\n');
};

export const buildIcs = ({ uid, title, description, start, end, url, location }: IcsEvent): string => {
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//LeadEngine//Chat Booking//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid.includes('@') ? uid : `${uid}@leadengine`}`,
        `DTSTAMP:${toIcsUtc(new Date())}`,
        `DTSTART:${toIcsUtc(start)}`,
        `DTEND:${toIcsUtc(end)}`,
        `SUMMARY:${escapeText(title)}`,
    ];
    if (description) lines.push(`DESCRIPTION:${escapeText(description)}`);
    if (location) lines.push(`LOCATION:${escapeText(location)}`);
    if (url) lines.push(`URL:${url}`);
    lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeText(title)}`,
        'TRIGGER:-PT15M',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    );
    return lines.map(foldLine).join('\r\n') + '\r\n';
};

/** Save the .ics through a temporary link; phones hand it to the calendar app. */
export const downloadIcs = (filename: string, ics: string): void => {
    const name = filename.toLowerCase().endsWith('.ics') ? filename : `${filename}.ics`;
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Give the browser a moment to start the download before releasing the blob
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
