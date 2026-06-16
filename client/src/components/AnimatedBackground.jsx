import React, { useEffect, useRef } from 'react';

const AnimatedBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Single elegant background design - Soft geometric pattern
    const drawBackground = () => {
      // Base dark background
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle grid pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 0.5;
      const gridSize = 60;
      
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Large subtle circles for depth
      const circles = [
        { x: '20%', y: '30%', radius: 300, opacity: 0.015 },
        { x: '80%', y: '70%', radius: 400, opacity: 0.01 },
        { x: '50%', y: '50%', radius: 500, opacity: 0.008 },
      ];

      circles.forEach(circle => {
        const x = (parseFloat(circle.x) / 100) * canvas.width;
        const y = (parseFloat(circle.y) / 100) * canvas.height;
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, circle.radius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${circle.opacity * 2})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${circle.opacity})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, circle.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Subtle vignette
      const vignetteGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.5,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.8
      );
      vignetteGradient.addColorStop(0, 'transparent');
      vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
      
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    drawBackground();

    const handleResize = () => {
      resizeCanvas();
      drawBackground();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
    />
  );
};

export default AnimatedBackground;