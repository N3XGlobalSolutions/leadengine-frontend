import React, { useEffect, useRef } from 'react';

export const ParticleSphereAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || 500;
      height = canvas.height = canvas.parentElement?.clientHeight || 500;
    };

    window.addEventListener('resize', handleResize);

    // Dense particle sphere
    const numParticles = 650;
    const radius = Math.min(width, height) * 0.45;
    const colors = [
      'rgba(59, 130, 246, ',   // Blue-500
      'rgba(99, 102, 241, ',   // Indigo-500
      'rgba(14, 165, 233, ',   // Sky-500
      'rgba(148, 163, 184, ',  // Slate-400
      'rgba(79, 70, 229, ',    // Indigo-600
    ];

    const particles = Array.from({ length: numParticles }, (_, i) => {
      const phi = Math.acos(-1 + (2 * i) / numParticles);
      const theta = Math.sqrt(numParticles * Math.PI) * phi;
      return {
        x: radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(phi),
        colorPrefix: colors[i % colors.length],
        baseSize: Math.random() * 1.6 + 0.8,
      };
    });

    let angleX = 0.002;
    let angleY = 0.004;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      particles.forEach((p) => {
        // Rotate Y
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;

        // Rotate X
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        p.x = x1;
        p.y = y1;
        p.z = z2;

        // Perspective projection
        const perspective = 500;
        const scale = perspective / (perspective + p.z);
        const projX = cx + p.x * scale;
        const projY = cy + p.y * scale;
        const size = p.baseSize * scale;
        const alpha = Math.min(1, Math.max(0.18, (p.z + radius) / (2 * radius)));

        ctx.beginPath();
        ctx.arc(projX, projY, size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.colorPrefix}${alpha.toFixed(2)})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full pointer-events-none" />;
};

export default ParticleSphereAnimation;
