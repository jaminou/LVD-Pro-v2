export type Category = 'alarm' | 'fire' | 'cctv' | 'sound' | 'automation' | 'tv' | 'data';
export type ToolMode = 'select' | 'place' | 'cable' | 'pen' | 'highlighter' | 'text' | 'eraser' | 'pan' | 'measure' | 'label' | 'sprinklerPipe';

// Sprinkler pipe types
export type SprinklerPipeType = 'main' | 'branch' | 'elbow' | 'tee' | 'reducer' | 'coupling' | 'cap';
export type PipeSize = '1' | '1.25' | '1.5' | '2' | '2.5' | '3' | '4' | '6' | '8';

export interface SprinklerPipe {
  uid: string;
  pipeType: SprinklerPipeType;
  size: PipeSize;
  points: { x: number; y: number }[];
  color: string;
}

// Label types for tagging
export type LabelType = 'zone' | 'cam' | 'data' | 'speaker' | 'tv' | 'tel' | 'ap' | 'custom';

export interface PlacedLabel {
  uid: string;
  type: LabelType;
  prefix: string; // "Zone", "Cam", "Data", etc.
  number: number;
  customText?: string;
  x: number;
  y: number;
  color: string;
  size: number; // font size
}
export type DisplayMode = 'icon' | 'name' | 'both';
export type CableType = 'alarm' | 'fire' | 'speaker' | 'data' | 'hdmi' | 'coax' | 'fiber' | 'automation';
export type IconSize = 'xs' | 's' | 'm' | 'l' | 'xl';

export const ICON_SIZES: Record<IconSize, number> = {
  xs: 28,
  s: 36,
  m: 48,
  l: 64,
  xl: 80,
};

export interface ElementDef {
  id: string;
  name: string;
  shortName?: string; // User can edit this to create custom short names
  category: Category;
}

export interface PlacedElement {
  uid: string;
  defId: string;
  x: number;
  y: number;
  rotation: number;
  label: string;
  notes: string;
  display: DisplayMode;
  groupId?: string;
  labelOffsetX: number;
  labelOffsetY: number;
  size: IconSize;
  number: number; // Auto-incrementing number per element type
  zone?: string; // Zone number for alarm/fire elements
}

export interface Cable {
  uid: string;
  type: CableType;
  color: string;
  points: { x: number; y: number }[];
  showLength: boolean;
  curved: boolean; // Whether to draw with curves
}

export interface Drawing {
  uid: string;
  tool: 'pen' | 'highlighter';
  color: string;
  size: number;
  points: { x: number; y: number }[];
}

export interface TextAnnotation {
  uid: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
}

export interface Stamp {
  company: string;
  address: string;
  phone: string;
  license: string;
  project: string;
  date: string;
  x: number;
  y: number;
}

export interface MeasureLine {
  uid: string;
  points: { x: number; y: number }[];
  color: string;
  selected?: boolean;
}

export interface Group {
  id: string;
  name: string;
}

export interface InfoBox {
  x: number;
  y: number;
  visible: boolean;
}

export interface LabelPreset {
  type: LabelType;
  prefix: string;
  color: string;
  increment: number; // Number increment (1, 2, 5, etc.)
}

// Default label presets (can be modified by user)
export const DEFAULT_LABEL_PRESETS: LabelPreset[] = [
  { type: 'zone', prefix: 'Zone', color: '#ef4444', increment: 1 },
  { type: 'cam', prefix: 'Cam', color: '#a855f7', increment: 1 },
  { type: 'data', prefix: 'Data', color: '#06b6d4', increment: 1 },
  { type: 'speaker', prefix: 'Spk', color: '#3b82f6', increment: 1 },
  { type: 'tv', prefix: 'TV', color: '#eab308', increment: 1 },
  { type: 'tel', prefix: 'Tel', color: '#f97316', increment: 1 },
  { type: 'ap', prefix: 'AP', color: '#14b8a6', increment: 1 },
  { type: 'custom', prefix: 'Label', color: '#22c55e', increment: 1 },
];

// Backward compatibility
export const LABEL_PRESETS = DEFAULT_LABEL_PRESETS;

// Template for saving/loading label configurations
export interface LabelTemplate {
  name: string;
  presets: LabelPreset[];
  customLabels: LabelPreset[];
}

export const CATEGORY_COLORS: Record<Category, string> = {
  alarm: '#ef4444',
  fire: '#f97316',
  cctv: '#a855f7',
  sound: '#3b82f6',
  automation: '#22c55e',
  tv: '#eab308',
  data: '#06b6d4',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  alarm: 'Alarm & Security',
  fire: 'Fire Alarm',
  cctv: 'CCTV & Surveillance',
  sound: 'Sound System',
  automation: 'Home Automation',
  tv: 'TV & Entertainment',
  data: 'Data & Network',
};

export const CABLE_COLORS: Record<CableType, string> = {
  alarm: '#ef4444',
  fire: '#f97316',
  speaker: '#3b82f6',
  data: '#06b6d4',
  hdmi: '#eab308',
  coax: '#a855f7',
  fiber: '#22c55e',
  automation: '#14b8a6',
};

export const CABLE_LABELS: Record<CableType, string> = {
  alarm: 'Alarm Wire',
  fire: 'Fire Alarm Cable',
  speaker: 'Speaker Wire',
  data: 'Data Cable (Cat6)',
  hdmi: 'HDMI Cable',
  coax: 'Coax Cable',
  fiber: 'Fiber Optic',
  automation: 'Automation Bus',
};

export const CABLE_DASH: Record<CableType, string> = {
  alarm: '',
  fire: '12,6',
  speaker: '',
  data: '4,4',
  hdmi: '16,6',
  coax: '12,4,4,4',
  fiber: '4,4',
  automation: '12,4,4,4,4,4',
};

export interface ScaleSetting {
  label: string;
  ratio: number; // pixels per foot
}

export const SCALE_PRESETS: ScaleSetting[] = [
  { label: '1/8" = 1\'-0"', ratio: 12 },
  { label: '3/16" = 1\'-0"', ratio: 18 },
  { label: '1/4" = 1\'-0"', ratio: 24 },
  { label: '3/8" = 1\'-0"', ratio: 36 },
  { label: '1/2" = 1\'-0"', ratio: 48 },
  { label: '1" = 1\'-0"', ratio: 96 },
];
