import { useState, useEffect, useRef, useCallback } from 'react';

export const SPEED_PRESETS = {
  slow: 0.45,
  normal: 0.85,
  fast: 1.6
};

export function useAutoScroll({
  initialEnabled = true,
  initialSpeed = 'normal',
  pauseOnHover = true,
  bottomPauseMs = 2200,
  topPauseMs = 1800
} = {}) {
  const containerRef = useRef(null);
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [speedSetting, setSpeedSetting] = useState(initialSpeed);
  const [direction, setDirection] = useState('down'); // 'down' | 'up'
  const [isInteracting, setIsInteracting] = useState(false);
  const [isPausedAtEnd, setIsPausedAtEnd] = useState(false);
  const [pauseReason, setPauseReason] = useState(''); // 'bottom' | 'top'

  const animationFrameRef = useRef(null);
  const pauseTimerRef = useRef(null);
  const resumeTimerRef = useRef(null);
  const directionRef = useRef('down');
  const isPausedRef = useRef(false);
  const isInteractingRef = useRef(false);

  const speedVal = SPEED_PRESETS[speedSetting] || SPEED_PRESETS.normal;

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    isPausedRef.current = isPausedAtEnd;
  }, [isPausedAtEnd]);

  useEffect(() => {
    isInteractingRef.current = isInteracting;
  }, [isInteracting]);

  // Manual scroll to top
  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      setDirection('down');
      directionRef.current = 'down';
      setIsPausedAtEnd(false);
      isPausedRef.current = false;
    }
  }, []);

  // Toggle Direction manually
  const toggleDirection = useCallback(() => {
    setDirection(prev => {
      const next = prev === 'down' ? 'up' : 'down';
      directionRef.current = next;
      return next;
    });
  }, []);

  // Cycle speed (slow -> normal -> fast -> slow)
  const cycleSpeed = useCallback(() => {
    setSpeedSetting((prev) => {
      if (prev === 'slow') return 'normal';
      if (prev === 'normal') return 'fast';
      return 'slow';
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isEnabled) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    let isDestroyed = false;

    const step = () => {
      if (isDestroyed || !isEnabled) return;

      const currentEl = containerRef.current;
      if (
        currentEl &&
        currentEl.scrollHeight > currentEl.clientHeight &&
        !isInteractingRef.current &&
        !isPausedRef.current
      ) {
        const maxScroll = currentEl.scrollHeight - currentEl.clientHeight;
        const curDir = directionRef.current;

        if (curDir === 'down') {
          if (currentEl.scrollTop >= maxScroll - 1) {
            // Reached bottom: pause, then switch direction to scroll UP
            setIsPausedAtEnd(true);
            setPauseReason('bottom');
            isPausedRef.current = true;

            if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
            pauseTimerRef.current = setTimeout(() => {
              if (!isDestroyed && isEnabled) {
                setDirection('up');
                directionRef.current = 'up';
                setIsPausedAtEnd(false);
                setPauseReason('');
                isPausedRef.current = false;
                animationFrameRef.current = requestAnimationFrame(step);
              }
            }, bottomPauseMs);
            return;
          } else {
            currentEl.scrollTop += speedVal;
          }
        } else {
          // Scrolling UP
          if (currentEl.scrollTop <= 1) {
            // Reached top: pause, then switch direction to scroll DOWN
            setIsPausedAtEnd(true);
            setPauseReason('top');
            isPausedRef.current = true;

            if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
            pauseTimerRef.current = setTimeout(() => {
              if (!isDestroyed && isEnabled) {
                setDirection('down');
                directionRef.current = 'down';
                setIsPausedAtEnd(false);
                setPauseReason('');
                isPausedRef.current = false;
                animationFrameRef.current = requestAnimationFrame(step);
              }
            }, topPauseMs);
            return;
          } else {
            currentEl.scrollTop -= speedVal;
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      isDestroyed = true;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, [isEnabled, speedVal, bottomPauseMs, topPauseMs]);

  // Handle User Hover / Touch Interaction listeners
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !pauseOnHover) return;

    const handleMouseEnter = () => {
      setIsInteracting(true);
      isInteractingRef.current = true;
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };

    const handleMouseLeave = () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        setIsInteracting(false);
        isInteractingRef.current = false;
      }, 1200);
    };

    const handleTouchStart = () => {
      setIsInteracting(true);
      isInteractingRef.current = true;
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };

    const handleTouchEnd = () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        setIsInteracting(false);
        isInteractingRef.current = false;
      }, 1800);
    };

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [pauseOnHover]);

  return {
    containerRef,
    isEnabled,
    setIsEnabled,
    toggleAutoScroll: () => setIsEnabled(prev => !prev),
    direction,
    setDirection,
    toggleDirection,
    isInteracting,
    isPausedAtEnd,
    pauseReason,
    speed: speedSetting,
    setSpeed: setSpeedSetting,
    cycleSpeed,
    scrollToTop
  };
}
