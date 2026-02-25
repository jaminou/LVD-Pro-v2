import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ELEMENTS } from './data';
import {
  PlacedElement, Cable, PlacedLabel, MeasureLine, Drawing, TextAnnotation, Stamp, Group,
  Category, CATEGORY_COLORS, CATEGORY_LABELS, CableType, CABLE_COLORS, CABLE_LABELS, CABLE_DASH,
  LabelPreset, DEFAULT_LABEL_PRESETS, SCALE_PRESETS, ICON_SIZES, IconSize, DisplayMode,
  DEFAULT_CATEGORY_COLORS, ProjectFile
} from './types';
import { SchematicIcon } from './SchematicIcon';

interface Shape {
  id: string;
  type: 'rect' | 'circle' | 'oval' | 'triangle' | 'line';
  x: number; y: number; width: number; height: number;
  color: string; fill: boolean;
  points?: { x: number; y: number }[];
}

interface FeatureFlag {
  key: string; label: string; description: string;
}

const FEATURES: FeatureFlag[] = [
  { key: 'place', label: 'Place Elements', description: 'Place icons on the plan' },
  { key: 'cables', label: 'Cables', description: 'Draw cable runs' },
  { key: 'labels', label: 'Labels', description: 'Place zone/area labels' },
  { key: 'measure', label: 'Measure', description: 'Measure distances' },
  { key: 'shapes', label: 'Shapes', description: 'Draw shapes' },
  { key: 'export', label: 'Export', description: 'Export as PNG/JPG/PDF' },
  { key: 'legend', label: 'Legend', description: 'Show icon legend' },
  { key: 'infobox', label: 'Info Box', description: 'Project summary' },
];

const LABEL_SIZES: Record<string, number> = { S: 14, M: 18, L: 24, XL: 32, XXL: 42 };
const CATEGORIES: Category[] = ['alarm', 'fire', 'cctv', 'sound', 'automation', 'tv', 'data'];

