import { useState, useEffect, useRef } from 'react';
import { DESIGN } from '../lib/constants';

interface GeneratingLoaderProps {
  tripName: string;
  destinations?: string[];
}

// Fun travel facts to cycle through
const TRAVEL_FACTS = [
  "France is the most visited country in the world",
  "There's a water bubble hotel in Iceland",
  "Japan has over 5 million vending machines",
  "Monaco is smaller than Central Park",
  "There's a hotel made entirely of salt in Bolivia",
  "Australia's Great Barrier Reef is visible from space",
  "Venice is built on 118 small islands",
  "Singapore has a waterfall inside an airport",
  "Iceland has no mosquitoes",
  "There are more saunas than cars in Finland",
  "Switzerland has over 7,000 lakes",
  "New Zealand was the first to see the sunrise",
  "Bhutan measures success by happiness",
  "The Netherlands has more bikes than people",
  "Greece has over 6,000 islands",
];

// Loading stage messages
const LOADING_STAGES = [
  { message: "Researching top attractions...", icon: "🏛️" },
  { message: "Finding hidden local gems...", icon: "💎" },
  { message: "Curating restaurant recommendations...", icon: "🍽️" },
  { message: "Optimizing your daily schedule...", icon: "📅" },
  { message: "Adding insider tips...", icon: "💡" },
  { message: "Finalizing your perfect trip...", icon: "✨" },
];

