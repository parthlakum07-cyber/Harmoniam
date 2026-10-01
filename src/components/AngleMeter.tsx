import React from 'react';
import { Compass, Info, ShieldAlert, CheckCircle2, Sliders } from 'lucide-react';
import type { OrientationState } from '../sensors/Orientation';

interface AngleMeterProps {
  orientationState: OrientationState;
  onRequestPermission: () => void;
}

export const AngleMeter: React.FC<AngleMeterProps> = ({
  orientationState,
  onRequestPermission,
}) => {
  const { angle, isSupported, hasPermission, mode, statusText, sensorActive } = orientationState;
  const volumeEffectPercent = Math.round((angle / 180) * 100);
  const rotationDeg = Math.max(0, Math.min(180, angle));

  return (
    <div className="w-full max-w-2xl mx-auto my-2 p-5 rounded-xl bg-zinc-900/90 border border-amber-900/40 shadow-xl backdrop-blur-md flex flex-col items-center">
      {/* Title */}
      <div className="flex items-center gap-2 mb-1">
        <Compass className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-serif font-bold uppercase tracking-widest text-amber-200/90">
          LAPTOP TILT ANGLE
        </span>
      </div>

      {/* Angle Degree Display */}
      <div className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-amber-300 my-1">
        {angle}°
      </div>

      {/* SVG Laptop Hinge Visualization */}
      <div className="relative w-60 h-32 my-2 flex items-end justify-center">
        <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible drop-shadow-md">
          {/* Laptop Base */}
          <rect
            x="40"
            y="95"
            width="120"
            height="9"
            rx="2"
            fill="#27272a"
            stroke="#71717a"
            strokeWidth="1.5"
          />
          <rect
            x="55"
            y="97"
            width="90"
            height="3"
            rx="1"
            fill="#18181b"
          />

          {/* Rotatable Screen Lid */}
          <g transform={`translate(100, 95) rotate(${-rotationDeg}) translate(-100, -95)`}>
            <rect
              x="45"
              y="25"
              width="110"
              height="70"
              rx="3"
              fill="#18181b"
              stroke="#d97706"
              strokeWidth="1.5"
            />
            <rect
              x="49"
              y="29"
              width="102"
              height="62"
              rx="2"
              fill="#09090b"
            />
            <text
              x="100"
              y="58"
              fill="#fef3c7"
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="serif"
            >
              HARMONIAN
            </text>
            <text
              x="100"
              y="72"
              fill="#f59e0b"
              fontSize="8"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {angle}°
            </text>
          </g>

          {/* Hinge Pin */}
          <circle cx="100" cy="95" r="3.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
        </svg>
      </div>

      {/* Status Card */}
      <div className="w-full mt-2 p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {mode === 'sensor' && sensorActive ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {statusText}
            </span>
          ) : mode === 'sensor' && !sensorActive ? (
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              {statusText}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-200/90 font-medium">
              <Sliders className="w-4 h-4 text-amber-400" />
              {statusText}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-amber-200/90 font-medium">
          <span>Volume Modulation:</span>
          <span className="font-mono font-bold text-amber-400">{volumeEffectPercent}%</span>
        </div>

        {isSupported && !hasPermission && (
          <button
            onClick={onRequestPermission}
            className="px-3 py-1 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 text-zinc-950 shadow"
          >
            Enable Motion
          </button>
        )}
      </div>

      {/* Tooltip Note */}
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-400 text-center">
        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          Angle detection depends on laptop sensor hardware and browser permissions.
        </span>
      </div>
    </div>
  );
};
