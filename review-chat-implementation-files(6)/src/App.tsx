import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ELEMENTS } from './data';
import {
  PlacedElement, Cable, PlacedLabel, MeasureLine, Drawing, TextAnnotation, Stamp, Group,
  Category, CATEGORY_COLORS, CATEGORY_LABELS, CableType, CABLE_COLORS, CABLE_LABELS, CABLE_DASH,
  LabelPreset, DEFAULT_LABEL_PRESETS, SCALE_PRESETS, ICON_SIZES, IconSize, DisplayMode,
  DEFAULT_CATEGORY_COLORS, ProjectFile,
  SprinklerPipe, PipeFitting, PipeSize, PipeStyle, FittingType,
  PIPE_SIZES, PIPE_COLORS, FITTING_LABELS
} from './types';
import { SchematicIcon } from './SchematicIcon';

interface Shape {
  id: string;
  type: 'rect' | 'circle' | 'oval' | 'triangle' | 'line';
  x: number; y: number; width: number; height: number;
  color: string; fill: boolean;
  points?: { x: number; y: number }[];
}

interface FeatureFlag { key: string; label: string; description: string; }

const FEATURES: FeatureFlag[] = [
  { key: 'place', label: 'Place Elements', description: 'Place icons on the plan' },
  { key: 'cables', label: 'Cables', description: 'Draw cable runs' },
  { key: 'labels', label: 'Labels', description: 'Place zone/area labels' },
  { key: 'measure', label: 'Measure', description: 'Measure distances' },
  { key: 'shapes', label: 'Shapes', description: 'Draw shapes' },
  { key: 'export', label: 'Export', description: 'Export as PNG/JPG/PDF' },
  { key: 'legend', label: 'Legend', description: 'Show icon legend' },
  { key: 'infobox', label: 'Info Box', description: 'Project summary' },
  { key: 'pipes', label: 'Sprinkler Pipes', description: 'Draw sprinkler pipe runs' },
];

const LABEL_SIZES: Record<string, number> = { S: 14, M: 18, L: 24, XL: 32, XXL: 42 };
const CATEGORIES: Category[] = ['alarm', 'fire', 'sprinkler', 'cctv', 'sound', 'automation', 'tv', 'data'];

type DrawMode = 'click' | 'drag' | 'fixed';

