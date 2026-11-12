import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Eraser,
  FileText,
  HelpCircle,
  Highlighter,
  ImagePlus,
  List,
  NotebookPen,
  PenTool,
  Plus,
  Redo2,
  Search,
  Square,
  Star,
  Trash2,
  Type,
  Undo2,
  X,
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { NotebookCreator } from '../components/NotebookCreator';
import {
  getImageHeightPx,
  getImagesBottomPx,
  NotebookImageLayer,
} from '../components/NotebookImageLayer';
import { NotebookInkCanvas } from '../components/NotebookInkCanvas';
import { PageTransition } from '../components/PageTransition';
import { PageTurnOverlay } from '../components/PageTurnOverlay';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  createBlankPage,
  formatNoteTimestamp,
  getCoverTheme,
  getFontMeta,
  getPaperBackgroundStyle,
  LINE_HEIGHT,
  MIN_PAGE_HEIGHT,
  NOTEBOOK_FONTS,
  PAPER_STYLES,
} from '../utils/notebookPresets';
import {
  createImageId,
  loadImageUrl,
  prepareImageFile,
  pruneUnusedImages,
  requestPersistentStorage,
  saveImageBlob,
} from '../utils/notebookImageStore';
import {
  playPageTurnSound,
  playPenTapSound,
  playTaskDeleteSound,
} from '../utils/soundEffects';
import { getSubjectStyle } from '../utils/taskStyles';

const MAX_HISTORY = 100;

const INK_SWATCHES = [
  { color: '#121316', label: 'Ink Black' },
  { color: '#3762C4', label: 'Cornflower Ink' },
  { color: '#E11D48', label: 'Coral Pen' },
  { color: '#D97706', label: 'Warm Amber' },
];

const DISCUSSION_STAMPS = [
  { label: 'Bullet', icon: List, snippet: '• ' },
  { label: 'Action', icon: Square, snippet: '☐ ' },
  { label: 'Question', icon: HelpCircle, snippet: '? Question: ' },
  { label: 'Key Point', icon: Star, snippet: '★ Key point: ' },
  { label: 'Time', icon: Clock, dynamic: 'time' },
];

function createNoteSnapshot(note, cursor = null) {
  return {
    title: note.title || '',
    subject: note.subject || '',
    content: note.content || '',
    strokes: note.strokes || [],
    images: note.images || [],
    paperStyle: note.paperStyle || 'ruled',
    fontStyle: note.fontStyle || 'handwriting',
    textInkColor: note.textInkColor || '#121316',
    bookmarked: Boolean(note.bookmarked),
    cursor,
    savedAt: Date.now(),
  };
}

