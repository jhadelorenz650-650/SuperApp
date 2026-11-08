import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { BackgroundMesh } from './components/BackgroundMesh';
import { IntroSplash } from './components/IntroSplash';
import { NavBar } from './components/NavBar';
import { TaskModal } from './components/TaskModal';
import { TopBar } from './components/TopBar';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Dashboard } from './pages/Dashboard';
import { Focus } from './pages/Focus';
import { Notes } from './pages/Notes';
import { Tasks } from './pages/Tasks';
import { Timetable } from './pages/Timetable';
import { initAudioUnlock } from './utils/soundEffects';

export default function App() {
  const location = useLocation();
  const [tasks, setTasks, tasksStorageError] = useLocalStorage(
    'superapp_tasks_v1',
    []
  );
  const [dismissedStorageWarning, setDismissedStorageWarning] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage(
    'superapp_sidebar_collapsed',
    false
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [appRevealed, setAppRevealed] = useState(false);
  const [introSettled, setIntroSettled] = useState(false);
  const introVariant = 'superapp'; // Switch to 'default' to revert to DefaultIntroSplash

  useEffect(() => {
    initAudioUnlock();
  }, []);

  useEffect(() => {
    if (introVariant !== 'default') return undefined;
    const timer = setTimeout(() => {
      setAppRevealed(true);
      setShowIntro(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [introVariant]);

  const activeTaskCount = tasks.filter((t) => !t.completed).length;
  const completedTaskCount = tasks.length - activeTaskCount;

  const handleAddTask = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleToggleTask = (id) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const nextCompleted = !task.completed;
        return {
          ...task,
          completed: nextCompleted,
          completedAt: nextCompleted ? Date.now() : null,
        };
      })
    );
  };

  const handleDeleteTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  return (
    <div className="relative min-h-dvh flex bg-[var(--bg-canvas)] text-[#24252A]">
      <BackgroundMesh />
      <IntroSplash
        show={showIntro}
        variant={introVariant}
        onRevealStart={() => setAppRevealed(true)}
        onDismiss={() => {
          setAppRevealed(true);
          setShowIntro(false);
        }}
      />

      <motion.div
        inert={showIntro && !appRevealed}
        aria-hidden={showIntro && !appRevealed}
        initial={{ opacity: 0, y: 14, scale: 0.985 }}
        animate={
          introSettled
            ? { opacity: 1 }
            : {
                opacity: appRevealed ? 1 : 0,
                y: appRevealed ? 0 : 14,
                scale: appRevealed ? 1 : 0.985,
              }
        }
        transformTemplate={(_latest, generated) =>
          introSettled ? 'none' : generated
        }
        onAnimationComplete={() => {
          if (appRevealed && !introSettled) {
            setIntroSettled(true);
          }
        }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-1 min-w-0 min-h-dvh"
      >
        <NavBar
          activeTaskCount={activeTaskCount}
          completedTaskCount={completedTaskCount}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />

        <div className="relative z-10 flex-1 min-w-0 flex flex-col min-h-dvh">
          <TopBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenNewTask={() => setIsNewTaskOpen(true)}
          />

          {tasksStorageError && !dismissedStorageWarning && (
            <div
              role="alert"
              className="mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-xl bg-[#FFE1E6] border border-[#FF92A4]/60 px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs text-[#9F1239]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="truncate">{tasksStorageError.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setDismissedStorageWarning(true)}
                aria-label="Dismiss storage warning"
                className="p-1 rounded-md hover:bg-[#9F1239]/10 shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 pt-6 pb-28 md:pb-10">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Dashboard tasks={tasks} />} />
                <Route
                  path="/tasks"
                  element={
                    <Tasks
                      tasks={tasks}
                      searchQuery={searchQuery}
                      onClearSearch={() => setSearchQuery('')}
                      onOpenNewTask={() => setIsNewTaskOpen(true)}
                      onToggleTask={handleToggleTask}
                      onDeleteTask={handleDeleteTask}
                    />
                  }
                />
                <Route path="/timetable" element={<Timetable />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/focus" element={<Focus />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </motion.div>

      <TaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onAddTask={handleAddTask}
      />
    </div>
  );
}
