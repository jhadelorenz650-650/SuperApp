import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  CalendarDays,
  Check,
  Clock,
  Copy,
  Download,
  Filter,
  Layers,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { ClassModal } from '../components/ClassModal';
import { EmptyState } from '../components/EmptyState';
import { PageTransition } from '../components/PageTransition';
import { TimetableCourseList } from '../components/TimetableCourseList';
import { TimetableDayAgenda } from '../components/TimetableDayAgenda';
import { TimetableLiveRadar } from '../components/TimetableLiveRadar';
import { TimetableWeeklyGrid } from '../components/TimetableWeeklyGrid';
import {
  broadcastStorageChange,
  useLocalStorage,
} from '../hooks/useLocalStorage';
import { createBlankPage, NOTEBOOK_COVERS } from '../utils/notebookPresets';
import {
  downloadICSFile,
  formatTimeRange,
  getSampleTimetable,
} from '../utils/timetablePresets';
import {
  playPageTurnSound,
  playPenTapSound,
  playTaskDeleteSound,
  playTaskDoneSound,
} from '../utils/soundEffects';

export function Timetable() {
  const navigate = useNavigate();

  // Primary timetable persistent storage
  const [classes, setClasses] = useLocalStorage(
    'superapp_timetable_v1',
    getSampleTimetable
  );

  // View mode: 'grid' (Weekly Grid) | 'agenda' (Day Agenda) | 'courses' (Directory & Attendance)
  const [viewMode, setViewMode] = useState('grid');
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date().getDay();
    return today;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // Filtered classes based on search
  const filteredClasses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(
      (c) =>
        (c.title || '').toLowerCase().includes(q) ||
        (c.courseCode || '').toLowerCase().includes(q) ||
        (c.subject || '').toLowerCase().includes(q) ||
        (c.instructor || '').toLowerCase().includes(q) ||
        (c.location || '').toLowerCase().includes(q)
    );
  }, [classes, searchQuery]);

  // Open modal for new class (optionally pre-selecting day)
  const handleOpenNewClass = (initialDay = null) => {
    playPenTapSound();
    if (typeof initialDay === 'number') {
      setEditingClass({ days: [initialDay] });
    } else {
      setEditingClass(null);
    }
    setIsModalOpen(true);
  };

  // Open modal to edit existing class
  const handleOpenEditClass = (classItem) => {
    playPenTapSound();
    setEditingClass(classItem);
    setIsModalOpen(true);
  };

  // Save class (create or update)
  const handleSaveClass = (savedClass) => {
    playTaskDoneSound();
    setClasses((prev) => {
      const exists = prev.some((c) => c.id === savedClass.id);
      if (exists) {
        return prev.map((c) => (c.id === savedClass.id ? savedClass : c));
      }
      return [savedClass, ...prev];
    });
    setIsModalOpen(false);
    setEditingClass(null);
  };

  // Delete class
  const handleDeleteClass = (id) => {
    playTaskDeleteSound();
    setClasses((prev) => prev.filter((c) => c.id !== id));
    setIsModalOpen(false);
    setEditingClass(null);
  };

  // Quick Attendance update (+1 present or +1 absent)
  const handleUpdateAttendance = (id, action) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const currentAtt = c.attendance || { attended: 0, missed: 0, targetPct: 80 };
        return {
          ...c,
          attendance: {
            ...currentAtt,
            attended: action === 'attended' ? (currentAtt.attended || 0) + 1 : currentAtt.attended,
            missed: action === 'missed' ? (currentAtt.missed || 0) + 1 : currentAtt.missed,
          },
          updatedAt: Date.now(),
        };
      })
    );
  };

  // Direct notebook launcher for a course
  const handleOpenNotebookForSubject = (subjectName) => {
    if (!subjectName) {
      navigate('/notes');
      return;
    }

    try {
      const raw = window.localStorage.getItem('superapp_notebooks_v1');
      let notebooks = [];
      if (raw) {
        notebooks = JSON.parse(raw) || [];
      }

      // Check if notebook for this subject already exists
      const targetQuery = subjectName.trim().toLowerCase();
      let match = notebooks.find(
        (nb) =>
          (nb.subject || '').trim().toLowerCase() === targetQuery ||
          (nb.name || '').trim().toLowerCase() === targetQuery
      );

      // If not, automatically create a dedicated notebook for this course
      if (!match) {
        const now = Date.now();
        const firstPage = createBlankPage({
          subject: subjectName,
          paperStyle: 'ruled',
          fontStyle: 'handwriting',
          title: `Lecture 1 — ${subjectName} Overview`,
        });

        match = {
          id: `nb-${now}-${Math.random().toString(36).slice(2, 6)}`,
          name: `${subjectName} Notes`,
          subject: subjectName,
          coverColor: 'indigo',
          defaultPaperStyle: 'ruled',
          defaultFontStyle: 'handwriting',
          createdAt: now,
          updatedAt: now,
          pages: [firstPage],
        };

        const updatedNotebooks = [match, ...notebooks];
        window.localStorage.setItem('superapp_notebooks_v1', JSON.stringify(updatedNotebooks));
        broadcastStorageChange('superapp_notebooks_v1', updatedNotebooks);
      }

      window.sessionStorage.setItem('superapp_active_notebook_id_v1', match.id);
      playPageTurnSound();
      navigate('/notes');
    } catch {
      navigate('/notes');
    }
  };

  // Export to .ics calendar
  const handleExportICS = () => {
    playPenTapSound();
    downloadICSFile(classes);
  };

  // Share text schedule
  const handleCopyScheduleText = () => {
    playPenTapSound();
    const today = new Date().getDay();
    const todayClasses = classes
      .filter((c) => (c.days || []).includes(today))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    let text = `My Class Schedule for Today:\n`;
    if (todayClasses.length === 0) {
      text += `No classes scheduled today.\n`;
    } else {
      todayClasses.forEach((c) => {
        text += `• ${formatTimeRange(c.startTime, c.endTime)}: ${c.courseCode ? `${c.courseCode} - ` : ''}${c.title} (${c.location || 'Online'})\n`;
      });
    }
    text += `\nShared via Pulse — Student OS`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2400);
    });
  };

  // Reset to sample timetable
  const handleResetSample = () => {
    playPenTapSound();
    setClasses(getSampleTimetable());
  };

  return (
    <PageTransition>
      <div className="space-y-5 pb-6">
        {/* Top Header & View Controls Bar */}
        <div className="glass-card rounded-panel p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#121316] flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-[#5B8DEF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg sm:text-xl font-bold text-[#121316] tracking-tight">
                  Class Timetable
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF0FC] text-[#2F59B8] border border-[#5B8DEF]/30">
                  v2 Unlocked
                </span>
              </div>
              <p className="text-xs text-[#424652] mt-0.5">
                {classes.length} registered course{classes.length === 1 ? '' : 's'} • Live class radar & attendance tracker
              </p>
            </div>
          </div>

          {/* Action Tools & Switchers */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle: Grid, Agenda, Directory */}
            <div className="inline-flex items-center p-1 rounded-xl bg-[#ECE9E1] border border-[#121316]/[0.08]">
              <button
                type="button"
                onClick={() => {
                  playPenTapSound();
                  setViewMode('grid');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#121316] shadow-sm'
                    : 'text-[#424652] hover:text-[#121316]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#5B8DEF]" />
                <span className="hidden sm:inline">Weekly Grid</span>
                <span className="sm:hidden">Grid</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playPenTapSound();
                  setViewMode('agenda');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'agenda'
                    ? 'bg-white text-[#121316] shadow-sm'
                    : 'text-[#424652] hover:text-[#121316]'
                }`}
              >
                <List className="w-3.5 h-3.5 text-[#5B8DEF]" />
                <span className="hidden sm:inline">Day Agenda</span>
                <span className="sm:hidden">Agenda</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playPenTapSound();
                  setViewMode('courses');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'courses'
                    ? 'bg-white text-[#121316] shadow-sm'
                    : 'text-[#424652] hover:text-[#121316]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#5B8DEF]" />
                <span className="hidden sm:inline">Attendance & Courses</span>
                <span className="sm:hidden">Courses</span>
              </button>
            </div>

            {/* Weekend Toggle (Grid view only) */}
            {viewMode === 'grid' && (
              <button
                type="button"
                onClick={() => {
                  playPenTapSound();
                  setIncludeWeekends((prev) => !prev);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  includeWeekends
                    ? 'bg-[#EAF0FC] text-[#2F59B8] border-[#5B8DEF]/40'
                    : 'bg-white text-[#424652] border-[#121316]/[0.1] hover:bg-[#ECE9E1]/60'
                }`}
              >
                {includeWeekends ? '7 Days (All)' : '5 Days (Mon–Fri)'}
              </button>
            )}

            {/* Export & Share buttons */}
            <button
              type="button"
              onClick={handleExportICS}
              title="Export schedule to Apple/Google Calendar (.ics)"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#EAF0FC] border border-[#121316]/[0.1] text-xs font-semibold text-[#121316] shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#5B8DEF]" />
              <span className="hidden md:inline">Export .ICS</span>
            </button>

            <button
              type="button"
              onClick={handleCopyScheduleText}
              title="Copy today's schedule summary to clipboard"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#EAF0FC] border border-[#121316]/[0.1] text-xs font-semibold text-[#121316] shadow-sm transition-colors cursor-pointer"
            >
              {copiedToast ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-emerald-800">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#424652]" />
                  <span className="hidden md:inline">Share</span>
                </>
              )}
            </button>

            {/* New Class Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleOpenNewClass}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#121316] hover:bg-[#23252C] text-[#FAF9F6] text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#5B8DEF]" />
              <span>Add Class</span>
            </motion.button>
          </div>
        </div>

        {/* 1. Live Schedule Radar (Happening now, Up next, or Study gap) */}
        <TimetableLiveRadar
          classes={classes}
          onOpenClass={handleOpenEditClass}
          onOpenNotebookForSubject={handleOpenNotebookForSubject}
        />

        {/* Search Bar & Schedule Reset Hint */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E7382]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by course, room, instructor..."
              className="w-full rounded-xl bg-white border border-[#121316]/[0.12] pl-9 pr-8 py-2 text-xs text-[#121316] placeholder:text-[#6E7382] focus:outline-none focus:border-[#5B8DEF] focus:ring-2 focus:ring-[#5B8DEF]/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E7382] hover:text-[#121316] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {classes.length === 0 ? (
              <button
                type="button"
                onClick={handleResetSample}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F59B8] hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Load Sample Semester Schedule</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetSample}
                className="text-xs font-medium text-[#6E7382] hover:text-[#121316] transition-colors cursor-pointer"
                title="Restore default sample courses"
              >
                Reset to Sample
              </button>
            )}
          </div>
        </div>

        {/* 2. Main Selected View Render */}
        {filteredClasses.length > 0 ? (
          <div>
            {viewMode === 'grid' && (
              <TimetableWeeklyGrid
                classes={filteredClasses}
                includeWeekends={includeWeekends}
                onOpenClass={handleOpenEditClass}
                onOpenNotebookForSubject={handleOpenNotebookForSubject}
              />
            )}

            {viewMode === 'agenda' && (
              <TimetableDayAgenda
                classes={filteredClasses}
                selectedDayIndex={selectedDayIndex}
                onSelectDayIndex={setSelectedDayIndex}
                onOpenClass={handleOpenEditClass}
                onOpenNotebookForSubject={handleOpenNotebookForSubject}
                onUpdateAttendance={handleUpdateAttendance}
                onOpenNewClass={handleOpenNewClass}
              />
            )}

            {viewMode === 'courses' && (
              <TimetableCourseList
                classes={filteredClasses}
                onOpenClass={handleOpenEditClass}
                onOpenNotebookForSubject={handleOpenNotebookForSubject}
                onUpdateAttendance={handleUpdateAttendance}
                onDeleteClass={handleDeleteClass}
                onOpenNewClass={handleOpenNewClass}
              />
            )}
          </div>
        ) : (
          <div className="glass-card rounded-panel p-10 text-center space-y-4">
            <CalendarDays className="w-12 h-12 text-[#6E7382] mx-auto" />
            <div>
              <h3 className="font-display text-lg font-bold text-[#121316]">
                {searchQuery ? 'No matching classes found' : 'Your timetable is empty'}
              </h3>
              <p className="text-xs sm:text-sm text-[#424652] mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `No classes matching "${searchQuery}". Try clearing your search.`
                  : 'Add your courses to activate the weekly timetable, live schedule radar, and class notebook links.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-white border border-[#121316]/[0.12] text-xs font-semibold text-[#121316] cursor-pointer"
                >
                  Clear Search
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleResetSample}
                    className="px-4 py-2 rounded-xl bg-[#ECE9E1] text-[#121316] border border-[#121316]/[0.12] text-xs font-semibold cursor-pointer"
                  >
                    Load Sample Schedule
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenNewClass}
                    className="px-4 py-2 rounded-xl bg-[#121316] text-[#FAF9F6] text-xs font-semibold cursor-pointer"
                  >
                    Add Class (+)
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Class Modal for Create & Edit */}
        <ClassModal
          isOpen={isModalOpen}
          classItem={editingClass}
          existingClasses={classes}
          onClose={() => {
            setIsModalOpen(false);
            setEditingClass(null);
          }}
          onSave={handleSaveClass}
          onDelete={handleDeleteClass}
        />
      </div>
    </PageTransition>
  );
}
