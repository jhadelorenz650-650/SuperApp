import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  Clock,
  Coffee,
  Flame,
  History,
  Infinity as InfinityIcon,
  Maximize2,
  Minimize2,
  NotebookPen,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import { FocusAmbientBar } from '../components/FocusAmbientBar';
import { FocusBrainDump } from '../components/FocusBrainDump';
import { FocusBreakScreen } from '../components/FocusBreakScreen';
import { FocusSubjectPicker } from '../components/FocusSubjectPicker';
import { FocusTimerDisplay } from '../components/FocusTimerDisplay';
import { PageTransition } from '../components/PageTransition';
import {
  broadcastStorageChange,
  useLocalStorage,
} from '../hooks/useLocalStorage';
import {
  getCurrentSoundType,
  getCurrentVolume,
  playAmbientSound,
  playBreakOverChime,
  playFocusCompleteGong,
  playFocusStartChime,
  setAmbientVolume,
  stopAmbientSound,
} from '../utils/focusAudio';
import {
  calculateStudyStreak,
  FOCUS_MODES,
  formatTimerDigits,
  getLocalDateKey,
} from '../utils/focusPresets';
import { createBlankPage } from '../utils/notebookPresets';
import {
  playPageTurnSound,
  playPenTapSound,
  playTaskDeleteSound,
  playTaskDoneSound,
} from '../utils/soundEffects';

