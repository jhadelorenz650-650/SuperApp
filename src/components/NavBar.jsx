import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  NotebookPen,
  Timer,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Award,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays },
  { to: '/notes', label: 'Notes', icon: NotebookPen },
  { to: '/focus', label: 'Focus', icon: Timer },
];

export function NavBar({
  activeTaskCount = 0,
  completedTaskCount = 0,
  collapsed = false,
  onToggleCollapse,
}) {
  const { pathname } = useLocation();
  const level = 1 + Math.floor(completedTaskCount / 3);
  const levelProgress = ((completedTaskCount % 3) / 3) * 100;

  return (
    <>
      {/* Desktop Collapsible Left Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 84 : 264 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="hidden md:flex md:flex-col md:shrink-0 md:sticky md:top-0 md:h-dvh bg-white/85 backdrop-blur-2xl border-r border-[#24252A]/[0.07] py-5 px-3 z-30 select-none"
      >
        {/* Brand + Collapse Toggle */}
        <div
          className={`flex items-center mb-7 ${
            collapsed ? 'justify-center flex-col gap-3' : 'justify-between px-2'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <motion.div
              whileHover={{ rotate: 8, scale: 1.05 }}
              className="w-9 h-9 rounded-xl shrink-0 bg-[#4E51BF] flex items-center justify-center shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.16 }}
                  className="min-w-0"
                >
                  <div className="font-display font-bold text-base tracking-tight text-[#24252A] leading-tight truncate">
                    Pulse
                  </div>
                  <div className="text-[11px] text-[#8A8F9E] truncate">
                    Student OS
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            type="button"
            onClick={onToggleCollapse}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-[#5C6070] hover:text-[#24252A] hover:bg-[#24252A]/[0.06] transition-colors cursor-pointer"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </motion.button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5 flex-1" aria-label="Primary navigation">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isActive = pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className="group relative block outline-none"
              >
                <motion.div
                  whileHover={{ x: collapsed ? 0 : 2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative flex items-center rounded-xl text-sm font-medium transition-colors ${
                    collapsed
                      ? 'justify-center py-2.5 px-2'
                      : 'justify-between px-3 py-2.5'
                  } ${
                    isActive
                      ? 'text-white'
                      : 'text-[#5C6070] hover:text-[#24252A]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="desktopActiveTab"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-[#4E51BF] shadow-sm"
                    />
                  )}

                  <span
                    className={`relative z-10 flex items-center ${
                      collapsed ? '' : 'gap-3'
                    }`}
                  >
                    <motion.span
                      whileHover={{ scale: 1.15, rotate: -4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="inline-flex"
                    >
                      <Icon
                        className={`w-[18px] h-[18px] transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-[#5C6070] group-hover:text-[#4E51BF]'
                        }`}
                      />
                    </motion.span>
                    {!collapsed && <span>{label}</span>}
                  </span>

                  {!collapsed && to === '/tasks' && activeTaskCount > 0 && (
                    <span
                      className={`relative z-10 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-[#FFE9CE] text-[#24252A]'
                          : 'bg-[#4E51BF]/12 text-[#4E51BF]'
                      }`}
                    >
                      {activeTaskCount}
                    </span>
                  )}

                  {collapsed && to === '/tasks' && activeTaskCount > 0 && (
                    <span className="absolute top-1.5 right-2.5 w-2 h-2 rounded-full bg-[#FF92A4]" />
                  )}
                </motion.div>

                {/* Tooltip in icon-only mode */}
                {collapsed && (
                  <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg bg-[#24252A] text-xs font-medium text-white whitespace-nowrap opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 shadow-lg z-50">
                    {label}
                    {to === '/tasks' && activeTaskCount > 0
                      ? ` (${activeTaskCount})`
                      : ''}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom User Avatar & Level Badge */}
        <div className="pt-4 border-t border-[#24252A]/[0.07]">
          <div
            className={`group relative rounded-2xl bg-[#FFE9CE]/70 border border-[#F2CFA4]/60 p-2.5 flex items-center ${
              collapsed ? 'justify-center' : 'gap-3'
            }`}
          >
            <div className="relative shrink-0 w-9 h-9 rounded-full bg-[#4E51BF] flex items-center justify-center text-xs font-display font-bold text-white shadow-sm">
              JH
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#FFE9CE]" />
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#24252A] truncate">
                    Jhade
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/85 text-[#24252A]">
                    <Award className="w-2.5 h-2.5 text-[#4E51BF]" />
                    Lvl {level}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#24252A]/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#4E51BF] to-[#FF92A4] transition-all duration-500"
                    style={{ width: `${Math.max(12, levelProgress)}%` }}
                  />
                </div>
              </div>
            )}

            {collapsed && (
              <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg bg-[#24252A] text-xs font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-50">
                Jhade · Lvl {level}
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Mobile Floating Rounded Glass Bottom Dock */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pointer-events-none">
        <nav
          aria-label="Mobile navigation"
          className="pointer-events-auto glass-card rounded-2xl max-w-md mx-auto px-1.5 py-1.5 shadow-[0_14px_34px_-12px_rgba(36,37,42,0.22)]"
        >
          <div className="grid grid-cols-5 gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const isActive = pathname === to;
              return (
                <NavLink key={to} to={to} className="relative block outline-none">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mobileActiveTab"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-[#4E51BF]"
                      />
                    )}
                    <div className="relative z-10">
                      <Icon
                        className={`w-[18px] h-[18px] transition-colors ${
                          isActive ? 'text-white' : 'text-[#5C6070]'
                        }`}
                      />
                      {to === '/tasks' && activeTaskCount > 0 && (
                        <span
                          className={`absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                            isActive
                              ? 'bg-[#FFE9CE] text-[#24252A]'
                              : 'bg-[#FF92A4] text-white'
                          }`}
                        >
                          {activeTaskCount > 9 ? '9+' : activeTaskCount}
                        </span>
                      )}
                    </div>
                    <span
                      className={`relative z-10 text-[10px] mt-1 font-medium tracking-tight transition-colors ${
                        isActive ? 'text-white' : 'text-[#5C6070]'
                      }`}
                    >
                      {label}
                    </span>
                  </motion.div>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
