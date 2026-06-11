export type IconPath = {
  readonly d: string;
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: string;
  readonly strokeLinecap?: 'butt' | 'round' | 'square';
  readonly strokeLinejoin?: 'arcs' | 'bevel' | 'miter' | 'miter-clip' | 'round';
};

export type IconDefinition = {
  readonly viewBox: string;
  readonly fill?: string;
  readonly paths: readonly IconPath[];
};

const icon = (definition: IconDefinition): IconDefinition => definition;

const strokeIcon = (paths: readonly IconPath[]): IconDefinition => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  paths,
});

const strokePath = (
  d: string,
  attrs: Omit<IconPath, 'd' | 'stroke' | 'strokeWidth'> = {},
): IconPath => ({
  d,
  stroke: 'currentColor',
  strokeWidth: '1.8',
  ...attrs,
});

export const ICONS = {
  'studyhub-file': icon({
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    paths: [
      {
        d: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
      },
    ],
  }),
  home: strokeIcon([
    strokePath('M4 11.5 12 4l8 7.5', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
    strokePath('M6 10.5V20h12v-9.5M10 20v-5h4v5', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  ]),
  search: strokeIcon([
    strokePath('m21 21-4.4-4.4M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z', {
      strokeLinecap: 'round',
    }),
  ]),
  document: strokeIcon([
    strokePath('M7 3h7l4 4v14H7V3Z', {
      strokeLinejoin: 'round',
    }),
    strokePath('M14 3v5h5M9 13h6M9 17h4', {
      strokeLinecap: 'round',
    }),
  ]),
  upload: strokeIcon([
    strokePath('M12 15V4m0 0 4 4m-4-4-4 4', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
    strokePath('M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4', {
      strokeLinecap: 'round',
    }),
  ]),
  filters: strokeIcon([
    strokePath('M4 7h16M7 12h10M10 17h4', {
      strokeLinecap: 'round',
    }),
  ]),
  users: strokeIcon([
    strokePath('M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z'),
    strokePath(
      'M4 20a8 8 0 0 1 16 0M18 9.5a3 3 0 0 1 2.6 4.5M6 9.5A3 3 0 0 0 3.4 14',
      {
        strokeLinecap: 'round',
      },
    ),
  ]),
  'shield-check': strokeIcon([
    strokePath('M12 3 4 7v5c0 5 3.4 8.7 8 9 4.6-.3 8-4 8-9V7l-8-4Z', {
      strokeLinejoin: 'round',
    }),
    strokePath('m8.5 12 2.2 2.2 4.8-5', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  ]),
  mail: strokeIcon([
    strokePath('m4 7 8 6 8-6', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
    strokePath(
      'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
    ),
  ]),
  check: strokeIcon([
    strokePath('m5 12 4 4L19 6', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  ]),
  sparkles: strokeIcon([
    strokePath('M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
    strokePath('M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15ZM5 4l.7 1.8L8 6.5l-2.3.7L5 9l-.7-1.8L2 6.5l2.3-.7L5 4Z', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  ]),
  'alert-triangle': strokeIcon([
    strokePath(
      'M12 8v5m0 4h.01M10.3 4.3 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z',
      {
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    ),
  ]),
  'arrow-up': strokeIcon([
    strokePath('M12 19V5m0 0-5 5m5-5 5 5', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  ]),
  'arrow-down': strokeIcon([
    strokePath('M12 5v14m0 0-5-5m5 5 5-5', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  ]),
  'message-circle': strokeIcon([
    strokePath(
      'M21 11.5a8.4 8.4 0 0 1-9 8.4 8.7 8.7 0 0 1-3.8-.9L3 20l1.2-4.6A8.3 8.3 0 0 1 3 11.5a8.5 8.5 0 0 1 18 0Z',
      {
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    ),
  ]),
  download: strokeIcon([
    strokePath('M12 4v11m0 0 4-4m-4 4-4-4', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
    strokePath('M5 19h14', {
      strokeLinecap: 'round',
    }),
  ]),
  trash: strokeIcon([
    strokePath('M4 7h16', {
      strokeLinecap: 'round',
    }),
    strokePath('M10 11v6m4-6v6', {
      strokeLinecap: 'round',
    }),
    strokePath('M6 7l1 14h10l1-14M9 7V4h6v3', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  ]),
  'log-out': strokeIcon([
    strokePath('M10 17l5-5-5-5', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
    strokePath('M15 12H3M21 5v14', {
      strokeLinecap: 'round',
    }),
  ]),
  'chevron-left': strokeIcon([
    strokePath('m15 18-6-6 6-6', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  ]),
  'chevron-right': strokeIcon([
    strokePath('m9 18 6-6-6-6', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  ]),
  user: strokeIcon([
    strokePath('M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z'),
    strokePath('M4 21a8 8 0 0 1 16 0', {
      strokeLinecap: 'round',
    }),
  ]),
  trophy: strokeIcon([
    strokePath('M8 4h8v3a4 4 0 0 1-8 0V4Z', {
      strokeLinejoin: 'round',
    }),
    strokePath(
      'M8 6H5a2 2 0 0 0 2 4h1m8-4h3a2 2 0 0 1-2 4h-1M12 11v5m-3 4h6m-5-4h4',
      {
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    ),
  ]),
  clock: strokeIcon([
    strokePath('M12 8v5l3 2', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
    strokePath('M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'),
  ]),
  flame: strokeIcon([
    strokePath(
      'M12 22c3.3 0 6-2.4 6-5.9 0-2.4-1.3-4.4-3.2-5.7.2 1.8-.7 3.1-1.9 3.9.2-3.4-1.4-6.2-4-8.3.4 3.2-1.7 4.8-2.9 6.6A6.6 6.6 0 0 0 5 16.1C5 19.6 8.1 22 12 22Z',
      {
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    ),
  ]),
  sun: strokeIcon([
    strokePath(
      'M12 4V2m0 20v-2M4.93 4.93 3.52 3.52m16.96 16.96-1.41-1.41M4 12H2m20 0h-2M4.93 19.07l-1.41 1.41M20.48 3.52l-1.41 1.41',
      {
        strokeLinecap: 'round',
      },
    ),
    strokePath('M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z'),
  ]),
  moon: strokeIcon([
    strokePath('M20.3 14.4A7.7 7.7 0 0 1 9.6 3.7 8.4 8.4 0 1 0 20.3 14.4Z', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  ]),
} as const satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof ICONS;
