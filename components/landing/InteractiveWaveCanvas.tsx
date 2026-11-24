import React, { useRef, useEffect } from 'react';

export const InteractiveWaveCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        // Smooth mouse tracking
        const mouse = {
            x: width / 2,
            y: height / 2,
            targetX: width / 2,
            targetY: height / 2,
        };

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.targetX = e.clientX;
            mouse.targetY = e.clientY;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        let step = 0;

        const render = () => {
            step += 0.006;

            // Interpolate mouse position for smooth organic movement
            mouse.x += (mouse.targetX - mouse.x) * 0.04;
            mouse.y += (mouse.targetY - mouse.y) * 0.04;

            ctx.clearRect(0, 0, width, height);

            // Draw multiple overlapping, flowing wave ribbons
            const numRibbons = 12;
            const segmentWidth = 20;

            for (let r = 0; r < numRibbons; r++) {
                ctx.beginPath();

                const progress = r / numRibbons;
                const alpha = 0.05 + progress * 0.12;
                
                // Elegant monochrome stroke with subtle opacity variation
                ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
                ctx.lineWidth = 1 + r * 0.25;

                const baseCenterY = height * 0.38 + Math.sin(step * 0.5 + r * 0.2) * 30;
                let started = false;

                for (let x = -50; x <= width + 50; x += segmentWidth) {
                    // Calculate distance to mouse cursor for interactive warping effect
                    const dx = x - mouse.x;
                    const dy = baseCenterY - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const mouseDistortion = Math.max(0, (1 - dist / 320)) * 60 * Math.sin(x * 0.01 + step * 2);

                    const wave1 = Math.sin(x * 0.003 + step + r * 0.3) * (50 + r * 6);
                    const wave2 = Math.cos(x * 0.006 - step * 1.2 + r * 0.15) * (30 + r * 4);
                    const wave3 = Math.sin((x + mouse.x) * 0.001 + step * 0.8) * 20;

                    const y = baseCenterY + wave1 + wave2 + wave3 - mouseDistortion;

                    if (!started) {
                        ctx.moveTo(x, y);
                        started = true;
                    } else {
                        ctx.lineTo(x, y);
                    }
                }

                ctx.stroke();
            }

            // Draw secondary subtle diagonal accent ribbon
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
            ctx.lineWidth = 2;
            for (let x = -50; x <= width + 50; x += segmentWidth) {
                const y = height * 0.55 + Math.sin(x * 0.002 - step * 1.5) * 60 + Math.cos((x - mouse.x) * 0.003) * 25;
                if (x === -50) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-0 w-full h-full"
        />
    );
};