function countWords(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function isImageFile(file) {
  if (!file) return false;
  if (file.type?.startsWith('image/')) return true;
  return /\.(png|jpe?g|webp|gif|bmp|avif|heic|heif)$/i.test(file.name || '');
}

function extractClipboardImageFiles(clipboardData) {
  if (!clipboardData) return [];
  const fromItems = [];
  for (const item of Array.from(clipboardData.items || [])) {
    if (item.kind !== 'file') continue;
    const file = item.getAsFile();
    if (isImageFile(file)) fromItems.push(file);
  }
  if (fromItems.length > 0) return fromItems;
  return Array.from(clipboardData.files || []).filter(isImageFile);
}

const ACTIVE_NOTEBOOK_STORAGE_KEY = 'superapp_active_notebook_id_v1';
const ACTIVE_PAGE_MAP_STORAGE_KEY = 'superapp_active_page_map_v1';

function readSavedPageMap() {
  try {
    const raw = window.sessionStorage.getItem(ACTIVE_PAGE_MAP_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeSavedPageMap(map) {
  try {
    window.sessionStorage.setItem(
      ACTIVE_PAGE_MAP_STORAGE_KEY,
      JSON.stringify(map)
    );
  } catch {
    // Ignore storage errors
  }
}

function readCustomLegacyNotes() {
  try {
    const raw = window.localStorage.getItem('superapp_notes_v1');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n) => {
      if (!n || typeof n !== 'object') return false;
      const isUntouchedStarter =
        n.id === 'note-discussion-starter' &&
        n.title === 'Seminar Discussion Notes' &&
        (!n.strokes || n.strokes.length === 0);
      const isUntouchedScratchpad =
        n.id === 'note-quick-scratchpad' &&
        !n.content?.trim() &&
        (!n.strokes || n.strokes.length === 0);
      if (isUntouchedStarter || isUntouchedScratchpad) return false;
      return Boolean(n.title?.trim() || n.content?.trim() || n.strokes?.length);
    });
  } catch {
    return [];
  }
}

export function Notes() {
  const spiralPatternId = useId();
  const spiralMetalId = useId();

  const [notebooks, setNotebooks, notebooksStorageError] = useLocalStorage(
    'superapp_notebooks_v1',
    []
  );
  const [dismissedStorageWarning, setDismissedStorageWarning] = useState(false);
  const [legacyNotes, setLegacyNotes] = useState(() => readCustomLegacyNotes());

  const [activeNotebookId, setActiveNotebookId] = useState(() => {
    try {
      const savedNbId = window.sessionStorage.getItem(
        ACTIVE_NOTEBOOK_STORAGE_KEY
      );
      if (savedNbId && notebooks.some((nb) => nb.id === savedNbId)) {
        return savedNbId;
      }
    } catch {
      // Ignore sessionStorage errors
    }
    return null;
  });

  const [activePageId, setActivePageId] = useState(() => {
    try {
      const savedNbId = window.sessionStorage.getItem(
        ACTIVE_NOTEBOOK_STORAGE_KEY
      );
      if (!savedNbId) return null;
      const nb = notebooks.find((item) => item.id === savedNbId);
      if (!nb) return null;
      const pageMap = readSavedPageMap();
      const savedPgId = pageMap[savedNbId];
      if (savedPgId && (nb.pages || []).some((p) => p.id === savedPgId)) {
        return savedPgId;
      }
      return nb.pages?.[0]?.id || null;
    } catch {
      return null;
    }
  });
  const [shelfSearch, setShelfSearch] = useState('');
  const [pageSearch, setPageSearch] = useState('');
  const [listFilter, setListFilter] = useState('all'); // 'all' | 'bookmarked'
  const [mobileListOpen, setMobileListOpen] = useState(false);

  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // Writing vs Freehand Sketch state
  const [editorMode, setEditorMode] = useState('type'); // 'type' | 'draw'
  const [drawTool, setDrawTool] = useState('pen'); // 'pen' | 'highlighter' | 'eraser'
  const [drawColor, setDrawColor] = useState('#121316');
  const [copiedId, setCopiedId] = useState(null);
  const [, setHistoryTick] = useState(0);

  // Pasted / uploaded notebook photos
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [isInsertingImage, setIsInsertingImage] = useState(false);
  const [isDragOverSheet, setIsDragOverSheet] = useState(false);
  const photoInputRef = useRef(null);
  const insertImagesRef = useRef(null);

  // 3D Page-turn overlay state
  const [turningSheet, setTurningSheet] = useState(null);

  const textareaRef = useRef(null);
  const paperBodyRef = useRef(null);
  const fontMenuRef = useRef(null);
  const switcherRef = useRef(null);
  const copyTimerRef = useRef(null);
  const turnNonceRef = useRef(0);

  const notebooksRef = useRef(notebooks);
  notebooksRef.current = notebooks;
  const activeNotebookIdRef = useRef(activeNotebookId);
  activeNotebookIdRef.current = activeNotebookId;
  const activePageIdRef = useRef(activePageId);
  activePageIdRef.current = activePageId;
  const creatorModalOpenRef = useRef(isCreatorModalOpen);
  creatorModalOpenRef.current = isCreatorModalOpen;

  const historyMapRef = useRef({});
  const deletedPageStackMapRef = useRef({});
  const redoPageDeleteStackMapRef = useRef({});
  const deletedNotebookStackRef = useRef([]);
  const redoDeletedNotebookStackRef = useRef([]);
  const typingGroupRef = useRef(null);
  const lastTextareaCursorRef = useRef(null);
  const eraseStartSnapshotRef = useRef(null);
  const eraseChangedRef = useRef(false);
  const undoHandlerRef = useRef(null);
  const redoHandlerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // Persist current open notebook & page per notebook in sessionStorage for seamless tab switching
  useEffect(() => {
    try {
      if (activeNotebookId) {
        window.sessionStorage.setItem(
          ACTIVE_NOTEBOOK_STORAGE_KEY,
          activeNotebookId
        );
      } else {
        window.sessionStorage.removeItem(ACTIVE_NOTEBOOK_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [activeNotebookId]);

  useEffect(() => {
    if (!activeNotebookId || !activePageId) return;
    const prevMap = readSavedPageMap();
    if (prevMap[activeNotebookId] === activePageId) return;
    writeSavedPageMap({ ...prevMap, [activeNotebookId]: activePageId });
  }, [activeNotebookId, activePageId]);

  // Close popovers on outside pointerdown or Escape
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (
        fontMenuOpen &&
        fontMenuRef.current &&
        !fontMenuRef.current.contains(e.target)
      ) {
        setFontMenuOpen(false);
      }
      if (
        switcherOpen &&
        switcherRef.current &&
        !switcherRef.current.contains(e.target)
      ) {
        setSwitcherOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setFontMenuOpen(false);
        setSwitcherOpen(false);
        setIsCreatorModalOpen(false);
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [fontMenuOpen, switcherOpen]);

  const activeNotebook = useMemo(
    () => notebooks.find((nb) => nb.id === activeNotebookId) || null,
    [notebooks, activeNotebookId]
  );

  // Validate activeNotebookId & restore remembered activePageId cleanly
  useEffect(() => {
    if (activeNotebookId && !notebooks.some((nb) => nb.id === activeNotebookId)) {
      setActiveNotebookId(null);
      setActivePageId(null);
      return;
    }
    if (!activeNotebook) {
      if (activePageId !== null) setActivePageId(null);
      return;
    }
    const pages = activeNotebook.pages || [];
    if (pages.length === 0) {
      if (activePageId !== null) setActivePageId(null);
      return;
    }
    if (!pages.some((p) => p.id === activePageId)) {
      const savedMap = readSavedPageMap();
      const rememberedId = savedMap[activeNotebook.id];
      const targetPage =
        (rememberedId && pages.find((p) => p.id === rememberedId)) || pages[0];
      setActivePageId(targetPage.id);
    }
  }, [notebooks, activeNotebookId, activeNotebook, activePageId]);

  const activePages = activeNotebook?.pages || [];
  const activePageIndex = activePages.findIndex((p) => p.id === activePageId);
  const activeNote =
    activePageIndex >= 0 ? activePages[activePageIndex] : null;

  // Clear photo selection and transient upload banners when flipping pages or drawing
  useEffect(() => {
    setSelectedImageId(null);
    setImageError(null);
    setIsDragOverSheet(false);
  }, [activeNotebookId, activePageId]);

  useEffect(() => {
    if (editorMode === 'draw') {
      setSelectedImageId(null);
    }
  }, [editorMode]);

  // Warm-cache adjacent page photos so 3D page turns display them on frame 1
  useEffect(() => {
    if (!activeNotebook?.pages?.length || activePageIndex < 0) return;
    const neighbors = [
      activeNotebook.pages[activePageIndex - 1],
      activeNotebook.pages[activePageIndex + 1],
    ];
    for (const pg of neighbors) {
      for (const img of pg?.images || []) {
        if (img?.blobId) loadImageUrl(img.blobId).catch(() => {});
      }
    }
  }, [activeNotebook, activePageIndex]);

  // Clean up orphaned photo blobs that are no longer referenced anywhere
  useEffect(() => {
    const timer = setTimeout(() => {
      const referenced = new Set();
      const collectPageImages = (pg) => {
        for (const img of pg?.images || []) {
          if (img?.blobId) referenced.add(img.blobId);
        }
      };
      for (const nb of notebooksRef.current) {
        for (const pg of nb.pages || []) collectPageImages(pg);
      }
      for (const hist of Object.values(historyMapRef.current)) {
        for (const snap of hist?.past || []) collectPageImages(snap);
        for (const snap of hist?.future || []) collectPageImages(snap);
      }
      for (const stack of Object.values(deletedPageStackMapRef.current)) {
        for (const entry of stack || []) {
          collectPageImages(entry?.page);
          for (const snap of entry?.history?.past || []) collectPageImages(snap);
          for (const snap of entry?.history?.future || []) collectPageImages(snap);
        }
      }
      for (const entry of deletedNotebookStackRef.current) {
        for (const pg of entry?.notebook?.pages || []) collectPageImages(pg);
      }
      pruneUnusedImages(referenced).catch(() => {});
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Sync ruled sheet height to exact multiples of 32px lines (grows to fit photos too)
  const activeImages = activeNote?.images;
  useEffect(() => {
    const syncSheetHeight = () => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = 'auto';
      const bodyWidth = paperBodyRef.current?.clientWidth || el.clientWidth || 0;
      const imagesBottom = getImagesBottomPx(activeImages, bodyWidth);
      const nextHeight = Math.max(
        MIN_PAGE_HEIGHT,
        Math.ceil(el.scrollHeight / LINE_HEIGHT) * LINE_HEIGHT,
        imagesBottom > 0
          ? Math.ceil((imagesBottom + LINE_HEIGHT) / LINE_HEIGHT) * LINE_HEIGHT
          : 0
      );
      el.style.height = `${nextHeight}px`;
    };

    syncSheetHeight();
    if (!activeImages?.length) return undefined;
    window.addEventListener('resize', syncSheetHeight);
    return () => window.removeEventListener('resize', syncSheetHeight);
  }, [activeNote?.id, activeNote?.content, activeNote?.fontStyle, activeImages]);

  const filteredNotebooks = useMemo(() => {
    const q = shelfSearch.trim().toLowerCase();
    return [...notebooks]
      .filter((nb) => {
        if (!q) return true;
        return (
          (nb.name || '').toLowerCase().includes(q) ||
          (nb.subject || '').toLowerCase().includes(q) ||
          (nb.pages || []).some((p) =>
            (p.title || '').toLowerCase().includes(q)
          )
        );
      })
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [notebooks, shelfSearch]);

  // Preserve physical notebook page order (Page 1, Page 2, Page 3...)
  const indexedPages = useMemo(
    () =>
      activePages.map((page, index) => ({
        page,
        pageNumber: index + 1,
      })),
    [activePages]
  );

  const filteredPages = useMemo(() => {
    const q = pageSearch.trim().toLowerCase();
    return indexedPages.filter(({ page }) => {
      if (listFilter === 'bookmarked' && !page.bookmarked) return false;
      if (!q) return true;
      return (
        (page.title || '').toLowerCase().includes(q) ||
        (page.subject || '').toLowerCase().includes(q) ||
        (page.content || '').toLowerCase().includes(q)
      );
    });
  }, [indexedPages, pageSearch, listFilter]);

  const getNoteHistory = (noteId) => {
    if (!historyMapRef.current[noteId]) {
      historyMapRef.current[noteId] = { past: [], future: [] };
    }
    return historyMapRef.current[noteId];
  };

  const commitNotebooksUpdate = (updater) => {
    const next = updater(notebooksRef.current);
    notebooksRef.current = next;
    setNotebooks(next);
  };

  const updateActiveNote = (
    patch,
    targetNbId = activeNotebookIdRef.current,
    targetPageId = activePageIdRef.current
  ) => {
    if (!targetNbId || !targetPageId) return;
    const now = Date.now();
    commitNotebooksUpdate((prev) =>
      prev.map((nb) => {
        if (nb.id !== targetNbId) return nb;
        return {
          ...nb,
          updatedAt: now,
          pages: (nb.pages || []).map((page) =>
            page.id === targetPageId
              ? {
                  ...page,
                  ...(typeof patch === 'function' ? patch(page) : patch),
                  updatedAt: now,
                }
              : page
          ),
        };
      })
    );
  };

  const getActiveNoteSnapshotTarget = () => {
    const nb = notebooksRef.current.find(
      (n) => n.id === activeNotebookIdRef.current
    );
    if (!nb) return { nb: null, page: null };
    const page = (nb.pages || []).find(
      (p) => p.id === activePageIdRef.current
    );
    return { nb, page: page || null };
  };

  const pushUndoSnapshot = (note, cursor = null) => {
    if (!note) return;
    const hist = getNoteHistory(note.id);
    hist.past = [
      ...hist.past.slice(-(MAX_HISTORY - 1)),
      createNoteSnapshot(note, cursor),
    ];
    hist.future = [];
    const nbId = activeNotebookIdRef.current;
    if (nbId && redoPageDeleteStackMapRef.current[nbId]?.length) {
      redoPageDeleteStackMapRef.current[nbId] = [];
    }
    setHistoryTick((t) => t + 1);
  };

  const handleRecordedPatch = (patch) => {
    const { nb, page } = getActiveNoteSnapshotTarget();
    if (!nb || !page) return;
    typingGroupRef.current = null;
    pushUndoSnapshot(page);
    updateActiveNote(patch, nb.id, page.id);
  };

  const handleTextFieldChange = (field, nextValue) => {
    const { nb, page } = getActiveNoteSnapshotTarget();
    if (!nb || !page) return;

    const now = Date.now();
    const group = typingGroupRef.current;
    const isNewlineInsert =
      field === 'content' &&
      nextValue.length > (page.content || '').length &&
      /\n$/.test(nextValue);

    const shouldPushNewStep =
      !group ||
      group.noteId !== page.id ||
      group.field !== field ||
      now - group.lastAt > 650 ||
      isNewlineInsert;

    if (shouldPushNewStep) {
      const prevCursor =
        field === 'content' ? lastTextareaCursorRef.current : null;
      pushUndoSnapshot(page, prevCursor);
      typingGroupRef.current = {
        noteId: page.id,
        field,
        lastAt: now,
      };
    } else {
      group.lastAt = now;
    }

    if (field === 'content' && textareaRef.current) {
      lastTextareaCursorRef.current = textareaRef.current.selectionStart ?? null;
    }

    updateActiveNote({ [field]: nextValue }, nb.id, page.id);
  };

  // Trigger realistic 3D page-turn animation when switching pages
  const triggerPageTurn = (nextPage, direction) => {
    if (!nextPage) return;
    const current = activeNote;
    const bodyRect = paperBodyRef.current?.getBoundingClientRect();
    const bodyWidth = bodyRect?.width || 680;
    const bodyHeight = bodyRect?.height || MIN_PAGE_HEIGHT;

    if (current && current.id !== nextPage.id) {
      turnNonceRef.current += 1;
      const snapshotPage = direction >= 0 ? current : nextPage;
      setTurningSheet({
        id: turnNonceRef.current,
        direction,
        page: snapshotPage,
        backingPage: direction < 0 ? current : null,
        bodyWidth,
        bodyHeight,
      });
    }
  };

  const handleSelectPage = (nextId, explicitDirection = null) => {
    typingGroupRef.current = null;
    setFontMenuOpen(false);
    setMobileListOpen(false);
    if (!activeNotebook || nextId === activePageId) return;

    const pages = activeNotebook.pages || [];
    const oldIdx = pages.findIndex((p) => p.id === activePageId);
    const newIdx = pages.findIndex((p) => p.id === nextId);
    if (newIdx === -1) return;

    const dir =
      explicitDirection !== null
        ? explicitDirection
        : oldIdx === -1 || newIdx >= oldIdx
          ? 1
          : -1;

    triggerPageTurn(pages[newIdx], dir);
    setActivePageId(nextId);
    playPageTurnSound();
  };

  const handleFlipStep = (delta) => {
    if (!activeNotebook) return;
    const pages = activeNotebook.pages || [];
    const targetIdx = activePageIndex + delta;
    if (targetIdx < 0 || targetIdx >= pages.length) return;
    handleSelectPage(pages[targetIdx].id, delta);
  };

  const handleCreateNotebook = ({
    name,
    subject,
    coverColor,
    paperStyle,
    fontStyle,
  }) => {
    typingGroupRef.current = null;
    const now = Date.now();
    const firstPage = createBlankPage({
      subject: subject || 'Discussion',
      paperStyle,
      fontStyle,
      title: 'Page 1 — Overview & Notes',
    });

    const newNotebook = {
      id: `nb-${now}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      subject: subject || 'General',
      coverColor: coverColor || 'indigo',
      defaultPaperStyle: paperStyle || 'ruled',
      defaultFontStyle: fontStyle || 'handwriting',
      createdAt: now,
      updatedAt: now,
      pages: [firstPage],
    };

    commitNotebooksUpdate((prev) => [newNotebook, ...prev]);
    redoDeletedNotebookStackRef.current = [];
    setActiveNotebookId(newNotebook.id);
    setActivePageId(firstPage.id);
    setTurningSheet(null);
    setIsCreatorModalOpen(false);
    setSwitcherOpen(false);
    setEditorMode('type');
    playPageTurnSound();
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const handleImportLegacyNotes = () => {
    if (!legacyNotes.length) return;
    const now = Date.now();
    const firstFont = legacyNotes[0]?.fontStyle || 'handwriting';
    const importedNotebook = {
      id: `nb-import-${now}`,
      name: 'My Previous Notes',
      subject: legacyNotes[0]?.subject || 'Discussion',
      coverColor: 'indigo',
      defaultPaperStyle: legacyNotes[0]?.paperStyle || 'ruled',
      defaultFontStyle: firstFont,
      createdAt: now,
      updatedAt: now,
      pages: legacyNotes,
    };
    commitNotebooksUpdate((prev) => [importedNotebook, ...prev]);
    setLegacyNotes([]);
    setActiveNotebookId(importedNotebook.id);
    setActivePageId(legacyNotes[0].id);
    playPageTurnSound();
  };

  const handleOpenNotebook = (notebook) => {
    typingGroupRef.current = null;
    setFontMenuOpen(false);
    setSwitcherOpen(false);
    setPageSearch('');
    setListFilter('all');
    setTurningSheet(null);
    setActiveNotebookId(notebook.id);
    const savedMap = readSavedPageMap();
    const rememberedId = savedMap[notebook.id];
    const pages = notebook.pages || [];
    const targetPage =
      (rememberedId && pages.find((p) => p.id === rememberedId)) || pages[0];
    setActivePageId(targetPage?.id || null);
    playPageTurnSound();
  };

  const handleDeleteNotebook = (nbId, event) => {
    if (event) event.stopPropagation();
    typingGroupRef.current = null;
    const idx = notebooksRef.current.findIndex((nb) => nb.id === nbId);
    if (idx === -1) return;

    const deleted = notebooksRef.current[idx];
    deletedNotebookStackRef.current = [
      ...deletedNotebookStackRef.current.slice(-9),
      {
        notebook: deleted,
        index: idx,
        wasOpen: activeNotebookIdRef.current === nbId,
        deletedAt: Date.now(),
      },
    ];
    redoDeletedNotebookStackRef.current = [];
    setHistoryTick((t) => t + 1);
    playTaskDeleteSound();
    commitNotebooksUpdate((prev) => prev.filter((nb) => nb.id !== nbId));
    if (activeNotebookIdRef.current === nbId) {
      setActiveNotebookId(null);
      setActivePageId(null);
    }
  };

  const handleCreatePage = () => {
    const nb = notebooksRef.current.find(
      (n) => n.id === activeNotebookIdRef.current
    );
    if (!nb) return;
    typingGroupRef.current = null;
    setFontMenuOpen(false);

    const nextNum = (nb.pages?.length || 0) + 1;
    const newPage = createBlankPage({
      subject: nb.subject || 'Discussion',
      paperStyle: activeNote?.paperStyle || nb.defaultPaperStyle || 'ruled',
      fontStyle: activeNote?.fontStyle || nb.defaultFontStyle || 'handwriting',
      title: `Page ${nextNum}`,
    });

    if (activeNote) {
      triggerPageTurn(newPage, 1);
    }

    commitNotebooksUpdate((prev) =>
      prev.map((item) =>
        item.id === nb.id
          ? {
              ...item,
              updatedAt: Date.now(),
              pages: [...(item.pages || []), newPage],
            }
          : item
      )
    );
    setActivePageId(newPage.id);
    setEditorMode('type');
    setMobileListOpen(false);
    playPageTurnSound();
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const handleDeletePage = (pageId, event) => {
    if (event) event.stopPropagation();
    const nb = notebooksRef.current.find(
      (n) => n.id === activeNotebookIdRef.current
    );
    if (!nb) return;
    typingGroupRef.current = null;

    const pages = nb.pages || [];
    const index = pages.findIndex((p) => p.id === pageId);
    if (index === -1) return;

    const deletedPage = pages[index];
    const currentStack = deletedPageStackMapRef.current[nb.id] || [];
    deletedPageStackMapRef.current[nb.id] = [
      ...currentStack.slice(-19),
      {
        notebookId: nb.id,
        page: deletedPage,
        index,
        history: getNoteHistory(pageId),
        deletedAt: Date.now(),
      },
    ];
    redoPageDeleteStackMapRef.current[nb.id] = [];
    setHistoryTick((t) => t + 1);

    playTaskDeleteSound();
    const remaining = pages.filter((p) => p.id !== pageId);
    commitNotebooksUpdate((prev) =>
      prev.map((item) =>
        item.id === nb.id
          ? { ...item, updatedAt: Date.now(), pages: remaining }
          : item
      )
    );

    if (activePageIdRef.current === pageId) {
      const fallback = remaining[Math.min(index, remaining.length - 1)] || null;
      setActivePageId(fallback?.id || null);
    }
  };

  const handleInsertStamp = (stamp) => {
    const { nb, page } = getActiveNoteSnapshotTarget();
    if (!nb || !page) return;
    playPenTapSound();
    typingGroupRef.current = null;

    const el = textareaRef.current;
    let textToInsert = stamp.snippet || '';
    if (stamp.dynamic === 'time') {
      const timeNow = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
      textToInsert = `[${timeNow}] `;
    }

    const current = page.content || '';
    const start = el ? el.selectionStart ?? current.length : current.length;
    const end = el ? el.selectionEnd ?? current.length : current.length;
    pushUndoSnapshot(page, start);

    const needsNewlineBefore =
      start > 0 && current[start - 1] !== '\n' ? '\n' : '';
    const finalInsert = `${needsNewlineBefore}${textToInsert}`;
    const updated =
      current.slice(0, start) + finalInsert + current.slice(end);
    const nextCursor = start + finalInsert.length;

    updateActiveNote({ content: updated }, nb.id, page.id);
    lastTextareaCursorRef.current = nextCursor;

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCursor, nextCursor);
      }
    });
  };

  const handleAddStroke = (stroke) => {
    const { nb, page } = getActiveNoteSnapshotTarget();
    if (!nb || !page) return;
    typingGroupRef.current = null;
    pushUndoSnapshot(page);
    updateActiveNote(
      (p) => ({
        strokes: [...(p.strokes || []), stroke],
      }),
      nb.id,
      page.id
    );
  };

  const handleEraseStart = () => {
    const { nb, page } = getActiveNoteSnapshotTarget();
    if (!nb || !page) return;
    eraseStartSnapshotRef.current = {
      notebookId: nb.id,
      noteId: page.id,
      snapshot: createNoteSnapshot(page),
    };
    eraseChangedRef.current = false;
  };

  const handleEraseStrokes = (hitIds) => {
    if (!hitIds || hitIds.length === 0) return;
    const hitSet = new Set(hitIds);
    eraseChangedRef.current = true;
    updateActiveNote((page) => ({
      strokes: (page.strokes || []).filter((s) => !hitSet.has(s.id)),
    }));
  };

  const handleEraseEnd = () => {
    const drag = eraseStartSnapshotRef.current;
    eraseStartSnapshotRef.current = null;
    if (!drag || !eraseChangedRef.current) return;
    eraseChangedRef.current = false;

    typingGroupRef.current = null;
    const hist = getNoteHistory(drag.noteId);
    hist.past = [...hist.past.slice(-(MAX_HISTORY - 1)), drag.snapshot];
    hist.future = [];
    if (drag.notebookId && redoPageDeleteStackMapRef.current[drag.notebookId]?.length) {
      redoPageDeleteStackMapRef.current[drag.notebookId] = [];
    }
    setHistoryTick((t) => t + 1);
  };

  const handleClearInk = () => {
    const { nb, page } = getActiveNoteSnapshotTarget();
    if (!nb || !page || !(page.strokes || []).length) return;
    typingGroupRef.current = null;
    pushUndoSnapshot(page);
    playTaskDeleteSound();
    updateActiveNote({ strokes: [] }, nb.id, page.id);
  };

  // Where a pasted/uploaded photo lands: under the drop point, or near the
  // top of the part of the page currently visible on screen.
  const getImageInsertY = (clientY = null) => {
    const body = paperBodyRef.current;
    if (!body) return LINE_HEIGHT;
    const rect = body.getBoundingClientRect();
    if (clientY !== null) {
      const dropY = Math.max(0, clientY - rect.top);
      return Math.round(dropY / LINE_HEIGHT) * LINE_HEIGHT;
    }
    const visibleY = window.innerHeight * 0.28 - rect.top;
    const maxY = Math.max(LINE_HEIGHT, rect.height - LINE_HEIGHT * 3);
    const y = Math.min(Math.max(LINE_HEIGHT, visibleY), maxY);
    return Math.round(y / LINE_HEIGHT) * LINE_HEIGHT;
  };

  const handleInsertImages = async (files, { clientY = null } = {}) => {
    const imageFiles = Array.from(files || [])
      .filter(isImageFile)
      .slice(0, 8);
    if (imageFiles.length === 0) return;

    const { nb, page } = getActiveNoteSnapshotTarget();
    if (!nb || !page) return;
    const targetNbId = nb.id;
    const targetPageId = page.id;

    setImageError(null);
    setIsInsertingImage(true);
    if (editorMode === 'draw') setEditorMode('type');

    const bodyWidth = paperBodyRef.current?.clientWidth || 680;
    const existingPositions = (page.images || []).map((img) => ({
      x: img.x || 0,
      y: img.y || 0,
    }));
    let nextY = getImageInsertY(clientY);
    const added = [];
    let failures = 0;

    for (const file of imageFiles) {
      try {
        const prepared = await prepareImageFile(file);
        const blobId = createImageId();
        await saveImageBlob(blobId, prepared.blob);

        const aspect = prepared.height / prepared.width;
        const defaultPx = Math.min(prepared.width, bodyWidth * 0.62, 520);
        const w = Math.min(1, Math.max(defaultPx, Math.min(140, bodyWidth)) / bodyWidth);
        let placedX = Math.max(0, (1 - w) / 2);
        let placedY = nextY;
        let guard = 0;
        while (
          guard < 8 &&
          existingPositions.some(
            (pos) =>
              Math.abs(pos.y - placedY) < 28 &&
              Math.abs(pos.x - placedX) < 0.06
          )
        ) {
          placedY += LINE_HEIGHT;
          placedX = Math.min(Math.max(0, 1 - w), placedX + 0.03);
          guard += 1;
        }
        existingPositions.push({ x: placedX, y: placedY });

        const image = {
          id: createImageId(),
          blobId,
          x: placedX,
          y: placedY,
          w,
          aspect,
          addedAt: Date.now(),
        };
        added.push(image);
        nextY =
          placedY +
          Math.ceil((getImageHeightPx(image, bodyWidth) + LINE_HEIGHT) / LINE_HEIGHT) *
            LINE_HEIGHT;
      } catch {
        failures += 1;
      }
    }

    setIsInsertingImage(false);

    if (failures > 0) {
      setImageError(
        added.length > 0
          ? `${failures} photo${failures > 1 ? 's' : ''} couldn't be added.`
          : "That photo couldn't be added. Try a JPG, PNG, or screenshot."
      );
    }
    if (added.length === 0) return;

    // Re-read the page after async work so concurrent edits are not lost
    const latestNb = notebooksRef.current.find((n) => n.id === targetNbId);
    const latestPage = latestNb?.pages?.find((p) => p.id === targetPageId);
    if (!latestPage) return;

    typingGroupRef.current = null;
    const hist = getNoteHistory(latestPage.id);
    hist.past = [
      ...hist.past.slice(-(MAX_HISTORY - 1)),
      createNoteSnapshot(latestPage),
    ];
    hist.future = [];
    setHistoryTick((t) => t + 1);

    updateActiveNote(
      (p) => ({ images: [...(p.images || []), ...added] }),
      targetNbId,
      targetPageId
    );
    if (activePageIdRef.current === targetPageId) {
      setSelectedImageId(added[added.length - 1].id);
    }
    playPenTapSound();
    requestPersistentStorage();
  };
  insertImagesRef.current = handleInsertImages;

  const handleCommitImage = (imageId, patch) => {
    const { nb, page } = getActiveNoteSnapshotTarget();
    if (!nb || !page) return;
    typingGroupRef.current = null;
    pushUndoSnapshot(page);
    updateActiveNote(
      (p) => ({
        images: (p.images || []).map((img) =>
          img.id === imageId ? { ...img, ...patch } : img
        ),
      }),
      nb.id,
      page.id
    );
  };

  const handleDeleteImage = (imageId) => {
    const { nb, page } = getActiveNoteSnapshotTarget();
    if (!nb || !page) return;
    typingGroupRef.current = null;
    pushUndoSnapshot(page);
    playTaskDeleteSound();
    setSelectedImageId(null);
    updateActiveNote(
      (p) => ({ images: (p.images || []).filter((img) => img.id !== imageId) }),
      nb.id,
      page.id
    );
  };

  const handleUndo = () => {
    typingGroupRef.current = null;
    const { nb, page } = getActiveNoteSnapshotTarget();

    // Outside an open notebook: restore deleted notebook from bookshelf/empty view
    if (!nb) {
      const lastDeletedNb =
        deletedNotebookStackRef.current[
          deletedNotebookStackRef.current.length - 1
        ];
      if (!lastDeletedNb) return;

      deletedNotebookStackRef.current =
        deletedNotebookStackRef.current.slice(0, -1);
      commitNotebooksUpdate((prev) => {
        const next = [...prev];
        const insertAt = Math.min(lastDeletedNb.index, next.length);
        next.splice(insertAt, 0, lastDeletedNb.notebook);
        return next;
      });
      redoDeletedNotebookStackRef.current = [
        ...redoDeletedNotebookStackRef.current.slice(-9),
        {
          notebookId: lastDeletedNb.notebook.id,
          index: lastDeletedNb.index,
          wasOpen: lastDeletedNb.wasOpen,
          restoredAt: Date.now(),
        },
      ];
      if (lastDeletedNb.wasOpen) {
        setActiveNotebookId(lastDeletedNb.notebook.id);
        setActivePageId(lastDeletedNb.notebook.pages?.[0]?.id || null);
      }
      playPageTurnSound();
      setHistoryTick((t) => t + 1);
      return;
    }

    const hist = page ? getNoteHistory(page.id) : null;
    const lastPastTime = hist?.past?.length
      ? hist.past[hist.past.length - 1].savedAt
      : -1;
    const nbDeletedPages = deletedPageStackMapRef.current[nb.id] || [];
    const lastDeletedPage = nbDeletedPages[nbDeletedPages.length - 1];
    const lastPageDelTime = lastDeletedPage?.deletedAt ?? -1;

    // 1. Restore deleted page scoped strictly to the active notebook
    if (lastDeletedPage && lastPageDelTime >= lastPastTime) {
      deletedPageStackMapRef.current[nb.id] = nbDeletedPages.slice(0, -1);
      commitNotebooksUpdate((prev) =>
        prev.map((item) => {
          if (item.id !== nb.id) return item;
          const nextPages = [...(item.pages || [])];
          const insertAt = Math.min(lastDeletedPage.index, nextPages.length);
          nextPages.splice(insertAt, 0, lastDeletedPage.page);
          return { ...item, updatedAt: Date.now(), pages: nextPages };
        })
      );
      if (lastDeletedPage.history) {
        historyMapRef.current[lastDeletedPage.page.id] =
          lastDeletedPage.history;
      }
      const currRedoPages = redoPageDeleteStackMapRef.current[nb.id] || [];
      redoPageDeleteStackMapRef.current[nb.id] = [
        ...currRedoPages.slice(-19),
        {
          notebookId: nb.id,
          pageId: lastDeletedPage.page.id,
          index: lastDeletedPage.index,
          restoredAt: Date.now(),
        },
      ];
      setActivePageId(lastDeletedPage.page.id);
      playPageTurnSound();
      setHistoryTick((t) => t + 1);
      return;
    }

    // 2. Undo active page change (strokes, typing, fonts, stamps, paper, etc.)
    if (!page || !hist || hist.past.length === 0) return;

    const target = hist.past[hist.past.length - 1];
    hist.past = hist.past.slice(0, -1);
    const currentCursor =
      document.activeElement === textareaRef.current
        ? (textareaRef.current.selectionStart ?? null)
        : null;
    hist.future = [
      ...hist.future.slice(-(MAX_HISTORY - 1)),
      createNoteSnapshot(page, currentCursor),
    ];

    updateActiveNote(
      {
        title: target.title,
        subject: target.subject,
        content: target.content,
        strokes: target.strokes,
        images: target.images || [],
        paperStyle: target.paperStyle,
        fontStyle: target.fontStyle,
        textInkColor: target.textInkColor,
        bookmarked: target.bookmarked,
      },
      nb.id,
      page.id
    );
    playPenTapSound();
    setHistoryTick((t) => t + 1);

    if (
      document.activeElement === textareaRef.current &&
      target.cursor !== null
    ) {
      lastTextareaCursorRef.current = target.cursor;
      requestAnimationFrame(() => {
        textareaRef.current?.setSelectionRange(target.cursor, target.cursor);
      });
    }
  };

  const handleRedo = () => {
    typingGroupRef.current = null;
    const { nb, page } = getActiveNoteSnapshotTarget();

    // Outside an open notebook: redo notebook deletion if recently undone
    if (!nb) {
      const lastRedoNb =
        redoDeletedNotebookStackRef.current[
          redoDeletedNotebookStackRef.current.length - 1
        ];
      if (!lastRedoNb) return;

      redoDeletedNotebookStackRef.current =
        redoDeletedNotebookStackRef.current.slice(0, -1);
      const nbIdx = notebooksRef.current.findIndex(
        (item) => item.id === lastRedoNb.notebookId
      );
      if (nbIdx === -1) {
        setHistoryTick((t) => t + 1);
        return;
      }

      const targetNb = notebooksRef.current[nbIdx];
      deletedNotebookStackRef.current = [
        ...deletedNotebookStackRef.current.slice(-9),
        {
          notebook: targetNb,
          index: nbIdx,
          wasOpen: lastRedoNb.wasOpen,
          deletedAt: Date.now(),
        },
      ];
      playTaskDeleteSound();
      commitNotebooksUpdate((prev) =>
        prev.filter((item) => item.id !== targetNb.id)
      );
      setHistoryTick((t) => t + 1);
      return;
    }

    const hist = page ? getNoteHistory(page.id) : null;
    const lastFutureTime = hist?.future?.length
      ? hist.future[hist.future.length - 1].savedAt
      : -1;
    const nbRedoPages = redoPageDeleteStackMapRef.current[nb.id] || [];
    const lastRedoPageDel = nbRedoPages[nbRedoPages.length - 1];
    const lastRedoPageTime = lastRedoPageDel?.restoredAt ?? -1;

    // 1. Redo restored page deletion if more recent than active page future edit
    if (lastRedoPageDel && lastRedoPageTime >= lastFutureTime) {
      redoPageDeleteStackMapRef.current[nb.id] = nbRedoPages.slice(0, -1);
      const pages = nb.pages || [];
      const currentIdx = pages.findIndex((p) => p.id === lastRedoPageDel.pageId);
      if (currentIdx !== -1) {
        const pageToDelete = pages[currentIdx];
        const currDeleted = deletedPageStackMapRef.current[nb.id] || [];
        deletedPageStackMapRef.current[nb.id] = [
          ...currDeleted.slice(-19),
          {
            notebookId: nb.id,
            page: pageToDelete,
            index: currentIdx,
            history: getNoteHistory(pageToDelete.id),
            deletedAt: Date.now(),
          },
        ];
        playTaskDeleteSound();
        const remaining = pages.filter((p) => p.id !== pageToDelete.id);
        commitNotebooksUpdate((prev) =>
          prev.map((item) =>
            item.id === nb.id
              ? { ...item, updatedAt: Date.now(), pages: remaining }
              : item
          )
        );
        if (activePageIdRef.current === pageToDelete.id) {
          const fallback =
            remaining[Math.min(currentIdx, remaining.length - 1)] || null;
          setActivePageId(fallback?.id || null);
        }
        setHistoryTick((t) => t + 1);
        return;
      }
    }

    // 2. Redo active page change
    if (!page || !hist || hist.future.length === 0) return;

    const target = hist.future[hist.future.length - 1];
    hist.future = hist.future.slice(0, -1);
    const currentCursor =
      document.activeElement === textareaRef.current
        ? (textareaRef.current.selectionStart ?? null)
        : null;
    hist.past = [
      ...hist.past.slice(-(MAX_HISTORY - 1)),
      createNoteSnapshot(page, currentCursor),
    ];

    updateActiveNote(
      {
        title: target.title,
        subject: target.subject,
        content: target.content,
        strokes: target.strokes,
        images: target.images || [],
        paperStyle: target.paperStyle,
        fontStyle: target.fontStyle,
        textInkColor: target.textInkColor,
        bookmarked: target.bookmarked,
      },
      nb.id,
      page.id
    );
    playPenTapSound();
    setHistoryTick((t) => t + 1);

    if (
      document.activeElement === textareaRef.current &&
      target.cursor !== null
    ) {
      lastTextareaCursorRef.current = target.cursor;
      requestAnimationFrame(() => {
        textareaRef.current?.setSelectionRange(target.cursor, target.cursor);
      });
    }
  };

  undoHandlerRef.current = handleUndo;
  redoHandlerRef.current = handleRedo;

  // Global Ctrl+Z / Cmd+Z (Undo) & Ctrl+Shift+Z / Ctrl+Y (Redo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.isComposing || creatorModalOpenRef.current) return;
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key !== 'z' && key !== 'y') return;

      const activeEl = document.activeElement;
      const tag = activeEl?.tagName;
      const isExternalInput =
        (tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          activeEl?.isContentEditable) &&
        activeEl?.dataset?.notebookEditor !== 'true';
      if (isExternalInput) return;

      e.preventDefault();
      if (key === 'y' || (key === 'z' && e.shiftKey)) {
        redoHandlerRef.current?.();
      } else {
        undoHandlerRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global clipboard image paste (Ctrl+V / Cmd+V) onto the open notebook page
  useEffect(() => {
    const handlePaste = (e) => {
      if (creatorModalOpenRef.current) return;
      if (!activeNotebookIdRef.current || !activePageIdRef.current) return;

      const activeEl = document.activeElement;
      const tag = activeEl?.tagName;
      const isExternalInput =
        (tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          activeEl?.isContentEditable) &&
        activeEl?.dataset?.notebookEditor !== 'true';
      if (isExternalInput) return;

      const files = extractClipboardImageFiles(e.clipboardData);
      if (files.length === 0) return;

      e.preventDefault();
      insertImagesRef.current?.(files);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleCopyPage = async () => {
    if (!activeNote) return;
    const formatted = `${activeNote.title || 'Discussion Note'} (${activeNote.subject || 'General'})\n\n${activeNote.content || ''}`.trim();
    try {
      await navigator.clipboard.writeText(formatted);
      playPenTapSound();
      setCopiedId(activeNote.id);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Clipboard blocked in non-secure context
    }
  };

  const subjectStyle = getSubjectStyle(activeNote?.subject || 'Discussion');
  const activeFontMeta = getFontMeta(activeNote?.fontStyle);
  const activeCoverTheme = activeNotebook
    ? getCoverTheme(activeNotebook.coverColor)
    : getCoverTheme('indigo');
  const wordCount = countWords(activeNote?.content);
  const strokeCount = activeNote?.strokes?.length || 0;
  const imageCount = activeNote?.images?.length || 0;
  const activeHistory = activeNote ? historyMapRef.current[activeNote.id] : null;
  const activeNbDeletedPages = activeNotebook
    ? deletedPageStackMapRef.current[activeNotebook.id] || []
    : [];
  const activeNbRedoPages = activeNotebook
    ? redoPageDeleteStackMapRef.current[activeNotebook.id] || []
    : [];
  const canUndo = activeNotebook
    ? Boolean(
        (activeHistory?.past?.length || 0) > 0 ||
          activeNbDeletedPages.length > 0
      )
    : deletedNotebookStackRef.current.length > 0;
  const canRedo = activeNotebook
    ? Boolean(
        (activeHistory?.future?.length || 0) > 0 ||
          activeNbRedoPages.length > 0
      )
    : redoDeletedNotebookStackRef.current.length > 0;
  const hasPrevPage = activePageIndex > 0;
  const hasNextPage =
    activePageIndex >= 0 && activePageIndex < activePages.length - 1;

  return (
    <PageTransition>
      <div className="space-y-5">
        {notebooksStorageError && !dismissedStorageWarning && (
          <div
            role="alert"
            className="rounded-xl bg-[#FAF9F6] border border-[#121316]/20 px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs text-[#121316]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#3762C4]" />
              <span className="truncate">{notebooksStorageError.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setDismissedStorageWarning(true)}
              aria-label="Dismiss storage warning"
              className="p-1 rounded-md hover:bg-[#121316]/10 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {imageError && (
          <div
            role="alert"
            className="rounded-xl bg-[#FAF9F6] border border-[#121316]/20 px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs text-[#121316]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#3762C4]" />
              <span className="truncate">{imageError}</span>
            </div>
            <button
              type="button"
              onClick={() => setImageError(null)}
              aria-label="Dismiss photo error"
              className="p-1 rounded-md hover:bg-[#121316]/10 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* CASE 1: No notebooks yet — require creating the first notebook */}
        {notebooks.length === 0 ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-[#121316] tracking-tight">
                  Student Notebooks
                </h1>
                <p className="text-xs sm:text-sm text-[#424652] mt-0.5">
                  Organize lecture & discussion notes in separate spiral notebooks. Create your first one below to begin.
                </p>
              </div>
              {canUndo && (
                <button
                  type="button"
                  onClick={handleUndo}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-[#121316]/12 px-3 py-2 text-xs font-semibold text-[#121316] hover:bg-[#EAF0FC] cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5 text-[#3762C4]" />
                  <span>Undo Delete (Ctrl+Z)</span>
                </button>
              )}
            </div>

            <NotebookCreator
              variant="inline"
              onCreateNotebook={handleCreateNotebook}
              legacyCount={legacyNotes.length}
              onImportLegacyNotes={handleImportLegacyNotes}
            />
          </div>
        ) : !activeNotebook ? (
          /* CASE 2: Student Bookshelf (pick or create a notebook) */
          <div className="space-y-5">
            <div className="glass-card rounded-panel p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#121316] flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-[#5B8DEF]" />
                </div>
                <div>
                  <h1 className="font-display text-lg sm:text-xl font-bold text-[#121316] tracking-tight">
                    My Notebooks
                  </h1>
                  <p className="text-xs text-[#424652]">
                    {notebooks.length} notebook{notebooks.length === 1 ? '' : 's'} on your desk · Pick one to open or add a new subject
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6E7382]" />
                  <input
                    type="text"
                    value={shelfSearch}
                    onChange={(e) => setShelfSearch(e.target.value)}
                    placeholder="Search notebooks..."
                    aria-label="Search notebooks"
                    className="w-full rounded-xl bg-white border border-[#121316]/10 pl-8 pr-7 py-2 text-xs text-[#121316] placeholder:text-[#6E7382] focus:outline-none focus:border-[#5B8DEF]"
                  />
                  {shelfSearch && (
                    <button
                      type="button"
                      onClick={() => setShelfSearch('')}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6E7382] hover:text-[#121316] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {canUndo && (
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-[#121316]/12 px-3 py-2 text-xs font-semibold text-[#121316] hover:bg-[#EAF0FC] cursor-pointer"
                    title="Restore deleted notebook (Ctrl+Z)"
                  >
                    <Undo2 className="w-3.5 h-3.5 text-[#3762C4]" />
                    <span className="hidden sm:inline">Undo</span>
                  </button>
                )}

                {canRedo && (
                  <button
                    type="button"
                    onClick={handleRedo}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-[#121316]/12 px-3 py-2 text-xs font-semibold text-[#121316] hover:bg-[#EAF0FC] cursor-pointer"
                    title="Redo notebook deletion (Ctrl+Y)"
                  >
                    <Redo2 className="w-3.5 h-3.5 text-[#3762C4]" />
                    <span className="hidden sm:inline">Redo</span>
                  </button>
                )}

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    playPenTapSound();
                    setIsCreatorModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#3762C4] hover:bg-[#2F59B8] text-white text-xs font-semibold px-4 py-2.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Notebook</span>
                </motion.button>
              </div>
            </div>

            {/* Physical Notebook Covers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredNotebooks.map((nb) => {
                const theme = getCoverTheme(nb.coverColor);
                const fontMeta = getFontMeta(nb.defaultFontStyle);
                const totalPages = nb.pages?.length || 0;
                const totalWords = (nb.pages || []).reduce(
                  (acc, p) => acc + countWords(p.content),
                  0
                );

                return (
                  <motion.div
                    key={nb.id}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => handleOpenNotebook(nb)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenNotebook(nb);
                      }
                    }}
                    className={`group relative rounded-r-2xl rounded-l-md bg-gradient-to-br ${theme.coverBg} notebook-cover-shadow p-5 pl-7 min-h-[248px] flex flex-col justify-between cursor-pointer overflow-hidden text-left`}
                  >
                    {/* Left Cloth Binding Spine */}
                    <div
                      aria-hidden="true"
                      className={`absolute inset-y-0 left-0 w-4 ${theme.spineBg} border-r border-black/15`}
                    />

                    {/* Elastic Band Ribbon */}
                    <div
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-y-0 right-4 w-2 ${theme.strapBg} opacity-90`}
                    />

                    {/* Top Metadata Row */}
                    <div className="relative flex items-center justify-between gap-2 pr-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border truncate max-w-[150px] ${theme.badgeBg}`}
                      >
                        {nb.subject || 'General'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteNotebook(nb.id, e)}
                        aria-label={`Delete ${nb.name} notebook`}
                        title="Delete notebook (Ctrl+Z to undo)"
                        className="touch-reveal opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg bg-black/20 hover:bg-black/35 text-white transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Stitched Ivory Cover Nameplate */}
                    <div className="relative my-4 mr-4 rounded-xl bg-[#FAF9F6]/96 border border-[#121316]/10 p-3.5 shadow-sm">
                      <div className="text-[9px] uppercase tracking-widest text-[#6E7382] font-semibold">
                        Notebook
                      </div>
                      <h2
                        className={`mt-1 text-[#121316] leading-snug line-clamp-2 ${fontMeta.fontClass} ${
                          fontMeta.key === 'mono'
                            ? 'text-base font-semibold'
                            : 'text-xl font-bold'
                        }`}
                      >
                        {nb.name}
                      </h2>
                      <div className="mt-2.5 pt-2 border-t border-[#121316]/10 flex items-center justify-between text-[11px] text-[#424652]">
                        <span>
                          {totalPages} page{totalPages === 1 ? '' : 's'} ·{' '}
                          {totalWords} words
                        </span>
                        <span className="capitalize">
                          {nb.defaultPaperStyle || 'ruled'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Hint */}
                    <div
                      className={`relative flex items-center justify-between text-[11px] font-medium pr-4 ${theme.mutedText}`}
                    >
                      <span>{formatNoteTimestamp(nb.updatedAt)}</span>
                      <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Open
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {/* Add Another Notebook Card */}
              <motion.button
                type="button"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => {
                  playPenTapSound();
                  setIsCreatorModalOpen(true);
                }}
                className="min-h-[248px] rounded-2xl border-2 border-dashed border-[#5B8DEF]/45 hover:border-[#3762C4] bg-[#FAF9F6]/70 hover:bg-[#FFFFFF] p-6 flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#EAF0FC] border border-[#5B8DEF]/25 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-[#3762C4]" />
                </div>
                <div>
                  <div className="font-display text-sm font-bold text-[#121316]">
                    Add Another Notebook
                  </div>
                  <p className="text-xs text-[#424652] mt-1 max-w-[180px]">
                    Start a separate notebook for another class or discussion
                  </p>
                </div>
              </motion.button>
            </div>
          </div>
        ) : (
          /* CASE 3: Open Physical Spiral Notebook Workspace */
          <div className="space-y-4">
            {/* Top Notebook Breadcrumb & Quick Switcher Bar */}
            <div className="glass-card rounded-2xl px-3.5 py-2.5 sm:px-4 flex flex-wrap items-center justify-between gap-2.5 relative z-30">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    playPageTurnSound();
                    setFontMenuOpen(false);
                    setSwitcherOpen(false);
                    setActiveNotebookId(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-[#EAF0FC] border border-[#121316]/10 px-3 py-1.5 text-xs font-semibold text-[#121316] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#3762C4]" />
                  <span>All Notebooks</span>
                </button>

                {/* Current Notebook Cover Badge + Switcher Popover */}
                <div className="relative" ref={switcherRef}>
                  <button
                    type="button"
                    onClick={() => {
                      playPenTapSound();
                      setSwitcherOpen((o) => !o);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#ECE9E1]/80 hover:bg-[#ECE9E1] px-3 py-1.5 text-xs font-semibold text-[#121316] transition-colors cursor-pointer"
                  >
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: activeCoverTheme.swatch }}
                    />
                    <span className="truncate max-w-[160px] sm:max-w-[240px]">
                      {activeNotebook.name}
                    </span>
                    <span className="hidden sm:inline text-[10px] font-medium text-[#424652] bg-white px-2 py-0.5 rounded-full border border-[#121316]/[0.08]">
                      {activeNotebook.subject || 'General'}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#424652] transition-transform ${
                        switcherOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {switcherOpen && (
                    <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-[#FFFFFF] border border-[#121316]/12 shadow-xl p-1.5 z-50">
                      <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#6E7382]">
                        Switch Notebook
                      </div>
                      <div className="max-h-56 overflow-y-auto space-y-0.5">
                        {notebooks.map((nb) => {
                          const cTheme = getCoverTheme(nb.coverColor);
                          const isCurr = nb.id === activeNotebook.id;
                          return (
                            <button
                              key={nb.id}
                              type="button"
                              onClick={() => handleOpenNotebook(nb)}
                              className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                                isCurr
                                  ? 'bg-[#EAF0FC] font-semibold text-[#121316]'
                                  : 'hover:bg-[#F5F3EE] text-[#121316]'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                                  style={{ backgroundColor: cTheme.swatch }}
                                />
                                <span className="truncate">{nb.name}</span>
                              </div>
                              <span className="text-[10px] text-[#6E7382] shrink-0">
                                {nb.pages?.length || 0}p
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-1 pt-1 border-t border-[#121316]/[0.08]">
                        <button
                          type="button"
                          onClick={() => {
                            setSwitcherOpen(false);
                            setIsCreatorModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#2F59B8] hover:bg-[#EAF0FC] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>New Notebook</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Page Flipper Stepper */}
              {activePages.length > 0 && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <div className="inline-flex items-center rounded-xl bg-white border border-[#121316]/10 p-0.5">
                    <button
                      type="button"
                      onClick={() => handleFlipStep(-1)}
                      disabled={!hasPrevPage}
                      title="Turn to previous page"
                      aria-label="Turn to previous page"
                      className="p-1.5 rounded-lg text-[#121316] hover:bg-[#EAF0FC] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2.5 text-[11px] font-semibold text-[#121316] tabular-nums">
                      Page {activePageIndex + 1} of {activePages.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFlipStep(1)}
                      disabled={!hasNextPage}
                      title="Turn to next page"
                      aria-label="Turn to next page"
                      className="p-1.5 rounded-lg text-[#121316] hover:bg-[#EAF0FC] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={handleCreatePage}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#3762C4] hover:bg-[#2F59B8] text-white text-xs font-semibold px-3 py-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Page</span>
                  </motion.button>
                </div>
              )}
            </div>

            {/* Split Workspace: Pages Index + Physical Spiral Notebook */}
            <div className="flex flex-col lg:flex-row gap-5 items-start">
              {/* Mobile Page Picker */}
              <div className="w-full lg:hidden flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setMobileListOpen((prev) => !prev)}
                  className="flex-1 glass-card rounded-2xl px-4 py-2.5 flex items-center justify-between gap-2 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#121316] flex items-center justify-center shrink-0">
                      <NotebookPen className="w-4 h-4 text-[#5B8DEF]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#121316] truncate">
                        {activeNote?.title || 'Pages in Notebook'}
                      </div>
                      <div className="text-[11px] text-[#424652]">
                        {activePages.length} page
                        {activePages.length === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#424652] transition-transform ${
                      mobileListOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Left Notebook Pages Index Sidebar */}
              <aside
                className={`w-full lg:w-72 xl:w-80 shrink-0 glass-card rounded-panel p-4 flex-col gap-3.5 lg:sticky lg:top-24 ${
                  mobileListOpen ? 'flex' : 'hidden lg:flex'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: activeCoverTheme.swatch }}
                    >
                      <NotebookPen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-display text-sm font-bold text-[#121316] truncate">
                        {activeNotebook.name}
                      </h2>
                      <p className="text-[11px] text-[#424652]">
                        {activePages.length} page
                        {activePages.length === 1 ? '' : 's'} inside
                      </p>
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleCreatePage}
                    className="hidden lg:inline-flex items-center gap-1 rounded-xl bg-[#3762C4] hover:bg-[#2F59B8] text-white text-xs font-semibold px-3 py-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Page</span>
                  </motion.button>
                </div>

                {/* Search Pages Inside Current Notebook */}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6E7382]" />
                  <input
                    type="text"
                    value={pageSearch}
                    onChange={(e) => setPageSearch(e.target.value)}
                    placeholder="Search pages in notebook..."
                    aria-label="Search pages in current notebook"
                    className="w-full rounded-xl bg-white border border-[#121316]/10 pl-8 pr-7 py-2 text-xs text-[#121316] placeholder:text-[#6E7382] focus:outline-none focus:border-[#5B8DEF]"
                  />
                  {pageSearch && (
                    <button
                      type="button"
                      onClick={() => setPageSearch('')}
                      aria-label="Clear page search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6E7382] hover:text-[#121316] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* All / Bookmarked Filter */}
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#ECE9E1]">
                  {[
                    { key: 'all', label: 'All Pages' },
                    { key: 'bookmarked', label: 'Bookmarked' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setListFilter(tab.key)}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        listFilter === tab.key
                          ? 'bg-[#FFFFFF] text-[#121316] shadow-sm'
                          : 'text-[#424652] hover:text-[#121316]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Numbered Notebook Page Cards */}
                <div className="flex flex-col gap-2 max-h-[340px] lg:max-h-[calc(100dvh-20rem)] overflow-y-auto pr-0.5">
                  {filteredPages.length > 0 ? (
                    filteredPages.map(({ page, pageNumber }) => {
                      const isSelected = page.id === activePageId;
                      const badgeStyle = getSubjectStyle(page.subject);
                      const snippet = (page.content || '').trim();

                      return (
                        <div
                          key={page.id}
                          onClick={() => handleSelectPage(page.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSelectPage(page.id);
                            }
                          }}
                          className={`group relative rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#FFFFFF] border-[#5B8DEF] shadow-sm'
                              : 'bg-[#FAF9F6]/80 hover:bg-[#FFFFFF] border-[#121316]/[0.08]'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`absolute left-1.5 top-3 bottom-3 w-1 rounded-full ${
                              isSelected ? 'bg-[#3762C4]' : 'bg-[#121316]/10'
                            }`}
                          />

                          <div className="pl-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EAF0FC] text-[#2F59B8] shrink-0">
                                  p.{pageNumber}
                                </span>
                                <h3 className="text-xs sm:text-sm font-semibold text-[#121316] truncate">
                                  {page.title || `Page ${pageNumber}`}
                                </h3>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {page.bookmarked && (
                                  <Bookmark className="w-3.5 h-3.5 text-[#3762C4] fill-[#5B8DEF]" />
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => handleDeletePage(page.id, e)}
                                  aria-label={`Delete ${page.title || 'page'}`}
                                  className="touch-reveal opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-md text-[#6E7382] hover:text-[#121316] hover:bg-[#121316]/[0.07] transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-[11px] text-[#424652] line-clamp-2 mt-1 min-h-[1rem]">
                              {snippet ||
                                (page.images?.length && page.strokes?.length
                                  ? `${page.images.length} photo${page.images.length === 1 ? '' : 's'} · ${page.strokes.length} ink`
                                  : page.images?.length
                                    ? `${page.images.length} photo${page.images.length === 1 ? '' : 's'} attached`
                                    : page.strokes?.length
                                      ? `${page.strokes.length} handwritten stroke${
                                          page.strokes.length === 1 ? '' : 's'
                                        }`
                                      : 'Blank ruled page — ready for notes')}
                            </p>

                            <div className="flex items-center justify-between gap-2 mt-2">
                              <span
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border truncate max-w-[120px] ${badgeStyle.chipClass}`}
                              >
                                {page.subject || 'General'}
                              </span>
                              <span className="text-[10px] text-[#6E7382] shrink-0">
                                {formatNoteTimestamp(page.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 px-3">
                      <FileText className="w-6 h-6 text-[#6E7382] mx-auto mb-2" />
                      <p className="text-xs font-medium text-[#424652]">
                        No matching pages
                      </p>
                    </div>
                  )}
                </div>
              </aside>

              {/* Right Physical Notebook Desk */}
              <section className="flex-1 min-w-0 w-full flex flex-col gap-3.5">
                {activeNote ? (
                  <>
                    {/* Notebook Desk Formatting Toolbar */}
                    <div className="glass-card rounded-2xl p-2.5 sm:px-4 flex flex-wrap items-center justify-between gap-2.5 relative z-20">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Mode Toggle: Type vs Handwrite */}
                        <div className="inline-flex items-center p-1 rounded-xl bg-[#ECE9E1]">
                          <button
                            type="button"
                            onClick={() => {
                              playPenTapSound();
                              setEditorMode('type');
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              editorMode === 'type'
                                ? 'bg-[#FFFFFF] text-[#121316] shadow-sm'
                                : 'text-[#424652] hover:text-[#121316]'
                            }`}
                          >
                            <Type className="w-3.5 h-3.5 text-[#3762C4]" />
                            <span>Type Notes</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              playPenTapSound();
                              setFontMenuOpen(false);
                              setEditorMode('draw');
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              editorMode === 'draw'
                                ? 'bg-[#3762C4] text-white shadow-sm'
                                : 'text-[#424652] hover:text-[#121316]'
                            }`}
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>Handwrite</span>
                          </button>
                        </div>

                        {/* Interactive Font Chooser Dropdown */}
                        <div className="relative" ref={fontMenuRef}>
                          <button
                            type="button"
                            onClick={() => {
                              playPenTapSound();
                              setFontMenuOpen((o) => !o);
                            }}
                            title="Change notebook font"
                            aria-haspopup="listbox"
                            aria-expanded={fontMenuOpen}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EAF0FC] hover:bg-[#DCE7FA] border border-[#5B8DEF]/30 text-xs font-semibold text-[#121316] transition-colors cursor-pointer"
                          >
                            <NotebookPen className="w-3.5 h-3.5 text-[#3762C4]" />
                            <span className={activeFontMeta.fontClass}>
                              {activeFontMeta.label}
                            </span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-[#424652] transition-transform ${
                                fontMenuOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {fontMenuOpen && (
                            <div
                              role="listbox"
                              aria-label="Choose notebook font"
                              className="absolute left-0 mt-2 w-64 rounded-2xl bg-[#FFFFFF] border border-[#121316]/12 shadow-xl p-1.5 z-50"
                            >
                              <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#6E7382]">
                                Notebook Fonts
                              </div>
                              {NOTEBOOK_FONTS.map((font) => {
                                const selected = activeFontMeta.key === font.key;
                                return (
                                  <button
                                    key={font.key}
                                    type="button"
                                    role="option"
                                    aria-selected={selected}
                                    onClick={() => {
                                      playPenTapSound();
                                      handleRecordedPatch({ fontStyle: font.key });
                                      setFontMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                                      selected
                                        ? 'bg-[#EAF0FC] text-[#121316]'
                                        : 'hover:bg-[#F5F3EE] text-[#121316]'
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      <div
                                        className={`text-sm font-semibold leading-tight ${font.fontClass}`}
                                      >
                                        {font.label}
                                      </div>
                                      <div className="text-[10px] text-[#424652] truncate">
                                        {font.category} · {font.preview}
                                      </div>
                                    </div>
                                    {selected && (
                                      <Check className="w-3.5 h-3.5 text-[#3762C4] shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Add Photo / Paste Image Control */}
                        <input
                          ref={photoInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const selected = e.target.files
                              ? Array.from(e.target.files)
                              : [];
                            e.target.value = '';
                            if (selected.length > 0) {
                              handleInsertImages(selected);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            playPenTapSound();
                            setFontMenuOpen(false);
                            photoInputRef.current?.click();
                          }}
                          disabled={isInsertingImage}
                          title="Add photo or paste screenshot (Ctrl+V)"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#EAF0FC] border border-[#121316]/10 text-xs font-semibold text-[#121316] transition-colors cursor-pointer disabled:opacity-60"
                        >
                          <ImagePlus className="w-3.5 h-3.5 text-[#3762C4]" />
                          <span>{isInsertingImage ? 'Adding...' : 'Photo'}</span>
                        </button>

                        {/* Type Stamps or Draw Controls */}
                        {editorMode === 'type' ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div className="hidden sm:block h-5 w-px bg-[#121316]/12 mx-0.5" />
                            {DISCUSSION_STAMPS.map(
                              ({ label, icon: Icon, ...rest }) => (
                                <button
                                  key={label}
                                  type="button"
                                  onClick={() =>
                                    handleInsertStamp({ label, ...rest })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#EAF0FC] border border-[#121316]/10 text-[11px] font-medium text-[#121316] transition-colors cursor-pointer"
                                  title={`Insert ${label.toLowerCase()} marker`}
                                >
                                  <Icon className="w-3 h-3 text-[#3762C4]" />
                                  <span className="hidden sm:inline">
                                    {label}
                                  </span>
                                </button>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div className="hidden sm:block h-5 w-px bg-[#121316]/12 mx-0.5" />
                            {[
                              { key: 'pen', label: 'Pen', icon: PenTool },
                              {
                                key: 'highlighter',
                                label: 'Highlight',
                                icon: Highlighter,
                              },
                              { key: 'eraser', label: 'Erase', icon: Eraser },
                            ].map(({ key, label, icon: Icon }) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => {
                                  playPenTapSound();
                                  setDrawTool(key);
                                }}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                                  drawTool === key
                                    ? 'bg-[#121316] border-[#121316] text-white'
                                    : 'bg-white border-[#121316]/10 text-[#121316] hover:bg-[#FAF9F6]'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{label}</span>
                              </button>
                            ))}

                            {drawTool !== 'eraser' && (
                              <div className="inline-flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-white border border-[#121316]/10">
                                {INK_SWATCHES.map((swatch) => (
                                  <button
                                    key={swatch.color}
                                    type="button"
                                    onClick={() => {
                                      playPenTapSound();
                                      setDrawColor(swatch.color);
                                    }}
                                    aria-label={swatch.label}
                                    title={swatch.label}
                                    style={{ backgroundColor: swatch.color }}
                                    className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                                      drawColor === swatch.color
                                        ? 'scale-110 ring-2 ring-[#5B8DEF] ring-offset-2'
                                        : 'hover:scale-110 opacity-85'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}

                            {strokeCount > 0 && (
                              <button
                                type="button"
                                onClick={handleClearInk}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FAF9F6] hover:bg-[#121316] border border-[#121316]/15 text-[11px] font-semibold text-[#121316] hover:text-white transition-colors cursor-pointer"
                              >
                                Clear Ink
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right Controls: Undo/Redo, Paper Lining, Copy, Bookmark */}
                      <div className="flex items-center gap-1.5 ml-auto flex-wrap">
                        <div className="inline-flex items-center p-0.5 rounded-xl bg-[#ECE9E1]">
                          <button
                            type="button"
                            onClick={handleUndo}
                            disabled={!canUndo}
                            aria-label="Undo (Ctrl+Z)"
                            title="Undo (Ctrl+Z)"
                            className="p-1.5 rounded-lg text-[#121316] hover:bg-white disabled:opacity-35 transition-colors cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleRedo}
                            disabled={!canRedo}
                            aria-label="Redo (Ctrl+Y)"
                            title="Redo (Ctrl+Y)"
                            className="p-1.5 rounded-lg text-[#121316] hover:bg-white disabled:opacity-35 transition-colors cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Redo2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="inline-flex items-center p-0.5 rounded-xl bg-[#ECE9E1]">
                          {PAPER_STYLES.map((style) => (
                            <button
                              key={style.key}
                              type="button"
                              onClick={() => {
                                playPenTapSound();
                                handleRecordedPatch({ paperStyle: style.key });
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                                (activeNote.paperStyle || 'ruled') === style.key
                                  ? 'bg-[#FFFFFF] text-[#121316] shadow-sm'
                                  : 'text-[#424652] hover:text-[#121316]'
                              }`}
                            >
                              {style.label}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={handleCopyPage}
                          title="Copy note text"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF9F6] border border-[#121316]/10 text-[11px] font-medium text-[#424652] hover:text-[#121316] cursor-pointer"
                        >
                          {copiedId === activeNote.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#3762C4]" />
                              <span className="hidden sm:inline text-[#2F59B8] font-semibold">
                                Copied
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playPenTapSound();
                            handleRecordedPatch({
                              bookmarked: !activeNote.bookmarked,
                            });
                          }}
                          aria-label={
                            activeNote.bookmarked
                              ? 'Remove bookmark'
                              : 'Bookmark page'
                          }
                          title={
                            activeNote.bookmarked
                              ? 'Bookmarked page'
                              : 'Bookmark page'
                          }
                          className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                            activeNote.bookmarked
                              ? 'bg-[#EAF0FC] border-[#5B8DEF]/45 text-[#2F59B8]'
                              : 'bg-white border-[#121316]/10 text-[#424652] hover:text-[#121316]'
                          }`}
                        >
                          <Bookmark
                            className={`w-4 h-4 ${
                              activeNote.bookmarked
                                ? 'fill-[#5B8DEF] text-[#3762C4]'
                                : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Physical Spiral-Bound Notebook with 3D Page-Turn Stage */}
                    <div className="notebook-paper relative rounded-r-3xl rounded-l-xl border border-[#121316]/12 flex overflow-hidden">
                      {/* Hardcover Back Lip Accent Matching Chosen Cover */}
                      <div
                        aria-hidden="true"
                        className="w-2 sm:w-2.5 shrink-0 rounded-l-xl"
                        style={{ backgroundColor: activeCoverTheme.swatch }}
                      />

                      {/* Realistic Repeating Twin-Wire Spiral Binding Spine */}
                      <div
                        aria-hidden="true"
                        className="relative w-7 sm:w-9 shrink-0 bg-gradient-to-r from-[#ECE9E1] via-[#F5F3EE] to-[#ECE9E1] border-r border-[#121316]/12 select-none z-30"
                      >
                        <svg className="absolute inset-0 w-full h-full block">
                          <defs>
                            <linearGradient
                              id={spiralMetalId}
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor="#424652" />
                              <stop offset="45%" stopColor="#FAF9F6" />
                              <stop offset="100%" stopColor="#121316" />
                            </linearGradient>
                            <pattern
                              id={spiralPatternId}
                              width="36"
                              height="44"
                              patternUnits="userSpaceOnUse"
                            >
                              <circle
                                cx="24"
                                cy="22"
                                r="4.8"
                                fill="#E2DFD6"
                                stroke="#B9B5AC"
                                strokeWidth="1"
                              />
                              <path
                                d="M 2,20 C 9,13 19,13 25,21"
                                stroke={`url(#${spiralMetalId})`}
                                strokeWidth="3.2"
                                strokeLinecap="round"
                                fill="none"
                              />
                              <path
                                d="M 2,24 C 9,28 19,27 24,23"
                                stroke="#121316"
                                strokeOpacity="0.35"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                fill="none"
                              />
                            </pattern>
                          </defs>
                          <rect
                            width="100%"
                            height="100%"
                            fill={`url(#${spiralPatternId})`}
                          />
                        </svg>
                      </div>

                      {/* 3D Perspective Paper Sheet Stack */}
                      <div
                        className="relative flex-1 min-w-0 rounded-r-3xl overflow-hidden"
                        style={{
                          perspective: '2000px',
                          transformStyle: 'preserve-3d',
                        }}
                      >
                        {/* Active Interactive Archival Paper Sheet */}
                        <motion.div
                          key={activeNote.id}
                          initial={{ opacity: 0.78, scale: 0.994 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.34,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="relative z-10 bg-gradient-to-b from-[#FFFFFF] to-[#FAF9F6]"
                        >
                          {/* Physical Cornflower Bookmark Ribbon Tab */}
                          {activeNote.bookmarked && (
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute top-0 right-6 sm:right-10 w-6 h-9 bg-[#5B8DEF] shadow-sm z-20"
                              style={{
                                clipPath:
                                  'polygon(0 0, 100% 0, 100% 100%, 50% 76%, 0 100%)',
                              }}
                            />
                          )}

                          {/* Top Notebook Margin Header */}
                          <div className="relative px-4 sm:px-7 pt-5 pb-3 border-b-2 border-[#5B8DEF]/25">
                            {(activeNote.paperStyle || 'ruled') === 'ruled' && (
                              <div
                                aria-hidden="true"
                                className="pointer-events-none absolute top-0 bottom-0 left-7 sm:left-10 border-l-2 border-[#5B8DEF]/35"
                              />
                            )}

                            <div className="pl-6 sm:pl-7">
                              <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${subjectStyle.chipClass}`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${subjectStyle.dotClass}`}
                                    />
                                    <input
                                      type="text"
                                      data-notebook-editor="true"
                                      value={activeNote.subject || ''}
                                      onChange={(e) =>
                                        handleTextFieldChange(
                                          'subject',
                                          e.target.value
                                        )
                                      }
                                      placeholder="Subject / Topic"
                                      aria-label="Note subject or course"
                                      className="bg-transparent w-24 sm:w-32 focus:outline-none text-[11px] font-semibold placeholder:opacity-60"
                                    />
                                  </span>
                                  <span className="text-[11px] text-[#6E7382]">
                                    {formatNoteTimestamp(activeNote.updatedAt)}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-[#6E7382] tabular-nums">
                                  <span>{wordCount} words</span>
                                  {imageCount > 0 && (
                                    <span>
                                      · {imageCount} photo
                                      {imageCount === 1 ? '' : 's'}
                                    </span>
                                  )}
                                  {strokeCount > 0 && (
                                    <span>· {strokeCount} ink</span>
                                  )}
                                  <span className="inline-flex items-center gap-1 text-[#2F59B8] font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#5B8DEF]" />
                                    Saved
                                  </span>
                                </div>
                              </div>

                              <input
                                type="text"
                                data-notebook-editor="true"
                                value={activeNote.title || ''}
                                onChange={(e) =>
                                  handleTextFieldChange('title', e.target.value)
                                }
                                placeholder="Discussion Title..."
                                aria-label="Note title"
                                className={`mt-2 w-full bg-transparent text-[#121316] placeholder:text-[#6E7382]/70 focus:outline-none ${activeFontMeta.titleClass}`}
                              />
                            </div>
                          </div>

                          {/* Ruled / Grid / Dot Lined Writing Body + Photos + Ink Canvas */}
                          <div
                            ref={paperBodyRef}
                            onDragOver={(e) => {
                              if (
                                Array.from(e.dataTransfer?.types || []).includes(
                                  'Files'
                                )
                              ) {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'copy';
                                if (!isDragOverSheet) setIsDragOverSheet(true);
                              }
                            }}
                            onDragLeave={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget)) {
                                setIsDragOverSheet(false);
                              }
                            }}
                            onDrop={(e) => {
                              const dropped = Array.from(
                                e.dataTransfer?.files || []
                              ).filter(isImageFile);
                              setIsDragOverSheet(false);
                              if (dropped.length === 0) return;
                              e.preventDefault();
                              handleInsertImages(dropped, {
                                clientY: e.clientY,
                              });
                            }}
                            className={`relative transition-shadow ${
                              isDragOverSheet
                                ? 'ring-2 ring-inset ring-[#5B8DEF]/55 bg-[#5B8DEF]/[0.04]'
                                : ''
                            }`}
                            style={getPaperBackgroundStyle(
                              activeNote.paperStyle || 'ruled'
                            )}
                          >
                            {(activeNote.paperStyle || 'ruled') === 'ruled' && (
                              <div
                                aria-hidden="true"
                                className="pointer-events-none absolute top-0 bottom-0 left-7 sm:left-10 border-l-2 border-[#5B8DEF]/35 z-10"
                              />
                            )}

                            <textarea
                              ref={textareaRef}
                              data-notebook-editor="true"
                              value={activeNote.content || ''}
                              onChange={(e) =>
                                handleTextFieldChange('content', e.target.value)
                              }
                              onFocus={(e) => {
                                lastTextareaCursorRef.current =
                                  e.target.selectionStart ?? null;
                              }}
                              onClick={(e) => {
                                lastTextareaCursorRef.current =
                                  e.target.selectionStart ?? null;
                              }}
                              onSelect={(e) => {
                                lastTextareaCursorRef.current =
                                  e.target.selectionStart ?? null;
                              }}
                              onKeyUp={(e) => {
                                lastTextareaCursorRef.current =
                                  e.target.selectionStart ?? null;
                              }}
                              readOnly={editorMode === 'draw'}
                              placeholder={
                                editorMode === 'draw'
                                  ? 'Freehand Pen Mode active — write or sketch right on the page...'
                                  : 'Start jotting discussion points or paste (Ctrl+V) a photo right on the page...'
                              }
                              aria-label="Notebook page content"
                              style={{
                                lineHeight: `${LINE_HEIGHT}px`,
                                color: activeNote.textInkColor || '#121316',
                              }}
                              className={`relative z-10 block w-full min-h-[704px] bg-transparent pl-10 sm:pl-14 pr-5 sm:pr-8 py-0 resize-none overflow-hidden focus:outline-none placeholder:text-[#6E7382]/65 ${activeFontMeta.bodyClass}`}
                            />

                            {/* Resizable / Movable Discussion Photos Layer */}
                            <NotebookImageLayer
                              images={activeNote.images || []}
                              interactive={editorMode === 'type'}
                              selectedId={selectedImageId}
                              onSelect={setSelectedImageId}
                              onCommit={handleCommitImage}
                              onDelete={handleDeleteImage}
                            />

                            {/* Freehand Sketch & Writing Ink Layer */}
                            <NotebookInkCanvas
                              strokes={activeNote.strokes || []}
                              active={editorMode === 'draw'}
                              tool={drawTool}
                              color={drawColor}
                              onAddStroke={handleAddStroke}
                              onEraseStart={handleEraseStart}
                              onEraseStrokes={handleEraseStrokes}
                              onEraseEnd={handleEraseEnd}
                            />
                          </div>

                          {/* Paper Footer: Text Ink Colors + Tactile Page Flipper + Folded Dog-Ear */}
                          <div className="relative px-5 sm:px-8 py-3 bg-[#F5F3EE]/90 border-t border-[#121316]/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#424652]">
                            <div className="flex items-center gap-3.5 flex-wrap">
                              {editorMode === 'type' && (
                                <div className="flex items-center gap-2.5">
                                  <span className="text-[#6E7382]">
                                    Text ink:
                                  </span>
                                  <div className="inline-flex items-center gap-2.5 px-0.5">
                                    {[
                                      { color: '#121316', label: 'Ink Black' },
                                      { color: '#2F59B8', label: 'Cornflower Ink' },
                                    ].map((ink) => (
                                      <button
                                        key={ink.color}
                                        type="button"
                                        onClick={() => {
                                          playPenTapSound();
                                          handleRecordedPatch({
                                            textInkColor: ink.color,
                                          });
                                        }}
                                        aria-label={`${ink.label} text color`}
                                        title={ink.label}
                                        style={{ backgroundColor: ink.color }}
                                        className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-transform ${
                                          (activeNote.textInkColor || '#121316') ===
                                          ink.color
                                            ? 'scale-110 ring-2 ring-[#5B8DEF] ring-offset-2'
                                            : 'opacity-75 hover:opacity-100'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                              <span className="text-[#6E7382]">
                                Ctrl+V paste photo · Ctrl+Z undo · Font: {activeFontMeta.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                              <button
                                type="button"
                                onClick={() => handleFlipStep(-1)}
                                disabled={!hasPrevPage}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#FAF9F6] border border-[#121316]/12 text-[11px] font-semibold text-[#121316] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span>Prev</span>
                              </button>

                              <span className="font-semibold text-[#121316] tabular-nums px-1">
                                p.{activePageIndex + 1} / {activePages.length}
                              </span>

                              {hasNextPage ? (
                                <button
                                  type="button"
                                  onClick={() => handleFlipStep(1)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#FAF9F6] border border-[#121316]/12 text-[11px] font-semibold text-[#121316] cursor-pointer"
                                >
                                  <span>Next</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleCreatePage}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAF0FC] hover:bg-[#DCE7FA] border border-[#5B8DEF]/35 text-[11px] font-semibold text-[#121316] cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5 text-[#3762C4]" />
                                  <span>Next New Page</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>

                        {/* 3D Animated Turning Page Overlay */}
                        <AnimatePresence>
                          {turningSheet && (
                            <PageTurnOverlay
                              key={turningSheet.id}
                              turn={turningSheet}
                              onComplete={(completedId) =>
                                setTurningSheet((curr) =>
                                  curr?.id === completedId ? null : curr
                                )
                              }
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="glass-card rounded-panel p-8 sm:p-12">
                    <EmptyState
                      title="This notebook has no pages yet"
                      description="Add a fresh sheet to start taking discussion notes, choosing fonts, or sketching right on the page."
                      ctaLabel="Add Page 1"
                      onAction={handleCreatePage}
                    />
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* Modal Notebook Creator when adding another notebook */}
        <AnimatePresence>
          {isCreatorModalOpen && (
            <NotebookCreator
              variant="modal"
              onCreateNotebook={handleCreateNotebook}
              onClose={() => setIsCreatorModalOpen(false)}
              legacyCount={legacyNotes.length}
              onImportLegacyNotes={() => {
                handleImportLegacyNotes();
                setIsCreatorModalOpen(false);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
