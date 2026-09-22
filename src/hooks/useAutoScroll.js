import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Universal Auto-Scroll Hook with Smart TV & High-DPI Support
 * 
 * Specifically optimized for:
 * 1. Smart TVs (LG WebOS, Samsung Tizen, Android TV, Hisense, etc.)
 *    - Resolves sub-pixel integer truncation (where scrollTop += 0.85 rounds back to 0 on TVs).
 *    - Uses Time-Delta (pixels-per-second) for uniform speed across 30Hz, 60Hz, 120Hz screens.
 *    - Prevents cursor trapping when Smart TV magic remotes / air mice hover over elements.
 * 2. High-DPI scaling & fractional clientHeight boundaries.
 * 3. Fallback timer for TV browsers that throttle requestAnimationFrame.
 */

export const SPEED_PRESETS = {
  slow: 24,    // 24 pixels per second
  normal: 48,  // 48 pixels per second
  fast: 96     // 96 pixels per second
};

export function useAutoScroll({
  initialEnabled = true,
  initialSpeed = 'normal',
  pauseOnHover = true,
  bottomPauseMs = 2600,
  topPauseMs = 2000
} = {}) {
  const containerRef = useRef(null);
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [speedSetting, setSpeedSetting] = useState(initialSpeed);
  const [direction, setDirection] = useState('down'); // 'down' | 'up'
  const [isInteracting, setIsInteracting] = useState(false);
  const [isPausedAtEnd, setIsPausedAtEnd] = useState(false);
  const [pauseReason, setPauseReason] = useState(''); // 'bottom' | 'top'

  // Internal persistent refs
  const scrollPosRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animationFrameRef = useRef(null);
  const backupTimerRef = useRef(null);
  const pauseTimerRef = useRef(null);
  const resumeTimerRef = useRef(null);
  const directionRef = useRef('down');
  const isPausedRef = useRef(false);
  const isInteractingRef = useRef(false);
  const stuckCounterRef = useRef(0);
  const lastScrollTopRef = useRef(0);

  const pixelsPerSecond = SPEED_PRESETS[speedSetting] || SPEED_PRESETS.normal;

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
      scrollPosRef.current = 0;
      lastScrollTopRef.current = 0;
      setDirection('down');
      directionRef.current = 'down';
      setIsPausedAtEnd(false);
      isPausedRef.current = false;
      stuckCounterRef.current = 0;
    }
  }, []);

  // Toggle direction manually
  const toggleDirection = useCallback(() => {
    setDirection(prev => {
      const next = prev === 'down' ? 'up' : 'down';
      directionRef.current = next;
      stuckCounterRef.current = 0;
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

  // Main Auto-Scroll Loop (requestAnimationFrame with delta-time + Subpixel Ref)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isEnabled) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (backupTimerRef.current) clearInterval(backupTimerRef.current);
      return;
    }

    let isDestroyed = false;
    lastTimeRef.current = performance.now();
    scrollPosRef.current = el.scrollTop;
    lastScrollTopRef.current = el.scrollTop;
    stuckCounterRef.current = 0;

    const performScrollStep = (now) => {
      if (isDestroyed || !isEnabled) return;

      const currentEl = containerRef.current;
      if (!currentEl) return;

      // Calculate time delta in seconds (capped at 0.1s to avoid jump after tab switch)
      const lastTime = lastTimeRef.current || now;
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTimeRef.current = now;

      // Check if container has scrollable content
      const maxScroll = currentEl.scrollHeight - currentEl.clientHeight;
      if (maxScroll > 2 && !isInteractingRef.current && !isPausedRef.current) {
        
        // Sync scrollPosRef if user or external script scrolled manually
        if (Math.abs(currentEl.scrollTop - Math.round(scrollPosRef.current)) > 6) {
          scrollPosRef.current = currentEl.scrollTop;
        }

        const moveAmount = pixelsPerSecond * dt;
        const curDir = directionRef.current;

        if (curDir === 'down') {
          scrollPosRef.current += moveAmount;
          const targetTop = Math.min(maxScroll, Math.round(scrollPosRef.current));
          currentEl.scrollTop = targetTop;

          // Check if reached bottom or cannot scroll further (stuck on boundary)
          const isAtBottom = currentEl.scrollTop >= maxScroll - 3;
          if (currentEl.scrollTop === lastScrollTopRef.current && targetTop > currentEl.scrollTop) {
            stuckCounterRef.current += 1;
          } else {
            stuckCounterRef.current = 0;
          }
          lastScrollTopRef.current = currentEl.scrollTop;

          if (isAtBottom || stuckCounterRef.current >= 6) {
            // Reached bottom: Pause, then reverse to scroll UP
            setIsPausedAtEnd(true);
            setPauseReason('bottom');
            isPausedRef.current = true;
            stuckCounterRef.current = 0;

            if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
            pauseTimerRef.current = setTimeout(() => {
              if (!isDestroyed && isEnabled) {
                setDirection('up');
                directionRef.current = 'up';
                setIsPausedAtEnd(false);
                setPauseReason('');
                isPausedRef.current = false;
                lastTimeRef.current = performance.now();
                animationFrameRef.current = requestAnimationFrame(loop);
              }
            }, bottomPauseMs);
            return;
          }
        } else {
          // Scrolling UP
          scrollPosRef.current -= moveAmount;
          const targetTop = Math.max(0, Math.round(scrollPosRef.current));
          currentEl.scrollTop = targetTop;

          // Check if reached top or cannot scroll further
          const isAtTop = currentEl.scrollTop <= 2;
          if (currentEl.scrollTop === lastScrollTopRef.current && targetTop < currentEl.scrollTop) {
            stuckCounterRef.current += 1;
          } else {
            stuckCounterRef.current = 0;
          }
          lastScrollTopRef.current = currentEl.scrollTop;

          if (isAtTop || stuckCounterRef.current >= 6) {
            // Reached top: Pause, then reverse to scroll DOWN
            setIsPausedAtEnd(true);
            setPauseReason('top');
            isPausedRef.current = true;
            stuckCounterRef.current = 0;

            if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
            pauseTimerRef.current = setTimeout(() => {
              if (!isDestroyed && isEnabled) {
                setDirection('down');
                directionRef.current = 'down';
                setIsPausedAtEnd(false);
                setPauseReason('');
                isPausedRef.current = false;
                lastTimeRef.current = performance.now();
                animationFrameRef.current = requestAnimationFrame(loop);
              }
            }, topPauseMs);
            return;
          }
        }
      }
    };

    const loop = (time) => {
      if (isDestroyed || !isEnabled) return;
      performScrollStep(time);
      if (!isPausedRef.current) {
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    // Fallback timer for Smart TV browsers that throttle requestAnimationFrame
    backupTimerRef.current = setInterval(() => {
      if (!isDestroyed && isEnabled && !isPausedRef.current && !isInteractingRef.current) {
        const now = performance.now();
        // If animation frame hasn't run in > 100ms, step manually
        if (now - lastTimeRef.current > 100) {
          performScrollStep(now);
        }
      }
    }, 60);

    return () => {
      isDestroyed = true;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (backupTimerRef.current) clearInterval(backupTimerRef.current);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [isEnabled, pixelsPerSecond, bottomPauseMs, topPauseMs]);

  // Smart User Interaction Listener (with Auto-Resume Watchdog for TV Magic Remotes)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !pauseOnHover) return;

    const handleUserInteraction = () => {
      setIsInteracting(true);
      isInteractingRef.current = true;

      // Reset auto-resume timer: If no new interaction happens for 3.5 seconds, automatically resume auto-scroll
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        setIsInteracting(false);
        isInteractingRef.current = false;
        if (containerRef.current) {
          scrollPosRef.current = containerRef.current.scrollTop;
          lastScrollTopRef.current = containerRef.current.scrollTop;
        }
        lastTimeRef.current = performance.now();
      }, 3500);
    };

    const handleMouseLeave = () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        setIsInteracting(false);
        isInteractingRef.current = false;
        if (containerRef.current) {
          scrollPosRef.current = containerRef.current.scrollTop;
          lastScrollTopRef.current = containerRef.current.scrollTop;
        }
        lastTimeRef.current = performance.now();
      }, 1000);
    };

    // Events to watch
    el.addEventListener('mouseenter', handleUserInteraction, { passive: true });
    el.addEventListener('mousemove', handleUserInteraction, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    el.addEventListener('wheel', handleUserInteraction, { passive: true });
    el.addEventListener('touchstart', handleUserInteraction, { passive: true });
    el.addEventListener('touchmove', handleUserInteraction, { passive: true });

    return () => {
      el.removeEventListener('mouseenter', handleUserInteraction);
      el.removeEventListener('mousemove', handleUserInteraction);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('wheel', handleUserInteraction);
      el.removeEventListener('touchstart', handleUserInteraction);
      el.removeEventListener('touchmove', handleUserInteraction);
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
