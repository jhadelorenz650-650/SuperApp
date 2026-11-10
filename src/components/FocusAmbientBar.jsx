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

export function FocusAmbientBar({ isTimerRunning = false }) {
  const [selectedSound, setSelectedSound] = useState('none');
  const [volume, setVolume] = useState(0.5);

  const handleSelectSound = (id) => {
    playPenTapSound();
    if (selectedSound === id) {
      // Toggle off
      setSelectedSound('none');
      stopAmbientSound();
    } else {
      setSelectedSound(id);
      playAmbientSound(id, volume);
    }
  };

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    setAmbientVolume(newVol);
  };

  // Clean up ambient audio on unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  return (
    <div className="glass-card rounded-2xl p-3.5 sm:p-4 border border-[#24252A]/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Left: Sounds Picker */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <span className="text-[11px] font-semibold text-[#8A8F9E] mr-1 shrink-0 uppercase tracking-wider">
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
                  ? 'bg-[#4E51BF] text-white shadow-sm ring-2 ring-[#4E51BF]/30'
                  : 'bg-white hover:bg-[#FFE9CE] text-[#5C6070] border border-[#24252A]/[0.08]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{snd.label}</span>
              {isSelected && snd.id !== 'none' && (
                <span className="flex h-2 w-2 relative ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right: Volume slider (only if sound active) */}
      {selectedSound !== 'none' && (
        <div className="flex items-center gap-2.5 shrink-0 pl-1 sm:pl-3 sm:border-l border-[#24252A]/[0.08]">
          <Volume2 className="w-4 h-4 text-[#4E51BF]" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-24 sm:w-28 accent-[#4E51BF] cursor-pointer"
            aria-label="Ambient volume"
          />
          <span className="text-[11px] font-bold text-[#24252A] w-7 tabular-nums">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