// Animated globe component (simplified version for loading)
function LoadingGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let rotation = 0;

    const resize = () => {
      const size = Math.min(300, window.innerWidth - 48);
      canvas.width = size * window.devicePixelRatio;
      canvas.height = size * window.devicePixelRatio;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener('resize', resize);

    // Generate random "city" points
    const cities = Array.from({ length: 30 }, () => ({
      lat: (Math.random() - 0.5) * Math.PI,
      lng: Math.random() * Math.PI * 2,
      size: Math.random() * 2 + 1,
      pulse: Math.random() * Math.PI * 2,
    }));

    // Generate flight paths
    const flights = Array.from({ length: 6 }, () => ({
      startLat: (Math.random() - 0.5) * Math.PI * 0.8,
      startLng: Math.random() * Math.PI * 2,
      endLat: (Math.random() - 0.5) * Math.PI * 0.8,
      endLng: Math.random() * Math.PI * 2,
      progress: Math.random(),
      speed: 0.003 + Math.random() * 0.004,
    }));

    const draw = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.4;

      ctx.clearRect(0, 0, width, height);

      // Draw globe glow
      const glowGradient = ctx.createRadialGradient(
        centerX, centerY, radius * 0.8,
        centerX, centerY, radius * 1.3
      );
      glowGradient.addColorStop(0, 'rgba(14, 165, 233, 0.15)');
      glowGradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // Draw globe body with gradient
      const gradient = ctx.createRadialGradient(
        centerX - radius * 0.3, centerY - radius * 0.3, 0,
        centerX, centerY, radius
      );
      gradient.addColorStop(0, 'rgba(30, 58, 95, 0.25)');
      gradient.addColorStop(0.7, 'rgba(30, 58, 95, 0.15)');
      gradient.addColorStop(1, 'rgba(30, 58, 95, 0.05)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw globe border
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw latitude lines
      for (let i = -2; i <= 2; i++) {
        const lat = (i / 3) * Math.PI * 0.4;
        const y = centerY + Math.sin(lat) * radius;
        const lineRadius = Math.cos(lat) * radius;

        if (lineRadius > 0) {
          ctx.beginPath();
          ctx.ellipse(centerX, y, lineRadius, lineRadius * 0.15, 0, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(30, 58, 95, 0.15)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw longitude lines
      for (let i = 0; i < 8; i++) {
        const lng = (i / 8) * Math.PI + rotation;
        ctx.beginPath();
        for (let j = 0; j <= 50; j++) {
          const lat = ((j / 50) - 0.5) * Math.PI;
          const x = centerX + Math.cos(lat) * Math.sin(lng) * radius;
          const y = centerY + Math.sin(lat) * radius;
          const z = Math.cos(lat) * Math.cos(lng);

          if (z > -0.1) {
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = 'rgba(30, 58, 95, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw pulsing cities
      const time = Date.now() / 1000;
      cities.forEach((city) => {
        const lng = city.lng + rotation;
        const x = centerX + Math.cos(city.lat) * Math.sin(lng) * radius;
        const y = centerY + Math.sin(city.lat) * radius;
        const z = Math.cos(city.lat) * Math.cos(lng);

        if (z > 0) {
          const pulse = Math.sin(time * 2 + city.pulse) * 0.3 + 0.7;
          const cityOpacity = (0.4 + z * 0.6) * pulse;
          const citySize = city.size * (0.5 + z * 0.5) * (0.8 + pulse * 0.4);

          // Draw pulse ring
          ctx.beginPath();
          ctx.arc(x, y, citySize * 2 * pulse, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(14, 165, 233, ${cityOpacity * 0.2})`;
          ctx.fill();

          // Draw city dot
          ctx.beginPath();
          ctx.arc(x, y, citySize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(14, 165, 233, ${cityOpacity})`;
          ctx.fill();
        }
      });

      // Draw flight paths
      flights.forEach((flight) => {
        flight.progress += flight.speed;
        if (flight.progress > 1) {
          flight.progress = 0;
          flight.startLat = flight.endLat;
          flight.startLng = flight.endLng;
          flight.endLat = (Math.random() - 0.5) * Math.PI * 0.8;
          flight.endLng = Math.random() * Math.PI * 2;
        }

        const startLng = flight.startLng + rotation;
        const endLng = flight.endLng + rotation;

        // Draw arc path
        ctx.beginPath();
        let firstPoint = true;
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          const lat = flight.startLat + (flight.endLat - flight.startLat) * t;
          const lng = startLng + (endLng - startLng) * t;
          const altitude = 1 + Math.sin(t * Math.PI) * 0.12;

          const x = centerX + Math.cos(lat) * Math.sin(lng) * radius * altitude;
          const y = centerY + Math.sin(lat) * radius * altitude;
          const z = Math.cos(lat) * Math.cos(lng);

          if (z > -0.2) {
            if (firstPoint) {
              ctx.moveTo(x, y);
              firstPoint = false;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.strokeStyle = 'rgba(201, 162, 39, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw plane position
        const t = flight.progress;
        const planeLat = flight.startLat + (flight.endLat - flight.startLat) * t;
        const planeLng = startLng + (endLng - startLng) * t;
        const altitude = 1 + Math.sin(t * Math.PI) * 0.12;
        const planeZ = Math.cos(planeLat) * Math.cos(planeLng);

        if (planeZ > 0) {
          const planeX = centerX + Math.cos(planeLat) * Math.sin(planeLng) * radius * altitude;
          const planeY = centerY + Math.sin(planeLat) * radius * altitude;

          // Glow
          const glow = ctx.createRadialGradient(planeX, planeY, 0, planeX, planeY, 12);
          glow.addColorStop(0, 'rgba(201, 162, 39, 0.6)');
          glow.addColorStop(1, 'rgba(201, 162, 39, 0)');
          ctx.beginPath();
          ctx.arc(planeX, planeY, 12, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();

          // Plane dot
          ctx.beginPath();
          ctx.arc(planeX, planeY, 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(201, 162, 39, ${0.7 + planeZ * 0.3})`;
          ctx.fill();
        }
      });

      rotation += 0.004;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />;
}

export default function GeneratingLoader({ tripName, destinations = [] }: GeneratingLoaderProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [currentFact, setCurrentFact] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showFact, setShowFact] = useState(true);

  // Cycle through loading stages
  useEffect(() => {
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % LOADING_STAGES.length);
    }, 3000);

    return () => clearInterval(stageInterval);
  }, []);

  // Cycle through travel facts with fade animation
  useEffect(() => {
    const factInterval = setInterval(() => {
      setShowFact(false);
      setTimeout(() => {
        setCurrentFact((prev) => (prev + 1) % TRAVEL_FACTS.length);
        setShowFact(true);
      }, 300);
    }, 5000);

    return () => clearInterval(factInterval);
  }, []);

  // Animate progress bar
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Slow down as we approach 90%
        const increment = prev < 30 ? 2 : prev < 60 ? 1.5 : prev < 80 ? 0.8 : 0.3;
        return Math.min(prev + increment, 90);
      });
    }, 500);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${DESIGN.colors.bgPrimary} 0%, ${DESIGN.colors.bgSecondary} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden',
      }}
    >
      {/* Animated globe */}
      <div
        style={{
          marginBottom: '32px',
          animation: 'float 6s ease-in-out infinite',
        }}
      >
        <LoadingGlobe />
      </div>

      {/* Main content */}
      <div
        style={{
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%',
        }}
      >
        {/* Trip name */}
        <h1
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: '2rem',
            fontWeight: 400,
            color: DESIGN.colors.textPrimary,
            marginBottom: '8px',
          }}
        >
          {tripName}
        </h1>

        {/* Destinations */}
        {destinations.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '24px',
            }}
          >
            {destinations.map((dest, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: DESIGN.colors.bgCard,
                  border: `1px solid ${DESIGN.colors.border}`,
                  borderRadius: DESIGN.radius.full,
                  fontSize: '14px',
                  color: DESIGN.colors.textSecondary,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DESIGN.colors.accent} strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {dest}
              </span>
            ))}
          </div>
        )}

        {/* Current stage with icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '24px',
            minHeight: '32px',
          }}
        >
          <span
            style={{
              fontSize: '24px',
              animation: 'bounce 1s ease-in-out infinite',
            }}
          >
            {LOADING_STAGES[currentStage].icon}
          </span>
          <span
            style={{
              fontSize: '16px',
              color: DESIGN.colors.textPrimary,
              fontWeight: 500,
            }}
          >
            {LOADING_STAGES[currentStage].message}
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: DESIGN.colors.border,
            borderRadius: DESIGN.radius.full,
            overflow: 'hidden',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: DESIGN.gradients.accent,
              borderRadius: DESIGN.radius.full,
              transition: 'width 0.5s ease-out',
            }}
          />
        </div>

        {/* Fun fact section */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: DESIGN.colors.bgCard,
            border: `1px solid ${DESIGN.colors.border}`,
            borderRadius: DESIGN.radius.lg,
            boxShadow: DESIGN.shadows.md,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '16px' }}>✈️</span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: DESIGN.colors.accent,
              }}
            >
              Did you know?
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '15px',
              color: DESIGN.colors.textSecondary,
              lineHeight: 1.5,
              opacity: showFact ? 1 : 0,
              transition: 'opacity 0.3s ease',
              minHeight: '44px',
            }}
          >
            {TRAVEL_FACTS[currentFact]}
          </p>
        </div>

        {/* Tip text */}
        <p
          style={{
            marginTop: '24px',
            fontSize: '13px',
            color: DESIGN.colors.textMuted,
          }}
        >
          This may take up to 30 seconds. We&apos;re crafting something special!
        </p>
      </div>

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
