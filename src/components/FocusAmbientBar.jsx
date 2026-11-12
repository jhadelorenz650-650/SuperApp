import { useEffect, useState } from 'react';
import {
  Activity,
  CloudRain,
  Coffee,
  Volume2,
  VolumeX,
  Waves,
  Wind,
} from 'lucide-react';
import {
  AMBIENT_SOUNDS,
  playAmbientSound,
  setAmbientVolume,
  stopAmbientSound,
} from '../utils/focusAudio';
import { playPenTapSound } from '../utils/soundEffects';

const SOUND_ICONS = {
  VolumeX,
  CloudRain,
  Waves,
  Coffee,
  Activity,
  Wind,
};

export function FocusAmbientBar({
  isTimerRunning = false,
  isZenMode = false,
  selectedSound: propSelectedSound,
  onSelectSound: propOnSelectSound,
  volume: propVolume,
  onVolumeChange: propOnVolumeChange,
}) {
  const [internalSound, setInternalSound] = useState('none');
  const [internalVolume, setInternalVolume] = useState(0.5);

  const isControlled = propSelectedSound !== undefined;
  const selectedSound = isControlled ? propSelectedSound : internalSound;
  const volume = isControlled && propVolume !== undefined ? propVolume : internalVolume;

  const handleSelectSound = (id) => {
    playPenTapSound();
    if (isControlled && propOnSelectSound) {
      propOnSelectSound(id);
    } else {
      if (selectedSound === id) {
        setInternalSound('none');
        stopAmbientSound();
      } else {
        setInternalSound(id);
        playAmbientSound(id, volume);
      }
    }
  };

  const handleVolumeChange = (newVol) => {
    if (isControlled && propOnVolumeChange) {
      propOnVolumeChange(newVol);
    } else {
      setInternalVolume(newVol);
      setAmbientVolume(newVol);
    }
  };

  // Only clean up on unmount if NOT controlled (parent page owns lifecycle when controlled)
  useEffect(() => {
    return () => {
      if (!isControlled) {
        stopAmbientSound();
      }
    };
  }, [isControlled]);

  return (
    <div
      className={`rounded-2xl p-3.5 sm:p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
        isZenMode
          ? 'bg-white/10 border-white/15 backdrop-blur-xl text-[#FAF9F6] shadow-lg'
          : 'glass-card'
      }`}
    >
      {/* Left: Sounds Picker */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <span
          className={`text-[11px] font-semibold mr-1 shrink-0 uppercase tracking-wider ${
            isZenMode ? 'text-[#959AA8]' : 'text-[#6E7382]'
          }`}
        >
          Ambient:
        </span>
        {AMBIENT_SOUNDS.map((snd) => {
          const Icon = SOUND_ICONS[snd.icon] || Volume2;
          const isSelected = selectedSound === snd.id;

          return (
            <button
              key={snd.id}
              type="button"
              onClick={() => handleSelectSound(snd.id)}
              title={snd.desc || snd.label}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? isZenMode
                    ? 'bg-[#5B8DEF] text-[#121316] shadow-md ring-2 ring-white/30'
                    : 'bg-[#121316] text-[#FAF9F6] shadow-sm ring-2 ring-[#5B8DEF]/40'
                  : isZenMode
                    ? 'bg-white/10 hover:bg-white/20 text-[#FAF9F6]/85 border border-white/12'
                    : 'bg-white hover:bg-[#EAF0FC] text-[#424652] border border-[#121316]/[0.1]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected && !isZenMode ? 'text-[#5B8DEF]' : ''}`} />
              <span>{snd.label}</span>
              {isSelected && snd.id !== 'none' && (
                <span className="flex h-2 w-2 relative ml-0.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isZenMode ? 'bg-[#121316]' : 'bg-[#5B8DEF]'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isZenMode ? 'bg-[#121316]' : 'bg-[#5B8DEF]'
                    }`}
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right: Volume slider (only if sound active) */}
      {selectedSound !== 'none' && (
        <div
          className={`flex items-center gap-2.5 shrink-0 pl-1 sm:pl-3 sm:border-l ${
            isZenMode ? 'border-white/15' : 'border-[#121316]/[0.1]'
          }`}
        >
          <Volume2 className={`w-4 h-4 ${isZenMode ? 'text-[#9EC0FF]' : 'text-[#5B8DEF]'}`} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-24 sm:w-28 accent-[#5B8DEF] cursor-pointer"
            aria-label="Ambient volume"
          />
          <span
            className={`text-[11px] font-bold w-7 tabular-nums ${
              isZenMode ? 'text-[#FAF9F6]' : 'text-[#121316]'
            }`}
          >
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
