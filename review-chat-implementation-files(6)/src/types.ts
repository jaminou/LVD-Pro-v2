export type Category = 'alarm' | 'fire' | 'cctv' | 'sound' | 'automation' | 'tv' | 'data' | 'sprinkler';

export const CATEGORY_COLORS: Record<Category, string> = {
  alarm: '#ef4444',
  fire: '#f97316',
  cctv: '#3b82f6',
  sound: '#8b5cf6',
  automation: '#22c55e',
  tv: '#06b6d4',
  data: '#eab308',
  sprinkler: '#e11d48',
};

export const DEFAULT_CATEGORY_COLORS: Record<Category, string> = { ...CATEGORY_COLORS };

export const CATEGORY_LABELS: Record<Category, string> = {
  alarm: '🔴 Alarm',
  fire: '🔥 Fire',
  cctv: '📹 CCTV',
  sound: '🔊 Sound',
  automation: '⚡ Auto',
  tv: '📺 TV',
  data: '🌐 Data',
  sprinkler: '🚿 F.Sprk',
};

export type CableType = 'alarm' | 'fire' | 'cctv' | 'sound' | 'automation' | 'cat6' | 'fiber' | 'coax' | 'speaker' | 'power';

export const CABLE_COLORS: Record<CableType, string> = {
  alarm: '#ef4444',
  fire: '#f97316',
  cctv: '#3b82f6',
  sound: '#8b5cf6',
  automation: '#22c55e',
  cat6: '#06b6d4',
  fiber: '#f59e0b',
  coax: '#6b7280',
  speaker: '#ec4899',
  power: '#000000',
};

export const CABLE_LABELS: Record<CableType, string> = {
  alarm: 'Alarm Cable',
  fire: 'Fire Cable',
  cctv: 'CCTV Cable',
  sound: 'Sound Cable',
  automation: 'Automation Cable',
  cat6: 'Cat6 Network',
  fiber: 'Fiber Optic',
  coax: 'Coax Cable',
  speaker: 'Speaker Wire',
  power: 'Power Cable',
};

export const CABLE_DASH: Record<CableType, string> = {
  alarm: '',
  fire: '8,4',
  cctv: '',
  sound: '4,4',
  automation: '12,4,4,4',
  cat6: '',
  fiber: '2,4',
  coax: '8,2',
  speaker: '6,6',
  power: '',
};

// ═══ SPRINKLER PIPE SYSTEM ═══
export type PipeSize = '3/4"' | '1"' | '1-1/4"' | '1-1/2"' | '2"' | '2-1/2"' | '3"' | '4"' | '6"' | '8"';
export type PipeStyle = 'hollow' | 'filled';
export type FittingType = 'elbow90' | 'elbow45' | 'tee' | 'cross' | 'reducer' | 'coupler' | 'cap' | 'union' | 'flange' | 'valve';

export const PIPE_SIZES: Record<PipeSize, number> = {
  '3/4"': 3,
  '1"': 4,
  '1-1/4"': 5,
  '1-1/2"': 6,
  '2"': 8,
  '2-1/2"': 10,
  '3"': 12,
  '4"': 14,
  '6"': 18,
  '8"': 22,
};

export const PIPE_COLORS: Record<string, string> = {
  main: '#dc2626',
  branch: '#ef4444',
  riser: '#b91c1c',
  crossmain: '#991b1b',
  custom: '#f87171',
};

export const FITTING_LABELS: Record<FittingType, string> = {
  elbow90: '90° Elbow',
  elbow45: '45° Elbow',
  tee: 'Tee',
  cross: 'Cross',
  reducer: 'Reducer',
  coupler: 'Coupler',
  cap: 'Cap',
  union: 'Union',
  flange: 'Flange',
  valve: 'Valve',
};

export interface SprinklerPipe {
  uid: string;
  points: { x: number; y: number }[];
  size: PipeSize;
  style: PipeStyle;
  color: string;
  label: string;
  showLength: boolean;
}

export interface PipeFitting {
  uid: string;
  type: FittingType;
  x: number;
  y: number;
  rotation: number;
  size: PipeSize;
  style: PipeStyle;
  color: string;
  connectedPipes: string[];
}

