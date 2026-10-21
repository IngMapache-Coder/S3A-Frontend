function parseUtcDate(dateStr?: string | null): Date {
  if (!dateStr) return new Date();
  const iso = dateStr.includes('T')
    ? (dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`)
    : `${dateStr.replace(' ', 'T')}Z`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date(dateStr) : d;
}

export function formatColombiaTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  return parseUtcDate(dateStr).toLocaleTimeString('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatColombiaDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  return parseUtcDate(dateStr).toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatColombiaDateTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  return parseUtcDate(dateStr).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getColombiaHeaderDate(): string {
  const str = new Date().toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return str.charAt(0).toUpperCase() + str.slice(1);
}
