/* ===================================================
   ELYSIUM x AMONG US SCRIPT
   Chrome Dino Style Space Runner Preloader (<10s)
   Interactive Jumping, Score Ticker, Audio & Smooth Bridge Reveal
=================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const preloader = document.getElementById('preloader');
  const preloaderProgress = document.getElementById('preloaderProgress');
  const preloaderCount = document.getElementById('preloaderCount');
  const preloaderTaskText = document.getElementById('preloaderTaskText');
  const dinoScore = document.getElementById('dinoScore');
  const dinoCrewmate = document.getElementById('dinoCrewmate');

  const registerBtn = document.getElementById('registerBtn');
  const registrationOverlay = document.getElementById('registrationOverlay');
  const closeTerminalBtn = document.getElementById('closeTerminalBtn');
  const overlayCloseTrigger = document.getElementById('overlayCloseTrigger');
  const soundToggle = document.getElementById('soundToggle');
  const starfieldCanvas = document.getElementById('starfield');
  const redAstronaut = document.querySelector('.astra-red');
  const cyanAstronaut = document.querySelector('.astra-cyan');

  // Check if returning from internal register page
  const urlParams = new URLSearchParams(window.location.search);
  const isInternalReturn = urlParams.get('from') === 'register';

  // Clear any persistent storage flags so the website always opens with the loading page
  try {
    sessionStorage.removeItem('elysium_visited');
    sessionStorage.removeItem('fromLanding');
  } catch (e) {}

  // Authentic Among Us Emergency Meeting Audio Asset
  const emergencyAudio = new Audio('emergency_meeting.mp3');
  emergencyAudio.preload = 'auto';

  // Audio Context
  let audioCtx = null;
  let soundEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playBeep(freq = 440, type = 'sine', duration = 0.15, vol = 0.1) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  function playJumpSound() {
    if (!soundEnabled) return;
    // Classic 8-bit retro arcade jump sound
    playBeep(320, 'square', 0.08, 0.15);
    setTimeout(() => playBeep(580, 'square', 0.12, 0.18), 40);
  }

  // Synthesizer fallback if local MP3 is blocked or disabled
  function playSynthesizedEmergencyAlarm() {
    if (!soundEnabled) return;
    playBeep(920, 'sawtooth', 0.22, 0.25);
    setTimeout(() => playBeep(587.33, 'triangle', 0.25, 0.2), 120);
    setTimeout(() => playBeep(920, 'sawtooth', 0.45, 0.28), 260);
  }

  // Plays authentic Among Us Emergency Meeting theme sound
  function playEmergencyThemeSound() {
    if (!soundEnabled) return;
    try {
      initAudio();
      emergencyAudio.currentTime = 0;
      emergencyAudio.volume = 1.0;
      const playPromise = emergencyAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('HTML5 Audio playback failed (browser policy/format), using synth fallback:', err);
          playSynthesizedEmergencyAlarm();
        });
      }
    } catch (e) {
      console.warn('Audio play error, falling back to Web Audio:', e);
      playSynthesizedEmergencyAlarm();
    }
  }

  // ===================================================
  // DINO JUMP MECHANIC (Space key, click or auto-jump)
  // ===================================================
  let isJumping = false;

  function triggerJump() {
    if (isJumping || !dinoCrewmate) return;
    isJumping = true;
    playJumpSound();
    dinoCrewmate.classList.add('jumping');

    setTimeout(() => {
      if (dinoCrewmate) {
        dinoCrewmate.classList.remove('jumping');
      }
      isJumping = false;
    }, 720);
  }

  // Allow user to manually press Space or Click to jump like Chrome Dino
  window.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.key === ' ') && preloader && !preloader.classList.contains('fade-out')) {
      e.preventDefault();
      triggerJump();
    }
  });

  if (dinoCrewmate) {
    dinoCrewmate.addEventListener('click', triggerJump);
  }

  let autoJumpInterval = null;

  // ===================================================
  // PRELOADER PROGRESSION (Strictly 10.0 seconds)
  // Prevent repeating loading screen when navigating between internal pages
  // ===================================================
  if (isInternalReturn) {
    if (preloader) {
      preloader.style.display = 'none';
      preloader.classList.add('fade-out');
    }
  } else {
    // Auto-jump over approaching obstacles rhythmically
    autoJumpInterval = setInterval(() => {
      if (preloader && !preloader.classList.contains('fade-out')) {
        triggerJump();
      } else if (autoJumpInterval) {
        clearInterval(autoJumpInterval);
      }
    }, 2400);

    const dinoTasks = [
      { threshold: 0, text: "INITIALIZING SHIP PROTOCOLS..." },
      { threshold: 18, text: "CONNECTING TO THE SKELD ORBIT..." },
      { threshold: 38, text: "JUMPING OVER ASTEROID CLUSTERS..." },
      { threshold: 60, text: "EVADING DEEP SPACE VENTS & UFOS..." },
      { threshold: 82, text: "APPROACHING ELYSIUM OBSERVATION DECK..." },
      { threshold: 96, text: "DOCKING COMPLETE! WELCOME ABOARD! ✨" }
    ];

    let currentPercent = 0;
    let scoreVal = 0;
    const targetDurationMs = 10000; // Strictly 10 seconds
    const stepIntervalMs = 50;
    const startTime = performance.now();

    const preloaderTimer = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progressRatio = Math.min(elapsed / targetDurationMs, 1.0);
      currentPercent = Math.min(Math.floor(progressRatio * 100), 100);

      // Update retro Dino score ticker
      scoreVal += Math.floor(Math.random() * 5) + 3;
      if (dinoScore) {
        dinoScore.textContent = String(scoreVal).padStart(5, '0');
      }

      if (preloaderProgress) {
        preloaderProgress.style.width = `${currentPercent}%`;
      }
      if (preloaderCount) {
        preloaderCount.textContent = `${currentPercent}%`;
      }

      const activeTask = dinoTasks.slice().reverse().find(t => currentPercent >= t.threshold);
      if (activeTask && preloaderTaskText && preloaderTaskText.textContent !== activeTask.text) {
        preloaderTaskText.textContent = activeTask.text;
      }

      if (elapsed >= targetDurationMs || currentPercent >= 100) {
        clearInterval(preloaderTimer);
        if (autoJumpInterval) clearInterval(autoJumpInterval);
        if (preloaderProgress) preloaderProgress.style.width = '100%';
        if (preloaderCount) preloaderCount.textContent = '100%';

        setTimeout(() => {
          if (preloader) {
            preloader.classList.add('fade-out');
            playBeep(523.25, 'sine', 0.2, 0.1);
            setTimeout(() => {
              preloader.style.display = 'none';
            }, 600);
          }
        }, 200);
      }
    }, stepIntervalMs);
  }

  // Sound Toggle Button
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundToggle.querySelector('.sound-icon').textContent = soundEnabled ? '🔊' : '🔇';
      if (soundEnabled) {
        playBeep(600, 'sine', 0.1);
      }
    });
  }

  // Open Registration Modal with Authentic Emergency Meeting Audio
  function openRegistration() {
    initAudio();
    playEmergencyThemeSound();

    // Visual button press animation
    if (registerBtn) {
      registerBtn.classList.add('pressed');
      setTimeout(() => registerBtn.classList.remove('pressed'), 400);
    }

    // Emergency red alarm flash on observation deck
    document.body.classList.add('emergency-alarm-active');
    setTimeout(() => document.body.classList.remove('emergency-alarm-active'), 1200);

    // Reveal Registration Terminal
    if (registrationOverlay) {
      registrationOverlay.classList.add('active');
      registrationOverlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  // Close Registration Modal
  function closeRegistration() {
    playBeep(320, 'sine', 0.12);
    if (registrationOverlay) {
      registrationOverlay.classList.remove('active');
      registrationOverlay.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
  }

  // Listeners
  if (registerBtn) {
    registerBtn.addEventListener('click', openRegistration);
  }

  if (closeTerminalBtn) {
    closeTerminalBtn.addEventListener('click', closeRegistration);
  }

  if (overlayCloseTrigger) {
    overlayCloseTrigger.addEventListener('click', closeRegistration);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && registrationOverlay.classList.contains('active')) {
      closeRegistration();
    }
  });

  // Fun crewmate interaction sounds
  if (redAstronaut) {
    redAstronaut.addEventListener('click', () => {
      playBeep(260, 'sawtooth', 0.4, 0.2);
    });
  }

  if (cyanAstronaut) {
    cyanAstronaut.addEventListener('click', () => {
      playBeep(660, 'sine', 0.2, 0.15);
    });
  }

  // Starfield Canvas for main page
  if (starfieldCanvas) {
    const ctx = starfieldCanvas.getContext('2d');
    let stars = [];
    const STAR_COUNT = 110;

    function resizeCanvas() {
      starfieldCanvas.width = window.innerWidth;
      starfieldCanvas.height = window.innerHeight;
      createStars();
    }

    function createStars() {
      stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * starfieldCanvas.width,
          y: Math.random() * starfieldCanvas.height,
          radius: Math.random() * 1.6 + 0.4,
          alpha: Math.random(),
          speed: Math.random() * 0.015 + 0.005,
          color: Math.random() > 0.3 ? '#ffffff' : (Math.random() > 0.5 ? '#00f0ff' : '#c084fc')
        });
      }
    }

    function renderStarfield() {
      ctx.clearRect(0, 0, starfieldCanvas.width, starfieldCanvas.height);

      for (let star of stars) {
        star.alpha += star.speed;
        const currentAlpha = Math.abs(Math.sin(star.alpha));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentAlpha * 0.85;
        ctx.shadowBlur = 6;
        ctx.shadowColor = star.color;
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      requestAnimationFrame(renderStarfield);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    renderStarfield();
  }
});
