import React, { useState, useEffect, useRef } from 'react';
import { PackageCheck, Wrench, Star, CheckCircle2, Trophy, ShieldCheck, Sparkles } from 'lucide-react';

const useCountUp = (endValue, duration = 1400, decimals = 0, isVisible = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let startTime = null;
    let animationFrame = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentCount = easeProgress * endValue;

      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      } else {
        setCount(endValue);
      }
    };

    animationFrame = requestAnimationFrame(step);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [endValue, duration, isVisible]);

  if (decimals > 0) {
    return count.toFixed(decimals);
  }
  return Math.floor(count).toLocaleString('en-IN');
};

const MilestoneCard = ({
  icon: Icon,
  targetValue,
  decimals = 0,
  prefix = '',
  suffix = '',
  label,
  tag,
  gradient,
  isVisible
}) => {
  const animatedValue = useCountUp(targetValue, 1400, decimals, isVisible);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
      
      {/* Top Row: Glowing Icon Pill & Tag */}
      <div className="flex items-center justify-between mb-2.5 sm:mb-5">
        <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${gradient} text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.2]" />
        </div>

        {tag && (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[8px] sm:text-[10px] font-extrabold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-0.5 sm:gap-1 shadow-2xs">
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 fill-emerald-500" />
            {tag}
          </span>
        )}
      </div>

      {/* Metric Display & Subtitle */}
      <div className="space-y-0.5 sm:space-y-1">
        <div className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
          <span>{prefix}{animatedValue}{suffix}</span>
        </div>
        <p className="text-[11px] sm:text-sm font-semibold text-slate-600 leading-tight sm:leading-snug">
          {label}
        </p>
      </div>

      {/* Decorative Glow Line */}
      <div className="w-full h-0.5 sm:h-1 bg-slate-100 rounded-full mt-3 sm:mt-5 overflow-hidden">
        <div
          className="h-full bg-emerald-600 transition-all duration-1000 ease-out"
          style={{ width: isVisible ? '100%' : '0%' }}
        />
      </div>

    </div>
  );
};

export const StoreMilestones = ({ className = '' }) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const milestones = [
    {
      id: 'm1',
      icon: PackageCheck,
      targetValue: 1500,
      decimals: 0,
      suffix: '+',
      label: 'Scale RC Cars Sold & Delivered',
      gradient: 'bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600'
    },
    {
      id: 'm2',
      icon: Wrench,
      targetValue: 6,
      decimals: 0,
      suffix: '+ Years',
      label: 'Hobby Bench-Testing Expertise',
      gradient: 'bg-gradient-to-br from-emerald-600 to-slate-800'
    },
    {
      id: 'm3',
      icon: Star,
      targetValue: 4.9,
      decimals: 1,
      suffix: ' ★',
      label: 'Verified Hobbyist Rating',
      tag: '420+ Reviews',
      gradient: 'bg-gradient-to-br from-amber-400 via-amber-500 to-emerald-600'
    },
    {
      id: 'm4',
      icon: CheckCircle2,
      targetValue: 100,
      decimals: 0,
      suffix: '%',
      label: 'Mysore Hub Dispatch & Support',
      gradient: 'bg-gradient-to-br from-teal-500 via-emerald-500 to-emerald-700'
    }
  ];

  return (
    <div ref={containerRef} className={`w-full my-5 sm:my-10 md:my-12 ${className}`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
        {milestones.map((item) => (
          <MilestoneCard
            key={item.id}
            {...item}
            isVisible={isVisible}
          />
        ))}
      </div>
    </div>
  );
};
