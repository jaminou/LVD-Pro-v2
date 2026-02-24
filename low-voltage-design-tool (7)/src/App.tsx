import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ELEMENTS } from './data';
import { 
  PlacedElement, Cable, PlacedLabel, MeasureLine, Drawing, TextAnnotation, Stamp, Group,
  Category, CATEGORY_COLORS, CATEGORY_LABELS, CableType, CABLE_COLORS, CABLE_LABELS, CABLE_DASH,
  LabelPreset, DEFAULT_LABEL_PRESETS, SCALE_PRESETS, ICON_SIZES, IconSize, DisplayMode
} from './types';
import { SchematicIcon } from './SchematicIcon';

// Shape type for drawing shapes
interface Shape {
  id: string;
  type: 'rect' | 'circle' | 'oval' | 'triangle' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  fill: boolean;
  points?: { x: number; y: number }[];
}

const CATEGORIES: Category[] = ['alarm', 'fire', 'cctv', 'sound', 'automation', 'tv', 'data'];

export const App: React.FC = () => {
  // File state
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  // Element state
  const [elements, setElements] = useState<PlacedElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [activeCat, setActiveCat] = useState<Category>('alarm');
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [elementCounters, setElementCounters] = useState<Record<string, number>>({});
  const [iconColors, setIconColors] = useState<Record<string, string>>({});
  
  // Cable state
  const [cables, setCables] = useState<Cable[]>([]);
  const [selectedCable, setSelectedCable] = useState<number | null>(null);
  const [activeCableType, setActiveCableType] = useState<CableType>('alarm');
  const [cableColor, setCableColor] = useState(CABLE_COLORS.alarm);
  const [drawingCable, setDrawingCable] = useState<{ x: number; y: number }[]>([]);
  const [curvedCables, setCurvedCables] = useState(false);
  
  // Label state
  const [labels, setLabels] = useState<PlacedLabel[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [activeLabelType, setActiveLabelType] = useState('zone');
  const [labelCounters, setLabelCounters] = useState<Record<string, number>>({});
  const [labelPresets] = useState<LabelPreset[]>(DEFAULT_LABEL_PRESETS);
  
  // Measure state
  const [measures, setMeasures] = useState<MeasureLine[]>([]);
  const [selectedMeasure, setSelectedMeasure] = useState<number | null>(null);
  const [drawingMeasure, setDrawingMeasure] = useState<{ x: number; y: number }[]>([]);
  const [scale, setScale] = useState(SCALE_PRESETS[2]); // 1/4" = 1'-0"
  
  // Drawing state
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [texts, setTexts] = useState<TextAnnotation[]>([]);
  const [drawColor, setDrawColor] = useState('#ff0000');
  const [drawSize, setDrawSize] = useState(3);
  
  // Shape state - NEW FEATURE
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [activeShapeType, setActiveShapeType] = useState<'rect' | 'circle' | 'oval' | 'triangle' | 'line' | null>(null);
  const [shapeColor, setShapeColor] = useState('#000000');
  const [shapeFill, setShapeFill] = useState(false);
  const [drawingShape, setDrawingShape] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [shiftKeyPressed, setShiftKeyPressed] = useState(false);
  
  // Stamp state
  const [stamp, setStamp] = useState<Stamp | null>(null);
  
  // Groups state
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Info box state
  const [showInfoBox, setShowInfoBox] = useState(false);
  const [infoBoxOnPlan, setInfoBoxOnPlan] = useState(false);
  const [infoBoxPos, setInfoBoxPos] = useState({ x: 50, y: 50 });
  
  // UI state
  const [tool, setTool] = useState<'select' | 'place' | 'cable' | 'label' | 'measure' | 'draw' | 'shape' | 'text' | 'pan'>('select');
  const [drawTool, setDrawTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [sideTab, setSideTab] = useState<'elements' | 'cables' | 'labels' | 'layers' | 'measure' | 'draw' | 'save'>('elements');
  const [layers, setLayers] = useState({
    alarm: true, fire: true, cctv: true, sound: true,
    automation: true, tv: true, data: true,
    cables: true, drawings: true, texts: true, measures: true,
    labels: true, stamp: true, shapes: true, infoBox: true
  });
  
  // History for undo/redo
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: any[] } | null>(null);
  
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Get current state for history
  const getState = useCallback(() => ({
    elements: [...elements],
    cables: [...cables],
    labels: [...labels],
    measures: [...measures],
    drawings: [...drawings],
    texts: [...texts],
    shapes: [...shapes],
    stamp,
    groups: [...groups]
  }), [elements, cables, labels, measures, drawings, texts, shapes, stamp, groups]);
  
  // Push to history
  const pushHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(getState());
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, getState]);
  
  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setElements(prevState.elements);
      setCables(prevState.cables);
      setLabels(prevState.labels);
      setMeasures(prevState.measures);
      setDrawings(prevState.drawings);
      setTexts(prevState.texts);
      setShapes(prevState.shapes);
      setStamp(prevState.stamp);
      setGroups(prevState.groups);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);
  
  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setElements(nextState.elements);
      setCables(nextState.cables);
      setLabels(nextState.labels);
      setMeasures(nextState.measures);
      setDrawings(nextState.drawings);
      setTexts(nextState.texts);
      setShapes(nextState.shapes);
      setStamp(nextState.stamp);
      setGroups(nextState.groups);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);
  
  // Track shift key for straight lines
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftKeyPressed(true);
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      }
      if (e.key === 'Escape') {
        setDrawingCable([]);
        setDrawingMeasure([]);
        setDrawingShape(null);
        setSelectedElement(null);
        setSelectedElements([]);
        setSelectedShape(null);
        setContextMenu(null);
      }
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftKeyPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedElement, selectedElements, selectedShape, selectedCable, selectedMeasure, selectedLabel, undo, redo]);
  
  // Delete selected items
  const deleteSelected = () => {
    let changed = false;
    if (selectedElements.length > 0) {
      setElements(prev => prev.filter(el => !selectedElements.includes(el.uid)));
      setSelectedElements([]);
      changed = true;
    } else if (selectedElement) {
      setElements(prev => prev.filter(el => el.uid !== selectedElement));
      setSelectedElement(null);
      changed = true;
    }
    if (selectedShape) {
      setShapes(prev => prev.filter(s => s.id !== selectedShape));
      setSelectedShape(null);
      changed = true;
    }
    if (selectedCable !== null) {
      setCables(prev => prev.filter((_, i) => i !== selectedCable));
      setSelectedCable(null);
      changed = true;
    }
    if (selectedMeasure !== null) {
      setMeasures(prev => prev.filter((_, i) => i !== selectedMeasure));
      setSelectedMeasure(null);
      changed = true;
    }
    if (selectedLabel) {
      setLabels(prev => prev.filter(l => l.uid !== selectedLabel));
      setSelectedLabel(null);
      changed = true;
    }
    if (changed) pushHistory();
  };
  
  // Convert screen coords to canvas coords
  const toCanvasCoords = (e: React.MouseEvent): { x: number; y: number } => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const scrollLeft = scrollRef.current?.scrollLeft || 0;
    const scrollTop = scrollRef.current?.scrollTop || 0;
    return {
      x: (e.clientX - rect.left + scrollLeft - pan.x) / zoom,
      y: (e.clientY - rect.top + scrollTop - pan.y) / zoom
    };
  };
  
  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const typedArray = new Uint8Array(event.target?.result as ArrayBuffer);
        const pdfjsLib = (window as any).pdfjsLib;
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;
          setBgImage(canvas.toDataURL('image/png'));
          setProjectName(file.name.replace('.pdf', ''));
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBgImage(event.target?.result as string);
        setProjectName(file.name.replace(/\.[^/.]+$/, ''));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // FEATURE 1: Auto-swap numbers when manually changed
  const handleElementNumberChange = (elementId: string, newNumber: string) => {
    const element = elements.find(e => e.uid === elementId);
    if (!element) return;
    
    const newNum = parseInt(newNumber) || element.number;
    
    // Check if another element of same type has this number
    const elementDef = ELEMENTS.find(ed => ed.id === element.defId);
    if (!elementDef) return;
    
    const existingElement = elements.find(e => 
      e.uid !== elementId && 
      e.defId === element.defId && 
      e.number === newNum
    );
    
    if (existingElement) {
      // Swap the numbers
      const oldNum = element.number;
      setElements(prev => prev.map(e => {
        if (e.uid === elementId) {
          return { ...e, number: newNum, label: `${elementDef.shortName || elementDef.name}-${newNum.toString().padStart(3, '0')}` };
        }
        if (e.uid === existingElement.uid) {
          return { ...e, number: oldNum, label: `${elementDef.shortName || elementDef.name}-${oldNum.toString().padStart(3, '0')}` };
        }
        return e;
      }));
    } else {
      // Just update the number
      setElements(prev => prev.map(e => 
        e.uid === elementId 
          ? { ...e, number: newNum, label: `${elementDef.shortName || elementDef.name}-${newNum.toString().padStart(3, '0')}` }
          : e
      ));
    }
    pushHistory();
  };
  
  // FEATURE 2: Alignment functions
  const alignElements = (alignment: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV' | 'distributeH' | 'distributeV') => {
    if (selectedElements.length < 2) return;
    
    const selected = elements.filter(e => selectedElements.includes(e.uid));
    const updates: Record<string, { x?: number; y?: number }> = {};
    
    switch (alignment) {
      case 'left': {
        const minX = Math.min(...selected.map(e => e.x));
        selected.forEach(e => { updates[e.uid] = { x: minX }; });
        break;
      }
      case 'right': {
        const maxX = Math.max(...selected.map(e => e.x));
        selected.forEach(e => { updates[e.uid] = { x: maxX }; });
        break;
      }
      case 'top': {
        const minY = Math.min(...selected.map(e => e.y));
        selected.forEach(e => { updates[e.uid] = { y: minY }; });
        break;
      }
      case 'bottom': {
        const maxY = Math.max(...selected.map(e => e.y));
        selected.forEach(e => { updates[e.uid] = { y: maxY }; });
        break;
      }
      case 'centerH': {
        const avgX = selected.reduce((sum, e) => sum + e.x, 0) / selected.length;
        selected.forEach(e => { updates[e.uid] = { x: avgX }; });
        break;
      }
      case 'centerV': {
        const avgY = selected.reduce((sum, e) => sum + e.y, 0) / selected.length;
        selected.forEach(e => { updates[e.uid] = { y: avgY }; });
        break;
      }
      case 'distributeH': {
        const sorted = [...selected].sort((a, b) => a.x - b.x);
        const minX = sorted[0].x;
        const maxX = sorted[sorted.length - 1].x;
        const step = (maxX - minX) / (sorted.length - 1);
        sorted.forEach((e, i) => { updates[e.uid] = { x: minX + step * i }; });
        break;
      }
      case 'distributeV': {
        const sorted = [...selected].sort((a, b) => a.y - b.y);
        const minY = sorted[0].y;
        const maxY = sorted[sorted.length - 1].y;
        const step = (maxY - minY) / (sorted.length - 1);
        sorted.forEach((e, i) => { updates[e.uid] = { y: minY + step * i }; });
        break;
      }
    }
    
    setElements(prev => prev.map(e => 
      updates[e.uid] ? { ...e, ...updates[e.uid] } : e
    ));
    pushHistory();
  };
  
  // Canvas click handler
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const coords = toCanvasCoords(e);
    setContextMenu(null);
    
    if (tool === 'place' && activeElement) {
      const elementDef = ELEMENTS.find(el => el.id === activeElement);
      if (!elementDef) return;
      
      const count = (elementCounters[elementDef.id] || 0) + 1;
      setElementCounters(prev => ({ ...prev, [elementDef.id]: count }));
      
      const newElement: PlacedElement = {
        uid: `el-${Date.now()}`,
        defId: elementDef.id,
        x: coords.x,
        y: coords.y,
        rotation: 0,
        label: `${elementDef.shortName || elementDef.name}-${count.toString().padStart(3, '0')}`,
        labelOffsetX: 0,
        labelOffsetY: 30,
        notes: '',
        size: 'm',
        display: 'both',
        number: count
      };
      
      setElements(prev => [...prev, newElement]);
      pushHistory();
    } else if (tool === 'cable') {
      setDrawingCable(prev => [...prev, coords]);
    } else if (tool === 'measure') {
      setDrawingMeasure(prev => [...prev, coords]);
    } else if (tool === 'label') {
      const preset = labelPresets.find(p => p.type === activeLabelType);
      if (!preset) return;
      
      const count = (labelCounters[activeLabelType] || 0) + preset.increment;
      setLabelCounters(prev => ({ ...prev, [activeLabelType]: count }));
      
      const newLabel: PlacedLabel = {
        uid: `lbl-${Date.now()}`,
        type: preset.type,
        prefix: preset.prefix,
        number: count,
        x: coords.x,
        y: coords.y,
        color: preset.color,
        size: 14
      };
      
      setLabels(prev => [...prev, newLabel]);
      pushHistory();
    } else if (tool === 'select') {
      const clickedEl = elements.find(el => {
        const dx = Math.abs(el.x - coords.x);
        const dy = Math.abs(el.y - coords.y);
        return dx < 25 && dy < 25;
      });
      
      if (clickedEl) {
        if (e.shiftKey) {
          setSelectedElements(prev => 
            prev.includes(clickedEl.uid) 
              ? prev.filter(id => id !== clickedEl.uid)
              : [...prev, clickedEl.uid]
          );
        } else {
          setSelectedElement(clickedEl.uid);
          setSelectedElements([clickedEl.uid]);
        }
      } else {
        const clickedShape = shapes.find(s => {
          if (s.type === 'circle' || s.type === 'oval') {
            const rx = s.width / 2;
            const ry = s.height / 2;
            const cx = s.x + rx;
            const cy = s.y + ry;
            return Math.pow((coords.x - cx) / rx, 2) + Math.pow((coords.y - cy) / ry, 2) <= 1;
          }
          return coords.x >= s.x && coords.x <= s.x + s.width &&
                 coords.y >= s.y && coords.y <= s.y + s.height;
        });
        
        if (clickedShape) {
          setSelectedShape(clickedShape.id);
          setSelectedElement(null);
          setSelectedElements([]);
        } else {
          setSelectedElement(null);
          setSelectedElements([]);
          setSelectedShape(null);
        }
      }
    }
  };
  
  // FEATURE 3: Shape drawing
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (tool === 'shape' && activeShapeType) {
      const coords = toCanvasCoords(e);
      setDrawingShape({ startX: coords.x, startY: coords.y, currentX: coords.x, currentY: coords.y });
    }
  };
  
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (drawingShape && tool === 'shape') {
      const coords = toCanvasCoords(e);
      let newX = coords.x;
      let newY = coords.y;
      
      // Shift key constraint for straight lines
      if (shiftKeyPressed && activeShapeType === 'line') {
        const dx = coords.x - drawingShape.startX;
        const dy = coords.y - drawingShape.startY;
        if (Math.abs(dx) > Math.abs(dy)) {
          newY = drawingShape.startY;
        } else {
          newX = drawingShape.startX;
        }
      }
      
      // Shift key for square/circle
      if (shiftKeyPressed && (activeShapeType === 'rect' || activeShapeType === 'circle')) {
        const size = Math.max(Math.abs(newX - drawingShape.startX), Math.abs(newY - drawingShape.startY));
        newX = drawingShape.startX + (newX > drawingShape.startX ? size : -size);
        newY = drawingShape.startY + (newY > drawingShape.startY ? size : -size);
      }
      
      setDrawingShape(prev => prev ? { ...prev, currentX: newX, currentY: newY } : null);
    }
  };
  
  const handleCanvasMouseUp = () => {
    if (drawingShape && tool === 'shape' && activeShapeType) {
      const { startX, startY, currentX, currentY } = drawingShape;
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      
      if (width > 5 || height > 5) {
        const newShape: Shape = {
          id: `shape-${Date.now()}`,
          type: activeShapeType,
          x,
          y,
          width,
          height,
          color: shapeColor,
          fill: shapeFill,
          points: activeShapeType === 'line' ? [{ x: startX, y: startY }, { x: currentX, y: currentY }] : undefined
        };
        setShapes(prev => [...prev, newShape]);
        pushHistory();
      }
      setDrawingShape(null);
    }
  };
  
  // Double-click to finish cable/measure
  const handleCanvasDoubleClick = () => {
    if (tool === 'cable' && drawingCable.length >= 2) {
      const newCable: Cable = {
        uid: `cable-${Date.now()}`,
        type: activeCableType,
        points: drawingCable,
        color: cableColor,
        curved: curvedCables,
        showLength: true
      };
      setCables(prev => [...prev, newCable]);
      setDrawingCable([]);
      pushHistory();
    } else if (tool === 'measure' && drawingMeasure.length >= 2) {
      const newMeasure: MeasureLine = {
        uid: `measure-${Date.now()}`,
        points: drawingMeasure,
        color: '#ffcc00'
      };
      setMeasures(prev => [...prev, newMeasure]);
      setDrawingMeasure([]);
      pushHistory();
    }
  };
  
  // Context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const coords = toCanvasCoords(e);
    
    const clickedEl = elements.find(el => {
      const dx = Math.abs(el.x - coords.x);
      const dy = Math.abs(el.y - coords.y);
      return dx < 25 && dy < 25;
    });
    
    const items: any[] = [];
    
    if (clickedEl || selectedElements.length > 0) {
      items.push(
        { label: '🔄 Rotate 45°', action: () => rotateSelected(45) },
        { label: '🔄 Rotate 90°', action: () => rotateSelected(90) },
        { label: '📋 Duplicate', action: duplicateSelected },
        { label: '🗑️ Delete', action: deleteSelected }
      );
      if (selectedElements.length >= 2) {
        items.push(
          { divider: true },
          { label: '⬅️ Align Left', action: () => alignElements('left') },
          { label: '➡️ Align Right', action: () => alignElements('right') },
          { label: '⬆️ Align Top', action: () => alignElements('top') },
          { label: '⬇️ Align Bottom', action: () => alignElements('bottom') }
        );
      }
    } else {
      items.push(
        { label: '🔍 Fit to View', action: fitToView },
        { label: '📊 Toggle Info Box', action: () => setShowInfoBox(!showInfoBox) }
      );
    }
    
    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };
  
  const rotateSelected = (angle: number) => {
    setElements(prev => prev.map(el => 
      selectedElements.includes(el.uid) || el.uid === selectedElement
        ? { ...el, rotation: (el.rotation + angle) % 360 }
        : el
    ));
    pushHistory();
    setContextMenu(null);
  };
  
  const duplicateSelected = () => {
    const toDuplicate = elements.filter(el => 
      selectedElements.includes(el.uid) || el.uid === selectedElement
    );
    const newElements = toDuplicate.map(el => ({
      ...el,
      uid: `el-${Date.now()}-${Math.random()}`,
      x: el.x + 30,
      y: el.y + 30
    }));
    setElements(prev => [...prev, ...newElements]);
    pushHistory();
    setContextMenu(null);
  };
  
  const fitToView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  
  // Export function
  const exportAs = async (format: 'png' | 'jpg' | 'pdf') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const html2canvas = (await import('html2canvas')).default;
    const canvasImage = await html2canvas(canvas, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true
    });
    
    if (format === 'pdf') {
      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF({
        orientation: canvasImage.width > canvasImage.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvasImage.width, canvasImage.height]
      });
      pdf.addImage(canvasImage.toDataURL('image/png'), 'PNG', 0, 0, canvasImage.width, canvasImage.height);
      pdf.save(`${projectName}.pdf`);
    } else {
      const link = document.createElement('a');
      link.download = `${projectName}.${format}`;
      link.href = canvasImage.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`);
      link.click();
    }
  };
  
  // Calculate cable length
  const getCableLength = (points: { x: number; y: number }[]) => {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return (length / scale.ratio).toFixed(1);
  };
  
  // Reset handler
  const handleReset = () => {
    setElements([]);
    setCables([]);
    setLabels([]);
    setMeasures([]);
    setDrawings([]);
    setTexts([]);
    setShapes([]);
    setStamp(null);
    setGroups([]);
    setSelectedElement(null);
    setSelectedElements([]);
    setSelectedShape(null);
    setElementCounters({});
    setLabelCounters({});
    pushHistory();
  };
  
  // Info box data
  const getInfoBoxData = () => {
    const elementCounts: Record<string, number> = {};
    elements.forEach(el => {
      const def = ELEMENTS.find(d => d.id === el.defId);
      const key = def?.shortName || def?.name || el.defId;
      elementCounts[key] = (elementCounts[key] || 0) + 1;
    });
    
    const cableLengths: Record<string, number> = {};
    cables.forEach(cable => {
      const length = parseFloat(getCableLength(cable.points));
      const label = CABLE_LABELS[cable.type];
      cableLengths[label] = (cableLengths[label] || 0) + length;
    });
    
    return { elementCounts, cableLengths };
  };

  // Get element definition by defId
  const getElementDef = (defId: string) => ELEMENTS.find(e => e.id === defId);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center gap-2 flex-wrap">
        <div className="font-bold text-lg text-blue-400">LV Designer PRO v2.0</div>
        <div className="h-6 w-px bg-gray-600 mx-2" />
        
        <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700">📂 Open</button>
        <button onClick={handleReset} className="px-3 py-1 bg-yellow-600 rounded hover:bg-yellow-700">🔄 Reset</button>
        <button onClick={() => exportAs('png')} className="px-3 py-1 bg-green-600 rounded hover:bg-green-700">💾 Export</button>
        
        <div className="h-6 w-px bg-gray-600 mx-2" />
        
        <button onClick={() => setTool('select')} className={`px-3 py-1 rounded ${tool === 'select' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>👆 Select</button>
        <button onClick={() => setTool('place')} className={`px-3 py-1 rounded ${tool === 'place' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>📍 Place</button>
        <button onClick={() => setTool('cable')} className={`px-3 py-1 rounded ${tool === 'cable' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>🔌 Cable</button>
        <button onClick={() => setTool('label')} className={`px-3 py-1 rounded ${tool === 'label' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>🏷️ Label</button>
        <button onClick={() => setTool('measure')} className={`px-3 py-1 rounded ${tool === 'measure' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>📏 Measure</button>
        <button onClick={() => { setTool('shape'); setSideTab('draw'); }} className={`px-3 py-1 rounded ${tool === 'shape' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>⬜ Shape</button>
        
        <div className="h-6 w-px bg-gray-600 mx-2" />
        
        <button onClick={undo} className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600" title="Undo (Ctrl+Z)">↩️</button>
        <button onClick={redo} className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600" title="Redo (Ctrl+Y)">↪️</button>
        <button onClick={deleteSelected} className="px-3 py-1 bg-red-600 rounded hover:bg-red-700" title="Delete">🗑️ Delete</button>
        
        <div className="h-6 w-px bg-gray-600 mx-2" />
        
        <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="px-2 py-1 bg-gray-700 rounded">➖</button>
        <span className="px-2">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="px-2 py-1 bg-gray-700 rounded">➕</button>
        <button onClick={fitToView} className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600">Fit</button>
        
        <div className="h-6 w-px bg-gray-600 mx-2" />
        
        <button onClick={() => setShowInfoBox(!showInfoBox)} className={`px-3 py-1 rounded ${showInfoBox ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>📊 Info</button>
        <button onClick={() => setInfoBoxOnPlan(!infoBoxOnPlan)} className={`px-3 py-1 rounded ${infoBoxOnPlan ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}>📍 Info on Plan</button>
        
        {/* FEATURE 2: Alignment toolbar */}
        {selectedElements.length >= 2 && (
          <>
            <div className="h-6 w-px bg-gray-600 mx-2" />
            <span className="text-sm text-gray-400">Align:</span>
            <button onClick={() => alignElements('left')} className="px-2 py-1 bg-purple-600 rounded hover:bg-purple-700" title="Align Left">⬅️</button>
            <button onClick={() => alignElements('centerH')} className="px-2 py-1 bg-purple-600 rounded hover:bg-purple-700" title="Align Center H">↔️</button>
            <button onClick={() => alignElements('right')} className="px-2 py-1 bg-purple-600 rounded hover:bg-purple-700" title="Align Right">➡️</button>
            <button onClick={() => alignElements('top')} className="px-2 py-1 bg-purple-600 rounded hover:bg-purple-700" title="Align Top">⬆️</button>
            <button onClick={() => alignElements('centerV')} className="px-2 py-1 bg-purple-600 rounded hover:bg-purple-700" title="Align Center V">↕️</button>
            <button onClick={() => alignElements('bottom')} className="px-2 py-1 bg-purple-600 rounded hover:bg-purple-700" title="Align Bottom">⬇️</button>
            <button onClick={() => alignElements('distributeH')} className="px-2 py-1 bg-orange-600 rounded hover:bg-orange-700" title="Distribute H">⇔</button>
            <button onClick={() => alignElements('distributeV')} className="px-2 py-1 bg-orange-600 rounded hover:bg-orange-700" title="Distribute V">⇕</button>
          </>
        )}
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden">
          <div className="flex flex-wrap border-b border-gray-700">
            {(['elements', 'cables', 'labels', 'draw', 'layers', 'save'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSideTab(tab)}
                className={`px-3 py-2 text-sm capitalize ${sideTab === tab ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto p-3">
            {/* Elements tab */}
            {sideTab === 'elements' && (
              <div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCat(cat)}
                      className={`px-2 py-1 text-xs rounded ${activeCat === cat ? 'text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                      style={{ backgroundColor: activeCat === cat ? CATEGORY_COLORS[cat] : undefined }}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
                
                <div className="space-y-1">
                  {ELEMENTS.filter(el => el.category === activeCat).map(el => (
                    <div
                      key={el.id}
                      onClick={() => { setActiveElement(el.id); setTool('place'); }}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer ${activeElement === el.id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      <SchematicIcon defId={el.id} category={activeCat} size={24} customColor={iconColors[el.id]} />
                      <div className="flex-1">
                        <div className="text-sm">{el.name}</div>
                        <div className="text-xs text-gray-400">{el.shortName}</div>
                      </div>
                      <input
                        type="color"
                        value={iconColors[el.id] || CATEGORY_COLORS[activeCat]}
                        onChange={(e) => setIconColors(prev => ({ ...prev, [el.id]: e.target.value }))}
                        className="w-6 h-6 rounded cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                        title="Change icon color"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Cables tab */}
            {sideTab === 'cables' && (
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={curvedCables}
                    onChange={(e) => setCurvedCables(e.target.checked)}
                  />
                  <span>Curved cables</span>
                </label>
                
                <div>
                  <label className="text-sm text-gray-400">Cable Color</label>
                  <input
                    type="color"
                    value={cableColor}
                    onChange={(e) => setCableColor(e.target.value)}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>
                
                <div className="space-y-1">
                  {(Object.keys(CABLE_COLORS) as CableType[]).map(cableType => (
                    <div
                      key={cableType}
                      onClick={() => { setActiveCableType(cableType); setCableColor(CABLE_COLORS[cableType]); setTool('cable'); }}
                      className={`p-2 rounded cursor-pointer ${activeCableType === cableType ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-1 rounded" style={{ backgroundColor: CABLE_COLORS[cableType] }} />
                        <span className="text-sm">{CABLE_LABELS[cableType]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Labels tab */}
            {sideTab === 'labels' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  {labelPresets.map(preset => (
                    <div
                      key={preset.type}
                      onClick={() => { setActiveLabelType(preset.type); setTool('label'); }}
                      className={`p-2 rounded cursor-pointer ${activeLabelType === preset.type ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.color }} />
                        <span className="text-sm">{preset.prefix}</span>
                        <span className="text-xs text-gray-400">(+{preset.increment})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* FEATURE 3: Draw/Shapes tab */}
            {sideTab === 'draw' && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Shape Tools</div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => { setActiveShapeType('rect'); setTool('shape'); }}
                      className={`p-3 rounded flex flex-col items-center gap-1 ${activeShapeType === 'rect' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      <span className="text-xl">⬜</span>
                      <span className="text-xs">Rectangle</span>
                    </button>
                    <button
                      onClick={() => { setActiveShapeType('circle'); setTool('shape'); }}
                      className={`p-3 rounded flex flex-col items-center gap-1 ${activeShapeType === 'circle' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      <span className="text-xl">⭕</span>
                      <span className="text-xs">Circle</span>
                    </button>
                    <button
                      onClick={() => { setActiveShapeType('oval'); setTool('shape'); }}
                      className={`p-3 rounded flex flex-col items-center gap-1 ${activeShapeType === 'oval' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      <span className="text-xl">⬭</span>
                      <span className="text-xs">Oval</span>
                    </button>
                    <button
                      onClick={() => { setActiveShapeType('triangle'); setTool('shape'); }}
                      className={`p-3 rounded flex flex-col items-center gap-1 ${activeShapeType === 'triangle' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      <span className="text-xl">△</span>
                      <span className="text-xs">Triangle</span>
                    </button>
                    <button
                      onClick={() => { setActiveShapeType('line'); setTool('shape'); }}
                      className={`p-3 rounded flex flex-col items-center gap-1 ${activeShapeType === 'line' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      <span className="text-xl">╱</span>
                      <span className="text-xs">Line</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Hold <kbd className="px-1 bg-gray-700 rounded">Shift</kbd> for straight lines or perfect squares/circles
                  </p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Shape Color</label>
                  <input
                    type="color"
                    value={shapeColor}
                    onChange={(e) => setShapeColor(e.target.value)}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={shapeFill}
                    onChange={(e) => setShapeFill(e.target.checked)}
                  />
                  <span>Fill shape</span>
                </label>
              </div>
            )}
            
            {/* Layers tab */}
            {sideTab === 'layers' && (
              <div className="space-y-2">
                {Object.entries(layers).map(([key, visible]) => (
                  <label key={key} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={(e) => setLayers(prev => ({ ...prev, [key]: e.target.checked }))}
                    />
                    <span className="capitalize">{key}</span>
                  </label>
                ))}
              </div>
            )}
            
            {/* Save tab */}
            {sideTab === 'save' && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Scale</label>
                  <select
                    value={scale.label}
                    onChange={(e) => setScale(SCALE_PRESETS.find(s => s.label === e.target.value) || SCALE_PRESETS[2])}
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                  >
                    {SCALE_PRESETS.map(s => (
                      <option key={s.label} value={s.label}>{s.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <button onClick={() => exportAs('png')} className="w-full p-2 bg-blue-600 rounded hover:bg-blue-700">
                    Export as PNG
                  </button>
                  <button onClick={() => exportAs('jpg')} className="w-full p-2 bg-blue-600 rounded hover:bg-blue-700">
                    Export as JPG
                  </button>
                  <button onClick={() => exportAs('pdf')} className="w-full p-2 bg-blue-600 rounded hover:bg-blue-700">
                    Export as PDF
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Properties panel - FEATURE 1: with number swap */}
          {selectedElement && (
            <div className="border-t border-gray-700 p-3 bg-gray-750">
              <div className="text-sm font-medium mb-2">Properties</div>
              {(() => {
                const el = elements.find(e => e.uid === selectedElement);
                if (!el) return null;
                const def = getElementDef(el.defId);
                return (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-400">Element Number</label>
                      <input
                        type="number"
                        value={el.number}
                        onChange={(e) => handleElementNumberChange(el.uid, e.target.value)}
                        className="w-full p-1 bg-gray-700 rounded border border-gray-600 text-sm"
                        min="1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Change number - auto-swaps if duplicate</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Label</label>
                      <input
                        type="text"
                        value={el.label}
                        onChange={(e) => setElements(prev => prev.map(x => x.uid === el.uid ? { ...x, label: e.target.value } : x))}
                        className="w-full p-1 bg-gray-700 rounded border border-gray-600 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Notes</label>
                      <textarea
                        value={el.notes}
                        onChange={(e) => setElements(prev => prev.map(x => x.uid === el.uid ? { ...x, notes: e.target.value } : x))}
                        className="w-full p-1 bg-gray-700 rounded border border-gray-600 text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
        
        {/* Canvas area */}
        <div className="flex-1 overflow-auto bg-gray-950" ref={scrollRef}>
          <div
            ref={canvasRef}
            className="relative bg-white"
            style={{
              width: bgImage ? 'auto' : '1200px',
              height: bgImage ? 'auto' : '800px',
              minWidth: '100%',
              minHeight: '100%',
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: 'top left'
            }}
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onContextMenu={handleContextMenu}
          >
            {bgImage && <img src={bgImage} alt="Floor plan" className="max-w-none" draggable={false} />}
            
            {!bgImage && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8 border-2 border-dashed border-gray-400 rounded-lg">
                  <div className="text-6xl mb-4">📂</div>
                  <div className="text-xl text-gray-600 mb-2">Open a floor plan to get started</div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Open Floor Plan
                  </button>
                </div>
              </div>
            )}
            
            {/* SVG overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              {/* Cables */}
              {layers.cables && cables.map((cable, i) => (
                <g key={cable.uid}>
                  <polyline
                    points={cable.points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={cable.color}
                    strokeWidth={2}
                    strokeDasharray={CABLE_DASH[cable.type]}
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); setSelectedCable(i); }}
                  />
                </g>
              ))}
              
              {drawingCable.length > 0 && (
                <polyline
                  points={drawingCable.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={cableColor}
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />
              )}
              
              {/* Measures */}
              {layers.measures && measures.map((measure, i) => (
                <g key={measure.uid}>
                  <polyline
                    points={measure.points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={selectedMeasure === i ? '#fff' : '#ffcc00'}
                    strokeWidth={2}
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); setSelectedMeasure(i); }}
                  />
                  {measure.points.length >= 2 && (
                    <text
                      x={(measure.points[0].x + measure.points[measure.points.length - 1].x) / 2}
                      y={(measure.points[0].y + measure.points[measure.points.length - 1].y) / 2 - 10}
                      fill="#ffcc00"
                      fontSize="14"
                      textAnchor="middle"
                    >
                      {getCableLength(measure.points)} ft
                    </text>
                  )}
                </g>
              ))}
              
              {/* Shapes */}
              {layers.shapes && shapes.map(shape => (
                <g key={shape.id} onClick={(e) => { e.stopPropagation(); setSelectedShape(shape.id); }} style={{ pointerEvents: 'all', cursor: 'pointer' }}>
                  {shape.type === 'rect' && (
                    <rect
                      x={shape.x}
                      y={shape.y}
                      width={shape.width}
                      height={shape.height}
                      fill={shape.fill ? shape.color : 'none'}
                      stroke={shape.color}
                      strokeWidth={selectedShape === shape.id ? 3 : 2}
                    />
                  )}
                  {(shape.type === 'circle' || shape.type === 'oval') && (
                    <ellipse
                      cx={shape.x + shape.width / 2}
                      cy={shape.y + shape.height / 2}
                      rx={shape.width / 2}
                      ry={shape.type === 'circle' ? shape.width / 2 : shape.height / 2}
                      fill={shape.fill ? shape.color : 'none'}
                      stroke={shape.color}
                      strokeWidth={selectedShape === shape.id ? 3 : 2}
                    />
                  )}
                  {shape.type === 'triangle' && (
                    <polygon
                      points={`${shape.x + shape.width / 2},${shape.y} ${shape.x},${shape.y + shape.height} ${shape.x + shape.width},${shape.y + shape.height}`}
                      fill={shape.fill ? shape.color : 'none'}
                      stroke={shape.color}
                      strokeWidth={selectedShape === shape.id ? 3 : 2}
                    />
                  )}
                  {shape.type === 'line' && shape.points && (
                    <line
                      x1={shape.points[0].x}
                      y1={shape.points[0].y}
                      x2={shape.points[1].x}
                      y2={shape.points[1].y}
                      stroke={shape.color}
                      strokeWidth={selectedShape === shape.id ? 3 : 2}
                    />
                  )}
                </g>
              ))}
              
              {/* Drawing shape preview */}
              {drawingShape && activeShapeType && (
                <g>
                  {activeShapeType === 'rect' && (
                    <rect
                      x={Math.min(drawingShape.startX, drawingShape.currentX)}
                      y={Math.min(drawingShape.startY, drawingShape.currentY)}
                      width={Math.abs(drawingShape.currentX - drawingShape.startX)}
                      height={Math.abs(drawingShape.currentY - drawingShape.startY)}
                      fill={shapeFill ? shapeColor : 'none'}
                      stroke={shapeColor}
                      strokeWidth={2}
                      strokeDasharray="5,5"
                    />
                  )}
                  {(activeShapeType === 'circle' || activeShapeType === 'oval') && (
                    <ellipse
                      cx={(drawingShape.startX + drawingShape.currentX) / 2}
                      cy={(drawingShape.startY + drawingShape.currentY) / 2}
                      rx={Math.abs(drawingShape.currentX - drawingShape.startX) / 2}
                      ry={activeShapeType === 'circle' 
                        ? Math.abs(drawingShape.currentX - drawingShape.startX) / 2 
                        : Math.abs(drawingShape.currentY - drawingShape.startY) / 2}
                      fill={shapeFill ? shapeColor : 'none'}
                      stroke={shapeColor}
                      strokeWidth={2}
                      strokeDasharray="5,5"
                    />
                  )}
                  {activeShapeType === 'triangle' && (
                    <polygon
                      points={`${(drawingShape.startX + drawingShape.currentX) / 2},${Math.min(drawingShape.startY, drawingShape.currentY)} ${Math.min(drawingShape.startX, drawingShape.currentX)},${Math.max(drawingShape.startY, drawingShape.currentY)} ${Math.max(drawingShape.startX, drawingShape.currentX)},${Math.max(drawingShape.startY, drawingShape.currentY)}`}
                      fill={shapeFill ? shapeColor : 'none'}
                      stroke={shapeColor}
                      strokeWidth={2}
                      strokeDasharray="5,5"
                    />
                  )}
                  {activeShapeType === 'line' && (
                    <line
                      x1={drawingShape.startX}
                      y1={drawingShape.startY}
                      x2={drawingShape.currentX}
                      y2={drawingShape.currentY}
                      stroke={shapeColor}
                      strokeWidth={2}
                      strokeDasharray="5,5"
                    />
                  )}
                </g>
              )}
            </svg>
            
            {/* Elements */}
            {elements.map(el => {
              const def = getElementDef(el.defId);
              if (!def || !layers[def.category]) return null;
              const isSelected = selectedElement === el.uid || selectedElements.includes(el.uid);
              return (
                <div
                  key={el.uid}
                  className={`absolute cursor-move ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: el.x,
                    top: el.y,
                    transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (e.shiftKey) {
                      setSelectedElements(prev => 
                        prev.includes(el.uid) ? prev.filter(id => id !== el.uid) : [...prev, el.uid]
                      );
                    } else {
                      setSelectedElement(el.uid);
                      setSelectedElements([el.uid]);
                    }
                  }}
                >
                  <div className="flex flex-col items-center">
                    <SchematicIcon 
                      defId={def.id}
                      category={def.category}
                      size={ICON_SIZES[el.size]}
                      customColor={iconColors[def.id]}
                    />
                    {/* FEATURE 5: Label box with consistent styling */}
                    <div
                      className="mt-1 px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap"
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        border: '1px solid #000000',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                      }}
                    >
                      {el.label}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Labels */}
            {layers.labels && labels.map(label => (
              <div
                key={label.uid}
                className={`absolute cursor-move px-2 py-1 rounded text-sm font-medium ${selectedLabel === label.uid ? 'ring-2 ring-white' : ''}`}
                style={{
                  left: label.x,
                  top: label.y,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: label.color,
                  color: '#fff'
                }}
                onClick={(e) => { e.stopPropagation(); setSelectedLabel(label.uid); }}
              >
                {label.prefix}-{label.number.toString().padStart(3, '0')}
              </div>
            ))}
            
            {/* FEATURE 4: Info box on plan */}
            {infoBoxOnPlan && layers.infoBox && (
              <div
                className="absolute bg-white border-2 border-gray-800 rounded-lg shadow-lg"
                style={{
                  left: infoBoxPos.x,
                  top: infoBoxPos.y,
                  minWidth: '200px',
                  maxWidth: '350px'
                }}
              >
                <div className="bg-gray-800 text-white px-3 py-2 font-bold rounded-t-lg">
                  📊 Project Summary
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium text-gray-800 mb-2">Elements:</div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {Object.entries(getInfoBoxData().elementCounts).map(([type, count]) => (
                      <span key={type} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                        {type}: {count}
                      </span>
                    ))}
                  </div>
                  {Object.keys(getInfoBoxData().cableLengths).length > 0 && (
                    <>
                      <div className="text-sm font-medium text-gray-800 mb-2">Cables:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(getInfoBoxData().cableLengths).map(([type, length]) => (
                          <span key={type} className="px-2 py-1 bg-blue-100 rounded text-xs text-blue-700">
                            {type}: {length.toFixed(1)} ft
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Info box popup */}
      {showInfoBox && !infoBoxOnPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInfoBox(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
              <span className="font-bold">📊 Project Summary</span>
              <button onClick={() => setShowInfoBox(false)} className="text-xl">×</button>
            </div>
            <div className="p-4">
              <h3 className="font-medium mb-2">Elements ({elements.length})</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(getInfoBoxData().elementCounts).map(([type, count]) => (
                  <span key={type} className="px-3 py-1 bg-gray-100 rounded text-sm">
                    {type}: {count}
                  </span>
                ))}
              </div>
              
              <h3 className="font-medium mb-2">Cables ({cables.length})</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(getInfoBoxData().cableLengths).map(([type, length]) => (
                  <span key={type} className="px-3 py-1 bg-blue-100 rounded text-sm">
                    {type}: {length.toFixed(1)} ft
                  </span>
                ))}
              </div>
              
              <h3 className="font-medium mb-2">Labels ({labels.length})</h3>
              <h3 className="font-medium mb-2">Shapes ({shapes.length})</h3>
            </div>
          </div>
        </div>
      )}
      
      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y, minWidth: '180px', maxHeight: '80vh', overflowY: 'auto' }}
        >
          {contextMenu.items.map((item, i) => 
            item.divider ? (
              <div key={i} className="border-t border-gray-600 my-1" />
            ) : (
              <button
                key={i}
                onClick={item.action}
                className="w-full px-4 py-2 text-left hover:bg-blue-600 text-sm"
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.svg"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default App;
