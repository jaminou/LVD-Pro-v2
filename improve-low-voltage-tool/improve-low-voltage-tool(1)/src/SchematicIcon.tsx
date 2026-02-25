import React from 'react';
import { CATEGORY_COLORS, type Category } from './types';

interface Props {
  defId: string;
  category: Category;
  size?: number;
  customColor?: string; // Allow custom color override
}

export const SchematicIcon: React.FC<Props> = ({ defId, category, size = 36, customColor }) => {
  const c = customColor || CATEGORY_COLORS[category];
  const s = size;
  const sw = Math.max(2, s / 12);

  const common = { stroke: c, fill: 'none', strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  const icons: Record<string, React.ReactNode> = {
    pir: <>
      <path d={`M${s*0.2},${s*0.7} L${s*0.5},${s*0.3} L${s*0.8},${s*0.7}`} {...common}/>
      <path d={`M${s*0.3},${s*0.15} Q${s*0.5},${s*0.05} ${s*0.7},${s*0.15}`} {...common} strokeDasharray={`${s/8},${s/12}`}/>
      <path d={`M${s*0.25},${s*0.25} Q${s*0.5},${s*0.12} ${s*0.75},${s*0.25}`} {...common} strokeDasharray={`${s/8},${s/12}`}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.06} fill={c} stroke="none"/>
    </>,
    pir360: <>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.25} {...common}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.06} fill={c} stroke="none"/>
      <path d={`M${s*0.5},${s*0.1} L${s*0.5},${s*0.2}`} {...common}/>
      <path d={`M${s*0.5},${s*0.8} L${s*0.5},${s*0.9}`} {...common}/>
      <path d={`M${s*0.1},${s*0.5} L${s*0.2},${s*0.5}`} {...common}/>
      <path d={`M${s*0.8},${s*0.5} L${s*0.9},${s*0.5}`} {...common}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.38} {...common} strokeDasharray={`${s/6},${s/8}`}/>
    </>,
    door_contact: <>
      <rect x={s*0.15} y={s*0.25} width={s*0.3} height={s*0.5} rx={s*0.03} {...common}/>
      <rect x={s*0.55} y={s*0.3} width={s*0.3} height={s*0.4} rx={s*0.03} {...common}/>
      <path d={`M${s*0.45},${s*0.45} L${s*0.55},${s*0.45}`} {...common} strokeDasharray={`${s/12},${s/16}`}/>
      <path d={`M${s*0.45},${s*0.55} L${s*0.55},${s*0.55}`} {...common} strokeDasharray={`${s/12},${s/16}`}/>
    </>,
    outdoor_motion: <>
      <path d={`M${s*0.2},${s*0.75} L${s*0.5},${s*0.35} L${s*0.8},${s*0.75}`} {...common}/>
      <path d={`M${s*0.25},${s*0.22} Q${s*0.5},${s*0.08} ${s*0.75},${s*0.22}`} {...common} strokeDasharray={`${s/8},${s/12}`}/>
      <path d={`M${s*0.2},${s*0.32} Q${s*0.5},${s*0.15} ${s*0.8},${s*0.32}`} {...common} strokeDasharray={`${s/8},${s/12}`}/>
      <circle cx={s*0.5} cy={s*0.55} r={s*0.08} fill={c} stroke="none"/>
      <rect x={s*0.15} y={s*0.75} width={s*0.7} height={s*0.08} rx={s*0.02} {...common} fill={c} fillOpacity={0.2}/>
    </>,
    glass_break: <>
      <rect x={s*0.2} y={s*0.15} width={s*0.6} height={s*0.7} rx={s*0.03} {...common}/>
      <path d={`M${s*0.35},${s*0.15} L${s*0.5},${s*0.5} L${s*0.65},${s*0.15}`} {...common}/>
      <path d={`M${s*0.5},${s*0.5} L${s*0.5},${s*0.85}`} {...common}/>
      <path d={`M${s*0.35},${s*0.65} L${s*0.5},${s*0.5} L${s*0.65},${s*0.65}`} {...common}/>
    </>,
    shatter: <>
      <rect x={s*0.15} y={s*0.15} width={s*0.7} height={s*0.7} rx={s*0.03} {...common}/>
      <path d={`M${s*0.3},${s*0.15} L${s*0.5},${s*0.55} L${s*0.7},${s*0.15}`} {...common}/>
      <path d={`M${s*0.15},${s*0.5} L${s*0.5},${s*0.55} L${s*0.85},${s*0.5}`} {...common}/>
      <path d={`M${s*0.4},${s*0.85} L${s*0.5},${s*0.55} L${s*0.6},${s*0.85}`} {...common}/>
    </>,
    flood: <>
      <path d={`M${s*0.5},${s*0.15} Q${s*0.7},${s*0.45} ${s*0.5},${s*0.65} Q${s*0.3},${s*0.45} ${s*0.5},${s*0.15}`} {...common} fill={c} fillOpacity={0.2}/>
      <path d={`M${s*0.25},${s*0.78} Q${s*0.35},${s*0.72} ${s*0.5},${s*0.78} Q${s*0.65},${s*0.84} ${s*0.75},${s*0.78}`} {...common}/>
      <path d={`M${s*0.2},${s*0.88} Q${s*0.35},${s*0.82} ${s*0.5},${s*0.88} Q${s*0.65},${s*0.94} ${s*0.8},${s*0.88}`} {...common}/>
    </>,
    vibration: <>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.15} {...common}/>
      <path d={`M${s*0.15},${s*0.35} Q${s*0.25},${s*0.2} ${s*0.3},${s*0.35}`} {...common}/>
      <path d={`M${s*0.7},${s*0.35} Q${s*0.75},${s*0.2} ${s*0.85},${s*0.35}`} {...common}/>
      <path d={`M${s*0.15},${s*0.65} Q${s*0.25},${s*0.8} ${s*0.3},${s*0.65}`} {...common}/>
      <path d={`M${s*0.7},${s*0.65} Q${s*0.75},${s*0.8} ${s*0.85},${s*0.65}`} {...common}/>
    </>,
    keypad: <>
      <rect x={s*0.25} y={s*0.1} width={s*0.5} height={s*0.8} rx={s*0.05} {...common}/>
      {[0,1,2].map(r=>[0,1,2].map(cc=><circle key={`${r}${cc}`} cx={s*(0.35+cc*0.15)} cy={s*(0.3+r*0.15)} r={s*0.035} fill={c} stroke="none"/>))}
      <rect x={s*0.35} y={s*0.72} width={s*0.3} height={s*0.08} rx={s*0.02} fill={c} fillOpacity={0.3} stroke="none"/>
    </>,
    alarm_panel: <>
      <rect x={s*0.1} y={s*0.15} width={s*0.8} height={s*0.7} rx={s*0.05} {...common}/>
      <rect x={s*0.2} y={s*0.25} width={s*0.35} height={s*0.2} rx={s*0.02} {...common}/>
      <circle cx={s*0.72} cy={s*0.32} r={s*0.06} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
      <circle cx={s*0.72} cy={s*0.55} r={s*0.04} fill="#22c55e" stroke="none"/>
      <circle cx={s*0.72} cy={s*0.68} r={s*0.04} fill={c} stroke="none"/>
      {[0,1,2,3].map(i=><rect key={i} x={s*(0.2+i*0.12)} y={s*0.58} width={s*0.08} height={s*0.12} rx={s*0.01} fill={c} fillOpacity={0.2} stroke={c} strokeWidth={sw*0.5}/>)}
    </>,
    siren_in: <>
      <path d={`M${s*0.3},${s*0.7} L${s*0.3},${s*0.35} Q${s*0.5},${s*0.15} ${s*0.7},${s*0.35} L${s*0.7},${s*0.7} Z`} {...common}/>
      <path d={`M${s*0.2},${s*0.55} L${s*0.3},${s*0.55}`} {...common}/>
      <path d={`M${s*0.7},${s*0.55} L${s*0.8},${s*0.55}`} {...common}/>
      <path d={`M${s*0.4},${s*0.7} L${s*0.4},${s*0.82}`} {...common}/>
      <path d={`M${s*0.6},${s*0.7} L${s*0.6},${s*0.82}`} {...common}/>
    </>,
    siren_out: <>
      <path d={`M${s*0.25},${s*0.75} L${s*0.25},${s*0.3} Q${s*0.5},${s*0.1} ${s*0.75},${s*0.3} L${s*0.75},${s*0.75} Z`} {...common}/>
      <path d={`M${s*0.15},${s*0.45} L${s*0.08},${s*0.35}`} {...common}/>
      <path d={`M${s*0.85},${s*0.45} L${s*0.92},${s*0.35}`} {...common}/>
      <path d={`M${s*0.15},${s*0.6} L${s*0.05},${s*0.6}`} {...common}/>
      <path d={`M${s*0.85},${s*0.6} L${s*0.95},${s*0.6}`} {...common}/>
    </>,
    panic: <>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.35} {...common}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.2} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
      <text x={s*0.5} y={s*0.58} textAnchor="middle" fill={c} fontSize={s*0.22} fontWeight="bold">!</text>
    </>,
    smoke_2w: <>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.32} {...common}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.12} fill={c} fillOpacity={0.3} stroke="none"/>
      <text x={s*0.5} y={s*0.48} textAnchor="middle" fill={c} fontSize={s*0.12} fontWeight="bold">2W</text>
      <text x={s*0.5} y={s*0.68} textAnchor="middle" fill={c} fontSize={s*0.15} fontWeight="bold">S</text>
    </>,
    smoke_4w: <>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.32} {...common}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.12} fill={c} fillOpacity={0.3} stroke="none"/>
      <text x={s*0.5} y={s*0.48} textAnchor="middle" fill={c} fontSize={s*0.12} fontWeight="bold">4W</text>
      <text x={s*0.5} y={s*0.68} textAnchor="middle" fill={c} fontSize={s*0.15} fontWeight="bold">S</text>
    </>,
    heat: <>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.32} {...common}/>
      <text x={s*0.5} y={s*0.57} textAnchor="middle" fill={c} fontSize={s*0.22} fontWeight="bold">H</text>
    </>,
    co: <>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.32} {...common}/>
      <text x={s*0.5} y={s*0.58} textAnchor="middle" fill={c} fontSize={s*0.18} fontWeight="bold">CO</text>
    </>,
    pull_station: <>
      <rect x={s*0.25} y={s*0.15} width={s*0.5} height={s*0.7} rx={s*0.04} {...common} fill={c} fillOpacity={0.15}/>
      <path d={`M${s*0.5},${s*0.3} L${s*0.5},${s*0.55}`} {...common} strokeWidth={sw*1.5}/>
      <path d={`M${s*0.4},${s*0.55} L${s*0.5},${s*0.7} L${s*0.6},${s*0.55}`} {...common}/>
    </>,
    fire_bell: <>
      <circle cx={s*0.5} cy={s*0.45} r={s*0.28} {...common}/>
      <path d={`M${s*0.5},${s*0.73} L${s*0.5},${s*0.85}`} {...common}/>
      <circle cx={s*0.5} cy={s*0.88} r={s*0.04} fill={c} stroke="none"/>
      <line x1={s*0.35} y1={s*0.17} x2={s*0.25} y2={s*0.1} {...common}/>
      <line x1={s*0.65} y1={s*0.17} x2={s*0.75} y2={s*0.1} {...common}/>
    </>,
    fire_strobe: <>
      <rect x={s*0.25} y={s*0.2} width={s*0.5} height={s*0.6} rx={s*0.05} {...common}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.12} fill={c} fillOpacity={0.4} stroke={c} strokeWidth={sw}/>
      <line x1={s*0.5} y1={s*0.2} x2={s*0.5} y2={s*0.32} {...common}/>
      <line x1={s*0.5} y1={s*0.68} x2={s*0.5} y2={s*0.8} {...common}/>
      <line x1={s*0.25} y1={s*0.5} x2={s*0.35} y2={s*0.5} {...common}/>
      <line x1={s*0.65} y1={s*0.5} x2={s*0.75} y2={s*0.5} {...common}/>
    </>,
    fire_panel: <>
      <rect x={s*0.1} y={s*0.15} width={s*0.8} height={s*0.7} rx={s*0.04} {...common}/>
      <rect x={s*0.18} y={s*0.25} width={s*0.4} height={s*0.18} rx={s*0.02} {...common}/>
      <circle cx={s*0.75} cy={s*0.3} r={s*0.05} fill={c} stroke="none"/>
      <text x={s*0.5} y={s*0.72} textAnchor="middle" fill={c} fontSize={s*0.14} fontWeight="bold">FIRE</text>
    </>,
    strobe_light: <>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.28} {...common}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.12} fill={c} fillOpacity={0.5} stroke={c} strokeWidth={sw}/>
      <line x1={s*0.5} y1={s*0.12} x2={s*0.5} y2={s*0.22} {...common}/>
      <line x1={s*0.5} y1={s*0.78} x2={s*0.5} y2={s*0.88} {...common}/>
      <line x1={s*0.12} y1={s*0.5} x2={s*0.22} y2={s*0.5} {...common}/>
      <line x1={s*0.78} y1={s*0.5} x2={s*0.88} y2={s*0.5} {...common}/>
      <line x1={s*0.22} y1={s*0.22} x2={s*0.3} y2={s*0.3} {...common}/>
      <line x1={s*0.7} y1={s*0.3} x2={s*0.78} y2={s*0.22} {...common}/>
      <line x1={s*0.22} y1={s*0.78} x2={s*0.3} y2={s*0.7} {...common}/>
      <line x1={s*0.7} y1={s*0.7} x2={s*0.78} y2={s*0.78} {...common}/>
    </>,
    strobe_siren: <>
      <path d={`M${s*0.25},${s*0.75} L${s*0.25},${s*0.35} Q${s*0.5},${s*0.15} ${s*0.75},${s*0.35} L${s*0.75},${s*0.75} Z`} {...common}/>
      <circle cx={s*0.5} cy={s*0.4} r={s*0.1} fill={c} fillOpacity={0.5} stroke={c} strokeWidth={sw}/>
      <line x1={s*0.5} y1={s*0.12} x2={s*0.5} y2={s*0.2} {...common}/>
      <line x1={s*0.3} y1={s*0.18} x2={s*0.35} y2={s*0.26} {...common}/>
      <line x1={s*0.7} y1={s*0.18} x2={s*0.65} y2={s*0.26} {...common}/>
      <path d={`M${s*0.35},${s*0.58} L${s*0.5},${s*0.68} L${s*0.65},${s*0.58}`} {...common}/>
    </>,
    fire_keypad: <>
      <rect x={s*0.25} y={s*0.1} width={s*0.5} height={s*0.8} rx={s*0.05} {...common} fill={c} fillOpacity={0.1}/>
      {[0,1,2].map(r=>[0,1,2].map(cc=><circle key={`${r}${cc}`} cx={s*(0.35+cc*0.15)} cy={s*(0.3+r*0.15)} r={s*0.035} fill={c} stroke="none"/>))}
      <rect x={s*0.35} y={s*0.72} width={s*0.3} height={s*0.08} rx={s*0.02} fill={c} fillOpacity={0.3} stroke="none"/>
      <text x={s*0.5} y={s*0.18} textAnchor="middle" fill={c} fontSize={s*0.08} fontWeight="bold">FIRE</text>
    </>,
    annunciator: <>
      <rect x={s*0.15} y={s*0.15} width={s*0.7} height={s*0.7} rx={s*0.04} {...common}/>
      {[0,1,2,3].map(r=>[0,1,2].map(cc=><circle key={`${r}${cc}`} cx={s*(0.3+cc*0.2)} cy={s*(0.28+r*0.15)} r={s*0.04} fill={r<2?c:'none'} fillOpacity={0.4} stroke={c} strokeWidth={sw*0.5}/>))}
    </>,
    duct: <>
      <rect x={s*0.1} y={s*0.3} width={s*0.8} height={s*0.4} rx={s*0.04} {...common}/>
      <circle cx={s*0.35} cy={s*0.5} r={s*0.1} {...common}/>
      <path d={`M${s*0.55},${s*0.4} L${s*0.55},${s*0.6}`} {...common}/>
      <path d={`M${s*0.65},${s*0.38} L${s*0.65},${s*0.62}`} {...common}/>
      <path d={`M${s*0.75},${s*0.42} L${s*0.75},${s*0.58}`} {...common}/>
    </>,
    cam_dome: <>
      <ellipse cx={s*0.5} cy={s*0.55} rx={s*0.32} ry={s*0.2} {...common}/>
      <path d={`M${s*0.25},${s*0.45} Q${s*0.5},${s*0.15} ${s*0.75},${s*0.45}`} {...common}/>
      <circle cx={s*0.5} cy={s*0.48} r={s*0.08} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
    </>,
    cam_bullet: <>
      <rect x={s*0.15} y={s*0.3} width={s*0.55} height={s*0.35} rx={s*0.05} {...common}/>
      <path d={`M${s*0.7},${s*0.35} L${s*0.88},${s*0.42} L${s*0.88},${s*0.58} L${s*0.7},${s*0.6}`} {...common}/>
      <circle cx={s*0.42} cy={s*0.48} r={s*0.08} {...common}/>
    </>,
    cam_ptz: <>
      <ellipse cx={s*0.5} cy={s*0.6} rx={s*0.3} ry={s*0.18} {...common}/>
      <path d={`M${s*0.3},${s*0.5} Q${s*0.5},${s*0.2} ${s*0.7},${s*0.5}`} {...common}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.07} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
      <path d={`M${s*0.5},${s*0.18} L${s*0.45},${s*0.12} L${s*0.55},${s*0.12} Z`} fill={c} stroke="none"/>
      <path d={`M${s*0.82},${s*0.5} L${s*0.88},${s*0.45} L${s*0.88},${s*0.55} Z`} fill={c} stroke="none"/>
    </>,
    cam_doorbell: <>
      <rect x={s*0.3} y={s*0.1} width={s*0.4} height={s*0.8} rx={s*0.08} {...common}/>
      <circle cx={s*0.5} cy={s*0.38} r={s*0.1} {...common}/>
      <circle cx={s*0.5} cy={s*0.65} r={s*0.07} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
    </>,
    cam_pan: <>
      <ellipse cx={s*0.5} cy={s*0.55} rx={s*0.38} ry={s*0.22} {...common}/>
      <path d={`M${s*0.18},${s*0.42} Q${s*0.5},${s*0.12} ${s*0.82},${s*0.42}`} {...common}/>
      <circle cx={s*0.32} cy={s*0.48} r={s*0.06} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
      <circle cx={s*0.5} cy={s*0.48} r={s*0.06} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
      <circle cx={s*0.68} cy={s*0.48} r={s*0.06} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
      <text x={s*0.5} y={s*0.88} textAnchor="middle" fill={c} fontSize={s*0.1}>180°</text>
    </>,
    cam_ring: <>
      <circle cx={s*0.5} cy={s*0.42} r={s*0.25} {...common}/>
      <circle cx={s*0.5} cy={s*0.42} r={s*0.1} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
      <rect x={s*0.35} y={s*0.7} width={s*0.3} height={s*0.15} rx={s*0.03} {...common} fill="#eab308" fillOpacity={0.4}/>
      <path d={`M${s*0.3},${s*0.2} L${s*0.22},${s*0.1}`} {...common}/>
      <path d={`M${s*0.7},${s*0.2} L${s*0.78},${s*0.1}`} {...common}/>
    </>,
    nvr: <>
      <rect x={s*0.1} y={s*0.25} width={s*0.8} height={s*0.5} rx={s*0.04} {...common}/>
      <line x1={s*0.1} y1={s*0.45} x2={s*0.9} y2={s*0.45} {...common}/>
      {[0,1,2,3].map(i=><rect key={i} x={s*(0.18+i*0.17)} y={s*0.3} width={s*0.1} height={s*0.1} rx={s*0.01} fill={c} fillOpacity={0.2} stroke={c} strokeWidth={sw*0.5}/>)}
      <circle cx={s*0.25} cy={s*0.6} r={s*0.03} fill="#22c55e" stroke="none"/>
      <text x={s*0.6} y={s*0.65} fill={c} fontSize={s*0.12} fontWeight="bold">NVR</text>
    </>,
    spk_ceiling: <>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.32} {...common}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.15} {...common}/>
      <line x1={s*0.5} y1={s*0.18} x2={s*0.5} y2={s*0.35} {...common}/>
      <line x1={s*0.5} y1={s*0.65} x2={s*0.5} y2={s*0.82} {...common}/>
      <line x1={s*0.18} y1={s*0.5} x2={s*0.35} y2={s*0.5} {...common}/>
      <line x1={s*0.65} y1={s*0.5} x2={s*0.82} y2={s*0.5} {...common}/>
    </>,
    spk_wall: <>
      <rect x={s*0.2} y={s*0.15} width={s*0.45} height={s*0.7} rx={s*0.04} {...common}/>
      <circle cx={s*0.42} cy={s*0.55} r={s*0.13} {...common}/>
      <circle cx={s*0.42} cy={s*0.32} r={s*0.06} {...common}/>
      <path d={`M${s*0.7},${s*0.35} Q${s*0.82},${s*0.5} ${s*0.7},${s*0.65}`} {...common}/>
      <path d={`M${s*0.76},${s*0.3} Q${s*0.92},${s*0.5} ${s*0.76},${s*0.7}`} {...common}/>
    </>,
    spk_outdoor: <>
      <path d={`M${s*0.2},${s*0.35} L${s*0.2},${s*0.65} L${s*0.4},${s*0.65} L${s*0.65},${s*0.8} L${s*0.65},${s*0.2} L${s*0.4},${s*0.35} Z`} {...common}/>
      <path d={`M${s*0.72},${s*0.35} Q${s*0.82},${s*0.5} ${s*0.72},${s*0.65}`} {...common}/>
      <path d={`M${s*0.78},${s*0.28} Q${s*0.92},${s*0.5} ${s*0.78},${s*0.72}`} {...common}/>
    </>,
    spk_center: <>
      <rect x={s*0.1} y={s*0.3} width={s*0.8} height={s*0.4} rx={s*0.06} {...common}/>
      <circle cx={s*0.3} cy={s*0.5} r={s*0.1} {...common}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.08} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
      <circle cx={s*0.7} cy={s*0.5} r={s*0.1} {...common}/>
      <text x={s*0.5} y={s*0.88} textAnchor="middle" fill={c} fontSize={s*0.1}>CTR</text>
    </>,
    subwoofer: <>
      <rect x={s*0.2} y={s*0.15} width={s*0.6} height={s*0.7} rx={s*0.05} {...common}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.2} {...common} strokeWidth={sw*1.5}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.08} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
    </>,
    amplifier: <>
      <rect x={s*0.1} y={s*0.25} width={s*0.8} height={s*0.5} rx={s*0.04} {...common}/>
      <circle cx={s*0.3} cy={s*0.5} r={s*0.1} {...common}/>
      <circle cx={s*0.55} cy={s*0.5} r={s*0.1} {...common}/>
      <path d={`M${s*0.75},${s*0.35} L${s*0.75},${s*0.65}`} {...common}/>
      <path d={`M${s*0.82},${s*0.35} L${s*0.82},${s*0.65}`} {...common}/>
    </>,
    volume: <>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.3} {...common}/>
      <line x1={s*0.5} y1={s*0.5} x2={s*0.5} y2={s*0.22} {...common} strokeWidth={sw*1.5}/>
      <path d={`M${s*0.3},${s*0.7} A${s*0.28},${s*0.28} 0 0,1 ${s*0.7},${s*0.7}`} {...common} strokeDasharray={`${s/10},${s/14}`}/>
    </>,
    soundbar: <>
      <rect x={s*0.08} y={s*0.35} width={s*0.84} height={s*0.3} rx={s*0.06} {...common}/>
      {[0,1,2,3,4].map(i=><circle key={i} cx={s*(0.2+i*0.15)} cy={s*0.5} r={s*0.05} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw*0.5}/>)}
    </>,
    media_player: <>
      <rect x={s*0.15} y={s*0.25} width={s*0.7} height={s*0.5} rx={s*0.04} {...common}/>
      <path d={`M${s*0.4},${s*0.38} L${s*0.4},${s*0.62} L${s*0.62},${s*0.5} Z`} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
    </>,
    receiver: <>
      <rect x={s*0.1} y={s*0.2} width={s*0.8} height={s*0.6} rx={s*0.04} {...common}/>
      <line x1={s*0.1} y1={s*0.45} x2={s*0.9} y2={s*0.45} {...common} strokeWidth={sw*0.7}/>
      <rect x={s*0.18} y={s*0.27} width={s*0.35} height={s*0.12} rx={s*0.02} fill={c} fillOpacity={0.15} stroke={c} strokeWidth={sw*0.5}/>
      {[0,1,2].map(i=><circle key={i} cx={s*(0.3+i*0.2)} cy={s*0.6} r={s*0.05} {...common}/>)}
      <circle cx={s*0.75} cy={s*0.33} r={s*0.04} fill="#22c55e" stroke="none"/>
    </>,
    spk_selector: <>
      <rect x={s*0.1} y={s*0.2} width={s*0.8} height={s*0.6} rx={s*0.04} {...common}/>
      {[0,1,2,3].map(i=><g key={i}>
        <rect x={s*(0.18+i*0.18)} y={s*0.35} width={s*0.1} height={s*0.15} rx={s*0.015} fill={i<2?c:'none'} fillOpacity={0.3} stroke={c} strokeWidth={sw*0.7}/>
        <text x={s*(0.23+i*0.18)} y={s*0.7} textAnchor="middle" fill={c} fontSize={s*0.09}>{i+1}</text>
      </g>)}
    </>,
    smart_switch: <>
      <rect x={s*0.25} y={s*0.1} width={s*0.5} height={s*0.8} rx={s*0.06} {...common}/>
      <line x1={s*0.5} y1={s*0.5} x2={s*0.5} y2={s*0.5} {...common}/>
      <rect x={s*0.35} y={s*0.2} width={s*0.3} height={s*0.25} rx={s*0.03} fill={c} fillOpacity={0.2} stroke={c} strokeWidth={sw}/>
      <rect x={s*0.35} y={s*0.55} width={s*0.3} height={s*0.25} rx={s*0.03} fill="none" stroke={c} strokeWidth={sw}/>
      <circle cx={s*0.5} cy={s*0.32} r={s*0.03} fill={c} stroke="none"/>
    </>,
    smart_dimmer: <>
      <rect x={s*0.25} y={s*0.1} width={s*0.5} height={s*0.8} rx={s*0.06} {...common}/>
      <line x1={s*0.38} y1={s*0.7} x2={s*0.62} y2={s*0.3} {...common} strokeWidth={sw*1.5}/>
      <circle cx={s*0.62} cy={s*0.3} r={s*0.05} fill={c} stroke="none"/>
    </>,
    smart_lock: <>
      <path d={`M${s*0.3},${s*0.45} L${s*0.3},${s*0.3} Q${s*0.3},${s*0.12} ${s*0.5},${s*0.12} Q${s*0.7},${s*0.12} ${s*0.7},${s*0.3} L${s*0.7},${s*0.45}`} {...common}/>
      <rect x={s*0.22} y={s*0.45} width={s*0.56} height={s*0.42} rx={s*0.05} {...common} fill={c} fillOpacity={0.15}/>
      <circle cx={s*0.5} cy={s*0.6} r={s*0.06} fill={c} stroke="none"/>
      <line x1={s*0.5} y1={s*0.66} x2={s*0.5} y2={s*0.76} stroke={c} strokeWidth={sw}/>
    </>,
    smart_outlet: <>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.32} {...common}/>
      <circle cx={s*0.38} cy={s*0.4} r={s*0.05} fill={c} stroke="none"/>
      <circle cx={s*0.62} cy={s*0.4} r={s*0.05} fill={c} stroke="none"/>
      <path d={`M${s*0.38},${s*0.58} Q${s*0.5},${s*0.68} ${s*0.62},${s*0.58}`} {...common}/>
    </>,
    thermostat: <>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.32} {...common}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.22} {...common} strokeDasharray={`${s/8},${s/10}`}/>
      <text x={s*0.5} y={s*0.56} textAnchor="middle" fill={c} fontSize={s*0.18} fontWeight="bold">72°</text>
    </>,
    hub: <>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.2} {...common}/>
      {[0,1,2,3,4,5].map(i=>{const a=i*60*Math.PI/180;return <line key={i} x1={s*0.5+s*0.2*Math.cos(a)} y1={s*0.5+s*0.2*Math.sin(a)} x2={s*0.5+s*0.38*Math.cos(a)} y2={s*0.5+s*0.38*Math.sin(a)} {...common}/>})}
      {[0,1,2,3,4,5].map(i=>{const a=i*60*Math.PI/180;return <circle key={i} cx={s*0.5+s*0.38*Math.cos(a)} cy={s*0.5+s*0.38*Math.sin(a)} r={s*0.04} fill={c} stroke="none"/>})}
    </>,
    shades: <>
      <rect x={s*0.15} y={s*0.15} width={s*0.7} height={s*0.08} rx={s*0.02} {...common} fill={c} fillOpacity={0.2}/>
      {[0,1,2,3,4].map(i=><line key={i} x1={s*0.15} y1={s*(0.3+i*0.12)} x2={s*0.85} y2={s*(0.3+i*0.12)} {...common} strokeWidth={sw*0.7}/>)}
      <path d={`M${s*0.45},${s*0.78} L${s*0.5},${s*0.88} L${s*0.55},${s*0.78}`} {...common}/>
    </>,
    touch_panel: <>
      <rect x={s*0.2} y={s*0.1} width={s*0.6} height={s*0.8} rx={s*0.05} {...common}/>
      <rect x={s*0.26} y={s*0.16} width={s*0.48} height={s*0.55} rx={s*0.02} fill={c} fillOpacity={0.1} stroke={c} strokeWidth={sw*0.5}/>
      <circle cx={s*0.5} cy={s*0.82} r={s*0.04} {...common}/>
    </>,
    auto_keypad: <>
      <rect x={s*0.25} y={s*0.1} width={s*0.5} height={s*0.8} rx={s*0.05} {...common}/>
      {[0,1,2].map(r=>[0,1].map(cc=><rect key={`${r}${cc}`} x={s*(0.32+cc*0.18)} y={s*(0.2+r*0.2)} width={s*0.14} height={s*0.12} rx={s*0.02} fill={c} fillOpacity={0.15} stroke={c} strokeWidth={sw*0.5}/>))}
    </>,
    tv_outlet: <>
      <rect x={s*0.2} y={s*0.25} width={s*0.6} height={s*0.5} rx={s*0.04} {...common}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.1} {...common}/>
      <line x1={s*0.5} y1={s*0.4} x2={s*0.5} y2={s*0.6} {...common}/>
      <line x1={s*0.4} y1={s*0.5} x2={s*0.6} y2={s*0.5} {...common}/>
      <text x={s*0.5} y={s*0.88} textAnchor="middle" fill={c} fontSize={s*0.12}>TV</text>
    </>,
    hdmi_outlet: <>
      <path d={`M${s*0.25},${s*0.3} L${s*0.75},${s*0.3} L${s*0.7},${s*0.7} L${s*0.3},${s*0.7} Z`} {...common}/>
      <line x1={s*0.38} y1={s*0.42} x2={s*0.38} y2={s*0.58} {...common}/>
      <line x1={s*0.5} y1={s*0.42} x2={s*0.5} y2={s*0.58} {...common}/>
      <line x1={s*0.62} y1={s*0.42} x2={s*0.62} y2={s*0.58} {...common}/>
    </>,
    projector: <>
      <rect x={s*0.15} y={s*0.3} width={s*0.7} height={s*0.4} rx={s*0.04} {...common}/>
      <circle cx={s*0.4} cy={s*0.5} r={s*0.12} {...common}/>
      <circle cx={s*0.4} cy={s*0.5} r={s*0.05} fill={c} fillOpacity={0.3} stroke="none"/>
      <rect x={s*0.62} y={s*0.4} width={s*0.15} height={s*0.08} rx={s*0.02} fill={c} fillOpacity={0.2} stroke={c} strokeWidth={sw*0.5}/>
    </>,
    screen: <>
      <line x1={s*0.2} y1={s*0.15} x2={s*0.8} y2={s*0.15} {...common} strokeWidth={sw*1.5}/>
      <rect x={s*0.22} y={s*0.15} width={s*0.56} height={s*0.6} rx={s*0.02} {...common} fill={c} fillOpacity={0.05}/>
      <line x1={s*0.5} y1={s*0.75} x2={s*0.5} y2={s*0.88} {...common}/>
      <line x1={s*0.35} y1={s*0.88} x2={s*0.65} y2={s*0.88} {...common}/>
    </>,
    media_box: <>
      <rect x={s*0.15} y={s*0.3} width={s*0.7} height={s*0.4} rx={s*0.04} {...common}/>
      <path d={`M${s*0.35},${s*0.42} L${s*0.35},${s*0.58} L${s*0.48},${s*0.5} Z`} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
      <circle cx={s*0.7} cy={s*0.5} r={s*0.04} fill="#22c55e" stroke="none"/>
    </>,
    ir_emitter: <>
      <circle cx={s*0.35} cy={s*0.5} r={s*0.12} {...common}/>
      <circle cx={s*0.35} cy={s*0.5} r={s*0.04} fill={c} stroke="none"/>
      <path d={`M${s*0.52},${s*0.35} Q${s*0.62},${s*0.5} ${s*0.52},${s*0.65}`} {...common}/>
      <path d={`M${s*0.6},${s*0.3} Q${s*0.72},${s*0.5} ${s*0.6},${s*0.7}`} {...common}/>
      <path d={`M${s*0.68},${s*0.25} Q${s*0.82},${s*0.5} ${s*0.68},${s*0.75}`} {...common}/>
    </>,
    rj45: <>
      <rect x={s*0.2} y={s*0.2} width={s*0.6} height={s*0.55} rx={s*0.04} {...common}/>
      <rect x={s*0.32} y={s*0.35} width={s*0.36} height={s*0.25} rx={s*0.02} {...common}/>
      {[0,1,2,3].map(i=><line key={i} x1={s*(0.37+i*0.08)} y1={s*0.6} x2={s*(0.37+i*0.08)} y2={s*0.75} {...common} strokeWidth={sw*0.7}/>)}
      <text x={s*0.5} y={s*0.92} textAnchor="middle" fill={c} fontSize={s*0.11}>RJ45</text>
    </>,
    phone: <>
      <rect x={s*0.2} y={s*0.25} width={s*0.6} height={s*0.5} rx={s*0.04} {...common}/>
      <rect x={s*0.35} y={s*0.37} width={s*0.3} height={s*0.2} rx={s*0.02} {...common}/>
      {[0,1].map(i=><line key={i} x1={s*(0.42+i*0.15)} y1={s*0.57} x2={s*(0.42+i*0.15)} y2={s*0.75} {...common} strokeWidth={sw*0.7}/>)}
      <text x={s*0.5} y={s*0.92} textAnchor="middle" fill={c} fontSize={s*0.11}>TEL</text>
    </>,
    sip_phone: <>
      <rect x={s*0.2} y={s*0.2} width={s*0.6} height={s*0.45} rx={s*0.04} {...common}/>
      <rect x={s*0.28} y={s*0.28} width={s*0.3} height={s*0.2} rx={s*0.02} fill={c} fillOpacity={0.15} stroke={c} strokeWidth={sw*0.5}/>
      {[0,1,2].map(r=>[0,1,2].map(cc=><circle key={`${r}${cc}`} cx={s*(0.35+cc*0.12)} cy={s*(0.72+r*0.08)} r={s*0.025} fill={c} stroke="none"/>))}
      <circle cx={s*0.7} cy={s*0.35} r={s*0.04} fill="#22c55e" stroke="none"/>
      <text x={s*0.5} y={s*0.17} textAnchor="middle" fill={c} fontSize={s*0.08}>SIP</text>
    </>,
    outdoor_ap: <>
      <rect x={s*0.3} y={s*0.25} width={s*0.4} height={s*0.5} rx={s*0.05} {...common}/>
      <line x1={s*0.5} y1={s*0.08} x2={s*0.5} y2={s*0.25} {...common}/>
      <path d={`M${s*0.35},${s*0.08} L${s*0.5},${s*0.02} L${s*0.65},${s*0.08}`} {...common}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.08} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
      <path d={`M${s*0.3},${s*0.8} Q${s*0.5},${s*0.92} ${s*0.7},${s*0.8}`} {...common}/>
      <path d={`M${s*0.35},${s*0.88} Q${s*0.5},${s*0.96} ${s*0.65},${s*0.88}`} {...common}/>
    </>,
    bridge: <>
      <rect x={s*0.1} y={s*0.35} width={s*0.3} height={s*0.3} rx={s*0.04} {...common}/>
      <rect x={s*0.6} y={s*0.35} width={s*0.3} height={s*0.3} rx={s*0.04} {...common}/>
      <line x1={s*0.4} y1={s*0.5} x2={s*0.6} y2={s*0.5} {...common} strokeWidth={sw*1.5}/>
      <path d={`M${s*0.45},${s*0.42} L${s*0.55},${s*0.5} L${s*0.45},${s*0.58}`} {...common}/>
      <path d={`M${s*0.55},${s*0.42} L${s*0.45},${s*0.5} L${s*0.55},${s*0.58}`} {...common}/>
    </>,
    fiber_outlet: <>
      <circle cx={s*0.5} cy={s*0.45} r={s*0.25} {...common}/>
      <circle cx={s*0.5} cy={s*0.45} r={s*0.1} fill={c} fillOpacity={0.2} stroke={c} strokeWidth={sw}/>
      <text x={s*0.5} y={s*0.88} textAnchor="middle" fill={c} fontSize={s*0.11}>FIBER</text>
    </>,
    wifi_ap: <>
      <circle cx={s*0.5} cy={s*0.6} r={s*0.08} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
      <path d={`M${s*0.3},${s*0.42} Q${s*0.5},${s*0.28} ${s*0.7},${s*0.42}`} {...common}/>
      <path d={`M${s*0.2},${s*0.32} Q${s*0.5},${s*0.12} ${s*0.8},${s*0.32}`} {...common}/>
      <path d={`M${s*0.1},${s*0.22} Q${s*0.5},${s*-0.02} ${s*0.9},${s*0.22}`} {...common}/>
    </>,
    net_switch: <>
      <rect x={s*0.1} y={s*0.3} width={s*0.8} height={s*0.4} rx={s*0.04} {...common}/>
      {[0,1,2,3,4,5,6,7].map(i=><rect key={i} x={s*(0.15+i*0.09)} y={s*0.55} width={s*0.05} height={s*0.08} rx={s*0.005} fill={c} fillOpacity={i<5?0.4:0.15} stroke={c} strokeWidth={sw*0.4}/>)}
      {[0,1,2].map(i=><circle key={i} cx={s*(0.25+i*0.2)} cy={s*0.42} r={s*0.025} fill={i<2?'#22c55e':c} stroke="none"/>)}
    </>,
    patch_panel: <>
      <rect x={s*0.08} y={s*0.3} width={s*0.84} height={s*0.4} rx={s*0.03} {...common}/>
      {[0,1,2,3,4,5,6,7,8,9,10,11].map(i=><rect key={i} x={s*(0.12+i*0.065)} y={s*0.4} width={s*0.04} height={s*0.06} rx={s*0.005} fill={c} fillOpacity={0.25} stroke={c} strokeWidth={sw*0.4}/>)}
      {[0,1,2,3,4,5,6,7,8,9,10,11].map(i=><rect key={i} x={s*(0.12+i*0.065)} y={s*0.54} width={s*0.04} height={s*0.06} rx={s*0.005} fill={c} fillOpacity={0.15} stroke={c} strokeWidth={sw*0.4}/>)}
    </>,
    server_rack: <>
      <rect x={s*0.2} y={s*0.1} width={s*0.6} height={s*0.8} rx={s*0.04} {...common}/>
      {[0,1,2,3].map(i=><>
        <rect key={`r${i}`} x={s*0.26} y={s*(0.16+i*0.18)} width={s*0.48} height={s*0.12} rx={s*0.02} fill={c} fillOpacity={0.1} stroke={c} strokeWidth={sw*0.6}/>
        <circle key={`c${i}`} cx={s*0.68} cy={s*(0.22+i*0.18)} r={s*0.02} fill={i<3?'#22c55e':c} stroke="none"/>
      </>)}
    </>,
    ups: <>
      <rect x={s*0.2} y={s*0.15} width={s*0.6} height={s*0.7} rx={s*0.05} {...common}/>
      <path d={`M${s*0.42},${s*0.3} L${s*0.52},${s*0.48} L${s*0.45},${s*0.48} L${s*0.55},${s*0.7} L${s*0.48},${s*0.55} L${s*0.55},${s*0.55} L${s*0.42},${s*0.3}`} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
    </>,
    // Fire Sprinkler System
    sprinkler_head: <>
      <circle cx={s*0.5} cy={s*0.35} r={s*0.18} {...common}/>
      <path d={`M${s*0.5},${s*0.53} L${s*0.5},${s*0.7}`} {...common} strokeWidth={sw*1.5}/>
      <path d={`M${s*0.35},${s*0.7} L${s*0.5},${s*0.85} L${s*0.65},${s*0.7}`} {...common}/>
      <path d={`M${s*0.3},${s*0.25} L${s*0.22},${s*0.15}`} {...common}/>
      <path d={`M${s*0.7},${s*0.25} L${s*0.78},${s*0.15}`} {...common}/>
      <text x={s*0.5} y={s*0.4} textAnchor="middle" fill={c} fontSize={s*0.12} fontWeight="bold">S</text>
    </>,
    concealed_head: <>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.28} {...common}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.15} {...common} strokeDasharray={`${s/10},${s/12}`}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.06} fill={c} stroke="none"/>
      <text x={s*0.5} y={s*0.9} textAnchor="middle" fill={c} fontSize={s*0.1}>CSPR</text>
    </>,
    sidewall_head: <>
      <rect x={s*0.35} y={s*0.2} width={s*0.3} height={s*0.35} rx={s*0.04} {...common}/>
      <path d={`M${s*0.35},${s*0.55} L${s*0.25},${s*0.75}`} {...common}/>
      <path d={`M${s*0.65},${s*0.55} L${s*0.75},${s*0.75}`} {...common}/>
      <path d={`M${s*0.5},${s*0.55} L${s*0.5},${s*0.85}`} {...common}/>
      <path d={`M${s*0.25},${s*0.75} L${s*0.75},${s*0.75}`} {...common} strokeDasharray={`${s/8},${s/10}`}/>
    </>,
    sprinkler_pump: <>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.28} {...common}/>
      <path d={`M${s*0.15},${s*0.5} L${s*0.35},${s*0.5}`} {...common} strokeWidth={sw*1.5}/>
      <path d={`M${s*0.65},${s*0.5} L${s*0.85},${s*0.5}`} {...common} strokeWidth={sw*1.5}/>
      <path d={`M${s*0.5},${s*0.35} L${s*0.6},${s*0.5} L${s*0.5},${s*0.65} L${s*0.4},${s*0.5} Z`} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
      <text x={s*0.5} y={s*0.92} textAnchor="middle" fill={c} fontSize={s*0.1}>PUMP</text>
    </>,
    flow_switch: <>
      <rect x={s*0.2} y={s*0.35} width={s*0.6} height={s*0.3} rx={s*0.04} {...common}/>
      <path d={`M${s*0.35},${s*0.35} L${s*0.35},${s*0.2}`} {...common}/>
      <path d={`M${s*0.65},${s*0.35} L${s*0.65},${s*0.2}`} {...common}/>
      <path d={`M${s*0.35},${s*0.5} L${s*0.55},${s*0.5}`} {...common} strokeWidth={sw*1.5}/>
      <path d={`M${s*0.5},${s*0.42} L${s*0.6},${s*0.5} L${s*0.5},${s*0.58}`} fill={c} stroke="none"/>
      <text x={s*0.5} y={s*0.88} textAnchor="middle" fill={c} fontSize={s*0.1}>FLOW</text>
    </>,
    tamper_switch: <>
      <rect x={s*0.25} y={s*0.25} width={s*0.5} height={s*0.5} rx={s*0.04} {...common}/>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.12} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
      <path d={`M${s*0.5},${s*0.25} L${s*0.5},${s*0.15}`} {...common}/>
      <text x={s*0.5} y={s*0.92} textAnchor="middle" fill={c} fontSize={s*0.1}>TAMP</text>
    </>,
    fdc: <>
      <rect x={s*0.2} y={s*0.25} width={s*0.6} height={s*0.5} rx={s*0.05} {...common} fill={c} fillOpacity={0.15}/>
      <circle cx={s*0.35} cy={s*0.5} r={s*0.1} {...common}/>
      <circle cx={s*0.65} cy={s*0.5} r={s*0.1} {...common}/>
      <text x={s*0.5} y={s*0.92} textAnchor="middle" fill={c} fontSize={s*0.12} fontWeight="bold">FDC</text>
    </>,
    piv: <>
      <rect x={s*0.3} y={s*0.15} width={s*0.4} height={s*0.7} rx={s*0.04} {...common}/>
      <circle cx={s*0.5} cy={s*0.35} r={s*0.08} fill={c} fillOpacity={0.3} stroke={c} strokeWidth={sw}/>
      <path d={`M${s*0.5},${s*0.5} L${s*0.5},${s*0.7}`} {...common} strokeWidth={sw*1.5}/>
      <text x={s*0.5} y={s*0.92} textAnchor="middle" fill={c} fontSize={s*0.12} fontWeight="bold">PIV</text>
    </>,
    osy_valve: <>
      <circle cx={s*0.5} cy={s*0.45} r={s*0.22} {...common}/>
      <path d={`M${s*0.5},${s*0.23} L${s*0.5},${s*0.12}`} {...common} strokeWidth={sw*1.5}/>
      <path d={`M${s*0.4},${s*0.12} L${s*0.6},${s*0.12}`} {...common}/>
      <path d={`M${s*0.35},${s*0.45} L${s*0.65},${s*0.45}`} {...common}/>
      <text x={s*0.5} y={s*0.9} textAnchor="middle" fill={c} fontSize={s*0.1}>OS&Y</text>
    </>,
    check_valve: <>
      <circle cx={s*0.5} cy={s*0.5} r={s*0.25} {...common}/>
      <path d={`M${s*0.35},${s*0.35} L${s*0.65},${s*0.5} L${s*0.35},${s*0.65}`} {...common}/>
      <path d={`M${s*0.65},${s*0.35} L${s*0.65},${s*0.65}`} {...common}/>
      <text x={s*0.5} y={s*0.92} textAnchor="middle" fill={c} fontSize={s*0.1}>CHK</text>
    </>,
    drain_valve: <>
      <rect x={s*0.3} y={s*0.2} width={s*0.4} height={s*0.4} rx={s*0.04} {...common}/>
      <path d={`M${s*0.4},${s*0.6} L${s*0.4},${s*0.8}`} {...common}/>
      <path d={`M${s*0.6},${s*0.6} L${s*0.6},${s*0.8}`} {...common}/>
      <path d={`M${s*0.35},${s*0.8} L${s*0.65},${s*0.8}`} {...common}/>
      <text x={s*0.5} y={s*0.45} textAnchor="middle" fill={c} fontSize={s*0.1}>DRN</text>
    </>,
    inspector_test: <>
      <circle cx={s*0.5} cy={s*0.4} r={s*0.22} {...common}/>
      <path d={`M${s*0.5},${s*0.62} L${s*0.5},${s*0.85}`} {...common}/>
      <path d={`M${s*0.4},${s*0.75} L${s*0.5},${s*0.85} L${s*0.6},${s*0.75}`} {...common}/>
      <text x={s*0.5} y={s*0.45} textAnchor="middle" fill={c} fontSize={s*0.1}>TEST</text>
    </>,
  };

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }} data-export-svg="true">
      {icons[defId] || <>
        <rect x={s*0.15} y={s*0.15} width={s*0.7} height={s*0.7} rx={s*0.08} {...common}/>
        <text x={s*0.5} y={s*0.55} textAnchor="middle" fill={c} fontSize={s*0.18} fontWeight="bold">{defId.slice(0,3).toUpperCase()}</text>
      </>}
    </svg>
  );
};
