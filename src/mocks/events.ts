import type { Event } from '@/types/domain';
import { formatCents, type MoneyInCents } from '@/utils/money';

/**
 * Mock event data. `VENUE_EVENT_IDS` on each bar points at the in-house events;
 * the rest surface in the "Eventos" tab of the ROLÊ feed.
 *
 * Schedules are authored as offsets from the current day rather than as fixed
 * calendar dates. Hard-coded 2026 dates would leave "Hoje" and "Fim de semana"
 * permanently empty, so the filters could never be seen working. The display
 * strings are derived from those instants, which keeps one source of truth —
 * previously `date`/`time`/`price` were free text that nothing validated.
 */

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Local midnight of today, used as the anchor for every offset. */
function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Builds a local instant `dayOffset` days from today at `hour:minute`. */
function at(dayOffset: number, hour: number, minute = 0): Date {
  const base = today();
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset, hour, minute);
}

/** Days until the next Saturday (0 when today is already Saturday). */
function daysUntilSaturday(): number {
  return (6 - today().getDay() + 7) % 7;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function timeLabel(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface AuthoredEvent {
  id: string;
  name: string;
  start: Date;
  end: Date;
  location: string;
  priceFromInCents: MoneyInCents;
  about: string;
  image: Event['image'];
  coordinate?: Event['coordinate'];
  /** In-house events show the weekday in their date label. */
  withWeekday?: boolean;
}

function build(authored: AuthoredEvent): Event {
  const { start, end } = authored;

  const dayPart = `${start.getDate()} ${MONTHS[start.getMonth()]}`;
  const date = authored.withWeekday
    ? `${WEEKDAYS[start.getDay()]}, ${dayPart} • ${timeLabel(start)}`
    : `${dayPart} • ${timeLabel(start)}`;

  return {
    id: authored.id,
    name: authored.name,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    priceFromInCents: authored.priceFromInCents,
    date,
    time: `${timeLabel(start)} - ${timeLabel(end)}`,
    price:
      authored.priceFromInCents === 0
        ? 'Entrada gratuita'
        : `A partir de ${formatCents(authored.priceFromInCents)}`,
    location: authored.location,
    about: authored.about,
    image: authored.image,
    ...(authored.coordinate ? { coordinate: authored.coordinate } : {}),
  };
}

const SATURDAY = daysUntilSaturday();

export const EVENTS: Event[] = [
  build({
    id: 'kommander-of-kaos-iv',
    name: 'FESTIVAL KOMMANDER OF KAOS IV',
    // Runs past midnight, which exercises the "today" rule for events in progress.
    start: at(0, 15, 0),
    end: at(0, 23, 50),
    location: 'Av. Santos Dumont, Anil',
    priceFromInCents: 5_000,
    about:
      'Evento underground que celebra sua 4ª edição reunindo bandas autorais, DJs e food trucks. Ambiente open air com estrutura completa.',
    image: 'forest',
    coordinate: { latitude: -2.5423, longitude: -44.2601 },
  }),
  build({
    id: 'sunset-underground',
    name: 'Sunset Underground',
    start: at(SATURDAY, 18, 0),
    end: at(SATURDAY, 23, 0),
    location: 'Espigão Costeiro, Ponta d’Areia',
    priceFromInCents: 3_000,
    about: 'Festa ao pôr do sol com line-up de música eletrônica e vista para o mar.',
    image: 'violet',
    coordinate: { latitude: -2.4919, longitude: -44.3053 },
  }),
  build({
    id: 'noite-samba-de-raiz',
    name: 'Noite de Samba de Raiz',
    start: at(SATURDAY + 1, 20, 0),
    end: at(SATURDAY + 2, 2, 0),
    location: 'Praça Nauro Machado, Centro',
    priceFromInCents: 0,
    about: 'Roda de samba com grupos convidados no coração do Centro Histórico.',
    image: 'rust',
    coordinate: { latitude: -2.5288, longitude: -44.3068 },
  }),

  // In-house events, surfaced inside the venue detail carousel.
  build({
    id: 'karaoke-fernanda-silva',
    name: 'Karaokê com Fernanda Silva',
    start: at(2, 21, 0),
    end: at(3, 1, 0),
    location: 'No local do bar',
    priceFromInCents: 0,
    about: 'Noite de karaokê com prêmios para as melhores apresentações.',
    image: 'green',
    withWeekday: true,
  }),
  build({
    id: 'samba-de-raiz-ao-vivo',
    name: 'Samba de Raiz ao Vivo',
    start: at(SATURDAY, 20, 0),
    end: at(SATURDAY + 1, 0, 0),
    location: 'No local do bar',
    priceFromInCents: 2_000,
    about: 'Grupo de samba ao vivo animando a noite.',
    image: 'amber',
    withWeekday: true,
  }),
  build({
    id: 'noite-do-sertanejo',
    name: 'Noite do Sertanejo',
    start: at(5, 22, 0),
    end: at(6, 2, 0),
    location: 'No local do bar',
    priceFromInCents: 1_500,
    about: 'O melhor do sertanejo com dupla convidada.',
    image: 'plum',
    withWeekday: true,
  }),
];

/** Events listed in the ROLÊ feed's "Eventos" tab. */
export const FEED_EVENT_IDS = ['kommander-of-kaos-iv', 'sunset-underground', 'noite-samba-de-raiz'];

/** Events every venue hosts on-site. */
export const VENUE_EVENT_IDS = [
  'karaoke-fernanda-silva',
  'samba-de-raiz-ao-vivo',
  'noite-do-sertanejo',
];