export const App: React.FC = () => {
  // File
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgNaturalSize, setBgNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Elements
  const [elements, setElements] = useState<PlacedElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [activeCat, setActiveCat] = useState<Category>('alarm');
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [elementCounters, setElementCounters] = useState<Record<string, number>>({});
  const [deletedNumbers, setDeletedNumbers] = useState<Record<string, number[]>>({});
  const [iconColors, setIconColors] = useState<Record<string, string>>({});
  const [categoryColors, setCategoryColors] = useState<Record<Category, string>>({ ...CATEGORY_COLORS });
  const [customElementNames, setCustomElementNames] = useState<Record<string, string>>({});
  const [bwMode, setBwMode] = useState(false);

  // Cables
  const [cables, setCables] = useState<Cable[]>([]);
  const [selectedCable, setSelectedCable] = useState<number | null>(null);
  const [activeCableType, setActiveCableType] = useState<CableType>('alarm');
  const [cableColor, setCableColor] = useState(CABLE_COLORS.alarm);
  const [drawingCable, setDrawingCable] = useState<{ x: number; y: number }[]>([]);
  const [curvedCables, setCurvedCables] = useState(false);
  const [showCableLengths, setShowCableLengths] = useState(true);

  // Labels
  const [labels, setLabels] = useState<PlacedLabel[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [activeLabelType, setActiveLabelType] = useState('zone');
  const [labelCounters, setLabelCounters] = useState<Record<string, number>>({});
  const [labelPresets, setLabelPresets] = useState<LabelPreset[]>([...DEFAULT_LABEL_PRESETS]);
  const [customLabelPresets, setCustomLabelPresets] = useState<LabelPreset[]>([]);
  const [placementLabelSize, setPlacementLabelSize] = useState(18);

  // Measures
  const [measures, setMeasures] = useState<MeasureLine[]>([]);
  const [selectedMeasure, setSelectedMeasure] = useState<number | null>(null);
  const [drawingMeasure, setDrawingMeasure] = useState<{ x: number; y: number }[]>([]);
  const [measureColor, setMeasureColor] = useState('#000000');
  const [scale, setScale] = useState(SCALE_PRESETS[2]);
  const [calibratedPxPerFt, setCalibratedPxPerFt] = useState<number | null>(null);
  const [showRuler, setShowRuler] = useState(false);

  // Drawing
  const [drawings] = useState<Drawing[]>([]);
  const [texts] = useState<TextAnnotation[]>([]);

  // Shapes
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [activeShapeType, setActiveShapeType] = useState<'rect' | 'circle' | 'oval' | 'triangle' | 'line' | null>(null);
  const [shapeColor, setShapeColor] = useState('#000000');
  const [shapeFill, setShapeFill] = useState(false);
  const [drawingShape, setDrawingShape] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [shiftKey, setShiftKey] = useState(false);

  // Stamp/Groups
  const [stamp, setStamp] = useState<Stamp | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  // UI
  const [tool, setTool] = useState<'select' | 'place' | 'cable' | 'label' | 'measure' | 'draw' | 'shape' | 'text' | 'pan'>('select');
  const [sideTab, setSideTab] = useState<'elements' | 'cables' | 'labels' | 'layers' | 'measure' | 'draw' | 'save'>('elements');
  const [layers, setLayers] = useState({
    alarm: true, fire: true, cctv: true, sound: true,
    automation: true, tv: true, data: true,
    cables: true, drawings: true, texts: true, measures: true,
    labels: true, stamp: true, shapes: true, infoBox: true
  });
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showInfoBox, setShowInfoBox] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [autoSelect, setAutoSelect] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [tabOrderMode, setTabOrderMode] = useState(false);
  const [tabOrderNext, setTabOrderNext] = useState(1);
  const [defaultIconSize, setDefaultIconSize] = useState<IconSize>('m');
  const [defaultLabelSize] = useState<IconSize>('m');
  const [defaultDisplay, setDefaultDisplay] = useState<DisplayMode>('both');
  const [labelTextColor, setLabelTextColor] = useState('#000000');
  const [labelBgColor, setLabelBgColor] = useState('#ffffff');

  // Admin
  const [adminMode, setAdminMode] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean>>(
    Object.fromEntries(FEATURES.map(f => [f.key, true]))
  );

  // Dragging
  const [dragState, setDragState] = useState<{ uid: string; startX: number; startY: number; elStartX: number; elStartY: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // History
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [historyLock, setHistoryLock] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fe = (key: string) => enabledFeatures[key] !== false;

  // Effective scale
  const getEffectivePxPerFt = () => calibratedPxPerFt || scale.ratio;

  // State snapshot
  const getState = useCallback(() => JSON.stringify({
    elements, cables, labels, measures, drawings, texts, shapes, stamp, groups
  }), [elements, cables, labels, measures, drawings, texts, shapes, stamp, groups]);

  // Push history
  const pushHistory = useCallback(() => {
    if (historyLock) return;
    const snap = getState();
    const nh = history.slice(0, historyIndex + 1);
    nh.push(snap);
    if (nh.length > 50) nh.shift();
    setHistory(nh);
    setHistoryIndex(nh.length - 1);
  }, [history, historyIndex, getState, historyLock]);

  const restoreState = (snap: string) => {
    setHistoryLock(true);
    const s = JSON.parse(snap);
    setElements(s.elements || []);
    setCables(s.cables || []);
    setLabels(s.labels || []);
    setMeasures(s.measures || []);
    setShapes(s.shapes || []);
    setStamp(s.stamp || null);
    setGroups(s.groups || []);
    setTimeout(() => setHistoryLock(false), 100);
  };

  const undo = () => { if (historyIndex > 0) { restoreState(history[historyIndex - 1]); setHistoryIndex(historyIndex - 1); } };
  const redo = () => { if (historyIndex < history.length - 1) { restoreState(history[historyIndex + 1]); setHistoryIndex(historyIndex + 1); } };

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftKey(true);
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape') {
        setDrawingCable([]); setDrawingMeasure([]); setDrawingShape(null);
        setSelectedElement(null); setSelectedElements([]); setSelectedShape(null);
        setTabOrderMode(false); setTool('select');
      }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); }
      if (e.key === 'v' || e.key === 'V') setTool('select');
      if (e.key === 'h' || e.key === 'H') setTool('pan');
      if ((e.key === 'w' || e.key === 'W') && !e.ctrlKey) { setTool('place'); setSideTab('elements'); }
      if (e.key === 'm' || e.key === 'M') { setTool('measure'); setSideTab('measure'); }
      if (e.key === 'l' || e.key === 'L') { setTool('label'); setSideTab('labels'); }
      if (e.key === ' ') { e.preventDefault(); setTool('pan'); }
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.ctrlKey && e.key === 'o') { e.preventDefault(); fileInputRef.current?.click(); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveProject(); }
      if (e.ctrlKey && e.key === 'p') { e.preventDefault(); window.print(); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftKey(false);
      if (e.key === ' ') setTool('select');
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  });

  // Delete
  const deleteSelected = () => {
    let changed = false;
    if (selectedElements.length > 0) {
      const toDelete = elements.filter(el => selectedElements.includes(el.uid));
      toDelete.forEach(el => {
        const key = el.defId;
        setDeletedNumbers(prev => ({ ...prev, [key]: [...(prev[key] || []), el.number].sort((a, b) => a - b) }));
      });
      setElements(prev => prev.filter(el => !selectedElements.includes(el.uid)));
      setSelectedElements([]); setSelectedElement(null); changed = true;
    } else if (selectedElement) {
      const el = elements.find(e => e.uid === selectedElement);
      if (el) {
        const key = el.defId;
        setDeletedNumbers(prev => ({ ...prev, [key]: [...(prev[key] || []), el.number].sort((a, b) => a - b) }));
        setElements(prev => prev.filter(e => e.uid !== selectedElement));
      }
      setSelectedElement(null); changed = true;
    }
    if (selectedShape) { setShapes(prev => prev.filter(s => s.id !== selectedShape)); setSelectedShape(null); changed = true; }
    if (selectedCable !== null) { setCables(prev => prev.filter((_, i) => i !== selectedCable)); setSelectedCable(null); changed = true; }
    if (selectedMeasure !== null) { setMeasures(prev => prev.filter((_, i) => i !== selectedMeasure)); setSelectedMeasure(null); changed = true; }
    if (selectedLabel) {
      setLabels(prev => prev.filter(l => l.uid !== selectedLabel));
      setSelectedLabel(null); changed = true;
    }
    if (changed) pushHistory();
  };

  // Coords
  const toCanvasCoords = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
  };

  // Get next number (reuses deleted)
  const getNextNumber = (defId: string) => {
    const deleted = deletedNumbers[defId] || [];
    if (deleted.length > 0) {
      const num = deleted[0];
      setDeletedNumbers(prev => ({ ...prev, [defId]: prev[defId].slice(1) }));
      return num;
    }
    const count = (elementCounters[defId] || 0) + 1;
    setElementCounters(prev => ({ ...prev, [defId]: count }));
    return count;
  };

  // File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.endsWith('.lvproj')) {
      const reader = new FileReader();
      reader.onload = (ev) => { try { loadProject(JSON.parse(ev.target?.result as string)); } catch { alert('Invalid project file'); } };
      reader.readAsText(file);
    } else if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) { alert('PDF.js not loaded'); return; }
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const pdf = await pdfjsLib.getDocument(new Uint8Array(ev.target?.result as ArrayBuffer)).promise;
          const page = await pdf.getPage(1);
          const vp = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = vp.width; canvas.height = vp.height;
          await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
          setBgImage(canvas.toDataURL('image/png'));
          setProjectName(file.name.replace('.pdf', ''));
        } catch { alert('Failed to load PDF'); }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => { setBgImage(ev.target?.result as string); setProjectName(file.name.replace(/\.[^/.]+$/, '')); };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
    setShowFileMenu(false);
  };

  // Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => { setBgImage(ev.target?.result as string); setProjectName(file.name.replace(/\.[^/.]+$/, '')); };
      reader.readAsDataURL(file);
    }
  };

  // Save/Load project
  const saveProject = () => {
    const project: ProjectFile = {
      version: '2.0', projectName, bgImage, elements, cables, labels, measures, drawings, texts, shapes,
      stamp, groups, categoryColors, iconColors, customElementNames, labelPresets, customLabelPresets,
      scale, elementCounters, labelCounters, showCableLengths, bwMode
    };
    const blob = new Blob([JSON.stringify(project)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${projectName}.lvproj`;
    a.click();
  };

  const loadProject = (p: ProjectFile) => {
    setProjectName(p.projectName || 'Untitled');
    setBgImage(p.bgImage || null);
    setElements(p.elements || []);
    setCables(p.cables || []);
    setLabels(p.labels || []);
    setMeasures(p.measures || []);
    setShapes(p.shapes || []);
    setStamp(p.stamp || null);
    setGroups(p.groups || []);
    if (p.categoryColors) setCategoryColors(p.categoryColors);
    if (p.iconColors) setIconColors(p.iconColors);
    if (p.customElementNames) setCustomElementNames(p.customElementNames);
    if (p.labelPresets) setLabelPresets(p.labelPresets);
    if (p.customLabelPresets) setCustomLabelPresets(p.customLabelPresets);
    if (p.scale) setScale(p.scale);
    if (p.elementCounters) setElementCounters(p.elementCounters);
    if (p.labelCounters) setLabelCounters(p.labelCounters);
    if (p.showCableLengths !== undefined) setShowCableLengths(p.showCableLengths);
    if (p.bwMode !== undefined) setBwMode(p.bwMode);
  };

  // Reset (keeps floor plan)
  const handleReset = () => {
    setElements([]); setCables([]); setLabels([]); setMeasures([]); setShapes([]);
    setStamp(null); setGroups([]); setSelectedElement(null); setSelectedElements([]);
    setSelectedShape(null); setElementCounters({}); setLabelCounters({}); setDeletedNumbers({});
    setDrawingCable([]); setDrawingMeasure([]); setShowResetConfirm(false);
    pushHistory();
  };

  // Close (removes floor plan too)
  const handleCloseProject = () => {
    handleReset();
    setBgImage(null); setBgNaturalSize(null); setProjectName('Untitled Project');
    setZoom(1); setPan({ x: 0, y: 0 });
  };

  // Fit to view
  const fitToView = () => {
    if (!scrollRef.current) return;
    const vw = scrollRef.current.clientWidth - 40;
    const vh = scrollRef.current.clientHeight - 40;
    const cw = bgNaturalSize?.w || 1200;
    const ch = bgNaturalSize?.h || 800;
    const z = Math.min(vw / cw, vh / ch, 2);
    setZoom(Math.round(z * 100) / 100);
    setPan({ x: 0, y: 0 });
    if (scrollRef.current) { scrollRef.current.scrollTop = 0; scrollRef.current.scrollLeft = 0; }
  };

  // Export
  const exportAs = async (format: 'png' | 'jpg' | 'pdf') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Convert SVGs to images for export
    const svgs = canvas.querySelectorAll('[data-export-svg]');
    const originals: { el: Element; parent: HTMLElement; img: HTMLImageElement }[] = [];
    for (const svg of Array.from(svgs)) {
      const svgEl = svg as SVGSVGElement;
      const xml = new XMLSerializer().serializeToString(svgEl);
      const img = document.createElement('img');
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
      img.width = svgEl.width.baseVal.value;
      img.height = svgEl.height.baseVal.value;
      img.style.display = 'block';
      const parent = svgEl.parentElement!;
      originals.push({ el: svgEl, parent, img });
      parent.replaceChild(img, svgEl);
    }
    await new Promise(r => setTimeout(r, 200));
    const html2canvas = (await import('html2canvas')).default;
    const ci = await html2canvas(canvas, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
    // Restore SVGs
    originals.forEach(({ el, parent, img }) => { parent.replaceChild(el, img); });

    if (format === 'pdf') {
      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF({ orientation: ci.width > ci.height ? 'landscape' : 'portrait', unit: 'px', format: [ci.width, ci.height] });
      pdf.addImage(ci.toDataURL('image/png'), 'PNG', 0, 0, ci.width, ci.height);
      pdf.save(`${projectName}.pdf`);
    } else {
      const a = document.createElement('a');
      a.download = `${projectName}.${format}`;
      a.href = ci.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`);
      a.click();
    }
  };

  // Cable length
  const getCableLength = (points: { x: number; y: number }[]) => {
    let len = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return (len / getEffectivePxPerFt()).toFixed(1);
  };

  // Get segment length
  const getSegmentLength = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return (Math.sqrt(dx * dx + dy * dy) / getEffectivePxPerFt()).toFixed(1);
  };

  // Element def
  const getElementDef = (defId: string) => ELEMENTS.find(e => e.id === defId);

  // Get effective icon color
  const getIconColor = (defId: string, category: Category) => {
    if (bwMode) return '#000000';
    return iconColors[defId] || categoryColors[category] || CATEGORY_COLORS[category];
  };

  // Alignment
  const alignElements = (alignment: string) => {
    if (selectedElements.length < 2) return;
    const sel = elements.filter(e => selectedElements.includes(e.uid));
    const updates: Record<string, { x?: number; y?: number }> = {};
    switch (alignment) {
      case 'left': { const m = Math.min(...sel.map(e => e.x)); sel.forEach(e => { updates[e.uid] = { x: m }; }); break; }
      case 'right': { const m = Math.max(...sel.map(e => e.x)); sel.forEach(e => { updates[e.uid] = { x: m }; }); break; }
      case 'top': { const m = Math.min(...sel.map(e => e.y)); sel.forEach(e => { updates[e.uid] = { y: m }; }); break; }
      case 'bottom': { const m = Math.max(...sel.map(e => e.y)); sel.forEach(e => { updates[e.uid] = { y: m }; }); break; }
      case 'centerH': { const m = sel.reduce((s, e) => s + e.x, 0) / sel.length; sel.forEach(e => { updates[e.uid] = { x: m }; }); break; }
      case 'centerV': { const m = sel.reduce((s, e) => s + e.y, 0) / sel.length; sel.forEach(e => { updates[e.uid] = { y: m }; }); break; }
      case 'distributeH': { const sorted = [...sel].sort((a, b) => a.x - b.x); const min = sorted[0].x; const max = sorted[sorted.length - 1].x; const step = (max - min) / (sorted.length - 1); sorted.forEach((e, i) => { updates[e.uid] = { x: min + step * i }; }); break; }
      case 'distributeV': { const sorted = [...sel].sort((a, b) => a.y - b.y); const min = sorted[0].y; const max = sorted[sorted.length - 1].y; const step = (max - min) / (sorted.length - 1); sorted.forEach((e, i) => { updates[e.uid] = { y: min + step * i }; }); break; }
    }
    setElements(prev => prev.map(e => updates[e.uid] ? { ...e, ...updates[e.uid] } : e));
    pushHistory();
  };

  // Z-order
  const bringToFront = () => {
    const maxZ = Math.max(...elements.map(e => e.zIndex || 0), 0);
    setElements(prev => prev.map(e => selectedElements.includes(e.uid) || e.uid === selectedElement ? { ...e, zIndex: maxZ + 1 } : e));
    pushHistory();
  };
  const sendToBack = () => {
    const minZ = Math.min(...elements.map(e => e.zIndex || 0), 0);
    setElements(prev => prev.map(e => selectedElements.includes(e.uid) || e.uid === selectedElement ? { ...e, zIndex: minZ - 1 } : e));
    pushHistory();
  };

  // Canvas click
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.button !== 0 || isPanning) return;
    const coords = toCanvasCoords(e);
    setShowFileMenu(false);

    // Tab order mode
    if (tabOrderMode) {
      const clickedEl = elements.find(el => Math.abs(el.x - coords.x) < 25 && Math.abs(el.y - coords.y) < 25);
      if (clickedEl) {
        const def = getElementDef(clickedEl.defId);
        if (def) {
          setElements(prev => prev.map(el => el.uid === clickedEl.uid
            ? { ...el, number: tabOrderNext, label: `${customElementNames[def.id] || def.shortName || def.name}-${tabOrderNext.toString().padStart(3, '0')}` }
            : el));
          setTabOrderNext(tabOrderNext + 1);
        }
      }
      const clickedLabel = labels.find(l => Math.abs(l.x - coords.x) < 30 && Math.abs(l.y - coords.y) < 15);
      if (clickedLabel) {
        setLabels(prev => prev.map(l => l.uid === clickedLabel.uid ? { ...l, number: tabOrderNext } : l));
        setTabOrderNext(tabOrderNext + 1);
      }
      return;
    }

    if (tool === 'place' && activeElement && fe('place')) {
      const def = ELEMENTS.find(el => el.id === activeElement);
      if (!def) return;
      const num = getNextNumber(def.id);
      const newEl: PlacedElement = {
        uid: `el-${Date.now()}`, defId: def.id, x: coords.x, y: coords.y, rotation: 0,
        label: `${customElementNames[def.id] || def.shortName || def.name}-${num.toString().padStart(3, '0')}`,
        labelOffsetX: 0, labelOffsetY: 30, notes: '', size: defaultIconSize, labelSize: defaultLabelSize,
        display: defaultDisplay, number: num, zIndex: elements.length
      };
      setElements(prev => [...prev, newEl]);
      pushHistory();
      if (autoSelect) {
        setTool('select');
        setSelectedElement(newEl.uid);
        setSelectedElements([newEl.uid]);
      }
    } else if (tool === 'cable' && fe('cables')) {
      setDrawingCable(prev => [...prev, coords]);
    } else if (tool === 'measure' && fe('measure')) {
      setDrawingMeasure(prev => [...prev, coords]);
    } else if (tool === 'label' && fe('labels')) {
      const allPresets = [...labelPresets, ...customLabelPresets];
      const preset = allPresets.find(p => p.type === activeLabelType) || allPresets[0];
      if (!preset) return;
      const inc = preset.incrementMode === 'ten-up' ? 10 : preset.incrementMode === 'two-up' ? 2 : 1;
      const count = (labelCounters[activeLabelType] || (preset.startNumber || 0)) + inc;
      setLabelCounters(prev => ({ ...prev, [activeLabelType]: count }));
      const newLabel: PlacedLabel = {
        uid: `lbl-${Date.now()}`, type: preset.type as any, prefix: preset.prefix,
        number: count, x: coords.x, y: coords.y, color: preset.color, size: placementLabelSize
      };
      setLabels(prev => [...prev, newLabel]);
      pushHistory();
      if (autoSelect) {
        setTool('select');
        setSelectedLabel(newLabel.uid);
      }
    } else if (tool === 'select') {
      const clickedEl = elements.find(el => Math.abs(el.x - coords.x) < 25 && Math.abs(el.y - coords.y) < 25);
      if (clickedEl) {
        if (e.shiftKey) {
          setSelectedElements(prev => prev.includes(clickedEl.uid) ? prev.filter(id => id !== clickedEl.uid) : [...prev, clickedEl.uid]);
        } else {
          setSelectedElement(clickedEl.uid);
          setSelectedElements([clickedEl.uid]);
          setShowProperties(true);
        }
        setSelectedShape(null); setSelectedCable(null); setSelectedMeasure(null); setSelectedLabel(null);
      } else {
        const clickedLabel = labels.find(l => Math.abs(l.x - coords.x) < 30 && Math.abs(l.y - coords.y) < 15);
        if (clickedLabel) {
          setSelectedLabel(clickedLabel.uid);
          setSelectedElement(null); setSelectedElements([]); setSelectedShape(null);
          setSideTab('labels');
        } else {
          setSelectedElement(null); setSelectedElements([]); setSelectedShape(null);
          setSelectedCable(null); setSelectedMeasure(null); setSelectedLabel(null);
        }
      }
    }
  };

  // Double click to finish cable/measure
  const handleCanvasDoubleClick = () => {
    if (tool === 'cable' && drawingCable.length >= 2) {
      setCables(prev => [...prev, { uid: `cable-${Date.now()}`, type: activeCableType, points: drawingCable, color: cableColor, curved: curvedCables, showLength: showCableLengths }]);
      setDrawingCable([]); pushHistory();
    } else if (tool === 'measure' && drawingMeasure.length >= 2) {
      setMeasures(prev => [...prev, { uid: `measure-${Date.now()}`, points: drawingMeasure, color: measureColor }]);
      setDrawingMeasure([]); pushHistory();
    }
  };

  // Mouse down for shapes & dragging
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (tool === 'pan' || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    if (tool === 'shape' && activeShapeType) {
      const coords = toCanvasCoords(e);
      setDrawingShape({ startX: coords.x, startY: coords.y, currentX: coords.x, currentY: coords.y });
      return;
    }
    if (tool === 'select') {
      const coords = toCanvasCoords(e);
      const clickedEl = elements.find(el => Math.abs(el.x - coords.x) < 25 && Math.abs(el.y - coords.y) < 25);
      if (clickedEl) {
        setDragState({ uid: clickedEl.uid, startX: coords.x, startY: coords.y, elStartX: clickedEl.x, elStartY: clickedEl.y });
        if (!selectedElements.includes(clickedEl.uid)) {
          if (!e.shiftKey) { setSelectedElement(clickedEl.uid); setSelectedElements([clickedEl.uid]); }
        }
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    if (drawingShape && tool === 'shape') {
      const coords = toCanvasCoords(e);
      let nx = coords.x, ny = coords.y;
      if (shiftKey && activeShapeType === 'line') {
        if (Math.abs(coords.x - drawingShape.startX) > Math.abs(coords.y - drawingShape.startY)) ny = drawingShape.startY;
        else nx = drawingShape.startX;
      }
      if (shiftKey && (activeShapeType === 'rect' || activeShapeType === 'circle')) {
        const sz = Math.max(Math.abs(nx - drawingShape.startX), Math.abs(ny - drawingShape.startY));
        nx = drawingShape.startX + (nx > drawingShape.startX ? sz : -sz);
        ny = drawingShape.startY + (ny > drawingShape.startY ? sz : -sz);
      }
      setDrawingShape(prev => prev ? { ...prev, currentX: nx, currentY: ny } : null);
    }
    if (dragState && tool === 'select') {
      const coords = toCanvasCoords(e);
      const dx = coords.x - dragState.startX;
      const dy = coords.y - dragState.startY;
      if (selectedElements.length > 1 && selectedElements.includes(dragState.uid)) {
        setElements(prev => prev.map(el => selectedElements.includes(el.uid) ? { ...el, x: el.x + dx, y: el.y + dy } : el));
        setDragState(prev => prev ? { ...prev, startX: coords.x, startY: coords.y } : null);
      } else {
        setElements(prev => prev.map(el => el.uid === dragState.uid ? { ...el, x: dragState.elStartX + dx, y: dragState.elStartY + dy } : el));
      }
    }
  };

  const handleCanvasMouseUp = () => {
    if (isPanning) { setIsPanning(false); return; }
    if (dragState) { setDragState(null); pushHistory(); }
    if (drawingShape && tool === 'shape' && activeShapeType) {
      const { startX, startY, currentX, currentY } = drawingShape;
      const w = Math.abs(currentX - startX), h = Math.abs(currentY - startY);
      if (w > 5 || h > 5) {
        setShapes(prev => [...prev, {
          id: `shape-${Date.now()}`, type: activeShapeType,
          x: Math.min(startX, currentX), y: Math.min(startY, currentY), width: w, height: h,
          color: shapeColor, fill: shapeFill,
          points: activeShapeType === 'line' ? [{ x: startX, y: startY }, { x: currentX, y: currentY }] : undefined
        }]);
        pushHistory();
      }
      setDrawingShape(null);
    }
  };

  // Context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Scroll zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setZoom(z => Math.max(0.1, Math.min(5, z + (e.deltaY < 0 ? 0.05 : -0.05))));
    }
  };

  // Info box data
  const getInfoBoxData = () => {
    const ec: Record<string, number> = {};
    elements.forEach(el => {
      const def = getElementDef(el.defId);
      const key = customElementNames[el.defId] || def?.shortName || def?.name || el.defId;
      ec[key] = (ec[key] || 0) + 1;
    });
    const cl: Record<string, number> = {};
    cables.forEach(c => {
      const len = parseFloat(getCableLength(c.points));
      cl[CABLE_LABELS[c.type]] = (cl[CABLE_LABELS[c.type]] || 0) + len;
    });
    return { elementCounts: ec, cableLengths: cl };
  };

  // Sorted elements by zIndex
  const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  // Ruler step
  const pxPerFt = getEffectivePxPerFt();
  const rulerStep = pxPerFt * zoom < 20 ? 10 : pxPerFt * zoom < 40 ? 5 : 1;

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white select-none">
      {/* TOOLBAR */}
      <div className="bg-gray-800 border-b border-gray-700 px-2 py-1.5 flex items-center gap-1 flex-wrap text-sm">
        <span className="font-bold text-blue-400 mr-2">LV Designer PRO</span>

        {/* File menu */}
        <div className="relative">
          <button onClick={() => setShowFileMenu(!showFileMenu)} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">📁 File</button>
          {showFileMenu && (
            <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 z-50 min-w-[200px]">
              <button onClick={() => { fileInputRef.current?.click(); }} className="w-full px-4 py-2 text-left hover:bg-blue-600">📂 Open Floor Plan</button>
              <button onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.lvproj'; inp.onchange = (ev: any) => { const f = ev.target.files[0]; if(f) { const r = new FileReader(); r.onload = (e: any) => { try { loadProject(JSON.parse(e.target.result)); } catch { alert('Invalid file'); } }; r.readAsText(f); } }; inp.click(); setShowFileMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-blue-600">📦 Open Project (.lvproj)</button>
              <div className="border-t border-gray-600 my-1" />
              <button onClick={() => { saveProject(); setShowFileMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-blue-600">💾 Save Project</button>
              <div className="border-t border-gray-600 my-1" />
              {fe('export') && <>
                <button onClick={() => { exportAs('png'); setShowFileMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-blue-600">🖼️ Export PNG</button>
                <button onClick={() => { exportAs('jpg'); setShowFileMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-blue-600">🖼️ Export JPG</button>
                <button onClick={() => { exportAs('pdf'); setShowFileMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-blue-600">📄 Export PDF</button>
              </>}
              <div className="border-t border-gray-600 my-1" />
              <button onClick={() => { window.print(); setShowFileMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-blue-600">🖨️ Print</button>
              <div className="border-t border-gray-600 my-1" />
              <button onClick={() => { handleCloseProject(); setShowFileMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-blue-600">❌ Close Project</button>
              <button onClick={() => { setShowResetConfirm(true); setShowFileMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-red-600 text-red-300">🔄 Reset All</button>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-gray-600" />
        <button onClick={() => setShowResetConfirm(true)} className="px-2 py-1 bg-red-700 rounded hover:bg-red-600" title="Reset All">🔄</button>

        <div className="h-5 w-px bg-gray-600" />
        <button onClick={() => setTool('select')} className={`px-2 py-1 rounded ${tool === 'select' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>👆 Select</button>
        <button onClick={() => setTool('pan')} className={`px-2 py-1 rounded ${tool === 'pan' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>✋ Pan</button>
        {fe('place') && <button onClick={() => { setTool('place'); setSideTab('elements'); }} className={`px-2 py-1 rounded ${tool === 'place' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>📍 Place</button>}
        {fe('cables') && <button onClick={() => { setTool('cable'); setSideTab('cables'); }} className={`px-2 py-1 rounded ${tool === 'cable' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>🔌 Cable</button>}
        {fe('cables') && <button onClick={() => setCurvedCables(!curvedCables)} className={`px-2 py-1 rounded ${curvedCables ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`} title="Curved cables">〰️</button>}
        {fe('labels') && <button onClick={() => { setTool('label'); setSideTab('labels'); }} className={`px-2 py-1 rounded ${tool === 'label' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>🏷️ Label</button>}
        {fe('measure') && <button onClick={() => { setTool('measure'); setSideTab('measure'); }} className={`px-2 py-1 rounded ${tool === 'measure' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>📏 Measure</button>}
        {fe('shapes') && <button onClick={() => { setTool('shape'); setSideTab('draw'); }} className={`px-2 py-1 rounded ${tool === 'shape' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>⬜ Shape</button>}

        <div className="h-5 w-px bg-gray-600" />
        <button onClick={undo} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600" title="Undo Ctrl+Z">↩️</button>
        <button onClick={redo} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600" title="Redo Ctrl+Y">↪️</button>
        <button onClick={deleteSelected} className="px-2 py-1 bg-red-600 rounded hover:bg-red-700" title="Delete">🗑️</button>

        <div className="h-5 w-px bg-gray-600" />

        {/* Icon size */}
        <select value={defaultIconSize} onChange={e => setDefaultIconSize(e.target.value as IconSize)} className="px-1 py-1 bg-gray-700 rounded text-xs" title="Icon size">
          {Object.entries(ICON_SIZES).map(([k, v]) => <option key={k} value={k}>Icon {k.toUpperCase()} ({v})</option>)}
        </select>

        {/* Label size */}
        <select value={Object.entries(LABEL_SIZES).find(([, v]) => v === placementLabelSize)?.[0] || 'M'} onChange={e => setPlacementLabelSize(LABEL_SIZES[e.target.value])} className="px-1 py-1 bg-gray-700 rounded text-xs" title="Label size">
          {Object.entries(LABEL_SIZES).map(([k, v]) => <option key={k} value={k}>Name {k} ({v}px)</option>)}
        </select>

        {/* Display mode */}
        <select value={defaultDisplay} onChange={e => setDefaultDisplay(e.target.value as DisplayMode)} className="px-1 py-1 bg-gray-700 rounded text-xs" title="Display mode">
          <option value="icon">Icon Only</option>
          <option value="name">Name Only</option>
          <option value="both">Icon+Name</option>
        </select>

        <div className="h-5 w-px bg-gray-600" />

        <button onClick={() => setZoom(z => Math.max(0.1, z - 0.05))} className="px-1 py-1 bg-gray-700 rounded">➖</button>
        <span className="px-1 text-xs">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(5, z + 0.05))} className="px-1 py-1 bg-gray-700 rounded">➕</button>
        <button onClick={fitToView} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs">Fit</button>
        <button onClick={() => setShowRuler(!showRuler)} className={`px-2 py-1 rounded text-xs ${showRuler ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}>📐</button>

        <div className="h-5 w-px bg-gray-600" />
        <button onClick={() => setBwMode(!bwMode)} className={`px-2 py-1 rounded text-xs ${bwMode ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'}`}>⬛ B&W</button>
        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={autoSelect} onChange={e => setAutoSelect(e.target.checked)} /> Auto‑Select</label>
        <button onClick={() => { setTabOrderMode(!tabOrderMode); setTabOrderNext(1); }} className={`px-2 py-1 rounded text-xs ${tabOrderMode ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}>🔢 Tab Order</button>

        {fe('legend') && <button onClick={() => setShowLegend(!showLegend)} className={`px-2 py-1 rounded text-xs ${showLegend ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}>📖 Legend</button>}
        {fe('infobox') && <button onClick={() => setShowInfoBox(!showInfoBox)} className={`px-2 py-1 rounded text-xs ${showInfoBox ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>📊 Info</button>}

        {/* Alignment */}
        {selectedElements.length >= 2 && <>
          <div className="h-5 w-px bg-gray-600" />
          {['left', 'centerH', 'right', 'top', 'centerV', 'bottom'].map(a => (
            <button key={a} onClick={() => alignElements(a)} className="px-1 py-1 bg-purple-600 rounded hover:bg-purple-700 text-xs" title={`Align ${a}`}>
              {a === 'left' ? '⬅' : a === 'right' ? '➡' : a === 'top' ? '⬆' : a === 'bottom' ? '⬇' : a === 'centerH' ? '↔' : '↕'}
            </button>
          ))}
          <button onClick={bringToFront} className="px-1 py-1 bg-blue-600 rounded text-xs" title="Bring to Front">⬆️F</button>
          <button onClick={sendToBack} className="px-1 py-1 bg-blue-600 rounded text-xs" title="Send to Back">⬇️B</button>
        </>}

        <div className="flex-1" />
        <button onClick={() => setAdminMode(!adminMode)} className={`px-2 py-1 rounded text-xs ${adminMode ? 'bg-red-600' : 'bg-gray-700'}`}>⚙️</button>
        {adminMode && <button onClick={() => setShowAdminPanel(true)} className="px-2 py-1 bg-red-600 rounded text-xs">Admin</button>}
        <button onClick={() => setShowHelp(true)} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs">❓</button>
      </div>

      {/* Tab order banner */}
      {tabOrderMode && (
        <div className="bg-purple-600 text-white px-4 py-2 flex items-center justify-between">
          <span>🔢 Tab Order Mode — Click elements/labels in desired order. Next number: <b>{tabOrderNext}</b></span>
          <button onClick={() => setTabOrderMode(false)} className="px-3 py-1 bg-purple-800 rounded">Done</button>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden">
          <div className="flex flex-wrap border-b border-gray-700">
            {(['elements', 'cables', 'labels', 'draw', 'measure', 'layers', 'save'] as const).map(tab => (
              <button key={tab} onClick={() => setSideTab(tab)}
                className={`px-2 py-1.5 text-xs capitalize ${sideTab === tab ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-2 text-sm">
            {/* ELEMENTS TAB */}
            {sideTab === 'elements' && (
              <div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setActiveCat(cat)}
                      className={`px-1.5 py-0.5 text-xs rounded ${activeCat === cat ? 'text-white' : 'bg-gray-700'}`}
                      style={{ backgroundColor: activeCat === cat ? categoryColors[cat] : undefined }}>
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>

                {/* Group color */}
                <div className="flex items-center gap-2 mb-2 p-1 bg-gray-750 rounded">
                  <span className="text-xs text-gray-400">Group Color:</span>
                  <input type="color" value={categoryColors[activeCat]} onChange={e => setCategoryColors(prev => ({ ...prev, [activeCat]: e.target.value }))} className="w-6 h-6 rounded cursor-pointer" />
                  <button onClick={() => {
                    setCategoryColors({ ...DEFAULT_CATEGORY_COLORS });
                    setIconColors({});
                    setCustomElementNames({});
                  }} className="text-xs px-2 py-0.5 bg-gray-600 rounded hover:bg-gray-500">Reset All</button>
                </div>

                <div className="space-y-1">
                  {ELEMENTS.filter(el => el.category === activeCat).map(el => (
                    <div key={el.id} onClick={() => { setActiveElement(el.id); setTool('place'); }}
                      className={`flex items-center gap-2 p-1.5 rounded cursor-pointer ${activeElement === el.id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                      <SchematicIcon defId={el.id} category={activeCat} size={24} customColor={getIconColor(el.id, activeCat)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs truncate">{el.name}</div>
                        <input type="text" value={customElementNames[el.id] || el.shortName || ''} onClick={e => e.stopPropagation()}
                          onChange={e => setCustomElementNames(prev => ({ ...prev, [el.id]: e.target.value }))}
                          className="w-full text-xs bg-transparent border-b border-gray-500 focus:border-blue-400 outline-none text-gray-300 mt-0.5"
                          placeholder="Short name" />
                      </div>
                      <input type="color" value={iconColors[el.id] || categoryColors[activeCat]}
                        onChange={e => setIconColors(prev => ({ ...prev, [el.id]: e.target.value }))}
                        className="w-5 h-5 rounded cursor-pointer" onClick={e => e.stopPropagation()} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CABLES TAB */}
            {sideTab === 'cables' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={curvedCables} onChange={e => setCurvedCables(e.target.checked)} /> Curved cables
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={showCableLengths} onChange={e => setShowCableLengths(e.target.checked)} /> Show cable lengths
                </label>
                <div>
                  <label className="text-xs text-gray-400">Color</label>
                  <input type="color" value={cableColor} onChange={e => setCableColor(e.target.value)} className="w-full h-6 rounded cursor-pointer" />
                </div>
                <div className="space-y-1">
                  {(Object.keys(CABLE_COLORS) as CableType[]).map(ct => (
                    <div key={ct} onClick={() => { setActiveCableType(ct); setCableColor(CABLE_COLORS[ct]); setTool('cable'); }}
                      className={`p-1.5 rounded cursor-pointer ${activeCableType === ct ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-1 rounded" style={{ backgroundColor: CABLE_COLORS[ct] }} />
                        <span className="text-xs">{CABLE_LABELS[ct]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LABELS TAB */}
            {sideTab === 'labels' && (
              <div className="space-y-2">
                <div className="flex gap-2 items-center mb-2">
                  <span className="text-xs text-gray-400">Size:</span>
                  <select value={Object.entries(LABEL_SIZES).find(([, v]) => v === placementLabelSize)?.[0] || 'M'}
                    onChange={e => setPlacementLabelSize(LABEL_SIZES[e.target.value])}
                    className="px-1 py-0.5 bg-gray-700 rounded text-xs flex-1">
                    {Object.entries(LABEL_SIZES).map(([k, v]) => <option key={k} value={k}>{k} ({v}px)</option>)}
                  </select>
                </div>

                {[...labelPresets, ...customLabelPresets].map((preset, idx) => (
                  <div key={`${preset.type}-${idx}`} className={`p-1.5 rounded cursor-pointer ${activeLabelType === preset.type ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    onClick={() => { setActiveLabelType(preset.type); setTool('label'); }}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: preset.color }} />
                      <span className="text-xs flex-1">{preset.prefix}</span>
                      <span className="text-xs text-gray-400">
                        {preset.incrementMode === 'ten-up' ? '+10' : preset.incrementMode === 'two-up' ? '+2' : '+1'}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="border-t border-gray-600 pt-2 mt-2">
                  <div className="text-xs text-gray-400 mb-1">Add Custom Label</div>
                  <div className="flex gap-1">
                    <input type="text" placeholder="Name" id="customLabelName" className="flex-1 px-1 py-0.5 bg-gray-700 rounded text-xs border border-gray-600" />
                    <input type="color" defaultValue="#22c55e" id="customLabelColor" className="w-6 h-6 rounded cursor-pointer" />
                    <button onClick={() => {
                      const name = (document.getElementById('customLabelName') as HTMLInputElement)?.value;
                      const color = (document.getElementById('customLabelColor') as HTMLInputElement)?.value;
                      if (name) {
                        setCustomLabelPresets(prev => [...prev, { type: `custom-${Date.now()}` as any, prefix: name, color, increment: 1, incrementMode: 'one-up' }]);
                      }
                    }} className="px-2 py-0.5 bg-green-600 rounded text-xs">+</button>
                  </div>
                </div>

                <button onClick={() => { setLabelPresets([...DEFAULT_LABEL_PRESETS]); setCustomLabelPresets([]); setLabelCounters({}); }}
                  className="w-full px-2 py-1 bg-gray-600 rounded text-xs hover:bg-gray-500 mt-2">🔄 Reset Labels</button>

                {/* Selected label properties */}
                {selectedLabel && (() => {
                  const lbl = labels.find(l => l.uid === selectedLabel);
                  if (!lbl) return null;
                  return (
                    <div className="border-t border-gray-600 pt-2 mt-2 space-y-1">
                      <div className="text-xs font-medium text-gray-300">Selected Label Properties</div>
                      <input type="text" value={lbl.prefix} onChange={e => setLabels(prev => prev.map(l => l.uid === selectedLabel ? { ...l, prefix: e.target.value } : l))}
                        className="w-full px-1 py-0.5 bg-gray-700 rounded text-xs border border-gray-600" placeholder="Prefix" />
                      <input type="number" value={lbl.number} onChange={e => setLabels(prev => prev.map(l => l.uid === selectedLabel ? { ...l, number: parseInt(e.target.value) || 0 } : l))}
                        className="w-full px-1 py-0.5 bg-gray-700 rounded text-xs border border-gray-600" />
                      <div className="flex gap-1">
                        <input type="color" value={lbl.color} onChange={e => setLabels(prev => prev.map(l => l.uid === selectedLabel ? { ...l, color: e.target.value } : l))}
                          className="w-6 h-6 rounded cursor-pointer" />
                        <select value={lbl.size} onChange={e => setLabels(prev => prev.map(l => l.uid === selectedLabel ? { ...l, size: parseInt(e.target.value) } : l))}
                          className="flex-1 px-1 py-0.5 bg-gray-700 rounded text-xs">
                          {Object.entries(LABEL_SIZES).map(([k, v]) => <option key={k} value={v}>{k} ({v}px)</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* DRAW/SHAPES TAB */}
            {sideTab === 'draw' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-1">
                  {(['rect', 'circle', 'oval', 'triangle', 'line'] as const).map(t => (
                    <button key={t} onClick={() => { setActiveShapeType(t); setTool('shape'); }}
                      className={`p-2 rounded text-center ${activeShapeType === t ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                      <div className="text-lg">{t === 'rect' ? '⬜' : t === 'circle' ? '⭕' : t === 'oval' ? '⬭' : t === 'triangle' ? '△' : '╱'}</div>
                      <div className="text-xs capitalize">{t}</div>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-gray-400">Color</label>
                  <input type="color" value={shapeColor} onChange={e => setShapeColor(e.target.value)} className="w-full h-6 rounded cursor-pointer" />
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={shapeFill} onChange={e => setShapeFill(e.target.checked)} /> Fill shape
                </label>
              </div>
            )}

            {/* MEASURE TAB */}
            {sideTab === 'measure' && (
              <div className="space-y-2">
                <div className="text-xs text-gray-400">Color:</div>
                <div className="flex gap-2">
                  <button onClick={() => setMeasureColor('#000000')} className={`flex-1 py-1 rounded ${measureColor === '#000000' ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: '#333' }}>⬛ Black</button>
                  <button onClick={() => setMeasureColor('#ef4444')} className={`flex-1 py-1 rounded ${measureColor === '#ef4444' ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: '#ef4444' }}>🔴 Red</button>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Scale</label>
                  <select value={scale.label} onChange={e => { setScale(SCALE_PRESETS.find(s => s.label === e.target.value) || SCALE_PRESETS[2]); setCalibratedPxPerFt(null); }}
                    className="w-full px-1 py-1 bg-gray-700 rounded text-xs border border-gray-600">
                    {SCALE_PRESETS.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                  </select>
                  {calibratedPxPerFt && <div className="text-xs text-green-400 mt-1">✅ Calibrated: {calibratedPxPerFt.toFixed(1)} px/ft</div>}
                </div>
                <div className="text-xs text-gray-400 mt-2">Measurements ({measures.length})</div>
                {measures.map((m, i) => (
                  <div key={m.uid} className={`p-1 rounded text-xs cursor-pointer ${selectedMeasure === i ? 'bg-blue-600' : 'bg-gray-700'}`}
                    onClick={() => setSelectedMeasure(i)}>
                    Total: {getCableLength(m.points)} ft
                    {m.points.length > 2 && <div className="text-gray-400 mt-0.5">
                      {m.points.slice(1).map((p, j) => <span key={j}>{String.fromCharCode(65 + j)}→{String.fromCharCode(66 + j)}: {getSegmentLength(m.points[j], p)} ft{j < m.points.length - 2 ? ', ' : ''}</span>)}
                    </div>}
                  </div>
                ))}
              </div>
            )}

            {/* LAYERS TAB */}
            {sideTab === 'layers' && (
              <div className="space-y-1">
                {Object.entries(layers).map(([key, visible]) => (
                  <label key={key} className="flex items-center gap-2 p-1 bg-gray-700 rounded text-xs">
                    <input type="checkbox" checked={visible} onChange={e => setLayers(prev => ({ ...prev, [key]: e.target.checked }))} />
                    <span className="capitalize">{key}</span>
                  </label>
                ))}
              </div>
            )}

            {/* SAVE TAB */}
            {sideTab === 'save' && (
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-400">Project Name</label>
                  <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)}
                    className="w-full p-1 bg-gray-700 rounded border border-gray-600 text-sm" />
                </div>
                <button onClick={saveProject} className="w-full p-2 bg-blue-600 rounded hover:bg-blue-700 text-sm">💾 Save Project (.lvproj)</button>
                {fe('export') && <>
                  <button onClick={() => exportAs('png')} className="w-full p-2 bg-green-600 rounded hover:bg-green-700 text-sm">Export PNG</button>
                  <button onClick={() => exportAs('pdf')} className="w-full p-2 bg-green-600 rounded hover:bg-green-700 text-sm">Export PDF</button>
                </>}
              </div>
            )}
          </div>

          {/* PROPERTIES PANEL */}
          {showProperties && selectedElement && (() => {
            const el = elements.find(e => e.uid === selectedElement);
            if (!el) return null;
            const def = getElementDef(el.defId);
            return (
              <div className="border-t border-gray-700 p-2 bg-gray-800 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Properties</span>
                  <div className="flex gap-1">
                    <button onClick={() => pushHistory()} className="text-xs px-1 bg-green-600 rounded" title="Save">💾</button>
                    <button onClick={() => setShowProperties(false)} className="text-xs px-1 bg-gray-600 rounded" title="Close">✕</button>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div>
                    <label className="text-gray-400">Number</label>
                    <input type="number" value={el.number} min={1} onChange={e => {
                      const newNum = parseInt(e.target.value) || el.number;
                      const existing = elements.find(x => x.uid !== el.uid && x.defId === el.defId && x.number === newNum);
                      if (existing) {
                        setElements(prev => prev.map(x => {
                          if (x.uid === el.uid) return { ...x, number: newNum, label: `${customElementNames[el.defId] || def?.shortName || def?.name}-${newNum.toString().padStart(3, '0')}` };
                          if (x.uid === existing.uid) return { ...x, number: el.number, label: `${customElementNames[el.defId] || def?.shortName || def?.name}-${el.number.toString().padStart(3, '0')}` };
                          return x;
                        }));
                      } else {
                        setElements(prev => prev.map(x => x.uid === el.uid ? { ...x, number: newNum, label: `${customElementNames[el.defId] || def?.shortName || def?.name}-${newNum.toString().padStart(3, '0')}` } : x));
                      }
                    }} className="w-full p-0.5 bg-gray-700 rounded border border-gray-600" />
                  </div>
                  <div>
                    <label className="text-gray-400">Label</label>
                    <input type="text" value={el.label} onChange={e => setElements(prev => prev.map(x => x.uid === el.uid ? { ...x, label: e.target.value } : x))}
                      className="w-full p-0.5 bg-gray-700 rounded border border-gray-600" />
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1">
                      <label className="text-gray-400">Icon Size</label>
                      <select value={el.size} onChange={e => setElements(prev => prev.map(x => x.uid === el.uid ? { ...x, size: e.target.value as IconSize } : x))}
                        className="w-full p-0.5 bg-gray-700 rounded border border-gray-600">
                        {Object.entries(ICON_SIZES).map(([k, v]) => <option key={k} value={k}>{k.toUpperCase()} ({v})</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-gray-400">Display</label>
                      <select value={el.display} onChange={e => setElements(prev => prev.map(x => x.uid === el.uid ? { ...x, display: e.target.value as DisplayMode } : x))}
                        className="w-full p-0.5 bg-gray-700 rounded border border-gray-600">
                        <option value="icon">Icon</option>
                        <option value="name">Name</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400">Rotation</label>
                    <div className="flex gap-1">
                      {[0, 45, 90, 135, 180, 270].map(r => (
                        <button key={r} onClick={() => setElements(prev => prev.map(x => x.uid === el.uid ? { ...x, rotation: r } : x))}
                          className={`px-1 py-0.5 rounded ${el.rotation === r ? 'bg-blue-600' : 'bg-gray-600'}`}>{r}°</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400">Label Color</label>
                    <div className="flex gap-1">
                      <input type="color" value={labelTextColor} onChange={e => setLabelTextColor(e.target.value)} className="w-6 h-6 rounded" title="Text" />
                      <input type="color" value={labelBgColor} onChange={e => setLabelBgColor(e.target.value)} className="w-6 h-6 rounded" title="Background" />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400">Notes</label>
                    <textarea value={el.notes} onChange={e => setElements(prev => prev.map(x => x.uid === el.uid ? { ...x, notes: e.target.value } : x))}
                      className="w-full p-0.5 bg-gray-700 rounded border border-gray-600" rows={2} />
                  </div>
                  <div className="flex gap-1 mt-1">
                    <button onClick={bringToFront} className="flex-1 px-1 py-0.5 bg-blue-600 rounded">⬆ Front</button>
                    <button onClick={sendToBack} className="flex-1 px-1 py-0.5 bg-blue-600 rounded">⬇ Back</button>
                    <button onClick={deleteSelected} className="flex-1 px-1 py-0.5 bg-red-600 rounded">🗑️</button>
                  </div>
                  <button onClick={() => setElements(prev => prev.map(x => x.uid === el.uid ? { ...x, labelOffsetX: 0, labelOffsetY: 30 } : x))}
                    className="w-full px-1 py-0.5 bg-gray-600 rounded">Reset Label Position</button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* CANVAS */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Ruler H */}
          {showRuler && (
            <div className="h-5 bg-gray-700 border-b border-gray-600 relative overflow-hidden ml-5">
              {Array.from({ length: Math.ceil(3000 / (pxPerFt * rulerStep)) }).map((_, i) => (
                <div key={i} className="absolute top-0 h-full border-l border-gray-500 text-gray-400" style={{ left: i * pxPerFt * rulerStep * zoom, fontSize: 8 }}>
                  <span className="ml-0.5">{i * rulerStep}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex-1 flex overflow-hidden">
            {/* Ruler V */}
            {showRuler && (
              <div className="w-5 bg-gray-700 border-r border-gray-600 relative overflow-hidden">
                {Array.from({ length: Math.ceil(2000 / (pxPerFt * rulerStep)) }).map((_, i) => (
                  <div key={i} className="absolute left-0 w-full border-t border-gray-500" style={{ top: i * pxPerFt * rulerStep * zoom }}>
                    <span className="text-gray-400 ml-0.5" style={{ fontSize: 7 }}>{i * rulerStep}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex-1 overflow-auto bg-gray-950" ref={scrollRef}
              onDrop={handleDrop} onDragOver={e => e.preventDefault()} onWheel={handleWheel}>
              <div ref={canvasRef} className="relative bg-white"
                style={{
                  width: bgNaturalSize ? bgNaturalSize.w : 2400, height: bgNaturalSize ? bgNaturalSize.h : 1600,
                  transform: `scale(${zoom})`, transformOrigin: 'top left',
                  marginLeft: pan.x, marginTop: pan.y,
                  cursor: tool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : tool === 'place' ? 'crosshair' : 'default'
                }}
                onClick={handleCanvasClick} onDoubleClick={handleCanvasDoubleClick}
                onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp} onContextMenu={handleContextMenu}>

                {bgImage && <img src={bgImage} alt="Floor plan" className="max-w-none" draggable={false}
                  onLoad={e => { const img = e.target as HTMLImageElement; setBgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight }); }} />}

                {!bgImage && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8 border-2 border-dashed border-gray-400 rounded-lg">
                      <div className="text-6xl mb-4">📂</div>
                      <div className="text-xl text-gray-600 mb-2">Open a floor plan or drag & drop</div>
                      <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Open Floor Plan</button>
                    </div>
                  </div>
                )}

                {/* SVG overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                  {/* Cables */}
                  {layers.cables && cables.map((cable, i) => (
                    <g key={cable.uid}>
                      {cable.curved && cable.points.length > 2 ? (
                        <path d={`M ${cable.points[0].x},${cable.points[0].y} ${cable.points.slice(1).map((p, j) => {
                          const prev = cable.points[j];
                          const mx = (prev.x + p.x) / 2, my = (prev.y + p.y) / 2;
                          return `Q ${prev.x},${prev.y} ${mx},${my}`;
                        }).join(' ')} L ${cable.points[cable.points.length - 1].x},${cable.points[cable.points.length - 1].y}`}
                          fill="none" stroke={cable.color} strokeWidth={2} strokeDasharray={CABLE_DASH[cable.type]}
                          style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                          onClick={(e) => { e.stopPropagation(); setSelectedCable(i); }} />
                      ) : (
                        <polyline points={cable.points.map(p => `${p.x},${p.y}`).join(' ')}
                          fill="none" stroke={cable.color} strokeWidth={selectedCable === i ? 3 : 2} strokeDasharray={CABLE_DASH[cable.type]}
                          style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                          onClick={(e) => { e.stopPropagation(); setSelectedCable(i); }} />
                      )}
                      {showCableLengths && cable.showLength && cable.points.length >= 2 && (
                        <text x={(cable.points[0].x + cable.points[cable.points.length - 1].x) / 2}
                          y={(cable.points[0].y + cable.points[cable.points.length - 1].y) / 2 - 8}
                          fill={cable.color} fontSize="11" textAnchor="middle" fontWeight="bold">
                          {getCableLength(cable.points)} ft
                        </text>
                      )}
                    </g>
                  ))}

                  {drawingCable.length > 0 && <polyline points={drawingCable.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={cableColor} strokeWidth={2} strokeDasharray="5,5" />}

                  {/* Measures */}
                  {layers.measures && measures.map((m, i) => (
                    <g key={m.uid}>
                      <polyline points={m.points.map(p => `${p.x},${p.y}`).join(' ')} fill="none"
                        stroke={selectedMeasure === i ? '#ffffff' : m.color || '#000'} strokeWidth={2}
                        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); setSelectedMeasure(i); }} />
                      {m.points.map((p, j) => (
                        <g key={j}>
                          <circle cx={p.x} cy={p.y} r={4} fill={m.color || '#000'} />
                          <text x={p.x + 8} y={p.y - 8} fill={m.color || '#000'} fontSize="11" fontWeight="bold">{String.fromCharCode(65 + j)}</text>
                        </g>
                      ))}
                      {m.points.slice(1).map((p, j) => (
                        <text key={j} x={(m.points[j].x + p.x) / 2} y={(m.points[j].y + p.y) / 2 - 10}
                          fill={m.color || '#000'} fontSize="11" textAnchor="middle" fontWeight="bold">
                          {String.fromCharCode(65 + j)}→{String.fromCharCode(66 + j)}: {getSegmentLength(m.points[j], p)} ft
                        </text>
                      ))}
                      {m.points.length > 2 && (
                        <text x={m.points[0].x} y={m.points[0].y - 20} fill={m.color || '#000'} fontSize="12" fontWeight="bold">
                          Total: {getCableLength(m.points)} ft
                        </text>
                      )}
                    </g>
                  ))}

                  {drawingMeasure.length > 0 && <polyline points={drawingMeasure.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={measureColor} strokeWidth={2} strokeDasharray="5,5" />}

                  {/* Shapes */}
                  {layers.shapes && shapes.map(shape => (
                    <g key={shape.id} onClick={(e) => { e.stopPropagation(); setSelectedShape(shape.id); }} style={{ pointerEvents: 'all', cursor: 'pointer' }}>
                      {shape.type === 'rect' && <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill={shape.fill ? shape.color : 'none'} stroke={shape.color} strokeWidth={selectedShape === shape.id ? 3 : 2} />}
                      {(shape.type === 'circle' || shape.type === 'oval') && <ellipse cx={shape.x + shape.width / 2} cy={shape.y + shape.height / 2} rx={shape.width / 2} ry={shape.type === 'circle' ? shape.width / 2 : shape.height / 2} fill={shape.fill ? shape.color : 'none'} stroke={shape.color} strokeWidth={selectedShape === shape.id ? 3 : 2} />}
                      {shape.type === 'triangle' && <polygon points={`${shape.x + shape.width / 2},${shape.y} ${shape.x},${shape.y + shape.height} ${shape.x + shape.width},${shape.y + shape.height}`} fill={shape.fill ? shape.color : 'none'} stroke={shape.color} strokeWidth={selectedShape === shape.id ? 3 : 2} />}
                      {shape.type === 'line' && shape.points && <line x1={shape.points[0].x} y1={shape.points[0].y} x2={shape.points[1].x} y2={shape.points[1].y} stroke={shape.color} strokeWidth={selectedShape === shape.id ? 3 : 2} />}
                    </g>
                  ))}

                  {/* Shape preview */}
                  {drawingShape && activeShapeType && (
                    <g>
                      {activeShapeType === 'rect' && <rect x={Math.min(drawingShape.startX, drawingShape.currentX)} y={Math.min(drawingShape.startY, drawingShape.currentY)} width={Math.abs(drawingShape.currentX - drawingShape.startX)} height={Math.abs(drawingShape.currentY - drawingShape.startY)} fill={shapeFill ? shapeColor : 'none'} stroke={shapeColor} strokeWidth={2} strokeDasharray="5,5" />}
                      {(activeShapeType === 'circle' || activeShapeType === 'oval') && <ellipse cx={(drawingShape.startX + drawingShape.currentX) / 2} cy={(drawingShape.startY + drawingShape.currentY) / 2} rx={Math.abs(drawingShape.currentX - drawingShape.startX) / 2} ry={activeShapeType === 'circle' ? Math.abs(drawingShape.currentX - drawingShape.startX) / 2 : Math.abs(drawingShape.currentY - drawingShape.startY) / 2} fill={shapeFill ? shapeColor : 'none'} stroke={shapeColor} strokeWidth={2} strokeDasharray="5,5" />}
                      {activeShapeType === 'triangle' && <polygon points={`${(drawingShape.startX + drawingShape.currentX) / 2},${Math.min(drawingShape.startY, drawingShape.currentY)} ${Math.min(drawingShape.startX, drawingShape.currentX)},${Math.max(drawingShape.startY, drawingShape.currentY)} ${Math.max(drawingShape.startX, drawingShape.currentX)},${Math.max(drawingShape.startY, drawingShape.currentY)}`} fill={shapeFill ? shapeColor : 'none'} stroke={shapeColor} strokeWidth={2} strokeDasharray="5,5" />}
                      {activeShapeType === 'line' && <line x1={drawingShape.startX} y1={drawingShape.startY} x2={drawingShape.currentX} y2={drawingShape.currentY} stroke={shapeColor} strokeWidth={2} strokeDasharray="5,5" />}
                    </g>
                  )}
                </svg>

                {/* Elements */}
                {sortedElements.map(el => {
                  const def = getElementDef(el.defId);
                  if (!def || !layers[def.category as keyof typeof layers]) return null;
                  const isSelected = selectedElement === el.uid || selectedElements.includes(el.uid);
                  const iconSize = ICON_SIZES[el.size] || 48;
                  const labelFontSize = placementLabelSize;
                  const color = getIconColor(def.id, def.category);

                  return (
                    <div key={el.uid} className={`absolute ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                      style={{ left: el.x, top: el.y, transform: 'translate(-50%, -50%)', zIndex: el.zIndex || 0, cursor: tool === 'select' ? 'move' : 'default' }}>
                      <div className="flex flex-col items-center">
                        {/* Icon */}
                        {(el.display === 'icon' || el.display === 'both') && (
                          <div style={{ transform: `rotate(${el.rotation}deg)` }}>
                            <SchematicIcon defId={def.id} category={def.category} size={iconSize} customColor={color} />
                          </div>
                        )}
                        {/* Leader line */}
                        {el.display === 'both' && (el.labelOffsetX !== 0 || el.labelOffsetY !== 30) && (
                          <svg className="absolute pointer-events-none" style={{ overflow: 'visible', top: 0, left: 0, width: 1, height: 1 }}>
                            <line x1={0} y1={iconSize / 2} x2={el.labelOffsetX} y2={el.labelOffsetY} stroke={color} strokeWidth={1} strokeDasharray="3,3" />
                          </svg>
                        )}
                        {/* Label */}
                        {(el.display === 'name' || el.display === 'both') && (
                          <div className="px-2 py-0.5 rounded whitespace-nowrap font-semibold cursor-move"
                            style={{
                              fontSize: labelFontSize, backgroundColor: labelBgColor, color: labelTextColor,
                              border: `1px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                              marginTop: el.display === 'both' ? 4 : 0,
                              transform: `translate(${el.labelOffsetX}px, ${el.display === 'both' ? 0 : el.labelOffsetY}px)`
                            }}
                            onMouseDown={e => {
                              if (tool !== 'select') return;
                              e.stopPropagation();
                              const startX = e.clientX, startY = e.clientY;
                              const origOX = el.labelOffsetX, origOY = el.labelOffsetY;
                              const onMove = (me: MouseEvent) => {
                                const dx = (me.clientX - startX) / zoom;
                                const dy = (me.clientY - startY) / zoom;
                                setElements(prev => prev.map(x => x.uid === el.uid ? { ...x, labelOffsetX: origOX + dx, labelOffsetY: origOY + dy } : x));
                              };
                              const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); pushHistory(); };
                              document.addEventListener('mousemove', onMove);
                              document.addEventListener('mouseup', onUp);
                            }}>
                            {el.label}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Labels */}
                {layers.labels && labels.map(lbl => (
                  <div key={lbl.uid}
                    className={`absolute cursor-move px-2 py-1 rounded font-semibold ${selectedLabel === lbl.uid ? 'ring-2 ring-white' : ''}`}
                    style={{ left: lbl.x, top: lbl.y, transform: 'translate(-50%, -50%)', backgroundColor: lbl.color, color: '#fff', fontSize: lbl.size }}
                    onClick={e => { e.stopPropagation(); setSelectedLabel(lbl.uid); setSideTab('labels'); }}>
                    {lbl.prefix}-{lbl.number.toString().padStart(3, '0')}
                  </div>
                ))}

                {/* Legend */}
                {showLegend && fe('legend') && (
                  <div className="absolute bg-white border-2 border-gray-800 rounded-lg shadow-lg" style={{ right: 20, top: 20, minWidth: 200 }}>
                    <div className="bg-gray-800 text-white px-3 py-1.5 font-bold text-sm rounded-t-lg">📖 Legend</div>
                    <div className="p-2">
                      {CATEGORIES.filter(cat => elements.some(e => getElementDef(e.defId)?.category === cat)).map(cat => (
                        <div key={cat} className="mb-2">
                          <div className="text-xs font-bold mb-1" style={{ color: categoryColors[cat] }}>{CATEGORY_LABELS[cat]}</div>
                          {[...new Set(elements.filter(e => getElementDef(e.defId)?.category === cat).map(e => e.defId))].map(defId => {
                            const def = getElementDef(defId)!;
                            const count = elements.filter(e => e.defId === defId).length;
                            return (
                              <div key={defId} className="flex items-center gap-2 py-0.5">
                                <SchematicIcon defId={defId} category={cat} size={20} customColor={getIconColor(defId, cat)} />
                                <span className="text-xs text-gray-700">{customElementNames[defId] || def.shortName} - {def.name}</span>
                                <span className="text-xs text-gray-400 ml-auto">×{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SHORTCUT BAR */}
      <div className="bg-gray-800 border-t border-gray-700 px-3 py-1.5 flex items-center gap-3 flex-wrap">
        {[
          { key: 'V', label: 'Select', color: 'bg-blue-600' },
          { key: 'H', label: 'Pan', color: 'bg-green-600' },
          { key: 'W', label: 'Place', color: 'bg-orange-600' },
          { key: 'M', label: 'Measure', color: 'bg-yellow-600' },
          { key: 'L', label: 'Label', color: 'bg-purple-600' },
          { key: 'Space', label: 'Hold Pan', color: 'bg-teal-600' },
          { key: 'Del', label: 'Delete', color: 'bg-red-600' },
          { key: 'Esc', label: 'Cancel', color: 'bg-gray-600' },
          { key: 'Tab', label: 'Toggle', color: 'bg-indigo-600' },
        ].map(s => (
          <div key={s.key} className="flex items-center gap-1">
            <kbd className={`${s.color} text-white px-1.5 py-0.5 rounded text-xs font-bold min-w-[28px] text-center shadow`}>{s.key}</kbd>
            <span className="text-gray-400 text-xs">{s.label}</span>
          </div>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-gray-500 text-xs">
          <span>Ctrl+O Open</span>
          <span>Ctrl+S Save</span>
          <span>Ctrl+Z Undo</span>
          <span>Ctrl+Y Redo</span>
          <span>Ctrl+P Print</span>
        </div>
      </div>

      {/* RESET CONFIRM */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md border border-gray-600">
            <h3 className="text-lg font-bold mb-3">⚠️ Reset Project?</h3>
            <p className="text-gray-300 text-sm mb-4">This will permanently delete all elements, cables, labels, measures, and shapes. The floor plan background will be kept.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500">Cancel</button>
              <button onClick={handleReset} className="px-4 py-2 bg-red-600 rounded hover:bg-red-700">🗑️ Reset Everything</button>
            </div>
          </div>
        </div>
      )}

      {/* INFO BOX */}
      {showInfoBox && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInfoBox(false)}>
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-lg w-full border border-gray-600" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-600">
              <span className="font-bold text-white">📊 Project Summary</span>
              <button onClick={() => setShowInfoBox(false)} className="text-xl text-gray-400 hover:text-white">×</button>
            </div>
            <div className="p-4 text-white">
              <h3 className="font-medium mb-2">Elements ({elements.length})</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(getInfoBoxData().elementCounts).map(([type, count]) => (
                  <span key={type} className="px-2 py-1 bg-gray-700 rounded text-sm">{type}: {count}</span>
                ))}
              </div>
              <h3 className="font-medium mb-2">Cables ({cables.length})</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(getInfoBoxData().cableLengths).map(([type, length]) => (
                  <span key={type} className="px-2 py-1 bg-gray-700 rounded text-sm">{type}: {length.toFixed(1)} ft</span>
                ))}
              </div>
              <h3 className="font-medium mb-2">Labels: {labels.length} | Shapes: {shapes.length} | Measures: {measures.length}</h3>
            </div>
          </div>
        </div>
      )}

      {/* HELP */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowHelp(false)}>
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto border border-gray-600" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-600 sticky top-0 bg-gray-800">
              <span className="font-bold">❓ Keyboard Shortcuts & Help</span>
              <button onClick={() => setShowHelp(false)} className="text-xl">×</button>
            </div>
            <div className="p-4 text-sm">
              <table className="w-full">
                <thead><tr className="text-left border-b border-gray-600"><th className="py-1 px-2">Key</th><th className="py-1 px-2">Action</th></tr></thead>
                <tbody>
                  {[
                    ['V', 'Select tool'], ['H', 'Pan tool'], ['W', 'Place tool'], ['M', 'Measure tool'],
                    ['L', 'Label tool'], ['Space (hold)', 'Temporary pan'], ['Del / Backspace', 'Delete selected'],
                    ['Esc', 'Cancel / Deselect'], ['Ctrl+O', 'Open floor plan'], ['Ctrl+S', 'Save project'],
                    ['Ctrl+Z', 'Undo'], ['Ctrl+Y', 'Redo'], ['Ctrl+P', 'Print'], ['Ctrl+Scroll', 'Zoom in/out'],
                    ['Shift+Click', 'Multi-select'], ['Shift (draw)', 'Constrain to straight'],
                  ].map(([key, action]) => (
                    <tr key={key} className="border-b border-gray-700"><td className="py-1 px-2"><kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">{key}</kbd></td><td className="py-1 px-2">{action}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4">
                <h4 className="font-bold mb-2">Mouse Controls</h4>
                <ul className="space-y-1 text-gray-300">
                  <li>• <b>Click</b> — Select/Place element</li>
                  <li>• <b>Drag</b> — Move element (in select mode)</li>
                  <li>• <b>Double-click</b> — Finish cable/measure</li>
                  <li>• <b>Shift+Click</b> — Add to selection</li>
                  <li>• <b>Middle mouse drag</b> — Pan canvas</li>
                  <li>• <b>Drag & Drop</b> — Open image file</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PANEL */}
      {showAdminPanel && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAdminPanel(false)}>
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-600" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-600">
              <span className="font-bold">⚙️ Admin — Feature Control</span>
              <button onClick={() => setShowAdminPanel(false)} className="text-xl">×</button>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-sm text-gray-400 mb-3">Enable/disable features for end users.</p>
              {FEATURES.map(f => (
                <label key={f.key} className="flex items-center gap-3 p-2 bg-gray-700 rounded">
                  <input type="checkbox" checked={enabledFeatures[f.key] !== false}
                    onChange={e => setEnabledFeatures(prev => ({ ...prev, [f.key]: e.target.checked }))} />
                  <div>
                    <div className="text-sm font-medium">{f.label}</div>
                    <div className="text-xs text-gray-400">{f.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.svg,.lvproj" onChange={handleFileUpload} className="hidden" />
    </div>
  );
};

export default App;
