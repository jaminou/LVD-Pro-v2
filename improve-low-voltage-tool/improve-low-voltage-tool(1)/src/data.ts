import { ElementDef } from './types';

export const ELEMENTS: ElementDef[] = [
  // Alarm & Security
  { id: 'pir', name: 'PIR Motion', shortName: 'PIR', category: 'alarm' },
  { id: 'pir360', name: '360° PIR Motion', shortName: '360PIR', category: 'alarm' },
  { id: 'outdoor_motion', name: 'Outdoor Motion', shortName: 'OPIR', category: 'alarm' },
  { id: 'door_contact', name: 'Door/Window Contact', shortName: 'DWC', category: 'alarm' },
  { id: 'glass_break', name: 'Glass Break', shortName: 'GB', category: 'alarm' },
  { id: 'shatter', name: 'Shatter Detector', shortName: 'SHTR', category: 'alarm' },
  { id: 'flood', name: 'Flood Detector', shortName: 'FLD', category: 'alarm' },
  { id: 'vibration', name: 'Vibration Sensor', shortName: 'VIB', category: 'alarm' },
  { id: 'keypad', name: 'Keypad', shortName: 'KPD', category: 'alarm' },
  { id: 'alarm_panel', name: 'Alarm Panel', shortName: 'PNL', category: 'alarm' },
  { id: 'siren_in', name: 'Indoor Siren', shortName: 'SRN-I', category: 'alarm' },
  { id: 'siren_out', name: 'Outdoor Siren', shortName: 'SRN-O', category: 'alarm' },
  { id: 'panic', name: 'Panic Button', shortName: 'PAN', category: 'alarm' },

  // Fire Alarm
  { id: 'smoke_2w', name: '2W Smoke Detector', shortName: 'SMK-2W', category: 'fire' },
  { id: 'smoke_4w', name: '4W Smoke Detector', shortName: 'SMK-4W', category: 'fire' },
  { id: 'heat', name: 'Heat Detector', shortName: 'HT', category: 'fire' },
  { id: 'co', name: 'CO Detector', shortName: 'CO', category: 'fire' },
  { id: 'pull_station', name: 'Pull Station', shortName: 'PULL', category: 'fire' },
  { id: 'fire_bell', name: 'Fire Bell', shortName: 'BELL', category: 'fire' },
  { id: 'fire_strobe', name: 'Fire Strobe', shortName: 'STRB', category: 'fire' },
  { id: 'strobe_light', name: 'Strobe Light', shortName: 'STRB-L', category: 'fire' },
  { id: 'strobe_siren', name: 'Strobe Siren', shortName: 'STRB-S', category: 'fire' },
  { id: 'fire_keypad', name: 'Fire Alarm Keypad', shortName: 'FA-KPD', category: 'fire' },
  { id: 'annunciator', name: 'Annunciator', shortName: 'ANN', category: 'fire' },
  { id: 'fire_panel', name: 'Fire Panel', shortName: 'FPNL', category: 'fire' },
  { id: 'duct', name: 'Duct Detector', shortName: 'DUCT', category: 'fire' },

  // CCTV
  { id: 'cam_dome', name: 'Dome Camera', shortName: 'CAM-D', category: 'cctv' },
  { id: 'cam_bullet', name: 'Bullet Camera', shortName: 'CAM-B', category: 'cctv' },
  { id: 'cam_ptz', name: 'PTZ Camera', shortName: 'PTZ', category: 'cctv' },
  { id: 'cam_pan', name: 'Panoramic Camera', shortName: 'PAN-C', category: 'cctv' },
  { id: 'cam_ring', name: 'Ring Camera w/Light', shortName: 'RING', category: 'cctv' },
  { id: 'cam_doorbell', name: 'Doorbell Camera', shortName: 'DRBL', category: 'cctv' },
  { id: 'nvr', name: 'NVR/DVR', shortName: 'NVR', category: 'cctv' },

  // Sound System
  { id: 'spk_ceiling', name: 'Ceiling Speaker', shortName: 'SPK-C', category: 'sound' },
  { id: 'spk_wall', name: 'Wall Speaker', shortName: 'SPK-W', category: 'sound' },
  { id: 'spk_outdoor', name: 'Outdoor Speaker', shortName: 'SPK-O', category: 'sound' },
  { id: 'spk_center', name: 'Center Speaker', shortName: 'CTR', category: 'sound' },
  { id: 'subwoofer', name: 'Subwoofer', shortName: 'SUB', category: 'sound' },
  { id: 'amplifier', name: 'Amplifier', shortName: 'AMP', category: 'sound' },
  { id: 'volume', name: 'Volume Control', shortName: 'VOL', category: 'sound' },
  { id: 'soundbar', name: 'Soundbar', shortName: 'SBAR', category: 'sound' },
  { id: 'media_player', name: 'Media Player', shortName: 'MP', category: 'sound' },
  { id: 'receiver', name: 'Receiver', shortName: 'RCV', category: 'sound' },
  { id: 'spk_selector', name: 'Speaker Selector', shortName: 'SPKS', category: 'sound' },

  // Home Automation
  { id: 'smart_switch', name: 'Smart Switch', shortName: 'SW', category: 'automation' },
  { id: 'smart_dimmer', name: 'Smart Dimmer', shortName: 'DIM', category: 'automation' },
  { id: 'smart_lock', name: 'Smart Lock', shortName: 'LCK', category: 'automation' },
  { id: 'smart_outlet', name: 'Smart Outlet', shortName: 'OUT', category: 'automation' },
  { id: 'thermostat', name: 'Thermostat', shortName: 'THERM', category: 'automation' },
  { id: 'hub', name: 'Smart Hub', shortName: 'HUB', category: 'automation' },
  { id: 'shades', name: 'Motorized Shades', shortName: 'SHDE', category: 'automation' },
  { id: 'touch_panel', name: 'Touch Panel', shortName: 'TP', category: 'automation' },
  { id: 'auto_keypad', name: 'Automation Keypad', shortName: 'AKPD', category: 'automation' },

  // TV & Entertainment
  { id: 'tv_outlet', name: 'TV Outlet', shortName: 'TV-O', category: 'tv' },
  { id: 'hdmi_outlet', name: 'HDMI Outlet', shortName: 'HDMI', category: 'tv' },
  { id: 'projector', name: 'Projector', shortName: 'PROJ', category: 'tv' },
  { id: 'screen', name: 'Projection Screen', shortName: 'SCR', category: 'tv' },
  { id: 'media_box', name: 'Media Player Box', shortName: 'MPB', category: 'tv' },
  { id: 'ir_emitter', name: 'IR Emitter', shortName: 'IR', category: 'tv' },

  // Data & Network
  { id: 'rj45', name: 'RJ45 Outlet', shortName: 'RJ45', category: 'data' },
  { id: 'phone', name: 'Phone Outlet', shortName: 'TEL', category: 'data' },
  { id: 'sip_phone', name: 'SIP Phone', shortName: 'SIP', category: 'data' },
  { id: 'fiber_outlet', name: 'Fiber Outlet', shortName: 'FBR', category: 'data' },
  { id: 'wifi_ap', name: 'Wi-Fi AP', shortName: 'AP', category: 'data' },
  { id: 'outdoor_ap', name: 'Outdoor AP', shortName: 'OAP', category: 'data' },
  { id: 'bridge', name: 'Network Bridge', shortName: 'BRG', category: 'data' },
  { id: 'net_switch', name: 'Network Switch', shortName: 'SW', category: 'data' },
  { id: 'patch_panel', name: 'Patch Panel', shortName: 'PP', category: 'data' },
  { id: 'server_rack', name: 'Server Rack', shortName: 'RACK', category: 'data' },
  { id: 'ups', name: 'UPS', shortName: 'UPS', category: 'data' },
];
