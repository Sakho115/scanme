export type EventCode =
  | 'CODE_CRUSADE'
  | 'LOGIC_ARENA'
  | 'UIUX_STUDIO'
  | 'TECH_TACTICS'
  | 'PIXEL_PULSE';

export type EventSlug =
  | 'code-crusade'
  | 'logic-arena'
  | 'uiux-studio'
  | 'tech-tactics'
  | 'pixel-pulse';

export interface VyugamEvent {
  id: string;
  code: EventCode;
  slug: EventSlug;
  name: string;
  description: string;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
}

export const VYUGAM_EVENTS: VyugamEvent[] = [
  {
    id: 'e1000000-0000-0000-0000-000000000001',
    code: 'CODE_CRUSADE',
    slug: 'code-crusade',
    name: 'Code Crusade',
    description: 'Flagship competitive programming and algorithmic problem solving challenge.',
    status: 'ACTIVE'
  },
  {
    id: 'e2000000-0000-0000-0000-000000000002',
    code: 'LOGIC_ARENA',
    slug: 'logic-arena',
    name: 'Logic Arena',
    description: 'Fast-paced technical aptitude, debugging, and computational logic battle.',
    status: 'ACTIVE'
  },
  {
    id: 'e3000000-0000-0000-0000-000000000003',
    code: 'UIUX_STUDIO',
    slug: 'uiux-studio',
    name: 'UI/UX Studio',
    description: 'Rapid product design, wireframing, and user experience prototyping arena.',
    status: 'ACTIVE'
  },
  {
    id: 'e4000000-0000-0000-0000-000000000004',
    code: 'TECH_TACTICS',
    slug: 'tech-tactics',
    name: 'Tech Tactics',
    description: 'Strategic technology case-study, architecture, and paper presentation.',
    status: 'ACTIVE'
  },
  {
    id: 'e5000000-0000-0000-0000-000000000005',
    code: 'PIXEL_PULSE',
    slug: 'pixel-pulse',
    name: 'Pixel Pulse',
    description: 'Creative digital multimedia design, motion graphics, and visual effects showcase.',
    status: 'ACTIVE'
  }
];

export function getEventBySlug(slug: string): VyugamEvent | undefined {
  const clean = slug.toLowerCase().trim();
  return VYUGAM_EVENTS.find(e => e.slug === clean);
}

export function getEventByCode(code: string): VyugamEvent | undefined {
  const clean = code.toUpperCase().trim();
  return VYUGAM_EVENTS.find(e => e.code === clean);
}

export function getEventById(id: string): VyugamEvent | undefined {
  return VYUGAM_EVENTS.find(e => e.id === id);
}
