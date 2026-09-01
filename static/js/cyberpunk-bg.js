(function () {
  'use strict';

  
  const CONFIG = {
    desktop: { count: 60, connectDist: 150 },
    mobile: { count: 25, connectDist: 100 },
    colors: [
      { r: 252, g: 238, b: 10 },   // neon yellow
      { r: 255, g: 46, b: 99 },    // hot magenta
      { r: 0,   g: 240, b: 255 }   // electric cyan
    ]
  };

  const canvas = document.createElement('canvas');
  canvas.id = 'cyberpunk-bg';
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let particles = [];
  let config = CONFIG.desktop;
  let animId;

  const mouse = { x: -9999, y: -9999, radius: 140 };

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    config = w < 768 ? CONFIG.mobile : CONFIG.desktop;
    init();
  }

  function init() {
    particles = [];
    for (let i = 0; i < config.count; i++) {
      const color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        color: color,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
  }

  function animate() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    const now = Date.now();

    // Update positions + mouse repulsion
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < mouse.radius * mouse.radius && distSq > 0) {
        const dist = Math.sqrt(distSq);
        const force = (mouse.radius - dist) / mouse.radius;
        p.x += (dx / dist) * force * 3;
        p.y += (dy / dist) * force * 3;
      }

      // Wrap around edges
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;
    }

    // Draw connections
    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (Math.abs(dx) > config.connectDist || Math.abs(dy) > config.connectDist) continue;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < config.connectDist) {
          const opacity = (1 - dist / config.connectDist) * 0.18;
          ctx.strokeStyle = `rgba(255, 46, 99, ${opacity})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Draw particles with glow
    for (const p of particles) {
      const pulse = Math.sin(now * 0.002 + p.pulseOffset) * 0.5 + 0.5;
      const opacity = 0.4 + pulse * 0.4;
      const size = p.size + pulse * 0.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.8)`;
      ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${opacity})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    animId = requestAnimationFrame(animate);
  }

  // Mouse tracking
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // Touch tracking (mobile)
  window.addEventListener('touchmove', (e) => {
    if (e.touches[0]) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }, { passive: true });
  window.addEventListener('touchend', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // Debounced resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 200);
  });

  // Pause when tab hidden (battery saver)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      animate();
    }
  });

  // Start
  function start() {
    resize();
    animate();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();