export type IconSize = 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl';

export const ICON_SIZES: Record<IconSize, number> = {
  xs: 20,
  s: 32,
  m: 48,
  l: 64,
  xl: 96,
  xxl: 128,
};

export type DisplayMode = 'icon' | 'name' | 'both';

export interface PlacedElement {
  uid: string;
  defId: string;
  x: number;
  y: number;
  rotation: number;
  label: string;
  labelOffsetX: number;
  labelOffsetY: number;
  notes: string;
  size: IconSize;
  labelSize: string;
  display: DisplayMode;
  number: number;
  zIndex: number;
}

export interface Cable {
  uid: string;
  type: CableType;
  points: { x: number; y: number }[];
  color: string;
  curved: boolean;
  showLength: boolean;
}

export interface PlacedLabel {
  uid: string;
  type: string;
  prefix: string;
  number: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

export interface MeasureLine {
  uid: string;
  points: { x: number; y: number }[];
  color: string;
}

export interface Drawing {
  uid: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface TextAnnotation {
  uid: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
}

export interface Stamp {
  title: string;
  company: string;
  author: string;
  date: string;
  revision: string;
  x: number;
  y: number;
}

export interface Group {
  uid: string;
  name: string;
  elementIds: string[];
}

export interface ElementDef {
  id: string;
  name: string;
  shortName: string;
  category: Category;
  icon?: string;
  description?: string;
}

export interface LabelPreset {
  type: string;
  prefix: string;
  color: string;
  increment: number;
  incrementMode: 'one-up' | 'two-up' | 'ten-up';
  startNumber?: number;
}

export const DEFAULT_LABEL_PRESETS: LabelPreset[] = [
  { type: 'zone', prefix: 'Zone', color: '#3b82f6', increment: 1, incrementMode: 'one-up' },
  { type: 'area', prefix: 'Area', color: '#22c55e', increment: 1, incrementMode: 'one-up' },
  { type: 'room', prefix: 'Room', color: '#f97316', increment: 1, incrementMode: 'one-up' },
  { type: 'floor', prefix: 'Floor', color: '#8b5cf6', increment: 1, incrementMode: 'one-up' },
  { type: 'cam', prefix: 'CAM', color: '#ef4444', increment: 1, incrementMode: 'one-up' },
  { type: 'door', prefix: 'Door', color: '#eab308', increment: 1, incrementMode: 'one-up' },
  { type: 'panel', prefix: 'Panel', color: '#06b6d4', increment: 1, incrementMode: 'one-up' },
  { type: 'sensor', prefix: 'Sensor', color: '#ec4899', increment: 1, incrementMode: 'one-up' },
];

export interface ScalePreset {
  label: string;
  ratio: number;
}

export const SCALE_PRESETS: ScalePreset[] = [
  { label: '1/16" = 1\'', ratio: 4.5 },
  { label: '1/8" = 1\'', ratio: 9 },
  { label: '1/4" = 1\'', ratio: 18 },
  { label: '3/8" = 1\'', ratio: 27 },
  { label: '1/2" = 1\'', ratio: 36 },
  { label: '3/4" = 1\'', ratio: 54 },
  { label: '1" = 1\'', ratio: 72 },
  { label: '1:100', ratio: 7.2 },
  { label: '1:50', ratio: 14.4 },
  { label: '1:20', ratio: 36 },
];

export interface ProjectFile {
  version: string;
  projectName: string;
  bgImage: string | null;
  elements: PlacedElement[];
  cables: Cable[];
  labels: PlacedLabel[];
  measures: MeasureLine[];
  drawings: Drawing[];
  texts: TextAnnotation[];
  shapes: any[];
  stamp: Stamp | null;
  groups: Group[];
  categoryColors: Record<Category, string>;
  iconColors: Record<string, string>;
  customElementNames: Record<string, string>;
  labelPresets: LabelPreset[];
  customLabelPresets: LabelPreset[];
  scale: ScalePreset;
  elementCounters: Record<string, number>;
  labelCounters: Record<string, number>;
  showCableLengths: boolean;
  bwMode: boolean;
  pipes?: SprinklerPipe[];
  fittings?: PipeFitting[];
}
