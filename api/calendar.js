// api/calendar.js
// Route serverless Vercel : va chercher les RDV sur le CRM, filtre sur closer.id === 14,
// et renvoie un fichier .ics que Apple Calendar peut lire en abonnement.

export default async function handler(req, res) {
  try {
    const token = process.env.CRM_TOKEN;
    if (!token) {
      res.status(500).send('CRM_TOKEN manquant dans les variables d\'environnement Vercel');
      return;
    }

    // Fenêtre de dates : on prend large (30 jours en arrière, 90 jours en avant)
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    const end = new Date(now);
    end.setDate(end.getDate() + 90);

    const fmt = (d) => d.toISOString().split('T')[0];

    const url = `https://ctrlflow.controleweb.fr/api/crm/agenda/all-rdv?start=${fmt(start)}&end=${fmt(end)}`;

    const crmResponse = await fetch(url, {
      headers: {
        authorization: `Bearer ${token}`,
        'x-company-id': 'miro',
        accept: '*/*',
      },
    });

    if (!crmResponse.ok) {
      res.status(502).send(`Erreur CRM: ${crmResponse.status} ${crmResponse.statusText}`);
      return;
    }

    const data = await crmResponse.json();
    const events = (data.events || []).filter(
      (e) => e.kind === 'closing' && e.closer && e.closer.id === 14
    );

    const ics = buildIcs(events);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="miro-agenda.ics"');
    res.status(200).send(ics);
  } catch (err) {
    res.status(500).send(`Erreur serveur: ${err.message}`);
  }
}

function toIcsDate(isoString) {
  // "2026-07-06T08:00:00+02:00" -> "20260706T080000" (heure locale, sans Z)
  // On garde l'heure telle quelle et on la marque comme locale (pas UTC)
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

function escapeIcsText(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function buildIcs(events) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MIRO Agenda Sync//Adrien//FR',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:MIRO RDV (Adrien)',
  ];

  for (const e of events) {
    const uid = `${e.id}@miro-agenda-sync`;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${toIcsDate(new Date().toISOString())}`);
    lines.push(`DTSTART:${toIcsDate(e.start)}`);
    lines.push(`DTEND:${toIcsDate(e.end)}`);
    lines.push(`SUMMARY:${escapeIcsText(e.name)}`);
    if (e.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(e.description)}`);
    }
    if (e.location) {
      lines.push(`LOCATION:${escapeIcsText(e.location)}`);
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
