import React from 'react';
import { MotorStatus } from '../types';
import { Compass, Home, Target, ArrowRight, Gauge, AlertCircle } from 'lucide-react';

const MIN_TRACK_METER = 5;
const MAX_TRACK_METER = 17;
const TRACK_START_PERCENT = 5;
const TRACK_END_PERCENT = 95;

interface MotorTrackVisualizerProps {
  motorStatus: MotorStatus;
  onMoveToMeter: (meter: number) => void;
}

export const MotorTrackVisualizer: React.FC<MotorTrackVisualizerProps> = ({
  motorStatus,
  onMoveToMeter
}) => {
  const currentPos = motorStatus.currentPositionMeter;
  // Keep the motor, ticks, and reference lines on the same 5% - 95% visual scale.
  const posPercentage = Math.min(
    TRACK_END_PERCENT,
    Math.max(
      TRACK_START_PERCENT,
      TRACK_START_PERCENT +
        ((currentPos - MIN_TRACK_METER) / (MAX_TRACK_METER - MIN_TRACK_METER)) *
          (TRACK_END_PERCENT - TRACK_START_PERCENT)
    )
  );

  return (
    <div className="bg-[#151821] border-b border-zinc-800/80 px-4 py-2.5 text-zinc-300 text-xs select-none">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-blue-400" />
            LINTASAN REL ATG HORIZONTAL (5 - 17.0 METER):
          </span>
          <span className="text-[11px] text-zinc-400">
            Titik Acuan: <strong className="text-amber-300 font-mono">5.0m (ZERO)</strong> & <strong className="text-emerald-300 font-mono">17.0m (HOME)</strong>
          </span>
        </div>

        {/* Sensors Indicators */}
        <div className="flex items-center gap-2 text-[11px]">
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${motorStatus.zeroSensorActive ? 'bg-amber-400 animate-ping' : 'bg-zinc-700'}`}></span>
            <span className={motorStatus.zeroSensorActive ? 'text-amber-400 font-bold' : 'text-zinc-500'}>Sensor 5m (Zero)</span>
          </div>
          <div className="w-[1px] h-3 bg-zinc-800"></div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${motorStatus.homeSensorActive ? 'bg-emerald-400 animate-ping' : 'bg-zinc-700'}`}></span>
            <span className={motorStatus.homeSensorActive ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>Sensor 17m (Home)</span>
          </div>
          <div className="w-[1px] h-3 bg-zinc-800"></div>
          <div className="flex items-center gap-1">
            <span className="text-zinc-500">Kecepatan:</span>
            <span className="font-mono text-zinc-300 font-semibold">{motorStatus.speedMmPerSec} mm/s</span>
          </div>
        </div>
      </div>

      {/* Track Visual Container */}
      <div className="relative w-full h-8 bg-zinc-950/80 rounded-md border border-zinc-800 overflow-hidden flex items-center px-3">
        {/* Rail background dashes */}
        <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-1 bg-zinc-800 rounded"></div>

        {/* 5m Zero Indicator Line */}
        <div 
          className="absolute top-0 bottom-0 w-[2px] bg-amber-500/80 z-10 flex flex-col items-center justify-between"
          style={{ left: '2%' }}
        >
          <div className="bg-amber-500 text-black text-[9px] font-black px-1 rounded-b shadow">5m ZERO</div>
        </div>

        {/* 17m Home Indicator Line */}
        <div 
          className="absolute top-0 bottom-0 w-[2px] bg-emerald-500/80 z-10 flex flex-col items-center justify-between"
          style={{ left: '98%' }}
        >
          <div className="bg-emerald-500 text-black text-[9px] font-black px-1 rounded-b shadow">17m HOME</div>
        </div>

        {/* Meter Tick Marks 5 to 17 */}
        {Array.from({ length: MAX_TRACK_METER - MIN_TRACK_METER + 1 }, (_, i) => MIN_TRACK_METER + i).map((m) => {
          const leftPct =
            TRACK_START_PERCENT +
            ((m - MIN_TRACK_METER) / (MAX_TRACK_METER - MIN_TRACK_METER)) *
              (TRACK_END_PERCENT - TRACK_START_PERCENT);
          return (
            <button
              key={m}
              id={`track-tick-${m}`}
              onClick={() => onMoveToMeter(m)}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group cursor-pointer"
              style={{ left: `${leftPct}%` }}
              title={`Klik untuk menggerakkan motor ke ${m} meter`}
            >
              <div className={`w-1.5 h-3 rounded-xs ${m === 5 ? 'bg-amber-400' : m === 17 ? 'bg-emerald-400' : 'bg-zinc-600 group-hover:bg-blue-400'}`}></div>
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] text-zinc-500 group-hover:text-blue-300 font-mono">
                {m}
              </span>
            </button>
          );
        })}

        {/* Moving Stepper Carriage */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 transition-all duration-800 ease-out flex items-center justify-center"
          style={{ left: `${posPercentage}%` }}
        >
          <div className={`px-2 py-0.5 rounded shadow-lg border text-[10px] font-mono font-bold flex items-center gap-1 ${
            motorStatus.isMoving 
              ? 'bg-blue-600 text-white border-blue-400 animate-pulse' 
              : 'bg-zinc-800 text-cyan-300 border-cyan-500/50'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            MOTOR: {currentPos.toFixed(3)}m
          </div>
        </div>
      </div>
    </div>
  );
};