export const App: React.FC = () => {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgNaturalSize, setBgNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

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

  const [cables, setCables] = useState<Cable[]>([]);
  const [selectedCable, setSelectedCable] = useState<number | null>(null);
  const [activeCableType, setActiveCableType] = useState<CableType>('alarm');
  const [cableColor, setCableColor] = useState(CABLE_COLORS.alarm);
  const [drawingCable, setDrawingCable] = useState<{ x: number; y: number }[]>([]);
  const [curvedCables, setCurvedCables] = useState(false);
  const [showCableLengths, setShowCableLengths] = useState(true);
  const [cableThickness, setCableThickness] = useState(2);
  const [cableMode, setCableMode] = useState<DrawMode>('click');
  const [cableFixedLength, setCableFixedLength] = useState('10');
  const [dragCableStart, setDragCableStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCableEnd, setDragCableEnd] = useState<{ x: number; y: number } | null>(null);

  // ═══ SPRINKLER PIPE STATE ═══
  const [pipes, setPipes] = useState<SprinklerPipe[]>([]);
  const [fittings, setFittings] = useState<PipeFitting[]>([]);
  const [selectedPipe, setSelectedPipe] = useState<number | null>(null);
  const [selectedFitting, setSelectedFitting] = useState<string | null>(null);
  const [drawingPipe, setDrawingPipe] = useState<{ x: number; y: number }[]>([]);
  const [activePipeSize, setActivePipeSize] = useState<PipeSize>('1"');
  const [activePipeStyle, setActivePipeStyle] = useState<PipeStyle>('hollow');
  const [activePipeColor, setActivePipeColor] = useState(PIPE_COLORS.main);
  const [activePipeLabel, setActivePipeLabel] = useState('Main');
  const [showPipeLengths, setShowPipeLengths] = useState(true);
  const [pipeMode, setPipeMode] = useState<DrawMode>('click');
  const [pipeFixedLength, setPipeFixedLength] = useState('10');
  const [dragPipeStart, setDragPipeStart] = useState<{ x: number; y: number } | null>(null);
  const [dragPipeEnd, setDragPipeEnd] = useState<{ x: number; y: number } | null>(null);
  const [activeFittingType, setActiveFittingType] = useState<FittingType | null>(null);

  const [labels, setLabels] = useState<PlacedLabel[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [activeLabelType, setActiveLabelType] = useState('zone');
  const [labelCounters, setLabelCounters] = useState<Record<string, number>>({});
  const [labelPresets, setLabelPresets] = useState<LabelPreset[]>([...DEFAULT_LABEL_PRESETS]);
  const [customLabelPresets, setCustomLabelPresets] = useState<LabelPreset[]>([]);
  const [placementLabelSize, setPlacementLabelSize] = useState(18);

  const [measures, setMeasures] = useState<MeasureLine[]>([]);
  const [selectedMeasure, setSelectedMeasure] = useState<number | null>(null);
  const [drawingMeasure, setDrawingMeasure] = useState<{ x: number; y: number }[]>([]);
  const [measureColor, setMeasureColor] = useState('#000000'); void(setMeasureColor);
  const [scale, setScale] = useState(SCALE_PRESETS[2]);
  const [calibratedPxPerFt, setCalibratedPxPerFt] = useState<number | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [calibratePoints, setCalibratePoints] = useState<{ x: number; y: number }[]>([]);
  const [calibrateDistance, setCalibrateDistance] = useState('10');
  const [showRuler, setShowRuler] = useState(false);
  const [measureMode, setMeasureMode] = useState<DrawMode>('click');
  const [measureFixedLength, setMeasureFixedLength] = useState('10');
  const [dragMeasureStart, setDragMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [dragMeasureEnd, setDragMeasureEnd] = useState<{ x: number; y: number } | null>(null);

  const [drawings] = useState<Drawing[]>([]);
  const [texts] = useState<TextAnnotation[]>([]);

  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [activeShapeType, setActiveShapeType] = useState<'rect' | 'circle' | 'oval' | 'triangle' | 'line' | null>(null);
  const [shapeColor, setShapeColor] = useState('#000000');
  const [shapeFill, setShapeFill] = useState(false);
  const [drawingShape, setDrawingShape] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [shiftKey, setShiftKey] = useState(false);

  const [stamp, setStamp] = useState<Stamp | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  const [tool, setTool] = useState<'select' | 'place' | 'cable' | 'label' | 'measure' | 'draw' | 'shape' | 'text' | 'pan' | 'pipe' | 'fitting'>('select');
  const [sideTab, setSideTab] = useState<'elements' | 'cables' | 'labels' | 'layers' | 'measure' | 'draw' | 'save' | 'pipes' | 'ref'>('elements');
  const [layers, setLayers] = useState({
    alarm: true, fire: true, sprinkler: true, cctv: true, sound: true,
    automation: true, tv: true, data: true,
    cables: true, pipes: true, drawings: true, texts: true, measures: true,
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
  const [tabOrderTarget, setTabOrderTarget] = useState<'elements' | 'labels'>('elements');
  const [tabOrderTypeFilter, setTabOrderTypeFilter] = useState<string | null>(null);
  const [tabOrderAssigned, setTabOrderAssigned] = useState<string[]>([]);
  const [defaultIconSize, setDefaultIconSize] = useState<IconSize>('m');
  const [defaultDisplay, setDefaultDisplay] = useState<DisplayMode>('both');
  const [labelTextColor, setLabelTextColor] = useState('#000000');
  const [labelBgColor, setLabelBgColor] = useState('#ffffff');

  const [adminMode, setAdminMode] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean>>(
    Object.fromEntries(FEATURES.map(f => [f.key, true]))
  );

  const [dragState, setDragState] = useState<{ uid: string; startX: number; startY: number; elStartX: number; elStartY: number } | null>(null);
  const [labelDragState, setLabelDragState] = useState<{ uid: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [historyLock, setHistoryLock] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fe = (key: string) => enabledFeatures[key] !== false;
  const getEffectivePxPerFt = () => calibratedPxPerFt || scale.ratio;

  const getState = useCallback(() => JSON.stringify({
    elements, cables, labels, measures, drawings, texts, shapes, stamp, groups, pipes, fittings
  }), [elements, cables, labels, measures, drawings, texts, shapes, stamp, groups, pipes, fittings]);

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
    setElements(s.elements || []); setCables(s.cables || []); setLabels(s.labels || []);
    setMeasures(s.measures || []); setShapes(s.shapes || []); setStamp(s.stamp || null); setGroups(s.groups || []);
    setPipes(s.pipes || []); setFittings(s.fittings || []);
    setTimeout(() => setHistoryLock(false), 100);
  };

  const undo = () => { if (historyIndex > 0) { restoreState(history[historyIndex - 1]); setHistoryIndex(historyIndex - 1); } };
  const redo = () => { if (historyIndex < history.length - 1) { restoreState(history[historyIndex + 1]); setHistoryIndex(historyIndex + 1); } };

  const finishMeasure = useCallback(() => {
    if (drawingMeasure.length >= 2) {
      setMeasures(prev => [...prev, { uid: `measure-${Date.now()}`, points: drawingMeasure, color: measureColor }]);
      setDrawingMeasure([]);
      pushHistory();
    }
  }, [drawingMeasure, measureColor, pushHistory]);

  const finishCable = useCallback(() => {
    if (drawingCable.length >= 2) {
      setCables(prev => [...prev, { uid: `cable-${Date.now()}`, type: activeCableType, points: drawingCable, color: cableColor, curved: curvedCables, showLength: showCableLengths }]);
      setDrawingCable([]);
      pushHistory();
    }
  }, [drawingCable, activeCableType, cableColor, curvedCables, showCableLengths, pushHistory]);

  const finishPipe = useCallback(() => {
    if (drawingPipe.length >= 2) {
      setPipes(prev => [...prev, {
        uid: `pipe-${Date.now()}`, points: drawingPipe, size: activePipeSize,
        style: activePipeStyle, color: activePipeColor, label: activePipeLabel, showLength: showPipeLengths
      }]);
      // Auto-place elbows at bend points
      if (drawingPipe.length > 2) {
        const newFittings: PipeFitting[] = [];
        for (let i = 1; i < drawingPipe.length - 1; i++) {
          const prev = drawingPipe[i - 1];
          const curr = drawingPipe[i];
          const next = drawingPipe[i + 1];
          const a1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
          const a2 = Math.atan2(next.y - curr.y, next.x - curr.x);
          let angle = ((a2 - a1) * 180 / Math.PI + 360) % 360;
          if (angle > 180) angle = 360 - angle;
          const fType: FittingType = Math.abs(angle - 90) < 20 ? 'elbow90' : 'elbow45';
          const rot = (a1 * 180 / Math.PI + 90 + 360) % 360;
          newFittings.push({
            uid: `fit-${Date.now()}-${i}`, type: fType, x: curr.x, y: curr.y,
            rotation: rot, size: activePipeSize, style: activePipeStyle,
            color: activePipeColor, connectedPipes: []
          });
        }
        if (newFittings.length > 0) setFittings(prev => [...prev, ...newFittings]);
      }
      setDrawingPipe([]);
      pushHistory();
    }
  }, [drawingPipe, activePipeSize, activePipeStyle, activePipeColor, activePipeLabel, showPipeLengths, pushHistory]);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftKey(true);
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Escape') {
        setDrawingCable([]); setDrawingMeasure([]); setDrawingShape(null); setDrawingPipe([]);
        setDragMeasureStart(null); setDragMeasureEnd(null);
        setDragCableStart(null); setDragCableEnd(null);
        setDragPipeStart(null); setDragPipeEnd(null);
        setSelectedElement(null); setSelectedElements([]); setSelectedShape(null);
        setSelectedPipe(null); setSelectedFitting(null);
        if (tabOrderMode) { setTabOrderMode(false); setTabOrderTypeFilter(null); setTabOrderAssigned([]); pushHistory(); }
        if (calibrating) { setCalibrating(false); setCalibratePoints([]); }
        setTool('select');
      }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); }
      if (e.key === 'v' || e.key === 'V') setTool('select');
      if (e.key === 'h' || e.key === 'H') setTool('pan');
      if ((e.key === 'w' || e.key === 'W') && !e.ctrlKey) { setTool('place'); setSideTab('elements'); }
      if (e.key === 'm' || e.key === 'M') { setTool('measure'); setSideTab('measure'); }
      if (e.key === 'l' || e.key === 'L') { setTool('label'); setSideTab('labels'); }
      if (e.key === 'p' && !e.ctrlKey) { setTool('pipe'); setSideTab('pipes'); }
      if (e.key === ' ') { e.preventDefault(); setTool('pan'); }
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.ctrlKey && e.key === 'o') { e.preventDefault(); fileInputRef.current?.click(); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveProject(); }
      if (e.ctrlKey && e.key === 'p') { e.preventDefault(); handlePrint(); }
      if (e.key === 'Enter') { finishCable(); finishMeasure(); finishPipe(); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftKey(false);
      if (e.key === ' ') setTool('select');
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  });

  // Label dragging
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (labelDragState) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        setLabels(prev => prev.map(l =>
          l.uid === labelDragState.uid
            ? { ...l, x: labelDragState.origX + (x - labelDragState.startX), y: labelDragState.origY + (y - labelDragState.startY) }
            : l
        ));
      }
    };
    const onUp = () => {
      if (labelDragState) { setLabelDragState(null); pushHistory(); }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [labelDragState, zoom, pushHistory]);

  // Delete
  const deleteSelected = () => {
    let changed = false;
    if (selectedElements.length > 0) {
      const toDelete = elements.filter(el => selectedElements.includes(el.uid));
      toDelete.forEach(el => {
        setDeletedNumbers(prev => ({ ...prev, [el.defId]: [...(prev[el.defId] || []), el.number].sort((a, b) => a - b) }));
      });
      setElements(prev => prev.filter(el => !selectedElements.includes(el.uid)));
      setSelectedElements([]); setSelectedElement(null); changed = true;
    } else if (selectedElement) {
      const el = elements.find(e => e.uid === selectedElement);
      if (el) {
        setDeletedNumbers(prev => ({ ...prev, [el.defId]: [...(prev[el.defId] || []), el.number].sort((a, b) => a - b) }));
        setElements(prev => prev.filter(e => e.uid !== selectedElement));
      }
      setSelectedElement(null); changed = true;
    }
    if (selectedShape) { setShapes(prev => prev.filter(s => s.id !== selectedShape)); setSelectedShape(null); changed = true; }
    if (selectedCable !== null) { setCables(prev => prev.filter((_, i) => i !== selectedCable)); setSelectedCable(null); changed = true; }
    if (selectedMeasure !== null) { setMeasures(prev => prev.filter((_, i) => i !== selectedMeasure)); setSelectedMeasure(null); changed = true; }
    if (selectedLabel) { setLabels(prev => prev.filter(l => l.uid !== selectedLabel)); setSelectedLabel(null); changed = true; }
    if (selectedPipe !== null) { setPipes(prev => prev.filter((_, i) => i !== selectedPipe)); setSelectedPipe(null); changed = true; }
    if (selectedFitting) { setFittings(prev => prev.filter(f => f.uid !== selectedFitting)); setSelectedFitting(null); changed = true; }
    if (changed) pushHistory();
  };

  const toCanvasCoords = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
  };

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

  const saveProject = () => {
    const project: ProjectFile = {
      version: '2.0', projectName, bgImage, elements, cables, labels, measures, drawings, texts, shapes,
      stamp, groups, categoryColors, iconColors, customElementNames, labelPresets, customLabelPresets,
      scale, elementCounters, labelCounters, showCableLengths, bwMode, pipes, fittings
    };
    const blob = new Blob([JSON.stringify(project)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${projectName}.lvproj`; a.click();
  };

  const loadProject = (p: ProjectFile) => {
    setProjectName(p.projectName || 'Untitled'); setBgImage(p.bgImage || null);
    setElements(p.elements || []); setCables(p.cables || []); setLabels(p.labels || []);
    setMeasures(p.measures || []); setShapes(p.shapes || []);
    setStamp(p.stamp || null); setGroups(p.groups || []);
    setPipes(p.pipes || []); setFittings(p.fittings || []);
    if (p.categoryColors) setCategoryColors(p.categoryColors);
    if (p.iconColors) setIconColors(p.iconColors);
    if (p.customElementNames) setCustomElementNames(p.customElementNames);
    if (p.labelPresets) setLabelPresets(p.labelPresets);
    if (p.customLabelPresets) setCustomLabelPresets(p.customLabelPresets);
    if (p.scale) setScale(p.scale);
    if (p.elementCounters) setElementCounters(p.elementCounters);
    if (p.labelCounters) setLabelCounters(p.labelCounters);
  };

  const handlePrint = () => { setShowFileMenu(false); setTimeout(() => window.print(), 100); };

  const handleReset = () => {
    setElements([]); setCables([]); setLabels([]); setMeasures([]); setShapes([]);
    setPipes([]); setFittings([]);
    setStamp(null); setGroups([]); setSelectedElement(null); setSelectedElements([]);
    setSelectedShape(null); setSelectedPipe(null); setSelectedFitting(null);
    setElementCounters({}); setLabelCounters({}); setDeletedNumbers({});
    setDrawingCable([]); setDrawingMeasure([]); setDrawingPipe([]); setShowResetConfirm(false);
    pushHistory();
  };

  const handleCloseProject = () => {
    handleReset(); setBgImage(null); setBgNaturalSize(null); setProjectName('Untitled Project');
    setZoom(1); setPan({ x: 0, y: 0 });
  };

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

  const exportAs = async (format: 'png' | 'jpg' | 'pdf') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const svgs = canvas.querySelectorAll('[data-export-svg]');
    const originals: { el: Element; parent: HTMLElement; img: HTMLImageElement }[] = [];
    for (const svg of Array.from(svgs)) {
      const svgEl = svg as SVGSVGElement;
      const xml = new XMLSerializer().serializeToString(svgEl);
      const img = document.createElement('img');
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
      img.width = svgEl.width.baseVal.value; img.height = svgEl.height.baseVal.value;
      img.style.display = 'block';
      const parent = svgEl.parentElement!;
      originals.push({ el: svgEl, parent, img });
      parent.replaceChild(img, svgEl);
    }
    await new Promise(r => setTimeout(r, 200));
    const html2canvas = (await import('html2canvas')).default;
    const ci = await html2canvas(canvas, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
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

  const getCableLength = (points: { x: number; y: number }[]) => {
    let len = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x, dy = points[i].y - points[i - 1].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return (len / getEffectivePxPerFt()).toFixed(1);
  };

  const getSegmentLength = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    return (Math.sqrt(dx * dx + dy * dy) / getEffectivePxPerFt()).toFixed(1);
  };

  const getElementDef = (defId: string) => ELEMENTS.find(e => e.id === defId);

  const getIconColor = (defId: string, category: Category) => {
    if (bwMode) return '#000000';
    return iconColors[defId] || categoryColors[category] || CATEGORY_COLORS[category];
  };

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

  // Fitting SVG renderer
  const renderFittingSVG = (type: FittingType, size: PipeSize, style: PipeStyle, color: string, fSize: number) => {
    const sw = PIPE_SIZES[size];
    const isFilled = style === 'filled';
    const half = fSize / 2;
    switch (type) {
      case 'elbow90':
        return <><path d={`M${half},${fSize} L${half},${half} L${fSize},${half}`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          {isFilled && <path d={`M${half},${fSize} L${half},${half} L${fSize},${half}`} fill="none" stroke={color} strokeWidth={sw + 2} strokeLinecap="round" strokeLinejoin="round" opacity={0.3} />}
          <circle cx={half} cy={half} r={sw} fill={color} /></>;
      case 'elbow45':
        return <><path d={`M${half},${fSize} L${half},${half} L${fSize},${half * 0.3}`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          {isFilled && <path d={`M${half},${fSize} L${half},${half} L${fSize},${half * 0.3}`} fill="none" stroke={color} strokeWidth={sw + 2} strokeLinecap="round" strokeLinejoin="round" opacity={0.3} />}
          <circle cx={half} cy={half} r={sw} fill={color} /></>;
      case 'tee':
        return <><line x1={0} y1={half} x2={fSize} y2={half} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <line x1={half} y1={half} x2={half} y2={fSize} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {isFilled && <><line x1={0} y1={half} x2={fSize} y2={half} stroke={color} strokeWidth={sw + 2} opacity={0.3} /><line x1={half} y1={half} x2={half} y2={fSize} stroke={color} strokeWidth={sw + 2} opacity={0.3} /></>}
          <circle cx={half} cy={half} r={sw + 1} fill={color} /></>;
      case 'cross':
        return <><line x1={0} y1={half} x2={fSize} y2={half} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <line x1={half} y1={0} x2={half} y2={fSize} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {isFilled && <><line x1={0} y1={half} x2={fSize} y2={half} stroke={color} strokeWidth={sw + 2} opacity={0.3} /><line x1={half} y1={0} x2={half} y2={fSize} stroke={color} strokeWidth={sw + 2} opacity={0.3} /></>}
          <circle cx={half} cy={half} r={sw + 1} fill={color} /></>;
      case 'reducer':
        return <><path d={`M${half * 0.3},${half} L${half},${half * 0.4} L${half},${half * 1.6} Z`} fill={isFilled ? color : 'none'} stroke={color} strokeWidth={sw * 0.7} fillOpacity={0.3} />
          <line x1={half} y1={half} x2={fSize} y2={half} stroke={color} strokeWidth={sw * 0.6} strokeLinecap="round" />
          <line x1={0} y1={half} x2={half * 0.3} y2={half} stroke={color} strokeWidth={sw} strokeLinecap="round" /></>;
      case 'coupler':
        return <><line x1={0} y1={half} x2={fSize} y2={half} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <rect x={half - sw} y={half - sw - 1} width={sw * 2} height={sw * 2 + 2} rx={2} fill={isFilled ? color : 'none'} stroke={color} strokeWidth={1.5} fillOpacity={isFilled ? 0.4 : 0} /></>;
      case 'cap':
        return <><line x1={0} y1={half} x2={half} y2={half} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <rect x={half} y={half - sw - 1} width={sw + 2} height={sw * 2 + 2} rx={2} fill={isFilled ? color : 'none'} stroke={color} strokeWidth={2} fillOpacity={isFilled ? 0.5 : 0} /></>;
      case 'union':
        return <><line x1={0} y1={half} x2={fSize} y2={half} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <line x1={half - 2} y1={half - sw - 2} x2={half - 2} y2={half + sw + 2} stroke={color} strokeWidth={1.5} />
          <line x1={half + 2} y1={half - sw - 2} x2={half + 2} y2={half + sw + 2} stroke={color} strokeWidth={1.5} /></>;
      case 'flange':
        return <><line x1={0} y1={half} x2={fSize} y2={half} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <rect x={half - 3} y={half - sw - 3} width={6} height={sw * 2 + 6} rx={1} fill={isFilled ? color : 'none'} stroke={color} strokeWidth={2} fillOpacity={isFilled ? 0.3 : 0} />
          <circle cx={half - 2} cy={half - sw - 1} r={1.5} fill={color} /><circle cx={half + 2} cy={half + sw + 1} r={1.5} fill={color} /></>;
      case 'valve':
        return <><line x1={0} y1={half} x2={fSize} y2={half} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <path d={`M${half - sw},${half - sw - 2} L${half + sw},${half} L${half - sw},${half + sw + 2} Z`} fill={isFilled ? color : 'none'} stroke={color} strokeWidth={1.5} fillOpacity={isFilled ? 0.3 : 0} />
          <line x1={half} y1={half - sw - 4} x2={half} y2={half - sw - 10} stroke={color} strokeWidth={2} />
          <line x1={half - 4} y1={half - sw - 10} x2={half + 4} y2={half - sw - 10} stroke={color} strokeWidth={2} /></>;
      default:
        return <circle cx={half} cy={half} r={sw + 2} fill={isFilled ? color : 'none'} stroke={color} strokeWidth={2} />;
    }
  };

  // ═══════════ CANVAS CLICK ═══════════
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.button !== 0 || isPanning) return;
    const coords = toCanvasCoords(e);
    setShowFileMenu(false);

    if (calibrating) {
      const np = [...calibratePoints, coords];
      setCalibratePoints(np);
      if (np.length >= 2) {
        const dx = np[1].x - np[0].x, dy = np[1].y - np[0].y;
        setCalibratedPxPerFt(Math.sqrt(dx * dx + dy * dy) / (parseFloat(calibrateDistance) || 10));
        setCalibrating(false); setCalibratePoints([]);
      }
      return;
    }

    if (tabOrderMode && tabOrderTarget === 'elements') {
      const clickedEl = elements.find(el => Math.abs(el.x - coords.x) < 25 && Math.abs(el.y - coords.y) < 25);
      if (clickedEl) {
        if (!tabOrderTypeFilter) setTabOrderTypeFilter(clickedEl.defId);
        const ft = tabOrderTypeFilter || clickedEl.defId;
        if (clickedEl.defId === ft && !tabOrderAssigned.includes(clickedEl.uid)) {
          const def = getElementDef(clickedEl.defId);
          if (def) {
            setElements(prev => prev.map(el => el.uid === clickedEl.uid
              ? { ...el, number: tabOrderNext, label: `${customElementNames[def.id] || def.shortName || def.name}-${tabOrderNext.toString().padStart(3, '0')}` }
              : el));
            setTabOrderAssigned(prev => [...prev, clickedEl.uid]);
            setTabOrderNext(tabOrderNext + 1);
          }
        }
      }
      return;
    }
    if (tabOrderMode && tabOrderTarget === 'labels') return;

    // ── PLACE ──
    if (tool === 'place' && activeElement && fe('place')) {
      const def = ELEMENTS.find(el => el.id === activeElement);
      if (!def) return;
      const num = getNextNumber(def.id);
      const newEl: PlacedElement = {
        uid: `el-${Date.now()}`, defId: def.id, x: coords.x, y: coords.y, rotation: 0,
        label: `${customElementNames[def.id] || def.shortName || def.name}-${num.toString().padStart(3, '0')}`,
        labelOffsetX: 0, labelOffsetY: 35, notes: '', size: defaultIconSize, labelSize: 'm',
        display: defaultDisplay, number: num, zIndex: elements.length
      };
      setElements(prev => [...prev, newEl]);
      pushHistory();
      if (autoSelect) { setTool('select'); setSelectedElement(newEl.uid); setSelectedElements([newEl.uid]); }
    }
    // ── FITTING ──
    else if (tool === 'fitting' && activeFittingType && fe('pipes')) {
      const newFitting: PipeFitting = {
        uid: `fit-${Date.now()}`, type: activeFittingType, x: coords.x, y: coords.y,
        rotation: 0, size: activePipeSize, style: activePipeStyle, color: activePipeColor, connectedPipes: []
      };
      setFittings(prev => [...prev, newFitting]);
      pushHistory();
    }
    // ── PIPE (click mode) ──
    else if (tool === 'pipe' && pipeMode === 'click' && fe('pipes')) {
      setDrawingPipe(prev => [...prev, coords]);
    }
    // ── PIPE (fixed length mode) ──
    else if (tool === 'pipe' && pipeMode === 'fixed' && fe('pipes')) {
      const len = parseFloat(pipeFixedLength) || 10;
      const pxLen = len * getEffectivePxPerFt();
      const endPoint = { x: coords.x + pxLen, y: coords.y };
      setPipes(prev => [...prev, {
        uid: `pipe-${Date.now()}`, points: [coords, endPoint], size: activePipeSize,
        style: activePipeStyle, color: activePipeColor, label: activePipeLabel, showLength: showPipeLengths
      }]);
      pushHistory();
    }
    // ── CABLE (click mode) ──
    else if (tool === 'cable' && cableMode === 'click' && fe('cables')) {
      setDrawingCable(prev => [...prev, coords]);
    }
    else if (tool === 'cable' && cableMode === 'fixed' && fe('cables')) {
      const len = parseFloat(cableFixedLength) || 10;
      const pxLen = len * getEffectivePxPerFt();
      const endPoint = { x: coords.x + pxLen, y: coords.y };
      setCables(prev => [...prev, {
        uid: `cable-${Date.now()}`, type: activeCableType,
        points: [coords, endPoint], color: cableColor, curved: curvedCables, showLength: showCableLengths
      }]);
      pushHistory();
    }
    else if (tool === 'measure' && measureMode === 'click' && fe('measure')) {
      setDrawingMeasure(prev => [...prev, coords]);
    }
    else if (tool === 'measure' && measureMode === 'fixed' && fe('measure')) {
      const len = parseFloat(measureFixedLength) || 10;
      const pxLen = len * getEffectivePxPerFt();
      const endPoint = { x: coords.x + pxLen, y: coords.y };
      setMeasures(prev => [...prev, { uid: `measure-${Date.now()}`, points: [coords, endPoint], color: measureColor }]);
      pushHistory();
    }
    else if (tool === 'label' && fe('labels')) {
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
      if (autoSelect) { setTool('select'); setSelectedLabel(newLabel.uid); }
    }
    else if (tool === 'select') {
      const clickedEl = elements.find(el => Math.abs(el.x - coords.x) < 25 && Math.abs(el.y - coords.y) < 25);
      if (clickedEl) {
        if (e.shiftKey) {
          setSelectedElements(prev => prev.includes(clickedEl.uid) ? prev.filter(id => id !== clickedEl.uid) : [...prev, clickedEl.uid]);
        } else {
          setSelectedElement(clickedEl.uid); setSelectedElements([clickedEl.uid]); setShowProperties(true);
        }
        setSelectedShape(null); setSelectedCable(null); setSelectedMeasure(null); setSelectedLabel(null); setSelectedPipe(null); setSelectedFitting(null);
      } else {
        // Check fittings
        const clickedFit = fittings.find(f => Math.abs(f.x - coords.x) < 20 && Math.abs(f.y - coords.y) < 20);
        if (clickedFit) {
          setSelectedFitting(clickedFit.uid); setSelectedElement(null); setSelectedElements([]);
          setSelectedPipe(null); setSelectedCable(null); setSelectedMeasure(null); setSelectedLabel(null);
          setSideTab('pipes');
        } else {
          setSelectedElement(null); setSelectedElements([]); setSelectedShape(null);
          setSelectedCable(null); setSelectedMeasure(null); setSelectedLabel(null); setSelectedPipe(null); setSelectedFitting(null);
        }
      }
    }
  };

  const handleCanvasDoubleClick = () => {
    if (tool === 'cable' && cableMode === 'click' && drawingCable.length >= 2) {
      const pts = drawingCable.slice(0, -1);
      if (pts.length >= 2) {
        setCables(prev => [...prev, { uid: `cable-${Date.now()}`, type: activeCableType, points: pts, color: cableColor, curved: curvedCables, showLength: showCableLengths }]);
        pushHistory();
      }
      setDrawingCable([]);
    } else if (tool === 'measure' && measureMode === 'click' && drawingMeasure.length >= 2) {
      const pts = drawingMeasure.slice(0, -1);
      if (pts.length >= 2) {
        setMeasures(prev => [...prev, { uid: `measure-${Date.now()}`, points: pts, color: measureColor }]);
        pushHistory();
      }
      setDrawingMeasure([]);
    } else if (tool === 'pipe' && pipeMode === 'click' && drawingPipe.length >= 2) {
      const pts = drawingPipe.slice(0, -1);
      if (pts.length >= 2) {
        setPipes(prev => [...prev, {
          uid: `pipe-${Date.now()}`, points: pts, size: activePipeSize,
          style: activePipeStyle, color: activePipeColor, label: activePipeLabel, showLength: showPipeLengths
        }]);
        pushHistory();
      }
      setDrawingPipe([]);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (tool === 'cable' && cableMode === 'click' && drawingCable.length >= 2) { finishCable(); }
    else if (tool === 'measure' && measureMode === 'click' && drawingMeasure.length >= 2) { finishMeasure(); }
    else if (tool === 'pipe' && pipeMode === 'click' && drawingPipe.length >= 2) { finishPipe(); }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (tool === 'pan' || e.button === 1) {
      setIsPanning(true); setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); return;
    }
    if (tool === 'shape' && activeShapeType) {
      const coords = toCanvasCoords(e);
      setDrawingShape({ startX: coords.x, startY: coords.y, currentX: coords.x, currentY: coords.y }); return;
    }
    if (tool === 'measure' && measureMode === 'drag' && fe('measure')) {
      const coords = toCanvasCoords(e);
      setDragMeasureStart(coords); setDragMeasureEnd(coords); return;
    }
    if (tool === 'cable' && cableMode === 'drag' && fe('cables')) {
      const coords = toCanvasCoords(e);
      setDragCableStart(coords); setDragCableEnd(coords); return;
    }
    if (tool === 'pipe' && pipeMode === 'drag' && fe('pipes')) {
      const coords = toCanvasCoords(e);
      setDragPipeStart(coords); setDragPipeEnd(coords); return;
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
    if (isPanning) { setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }); return; }
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
    if (dragMeasureStart && tool === 'measure' && measureMode === 'drag') { setDragMeasureEnd(toCanvasCoords(e)); }
    if (dragCableStart && tool === 'cable' && cableMode === 'drag') { setDragCableEnd(toCanvasCoords(e)); }
    if (dragPipeStart && tool === 'pipe' && pipeMode === 'drag') { setDragPipeEnd(toCanvasCoords(e)); }
    if (dragState && tool === 'select') {
      const coords = toCanvasCoords(e);
      const dx = coords.x - dragState.startX, dy = coords.y - dragState.startY;
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
    if (dragMeasureStart && dragMeasureEnd && tool === 'measure' && measureMode === 'drag') {
      const dx = dragMeasureEnd.x - dragMeasureStart.x, dy = dragMeasureEnd.y - dragMeasureStart.y;
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        setMeasures(prev => [...prev, { uid: `measure-${Date.now()}`, points: [dragMeasureStart, dragMeasureEnd], color: measureColor }]);
        pushHistory();
      }
      setDragMeasureStart(null); setDragMeasureEnd(null);
    }
    if (dragCableStart && dragCableEnd && tool === 'cable' && cableMode === 'drag') {
      const dx = dragCableEnd.x - dragCableStart.x, dy = dragCableEnd.y - dragCableStart.y;
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        setCables(prev => [...prev, {
          uid: `cable-${Date.now()}`, type: activeCableType, points: [dragCableStart, dragCableEnd],
          color: cableColor, curved: curvedCables, showLength: showCableLengths
        }]);
        pushHistory();
      }
      setDragCableStart(null); setDragCableEnd(null);
    }
    if (dragPipeStart && dragPipeEnd && tool === 'pipe' && pipeMode === 'drag') {
      const dx = dragPipeEnd.x - dragPipeStart.x, dy = dragPipeEnd.y - dragPipeStart.y;
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        setPipes(prev => [...prev, {
          uid: `pipe-${Date.now()}`, points: [dragPipeStart, dragPipeEnd], size: activePipeSize,
          style: activePipeStyle, color: activePipeColor, label: activePipeLabel, showLength: showPipeLengths
        }]);
        pushHistory();
      }
      setDragPipeStart(null); setDragPipeEnd(null);
    }
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

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) { e.preventDefault(); setZoom(z => Math.max(0.1, Math.min(5, z + (e.deltaY < 0 ? 0.05 : -0.05)))); }
  };

  const getInfoBoxData = () => {
    const ec: Record<string, number> = {};
    elements.forEach(el => {
      const def = getElementDef(el.defId);
      ec[customElementNames[el.defId] || def?.shortName || def?.name || el.defId] = (ec[customElementNames[el.defId] || def?.shortName || def?.name || el.defId] || 0) + 1;
    });
    const cl: Record<string, number> = {};
    cables.forEach(c => {
      const len = parseFloat(getCableLength(c.points));
      cl[CABLE_LABELS[c.type]] = (cl[CABLE_LABELS[c.type]] || 0) + len;
    });
    return { elementCounts: ec, cableLengths: cl };
  };

  const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  const pxPerFt = getEffectivePxPerFt();
  const rulerStep = pxPerFt * zoom < 20 ? 10 : pxPerFt * zoom < 40 ? 5 : 1;

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white select-none">
      {/* ═══ TOOLBAR ═══ */}
      <div className="bg-gray-800 border-b border-gray-700 px-2 py-1.5 flex items-center gap-1 flex-wrap text-sm print:hidden">
        <span className="font-bold text-blue-400 mr-2">LV Designer PRO</span>

        <div className="relative">
          <button onClick={() => setShowFileMenu(!showFileMenu)} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">📁 File</button>
          {showFileMenu && (
            <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 z-50 min-w-[200px]">
              <button onClick={() => { fileInputRef.current?.click(); }} className="w-full px-4 py-2 text-left hover:bg-blue-600">📂 Open Floor Plan</button>
              <button onClick={() => { const inp = document.createElement('input'); inp.type='file'; inp.accept='.lvproj'; inp.onchange=(ev:any)=>{const f=ev.target.files[0];if(f){const r=new FileReader();r.onload=(e:any)=>{try{loadProject(JSON.parse(e.target.result));}catch{alert('Invalid file');}};r.readAsText(f);}};inp.click();setShowFileMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-blue-600">📦 Open Project (.lvproj)</button>
              <div className="border-t border-gray-600 my-1" />
              <button onClick={() => { saveProject(); setShowFileMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-blue-600">💾 Save Project</button>
              <div className="border-t border-gray-600 my-1" />
              {fe('export') && <>
                <button onClick={() => { exportAs('png'); setShowFileMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-blue-600">🖼️ Export PNG</button>
                <button onClick={() => { exportAs('jpg'); setShowFileMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-blue-600">🖼️ Export JPG</button>
                <button onClick={() => { exportAs('pdf'); setShowFileMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-blue-600">📄 Export PDF</button>
              </>}
              <div className="border-t border-gray-600 my-1" />
              <button onClick={() => handlePrint()} className="w-full px-4 py-2 text-left hover:bg-blue-600">🖨️ Print</button>
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
        {fe('cables') && <button onClick={() => setCurvedCables(!curvedCables)} className={`px-2 py-1 rounded ${curvedCables ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`} title="Curved">〰️</button>}
        {fe('pipes') && <button onClick={() => { setTool('pipe'); setSideTab('pipes'); }} className={`px-2 py-1 rounded ${tool === 'pipe' || tool === 'fitting' ? 'bg-rose-600' : 'bg-gray-700 hover:bg-gray-600'}`}>🚿 Pipe</button>}
        {fe('labels') && <button onClick={() => { setTool('label'); setSideTab('labels'); }} className={`px-2 py-1 rounded ${tool === 'label' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>🏷️ Label</button>}
        {fe('measure') && <button onClick={() => { setTool('measure'); setSideTab('measure'); }} className={`px-2 py-1 rounded ${tool === 'measure' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>📏 Measure</button>}
        {fe('shapes') && <button onClick={() => { setTool('shape'); setSideTab('draw'); }} className={`px-2 py-1 rounded ${tool === 'shape' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>⬜ Shape</button>}

        <div className="h-5 w-px bg-gray-600" />
        <button onClick={undo} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600" title="Undo">↩️</button>
        <button onClick={redo} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600" title="Redo">↪️</button>
        <button onClick={deleteSelected} className="px-2 py-1 bg-red-600 rounded hover:bg-red-700" title="Delete">🗑️</button>

        <div className="h-5 w-px bg-gray-600" />
        <select value={defaultIconSize} onChange={e => setDefaultIconSize(e.target.value as IconSize)} className="px-1 py-1 bg-gray-700 rounded text-xs">
          {Object.entries(ICON_SIZES).map(([k, v]) => <option key={k} value={k}>Icon {k.toUpperCase()} ({v})</option>)}
        </select>
        <select value={Object.entries(LABEL_SIZES).find(([, v]) => v === placementLabelSize)?.[0] || 'M'} onChange={e => setPlacementLabelSize(LABEL_SIZES[e.target.value])} className="px-1 py-1 bg-gray-700 rounded text-xs">
          {Object.entries(LABEL_SIZES).map(([k, v]) => <option key={k} value={k}>Name {k} ({v}px)</option>)}
        </select>
        <select value={defaultDisplay} onChange={e => setDefaultDisplay(e.target.value as DisplayMode)} className="px-1 py-1 bg-gray-700 rounded text-xs">
          <option value="icon">Icon Only</option><option value="name">Name Only</option><option value="both">Icon+Name</option>
        </select>

        <div className="h-5 w-px bg-gray-600" />
        <button onClick={() => setZoom(z => Math.max(0.1, z - 0.05))} className="px-1 py-1 bg-gray-700 rounded">➖</button>
        <span className="px-1 text-xs">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(5, z + 0.05))} className="px-1 py-1 bg-gray-700 rounded">➕</button>
        <button onClick={fitToView} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs">Fit</button>
        <button onClick={() => setShowRuler(!showRuler)} className={`px-2 py-1 rounded text-xs ${showRuler ? 'bg-green-600' : 'bg-gray-700'}`}>📐</button>

        <div className="h-5 w-px bg-gray-600" />
        <button onClick={() => setBwMode(!bwMode)} className={`px-2 py-1 rounded text-xs ${bwMode ? 'bg-yellow-600' : 'bg-gray-700'}`}>⬛ B&W</button>
        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={autoSelect} onChange={e => setAutoSelect(e.target.checked)} /> Auto‑Sel</label>
        <button onClick={() => {
          if (tabOrderMode) { setTabOrderMode(false); pushHistory(); }
          else { setTabOrderMode(true); setTabOrderNext(1); setTabOrderTypeFilter(null); setTabOrderAssigned([]); }
        }} className={`px-2 py-1 rounded text-xs ${tabOrderMode ? 'bg-purple-600' : 'bg-gray-700'}`}>🔢 Tab</button>

        {fe('legend') && <button onClick={() => setShowLegend(!showLegend)} className={`px-2 py-1 rounded text-xs ${showLegend ? 'bg-green-600' : 'bg-gray-700'}`}>📖</button>}
        {fe('infobox') && <button onClick={() => setShowInfoBox(!showInfoBox)} className={`px-2 py-1 rounded text-xs ${showInfoBox ? 'bg-blue-600' : 'bg-gray-700'}`}>📊</button>}

        {selectedElements.length >= 2 && <>
          <div className="h-5 w-px bg-gray-600" />
          {['left','centerH','right','top','centerV','bottom'].map(a => (
            <button key={a} onClick={() => alignElements(a)} className="px-1 py-1 bg-purple-600 rounded hover:bg-purple-700 text-xs" title={a}>
              {a==='left'?'⬅':a==='right'?'➡':a==='top'?'⬆':a==='bottom'?'⬇':a==='centerH'?'↔':'↕'}
            </button>
          ))}
          <button onClick={bringToFront} className="px-1 py-1 bg-blue-600 rounded text-xs">⬆F</button>
          <button onClick={sendToBack} className="px-1 py-1 bg-blue-600 rounded text-xs">⬇B</button>
        </>}

        <div className="flex-1" />
        <button onClick={() => setAdminMode(!adminMode)} className={`px-2 py-1 rounded text-xs ${adminMode ? 'bg-red-600' : 'bg-gray-700'}`}>⚙️</button>
        {adminMode && <button onClick={() => setShowAdminPanel(true)} className="px-2 py-1 bg-red-600 rounded text-xs">Admin</button>}
        <button onClick={() => setShowHelp(true)} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs">❓</button>
      </div>

      {tabOrderMode && (
        <div className="bg-purple-600 text-white px-4 py-2 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-bold">🔢 TAB ORDER</span>
            <span>{tabOrderTarget === 'elements' ? '📍 Elements' : '🏷️ Labels'}{tabOrderTypeFilter && <span className="ml-2 px-2 py-0.5 bg-purple-800 rounded text-xs">Type: <b>{tabOrderTypeFilter}</b></span>}</span>
            <span>Next #: <b className="text-yellow-300 text-lg">{tabOrderNext}</b> ({tabOrderAssigned.length} assigned)</span>
            <button onClick={() => { setTabOrderTarget(tabOrderTarget === 'elements' ? 'labels' : 'elements'); setTabOrderTypeFilter(null); setTabOrderAssigned([]); setTabOrderNext(1); }} className="px-2 py-1 bg-purple-800 rounded text-xs">Switch to {tabOrderTarget === 'elements' ? '🏷️ Labels' : '📍 Elements'}</button>
            <button onClick={() => { setTabOrderTypeFilter(null); setTabOrderAssigned([]); setTabOrderNext(1); }} className="px-2 py-1 bg-purple-800 rounded text-xs">🔄 Reset</button>
          </div>
          <button onClick={() => { setTabOrderMode(false); setTabOrderTypeFilter(null); setTabOrderAssigned([]); pushHistory(); }} className="px-3 py-1 bg-green-600 rounded font-bold">✅ Done</button>
        </div>
      )}
      {calibrating && (
        <div className="bg-yellow-600 text-white px-4 py-2 flex items-center justify-between print:hidden">
          <span className="font-bold">📏 CALIBRATING — Click {2 - calibratePoints.length} point(s) for {calibrateDistance} ft</span>
          <button onClick={() => { setCalibrating(false); setCalibratePoints([]); }} className="px-3 py-1 bg-yellow-800 rounded">Cancel</button>
        </div>
      )}

      {/* ═══ MAIN ═══ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ═══ SIDEBAR ═══ */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden print:hidden">
          <div className="flex flex-wrap border-b border-gray-700">
            {(['elements','cables','pipes','labels','draw','measure','layers','save','ref'] as const).map(tab => (
              <button key={tab} onClick={() => setSideTab(tab)} className={`px-2 py-1.5 text-xs capitalize ${sideTab === tab ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                {tab === 'pipes' ? '🚿Pipes' : tab === 'ref' ? '📋Ref' : tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-2 text-sm">

            {/* ─── ELEMENTS TAB ─── */}
            {sideTab === 'elements' && (
              <div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setActiveCat(cat)} className={`px-1.5 py-0.5 text-xs rounded ${activeCat === cat ? 'text-white' : 'bg-gray-700'}`}
                      style={{ backgroundColor: activeCat === cat ? categoryColors[cat] : undefined }}>{CATEGORY_LABELS[cat]}</button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-2 p-1 bg-gray-750 rounded">
                  <span className="text-xs text-gray-400">Group Color:</span>
                  <input type="color" value={categoryColors[activeCat]} onChange={e => setCategoryColors(prev => ({ ...prev, [activeCat]: e.target.value }))} className="w-6 h-6 rounded cursor-pointer" />
                  <button onClick={() => { setCategoryColors({ ...DEFAULT_CATEGORY_COLORS }); setIconColors({}); setCustomElementNames({}); }} className="text-xs px-2 py-0.5 bg-gray-600 rounded hover:bg-gray-500">Reset</button>
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
                          className="w-full text-xs bg-transparent border-b border-gray-500 focus:border-blue-400 outline-none text-gray-300 mt-0.5" placeholder="Short name" />
                      </div>
                      <input type="color" value={iconColors[el.id] || categoryColors[activeCat]}
                        onChange={e => setIconColors(prev => ({ ...prev, [el.id]: e.target.value }))}
                        className="w-5 h-5 rounded cursor-pointer" onClick={e => e.stopPropagation()} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── CABLES TAB ─── */}
            {sideTab === 'cables' && (
              <div className="space-y-3">
                <div className="border border-gray-600 rounded-lg overflow-hidden">
                  <div className="bg-gray-700 px-2 py-1 text-xs font-bold text-gray-300">📐 Drawing Mode</div>
                  <div className="p-2 space-y-1">
                    {([['click','📍 A: Click Points','Click to add points. Right-click / Enter / Double-click to finish.','bg-green-700 border border-green-500'],['drag','✋ B: Drag Line','Click and drag from start to end.','bg-yellow-700 border border-yellow-500'],['fixed','📐 C: Fixed Length','Enter length, click to place.','bg-purple-700 border border-purple-500']] as const).map(([mode,title,desc,activeClass]) => (
                      <button key={mode} onClick={() => setCableMode(mode as DrawMode)} className={`w-full text-left p-2 rounded text-xs ${cableMode === mode ? activeClass : 'bg-gray-700 hover:bg-gray-600'}`}>
                        <div className="font-bold">{title}</div><div className="text-gray-400 mt-0.5">{desc}</div>
                      </button>
                    ))}
                    {cableMode === 'fixed' && (
                      <div className="flex gap-1 items-center mt-1 p-1 bg-gray-700 rounded">
                        <input type="number" value={cableFixedLength} onChange={e => setCableFixedLength(e.target.value)} className="flex-1 px-2 py-1 bg-gray-600 rounded text-xs border border-gray-500" placeholder="Length" />
                        <span className="text-xs text-gray-400">ft</span>
                      </div>
                    )}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={curvedCables} onChange={e => setCurvedCables(e.target.checked)} /> Curved cables</label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={showCableLengths} onChange={e => setShowCableLengths(e.target.checked)} /> Show cable lengths</label>
                <div>
                  <label className="text-xs text-gray-400">Thickness: {cableThickness}px</label>
                  <input type="range" min="1" max="8" value={cableThickness} onChange={e => setCableThickness(parseInt(e.target.value))} className="w-full" />
                </div>
                <div><label className="text-xs text-gray-400">Color</label><input type="color" value={cableColor} onChange={e => setCableColor(e.target.value)} className="w-full h-6 rounded cursor-pointer" /></div>
                <div className="space-y-1">
                  {(Object.keys(CABLE_COLORS) as CableType[]).map(ct => (
                    <div key={ct} onClick={() => { setActiveCableType(ct); setCableColor(CABLE_COLORS[ct]); setTool('cable'); }}
                      className={`p-1.5 rounded cursor-pointer ${activeCableType === ct ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                      <div className="flex items-center gap-2"><div className="w-4 h-1 rounded" style={{ backgroundColor: CABLE_COLORS[ct] }} /><span className="text-xs">{CABLE_LABELS[ct]}</span></div>
                    </div>
                  ))}
                </div>

                {selectedCable !== null && cables[selectedCable] && (() => {
                  const c = cables[selectedCable]; const cIdx = selectedCable;
                  return (
                    <div className="border border-green-500 rounded-lg mt-3 overflow-hidden">
                      <div className="bg-green-700 px-2 py-1.5 flex items-center justify-between">
                        <span className="text-xs font-bold">✏️ Edit Cable</span>
                        <button onClick={() => setSelectedCable(null)} className="text-xs px-1.5 py-0.5 bg-green-800 rounded">✕</button>
                      </div>
                      <div className="p-2 bg-gray-750 space-y-2">
                        <div className="text-xs text-gray-300">Type: <b>{CABLE_LABELS[c.type]}</b></div>
                        <div className="text-xs font-bold text-yellow-400">Total: {getCableLength(c.points)} ft</div>
                        {c.points.slice(1).map((p, j) => {
                          const prev = c.points[j]; const segLen = getSegmentLength(prev, p);
                          return (
                            <div key={j} className="bg-gray-700 rounded p-2">
                              <div className="text-xs text-gray-300 mb-1.5 font-bold">{String.fromCharCode(65+j)} → {String.fromCharCode(66+j)}: {segLen} ft</div>
                              <div className="flex gap-1 items-center mb-1.5">
                                {[{label:'➖ -0.5',delta:-0.5,cls:'bg-red-600 hover:bg-red-700'},{label:'➕ +0.5',delta:0.5,cls:'bg-green-600 hover:bg-green-700'}].map(btn => (
                                  <button key={btn.label} onClick={() => {
                                    const newLen = Math.max(0.5, parseFloat(segLen) + btn.delta);
                                    const dx = p.x - prev.x, dy = p.y - prev.y, dist = Math.sqrt(dx*dx+dy*dy);
                                    if (!dist) return;
                                    const ratio = (newLen * getEffectivePxPerFt()) / dist;
                                    setCables(prev2 => prev2.map((cc, ci) => ci !== cIdx ? cc : { ...cc, points: cc.points.map((pt, pi) => pi === j+1 ? { x: prev.x + dx * ratio, y: prev.y + dy * ratio } : pt) }));
                                    pushHistory();
                                  }} className={`flex-1 px-2 py-1.5 rounded text-xs font-bold ${btn.cls}`}>{btn.label}</button>
                                ))}
                              </div>
                              <input type="text" defaultValue={segLen} className="w-full px-2 py-1.5 bg-gray-600 rounded text-xs border border-gray-500 text-center" placeholder="Enter exact length"
                                onKeyDown={e => { if (e.key === 'Enter') { const val = parseFloat((e.target as HTMLInputElement).value); if (isNaN(val) || val <= 0) return; const dx = p.x - prev.x, dy = p.y - prev.y, dist = Math.sqrt(dx*dx+dy*dy); if (!dist) return; const ratio = (val * getEffectivePxPerFt()) / dist; setCables(prev2 => prev2.map((cc, ci) => ci !== cIdx ? cc : { ...cc, points: cc.points.map((pt, pi) => pi === j+1 ? { x: prev.x + dx * ratio, y: prev.y + dy * ratio } : pt) })); pushHistory(); }}} />
                            </div>
                          );
                        })}
                        <button onClick={() => { setCables(prev => prev.filter((_, i) => i !== cIdx)); setSelectedCable(null); pushHistory(); }} className="w-full px-2 py-1.5 bg-red-600 rounded text-xs font-bold">🗑️ Delete Cable</button>
                      </div>
                    </div>
                  );
                })()}

                {cables.length > 0 && (
                  <div className="border-t border-gray-600 pt-2 mt-2">
                    <div className="text-xs font-bold text-gray-300 mb-1">📊 Cable Summary</div>
                    {(Object.keys(CABLE_COLORS) as CableType[]).map(ct => {
                      const tc = cables.filter(c => c.type === ct); if (!tc.length) return null;
                      return (<div key={ct} className="flex items-center gap-2 py-1 border-b border-gray-700"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: CABLE_COLORS[ct] }} /><span className="text-xs flex-1">{CABLE_LABELS[ct]}</span><span className="text-xs text-gray-400">{tc.length} runs</span><span className="text-xs font-bold">{tc.reduce((s, c) => s + parseFloat(getCableLength(c.points)), 0).toFixed(1)} ft</span></div>);
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── PIPES TAB ─── */}
            {sideTab === 'pipes' && (
              <div className="space-y-3">
                {/* Mode selector: Pipe vs Fitting */}
                <div className="flex gap-1">
                  <button onClick={() => { setTool('pipe'); setActiveFittingType(null); }} className={`flex-1 px-2 py-1.5 rounded text-xs font-bold ${tool === 'pipe' ? 'bg-rose-600' : 'bg-gray-700 hover:bg-gray-600'}`}>🔧 Draw Pipe</button>
                  <button onClick={() => { setTool('fitting'); }} className={`flex-1 px-2 py-1.5 rounded text-xs font-bold ${tool === 'fitting' ? 'bg-rose-600' : 'bg-gray-700 hover:bg-gray-600'}`}>⚙️ Place Fitting</button>
                </div>

                {/* Pipe Drawing Modes */}
                {tool === 'pipe' && (
                  <div className="border border-gray-600 rounded-lg overflow-hidden">
                    <div className="bg-gray-700 px-2 py-1 text-xs font-bold text-gray-300">📐 Drawing Mode</div>
                    <div className="p-2 space-y-1">
                      {([['click','📍 Click Points','Click to add. Right-click/Enter/Dbl-click to finish.'],['drag','✋ Drag Line','Click and drag start to end.'],['fixed','📐 Fixed Length','Enter length, click to place.']] as const).map(([mode,title,desc]) => (
                        <button key={mode} onClick={() => setPipeMode(mode as DrawMode)} className={`w-full text-left p-1.5 rounded text-xs ${pipeMode === mode ? 'bg-rose-700 border border-rose-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                          <div className="font-bold">{title}</div><div className="text-gray-400 mt-0.5">{desc}</div>
                        </button>
                      ))}
                      {pipeMode === 'fixed' && (
                        <div className="flex gap-1 items-center mt-1 p-1 bg-gray-700 rounded">
                          <input type="number" value={pipeFixedLength} onChange={e => setPipeFixedLength(e.target.value)} className="flex-1 px-2 py-1 bg-gray-600 rounded text-xs border border-gray-500" />
                          <span className="text-xs text-gray-400">ft</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fittings selector */}
                {tool === 'fitting' && (
                  <div className="border border-gray-600 rounded-lg overflow-hidden">
                    <div className="bg-gray-700 px-2 py-1 text-xs font-bold text-gray-300">⚙️ Fittings</div>
                    <div className="p-2 grid grid-cols-2 gap-1">
                      {(Object.keys(FITTING_LABELS) as FittingType[]).map(ft => (
                        <button key={ft} onClick={() => setActiveFittingType(ft)}
                          className={`p-1.5 rounded text-center ${activeFittingType === ft ? 'bg-rose-600 ring-1 ring-rose-400' : 'bg-gray-700 hover:bg-gray-600'}`}>
                          <svg width={32} height={32} viewBox="0 0 32 32" className="mx-auto mb-0.5">
                            {renderFittingSVG(ft, activePipeSize, activePipeStyle, activePipeColor, 32)}
                          </svg>
                          <div className="text-xs truncate">{FITTING_LABELS[ft]}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pipe Settings */}
                <div className="border border-gray-600 rounded-lg overflow-hidden">
                  <div className="bg-gray-700 px-2 py-1 text-xs font-bold text-gray-300">📏 Pipe Settings</div>
                  <div className="p-2 space-y-2">
                    <div>
                      <label className="text-xs text-gray-400">Size</label>
                      <select value={activePipeSize} onChange={e => setActivePipeSize(e.target.value as PipeSize)} className="w-full px-1 py-1 bg-gray-700 rounded text-xs border border-gray-600">
                        {Object.entries(PIPE_SIZES).map(([k, v]) => <option key={k} value={k}>{k} ({v}px)</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Style</label>
                      <div className="flex gap-1">
                        <button onClick={() => setActivePipeStyle('hollow')} className={`flex-1 py-1 rounded text-xs ${activePipeStyle === 'hollow' ? 'bg-rose-600' : 'bg-gray-700'}`}>○ Hollow</button>
                        <button onClick={() => setActivePipeStyle('filled')} className={`flex-1 py-1 rounded text-xs ${activePipeStyle === 'filled' ? 'bg-rose-600' : 'bg-gray-700'}`}>● Filled</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Color</label>
                      <div className="flex gap-1 flex-wrap">
                        {Object.entries(PIPE_COLORS).map(([k, v]) => (
                          <button key={k} onClick={() => setActivePipeColor(v)} className={`px-2 py-1 rounded text-xs capitalize ${activePipeColor === v ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: v }}>{k}</button>
                        ))}
                      </div>
                      <input type="color" value={activePipeColor} onChange={e => setActivePipeColor(e.target.value)} className="w-full h-6 rounded cursor-pointer mt-1" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Label</label>
                      <input type="text" value={activePipeLabel} onChange={e => setActivePipeLabel(e.target.value)} className="w-full px-1 py-0.5 bg-gray-700 rounded text-xs border border-gray-600" />
                    </div>
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={showPipeLengths} onChange={e => setShowPipeLengths(e.target.checked)} /> Show pipe lengths</label>
                    <button onClick={() => setActivePipeColor(PIPE_COLORS.main)} className="w-full px-2 py-1 bg-gray-600 rounded text-xs hover:bg-gray-500 mt-1">🔄 Reset Color to Default</button>
                  </div>
                </div>

                {/* Selected Pipe Edit */}
                {selectedPipe !== null && pipes[selectedPipe] && (() => {
                  const p = pipes[selectedPipe]; const pIdx = selectedPipe;
                  return (
                    <div className="border border-rose-500 rounded-lg overflow-hidden">
                      <div className="bg-rose-700 px-2 py-1.5 flex items-center justify-between">
                        <span className="text-xs font-bold">✏️ Edit Pipe</span>
                        <button onClick={() => setSelectedPipe(null)} className="text-xs px-1.5 py-0.5 bg-rose-800 rounded">✕</button>
                      </div>
                      <div className="p-2 bg-gray-750 space-y-2">
                        <div className="text-xs text-gray-300">Size: <b>{p.size}</b> | Style: <b>{p.style}</b> | Label: <b>{p.label}</b></div>
                        <div className="text-xs font-bold text-yellow-400">Total: {getCableLength(p.points)} ft</div>
                        {p.points.slice(1).map((pt, j) => {
                          const prev = p.points[j]; const segLen = getSegmentLength(prev, pt);
                          return (
                            <div key={j} className="bg-gray-700 rounded p-2">
                              <div className="text-xs text-gray-300 mb-1.5 font-bold">{String.fromCharCode(65+j)} → {String.fromCharCode(66+j)}: {segLen} ft</div>
                              <div className="flex gap-1 items-center mb-1.5">
                                {[{label:'➖ -0.5',delta:-0.5,cls:'bg-red-600 hover:bg-red-700'},{label:'➕ +0.5',delta:0.5,cls:'bg-green-600 hover:bg-green-700'}].map(btn => (
                                  <button key={btn.label} onClick={() => {
                                    const newLen = Math.max(0.5, parseFloat(segLen) + btn.delta);
                                    const dx = pt.x - prev.x, dy = pt.y - prev.y, dist = Math.sqrt(dx*dx+dy*dy);
                                    if (!dist) return;
                                    const ratio = (newLen * getEffectivePxPerFt()) / dist;
                                    setPipes(prev2 => prev2.map((pp, pi) => pi !== pIdx ? pp : { ...pp, points: pp.points.map((q, qi) => qi === j+1 ? { x: prev.x + dx * ratio, y: prev.y + dy * ratio } : q) }));
                                    pushHistory();
                                  }} className={`flex-1 px-2 py-1.5 rounded text-xs font-bold ${btn.cls}`}>{btn.label}</button>
                                ))}
                              </div>
                              <input type="text" defaultValue={segLen} className="w-full px-2 py-1.5 bg-gray-600 rounded text-xs border border-gray-500 text-center" placeholder="Enter exact length"
                                onKeyDown={e => { if (e.key === 'Enter') { const val = parseFloat((e.target as HTMLInputElement).value); if (isNaN(val) || val <= 0) return; const dx = pt.x - prev.x, dy = pt.y - prev.y, dist = Math.sqrt(dx*dx+dy*dy); if (!dist) return; const ratio = (val * getEffectivePxPerFt()) / dist; setPipes(prev2 => prev2.map((pp, pi) => pi !== pIdx ? pp : { ...pp, points: pp.points.map((q, qi) => qi === j+1 ? { x: prev.x + dx * ratio, y: prev.y + dy * ratio } : q) })); pushHistory(); }}} />
                            </div>
                          );
                        })}
                        <div className="flex gap-1">
                          <select value={p.size} onChange={e => { setPipes(prev => prev.map((pp, pi) => pi !== pIdx ? pp : { ...pp, size: e.target.value as PipeSize })); pushHistory(); }} className="flex-1 px-1 py-1 bg-gray-600 rounded text-xs">
                            {Object.keys(PIPE_SIZES).map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                          <button onClick={() => { setPipes(prev => prev.map((pp, pi) => pi !== pIdx ? pp : { ...pp, style: pp.style === 'hollow' ? 'filled' : 'hollow' })); pushHistory(); }} className="px-2 py-1 bg-gray-600 rounded text-xs">{p.style === 'hollow' ? '○→●' : '●→○'}</button>
                        </div>
                        <button onClick={() => { setPipes(prev => prev.filter((_, i) => i !== pIdx)); setSelectedPipe(null); pushHistory(); }} className="w-full px-2 py-1.5 bg-red-600 rounded text-xs font-bold">🗑️ Delete Pipe</button>
                      </div>
                    </div>
                  );
                })()}

                {/* Selected Fitting Edit */}
                {selectedFitting && (() => {
                  const fit = fittings.find(f => f.uid === selectedFitting);
                  if (!fit) return null;
                  return (
                    <div className="border border-rose-500 rounded-lg overflow-hidden">
                      <div className="bg-rose-700 px-2 py-1.5 flex items-center justify-between">
                        <span className="text-xs font-bold">✏️ Edit Fitting</span>
                        <button onClick={() => setSelectedFitting(null)} className="text-xs px-1.5 py-0.5 bg-rose-800 rounded">✕</button>
                      </div>
                      <div className="p-2 bg-gray-750 space-y-2">
                        <div className="text-xs text-gray-300">Type: <b>{FITTING_LABELS[fit.type]}</b></div>
                        <div>
                          <label className="text-xs text-gray-400">Rotation</label>
                          <div className="flex gap-1 flex-wrap">{[0,45,90,135,180,225,270,315].map(r => (
                            <button key={r} onClick={() => { setFittings(prev => prev.map(f => f.uid === selectedFitting ? { ...f, rotation: r } : f)); pushHistory(); }}
                              className={`px-1.5 py-0.5 rounded text-xs ${fit.rotation === r ? 'bg-rose-600' : 'bg-gray-600'}`}>{r}°</button>
                          ))}</div>
                        </div>
                        <div className="flex gap-1">
                          <select value={fit.size} onChange={e => { setFittings(prev => prev.map(f => f.uid === selectedFitting ? { ...f, size: e.target.value as PipeSize } : f)); pushHistory(); }} className="flex-1 px-1 py-1 bg-gray-600 rounded text-xs">
                            {Object.keys(PIPE_SIZES).map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                          <button onClick={() => { setFittings(prev => prev.map(f => f.uid === selectedFitting ? { ...f, style: f.style === 'hollow' ? 'filled' : 'hollow' } : f)); pushHistory(); }} className="px-2 py-1 bg-gray-600 rounded text-xs">{fit.style === 'hollow' ? '○→●' : '●→○'}</button>
                        </div>
                        <button onClick={() => { setFittings(prev => prev.filter(f => f.uid !== selectedFitting)); setSelectedFitting(null); pushHistory(); }} className="w-full px-2 py-1.5 bg-red-600 rounded text-xs font-bold">🗑️ Delete</button>
                      </div>
                    </div>
                  );
                })()}

                {/* Pipe Summary */}
                {pipes.length > 0 && (
                  <div className="border-t border-gray-600 pt-2 mt-2">
                    <div className="text-xs font-bold text-gray-300 mb-1">📊 Pipe Summary</div>
                    {pipes.map((p, i) => (
                      <div key={p.uid} className={`flex items-center gap-2 py-1 border-b border-gray-700 cursor-pointer ${selectedPipe === i ? 'bg-rose-800' : 'hover:bg-gray-700'}`}
                        onClick={() => { setSelectedPipe(i); setSelectedCable(null); setSelectedMeasure(null); setSelectedElement(null); setSelectedElements([]); }}>
                        <div className="w-3 h-1 rounded" style={{ backgroundColor: p.color, height: PIPE_SIZES[p.size] }} />
                        <span className="text-xs flex-1">{p.label} ({p.size})</span>
                        <span className="text-xs font-bold">{getCableLength(p.points)} ft</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 py-1 mt-1">
                      <span className="text-xs font-bold flex-1">TOTAL</span>
                      <span className="text-xs font-bold text-yellow-400">{pipes.reduce((s, p) => s + parseFloat(getCableLength(p.points)), 0).toFixed(1)} ft</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Fittings: {fittings.length}</div>
                  </div>
                )}
              </div>
            )}

            {/* ─── LABELS TAB ─── */}
            {sideTab === 'labels' && (
              <div className="space-y-2">
                <div className="flex gap-2 items-center mb-2">
                  <span className="text-xs text-gray-400">Size:</span>
                  <select value={Object.entries(LABEL_SIZES).find(([, v]) => v === placementLabelSize)?.[0] || 'M'} onChange={e => setPlacementLabelSize(LABEL_SIZES[e.target.value])} className="px-1 py-0.5 bg-gray-700 rounded text-xs flex-1">
                    {Object.entries(LABEL_SIZES).map(([k, v]) => <option key={k} value={k}>{k} ({v}px)</option>)}
                  </select>
                </div>
                {[...labelPresets, ...customLabelPresets].map((preset, idx) => (
                  <div key={`${preset.type}-${idx}`} className={`p-1.5 rounded cursor-pointer ${activeLabelType === preset.type ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    onClick={() => { setActiveLabelType(preset.type); setTool('label'); }}>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ backgroundColor: preset.color }} /><span className="text-xs flex-1">{preset.prefix}</span></div>
                  </div>
                ))}
                <div className="border-t border-gray-600 pt-2 mt-2">
                  <div className="text-xs text-gray-400 mb-1">Add Custom Label</div>
                  <div className="flex gap-1">
                    <input type="text" placeholder="Name" id="customLabelName" className="flex-1 px-1 py-0.5 bg-gray-700 rounded text-xs border border-gray-600" />
                    <input type="color" defaultValue="#22c55e" id="customLabelColor" className="w-6 h-6 rounded cursor-pointer" />
                    <button onClick={() => { const n = (document.getElementById('customLabelName') as HTMLInputElement)?.value; const c = (document.getElementById('customLabelColor') as HTMLInputElement)?.value; if (n) setCustomLabelPresets(prev => [...prev, { type: `custom-${Date.now()}` as any, prefix: n, color: c, increment: 1, incrementMode: 'one-up' }]); }} className="px-2 py-0.5 bg-green-600 rounded text-xs">+</button>
                  </div>
                </div>
                {selectedLabel && (() => {
                  const lbl = labels.find(l => l.uid === selectedLabel); if (!lbl) return null;
                  return (
                    <div className="border-t border-gray-600 pt-2 mt-2 space-y-1">
                      <div className="text-xs font-medium text-gray-300">Selected Label</div>
                      <input type="text" value={lbl.prefix} onChange={e => setLabels(prev => prev.map(l => l.uid === selectedLabel ? { ...l, prefix: e.target.value } : l))} className="w-full px-1 py-0.5 bg-gray-700 rounded text-xs border border-gray-600" />
                      <input type="number" value={lbl.number} onChange={e => setLabels(prev => prev.map(l => l.uid === selectedLabel ? { ...l, number: parseInt(e.target.value) || 0 } : l))} className="w-full px-1 py-0.5 bg-gray-700 rounded text-xs border border-gray-600" />
                      <button onClick={() => { setLabels(prev => prev.filter(l => l.uid !== selectedLabel)); setSelectedLabel(null); pushHistory(); }} className="w-full px-1 py-0.5 bg-red-600 rounded text-xs">🗑️ Delete</button>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ─── DRAW TAB ─── */}
            {sideTab === 'draw' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-1">
                  {(['rect','circle','oval','triangle','line'] as const).map(t => (
                    <button key={t} onClick={() => { setActiveShapeType(t); setTool('shape'); }}
                      className={`p-2 rounded text-center ${activeShapeType === t ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                      <div className="text-lg">{t==='rect'?'⬜':t==='circle'?'⭕':t==='oval'?'⬭':t==='triangle'?'△':'╱'}</div>
                      <div className="text-xs capitalize">{t}</div>
                    </button>
                  ))}
                </div>
                <div><label className="text-xs text-gray-400">Color</label><input type="color" value={shapeColor} onChange={e => setShapeColor(e.target.value)} className="w-full h-6 rounded cursor-pointer" /></div>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={shapeFill} onChange={e => setShapeFill(e.target.checked)} /> Fill shape</label>
              </div>
            )}

            {/* ─── MEASURE TAB ─── */}
            {sideTab === 'measure' && (
              <div className="space-y-3">
                <div className="border border-gray-600 rounded-lg overflow-hidden">
                  <div className="bg-gray-700 px-2 py-1 text-xs font-bold text-gray-300">📐 Drawing Mode</div>
                  <div className="p-2 space-y-1">
                    {([['click','📍 A: Click Points','Click to add. Right-click/Enter/Dbl-click to finish.'],['drag','✋ B: Drag Line','Click and drag start to end.'],['fixed','📐 C: Fixed Length','Enter distance, click to place.']] as const).map(([mode,title,desc]) => (
                      <button key={mode} onClick={() => setMeasureMode(mode as DrawMode)} className={`w-full text-left p-2 rounded text-xs ${measureMode === mode ? 'bg-green-700 border border-green-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        <div className="font-bold">{title}</div><div className="text-gray-400 mt-0.5">{desc}</div>
                      </button>
                    ))}
                    {measureMode === 'fixed' && (
                      <div className="flex gap-1 items-center mt-1 p-1 bg-gray-700 rounded">
                        <input type="number" value={measureFixedLength} onChange={e => setMeasureFixedLength(e.target.value)} className="flex-1 px-2 py-1 bg-gray-600 rounded text-xs border border-gray-500" />
                        <span className="text-xs text-gray-400">ft</span>
                      </div>
                    )}
                  </div>
                </div>
                <div><label className="text-xs text-gray-400">Scale</label><select value={scale.label} onChange={e => { setScale(SCALE_PRESETS.find(s => s.label === e.target.value) || SCALE_PRESETS[2]); setCalibratedPxPerFt(null); }} className="w-full px-1 py-1 bg-gray-700 rounded text-xs border border-gray-600">{SCALE_PRESETS.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}</select></div>
                <div className="border border-gray-600 rounded-lg overflow-hidden">
                  <div className="bg-gray-700 px-2 py-1 text-xs font-bold text-gray-300">📏 Calibrate</div>
                  <div className="p-2 space-y-1">
                    <div className="flex gap-1 items-center"><input type="number" value={calibrateDistance} onChange={e => setCalibrateDistance(e.target.value)} className="flex-1 px-2 py-1 bg-gray-600 rounded text-xs border border-gray-500" /><span className="text-xs text-gray-400">ft</span></div>
                    <button onClick={() => { setCalibrating(true); setCalibratePoints([]); }} className="w-full px-2 py-1.5 bg-yellow-600 rounded text-xs font-bold">{calibrating ? '⏳ Click 2 points...' : '📏 Start Calibration'}</button>
                    {calibratedPxPerFt && <div className="text-xs text-green-400 font-bold">✅ {calibratedPxPerFt.toFixed(1)} px/ft</div>}
                  </div>
                </div>
                {measures.map((m, i) => (
                  <div key={m.uid} className={`p-1.5 rounded text-xs cursor-pointer ${selectedMeasure === i ? 'bg-blue-600' : 'bg-gray-700'}`} onClick={() => setSelectedMeasure(selectedMeasure === i ? null : i)}>
                    <div className="font-bold">Total: {getCableLength(m.points)} ft</div>
                  </div>
                ))}
                {selectedMeasure !== null && measures[selectedMeasure] && (() => {
                  const m = measures[selectedMeasure]; const mIdx = selectedMeasure;
                  return (
                    <div className="border border-blue-500 rounded-lg mt-3 overflow-hidden">
                      <div className="bg-blue-700 px-2 py-1.5 flex items-center justify-between">
                        <span className="text-xs font-bold">✏️ Edit Measure</span>
                        <button onClick={() => setSelectedMeasure(null)} className="text-xs px-1.5 py-0.5 bg-blue-800 rounded">✕</button>
                      </div>
                      <div className="p-2 bg-gray-750 space-y-2">
                        <div className="text-xs font-bold text-yellow-400">Total: {getCableLength(m.points)} ft</div>
                        {m.points.slice(1).map((p, j) => {
                          const prev = m.points[j]; const segLen = getSegmentLength(prev, p);
                          return (
                            <div key={j} className="bg-gray-700 rounded p-2">
                              <div className="text-xs text-gray-300 mb-1.5 font-bold">{String.fromCharCode(65+j)} → {String.fromCharCode(66+j)}: {segLen} ft</div>
                              <div className="flex gap-1 items-center mb-1.5">
                                {[{label:'➖ -0.5',delta:-0.5,cls:'bg-red-600'},{label:'➕ +0.5',delta:0.5,cls:'bg-green-600'}].map(btn => (
                                  <button key={btn.label} onClick={() => {
                                    const newLen = Math.max(0.5, parseFloat(segLen) + btn.delta);
                                    const dx = p.x - prev.x, dy = p.y - prev.y, dist = Math.sqrt(dx*dx+dy*dy); if (!dist) return;
                                    setMeasures(prev2 => prev2.map((mm, mi) => mi !== mIdx ? mm : { ...mm, points: mm.points.map((pt, pi) => pi === j+1 ? { x: prev.x + dx * (newLen * getEffectivePxPerFt()) / dist, y: prev.y + dy * (newLen * getEffectivePxPerFt()) / dist } : pt) })); pushHistory();
                                  }} className={`flex-1 px-2 py-1.5 rounded text-xs font-bold ${btn.cls}`}>{btn.label}</button>
                                ))}
                              </div>
                              <input type="text" defaultValue={segLen} className="w-full px-2 py-1.5 bg-gray-600 rounded text-xs border border-gray-500 text-center" placeholder="Enter exact length"
                                onKeyDown={e => { if (e.key === 'Enter') { const val = parseFloat((e.target as HTMLInputElement).value); if (isNaN(val) || val <= 0) return; const dx = p.x - prev.x, dy = p.y - prev.y, dist = Math.sqrt(dx*dx+dy*dy); if (!dist) return; const ratio = (val * getEffectivePxPerFt()) / dist; setMeasures(prev2 => prev2.map((mm, mi) => mi !== mIdx ? mm : { ...mm, points: mm.points.map((pt, pi) => pi === j+1 ? { x: prev.x + dx * ratio, y: prev.y + dy * ratio } : pt) })); pushHistory(); }}} />
                            </div>
                          );
                        })}
                        <button onClick={() => { setMeasures(prev => prev.filter((_, i) => i !== mIdx)); setSelectedMeasure(null); pushHistory(); }} className="w-full px-2 py-1 bg-red-600 rounded text-xs">🗑️ Delete</button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ─── LAYERS TAB ─── */}
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

            {/* ─── SAVE TAB ─── */}
            {sideTab === 'save' && (
              <div className="space-y-2">
                <div><label className="text-xs text-gray-400">Project Name</label><input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full p-1 bg-gray-700 rounded border border-gray-600 text-sm" /></div>
                <button onClick={saveProject} className="w-full p-2 bg-blue-600 rounded hover:bg-blue-700 text-sm">💾 Save Project (.lvproj)</button>
                {fe('export') && <>
                  <button onClick={() => exportAs('png')} className="w-full p-2 bg-green-600 rounded hover:bg-green-700 text-sm">Export PNG</button>
                  <button onClick={() => exportAs('jpg')} className="w-full p-2 bg-green-600 rounded hover:bg-green-700 text-sm">Export JPG</button>
                  <button onClick={() => exportAs('pdf')} className="w-full p-2 bg-green-600 rounded hover:bg-green-700 text-sm">Export PDF</button>
                </>}
              </div>
            )}

            {/* ─── REFERENCE SYMBOLS TAB ─── */}
            {sideTab === 'ref' && (
              <div className="space-y-3">
                <div className="text-xs text-gray-400 italic p-2 bg-gray-750 rounded border border-gray-600">
                  📋 <b>Reference Only</b> — These symbols are not placed on the plan and do not affect element counts or summaries.
                </div>
                {CATEGORIES.map(cat => {
                  const catElements = ELEMENTS.filter(el => el.category === cat);
                  if (catElements.length === 0) return null;
                  const placed = elements.filter(e => getElementDef(e.defId)?.category === cat).length;
                  return (
                    <div key={cat} className="border border-gray-600 rounded-lg overflow-hidden">
                      <div className="px-2 py-1.5 flex items-center justify-between" style={{ backgroundColor: categoryColors[cat] + '33', borderBottom: `2px solid ${categoryColors[cat]}` }}>
                        <span className="text-xs font-bold" style={{ color: categoryColors[cat] }}>{CATEGORY_LABELS[cat]}</span>
                        <span className="text-xs text-gray-400">{placed} placed</span>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        {catElements.map(el => {
                          const count = elements.filter(e => e.defId === el.id).length;
                          return (
                            <div key={el.id} className="flex items-center gap-2 px-1.5 py-1 rounded bg-gray-700/50 hover:bg-gray-700">
                              <SchematicIcon defId={el.id} category={cat} size={22} customColor={getIconColor(el.id, cat)} />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">{customElementNames[el.id] || el.shortName}</div>
                                <div className="text-xs text-gray-500 truncate">{el.name}</div>
                              </div>
                              {count > 0 && <span className="text-xs px-1.5 py-0.5 bg-blue-600 rounded-full font-bold">×{count}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── PROPERTIES PANEL ─── */}
          {showProperties && selectedElement && (() => {
            const el = elements.find(e => e.uid === selectedElement); if (!el) return null;
            return (
              <div className="border-t border-gray-700 p-2 bg-gray-800 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Properties</span>
                  <button onClick={() => setShowProperties(false)} className="text-xs px-1 bg-gray-600 rounded">✕</button>
                </div>
                <div className="space-y-1 text-xs">
                  <div><label className="text-gray-400">Label</label><input type="text" value={el.label} onChange={e => setElements(prev => prev.map(x => x.uid === el.uid ? { ...x, label: e.target.value } : x))} className="w-full p-0.5 bg-gray-700 rounded border border-gray-600" /></div>
                  <div className="flex gap-1">
                    <div className="flex-1"><label className="text-gray-400">Size</label><select value={el.size} onChange={e => setElements(prev => prev.map(x => x.uid === el.uid ? { ...x, size: e.target.value as IconSize } : x))} className="w-full p-0.5 bg-gray-700 rounded border border-gray-600">
                      {Object.entries(ICON_SIZES).map(([k, v]) => <option key={k} value={k}>{k.toUpperCase()} ({v})</option>)}</select></div>
                    <div className="flex-1"><label className="text-gray-400">Display</label><select value={el.display} onChange={e => setElements(prev => prev.map(x => x.uid === el.uid ? { ...x, display: e.target.value as DisplayMode } : x))} className="w-full p-0.5 bg-gray-700 rounded border border-gray-600">
                      <option value="icon">Icon</option><option value="name">Name</option><option value="both">Both</option></select></div>
                  </div>
                  <div><label className="text-gray-400">Rotation</label><div className="flex gap-1">{[0,45,90,135,180,270].map(r => (
                    <button key={r} onClick={() => setElements(prev => prev.map(x => x.uid === el.uid ? { ...x, rotation: r } : x))}
                      className={`px-1 py-0.5 rounded ${el.rotation === r ? 'bg-blue-600' : 'bg-gray-600'}`}>{r}°</button>
                  ))}</div></div>
                  <div><label className="text-gray-400">Label Color</label><div className="flex gap-1">
                    <input type="color" value={labelTextColor} onChange={e => setLabelTextColor(e.target.value)} className="w-6 h-6 rounded" title="Text" />
                    <input type="color" value={labelBgColor} onChange={e => setLabelBgColor(e.target.value)} className="w-6 h-6 rounded" title="Background" />
                  </div></div>
                  <div><label className="text-gray-400">Notes</label><textarea value={el.notes} onChange={e => setElements(prev => prev.map(x => x.uid === el.uid ? { ...x, notes: e.target.value } : x))} className="w-full p-0.5 bg-gray-700 rounded border border-gray-600" rows={2} /></div>
                  <div className="flex gap-1 mt-1">
                    <button onClick={bringToFront} className="flex-1 px-1 py-0.5 bg-blue-600 rounded">⬆ Front</button>
                    <button onClick={sendToBack} className="flex-1 px-1 py-0.5 bg-blue-600 rounded">⬇ Back</button>
                    <button onClick={deleteSelected} className="flex-1 px-1 py-0.5 bg-red-600 rounded">🗑️</button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ═══ CANVAS AREA ═══ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {showRuler && (
            <div className="h-5 bg-gray-700 border-b border-gray-600 relative overflow-hidden ml-5 print:hidden">
              {Array.from({ length: Math.ceil(3000 / (pxPerFt * rulerStep)) }).map((_, i) => (
                <div key={i} className="absolute top-0 h-full border-l border-gray-500 text-gray-400" style={{ left: i * pxPerFt * rulerStep * zoom, fontSize: 8 }}><span className="ml-0.5">{i * rulerStep}</span></div>
              ))}
            </div>
          )}
          <div className="flex-1 flex overflow-hidden">
            {showRuler && (
              <div className="w-5 bg-gray-700 border-r border-gray-600 relative overflow-hidden print:hidden">
                {Array.from({ length: Math.ceil(2000 / (pxPerFt * rulerStep)) }).map((_, i) => (
                  <div key={i} className="absolute left-0 w-full border-t border-gray-500" style={{ top: i * pxPerFt * rulerStep * zoom }}><span className="text-gray-400 ml-0.5" style={{ fontSize: 7 }}>{i * rulerStep}</span></div>
                ))}
              </div>
            )}
            <div className="flex-1 overflow-auto bg-gray-950" ref={scrollRef} onDrop={handleDrop} onDragOver={e => e.preventDefault()} onWheel={handleWheel}>
              <div id="print-area" ref={canvasRef} className="relative bg-white"
                style={{
                  width: bgNaturalSize ? bgNaturalSize.w : 2400, height: bgNaturalSize ? bgNaturalSize.h : 1600,
                  transform: `scale(${zoom})`, transformOrigin: 'top left',
                  marginLeft: pan.x, marginTop: pan.y,
                  cursor: tool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : tool === 'place' || tool === 'fitting' ? 'crosshair' : tool === 'pipe' ? 'crosshair' : tabOrderMode ? 'crosshair' : 'default'
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

                {/* ═══ SVG OVERLAY ═══ */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                  {/* Cables */}
                  {layers.cables && cables.map((cable, i) => (
                    <g key={cable.uid}>
                      {cable.curved && cable.points.length > 2 ? (
                        <path d={`M ${cable.points[0].x},${cable.points[0].y} ${cable.points.slice(1).map((p, j) => { const prev = cable.points[j]; const mx = (prev.x + p.x) / 2, my = (prev.y + p.y) / 2; return `Q ${prev.x},${prev.y} ${mx},${my}`; }).join(' ')} L ${cable.points[cable.points.length-1].x},${cable.points[cable.points.length-1].y}`}
                          fill="none" stroke={bwMode ? '#000' : cable.color} strokeWidth={cableThickness} strokeDasharray={CABLE_DASH[cable.type]}
                          style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                          onClick={(e) => { e.stopPropagation(); setSelectedCable(i); setSelectedMeasure(null); setSelectedElement(null); setSelectedElements([]); setSelectedLabel(null); setSelectedPipe(null); setSideTab('cables'); }} />
                      ) : (
                        <polyline points={cable.points.map(p => `${p.x},${p.y}`).join(' ')}
                          fill="none" stroke={bwMode ? '#000' : cable.color} strokeWidth={selectedCable === i ? cableThickness + 2 : cableThickness}
                          strokeDasharray={CABLE_DASH[cable.type]}
                          style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                          onClick={(e) => { e.stopPropagation(); setSelectedCable(i); setSelectedMeasure(null); setSelectedElement(null); setSelectedElements([]); setSelectedLabel(null); setSelectedPipe(null); setSideTab('cables'); }} />
                      )}
                      {showCableLengths && cable.showLength && cable.points.slice(1).map((p, j) => {
                        const prev = cable.points[j]; const mx = (prev.x + p.x) / 2, my = (prev.y + p.y) / 2;
                        return <text key={j} x={mx} y={my + (j % 2 === 0 ? -12 : 12)} fill={bwMode ? '#000' : cable.color} fontSize="10" textAnchor="middle" fontWeight="bold">{getSegmentLength(prev, p)} ft</text>;
                      })}
                    </g>
                  ))}
                  {drawingCable.length > 0 && <polyline points={drawingCable.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={bwMode ? '#000' : cableColor} strokeWidth={cableThickness} strokeDasharray="5,5" />}
                  {dragCableStart && dragCableEnd && <line x1={dragCableStart.x} y1={dragCableStart.y} x2={dragCableEnd.x} y2={dragCableEnd.y} stroke={bwMode ? '#000' : cableColor} strokeWidth={cableThickness} strokeDasharray="5,5" />}

                  {/* ═══ PIPES ═══ */}
                  {layers.pipes && pipes.map((pipe, i) => {
                    const sw = PIPE_SIZES[pipe.size];
                    return (
                      <g key={pipe.uid}>
                        {/* Outer (filled style gets thicker stroke) */}
                        {pipe.style === 'filled' && (
                          <polyline points={pipe.points.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none" stroke={bwMode ? '#000' : pipe.color} strokeWidth={sw + 4}
                            strokeLinecap="round" strokeLinejoin="round" opacity={0.3}
                            style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); setSelectedPipe(i); setSelectedCable(null); setSelectedMeasure(null); setSelectedElement(null); setSelectedElements([]); setSideTab('pipes'); }} />
                        )}
                        <polyline points={pipe.points.map(p => `${p.x},${p.y}`).join(' ')}
                          fill="none" stroke={bwMode ? '#000' : pipe.color}
                          strokeWidth={selectedPipe === i ? sw + 2 : sw}
                          strokeLinecap="round" strokeLinejoin="round"
                          style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                          onClick={(e) => { e.stopPropagation(); setSelectedPipe(i); setSelectedCable(null); setSelectedMeasure(null); setSelectedElement(null); setSelectedElements([]); setSideTab('pipes'); }} />
                        {pipe.style === 'hollow' && sw > 4 && (
                          <polyline points={pipe.points.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none" stroke="#ffffff" strokeWidth={Math.max(1, sw - 3)}
                            strokeLinecap="round" strokeLinejoin="round" />
                        )}
                        {/* Pipe lengths */}
                        {showPipeLengths && pipe.showLength && pipe.points.slice(1).map((p, j) => {
                          const prev = pipe.points[j]; const mx = (prev.x + p.x) / 2, my = (prev.y + p.y) / 2;
                          return <text key={j} x={mx} y={my + (j % 2 === 0 ? -sw - 6 : sw + 12)} fill={bwMode ? '#000' : pipe.color} fontSize="10" textAnchor="middle" fontWeight="bold">{getSegmentLength(prev, p)} ft</text>;
                        })}
                        {/* Pipe label */}
                        {pipe.points.length >= 2 && (
                          <text x={pipe.points[0].x} y={pipe.points[0].y - sw - 8} fill={bwMode ? '#000' : pipe.color} fontSize="9" fontWeight="bold">{pipe.label} ({pipe.size})</text>
                        )}
                      </g>
                    );
                  })}
                  {drawingPipe.length > 0 && <polyline points={drawingPipe.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={activePipeColor} strokeWidth={PIPE_SIZES[activePipeSize]} strokeDasharray="5,5" strokeLinecap="round" />}
                  {dragPipeStart && dragPipeEnd && (
                    <g>
                      <line x1={dragPipeStart.x} y1={dragPipeStart.y} x2={dragPipeEnd.x} y2={dragPipeEnd.y} stroke={activePipeColor} strokeWidth={PIPE_SIZES[activePipeSize]} strokeDasharray="5,5" strokeLinecap="round" />
                      <text x={(dragPipeStart.x + dragPipeEnd.x) / 2} y={(dragPipeStart.y + dragPipeEnd.y) / 2 - 15} fill={activePipeColor} fontSize="11" textAnchor="middle" fontWeight="bold">{getSegmentLength(dragPipeStart, dragPipeEnd)} ft</text>
                    </g>
                  )}

                  {/* Measures */}
                  {layers.measures && measures.map((m, i) => (
                    <g key={m.uid}>
                      <polyline points={m.points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={selectedMeasure === i ? '#fff' : m.color || '#000'} strokeWidth={2}
                        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); setSelectedMeasure(i); setSelectedCable(null); setSelectedElement(null); setSelectedElements([]); setSelectedPipe(null); setSideTab('measure'); }} />
                      {m.points.map((p, j) => <g key={j}><circle cx={p.x} cy={p.y} r={4} fill={m.color || '#000'} /><text x={p.x + 8} y={p.y - 8} fill={m.color || '#000'} fontSize="11" fontWeight="bold">{String.fromCharCode(65 + j)}</text></g>)}
                      {m.points.slice(1).map((p, j) => {
                        const mx = (m.points[j].x + p.x) / 2, my = (m.points[j].y + p.y) / 2;
                        return <text key={j} x={mx} y={my + (j % 2 === 0 ? -15 : 15)} fill={m.color || '#000'} fontSize="11" textAnchor="middle" fontWeight="bold">{String.fromCharCode(65+j)}→{String.fromCharCode(66+j)}: {getSegmentLength(m.points[j], p)} ft</text>;
                      })}
                    </g>
                  ))}
                  {drawingMeasure.length > 0 && <polyline points={drawingMeasure.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={measureColor} strokeWidth={2} strokeDasharray="5,5" />}
                  {dragMeasureStart && dragMeasureEnd && (
                    <g>
                      <line x1={dragMeasureStart.x} y1={dragMeasureStart.y} x2={dragMeasureEnd.x} y2={dragMeasureEnd.y} stroke={measureColor} strokeWidth={2} strokeDasharray="5,5" />
                      <text x={(dragMeasureStart.x + dragMeasureEnd.x) / 2} y={(dragMeasureStart.y + dragMeasureEnd.y) / 2 - 10} fill={measureColor} fontSize="12" textAnchor="middle" fontWeight="bold">{getSegmentLength(dragMeasureStart, dragMeasureEnd)} ft</text>
                    </g>
                  )}

                  {/* Shapes */}
                  {layers.shapes && shapes.map(shape => (
                    <g key={shape.id} onClick={(e) => { e.stopPropagation(); setSelectedShape(shape.id); }} style={{ pointerEvents: 'all', cursor: 'pointer' }}>
                      {shape.type === 'rect' && <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill={shape.fill ? shape.color : 'none'} stroke={shape.color} strokeWidth={selectedShape === shape.id ? 3 : 2} />}
                      {(shape.type === 'circle' || shape.type === 'oval') && <ellipse cx={shape.x + shape.width/2} cy={shape.y + shape.height/2} rx={shape.width/2} ry={shape.type === 'circle' ? shape.width/2 : shape.height/2} fill={shape.fill ? shape.color : 'none'} stroke={shape.color} strokeWidth={selectedShape === shape.id ? 3 : 2} />}
                      {shape.type === 'triangle' && <polygon points={`${shape.x+shape.width/2},${shape.y} ${shape.x},${shape.y+shape.height} ${shape.x+shape.width},${shape.y+shape.height}`} fill={shape.fill ? shape.color : 'none'} stroke={shape.color} strokeWidth={selectedShape === shape.id ? 3 : 2} />}
                      {shape.type === 'line' && shape.points && <line x1={shape.points[0].x} y1={shape.points[0].y} x2={shape.points[1].x} y2={shape.points[1].y} stroke={shape.color} strokeWidth={selectedShape === shape.id ? 3 : 2} />}
                    </g>
                  ))}
                  {drawingShape && activeShapeType && (
                    <g>
                      {activeShapeType === 'rect' && <rect x={Math.min(drawingShape.startX,drawingShape.currentX)} y={Math.min(drawingShape.startY,drawingShape.currentY)} width={Math.abs(drawingShape.currentX-drawingShape.startX)} height={Math.abs(drawingShape.currentY-drawingShape.startY)} fill={shapeFill?shapeColor:'none'} stroke={shapeColor} strokeWidth={2} strokeDasharray="5,5" />}
                      {(activeShapeType === 'circle' || activeShapeType === 'oval') && <ellipse cx={(drawingShape.startX+drawingShape.currentX)/2} cy={(drawingShape.startY+drawingShape.currentY)/2} rx={Math.abs(drawingShape.currentX-drawingShape.startX)/2} ry={activeShapeType==='circle'?Math.abs(drawingShape.currentX-drawingShape.startX)/2:Math.abs(drawingShape.currentY-drawingShape.startY)/2} fill={shapeFill?shapeColor:'none'} stroke={shapeColor} strokeWidth={2} strokeDasharray="5,5" />}
                      {activeShapeType === 'line' && <line x1={drawingShape.startX} y1={drawingShape.startY} x2={drawingShape.currentX} y2={drawingShape.currentY} stroke={shapeColor} strokeWidth={2} strokeDasharray="5,5" />}
                    </g>
                  )}

                  {/* Leader lines */}
                  {sortedElements.map(el => {
                    if (el.display !== 'both') return null;
                    const def = getElementDef(el.defId);
                    if (!def || !layers[def.category as keyof typeof layers]) return null;
                    const dist = Math.sqrt(el.labelOffsetX * el.labelOffsetX + el.labelOffsetY * el.labelOffsetY);
                    if (dist < 25) return null;
                    const color = getIconColor(def.id, def.category);
                    return <g key={`leader-${el.uid}`}><line x1={el.x} y1={el.y} x2={el.x + el.labelOffsetX} y2={el.y + el.labelOffsetY} stroke={color} strokeWidth={1.5} strokeDasharray="4,3" opacity={0.7} /><circle cx={el.x} cy={el.y} r={3} fill={color} opacity={0.5} /></g>;
                  })}
                </svg>

                {/* ═══ FITTINGS (HTML overlay) ═══ */}
                {layers.pipes && fittings.map(fit => (
                  <div key={fit.uid} className={`absolute ${selectedFitting === fit.uid ? 'ring-2 ring-white ring-offset-1' : ''}`}
                    style={{ left: fit.x, top: fit.y, transform: `translate(-50%, -50%) rotate(${fit.rotation}deg)`, zIndex: 50, cursor: tool === 'select' ? 'pointer' : 'default' }}
                    onClick={(e) => { e.stopPropagation(); setSelectedFitting(fit.uid); setSelectedElement(null); setSelectedElements([]); setSelectedPipe(null); setSideTab('pipes'); }}>
                    <svg width={28} height={28} viewBox="0 0 28 28">
                      {renderFittingSVG(fit.type, fit.size, fit.style, bwMode ? '#000' : fit.color, 28)}
                    </svg>
                  </div>
                ))}

                {/* ═══ ELEMENT ICONS ═══ */}
                {sortedElements.map(el => {
                  const def = getElementDef(el.defId);
                  if (!def || !layers[def.category as keyof typeof layers]) return null;
                  if (el.display === 'name') return null;
                  const isSelected = selectedElement === el.uid || selectedElements.includes(el.uid);
                  const iconSize = ICON_SIZES[el.size] || 48;
                  const color = getIconColor(def.id, def.category);
                  return (
                    <div key={`icon-${el.uid}`}
                      className={`absolute ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-white' : ''}`}
                      style={{ left: el.x, top: el.y, transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`, zIndex: (el.zIndex || 0) + 1, cursor: tool === 'select' ? 'move' : 'default' }}>
                      <SchematicIcon defId={def.id} category={def.category} size={iconSize} customColor={color} />
                    </div>
                  );
                })}

                {/* ═══ ELEMENT LABELS ═══ */}
                {sortedElements.map(el => {
                  const def = getElementDef(el.defId);
                  if (!def || !layers[def.category as keyof typeof layers]) return null;
                  if (el.display === 'icon') return null;
                  const color = getIconColor(def.id, def.category);
                  return (
                    <div key={`label-${el.uid}`} className="absolute cursor-move"
                      style={{ left: el.x + el.labelOffsetX, top: el.y + el.labelOffsetY, transform: 'translate(-50%, -50%)', zIndex: (el.zIndex || 0) + 2 }}
                      onMouseDown={e => {
                        if (tool !== 'select') return;
                        e.stopPropagation(); e.preventDefault();
                        const startMX = e.clientX, startMY = e.clientY;
                        const origOX = el.labelOffsetX, origOY = el.labelOffsetY;
                        const onMove = (me: MouseEvent) => { const dx = (me.clientX - startMX) / zoom, dy = (me.clientY - startMY) / zoom; setElements(prev => prev.map(x => x.uid === el.uid ? { ...x, labelOffsetX: origOX + dx, labelOffsetY: origOY + dy } : x)); };
                        const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); pushHistory(); };
                        document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
                      }}>
                      <div className="px-2 py-0.5 rounded whitespace-nowrap font-semibold"
                        style={{ fontSize: placementLabelSize, backgroundColor: bwMode ? '#fff' : labelBgColor, color: bwMode ? '#000' : labelTextColor, border: `1.5px solid ${bwMode ? '#000' : color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                        {el.label}
                      </div>
                    </div>
                  );
                })}

                {/* ═══ PLACED LABELS ═══ */}
                {layers.labels && labels.map(lbl => (
                  <div key={lbl.uid}
                    className={`absolute rounded font-semibold ${selectedLabel === lbl.uid ? 'ring-2 ring-white ring-offset-1' : ''}`}
                    style={{ left: lbl.x, top: lbl.y, transform: 'translate(-50%, -50%)', backgroundColor: bwMode ? '#fff' : lbl.color, color: bwMode ? '#000' : '#fff', border: bwMode ? '2px solid #000' : 'none', fontSize: lbl.size, padding: '4px 12px', cursor: tool === 'select' ? 'move' : 'default', zIndex: 100, userSelect: 'none', minWidth: '50px', textAlign: 'center' }}
                    onMouseDown={e => {
                      e.stopPropagation(); e.preventDefault();
                      if (tool !== 'select') return;
                      setSelectedLabel(lbl.uid); setSideTab('labels');
                      const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
                      setLabelDragState({ uid: lbl.uid, startX: (e.clientX - rect.left) / zoom, startY: (e.clientY - rect.top) / zoom, origX: lbl.x, origY: lbl.y });
                    }}>
                    {lbl.prefix}-{lbl.number.toString().padStart(3, '0')}
                  </div>
                ))}

                {showLegend && fe('legend') && (
                  <div className="absolute bg-white border-2 border-gray-800 rounded-lg shadow-lg" style={{ right: 20, top: 20, minWidth: 200 }}>
                    <div className="bg-gray-800 text-white px-3 py-1.5 font-bold text-sm rounded-t-lg">📖 Legend</div>
                    <div className="p-2">
                      {CATEGORIES.filter(cat => elements.some(e => getElementDef(e.defId)?.category === cat)).map(cat => (
                        <div key={cat} className="mb-2">
                          <div className="text-xs font-bold mb-1" style={{ color: categoryColors[cat] }}>{CATEGORY_LABELS[cat]}</div>
                          {[...new Set(elements.filter(e => getElementDef(e.defId)?.category === cat).map(e => e.defId))].map(defId => {
                            const def = getElementDef(defId)!; const count = elements.filter(e => e.defId === defId).length;
                            return <div key={defId} className="flex items-center gap-2 py-0.5"><SchematicIcon defId={defId} category={cat} size={20} customColor={getIconColor(defId, cat)} /><span className="text-xs text-gray-700">{customElementNames[defId] || def.shortName} - {def.name}</span><span className="text-xs text-gray-400 ml-auto">×{count}</span></div>;
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

      {/* ═══ SHORTCUT BAR ═══ */}
      <div className="bg-gray-800 border-t border-gray-700 px-3 py-1.5 flex items-center gap-3 flex-wrap print:hidden">
        {[
          { key: 'V', label: 'Select', color: 'bg-blue-600' }, { key: 'H', label: 'Pan', color: 'bg-green-600' },
          { key: 'W', label: 'Place', color: 'bg-orange-600' }, { key: 'P', label: 'Pipe', color: 'bg-rose-600' },
          { key: 'M', label: 'Measure', color: 'bg-yellow-600' }, { key: 'L', label: 'Label', color: 'bg-purple-600' },
          { key: 'Del', label: 'Delete', color: 'bg-red-600' }, { key: 'Esc', label: 'Cancel', color: 'bg-gray-600' },
        ].map(s => (
          <div key={s.key} className="flex items-center gap-1">
            <kbd className={`${s.color} text-white px-1.5 py-0.5 rounded text-xs font-bold min-w-[28px] text-center shadow`}>{s.key}</kbd>
            <span className="text-gray-400 text-xs">{s.label}</span>
          </div>
        ))}
        <div className="flex-1" />
        <span className="text-gray-500 text-xs">Ctrl+O Open | Ctrl+S Save | Ctrl+Z Undo | Ctrl+Y Redo</span>
      </div>

      {/* ═══ MODALS ═══ */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md border border-gray-600">
            <h3 className="text-lg font-bold mb-3">⚠️ Reset Project?</h3>
            <p className="text-gray-300 text-sm mb-4">This will delete all elements, cables, pipes, labels, measures, and shapes.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 bg-gray-600 rounded">Cancel</button>
              <button onClick={handleReset} className="px-4 py-2 bg-red-600 rounded">🗑️ Reset</button>
            </div>
          </div>
        </div>
      )}

      {showInfoBox && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInfoBox(false)}>
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-lg w-full border border-gray-600" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-600"><span className="font-bold">📊 Project Summary</span><button onClick={() => setShowInfoBox(false)} className="text-xl text-gray-400 hover:text-white">×</button></div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <h3 className="font-medium mb-2 text-blue-400">📍 Elements ({elements.length})</h3>
              {CATEGORIES.map(cat => {
                const catEls = elements.filter(e => getElementDef(e.defId)?.category === cat);
                if (catEls.length === 0) return null;
                const grouped: Record<string, number> = {};
                catEls.forEach(e => { grouped[e.defId] = (grouped[e.defId] || 0) + 1; });
                return (
                  <div key={cat} className="mb-3">
                    <div className="text-xs font-bold mb-1" style={{ color: categoryColors[cat] }}>{CATEGORY_LABELS[cat]} ({catEls.length})</div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(grouped).map(([defId, count]) => {
                        const def = getElementDef(defId);
                        return (
                          <div key={defId} className="flex items-center gap-1.5 px-2 py-1 bg-gray-700 rounded">
                            <SchematicIcon defId={defId} category={cat} size={18} customColor={getIconColor(defId, cat)} />
                            <span className="text-xs">{customElementNames[defId] || def?.shortName || defId}</span>
                            <span className="text-xs font-bold text-yellow-400">×{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <h3 className="font-medium mb-2 text-green-400 mt-4">🔌 Cables ({cables.length})</h3>
              <div className="flex flex-wrap gap-2 mb-4">{Object.entries(getInfoBoxData().cableLengths).map(([t, l]) => <span key={t} className="px-2 py-1 bg-gray-700 rounded text-sm">{t}: {l.toFixed(1)} ft</span>)}</div>
              <h3 className="font-medium mb-2 text-rose-400">🚿 Pipes: {pipes.length} ({pipes.reduce((s, p) => s + parseFloat(getCableLength(p.points)), 0).toFixed(1)} ft) | Fittings: {fittings.length}</h3>
              <h3 className="font-medium mb-2 text-purple-400">🏷️ Labels: {labels.length} | ⬜ Shapes: {shapes.length} | 📏 Measures: {measures.length}</h3>
            </div>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowHelp(false)}>
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto border border-gray-600" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-600 sticky top-0 bg-gray-800"><span className="font-bold">❓ Help</span><button onClick={() => setShowHelp(false)} className="text-xl">×</button></div>
            <div className="p-4 text-sm">
              <table className="w-full"><thead><tr className="text-left border-b border-gray-600"><th className="py-1 px-2">Key</th><th className="py-1 px-2">Action</th></tr></thead>
                <tbody>{[['V','Select'],['H','Pan'],['W','Place'],['P','Pipe'],['M','Measure'],['L','Label'],['Space','Hold Pan'],['Del','Delete'],['Esc','Cancel'],['Enter','Finish cable/measure/pipe'],['Ctrl+Z','Undo'],['Ctrl+Y','Redo'],['Ctrl+S','Save']].map(([k,a]) => (
                  <tr key={k} className="border-b border-gray-700"><td className="py-1 px-2"><kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">{k}</kbd></td><td className="py-1 px-2">{a}</td></tr>
                ))}</tbody></table>
            </div>
          </div>
        </div>
      )}

      {showAdminPanel && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAdminPanel(false)}>
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-600" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-600"><span className="font-bold">⚙️ Admin</span><button onClick={() => setShowAdminPanel(false)} className="text-xl">×</button></div>
            <div className="p-4 space-y-2">
              {FEATURES.map(f => (
                <label key={f.key} className="flex items-center gap-3 p-2 bg-gray-700 rounded">
                  <input type="checkbox" checked={enabledFeatures[f.key] !== false} onChange={e => setEnabledFeatures(prev => ({ ...prev, [f.key]: e.target.checked }))} />
                  <div><div className="text-sm font-medium">{f.label}</div><div className="text-xs text-gray-400">{f.description}</div></div>
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
