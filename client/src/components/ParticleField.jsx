import React, { useEffect, useRef } from 'react';

const ParticleField = ({ density = 'medium' }) => {
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

    // Particle settings based on density
    const densityMap = {
      low: 30,
      medium: 60,
      high: 100
    };

    const particles = [];
    const particleCount = densityMap[density] || 60;
    
    const mouse = {
      x: null,
      y: null,
      radius: 150
    };

    // Premium gradient colors
    const gradients = [
      ['#FFB6C1', '#FF69B4'], // Pink
      ['#E6E6FA', '#9370DB'], // Lavender to Purple
      ['#98FB98', '#3CB371'], // Mint to Green
      ['#87CEEB', '#4169E1'], // Sky to Blue
    ];

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 4 + 1;
        this.baseSize = this.size;
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.speedY = (Math.random() - 0.5) * 0.8;
        this.gradient = gradients[Math.floor(Math.random() * gradients.length)];
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
      }

      update(mouse) {
        // Mouse interaction
        if (mouse.x && mouse.y) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < mouse.radius) {
            const force = (mouse.radius - distance) / mouse.radius;
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * force * 2;
            this.y += Math.sin(angle) * force * 2;
            this.size = this.baseSize + force * 2;
          } else {
            this.size += (this.baseSize - this.size) * 0.1;
          }
        }

        // Movement
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        // Wrap around
        if (this.x > canvas.width + 50) this.x = -50;
        if (this.x < -50) this.x = canvas.width + 50;
        if (this.y > canvas.height + 50) this.y = -50;
        if (this.y < -50) this.y = canvas.height + 50;
      }

      draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Glow effect
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 2);
        glowGradient.addColorStop(0, this.gradient[0] + '40');
        glowGradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Main particle
        const particleGradient = ctx.createLinearGradient(-this.size, -this.size, this.size, this.size);
        particleGradient.addColorStop(0, this.gradient[0]);
        particleGradient.addColorStop(1, this.gradient[1]);

        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fillStyle = particleGradient;
        ctx.fill();

        // Diamond shape for premium feel
        ctx.beginPath();
        ctx.moveTo(0, -this.size * 0.5);
        ctx.lineTo(this.size * 0.3, 0);
        ctx.lineTo(0, this.size * 0.5);
        ctx.lineTo(-this.size * 0.3, 0);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();

        ctx.restore();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Mouse tracking
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update(mouse);
        particle.draw(ctx);
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
    />
  );
};

export default ParticleField;