export function Focus() {
  const navigate = useNavigate();

  // Focus history & streaks
  const [history, setHistory] = useLocalStorage('superapp_focus_history_v1', []);

  // Shared reactive tasks state from storage
  const [tasks, setTasks] = useLocalStorage('superapp_tasks_v1', []);

  // Mode: 'pomodoro' | 'deep_work' | 'ultradian' | 'flow'
  const [activeModeKey, setActiveModeKey] = useState('pomodoro');
  const currentMode = FOCUS_MODES.find((m) => m.key === activeModeKey) || FOCUS_MODES[0];

  // Timer state: 'work' | 'short_break' | 'long_break'
  const [timerState, setTimerState] = useState('work');
  const [completedIntervals, setCompletedIntervals] = useState(0);

  // Time in seconds
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Shared ambient audio controls (persists across Zen toggle)
  const [ambientSound, setAmbientSound] = useState(() => getCurrentSoundType());
  const [ambientVolume, setAmbientVol] = useState(() => getCurrentVolume());

  // Clean up ambient audio only when leaving the Focus page completely
  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  const handleSelectAmbientSound = (soundId) => {
    if (ambientSound === soundId) {
      setAmbientSound('none');
      stopAmbientSound();
    } else {
      setAmbientSound(soundId);
      playAmbientSound(soundId, ambientVolume);
    }
  };

  const handleAmbientVolumeChange = (newVol) => {
    setAmbientVol(newVol);
    setAmbientVolume(newVol);
  };

  // Selected subject & task
  const [selectedSubject, setSelectedSubject] = useState(() => {
    try {
      return window.sessionStorage.getItem('superapp_focus_subject_v1') || 'Computer Science';
    } catch {
      return 'Computer Science';
    }
  });
  const [selectedTask, setSelectedTask] = useState(null);

  // Keep sessionStorage in sync
  useEffect(() => {
    try {
      window.sessionStorage.setItem('superapp_focus_subject_v1', selectedSubject);
    } catch {
      // Ignore
    }
  }, [selectedSubject]);

  // Zen distraction-free mode
  const [isZenMode, setIsZenMode] = useState(false);

  // Completion celebratory prompt
  const [completedSessionPrompt, setCompletedSessionPrompt] = useState(null);

  const sessionStartRef = useRef(null);

  // Reset timer whenever mode changes
  const handleSelectMode = (modeKey) => {
    playPenTapSound();
    sessionStartRef.current = null;
    setActiveModeKey(modeKey);
    setIsRunning(false);
    setTimerState('work');
    const targetMode = FOCUS_MODES.find((m) => m.key === modeKey) || FOCUS_MODES[0];

    if (targetMode.key === 'flow') {
      setSecondsLeft(0);
      setTotalSeconds(0);
    } else {
      const sec = targetMode.workMinutes * 60;
      setSecondsLeft(sec);
      setTotalSeconds(sec);
    }
  };

  // Sync sessionStartRef when isRunning state toggles
  useEffect(() => {
    if (isRunning) {
      sessionStartRef.current = {
        startTime: Date.now(),
        baseSeconds: secondsLeft,
      };
    } else {
      sessionStartRef.current = null;
    }
  }, [isRunning]);

  // Main countdown / stopwatch tick with timestamp delta math (immune to background tab throttling)
  useEffect(() => {
    if (!isRunning) return undefined;

    const tick = () => {
      if (!sessionStartRef.current) {
        sessionStartRef.current = {
          startTime: Date.now(),
          baseSeconds: secondsLeft,
        };
      }
      const elapsed = Math.floor((Date.now() - sessionStartRef.current.startTime) / 1000);
      if (currentMode.key === 'flow') {
        setSecondsLeft(sessionStartRef.current.baseSeconds + elapsed);
      } else {
        const remaining = Math.max(0, sessionStartRef.current.baseSeconds - elapsed);
        setSecondsLeft(remaining);
      }
    };

    const intervalId = setInterval(tick, 500);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && isRunning) {
        tick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [isRunning, currentMode.key]);

  // When countdown hits 0, trigger interval transition safely outside state updater
  useEffect(() => {
    if (isRunning && currentMode.key !== 'flow' && secondsLeft === 0) {
      handleIntervalFinished();
    }
  }, [secondsLeft, isRunning, currentMode.key]);

  // When interval finishes
  const handleIntervalFinished = () => {
    sessionStartRef.current = null;
    setIsRunning(false);

    if (timerState === 'work') {
      playFocusCompleteGong();

      const durationMinutes = currentMode.key === 'flow'
        ? Math.max(1, Math.round(secondsLeft / 60))
        : currentMode.workMinutes;

      // Log session to history
      const newRecord = {
        id: `foc-${Date.now()}`,
        subject: selectedSubject || 'General',
        taskTitle: selectedTask?.title || null,
        durationMin: durationMinutes,
        mode: currentMode.label,
        completedAt: Date.now(),
      };
      setHistory((prev) => [newRecord, ...prev]);

      // Show celebratory task completion prompt
      setCompletedSessionPrompt({
        durationMinutes,
        subject: selectedSubject,
        task: selectedTask,
      });

      const nextIntervals = completedIntervals + 1;
      setCompletedIntervals(nextIntervals);

      // Transition to break
      const isLong = nextIntervals % currentMode.intervalsBeforeLongBreak === 0;
      const nextBreakState = isLong ? 'long_break' : 'short_break';
      const breakSec = (isLong ? currentMode.longBreakMinutes : currentMode.shortBreakMinutes) * 60;

      setTimerState(nextBreakState);
      setSecondsLeft(breakSec);
      setTotalSeconds(breakSec);
    } else {
      // Break over
      playBreakOverChime();
      setTimerState('work');
      const workSec = currentMode.workMinutes * 60;
      setSecondsLeft(workSec);
      setTotalSeconds(workSec);
    }
  };

  // Explicitly finish and log a Flow session
  const handleFinishFlowSession = () => {
    if (secondsLeft <= 0) return;
    sessionStartRef.current = null;
    setIsRunning(false);
    playFocusCompleteGong();

    const durationMinutes = Math.max(1, Math.round(secondsLeft / 60));
    const newRecord = {
      id: `foc-${Date.now()}`,
      subject: selectedSubject || 'General',
      taskTitle: selectedTask?.title || null,
      durationMin: durationMinutes,
      mode: currentMode.label,
      completedAt: Date.now(),
    };
    setHistory((prev) => [newRecord, ...prev]);

    setCompletedSessionPrompt({
      durationMinutes,
      subject: selectedSubject,
      task: selectedTask,
    });

    setSecondsLeft(0);
    setTotalSeconds(0);
  };

  // Toggle play/pause
  const handleTogglePlay = () => {
    if (!isRunning && timerState === 'work') {
      playFocusStartChime();
    }
    setIsRunning((prev) => !prev);
  };

  // Reset timer
  const handleReset = () => {
    sessionStartRef.current = null;
    setIsRunning(false);
    if (timerState === 'work') {
      if (currentMode.key === 'flow') {
        setSecondsLeft(0);
        setTotalSeconds(0);
      } else {
        const sec = currentMode.workMinutes * 60;
        setSecondsLeft(sec);
        setTotalSeconds(sec);
      }
    } else {
      const isLong = timerState === 'long_break';
      const breakSec = (isLong ? currentMode.longBreakMinutes : currentMode.shortBreakMinutes) * 60;
      setSecondsLeft(breakSec);
      setTotalSeconds(breakSec);
    }
  };

  // Skip interval
  const handleSkip = () => {
    sessionStartRef.current = null;
    setIsRunning(false);
    if (timerState === 'work') {
      // Skip straight to break
      setTimerState('short_break');
      const breakSec = currentMode.shortBreakMinutes * 60;
      setSecondsLeft(breakSec);
      setTotalSeconds(breakSec);
    } else {
      // Skip break to work
      setTimerState('work');
      const workSec = currentMode.workMinutes * 60;
      setSecondsLeft(workSec);
      setTotalSeconds(workSec);
    }
  };

  // Extend break by +2 min
  const handleExtendBreak = () => {
    playPenTapSound();
    if (sessionStartRef.current) {
      sessionStartRef.current.baseSeconds += 120;
    }
    setSecondsLeft((prev) => prev + 120);
    setTotalSeconds((prev) => prev + 120);
  };

  // 1-Click Task Complete
  const handleMarkTaskComplete = () => {
    if (!completedSessionPrompt?.task?.id) return;
    playTaskDoneSound();

    setTasks((prev) =>
      prev.map((t) =>
        t.id === completedSessionPrompt.task.id
          ? { ...t, completed: true, completedAt: Date.now() }
          : t
      )
    );
    setCompletedSessionPrompt(null);
    setSelectedTask(null);
  };

  // 1-Click Open Notebook for Course
  const handleOpenNotebookForSubject = (subjectName) => {
    if (!subjectName) {
      navigate('/notes');
      return;
    }

    try {
      const raw = window.localStorage.getItem('superapp_notebooks_v1');
      let notebooks = raw ? JSON.parse(raw) : [];
      const targetQuery = subjectName.trim().toLowerCase();

      let match = notebooks.find(
        (nb) =>
          (nb.subject || '').trim().toLowerCase() === targetQuery ||
          (nb.name || '').trim().toLowerCase() === targetQuery
      );

      if (!match) {
        const now = Date.now();
        const firstPage = createBlankPage({
          subject: subjectName,
          paperStyle: 'ruled',
          fontStyle: 'handwriting',
          title: `Study Notes — ${subjectName}`,
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

  // Add task from Brain Dump
  const handleAddTaskFromDump = (taskTitle) => {
    const newTask = {
      id: `task-${Date.now()}`,
      title: taskTitle,
      subject: selectedSubject || 'General',
      dueDate: getLocalDateKey(new Date()),
      priority: 'medium',
      completed: false,
      createdAt: Date.now(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  // Compute daily stats & streak using local date keys
  const todayStr = getLocalDateKey(new Date());
  const todayMinutes = useMemo(() => {
    return history
      .filter((item) => getLocalDateKey(item.completedAt) === todayStr)
      .reduce((acc, cur) => acc + (cur.durationMin || 0), 0);
  }, [history, todayStr]);

  const streakDays = useMemo(() => calculateStudyStreak(history), [history]);

  // Keyboard shortcuts: Space (play/pause), Z (Zen mode toggle), R (reset), Esc (exit Zen)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept shortcuts when user is typing in form inputs, textareas, or editable elements
      const target = e.target;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false);
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
        return;
      }

      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode, isRunning, timerState, currentMode, secondsLeft, totalSeconds]);

  return (
    <PageTransition>
      <div className="space-y-5 pb-6">
        {/* Fullscreen Zen Mode Overlay */}
        <AnimatePresence>
          {isZenMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#17181C]/96 backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-10 text-white"
            >
              {/* Zen Top Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Zen Immersion Mode
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 hidden sm:inline">
                    Press Esc to exit
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsZenMode(false)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  >
                    <Minimize2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Zen Center Display */}
              <div className="flex flex-col items-center justify-center my-auto">
                <div className="text-sm font-semibold text-indigo-300 mb-2">
                  {selectedSubject} {selectedTask ? `• ${selectedTask.title}` : ''}
                </div>
                <FocusTimerDisplay
                  secondsLeft={secondsLeft}
                  totalSeconds={totalSeconds}
                  isRunning={isRunning}
                  timerState={timerState}
                  currentMode={currentMode}
                  completedIntervals={completedIntervals}
                  intervalsBeforeLongBreak={currentMode.intervalsBeforeLongBreak}
                  onTogglePlay={handleTogglePlay}
                  onReset={handleReset}
                  onSkip={handleSkip}
                  onFinishFlow={handleFinishFlowSession}
                  onToggleZen={() => setIsZenMode(false)}
                  isZenMode={true}
                />
              </div>

              {/* Zen Bottom Ambient Controls */}
              <div className="max-w-md mx-auto w-full">
                <FocusAmbientBar
                  isTimerRunning={isRunning}
                  isZenMode={true}
                  selectedSound={ambientSound}
                  onSelectSound={handleSelectAmbientSound}
                  volume={ambientVolume}
                  onVolumeChange={handleAmbientVolumeChange}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Normal Page View Header */}
        <div className="glass-card rounded-panel p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFE9CE] flex items-center justify-center shrink-0">
              <Timer className="w-5 h-5 text-[#4E51BF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg sm:text-xl font-bold text-[#24252A] tracking-tight">
                  Deep Focus Timer
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4E51BF]/10 text-[#4E51BF]">
                  v2 Unlocked
                </span>
              </div>
              <p className="text-xs text-[#5C6070] mt-0.5">
                Pomodoro intervals, procedural study soundscapes & distraction-free flow
              </p>
            </div>
          </div>

          {/* Quick Metrics (Today Minutes & Streak) */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#24252A]/[0.08] text-xs">
              <Clock className="w-4 h-4 text-[#4E51BF]" />
              <span className="font-bold text-[#24252A]">
                {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m
              </span>
              <span className="text-[#8A8F9E]">today</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFE9CE] border border-[#F2CFA4] text-xs font-bold text-[#5C4630]">
              <Flame className="w-4 h-4 text-[#D97706] fill-current" />
              <span>{streakDays} Day Streak</span>
            </div>
          </div>
        </div>

        {/* Completed Session Banner / Assignment Done Prompt */}
        <AnimatePresence>
          {completedSessionPrompt && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl bg-[#ECFDF5] border border-emerald-300 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900 shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-sm block">
                    Session Logged: +{completedSessionPrompt.durationMinutes} mins on{' '}
                    {completedSessionPrompt.subject}!
                  </span>
                  {completedSessionPrompt.task ? (
                    <span className="text-emerald-700">
                      Finished working on &quot;{completedSessionPrompt.task.title}&quot;. Ready to complete this task?
                    </span>
                  ) : (
                    <span className="text-emerald-700">
                      Awesome focus block. Take a breath and recharge.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {completedSessionPrompt.task && (
                  <button
                    type="button"
                    onClick={handleMarkTaskComplete}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Assignment</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCompletedSessionPrompt(null)}
                  className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode Selector Segmented Tabs */}
        <div className="glass-card rounded-2xl p-1.5 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {FOCUS_MODES.map((m) => {
            const isSelected = activeModeKey === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => handleSelectMode(m.key)}
                className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#4E51BF] text-white shadow-sm'
                    : 'text-[#5C6070] hover:text-[#24252A] hover:bg-[#24252A]/[0.04]'
                }`}
              >
                <span className="text-xs font-bold leading-tight">{m.label}</span>
                <span
                  className={`text-[10px] mt-0.5 line-clamp-1 ${
                    isSelected ? 'text-indigo-100' : 'text-[#8A8F9E]'
                  }`}
                >
                  {m.shortLabel === 'Flow' ? 'Stopwatch' : `${m.workMinutes}m / ${m.shortBreakMinutes}m break`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Focus Center Card */}
        <div className="glass-card rounded-panel p-6 sm:p-8 flex flex-col items-center justify-center space-y-4 relative overflow-hidden">
          {/* Target Subject Picker Bar */}
          <div className="w-full max-w-xl">
            <FocusSubjectPicker
              selectedSubject={selectedSubject}
              onSelectSubject={setSelectedSubject}
              selectedTask={selectedTask}
              onSelectTask={setSelectedTask}
              onOpenNotebookForSubject={handleOpenNotebookForSubject}
              tasks={tasks}
            />
          </div>

          {/* Timer Display or Break Screen */}
          {timerState === 'work' ? (
            <FocusTimerDisplay
              secondsLeft={secondsLeft}
              totalSeconds={totalSeconds}
              isRunning={isRunning}
              timerState={timerState}
              currentMode={currentMode}
              completedIntervals={completedIntervals}
              intervalsBeforeLongBreak={currentMode.intervalsBeforeLongBreak}
              onTogglePlay={handleTogglePlay}
              onReset={handleReset}
              onSkip={handleSkip}
              onFinishFlow={handleFinishFlowSession}
              onToggleZen={() => setIsZenMode(true)}
              isZenMode={false}
            />
          ) : (
            <div className="w-full max-w-xl">
              <FocusBreakScreen
                onSkipBreak={handleSkip}
                onExtendBreak={handleExtendBreak}
              />
            </div>
          )}

          {/* Ambient procedural audio controls */}
          <div className="w-full max-w-xl">
            <FocusAmbientBar
              isTimerRunning={isRunning}
              isZenMode={false}
              selectedSound={ambientSound}
              onSelectSound={handleSelectAmbientSound}
              volume={ambientVolume}
              onVolumeChange={handleAmbientVolumeChange}
            />
          </div>
        </div>

        {/* Anti-Distraction Brain Dump & Today's Study Log */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Brain Dump Scratchpad */}
          <FocusBrainDump onAddTaskFromDump={handleAddTaskFromDump} />

          {/* Today's Completed Sessions History Log */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-[#24252A]/[0.07] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#4E51BF]" />
                <h3 className="font-display text-xs sm:text-sm font-bold text-[#24252A]">
                  Recent Focus Sessions
                </h3>
              </div>
              <span className="text-[11px] text-[#8A8F9E]">
                {history.length} completed
              </span>
            </div>

            {history.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.slice(0, 5).map((rec) => {
                  const timeStr = new Date(rec.completedAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  });
                  return (
                    <div
                      key={rec.id}
                      className="rounded-xl bg-[#F8F9FA] p-2.5 flex items-center justify-between text-xs border border-[#24252A]/[0.05]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[#24252A] truncate">
                          {rec.subject}
                        </div>
                        {rec.taskTitle && (
                          <div className="text-[10px] text-[#5C6070] truncate">
                            {rec.taskTitle}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="font-bold text-[#4E51BF]">
                          +{rec.durationMin}m
                        </span>
                        <span className="text-[10px] text-[#8A8F9E] block">
                          {timeStr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#8A8F9E]">
                No completed sessions yet. Start the timer to log your first study block!
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
