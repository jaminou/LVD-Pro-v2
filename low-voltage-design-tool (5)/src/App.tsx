import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SchematicIcon } from './SchematicIcon';
import { ELEMENTS } from './data';
import {
  Category, ToolMode, DisplayMode, CableType, IconSize, LabelType,
  PlacedElement, Cable, Drawing, TextAnnotation, Stamp, MeasureLine, Group, InfoBox, PlacedLabel,
  CATEGORY_COLORS, CATEGORY_LABELS, CABLE_COLORS, CABLE_LABELS, CABLE_DASH,
  SCALE_PRESETS, ICON_SIZES, DEFAULT_LABEL_PRESETS, LabelPreset, LabelTemplate,
} from './types';

const uid = () => Math.random().toString(36).slice(2, 10);
const CATS: Category[] = ['alarm','fire','cctv','sound','automation','tv','data'];

// Project file extension
const PROJECT_EXT = '.lvproj';

// Track element numbers per type
type ElementCounts = Record<string, number>;

// Custom element names (user can edit short names)
type ElementNames = Record<string, string>;

export function App() {
  // Background
  const [bgUrl, setBgUrl] = useState('');
  const [bgW, setBgW] = useState(0);
  const [bgH, setBgH] = useState(0);

  // Elements
  const [elements, setElements] = useState<PlacedElement[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [placingDef, setPlacingDef] = useState<string|null>(null);
  const [elementCounts, setElementCounts] = useState<ElementCounts>({});
  
  // Custom element names (user editable short names for elements)
  const [customElementNames, setCustomElementNames] = useState<ElementNames>(() => {
    const saved = localStorage.getItem('lv_element_names');
    if(saved) { try { return JSON.parse(saved); } catch { return {}; } }
    return {};
  });
  const [editingElementDef, setEditingElementDef] = useState<string|null>(null);
  const [editingElementName, setEditingElementName] = useState('');

  // Cables
  const [cables, setCables] = useState<Cable[]>([]);
  const [cableType, setCableType] = useState<CableType>('alarm');
  const [cableColor, setCableColor] = useState(CABLE_COLORS.alarm);
  const [drawingCable, setDrawingCable] = useState<{x:number;y:number}[]>([]);
  const [showCableLengths, setShowCableLengths] = useState(true);
  const [curvedCables, setCurvedCables] = useState(false); // Draw cables with curves
  
  // Icon colors (user customizable)
  const [iconColors, setIconColors] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('lv_icon_colors');
    if(saved) { try { return JSON.parse(saved); } catch { return {}; } }
    return {};
  });

  // Drawings
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [curDraw, setCurDraw] = useState<{x:number;y:number}[]>([]);
  const [texts, setTexts] = useState<TextAnnotation[]>([]);

  // Groups
  const [groups, setGroups] = useState<Group[]>([]);

  // Stamp
  const [stamp, setStamp] = useState<Stamp|null>(null);
  const [showStampModal, setShowStampModal] = useState(false);

  // Labels (Zone, Cam, Data, etc.)
  const [labels, setLabels] = useState<PlacedLabel[]>([]);
  const [labelType, setLabelType] = useState<LabelType>('zone');
  const [labelCounts, setLabelCounts] = useState<Record<LabelType, number>>({ zone: 0, cam: 0, data: 0, speaker: 0, tv: 0, tel: 0, ap: 0, custom: 0 });
  const [selectedLabel, setSelectedLabel] = useState<string|null>(null);
  const [labelDragInfo, setLabelDragInfo] = useState<{uid:string;ox:number;oy:number}|null>(null);
  const [customLabelPrefix, setCustomLabelPrefix] = useState('Custom');
  const [customLabelColor, setCustomLabelColor] = useState('#22c55e');
  const [labelIncrement, setLabelIncrement] = useState(1);
  
  // Editable label presets (user can modify Zone to Zn, etc.)
  const [labelPresets, setLabelPresets] = useState<LabelPreset[]>(() => {
    // Load from localStorage on startup or use defaults
    const saved = localStorage.getItem('lv_label_presets');
    if (saved) {
      try { return JSON.parse(saved); } catch { return [...DEFAULT_LABEL_PRESETS]; }
    }
    return [...DEFAULT_LABEL_PRESETS];
  });
  
  // Custom label types added by user
  const [customLabelTypes, setCustomLabelTypes] = useState<LabelPreset[]>(() => {
    const saved = localStorage.getItem('lv_custom_labels');
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });
  
  // Editing state for label presets
  const [editingLabelType, setEditingLabelType] = useState<LabelType|null>(null);
  
  // Template management
  const [savedTemplates, setSavedTemplates] = useState<LabelTemplate[]>(() => {
    const saved = localStorage.getItem('lv_label_templates');
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Measure
  const [measures, setMeasures] = useState<MeasureLine[]>([]);
  const [drawingMeasure, setDrawingMeasure] = useState<{x:number;y:number}[]>([]);
  const [selectedMeasure, setSelectedMeasure] = useState<string|null>(null);

  // Info Box
  const [infoBox, setInfoBox] = useState<InfoBox>({ x: 50, y: 50, visible: false });
  const [infoDrag, setInfoDrag] = useState<{ox:number;oy:number}|null>(null);

  // Tool & display
  const [tool, setTool] = useState<ToolMode>('select');
  const [globalDisplay, setGlobalDisplay] = useState<DisplayMode>('icon');
  const [globalSize, setGlobalSize] = useState<IconSize>('m');
  const [drawColor, setDrawColor] = useState('#ffffff');
  const [drawSize, setDrawSize] = useState(3);

  // Zoom & pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x:0,y:0});
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({x:0,y:0,px:0,py:0});

  // Dragging element
  const [dragInfo, setDragInfo] = useState<{uid:string;ox:number;oy:number}|null>(null);
  const [labelDrag, setLabelDrag] = useState<{uid:string;ox:number;oy:number}|null>(null);
  const [stampDrag, setStampDrag] = useState<{ox:number;oy:number}|null>(null);

  // Hover state for auto-select
  const [hoveredElement, setHoveredElement] = useState<string|null>(null);

  // Layers
  const [layers, setLayers] = useState<Record<string,boolean>>({
    alarm:true,fire:true,cctv:true,sound:true,automation:true,tv:true,data:true,
    cables:true,pipes:true,drawings:true,texts:true,stamp:true,measures:true,infobox:true,labels:true,
  });

  // Ruler & Scale
  const [showRuler, setShowRuler] = useState(true);
  const [scaleIdx, setScaleIdx] = useState(2);
  const scale = SCALE_PRESETS[scaleIdx];

  // Context menu
  const [ctxMenu, setCtxMenu] = useState<{x:number;y:number;elUid?:string;measureUid?:string}|null>(null);

  // Sidebar
  const [sideTab, setSideTab] = useState<'elements'|'cables'|'piping'|'draw'|'layers'|'save'|'measure'|'labels'>('elements');
  const [catFilter, setCatFilter] = useState<Category>('alarm');
  
  // File menu
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState<string>('Untitled');

  // Sprinkler Pipes
  const [sprinklerPipes, setSprinklerPipes] = useState<{uid:string;pipeType:string;size:string;points:{x:number;y:number}[];color:string}[]>([]);
  const [drawingPipe, setDrawingPipe] = useState<{x:number;y:number}[]>([]);
  const [selectedPipeType, setSelectedPipeType] = useState('main');
  const [selectedPipeSize, setSelectedPipeSize] = useState('2');
  const [selectedPipe, setSelectedPipe] = useState<string|null>(null);
  const [pipeColor, setPipeColor] = useState('#3b82f6');

  // Refs
  const fileRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Undo / Redo
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);

  const getState = useCallback(() => JSON.stringify({elements,cables,drawings,texts,stamp,measures,groups,elementCounts,labels,labelCounts,sprinklerPipes}), [elements,cables,drawings,texts,stamp,measures,groups,elementCounts,labels,labelCounts,sprinklerPipes]);

  const pushHistory = useCallback(() => {
    const s = getState();
    setHistory(h => {
      const nh = h.slice(0, histIdx+1);
      nh.push(s);
      if(nh.length > 80) nh.shift();
      return nh;
    });
    setHistIdx(i => Math.min(i+1, 79));
  }, [getState, histIdx]);

  const restoreState = useCallback((s: string) => {
    try {
      const o = JSON.parse(s);
      setElements(o.elements||[]);
      setCables(o.cables||[]);
      setDrawings(o.drawings||[]);
      setTexts(o.texts||[]);
      setStamp(o.stamp||null);
      setMeasures(o.measures||[]);
      setGroups(o.groups||[]);
      setElementCounts(o.elementCounts||{});
      setLabels(o.labels||[]);
      setLabelCounts(o.labelCounts||{ zone: 0, cam: 0, data: 0, speaker: 0, custom: 0 });
      setSprinklerPipes(o.sprinklerPipes||[]);
    } catch(e) { console.error(e); }
  }, []);

  const undo = useCallback(() => {
    if(histIdx > 0) { setHistIdx(histIdx-1); restoreState(history[histIdx-1]); }
  }, [histIdx, history, restoreState]);

  const redo = useCallback(() => {
    if(histIdx < history.length-1) { setHistIdx(histIdx+1); restoreState(history[histIdx+1]); }
  }, [histIdx, history, restoreState]);

  // PDF scale factor - we render at higher res for quality but track this for coordinates
  const [pdfScale, setPdfScale] = useState(1);

  // ---- File Upload ----
  const handleFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if(ext === 'pdf') {
      const reader = new FileReader();
      reader.onload = async () => {
        const arr = new Uint8Array(reader.result as ArrayBuffer);
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        const pdf = await pdfjsLib.getDocument({data: arr}).promise;
        const page = await pdf.getPage(1);
        // Use scale 1 for the logical size (coordinates)
        const vpLogical = page.getViewport({scale: 1});
        // Use scale 2 for rendering quality
        const renderScale = 2;
        const vp = page.getViewport({scale: renderScale});
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, vp.width, vp.height);
        await page.render({canvasContext: ctx, viewport: vp}).promise;
        const url = canvas.toDataURL('image/png');
        // Store LOGICAL dimensions (not the 2x rendered size)
        setBgW(vpLogical.width);
        setBgH(vpLogical.height);
        setPdfScale(renderScale);
        setBgUrl(url);
        setTimeout(() => fitToView(vpLogical.width, vpLogical.height), 100);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setBgW(img.naturalWidth);
        setBgH(img.naturalHeight);
        setPdfScale(1);
        setBgUrl(url);
        setTimeout(() => fitToView(img.naturalWidth, img.naturalHeight), 100);
      };
      img.src = url;
    }
  }, []);

  const fitToView = useCallback((w?: number, h?: number) => {
    const wrap = wrapRef.current;
    if(!wrap) return;
    const bw = w || bgW;
    const bh = h || bgH;
    if(!bw || !bh) return;
    // Available space in the viewport
    const availW = wrap.clientWidth - 80;
    const availH = wrap.clientHeight - 80;
    // Calculate zoom to fit
    const z = Math.min(availW / bw, availH / bh, 2);
    setZoom(z);
    // Center the image with some padding
    const centerPadX = Math.max(30, (availW - bw * z) / 2 + 30);
    const centerPadY = Math.max(30, (availH - bh * z) / 2 + 30);
    setPan({x: centerPadX, y: centerPadY});
    // Reset scroll
    wrap.scrollLeft = 0;
    wrap.scrollTop = 0;
  }, [bgW, bgH]);

  // ---- Coordinate conversion (ACCURATE) ----
  // This converts screen mouse coordinates to canvas logical coordinates
  const canvasCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    const wrap = wrapRef.current;
    if(!wrap) return {x:0,y:0};
    const rect = wrap.getBoundingClientRect();
    // Mouse position relative to the scroll container's visible area
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    // Add scroll offset to get position in the full scrollable area
    const scrolledX = mouseX + wrap.scrollLeft;
    const scrolledY = mouseY + wrap.scrollTop;
    // Subtract pan offset and divide by zoom to get logical canvas coords
    const x = (scrolledX - pan.x) / zoom;
    const y = (scrolledY - pan.y) / zoom;
    return {x, y};
  }, [zoom, pan]);

  // ---- Get next element number ----
  const getNextNumber = useCallback((defId: string) => {
    const current = elementCounts[defId] || 0;
    const next = current + 1;
    setElementCounts(prev => ({...prev, [defId]: next}));
    return next;
  }, [elementCounts]);

  // ---- Format number as 001, 002, etc ----
  const formatNumber = (n: number) => String(n).padStart(3, '0');

  // ---- Place element ----
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if(e.button !== 0) return;
    const pos = canvasCoords(e);

    // Click on measure to select
    if(tool === 'select' || tool === 'measure') {
      // Check if clicking on a measure
      for(const m of measures) {
        if(m.points.length >= 2) {
          for(let i = 0; i < m.points.length - 1; i++) {
            const p1 = m.points[i];
            const p2 = m.points[i+1];
            // Distance from point to line segment
            const d = distToSegment(pos, p1, p2);
            if(d < 15) {
              setSelectedMeasure(m.uid);
              setSelected([]);
              return;
            }
          }
        }
      }
      setSelectedMeasure(null);
    }

    if(tool === 'place' && placingDef) {
      const def = ELEMENTS.find(d => d.id === placingDef);
      if(!def) return;
      const num = getNextNumber(def.id);
      const iconSize = ICON_SIZES[globalSize];
      // Use custom name if set, otherwise use shortName or full name
      const labelName = customElementNames[def.id] || def.shortName || def.name;
      const el: PlacedElement = {
        uid: uid(), 
        defId: def.id, 
        x: pos.x - iconSize/2, 
        y: pos.y - iconSize/2,
        rotation: 0, 
        label: `${labelName}-${formatNumber(num)}`, 
        notes: '', 
        display: globalDisplay,
        labelOffsetX: 0, 
        labelOffsetY: iconSize + 6, 
        groupId: undefined,
        size: globalSize,
        number: num,
        zone: (def.category === 'alarm' || def.category === 'fire') ? '' : undefined,
      };
      setElements(prev => [...prev, el]);
      pushHistory();
      return;
    }

    if(tool === 'cable') {
      setDrawingCable(prev => [...prev, pos]);
      return;
    }

    if(tool === 'sprinklerPipe') {
      // Fittings are placed with single click
      const fittingTypes = ['elbow_90','elbow_45','tee','reducer','coupling','cap'];
      if(fittingTypes.includes(selectedPipeType)) {
        // Place fitting as a single-point pipe element
        setSprinklerPipes(prev => [...prev, {uid: uid(), pipeType: selectedPipeType, size: selectedPipeSize, points: [{x:pos.x, y:pos.y}], color: pipeColor}]);
        pushHistory();
        return;
      }
      // Pipe runs are drawn with multiple clicks
      setDrawingPipe(prev => [...prev, pos]);
      return;
    }

    if(tool === 'measure') {
      setDrawingMeasure(prev => [...prev, pos]);
      return;
    }

    if(tool === 'text') {
      const text = prompt('Enter text:');
      if(text) {
        setTexts(prev => [...prev, {uid: uid(), x: pos.x, y: pos.y, text, color: drawColor, size: Math.max(18, drawSize * 4)}]);
        pushHistory();
      }
      return;
    }

    // Label tool - place incrementing labels
    if(tool === 'label') {
      const preset = labelPresets.find(p => p.type === labelType) || labelPresets[0];
      const currentCount = labelCounts[labelType] || 0;
      const nextNum = currentCount + labelIncrement;
      
      // Use custom prefix/color if custom type and user specified one
      const usePrefix = labelType === 'custom' && customLabelPrefix.trim() ? customLabelPrefix : preset.prefix;
      const useColor = labelType === 'custom' ? customLabelColor : preset.color;
      
      const newLabel: PlacedLabel = {
        uid: uid(),
        type: labelType,
        prefix: usePrefix,
        number: nextNum,
        x: pos.x,
        y: pos.y,
        color: useColor,
        size: 16,
      };
      setLabels(prev => [...prev, newLabel]);
      setLabelCounts(prev => ({...prev, [labelType]: nextNum}));
      pushHistory();
      return;
    }

    if(tool === 'eraser') {
      const threshold = 20;
      setDrawings(prev => prev.filter(d => !d.points.some(p => Math.hypot(p.x-pos.x, p.y-pos.y) < threshold)));
      return;
    }

    // Select tool - deselect if clicking empty area
    if(tool === 'select') {
      if(!e.shiftKey) setSelected([]);
    }
  }, [tool, placingDef, canvasCoords, globalDisplay, globalSize, pushHistory, drawColor, drawSize, getNextNumber, measures]);

  // Distance from point to line segment
  function distToSegment(p: {x:number;y:number}, v: {x:number;y:number}, w: {x:number;y:number}) {
    const l2 = (v.x-w.x)**2 + (v.y-w.y)**2;
    if(l2 === 0) return Math.hypot(p.x-v.x, p.y-v.y);
    let t = ((p.x-v.x)*(w.x-v.x) + (p.y-v.y)*(w.y-v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t*(w.x-v.x)), p.y - (v.y + t*(w.y-v.y)));
  }

  // ---- Double click to finish cable/measure ----
  const handleDblClick = useCallback(() => {
    if(tool === 'cable' && drawingCable.length >= 2) {
      setCables(prev => [...prev, {uid: uid(), type: cableType, color: cableColor, points: drawingCable, showLength: showCableLengths, curved: curvedCables}]);
      setDrawingCable([]);
      pushHistory();
    }
    if(tool === 'measure' && drawingMeasure.length >= 2) {
      setMeasures(prev => [...prev, {uid: uid(), points: drawingMeasure, color: '#fbbf24'}]);
      setDrawingMeasure([]);
      pushHistory();
    }
    if(tool === 'sprinklerPipe' && drawingPipe.length >= 2) {
      setSprinklerPipes(prev => [...prev, {uid: uid(), pipeType: selectedPipeType, size: selectedPipeSize, points: drawingPipe, color: pipeColor}]);
      setDrawingPipe([]);
      pushHistory();
    }
  }, [tool, drawingCable, drawingMeasure, cableType, cableColor, showCableLengths, pushHistory]);

  // ---- Mouse down for drawing/panning/dragging ----
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if(e.button === 1 || (tool === 'pan' && e.button === 0)) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = {x: e.clientX, y: e.clientY, px: pan.x, py: pan.y};
      return;
    }
    if((tool === 'pen' || tool === 'highlighter') && e.button === 0) {
      const pos = canvasCoords(e);
      setCurDraw([pos]);
      return;
    }
  }, [tool, pan, canvasCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if(isPanning) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({x: panStart.current.px + dx, y: panStart.current.py + dy});
      return;
    }
    if(dragInfo) {
      const pos = canvasCoords(e);
      const dx = pos.x - dragInfo.ox;
      const dy = pos.y - dragInfo.oy;
      setElements(prev => {
        const el = prev.find(el => el.uid === dragInfo.uid);
        if(!el) return prev;
        const grpId = el.groupId;
        return prev.map(e => {
          if(e.uid === dragInfo.uid || (grpId && e.groupId === grpId)) {
            return {...e, x: e.x + dx, y: e.y + dy};
          }
          return e;
        });
      });
      setDragInfo({...dragInfo, ox: pos.x, oy: pos.y});
      return;
    }
    if(labelDrag) {
      const pos = canvasCoords(e);
      const dx = pos.x - labelDrag.ox;
      const dy = pos.y - labelDrag.oy;
      setElements(prev => prev.map(e => e.uid === labelDrag.uid ? {...e, labelOffsetX: e.labelOffsetX + dx, labelOffsetY: e.labelOffsetY + dy} : e));
      setLabelDrag({...labelDrag, ox: pos.x, oy: pos.y});
      return;
    }
    if(stampDrag && stamp) {
      const pos = canvasCoords(e);
      const dx = pos.x - stampDrag.ox;
      const dy = pos.y - stampDrag.oy;
      setStamp({...stamp, x: stamp.x + dx, y: stamp.y + dy});
      setStampDrag({...stampDrag, ox: pos.x, oy: pos.y});
      return;
    }
    if(infoDrag && infoBox) {
      const pos = canvasCoords(e);
      const dx = pos.x - infoDrag.ox;
      const dy = pos.y - infoDrag.oy;
      setInfoBox({...infoBox, x: infoBox.x + dx, y: infoBox.y + dy});
      setInfoDrag({...infoDrag, ox: pos.x, oy: pos.y});
      return;
    }
    if(labelDragInfo) {
      const pos = canvasCoords(e);
      const dx = pos.x - labelDragInfo.ox;
      const dy = pos.y - labelDragInfo.oy;
      setLabels(prev => prev.map(l => l.uid === labelDragInfo.uid ? {...l, x: l.x + dx, y: l.y + dy} : l));
      setLabelDragInfo({...labelDragInfo, ox: pos.x, oy: pos.y});
      return;
    }
    if(curDraw.length > 0) {
      const pos = canvasCoords(e);
      setCurDraw(prev => [...prev, pos]);
    }
  }, [isPanning, dragInfo, labelDrag, stampDrag, stamp, infoDrag, infoBox, curDraw, canvasCoords]);

  const handleMouseUp = useCallback(() => {
    if(isPanning) { setIsPanning(false); return; }
    if(dragInfo) { setDragInfo(null); pushHistory(); return; }
    if(labelDrag) { setLabelDrag(null); pushHistory(); return; }
    if(stampDrag) { setStampDrag(null); pushHistory(); return; }
    if(infoDrag) { setInfoDrag(null); return; }
    if(labelDragInfo) { setLabelDragInfo(null); pushHistory(); return; }
    if(curDraw.length > 2) {
      setDrawings(prev => [...prev, {uid: uid(), tool: tool as 'pen'|'highlighter', color: drawColor, size: tool==='highlighter'? Math.max(20,drawSize*3):drawSize, points: curDraw}]);
      pushHistory();
    }
    setCurDraw([]);
  }, [isPanning, dragInfo, labelDrag, stampDrag, infoDrag, curDraw, tool, drawColor, drawSize, pushHistory]);

  // ---- Element click (select / start drag) ----
  const handleElementMouseDown = useCallback((e: React.MouseEvent, elUid: string) => {
    e.stopPropagation();
    if(tool === 'eraser' || tool === 'cable' || tool === 'measure' || tool === 'pen' || tool === 'highlighter' || tool === 'text') return;

    const pos = canvasCoords(e);
    if(e.shiftKey) {
      setSelected(prev => prev.includes(elUid) ? prev.filter(s=>s!==elUid) : [...prev, elUid]);
    } else {
      setSelected([elUid]);
    }
    setSelectedMeasure(null);
    setDragInfo({uid: elUid, ox: pos.x, oy: pos.y});
  }, [tool, canvasCoords]);

  // ---- Context menu ----
  const handleContextMenu = useCallback((e: React.MouseEvent, elUid?: string, measureUid?: string) => {
    e.preventDefault();
    e.stopPropagation();
    if(elUid) setSelected(prev => prev.includes(elUid) ? prev : [elUid]);
    if(measureUid) setSelectedMeasure(measureUid);
    setCtxMenu({x: e.clientX, y: e.clientY, elUid, measureUid});
  }, []);

  const ctxAction = useCallback((action: string) => {
    const elUid = ctxMenu?.elUid;
    const measureUid = ctxMenu?.measureUid;
    setCtxMenu(null);

    if(action === 'delete_measure' && measureUid) {
      setMeasures(prev => prev.filter(m => m.uid !== measureUid));
      setSelectedMeasure(null);
      pushHistory();
      return;
    }

    if(action === 'rotate45' && elUid) {
      setElements(prev => prev.map(e => e.uid === elUid ? {...e, rotation: (e.rotation+45)%360} : e));
      pushHistory();
    } else if(action === 'rotate90' && elUid) {
      setElements(prev => prev.map(e => e.uid === elUid ? {...e, rotation: (e.rotation+90)%360} : e));
      pushHistory();
    } else if(action === 'rotate180' && elUid) {
      setElements(prev => prev.map(e => e.uid === elUid ? {...e, rotation: (e.rotation+180)%360} : e));
      pushHistory();
    } else if(action === 'delete') {
      if(selected.length > 0) {
        setElements(prev => prev.filter(e => !selected.includes(e.uid)));
        setSelected([]);
        pushHistory();
      } else if(elUid) {
        setElements(prev => prev.filter(e => e.uid !== elUid));
        pushHistory();
      }
    } else if(action === 'duplicate' && elUid) {
      const el = elements.find(e => e.uid === elUid);
      if(el) {
        const num = getNextNumber(el.defId);
        const def = ELEMENTS.find(d => d.id === el.defId);
        const labelName = customElementNames[el.defId] || def?.shortName || def?.name || el.defId;
        setElements(prev => [...prev, {...el, uid: uid(), x: el.x+30, y: el.y+30, number: num, label: `${labelName}-${formatNumber(num)}`}]);
        pushHistory();
      }
    } else if(action.startsWith('display_') && elUid) {
      const mode = action.replace('display_', '') as DisplayMode;
      setElements(prev => prev.map(e => e.uid === elUid ? {...e, display: mode} : e));
    } else if(action.startsWith('size_') && elUid) {
      const size = action.replace('size_', '') as IconSize;
      setElements(prev => prev.map(e => e.uid === elUid ? {...e, size} : e));
    } else if(action === 'group') {
      if(selected.length >= 2) {
        const gid = uid();
        setGroups(prev => [...prev, {id: gid, name: `Group ${prev.length+1}`}]);
        setElements(prev => prev.map(e => selected.includes(e.uid) ? {...e, groupId: gid} : e));
        pushHistory();
      }
    } else if(action === 'ungroup') {
      const el = elements.find(e => e.uid === elUid);
      if(el?.groupId) {
        const gid = el.groupId;
        setElements(prev => prev.map(e => e.groupId === gid ? {...e, groupId: undefined} : e));
        setGroups(prev => prev.filter(g => g.id !== gid));
        pushHistory();
      }
    } else if(action === 'front' && elUid) {
      setElements(prev => { const el = prev.find(e=>e.uid===elUid); if(!el) return prev; return [...prev.filter(e=>e.uid!==elUid), el]; });
    } else if(action === 'back' && elUid) {
      setElements(prev => { const el = prev.find(e=>e.uid===elUid); if(!el) return prev; return [el, ...prev.filter(e=>e.uid!==elUid)]; });
    } else if(action === 'fitview') {
      fitToView();
    } else if(action === 'zoom100') {
      setZoom(1); setPan({x:30,y:30});
    } else if(action === 'ruler') {
      setShowRuler(r => !r);
    } else if(action === 'stamp') {
      setShowStampModal(true);
    } else if(action === 'infobox') {
      setInfoBox(prev => ({...prev, visible: !prev.visible}));
    }
  }, [ctxMenu, selected, elements, pushHistory, fitToView, getNextNumber]);

  // ---- Keyboard ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't handle keys if typing in an input
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if(tag === 'input' || tag === 'textarea') return;

      if(e.key === 'Escape') {
        setSelected([]); setPlacingDef(null); setTool('select'); setDrawingCable([]); setDrawingMeasure([]); setDrawingPipe([]); setCtxMenu(null); setSelectedMeasure(null); setSelectedLabel(null);
      }
      if(e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        
        // Delete selected label
        if(selectedLabel) {
          const labelToDelete = labels.find(l => l.uid === selectedLabel);
          if(labelToDelete) {
            // Remove the label and renumber remaining labels of same type
            setLabels(prev => {
              const remaining = prev.filter(l => l.uid !== selectedLabel);
              // Renumber labels of the same type
              let count = 0;
              return remaining.map(l => {
                if(l.type === labelToDelete.type) {
                  count++;
                  return {...l, number: count};
                }
                return l;
              });
            });
            // Update the count
            setLabelCounts(prev => ({...prev, [labelToDelete.type]: Math.max(0, prev[labelToDelete.type] - 1)}));
            setSelectedLabel(null);
            pushHistory();
          }
          return;
        }

        // Delete selected measure
        if(selectedMeasure) {
          setMeasures(prev => prev.filter(m => m.uid !== selectedMeasure));
          setSelectedMeasure(null);
          pushHistory();
          return;
        }

        // Delete selected pipe
        if(selectedPipe) {
          setSprinklerPipes(prev => prev.filter(p => p.uid !== selectedPipe));
          setSelectedPipe(null);
          pushHistory();
          return;
        }
        
        // Delete selected elements and renumber remaining of same type
        if(selected.length > 0) {
          const toDelete = elements.filter(el => selected.includes(el.uid));
          const defIdsToRenumber = [...new Set(toDelete.map(el => el.defId))];
          
          setElements(prev => {
            let remaining = prev.filter(el => !selected.includes(el.uid));
            // Renumber elements for each affected defId
            defIdsToRenumber.forEach(defId => {
              let count = 0;
              remaining = remaining.map(el => {
                if(el.defId === defId) {
                  count++;
                  const def = ELEMENTS.find(d => d.id === defId);
                  const labelName = customElementNames[defId] || def?.shortName || def?.name || defId;
                  return {...el, number: count, label: `${labelName}-${formatNumber(count)}`};
                }
                return el;
              });
              // Update element count
              setElementCounts(pc => ({...pc, [defId]: count}));
            });
            return remaining;
          });
          setSelected([]);
          pushHistory();
        }
      }
      if(e.key === 'r' && selected.length > 0 && !e.ctrlKey) {
        setElements(prev => prev.map(el => selected.includes(el.uid) ? {...el, rotation: (el.rotation+45)%360} : el));
        pushHistory();
      }
      if(e.key === 'z' && (e.ctrlKey||e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
      if((e.key === 'y' && (e.ctrlKey||e.metaKey)) || (e.key === 'z' && e.shiftKey && (e.ctrlKey||e.metaKey))) { e.preventDefault(); redo(); }
      if(e.key === 'd' && (e.ctrlKey||e.metaKey) && selected.length > 0) {
        e.preventDefault();
        const dupes = elements.filter(el => selected.includes(el.uid)).map(el => {
          const num = (elementCounts[el.defId] || 0) + 1;
          const def = ELEMENTS.find(d => d.id === el.defId);
          const labelName = customElementNames[el.defId] || def?.shortName || def?.name || el.defId;
          return {...el, uid: uid(), x: el.x+30, y: el.y+30, number: num, label: `${labelName}-${formatNumber(num)}`};
        });
        dupes.forEach(d => setElementCounts(prev => ({...prev, [d.defId]: d.number})));
        setElements(prev => [...prev, ...dupes]);
        pushHistory();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected, elements, elementCounts, pushHistory, undo, redo, selectedMeasure]);

  // Close context menu on click
  useEffect(() => {
    const h = () => setCtxMenu(null);
    if(ctxMenu) { setTimeout(() => window.addEventListener('click', h), 0); }
    return () => window.removeEventListener('click', h);
  }, [ctxMenu]);

  // Close file menu on click outside
  useEffect(() => {
    const h = () => setShowFileMenu(false);
    if(showFileMenu) { setTimeout(() => window.addEventListener('click', h), 0); }
    return () => window.removeEventListener('click', h);
  }, [showFileMenu]);

  // ---- Mouse wheel (zoom with ctrl, scroll otherwise) ----
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if(e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const d = e.deltaY > 0 ? -0.08 : 0.08;
      setZoom(z => Math.max(0.05, Math.min(5, z + d)));
    }
    // Normal scroll: do nothing, let browser handle it
  }, []);

  // ---- Reset (Full - Close Project) ----
  const handleReset = useCallback(() => {
    setBgUrl(''); setBgW(0); setBgH(0); setPdfScale(1);
    setElements([]); setSelected([]); setPlacingDef(null);
    setCables([]); setDrawingCable([]);
    setDrawings([]); setCurDraw([]); setTexts([]);
    setGroups([]); setStamp(null); setMeasures([]); setDrawingMeasure([]);
    setSprinklerPipes([]); setDrawingPipe([]); setSelectedPipe(null);
    setTool('select'); setZoom(1); setPan({x:0,y:0});
    setHistory([]); setHistIdx(-1);
    setElementCounts({});
    setSelectedMeasure(null);
    setInfoBox({x:50,y:50,visible:false});
    setLabels([]); setLabelCounts({ zone: 0, cam: 0, data: 0, speaker: 0, tv: 0, tel: 0, ap: 0, custom: 0 }); setSelectedLabel(null);
    setCurrentProjectName('Untitled');
    if(fileRef.current) fileRef.current.value = '';
  }, []);

  // ---- Save / Export ----
  const saveProject = useCallback(() => {
    const name = prompt('Project name:', currentProjectName || 'My Project');
    if(!name) return;
    setCurrentProjectName(name);
    const data = { 
      name, 
      date: new Date().toISOString(), 
      version: '1.0',
      bgUrl, bgW, bgH, pdfScale,
      elements, cables, drawings, texts, stamp, measures, groups, elementCounts,
      labels, labelCounts,
      infoBox, layers, scaleIdx,
    };
    const projects = JSON.parse(localStorage.getItem('lv_projects')||'[]');
    // Update existing or add new
    const existingIdx = projects.findIndex((p: {name: string}) => p.name === name);
    if(existingIdx >= 0) {
      projects[existingIdx] = data;
    } else {
      projects.push(data);
    }
    localStorage.setItem('lv_projects', JSON.stringify(projects));
    alert(`Project "${name}" saved successfully!`);
    setShowFileMenu(false);
  }, [bgUrl, bgW, bgH, pdfScale, elements, cables, drawings, texts, stamp, measures, groups, elementCounts, labels, labelCounts, infoBox, layers, scaleIdx, currentProjectName]);

  // Save project as downloadable file (.lvproj)
  const saveProjectAsFile = useCallback(() => {
    const name = prompt('Project name:', currentProjectName || 'My Project');
    if(!name) return;
    setCurrentProjectName(name);
    const data = { 
      name, 
      date: new Date().toISOString(), 
      version: '1.0',
      type: 'lv-designer-project',
      bgUrl, bgW, bgH, pdfScale,
      elements, cables, drawings, texts, stamp, measures, groups, elementCounts,
      labels, labelCounts,
      infoBox, layers, scaleIdx,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}${PROJECT_EXT}`;
    a.click();
    URL.revokeObjectURL(url);
    setShowFileMenu(false);
  }, [bgUrl, bgW, bgH, pdfScale, elements, cables, drawings, texts, stamp, measures, groups, elementCounts, labels, labelCounts, infoBox, layers, scaleIdx, currentProjectName]);

  // Load project from file
  const loadProjectFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if(data.type !== 'lv-designer-project' && !data.version) {
          alert('Invalid project file');
          return;
        }
        setBgUrl(data.bgUrl || '');
        setBgW(data.bgW || 0);
        setBgH(data.bgH || 0);
        setPdfScale(data.pdfScale || 1);
        setElements(data.elements || []);
        setCables(data.cables || []);
        setDrawings(data.drawings || []);
        setTexts(data.texts || []);
        setStamp(data.stamp || null);
        setMeasures(data.measures || []);
        setGroups(data.groups || []);
        setElementCounts(data.elementCounts || {});
        setLabels(data.labels || []);
        setLabelCounts(data.labelCounts || { zone: 0, cam: 0, data: 0, speaker: 0, custom: 0 });
        setInfoBox(data.infoBox || { x: 50, y: 50, visible: false });
        setLayers(data.layers || {alarm:true,fire:true,cctv:true,sound:true,automation:true,tv:true,data:true,cables:true,drawings:true,texts:true,stamp:true,measures:true,infobox:true,labels:true});
        setScaleIdx(data.scaleIdx ?? 2);
        setCurrentProjectName(data.name || 'Untitled');
        setShowFileMenu(false);
        setTimeout(() => fitToView(data.bgW, data.bgH), 100);
      } catch(e) {
        console.error(e);
        alert('Error loading project file');
      }
    };
    reader.readAsText(file);
  }, [fitToView]);

  // Open project file dialog
  const openProjectFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.lvproj,.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if(file) loadProjectFile(file);
    };
    input.click();
    setShowFileMenu(false);
  }, [loadProjectFile]);

  // Print
  const printPlan = useCallback(() => {
    window.print();
    setShowFileMenu(false);
  }, []);

  const exportAs = (format: string) => {
    const canvasEl = document.createElement('canvas');
    const cw = bgW || 1920;
    const ch = bgH || 1080;
    canvasEl.width = cw;
    canvasEl.height = ch;
    const ctx = canvasEl.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,cw,ch);

    const doExport = () => {
      // Draw elements
      elements.forEach(el => {
        const def = ELEMENTS.find(d=>d.id===el.defId);
        if(!def) return;
        const color = CATEGORY_COLORS[def.category];
        const iconSize = ICON_SIZES[el.size];
        ctx.save();
        ctx.translate(el.x + iconSize/2, el.y + iconSize/2);
        ctx.rotate(el.rotation * Math.PI/180);
        ctx.beginPath();
        ctx.arc(0,0, iconSize/2, 0, Math.PI*2);
        ctx.fillStyle = color + '40';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        ctx.font = 'bold 14px system-ui';
        ctx.fillStyle = '#333';
        ctx.fillText(el.label + (el.zone ? ` [Z${el.zone}]` : ''), el.x + el.labelOffsetX, el.y + el.labelOffsetY);
      });

      // Draw cables
      cables.forEach(c => {
        if(c.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(c.points[0].x, c.points[0].y);
        c.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Export
      if(format === 'pdf') {
        import('jspdf').then(({jsPDF}) => {
          const pdf = new jsPDF({ orientation: cw>ch?'landscape':'portrait', unit:'px', format:[cw,ch] });
          pdf.addImage(canvasEl.toDataURL('image/png'), 'PNG', 0,0, cw, ch);
          pdf.save('floor-plan.pdf');
        });
      } else {
        const mime = format === 'png' ? 'image/png' : 'image/jpeg';
        const link = document.createElement('a');
        link.download = `floor-plan.${format}`;
        link.href = canvasEl.toDataURL(mime, 0.95);
        link.click();
      }
    };

    if(bgUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { ctx.drawImage(img, 0,0, cw, ch); doExport(); };
      img.onerror = () => doExport();
      img.src = bgUrl;
    } else {
      doExport();
    }
  };

  // ---- Measure distance ----
  const getMeasureText = (p1: {x:number;y:number}, p2: {x:number;y:number}) => {
    const pxDist = Math.hypot(p2.x-p1.x, p2.y-p1.y);
    const feet = pxDist / scale.ratio;
    const ft = Math.floor(feet);
    const inches = Math.round((feet - ft) * 12);
    return `${ft}'-${inches}"`;
  };

  // ---- Calculate cable length ----
  const getCableLength = (cable: Cable) => {
    let total = 0;
    for(let i = 0; i < cable.points.length - 1; i++) {
      total += Math.hypot(cable.points[i+1].x - cable.points[i].x, cable.points[i+1].y - cable.points[i].y);
    }
    return total / scale.ratio; // feet
  };

  // ---- Get element counts for info box ----
  const getElementCounts = () => {
    const counts: Record<string, number> = {};
    elements.forEach(el => {
      counts[el.defId] = (counts[el.defId] || 0) + 1;
    });
    return counts;
  };

  // ---- Get cable lengths by type ----
  const getCableLengthsByType = () => {
    const lengths: Record<CableType, number> = {alarm:0,fire:0,speaker:0,data:0,hdmi:0,coax:0,fiber:0,automation:0};
    cables.forEach(c => {
      lengths[c.type] += getCableLength(c);
    });
    return lengths;
  };

  // ---- Ruler ticks ----
  const renderRulerH = () => {
    if(!showRuler) return null;
    const wrap = wrapRef.current;
    const scrollLeft = wrap?.scrollLeft || 0;
    const w = wrap?.clientWidth || 1200;
    const step = Math.max(50, Math.round(100 / zoom));
    const ticks: React.ReactNode[] = [];
    const start = Math.floor(scrollLeft / (step*zoom)) * step;
    for(let i = start; i < start + w/zoom + step; i += step) {
      const px = i * zoom + pan.x - scrollLeft;
      if(px < -20 || px > w+20) continue;
      const feet = i / scale.ratio;
      const label = `${feet.toFixed(1)}'`;
      ticks.push(<g key={i}><line x1={px} y1={18} x2={px} y2={28} stroke="#6a6a8a" strokeWidth={1}/><text x={px+3} y={14} fill="#8a8aaa" fontSize={9}>{label}</text></g>);
    }
    return <svg className="ruler-h" style={{width:`calc(100% - 28px)`}}>{ticks}</svg>;
  };

  const renderRulerV = () => {
    if(!showRuler) return null;
    const wrap = wrapRef.current;
    const scrollTop = wrap?.scrollTop || 0;
    const h = wrap?.clientHeight || 800;
    const step = Math.max(50, Math.round(100 / zoom));
    const ticks: React.ReactNode[] = [];
    const start = Math.floor(scrollTop / (step*zoom)) * step;
    for(let i = start; i < start + h/zoom + step; i += step) {
      const py = i * zoom + pan.y - scrollTop;
      if(py < -20 || py > h+20) continue;
      const feet = i / scale.ratio;
      const label = `${feet.toFixed(1)}'`;
      ticks.push(<g key={i}><line x1={18} y1={py} x2={28} y2={py} stroke="#6a6a8a" strokeWidth={1}/><text x={2} y={py-2} fill="#8a8aaa" fontSize={9} transform={`rotate(-90,2,${py-2})`}>{label}</text></g>);
    }
    return <svg className="ruler-v" style={{height:`calc(100% - 28px)`}}>{ticks}</svg>;
  };

  // Hidden file input for floor plan upload
  const fileInputEl = (
    <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.bmp,.svg,.gif,.webp,.tiff,.dwg,.dxf,.psd" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f);}}/>
  );

  const rulerOff = showRuler ? 28 : 0;
  const canvasW = Math.max((bgW || 1920) * zoom + pan.x + 600, 3000);
  const canvasH = Math.max((bgH || 1080) * zoom + pan.y + 600, 3000);

  // Auto cursor based on hover
  const getCursor = () => {
    if(tool === 'pan') return 'grab';
    if(tool === 'place' && placingDef) return 'crosshair';
    if(tool === 'cable' || tool === 'measure') return 'crosshair';
    if(tool === 'pen' || tool === 'highlighter') return 'crosshair';
    if(hoveredElement) return 'move';
    if(tool === 'select' && placingDef) return 'crosshair';
    return 'default';
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f0f23] text-white overflow-hidden" style={{userSelect:'none'}}>
      {/* Hidden file input */}
      {fileInputEl}
      
      {/* Top Toolbar */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-[#16162e] border-b border-[#2a2a4a] flex-shrink-0 flex-wrap" style={{minHeight:48}}>
        {/* File Menu */}
        <div className="relative">
          <button onClick={()=>setShowFileMenu(f=>!f)} className="px-3 py-1.5 bg-[#22223a] text-gray-300 hover:bg-[#2a2a50] rounded text-sm font-medium">
            📁 File
          </button>
          {showFileMenu && (
            <div className="absolute top-full left-0 mt-1 bg-[#1e1e38] border border-[#3a3a5c] rounded-lg shadow-2xl z-50 min-w-[200px] py-1" 
              onClick={e=>e.stopPropagation()}>
              <button onClick={()=>{fileRef.current?.click();setShowFileMenu(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a50] flex items-center gap-2">
                📂 <span>Open Floor Plan...</span>
              </button>
              <button onClick={openProjectFile} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a50] flex items-center gap-2">
                📁 <span>Open Project (.lvproj)</span>
              </button>
              <div className="border-t border-[#3a3a5c] my-1"/>
              <button onClick={saveProject} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a50] flex items-center gap-2">
                💾 <span>Save Project</span>
              </button>
              <button onClick={saveProjectAsFile} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a50] flex items-center gap-2">
                📥 <span>Save As File (.lvproj)</span>
              </button>
              <div className="border-t border-[#3a3a5c] my-1"/>
              <button onClick={()=>{exportAs('png');setShowFileMenu(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a50] flex items-center gap-2">
                🖼️ <span>Export as PNG</span>
              </button>
              <button onClick={()=>{exportAs('jpg');setShowFileMenu(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a50] flex items-center gap-2">
                🖼️ <span>Export as JPG</span>
              </button>
              <button onClick={()=>{exportAs('pdf');setShowFileMenu(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a50] flex items-center gap-2">
                📄 <span>Export as PDF</span>
              </button>
              <div className="border-t border-[#3a3a5c] my-1"/>
              <button onClick={printPlan} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a50] flex items-center gap-2">
                🖨️ <span>Print</span>
              </button>
              <div className="border-t border-[#3a3a5c] my-1"/>
              <button onClick={()=>{handleReset();setShowFileMenu(false);}} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 flex items-center gap-2">
                ❌ <span>Close Project</span>
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-[#3a3a5c] mx-1"/>

        {/* Tool buttons */}
        {([
          ['select','↖️','Select'],['pan','✋','Pan'],['place','📌','Place'],['cable','🔌','Cable'],
          ['pen','✏️','Pen'],['highlighter','🖍️','Highlight'],['text','🔤','Text'],['eraser','🧹','Eraser'],['measure','📏','Measure'],['label','🏷️','Label'],
        ] as [ToolMode,string,string][]).map(([t,icon,label])=>(
          <button key={t} onClick={()=>{
            setTool(t);
            if(t!=='place')setPlacingDef(null);
            // When clicking Label button, also switch to Labels tab in sidebar
            if(t==='label') setSideTab('labels');
            if(t==='cable') setSideTab('cables');
            if(t==='measure') setSideTab('measure');
            if(t==='pen' || t==='highlighter' || t==='text' || t==='eraser') setSideTab('draw');
          }} title={label}
            className={`px-2.5 py-1.5 rounded text-sm font-medium transition-all ${tool===t?'bg-blue-600 text-white shadow-md':'bg-[#22223a] text-gray-300 hover:bg-[#2a2a50]'}`}>
            {icon} <span className="hidden lg:inline ml-1">{label}</span>
          </button>
        ))}

        <div className="w-px h-6 bg-[#3a3a5c] mx-1"/>

        {/* Zoom */}
        <button onClick={()=>setZoom(z=>Math.max(0.05,z-0.1))} className="px-2 py-1 bg-[#22223a] rounded text-sm hover:bg-[#2a2a50]">−</button>
        <span className="text-xs text-gray-400 w-12 text-center">{(zoom*100).toFixed(0)}%</span>
        <button onClick={()=>setZoom(z=>Math.min(5,z+0.1))} className="px-2 py-1 bg-[#22223a] rounded text-sm hover:bg-[#2a2a50]">+</button>
        <button onClick={()=>fitToView()} className="px-2 py-1 bg-[#22223a] rounded text-xs hover:bg-[#2a2a50]" title="Fit to View">Fit</button>
        <button onClick={()=>{setZoom(1);setPan({x:30,y:30});}} className="px-2 py-1 bg-[#22223a] rounded text-xs hover:bg-[#2a2a50]">100%</button>

        <div className="w-px h-6 bg-[#3a3a5c] mx-1"/>

        {/* Display mode */}
        <select value={globalDisplay} onChange={e=>{const v=e.target.value as DisplayMode;setGlobalDisplay(v);}}
          className="bg-[#22223a] text-gray-300 text-xs px-2 py-1.5 rounded border border-[#3a3a5c]">
          <option value="icon">Icon Only</option><option value="name">Name Only</option><option value="both">Icon + Name</option>
        </select>

        {/* Size */}
        <select value={globalSize} onChange={e=>setGlobalSize(e.target.value as IconSize)}
          className="bg-[#22223a] text-gray-300 text-xs px-2 py-1.5 rounded border border-[#3a3a5c]">
          <option value="xs">XS</option><option value="s">S</option><option value="m">M</option><option value="l">L</option><option value="xl">XL</option>
        </select>

        {/* Ruler */}
        <button onClick={()=>setShowRuler(r=>!r)} className={`px-2 py-1 rounded text-sm ${showRuler?'bg-yellow-700':'bg-[#22223a]'} hover:bg-yellow-600`}>📏</button>

        {/* Scale */}
        <select value={scaleIdx} onChange={e=>setScaleIdx(Number(e.target.value))}
          className="bg-[#22223a] text-gray-300 text-xs px-2 py-1.5 rounded border border-[#3a3a5c]">
          {SCALE_PRESETS.map((s,i)=><option key={i} value={i}>{s.label}</option>)}
        </select>

        <div className="w-px h-6 bg-[#3a3a5c] mx-1"/>

        {/* Undo/Redo */}
        <button onClick={undo} className="px-2 py-1 bg-[#22223a] rounded text-sm hover:bg-[#2a2a50]" title="Undo (Ctrl+Z)">↩️</button>
        <button onClick={redo} className="px-2 py-1 bg-[#22223a] rounded text-sm hover:bg-[#2a2a50]" title="Redo (Ctrl+Y)">↪️</button>

        {/* Info Box */}
        <button onClick={()=>setInfoBox(prev=>({...prev,visible:!prev.visible}))} className={`px-2 py-1 rounded text-sm ${infoBox.visible?'bg-green-700':'bg-[#22223a]'} hover:bg-green-600`} title="Info Box">📊</button>

        {/* Stamp */}
        <button onClick={()=>setShowStampModal(true)} className="px-2 py-1 bg-[#22223a] rounded text-sm hover:bg-[#2a2a50]" title="Company Stamp">🏢</button>

        <div className="w-px h-6 bg-[#3a3a5c] mx-1"/>

        {/* Delete */}
        <button onClick={()=>{
          // Delete function - handles labels, measures, and elements
          let deleted = false;
          
          // 1. Delete selected labels
          if(selectedLabel) {
            const labelToDelete = labels.find(l => l.uid === selectedLabel);
            if(labelToDelete) {
              setLabels(prev => {
                const remaining = prev.filter(l => l.uid !== selectedLabel);
                // Renumber remaining labels of same type
                let count = 0;
                return remaining.map(l => {
                  if(l.type === labelToDelete.type) {
                    count += labelIncrement;
                    return {...l, number: count};
                  }
                  return l;
                });
              });
              const remainingCount = labels.filter(l => l.uid !== selectedLabel && l.type === labelToDelete.type).length;
              setLabelCounts(prev => ({...prev, [labelToDelete.type]: remainingCount * labelIncrement}));
              setSelectedLabel(null);
              deleted = true;
            }
          }
          
          // 2. Delete selected measurements
          if(selectedMeasure) {
            setMeasures(prev => prev.filter(m => m.uid !== selectedMeasure));
            setSelectedMeasure(null);
            deleted = true;
          }
          
          // 3. Delete selected pipe
          if(selectedPipe) {
            setSprinklerPipes(prev => prev.filter(p => p.uid !== selectedPipe));
            setSelectedPipe(null);
            deleted = true;
          }

          // 4. Delete selected elements
          if(selected.length > 0) {
            const toDelete = elements.filter(el => selected.includes(el.uid));
            const defIdsToRenumber = [...new Set(toDelete.map(el => el.defId))];
            
            setElements(prev => {
              let remaining = prev.filter(el => !selected.includes(el.uid));
              // Renumber elements for each affected type
              defIdsToRenumber.forEach(defId => {
                let count = 0;
                remaining = remaining.map(el => {
                  if(el.defId === defId) {
                    count++;
                    const def = ELEMENTS.find(d => d.id === defId);
                    return {...el, number: count, label: `${def?.name || defId}-${formatNumber(count)}`};
                  }
                  return el;
                });
                // Update the element count for this type
                setElementCounts(pc => ({...pc, [defId]: count}));
              });
              return remaining;
            });
            setSelected([]);
            deleted = true;
          }
          
          if(deleted) pushHistory();
        }} className="px-2.5 py-1.5 bg-red-800 hover:bg-red-700 rounded text-sm font-medium" title="Delete Selected (Del)">
          🗑️ <span className="hidden lg:inline ml-1">Delete</span>
        </button>

        {/* Reset - keeps floor plan */}
        <button onClick={()=>{
          setElements([]); setSelected([]); setPlacingDef(null);
          setCables([]); setDrawingCable([]);
          setDrawings([]); setCurDraw([]); setTexts([]);
          setGroups([]); setStamp(null); setMeasures([]); setDrawingMeasure([]);
          setSprinklerPipes([]); setDrawingPipe([]); setSelectedPipe(null);
          setElementCounts({});
          setSelectedMeasure(null);
          setInfoBox({x:50,y:50,visible:false});
          setLabels([]); setLabelCounts({ zone: 0, cam: 0, data: 0, speaker: 0, tv: 0, tel: 0, ap: 0, custom: 0 }); setSelectedLabel(null);
          setHistory([]); setHistIdx(-1);
          pushHistory();
        }} className="px-3 py-1.5 bg-orange-800 hover:bg-orange-700 rounded text-sm font-semibold ml-auto" title="Clear all elements (keeps floor plan)">
          🔄 Reset
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 bg-[#14142a] border-r border-[#2a2a4a] flex flex-col flex-shrink-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[#2a2a4a] flex-shrink-0 flex-wrap">
            {(['elements','cables','draw','labels','layers','measure','save'] as const).map(t=>(
              <button key={t} onClick={()=>setSideTab(t)}
                className={`px-3 py-2 text-xs font-medium capitalize ${sideTab===t?'bg-[#1e1e3a] text-blue-400 border-b-2 border-blue-500':'text-gray-500 hover:text-gray-300'}`}>
                {t==='elements'?'📋':t==='cables'?'🔌':t==='draw'?'✏️':t==='labels'?'🏷️':t==='layers'?'📂':t==='measure'?'📏':'💾'} {t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* Elements Tab */}
            {sideTab === 'elements' && <>
              <div className="flex flex-wrap gap-1 mb-2">
                {CATS.map(c=>(
                  <button key={c} onClick={()=>setCatFilter(c)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${catFilter===c ? 'text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                    style={{background:catFilter===c?CATEGORY_COLORS[c]+'90':'#1e1e38'}}>
                    {CATEGORY_LABELS[c].split(' ')[0]}
                  </button>
                ))}
              </div>
              {/* Color controls: per-category, all-black, reset */}
              <div className="mb-2 p-2 bg-[#1a1a30] rounded-lg space-y-2">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs text-gray-500 mr-1">🎨 Category:</span>
                  <label className="flex items-center gap-1 cursor-pointer" title={`Change all ${CATEGORY_LABELS[catFilter]} icons color`}>
                    <input type="color" value={iconColors[`__cat_${catFilter}__`] || CATEGORY_COLORS[catFilter]} onChange={e=>{
                      const color = e.target.value;
                      const updated = {...iconColors, [`__cat_${catFilter}__`]: color};
                      ELEMENTS.filter(el=>el.category===catFilter).forEach(el => { updated[el.id] = color; });
                      setIconColors(updated);
                      localStorage.setItem('lv_icon_colors', JSON.stringify(updated));
                    }} className="w-6 h-6 rounded cursor-pointer bg-transparent border-none"/>
                    <span className="text-xs text-gray-300">{CATEGORY_LABELS[catFilter]}</span>
                  </label>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <button onClick={()=>{
                    const updated: Record<string,string> = {...iconColors};
                    ELEMENTS.forEach(el => { updated[el.id] = '#000000'; });
                    updated['__all__'] = '#000000';
                    setIconColors(updated);
                    localStorage.setItem('lv_icon_colors', JSON.stringify(updated));
                  }} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-white border border-gray-600" title="Black & White for printing">
                    ⬛ B&W Print
                  </button>
                  <button onClick={()=>{
                    setIconColors({});
                    localStorage.removeItem('lv_icon_colors');
                  }} className="px-2 py-1 bg-[#22223a] hover:bg-[#2a2a50] rounded text-xs text-gray-300" title="Reset to original category colors">
                    🔄 Original Colors
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {ELEMENTS.filter(el=>el.category===catFilter).map(el=>{
                  const displayName = customElementNames[el.id] || el.shortName || el.name;
                  const isEditing = editingElementDef === el.id;
                  return (
                    <div key={el.id} className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all ${placingDef===el.id?'bg-blue-700/40 ring-1 ring-blue-500':'bg-[#1e1e38] hover:bg-[#26264a]'}`}>
                      {isEditing ? (
                        <>
                          <div className="flex-shrink-0"><SchematicIcon defId={el.id} category={el.category} size={32}/></div>
                          <input 
                            type="text" 
                            value={editingElementName}
                            onChange={e=>setEditingElementName(e.target.value)}
                            className="flex-1 bg-[#22223a] border border-[#3a3a5c] rounded px-2 py-1 text-xs text-white"
                            placeholder={el.shortName || el.name}
                            autoFocus
                          />
                          <button onClick={()=>{
                            if(editingElementName.trim()) {
                              setCustomElementNames(prev => {
                                const updated = {...prev, [el.id]: editingElementName.trim()};
                                localStorage.setItem('lv_element_names', JSON.stringify(updated));
                                return updated;
                              });
                            }
                            setEditingElementDef(null);
                            setEditingElementName('');
                          }} className="text-green-400 hover:text-green-300 text-sm px-1">✓</button>
                          <button onClick={()=>{setEditingElementDef(null);setEditingElementName('');}} className="text-gray-500 hover:text-gray-300 text-sm px-1">✕</button>
                        </>
                      ) : (
                        <>
                          <div className="flex-shrink-0 cursor-pointer" onClick={()=>{setPlacingDef(el.id);setTool('place');}}>
                            <SchematicIcon defId={el.id} category={el.category} size={32} customColor={iconColors[el.id]}/>
                          </div>
                          <div className="flex-1 cursor-pointer" onClick={()=>{setPlacingDef(el.id);setTool('place');}}>
                            <span className="text-sm text-gray-200 font-medium">{el.name}</span>
                            {(customElementNames[el.id] || el.shortName) && (
                              <span className="text-xs text-gray-500 ml-1">({displayName})</span>
                            )}
                          </div>
                          {/* Color picker for icon */}
                          <input 
                            type="color" 
                            value={iconColors[el.id] || CATEGORY_COLORS[el.category]} 
                            onChange={e=>{
                              const updated = {...iconColors, [el.id]: e.target.value};
                              setIconColors(updated);
                              localStorage.setItem('lv_icon_colors', JSON.stringify(updated));
                            }}
                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-none"
                            title="Change icon color"
                          />
                          <button onClick={()=>{setEditingElementDef(el.id);setEditingElementName(customElementNames[el.id]||el.shortName||'');}} className="text-gray-500 hover:text-white text-sm px-1" title="Edit short name">✏️</button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>}

            {/* Cables Tab */}
            {sideTab === 'cables' && <>
              <p className="text-xs text-gray-500 mb-2">Select cable type, then click on canvas to draw. Double-click to finish.</p>
              
              <div className="flex gap-2 mb-3">
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={showCableLengths} onChange={e=>setShowCableLengths(e.target.checked)} className="accent-blue-500"/>
                  Show lengths
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={curvedCables} onChange={e=>setCurvedCables(e.target.checked)} className="accent-purple-500"/>
                  Curved
                </label>
              </div>

              {(Object.keys(CABLE_LABELS) as CableType[]).map(ct=>(
                <button key={ct} onClick={()=>{setCableType(ct);setCableColor(CABLE_COLORS[ct]);setTool('cable');}}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left ${cableType===ct&&tool==='cable'?'bg-blue-700/30 ring-1 ring-blue-500':'bg-[#1e1e38] hover:bg-[#26264a]'}`}>
                  <div className="w-5 h-1 rounded" style={{background:CABLE_COLORS[ct]}}/>
                  <span className="text-sm text-gray-300">{CABLE_LABELS[ct]}</span>
                </button>
              ))}
              <div className="mt-3">
                <label className="text-xs text-gray-500">Custom Color</label>
                <input type="color" value={cableColor} onChange={e=>setCableColor(e.target.value)} className="w-full h-8 rounded cursor-pointer bg-transparent"/>
              </div>
              {cables.length > 0 && <div className="mt-3 border-t border-[#2a2a4a] pt-2">
                <p className="text-xs text-gray-500 mb-1">Placed Cables ({cables.length})</p>
                {cables.map(c=>(
                  <div key={c.uid} className="flex items-center gap-2 px-2 py-1 rounded bg-[#1e1e38] mb-1">
                    <div className="w-4 h-1 rounded" style={{background:c.color}}/>
                    <span className="text-xs text-gray-400 flex-1">{CABLE_LABELS[c.type]} - {getCableLength(c).toFixed(1)}'</span>
                    <button onClick={()=>setCables(prev=>prev.filter(cc=>cc.uid!==c.uid))} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                  </div>
                ))}
              </div>}
            </>}

            {/* Piping Tab Removed */}
            {false && <>
              <p className="text-xs text-gray-500 mb-2">Draw pipe runs or place fittings. Double-click to finish pipe run.</p>
              
              {/* Pipe Color */}
              <div className="mb-3 flex items-center gap-2">
                <label className="text-xs text-gray-500">Pipe Color:</label>
                <input type="color" value={pipeColor} onChange={e=>setPipeColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"/>
                <button onClick={()=>setPipeColor('#3b82f6')} className="text-xs text-blue-400 hover:text-blue-300">Blue</button>
                <button onClick={()=>setPipeColor('#ef4444')} className="text-xs text-red-400 hover:text-red-300">Red</button>
                <button onClick={()=>setPipeColor('#000000')} className="text-xs text-gray-400 hover:text-gray-300">Black</button>
              </div>

              {/* Pipe Runs - drawn by clicking */}
              <div className="mb-3">
                <label className="text-xs text-gray-400 mb-1 block font-bold">📏 Pipe Runs (draw)</label>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  {[
                    {id:'main',label:'Main Pipe'},
                    {id:'branch',label:'Branch Pipe'},
                  ].map(pt=>(
                    <button key={pt.id} onClick={()=>{setSelectedPipeType(pt.id);setTool('sprinklerPipe');setDrawingPipe([]);}}
                      className={`px-2 py-2 rounded text-xs font-medium text-left ${selectedPipeType===pt.id && tool==='sprinklerPipe'?'ring-2 ring-cyan-500 bg-cyan-700/30':'bg-[#1e1e38] hover:bg-[#26264a]'}`}>
                      <span className="inline-block w-4 h-1 rounded mr-1" style={{background:pipeColor}}/> {pt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fittings - click to place */}
              <div className="mb-3">
                <label className="text-xs text-gray-400 mb-1 block font-bold">🔧 Fittings (click to place)</label>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    {id:'elbow_90',label:'90° Elbow',icon:'⌐'},
                    {id:'elbow_45',label:'45° Elbow',icon:'∠'},
                    {id:'tee',label:'Tee',icon:'⊤'},
                    {id:'reducer',label:'Reducer',icon:'◇'},
                    {id:'coupling',label:'Coupling',icon:'⊞'},
                    {id:'cap',label:'Cap',icon:'⊡'},
                  ].map(ft=>(
                    <button key={ft.id} onClick={()=>{setSelectedPipeType(ft.id);setTool('sprinklerPipe');setDrawingPipe([]);}}
                      className={`px-2 py-2 rounded text-xs font-medium text-left flex items-center gap-1 ${selectedPipeType===ft.id?'ring-2 ring-orange-500 bg-orange-700/30':'bg-[#1e1e38] hover:bg-[#26264a]'}`}>
                      <span className="text-base">{ft.icon}</span> {ft.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">Pipe Size</label>
                <select value={selectedPipeSize} onChange={e=>setSelectedPipeSize(e.target.value)}
                  className="w-full bg-[#22223a] border border-[#3a3a5c] rounded px-2 py-1.5 text-sm text-white">
                  {['1','1.25','1.5','2','2.5','3','4','6','8'].map(sz=>(
                    <option key={sz} value={sz}>{sz}"</option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-gray-600 mb-3">
                <strong>Pipe Runs:</strong> Click points, double-click to finish.<br/>
                <strong>Fittings:</strong> Click on plan to place.
              </p>
              
              {sprinklerPipes.length > 0 && <div className="border-t border-[#2a2a4a] pt-2">
                <p className="text-xs text-gray-500 mb-1">Placed Pipes ({sprinklerPipes.length})</p>
                {sprinklerPipes.map(p=>{
                  let len = 0;
                  for(let i=0;i<p.points.length-1;i++) len += Math.hypot(p.points[i+1].x-p.points[i].x, p.points[i+1].y-p.points[i].y);
                  const ft = len / scale.ratio;
                  return (
                    <div key={p.uid} className={`flex items-center gap-2 px-2 py-1 rounded mb-1 ${selectedPipe===p.uid?'bg-cyan-700/30 ring-1 ring-cyan-500':'bg-[#1e1e38]'}`}
                      onClick={()=>setSelectedPipe(p.uid)}>
                      <div className="w-4 h-1 rounded" style={{background:p.color}}/>
                      <span className="text-xs text-gray-400 flex-1">{p.pipeType} {p.size}" — {ft.toFixed(1)}'</span>
                      <button onClick={e=>{e.stopPropagation();setSprinklerPipes(prev=>prev.filter(pp=>pp.uid!==p.uid));if(selectedPipe===p.uid)setSelectedPipe(null);}} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                    </div>
                  );
                })}
                <div className="mt-2 p-2 bg-[#1a1a30] rounded">
                  <p className="text-xs text-gray-400 font-bold mb-1">Pipe Totals:</p>
                  {(() => {
                    const totals: Record<string, number> = {};
                    sprinklerPipes.forEach(p => {
                      let len = 0;
                      for(let i=0;i<p.points.length-1;i++) len += Math.hypot(p.points[i+1].x-p.points[i].x, p.points[i+1].y-p.points[i].y);
                      const key = `${p.pipeType} ${p.size}"`;
                      totals[key] = (totals[key]||0) + len / scale.ratio;
                    });
                    let grandTotal = 0;
                    return <>
                      {Object.entries(totals).map(([key, ft]) => {
                        grandTotal += ft;
                        return <div key={key} className="flex justify-between text-xs text-gray-300"><span>{key}</span><span className="text-cyan-400 font-bold">{ft.toFixed(1)}'</span></div>;
                      })}
                      <div className="flex justify-between text-xs text-white font-bold border-t border-[#3a3a5c] mt-1 pt-1"><span>Total</span><span className="text-green-400">{grandTotal.toFixed(1)}'</span></div>
                    </>;
                  })()}
                </div>
              </div>}
            </>}

            {/* Draw Tab */}
            {sideTab === 'draw' && <>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">Color</label>
                  <input type="color" value={drawColor} onChange={e=>setDrawColor(e.target.value)} className="w-full h-8 rounded cursor-pointer bg-transparent"/>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Size: {drawSize}px</label>
                  <input type="range" min={1} max={20} value={drawSize} onChange={e=>setDrawSize(Number(e.target.value))} className="w-full"/>
                </div>
                <div className="flex gap-1">
                  <button onClick={()=>setTool('pen')} className={`flex-1 py-2 rounded text-sm ${tool==='pen'?'bg-blue-600':'bg-[#1e1e38] hover:bg-[#26264a]'}`}>✏️ Pen</button>
                  <button onClick={()=>setTool('highlighter')} className={`flex-1 py-2 rounded text-sm ${tool==='highlighter'?'bg-yellow-700':'bg-[#1e1e38] hover:bg-[#26264a]'}`}>🖍️</button>
                  <button onClick={()=>setTool('text')} className={`flex-1 py-2 rounded text-sm ${tool==='text'?'bg-green-700':'bg-[#1e1e38] hover:bg-[#26264a]'}`}>🔤</button>
                  <button onClick={()=>setTool('eraser')} className={`flex-1 py-2 rounded text-sm ${tool==='eraser'?'bg-red-700':'bg-[#1e1e38] hover:bg-[#26264a]'}`}>🧹</button>
                </div>
              </div>
            </>}

            {/* Labels Tab */}
            {sideTab === 'labels' && <>
              <p className="text-xs text-gray-500 mb-2">Click ✏️ to edit label prefix, color, or increment. Click Use to start placing labels.</p>
              
              {/* Template Management */}
              <div className="mb-3 p-2 bg-[#1a1a30] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400 flex-1">📋 Templates</span>
                  <button onClick={()=>setShowTemplateModal(true)} className="px-2 py-1 bg-blue-700 hover:bg-blue-600 rounded text-xs">Save Template</button>
                </div>
                {savedTemplates.length > 0 && (
                  <div className="space-y-1">
                    {savedTemplates.map((tmpl, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-[#22223a] rounded text-xs">
                        <span className="flex-1 text-gray-300">{tmpl.name}</span>
                        <button onClick={()=>{
                          setLabelPresets(tmpl.presets);
                          setCustomLabelTypes(tmpl.customLabels);
                          localStorage.setItem('lv_label_presets', JSON.stringify(tmpl.presets));
                          localStorage.setItem('lv_custom_labels', JSON.stringify(tmpl.customLabels));
                        }} className="text-blue-400 hover:text-blue-300">Load</button>
                        <button onClick={()=>{
                          const updated = savedTemplates.filter((_,i)=>i!==idx);
                          setSavedTemplates(updated);
                          localStorage.setItem('lv_label_templates', JSON.stringify(updated));
                        }} className="text-red-400 hover:text-red-300">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={()=>{
                  setLabelPresets([...DEFAULT_LABEL_PRESETS]);
                  setCustomLabelTypes([]);
                  localStorage.removeItem('lv_label_presets');
                  localStorage.removeItem('lv_custom_labels');
                }} className="w-full mt-2 py-1 bg-[#22223a] hover:bg-[#2a2a50] rounded text-xs text-gray-400">
                  Reset to Defaults
                </button>
              </div>
              
              {/* Label Types - Editable */}
              <div className="space-y-1 mb-3">
                {labelPresets.map((preset: LabelPreset, presetIdx: number) => (
                  <div key={preset.type} className={`rounded-lg transition-all ${labelType===preset.type && tool==='label' ? 'ring-2 ring-blue-500 bg-blue-700/20' : 'bg-[#1e1e38] hover:bg-[#26264a]'}`}>
                    {editingLabelType === preset.type ? (
                      // Editing mode
                      <div className="p-2 space-y-2">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={preset.prefix}
                            onChange={e => setLabelPresets(prev => prev.map((p,i) => i===presetIdx ? {...p, prefix: e.target.value} : p))}
                            className="flex-1 bg-[#22223a] border border-[#3a3a5c] rounded px-2 py-1 text-sm text-white"
                            placeholder="Prefix (e.g., Zn)"
                          />
                          <input 
                            type="color" 
                            value={preset.color}
                            onChange={e => setLabelPresets(prev => prev.map((p,i) => i===presetIdx ? {...p, color: e.target.value} : p))}
                            className="w-10 h-8 rounded cursor-pointer bg-transparent"
                          />
                        </div>
                        <div className="flex gap-2 items-center">
                          <label className="text-xs text-gray-500">Increment:</label>
                          <select 
                            value={preset.increment}
                            onChange={e => setLabelPresets(prev => prev.map((p,i) => i===presetIdx ? {...p, increment: Number(e.target.value)} : p))}
                            className="flex-1 bg-[#22223a] border border-[#3a3a5c] rounded px-2 py-1 text-xs text-white"
                          >
                            <option value={1}>+1</option>
                            <option value={2}>+2</option>
                            <option value={5}>+5</option>
                            <option value={10}>+10</option>
                          </select>
                          <button onClick={()=>{
                            setEditingLabelType(null);
                            localStorage.setItem('lv_label_presets', JSON.stringify(labelPresets));
                          }} className="px-2 py-1 bg-green-700 hover:bg-green-600 rounded text-xs">✓ Done</button>
                        </div>
                      </div>
                    ) : (
                      // Normal view
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <div className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs cursor-pointer" 
                          style={{background: preset.color}}
                          onClick={()=>{setLabelType(preset.type);setTool('label');setLabelIncrement(preset.increment);}}>
                          {preset.prefix.charAt(0)}
                        </div>
                        <div className="flex-1 cursor-pointer" onClick={()=>{setLabelType(preset.type);setTool('label');setLabelIncrement(preset.increment);}}>
                          <div className="text-sm font-medium text-white">{preset.prefix}</div>
                          <div className="text-xs text-gray-500">+{preset.increment} | Next: {preset.prefix} {String(labelCounts[preset.type] + preset.increment).padStart(3, '0')}</div>
                        </div>
                        <button onClick={()=>setEditingLabelType(preset.type)} className="text-gray-500 hover:text-white text-sm">✏️</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Custom Label Type */}
              <div className="mb-3 p-2 bg-[#1a1a30] rounded-lg">
                <div className="text-xs text-gray-400 mb-2">➕ Add Custom Label Type</div>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    placeholder="Prefix (TV, Tel, Net...)"
                    value={customLabelPrefix}
                    onChange={e => setCustomLabelPrefix(e.target.value)}
                    className="flex-1 bg-[#22223a] border border-[#3a3a5c] rounded px-2 py-1 text-sm text-white"
                  />
                  <input 
                    type="color" 
                    value={customLabelColor}
                    onChange={e => setCustomLabelColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer bg-transparent"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <select 
                    value={labelIncrement}
                    onChange={e => setLabelIncrement(Number(e.target.value))}
                    className="flex-1 bg-[#22223a] border border-[#3a3a5c] rounded px-2 py-1 text-xs text-white"
                  >
                    <option value={1}>+1</option>
                    <option value={2}>+2</option>
                    <option value={5}>+5</option>
                    <option value={10}>+10</option>
                  </select>
                  <button 
                    onClick={() => {
                      if(customLabelPrefix.trim()) {
                        // Add to custom label types
                        const newType: LabelPreset = {
                          type: 'custom',
                          prefix: customLabelPrefix.trim(),
                          color: customLabelColor,
                          increment: labelIncrement,
                        };
                        setCustomLabelTypes(prev => {
                          const updated = [...prev, newType];
                          localStorage.setItem('lv_custom_labels', JSON.stringify(updated));
                          return updated;
                        });
                        setCustomLabelPrefix('');
                      }
                    }}
                    className="px-3 py-1 bg-green-700 hover:bg-green-600 rounded text-xs text-white"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Custom Label Types */}
              {customLabelTypes.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-1">Custom Labels</div>
                  <div className="space-y-1">
                    {customLabelTypes.map((ct, idx) => (
                      <div key={idx} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${labelType==='custom' && customLabelPrefix===ct.prefix ? 'ring-2 ring-blue-500 bg-blue-700/20' : 'bg-[#1e1e38] hover:bg-[#26264a]'}`}>
                        <div className="w-5 h-5 rounded flex items-center justify-center text-white font-bold text-xs cursor-pointer" 
                          style={{background: ct.color}}
                          onClick={()=>{setLabelType('custom');setCustomLabelPrefix(ct.prefix);setCustomLabelColor(ct.color);setLabelIncrement(ct.increment);setTool('label');}}>
                          {ct.prefix.charAt(0)}
                        </div>
                        <span className="flex-1 text-sm text-white cursor-pointer" onClick={()=>{setLabelType('custom');setCustomLabelPrefix(ct.prefix);setCustomLabelColor(ct.color);setLabelIncrement(ct.increment);setTool('label');}}>{ct.prefix}</span>
                        <span className="text-xs text-gray-500">+{ct.increment}</span>
                        <button onClick={()=>{
                          setCustomLabelTypes(prev => {
                            const updated = prev.filter((_,i)=>i!==idx);
                            localStorage.setItem('lv_custom_labels', JSON.stringify(updated));
                            return updated;
                          });
                        }} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {labels.length > 0 && (
                <div className="border-t border-[#2a2a4a] pt-3 mt-3">
                  <p className="text-xs text-gray-500 mb-2">Placed Labels ({labels.length})</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {labels.map(l => (
                      <div key={l.uid} 
                        onClick={() => setSelectedLabel(l.uid)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer ${selectedLabel === l.uid ? 'bg-blue-700/30 ring-1 ring-blue-500' : 'bg-[#1e1e38] hover:bg-[#26264a]'}`}>
                        <div className="w-4 h-4 rounded text-white text-[10px] font-bold flex items-center justify-center" style={{background: l.color}}>
                          {l.prefix.charAt(0)}
                        </div>
                        <span className="text-xs text-white flex-1">{l.prefix} {String(l.number).padStart(3, '0')}</span>
                        <button onClick={(e)=>{
                          e.stopPropagation();
                          // Delete and renumber
                          setLabels(prev => {
                            const remaining = prev.filter(x => x.uid !== l.uid);
                            let count = 0;
                            return remaining.map(x => {
                              if(x.type === l.type) {
                                count++;
                                return {...x, number: count};
                              }
                              return x;
                            });
                          });
                          setLabelCounts(prev => ({...prev, [l.type]: Math.max(0, prev[l.type] - 1)}));
                          if(selectedLabel === l.uid) setSelectedLabel(null);
                        }} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>}

            {/* Layers Tab */}
            {sideTab === 'layers' && <>
              <div className="flex gap-1 mb-2">
                <button onClick={()=>setLayers(l=>{const n={...l};Object.keys(n).forEach(k=>n[k]=true);return n;})} className="flex-1 py-1 bg-[#1e1e38] rounded text-xs hover:bg-[#26264a]">Show All</button>
                <button onClick={()=>setLayers(l=>{const n={...l};Object.keys(n).forEach(k=>n[k]=false);return n;})} className="flex-1 py-1 bg-[#1e1e38] rounded text-xs hover:bg-[#26264a]">Hide All</button>
              </div>
              {CATS.map(c => {
                const count = elements.filter(e => ELEMENTS.find(d=>d.id===e.defId)?.category===c).length;
                return (
                  <label key={c} className="flex items-center gap-2 px-2 py-2 rounded bg-[#1e1e38] cursor-pointer hover:bg-[#26264a]">
                    <input type="checkbox" checked={layers[c]??true} onChange={e=>setLayers(l=>({...l,[c]:e.target.checked}))}
                      className="accent-blue-500"/>
                    <div className="w-3 h-3 rounded-sm" style={{background:CATEGORY_COLORS[c]}}/>
                    <span className="text-sm text-gray-300 flex-1">{CATEGORY_LABELS[c]}</span>
                    <span className="text-xs text-gray-600">{count}</span>
                  </label>
                );
              })}
              <div className="border-t border-[#2a2a4a] mt-2 pt-2 space-y-1">
                {[['cables','🔌','Cables',cables.length],['drawings','✏️','Drawings',drawings.length],['texts','🔤','Texts',texts.length],['labels','🏷️','Labels',labels.length],['measures','📏','Measures',measures.length],['stamp','🏢','Stamp',stamp?1:0],['infobox','📊','Info Box',infoBox.visible?1:0]].map(([key,icon,label,count])=>(
                  <label key={key as string} className="flex items-center gap-2 px-2 py-2 rounded bg-[#1e1e38] cursor-pointer hover:bg-[#26264a]">
                    <input type="checkbox" checked={layers[key as string]??true} onChange={e=>setLayers(l=>({...l,[key as string]:e.target.checked}))} className="accent-blue-500"/>
                    <span className="text-sm">{icon as string}</span>
                    <span className="text-sm text-gray-300 flex-1">{label as string}</span>
                    <span className="text-xs text-gray-600">{count as number}</span>
                  </label>
                ))}
              </div>
            </>}

            {/* Measure Tab */}
            {sideTab === 'measure' && <>
              <p className="text-xs text-gray-500 mb-2">Click on canvas to set measure points. Double-click to finish. Click a measure to select, then press Delete to remove.</p>
              <p className="text-xs text-gray-400 mb-2">Current scale: <strong className="text-yellow-400">{scale.label}</strong></p>
              <button onClick={()=>setTool('measure')} className={`w-full py-2 rounded text-sm font-medium ${tool==='measure'?'bg-yellow-700':'bg-[#1e1e38] hover:bg-[#26264a]'}`}>📏 Start Measuring</button>
              {measures.length > 0 && <div className="mt-3 border-t border-[#2a2a4a] pt-2 space-y-1">
                <p className="text-xs text-gray-500 mb-1">Measurements ({measures.length})</p>
                {measures.map(m=>(
                  <div key={m.uid} className={`flex items-center gap-2 px-2 py-1 rounded ${selectedMeasure===m.uid?'bg-yellow-700/30 ring-1 ring-yellow-500':'bg-[#1e1e38]'}`}
                    onClick={()=>setSelectedMeasure(m.uid)}>
                    <span className="text-xs text-yellow-400 flex-1">
                      {m.points.length >= 2 ? getMeasureText(m.points[0], m.points[m.points.length-1]) : '—'}
                    </span>
                    <button onClick={(e)=>{e.stopPropagation();setMeasures(prev=>prev.filter(mm=>mm.uid!==m.uid));if(selectedMeasure===m.uid)setSelectedMeasure(null);}} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                  </div>
                ))}
              </div>}
            </>}

            {/* Save Tab */}
            {sideTab === 'save' && <>
              <button onClick={saveProject} className="w-full py-2 bg-blue-700 hover:bg-blue-600 rounded text-sm font-medium mb-2">💾 Save Project</button>
              
              <div className="space-y-1 mb-3">
                <p className="text-xs text-gray-500 mb-1">Save As:</p>
                {['png','jpg','jpeg','pdf'].map(fmt=>(
                  <button key={fmt} onClick={()=>exportAs(fmt)} className="w-full py-1.5 bg-[#1e1e38] hover:bg-[#26264a] rounded text-xs text-gray-300 text-left px-3">
                    📥 Save as .{fmt.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="border-t border-[#2a2a4a] pt-2 space-y-1 mb-3">
                <p className="text-xs text-gray-500 mb-1">Convert Format:</p>
                {['png','jpg','pdf','svg'].map(fmt=>(
                  <button key={fmt} onClick={()=>exportAs(fmt)} className="w-full py-1.5 bg-[#1e1e38] hover:bg-[#26264a] rounded text-xs text-gray-300 text-left px-3">
                    🔄 Export as .{fmt.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="border-t border-[#2a2a4a] pt-2 space-y-1">
                <p className="text-xs text-gray-500 mb-1">Load Saved Projects:</p>
                {JSON.parse(localStorage.getItem('lv_projects')||'[]').map((proj: {name:string;date:string}, idx: number)=>(
                  <div key={idx} className="flex items-center gap-2 px-2 py-1.5 bg-[#1e1e38] rounded">
                    <span className="text-xs text-gray-300 flex-1">{proj.name}</span>
                    <span className="text-xs text-gray-600">{new Date(proj.date).toLocaleDateString()}</span>
                    <button onClick={()=>{
                      const projects = JSON.parse(localStorage.getItem('lv_projects')||'[]');
                      const p = projects[idx];
                      if(p){
                        setBgUrl(p.bgUrl||'');setBgW(p.bgW||0);setBgH(p.bgH||0);
                        setElements(p.elements||[]);setCables(p.cables||[]);
                        setDrawings(p.drawings||[]);setTexts(p.texts||[]);
                        setStamp(p.stamp);setMeasures(p.measures||[]);
                        setGroups(p.groups||[]);setElementCounts(p.elementCounts||{});
                      }
                    }} className="text-blue-400 hover:text-blue-300 text-xs">Load</button>
                    <button onClick={()=>{
                      const projects = JSON.parse(localStorage.getItem('lv_projects')||'[]');
                      projects.splice(idx,1);
                      localStorage.setItem('lv_projects',JSON.stringify(projects));
                    }} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                  </div>
                ))}
              </div>
            </>}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          {showRuler && renderRulerH()}
          {showRuler && renderRulerV()}
          {showRuler && <div className="absolute top-0 left-0 w-7 h-7 bg-[#12122a] z-20 border-r border-b border-[#3a3a5c] flex items-center justify-center">
            <span className="text-[8px] text-gray-600">ft</span>
          </div>}

          <div ref={wrapRef}
            className="canvas-wrap absolute overflow-auto"
            style={{top: rulerOff, left: rulerOff, right: 0, bottom: 0, cursor: getCursor()}}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleCanvasClick}
            onDoubleClick={handleDblClick}
            onContextMenu={e => handleContextMenu(e)}
          >
            <div ref={canvasRef} className="relative" style={{width: canvasW, height: canvasH, background:'#1a1a2e'}}>
              {/* Background image - rendered at pdfScale for quality, displayed at logical size */}
              {bgUrl && <img src={bgUrl} alt="floor plan" style={{
                position:'absolute', left: pan.x, top: pan.y,
                width: bgW * zoom, height: bgH * zoom,
                imageRendering: pdfScale > 1 ? 'auto' : 'auto', pointerEvents: 'none',
              }}/>}
              
              {/* Upload prompt when no floor plan */}
              {!bgUrl && (
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  onDragOver={e=>{e.preventDefault();}} 
                  onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)handleFile(f);}}
                >
                  <div className="text-center p-12 bg-[#1a1a32]/90 rounded-2xl border-2 border-dashed border-[#4a4a7a] max-w-lg backdrop-blur-sm">
                    <div className="text-6xl mb-6">📐</div>
                    <h1 className="text-3xl font-bold text-white mb-3">LV Designer Pro</h1>
                    <p className="text-gray-400 mb-6 text-lg">Low Voltage Floor Plan Designer</p>
                    <p className="text-gray-500 mb-6">Upload your floor plan to get started<br/>(PDF, JPG, PNG, BMP, SVG, GIF)</p>
                    <button onClick={()=>fileRef.current?.click()} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-lg font-semibold transition-all shadow-lg shadow-blue-900/40">
                      📁 Open Floor Plan
                    </button>
                    <p className="text-gray-600 mt-4 text-sm">or drag & drop a file here</p>
                  </div>
                </div>
              )}

              {/* SVG overlay for cables, drawings, measures */}
              <svg style={{position:'absolute',left:0,top:0,width:canvasW,height:canvasH,pointerEvents:'none',zIndex:5}}>
                {/* Cables */}
                {layers.cables && cables.map(c => {
                  const len = getCableLength(c);
                  // Generate path - curved or straight
                  let pathD = '';
                  if(c.curved && c.points.length >= 2) {
                    // Create smooth curve through points using quadratic bezier
                    const pts = c.points.map(p => ({x: p.x*zoom+pan.x, y: p.y*zoom+pan.y}));
                    pathD = `M ${pts[0].x},${pts[0].y}`;
                    for(let i = 1; i < pts.length - 1; i++) {
                      const midX = (pts[i].x + pts[i+1].x) / 2;
                      const midY = (pts[i].y + pts[i+1].y) / 2;
                      pathD += ` Q ${pts[i].x},${pts[i].y} ${midX},${midY}`;
                    }
                    if(pts.length > 1) {
                      pathD += ` L ${pts[pts.length-1].x},${pts[pts.length-1].y}`;
                    }
                  }
                  return (
                    <g key={c.uid}>
                      {c.curved ? (
                        <path d={pathD}
                          fill="none" stroke={c.color} strokeWidth={Math.max(2,3*zoom)} strokeLinecap="round" strokeLinejoin="round"
                          strokeDasharray={CABLE_DASH[c.type] || undefined}/>
                      ) : (
                        <polyline points={c.points.map(p=>`${p.x*zoom+pan.x},${p.y*zoom+pan.y}`).join(' ')}
                          fill="none" stroke={c.color} strokeWidth={Math.max(2,3*zoom)} strokeLinecap="round" strokeLinejoin="round"
                          strokeDasharray={CABLE_DASH[c.type] || undefined}/>
                      )}
                      {c.showLength && c.points.length >= 2 && (
                        <text
                          x={(c.points[0].x + c.points[c.points.length-1].x)/2*zoom+pan.x}
                          y={(c.points[0].y + c.points[c.points.length-1].y)/2*zoom+pan.y - 8}
                          fill={c.color} fontSize={12*Math.max(0.7,zoom)} fontWeight="bold" textAnchor="middle"
                          stroke="#000" strokeWidth={2} paintOrder="stroke">
                          {len.toFixed(1)}'
                        </text>
                      )}
                    </g>
                  );
                })}
                {/* Drawing cable in progress */}
                {drawingCable.length > 0 && <polyline points={drawingCable.map(p=>`${p.x*zoom+pan.x},${p.y*zoom+pan.y}`).join(' ')}
                  fill="none" stroke={cableColor} strokeWidth={Math.max(2,3*zoom)} strokeLinecap="round" strokeDasharray="6,4"/>}

                {/* Sprinkler Pipes Removed */}
                {false && sprinklerPipes.map(p => {
                  const isSelPipe = selectedPipe === p.uid;
                  const isFitting = p.points.length === 1;
                  let pipeLen = 0;
                  for(let j=0;j<p.points.length-1;j++) pipeLen += Math.hypot(p.points[j+1].x-p.points[j].x, p.points[j+1].y-p.points[j].y);
                  const ft = pipeLen / scale.ratio;
                  const fittingSymbols: Record<string,string> = {
                    'elbow_90':'⌐','elbow_45':'∠','tee':'⊤','reducer':'◇','coupling':'⊞','cap':'⊡'
                  };
                  return (
                    <g key={p.uid} style={{pointerEvents:'auto',cursor:'pointer'}} 
                      onClick={e=>{e.stopPropagation();setSelectedPipe(p.uid);}}>
                      {isFitting ? (
                        /* Fitting symbol */
                        <>
                          <circle cx={p.points[0].x*zoom+pan.x} cy={p.points[0].y*zoom+pan.y} r={16*zoom}
                            fill={isSelPipe?'rgba(255,255,255,0.2)':'rgba(0,0,0,0.3)'} stroke={isSelPipe?'#fff':p.color} strokeWidth={Math.max(2,3*zoom)}/>
                          <text x={p.points[0].x*zoom+pan.x} y={p.points[0].y*zoom+pan.y+6*zoom}
                            fill={isSelPipe?'#fff':p.color} fontSize={20*zoom} fontWeight="bold" textAnchor="middle"
                            style={{pointerEvents:'none'}}>
                            {fittingSymbols[p.pipeType] || '●'}
                          </text>
                          <text x={p.points[0].x*zoom+pan.x} y={p.points[0].y*zoom+pan.y+26*zoom}
                            fill={p.color} fontSize={11*Math.max(0.7,zoom)} fontWeight="bold" textAnchor="middle"
                            stroke="#000" strokeWidth={2} paintOrder="stroke">
                            {p.pipeType.replace('_',' ')} {p.size}"
                          </text>
                        </>
                      ) : (
                        /* Pipe run */
                        <>
                          <polyline points={p.points.map(pt=>`${pt.x*zoom+pan.x},${pt.y*zoom+pan.y}`).join(' ')}
                            fill="none" stroke={isSelPipe?'#fff':p.color} strokeWidth={Math.max(3,5*zoom)} strokeLinecap="round" strokeLinejoin="round"/>
                          {p.points.map((pt,pi)=><circle key={pi} cx={pt.x*zoom+pan.x} cy={pt.y*zoom+pan.y} r={isSelPipe?5:3} fill={isSelPipe?'#fff':p.color} stroke="#000" strokeWidth={1}/>)}
                          {/* Segment lengths */}
                          {p.points.length >= 2 && p.points.map((pt, pi) => {
                            if(pi === 0) return null;
                            const prev = p.points[pi-1];
                            const segLen = Math.hypot(pt.x-prev.x, pt.y-prev.y) / scale.ratio;
                            const mx = (prev.x+pt.x)/2*zoom+pan.x;
                            const my = (prev.y+pt.y)/2*zoom+pan.y;
                            return <text key={pi} x={mx} y={my - 8*zoom}
                              fill={p.color} fontSize={11*Math.max(0.7,zoom)} fontWeight="bold" textAnchor="middle"
                              stroke="#000" strokeWidth={2} paintOrder="stroke">
                              {segLen.toFixed(1)}'
                            </text>;
                          })}
                          {/* Total label */}
                          {p.points.length >= 2 && (
                            <text x={(p.points[0].x+p.points[p.points.length-1].x)/2*zoom+pan.x}
                              y={(p.points[0].y+p.points[p.points.length-1].y)/2*zoom+pan.y + 18*zoom}
                              fill={p.color} fontSize={13*Math.max(0.7,zoom)} fontWeight="bold" textAnchor="middle"
                              stroke="#000" strokeWidth={2} paintOrder="stroke">
                              {p.pipeType} {p.size}" — Total: {ft.toFixed(1)}'
                            </text>
                          )}
                        </>
                      )}
                    </g>
                  );
                })}
                {/* Drawing pipe removed */}

                {/* Drawings */}
                {layers.drawings && drawings.map(d => (
                  <polyline key={d.uid} points={d.points.map(p=>`${p.x*zoom+pan.x},${p.y*zoom+pan.y}`).join(' ')}
                    fill="none" stroke={d.color} strokeWidth={d.size*zoom} strokeLinecap="round" strokeLinejoin="round"
                    opacity={d.tool==='highlighter'?0.4:1}/>
                ))}
                {/* Current drawing */}
                {curDraw.length > 1 && <polyline points={curDraw.map(p=>`${p.x*zoom+pan.x},${p.y*zoom+pan.y}`).join(' ')}
                  fill="none" stroke={drawColor} strokeWidth={(tool==='highlighter'?Math.max(20,drawSize*3):drawSize)*zoom} strokeLinecap="round"
                  opacity={tool==='highlighter'?0.4:1}/>}

                {/* Measure lines */}
                {layers.measures && measures.map(m => (
                  <g key={m.uid} className={selectedMeasure===m.uid?'measure-selected':''} 
                    style={{pointerEvents:'auto',cursor:'pointer'}}
                    onClick={(e)=>{e.stopPropagation();setSelectedMeasure(m.uid);}}
                    onContextMenu={(e)=>{e.preventDefault();e.stopPropagation();handleContextMenu(e as unknown as React.MouseEvent, undefined, m.uid);}}>
                    <polyline points={m.points.map(p=>`${p.x*zoom+pan.x},${p.y*zoom+pan.y}`).join(' ')}
                      fill="none" stroke={selectedMeasure===m.uid?'#fff':m.color} strokeWidth={Math.max(2,3*zoom)} strokeDasharray="8,4"/>
                    {m.points.map((p,i)=><circle key={i} cx={p.x*zoom+pan.x} cy={p.y*zoom+pan.y} r={5} fill={selectedMeasure===m.uid?'#fff':m.color} stroke="#000" strokeWidth={1}/>)}
                    {m.points.length>=2 && <text
                      x={(m.points[0].x+m.points[m.points.length-1].x)/2*zoom+pan.x}
                      y={(m.points[0].y+m.points[m.points.length-1].y)/2*zoom+pan.y - 12}
                      fill="#fbbf24" fontSize={15*Math.max(0.7,zoom)} fontWeight="bold" textAnchor="middle"
                      stroke="#000" strokeWidth={3} paintOrder="stroke">
                      {getMeasureText(m.points[0], m.points[m.points.length-1])}
                    </text>}
                  </g>
                ))}
                {/* Drawing measure in progress */}
                {drawingMeasure.length > 0 && <>
                  <polyline points={drawingMeasure.map(p=>`${p.x*zoom+pan.x},${p.y*zoom+pan.y}`).join(' ')}
                    fill="none" stroke="#fbbf24" strokeWidth={2} strokeDasharray="6,4"/>
                  {drawingMeasure.map((p,i)=><circle key={i} cx={p.x*zoom+pan.x} cy={p.y*zoom+pan.y} r={5} fill="#fbbf24" stroke="#000" strokeWidth={1}/>)}
                  {drawingMeasure.length>=2 && <text
                    x={(drawingMeasure[0].x+drawingMeasure[drawingMeasure.length-1].x)/2*zoom+pan.x}
                    y={(drawingMeasure[0].y+drawingMeasure[drawingMeasure.length-1].y)/2*zoom+pan.y - 12}
                    fill="#fbbf24" fontSize={15} fontWeight="bold" textAnchor="middle"
                    stroke="#000" strokeWidth={3} paintOrder="stroke">
                    {getMeasureText(drawingMeasure[0], drawingMeasure[drawingMeasure.length-1])}
                  </text>}
                </>}
              </svg>

              {/* Text annotations */}
              {layers.texts && texts.map(t => (
                <div key={t.uid} style={{
                  position:'absolute', left: t.x*zoom+pan.x, top: t.y*zoom+pan.y,
                  color: t.color, fontSize: t.size * zoom, fontWeight: 700,
                  pointerEvents:'auto', cursor:'move', zIndex: 8,
                  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                  whiteSpace: 'nowrap',
                }}>{t.text}</div>
              ))}

              {/* Placed elements */}
              {elements.map(el => {
                const def = ELEMENTS.find(d=>d.id===el.defId);
                if(!def) return null;
                if(!layers[def.category]) return null;
                const isSel = selected.includes(el.uid);
                const isGrouped = !!el.groupId;
                const showLabel = el.display === 'both' || el.display === 'name';
                const showIcon = el.display === 'icon' || el.display === 'both';
                const iconSize = ICON_SIZES[el.size];
                const color = CATEGORY_COLORS[def.category];

                // Build label text with zone if applicable
                const labelText = el.label + (el.zone ? ` [Z${el.zone}]` : '');

                return (
                  <div key={el.uid} className="el-wrap" style={{
                    position:'absolute',
                    left: el.x * zoom + pan.x,
                    top: el.y * zoom + pan.y,
                    zIndex: isSel ? 20 : 10,
                  }}
                  onMouseEnter={()=>setHoveredElement(el.uid)}
                  onMouseLeave={()=>setHoveredElement(null)}>
                    {/* Leader line from icon center to label - always show when label is offset */}
                    {showIcon && (Math.abs(el.labelOffsetX) > 5 || Math.abs(el.labelOffsetY - iconSize - 6) > 10) && (
                      <svg style={{position:'absolute',left:0,top:0,width:600,height:600,pointerEvents:'none',overflow:'visible',zIndex:1}}>
                        <line 
                          x1={iconSize*zoom/2} 
                          y1={iconSize*zoom/2} 
                          x2={el.labelOffsetX*zoom + 30} 
                          y2={el.labelOffsetY*zoom + 10}
                          stroke={color} strokeWidth={2} strokeDasharray="6,3" opacity={0.8}/>
                        {/* Node circle at label end */}
                        <circle 
                          cx={el.labelOffsetX*zoom + 30} 
                          cy={el.labelOffsetY*zoom + 10}
                          r={4} fill={color} stroke="#fff" strokeWidth={1}/>
                        {/* Node circle at icon */}
                        <circle 
                          cx={iconSize*zoom/2} 
                          cy={iconSize*zoom/2}
                          r={4} fill={color} stroke="#fff" strokeWidth={1}/>
                      </svg>
                    )}

                    {/* Icon */}
                    {showIcon && (
                      <div
                        onMouseDown={e => handleElementMouseDown(e, el.uid)}
                        onContextMenu={e => handleContextMenu(e, el.uid)}
                        style={{
                          transform: `scale(${zoom}) rotate(${el.rotation}deg)`,
                          transformOrigin: 'top left',
                          cursor: 'move',
                          width: iconSize, height: iconSize,
                          borderRadius: 8,
                          outline: isSel ? '3px solid #3b82f6' : isGrouped ? '2px dashed #eab308' : 'none',
                          outlineOffset: 2,
                          background: isSel ? 'rgba(59,130,246,0.15)' : 'transparent',
                          position: 'relative',
                          zIndex: 2,
                        }}
                      >
                        <SchematicIcon defId={el.defId} category={def.category} size={iconSize} customColor={iconColors[el.defId]}/>
                      </div>
                    )}

                    {/* Name-only mode: colored badge */}
                    {el.display === 'name' && (
                      <div
                        onMouseDown={e => handleElementMouseDown(e, el.uid)}
                        onContextMenu={e => handleContextMenu(e, el.uid)}
                        style={{
                          background: color,
                          color: '#fff',
                          fontSize: 15 * zoom,
                          fontWeight: 700,
                          padding: `${4*zoom}px ${10*zoom}px`,
                          borderRadius: 6*zoom,
                          cursor: 'move',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                          outline: isSel ? '3px solid #3b82f6' : isGrouped ? '2px dashed #eab308' : 'none',
                          outlineOffset: 2,
                        }}
                      >
                        {labelText}
                      </div>
                    )}

                    {/* Movable label (for icon and both modes) */}
                    {showIcon && (
                      <div
                        className={`element-label ${el.display === 'icon' ? 'hover-label' : ''}`}
                        onMouseDown={e => {
                          e.stopPropagation();
                          const pos = canvasCoords(e);
                          setLabelDrag({uid: el.uid, ox: pos.x, oy: pos.y});
                        }}
                        style={{
                          left: el.labelOffsetX * zoom,
                          top: el.labelOffsetY * zoom,
                          fontSize: 15 * Math.max(zoom, 0.7),
                          background: color,
                          opacity: showLabel ? 1 : 0,
                          pointerEvents: 'auto',
                          zIndex: 3,
                        }}
                      >
                        {labelText}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Placed Labels (Zone 001, Cam 001, etc.) */}
              {layers.labels && labels.map(l => (
                <div key={l.uid}
                  onClick={(e) => { e.stopPropagation(); setSelectedLabel(l.uid); setSelected([]); setSelectedMeasure(null); }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedLabel(l.uid);
                    const pos = canvasCoords(e);
                    setLabelDragInfo({uid: l.uid, ox: pos.x, oy: pos.y});
                  }}
                  style={{
                    position: 'absolute',
                    left: l.x * zoom + pan.x,
                    top: l.y * zoom + pan.y,
                    background: l.color,
                    color: '#fff',
                    fontSize: l.size * Math.max(zoom, 0.6),
                    fontWeight: 700,
                    padding: `${4*zoom}px ${10*zoom}px`,
                    borderRadius: 6 * zoom,
                    cursor: 'move',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    outline: selectedLabel === l.uid ? '3px solid #fff' : 'none',
                    outlineOffset: 2,
                    zIndex: selectedLabel === l.uid ? 25 : 15,
                    userSelect: 'none',
                  }}>
                  {l.prefix} {String(l.number).padStart(3, '0')}
                </div>
              ))}

              {/* Info Box */}
              {infoBox.visible && layers.infobox && (
                <div className="info-box" style={{
                  position:'absolute',
                  left: infoBox.x * zoom + pan.x,
                  top: infoBox.y * zoom + pan.y,
                  transform: `scale(${Math.max(zoom, 0.6)})`,
                  transformOrigin: 'top left',
                  zIndex: 35,
                }}
                  onMouseDown={e => {
                    e.stopPropagation();
                    const pos = canvasCoords(e);
                    setInfoDrag({ox: pos.x, oy: pos.y});
                  }}>
                  <h3>📊 Project Summary</h3>
                  
                  <div className="info-box-section">
                    <h4>Elements ({elements.length})</h4>
                    {Object.entries(getElementCounts()).map(([defId, count]) => {
                      const def = ELEMENTS.find(d => d.id === defId);
                      return (
                        <div key={defId} className="info-box-row">
                          <span>{def?.name || defId}</span>
                          <span>{count}</span>
                        </div>
                      );
                    })}
                  </div>

                  {cables.length > 0 && (
                    <div className="info-box-section">
                      <h4>Cables ({cables.length})</h4>
                      {Object.entries(getCableLengthsByType()).filter(([,len]) => len > 0).map(([type, len]) => (
                        <div key={type} className="info-box-row">
                          <span>{CABLE_LABELS[type as CableType]}</span>
                          <span>{len.toFixed(1)}'</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sprinkler pipes removed */}

                  {labels.length > 0 && (
                    <div className="info-box-section">
                      <h4>Labels ({labels.length})</h4>
                      {labelPresets.map((preset: LabelPreset) => {
                        const count = labels.filter(l => l.type === preset.type).length;
                        if(count === 0) return null;
                        return (
                          <div key={preset.type} className="info-box-row">
                            <span>{preset.prefix}</span>
                            <span>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Stamp */}
              {stamp && layers.stamp && (
                <div style={{
                  position:'absolute',
                  left: stamp.x * zoom + pan.x,
                  top: stamp.y * zoom + pan.y,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  zIndex: 30,
                }}
                  onMouseDown={e => {
                    e.stopPropagation();
                    const pos = canvasCoords(e);
                    setStampDrag({ox: pos.x, oy: pos.y});
                  }}
                  onContextMenu={e => handleContextMenu(e)}
                >
                  <div className="border-2 border-gray-500 bg-white/95 text-gray-800 p-4 min-w-[280px] cursor-move" style={{fontFamily:'serif'}}>
                    <div className="text-center border-b-2 border-gray-400 pb-2 mb-2">
                      <div className="text-lg font-bold tracking-wide">{stamp.company}</div>
                      <div className="text-xs">{stamp.address}</div>
                      <div className="text-xs">{stamp.phone}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div><span className="font-semibold">License:</span> {stamp.license}</div>
                      <div><span className="font-semibold">Date:</span> {stamp.date}</div>
                      <div className="col-span-2"><span className="font-semibold">Project:</span> {stamp.project}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Properties panel for selected element */}
      {selected.length === 1 && (() => {
        const el = elements.find(e => e.uid === selected[0]);
        if(!el) return null;
        const def = ELEMENTS.find(d => d.id === el.defId);
        const showZone = def?.category === 'alarm' || def?.category === 'fire';
        return (
          <div className="absolute bottom-4 right-4 w-80 bg-[#1a1a32] border border-[#3a3a5c] rounded-xl p-4 shadow-2xl z-40">
            <div className="flex items-center gap-2 mb-3">
              {def && <SchematicIcon defId={el.defId} category={def.category} size={32}/>}
              <span className="text-sm font-semibold text-white">{def?.name} #{formatNumber(el.number)}</span>
              <button onClick={()=>setSelected([])} className="ml-auto text-gray-500 hover:text-white text-lg">✕</button>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-500">Label</label>
                <input value={el.label} onChange={e=>setElements(prev=>prev.map(p=>p.uid===el.uid?{...p,label:e.target.value}:p))}
                  className="w-full bg-[#22223a] border border-[#3a3a5c] rounded px-2 py-1 text-sm text-white"/>
              </div>
              {showZone && (
                <div>
                  <label className="text-xs text-gray-500">Zone Number</label>
                  <input value={el.zone||''} onChange={e=>setElements(prev=>prev.map(p=>p.uid===el.uid?{...p,zone:e.target.value}:p))}
                    placeholder="001" maxLength={3}
                    className="w-full bg-[#22223a] border border-[#3a3a5c] rounded px-2 py-1 text-sm text-white"/>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500">Notes</label>
                <input value={el.notes} onChange={e=>setElements(prev=>prev.map(p=>p.uid===el.uid?{...p,notes:e.target.value}:p))}
                  className="w-full bg-[#22223a] border border-[#3a3a5c] rounded px-2 py-1 text-sm text-white"/>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Display</label>
                  <select value={el.display} onChange={e=>setElements(prev=>prev.map(p=>p.uid===el.uid?{...p,display:e.target.value as DisplayMode}:p))}
                    className="w-full bg-[#22223a] border border-[#3a3a5c] rounded px-2 py-1 text-xs text-white">
                    <option value="icon">Icon Only</option><option value="name">Name Only</option><option value="both">Icon + Name</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Size</label>
                  <select value={el.size} onChange={e=>setElements(prev=>prev.map(p=>p.uid===el.uid?{...p,size:e.target.value as IconSize}:p))}
                    className="w-full bg-[#22223a] border border-[#3a3a5c] rounded px-2 py-1 text-xs text-white">
                    <option value="xs">XS (28)</option><option value="s">S (36)</option><option value="m">M (48)</option><option value="l">L (64)</option><option value="xl">XL (80)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Rotation</label>
                  <select value={el.rotation} onChange={e=>setElements(prev=>prev.map(p=>p.uid===el.uid?{...p,rotation:Number(e.target.value)}:p))}
                    className="w-full bg-[#22223a] border border-[#3a3a5c] rounded px-2 py-1 text-xs text-white">
                    {[0,45,90,135,180,225,270,315].map(r=><option key={r} value={r}>{r}°</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Context Menu */}
      {ctxMenu && (
        <div className="ctx-menu" style={{left: ctxMenu.x, top: ctxMenu.y}} onClick={e=>e.stopPropagation()}>
          {ctxMenu.measureUid ? <>
            <div className="ctx-label">Measurement</div>
            <button onClick={()=>ctxAction('delete_measure')} style={{color:'#f87171'}}>🗑️ Delete Measurement</button>
          </> : ctxMenu.elUid ? <>
            <div className="ctx-label">Transform</div>
            <button onClick={()=>ctxAction('rotate45')}>🔄 Rotate 45°</button>
            <button onClick={()=>ctxAction('rotate90')}>🔄 Rotate 90°</button>
            <button onClick={()=>ctxAction('rotate180')}>🔄 Rotate 180°</button>
            <div className="ctx-sep"/>
            <div className="ctx-label">Size</div>
            <button onClick={()=>ctxAction('size_xs')}>📐 XS (28px)</button>
            <button onClick={()=>ctxAction('size_s')}>📐 S (36px)</button>
            <button onClick={()=>ctxAction('size_m')}>📐 M (48px)</button>
            <button onClick={()=>ctxAction('size_l')}>📐 L (64px)</button>
            <button onClick={()=>ctxAction('size_xl')}>📐 XL (80px)</button>
            <div className="ctx-sep"/>
            <button onClick={()=>ctxAction('duplicate')}>📋 Duplicate</button>
            <button onClick={()=>ctxAction('front')}>⬆️ Bring to Front</button>
            <button onClick={()=>ctxAction('back')}>⬇️ Send to Back</button>
            <div className="ctx-sep"/>
            <div className="ctx-label">Display</div>
            <button onClick={()=>ctxAction('display_icon')}>👁️ Icon Only</button>
            <button onClick={()=>ctxAction('display_name')}>🔤 Name Only</button>
            <button onClick={()=>ctxAction('display_both')}>📌 Icon + Name</button>
            <div className="ctx-sep"/>
            {selected.length >= 2 && <button onClick={()=>ctxAction('group')}>🔗 Group Selected</button>}
            {elements.find(e=>e.uid===ctxMenu.elUid)?.groupId && <button onClick={()=>ctxAction('ungroup')}>🔓 Ungroup</button>}
            <button onClick={()=>ctxAction('delete')} style={{color:'#f87171'}}>🗑️ Delete</button>
          </> : <>
            <button onClick={()=>ctxAction('fitview')}>📐 Fit to View</button>
            <button onClick={()=>ctxAction('zoom100')}>🔍 Zoom 100%</button>
            <button onClick={()=>ctxAction('ruler')}>📏 Toggle Ruler</button>
            <div className="ctx-sep"/>
            <button onClick={()=>ctxAction('stamp')}>🏢 Add Stamp</button>
            <button onClick={()=>ctxAction('infobox')}>📊 Toggle Info Box</button>
          </>}
        </div>
      )}

      {/* Stamp Modal */}
      {showStampModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={()=>setShowStampModal(false)}>
          <div className="bg-[#1a1a32] border border-[#3a3a5c] rounded-2xl p-6 w-96 shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">🏢 Company Stamp</h3>
            {(['company','address','phone','license','project','date'] as const).map(field=>(
              <div key={field} className="mb-2">
                <label className="text-xs text-gray-500 capitalize">{field}</label>
                <input
                  value={stamp?.[field] || (field==='date'?new Date().toLocaleDateString():'')}
                  onChange={e=>setStamp(prev=>({company:'',address:'',phone:'',license:'',project:'',date:new Date().toLocaleDateString(),x:100,y:100,...prev,[field]:e.target.value}))}
                  className="w-full bg-[#22223a] border border-[#3a3a5c] rounded px-3 py-1.5 text-sm text-white"/>
              </div>
            ))}
            <div className="flex gap-2 mt-4">
              <button onClick={()=>{if(!stamp)setStamp({company:'',address:'',phone:'',license:'',project:'',date:new Date().toLocaleDateString(),x:100,y:100});setShowStampModal(false);pushHistory();}}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-semibold">Apply Stamp</button>
              <button onClick={()=>{setStamp(null);setShowStampModal(false);}} className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded text-sm">Remove</button>
              <button onClick={()=>setShowStampModal(false)} className="px-4 py-2 bg-[#22223a] hover:bg-[#2a2a50] rounded text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Template Save Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={()=>setShowTemplateModal(false)}>
          <div className="bg-[#1a1a32] border border-[#3a3a5c] rounded-2xl p-6 w-96 shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">📋 Save Label Template</h3>
            <p className="text-sm text-gray-400 mb-4">Save your current label configuration (prefixes, colors, increments, and custom labels) as a template for future use.</p>
            <div className="mb-4">
              <label className="text-xs text-gray-500">Template Name</label>
              <input
                value={templateName}
                onChange={e=>setTemplateName(e.target.value)}
                placeholder="e.g., Commercial Project, Residential..."
                className="w-full bg-[#22223a] border border-[#3a3a5c] rounded px-3 py-2 text-sm text-white"/>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>{
                if(!templateName.trim()) { alert('Please enter a template name'); return; }
                const newTemplate: LabelTemplate = {
                  name: templateName.trim(),
                  presets: labelPresets,
                  customLabels: customLabelTypes,
                };
                const updated = [...savedTemplates, newTemplate];
                setSavedTemplates(updated);
                localStorage.setItem('lv_label_templates', JSON.stringify(updated));
                setTemplateName('');
                setShowTemplateModal(false);
                alert(`Template "${newTemplate.name}" saved!`);
              }}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-semibold">Save Template</button>
              <button onClick={()=>{setShowTemplateModal(false);setTemplateName('');}} className="px-4 py-2 bg-[#22223a] hover:bg-[#2a2a50] rounded text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center gap-4 px-4 py-1 bg-[#12122a] border-t border-[#2a2a4a] text-xs text-gray-500 flex-shrink-0">
        <span className="text-blue-400 font-medium">📁 {currentProjectName}</span>
        <span>Elements: {elements.length}</span>
        <span>Cables: {cables.length}</span>
        <span>Labels: {labels.length}</span>
        <span>Scale: {scale.label}</span>
        <span>Zoom: {(zoom*100).toFixed(0)}%</span>
        {selectedMeasure && <span className="text-yellow-400">Measure selected - Press Delete to remove</span>}
        {selectedLabel && <span className="text-green-400">Label selected - Press Delete to remove</span>}
        {selected.length > 0 && <span className="text-blue-400">{selected.length} element(s) selected</span>}
        <span className="ml-auto">ESC=Cancel | DEL=Delete | R=Rotate | Ctrl+Z/Y=Undo/Redo | Scroll=Pan</span>
      </div>
    </div>
  );
}
