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
import { useLocalStorage } from '../hooks/useLocalStorage';
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

  // Open modal for new class
  const handleOpenNewClass = () => {
    playPenTapSound();
    setEditingClass(null);
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

    let text = `📅 My Class Schedule for Today:\n`;
    if (todayClasses.length === 0) {
      text += `No classes scheduled today! 🎉\n`;
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
            <div className="w-10 h-10 rounded-2xl bg-[#FFE9CE] flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-[#4E51BF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg sm:text-xl font-bold text-[#24252A] tracking-tight">
                  Class Timetable
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4E51BF]/10 text-[#4E51BF]">
                  v2 Unlocked
                </span>
              </div>
              <p className="text-xs text-[#5C6070] mt-0.5">
                {classes.length} registered course{classes.length === 1 ? '' : 's'} • Live class radar & attendance tracker
              </p>
            </div>
          </div>

          {/* Action Tools & Switchers */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle: Grid, Agenda, Directory */}
            <div className="inline-flex items-center p-1 rounded-xl bg-[#24252A]/[0.05] border border-[#24252A]/[0.06]">
              <button
                type="button"
                onClick={() => {
                  playPenTapSound();
                  setViewMode('grid');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#24252A] shadow-sm'
                    : 'text-[#5C6070] hover:text-[#24252A]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#4E51BF]" />
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
                    ? 'bg-white text-[#24252A] shadow-sm'
                    : 'text-[#5C6070] hover:text-[#24252A]'
                }`}
              >
                <List className="w-3.5 h-3.5 text-[#4E51BF]" />
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
                    ? 'bg-white text-[#24252A] shadow-sm'
                    : 'text-[#5C6070] hover:text-[#24252A]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#4E51BF]" />
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
                    ? 'bg-[#FFE9CE] text-[#5C4630] border-[#F2CFA4]'
                    : 'bg-white text-[#5C6070] border-[#24252A]/[0.08] hover:bg-[#F8F9FA]'
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
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FFE9CE] border border-[#24252A]/[0.08] text-xs font-semibold text-[#24252A] shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#4E51BF]" />
              <span className="hidden md:inline">Export .ICS</span>
            </button>

            <button
              type="button"
              onClick={handleCopyScheduleText}
              title="Copy today's schedule summary to clipboard"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FFE9CE] border border-[#24252A]/[0.08] text-xs font-semibold text-[#24252A] shadow-sm transition-colors cursor-pointer"
            >
              {copiedToast ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#5C6070]" />
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4E51BF] hover:bg-[#3B3E9E] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
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
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F9E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by course, room, instructor..."
              className="w-full rounded-xl bg-white/90 border border-[#24252A]/[0.08] pl-9 pr-8 py-2 text-xs text-[#24252A] placeholder:text-[#8A8F9E] focus:outline-none focus:border-[#4E51BF]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8F9E] hover:text-[#24252A] cursor-pointer"
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
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4E51BF] hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Load Sample Semester Schedule</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetSample}
                className="text-xs font-medium text-[#8A8F9E] hover:text-[#24252A] transition-colors cursor-pointer"
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
            <CalendarDays className="w-12 h-12 text-[#8A8F9E] mx-auto" />
            <div>
              <h3 className="font-display text-lg font-bold text-[#24252A]">
                {searchQuery ? 'No matching classes found' : 'Your timetable is empty'}
              </h3>
              <p className="text-xs sm:text-sm text-[#5C6070] mt-1 max-w-sm mx-auto">
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
                  className="px-4 py-2 rounded-xl bg-white border border-[#24252A]/[0.08] text-xs font-semibold text-[#24252A] cursor-pointer"
                >
                  Clear Search
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleResetSample}
                    className="px-4 py-2 rounded-xl bg-[#FFE9CE] text-[#5C4630] border border-[#F2CFA4] text-xs font-semibold cursor-pointer"
                  >
                    Load Sample Schedule
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenNewClass}
                    className="px-4 py-2 rounded-xl bg-[#4E51BF] text-white text-xs font-semibold cursor-pointer"
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
