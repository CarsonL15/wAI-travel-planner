import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getCurrentUser, signOut } from '../lib/auth';
import { DESIGN } from '../lib/constants';
import LoginModal from '../components/LoginModal';
import SignupModal from '../components/SignupModal';

// Animated globe component with scroll-based parallax
interface AnimatedGlobeProps {
  scrollProgress: number; // 0 to 1, where 1 means fully scrolled past hero
}

function AnimatedGlobe({ scrollProgress }: AnimatedGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef(scrollProgress);

  // Update scroll ref when prop changes
  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let rotation = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener('resize', resize);

    // Generate random "city" points on the globe
    const cities = Array.from({ length: 40 }, () => ({
      lat: (Math.random() - 0.5) * Math.PI,
      lng: Math.random() * Math.PI * 2,
      size: Math.random() * 2 + 1,
    }));

    // Generate flight paths
    const flights = Array.from({ length: 8 }, () => ({
      startLat: (Math.random() - 0.5) * Math.PI * 0.8,
      startLng: Math.random() * Math.PI * 2,
      endLat: (Math.random() - 0.5) * Math.PI * 0.8,
      endLng: Math.random() * Math.PI * 2,
      progress: Math.random(),
      speed: 0.002 + Math.random() * 0.003,
    }));

    const draw = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const centerX = width / 2;
      const centerY = height / 2;

      // Base radius that grows with scroll (1x to 2.5x)
      const scrollScale = 1 + scrollRef.current * 1.5;
      const radius = Math.min(width, height) * 0.35 * scrollScale;

      // Opacity fades out as you scroll (0.8 to 0)
      const opacity = Math.max(0, 0.8 - scrollRef.current * 1.2);

      ctx.clearRect(0, 0, width, height);

      if (opacity <= 0) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      ctx.globalAlpha = opacity;

      // Draw globe outline with gradient
      const gradient = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        0,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, 'rgba(30, 58, 95, 0.15)');
      gradient.addColorStop(0.7, 'rgba(30, 58, 95, 0.08)');
      gradient.addColorStop(1, 'rgba(30, 58, 95, 0.02)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw globe border
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(30, 58, 95, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw latitude lines
      for (let i = -2; i <= 2; i++) {
        const lat = (i / 3) * Math.PI * 0.4;
        const y = centerY + Math.sin(lat) * radius;
        const lineRadius = Math.cos(lat) * radius;

        if (lineRadius > 0) {
          ctx.beginPath();
          ctx.ellipse(centerX, y, lineRadius, lineRadius * 0.15, 0, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(30, 58, 95, 0.1)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw longitude lines
      for (let i = 0; i < 6; i++) {
        const lng = (i / 6) * Math.PI + rotation;
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
        ctx.strokeStyle = 'rgba(30, 58, 95, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw cities
      cities.forEach((city) => {
        const lng = city.lng + rotation;
        const x = centerX + Math.cos(city.lat) * Math.sin(lng) * radius;
        const y = centerY + Math.sin(city.lat) * radius;
        const z = Math.cos(city.lat) * Math.cos(lng);

        if (z > 0) {
          const cityOpacity = 0.3 + z * 0.5;
          ctx.beginPath();
          ctx.arc(x, y, city.size * (0.5 + z * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(30, 58, 95, ${cityOpacity})`;
          ctx.fill();
        }
      });

      // Draw and animate flight paths
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
          const altitude = 1 + Math.sin(t * Math.PI) * 0.15;

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
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw plane position
        const t = flight.progress;
        const planeLat = flight.startLat + (flight.endLat - flight.startLat) * t;
        const planeLng = startLng + (endLng - startLng) * t;
        const altitude = 1 + Math.sin(t * Math.PI) * 0.15;
        const planeZ = Math.cos(planeLat) * Math.cos(planeLng);

        if (planeZ > 0) {
          const planeX = centerX + Math.cos(planeLat) * Math.sin(planeLng) * radius * altitude;
          const planeY = centerY + Math.sin(planeLat) * radius * altitude;

          ctx.beginPath();
          ctx.arc(planeX, planeY, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(139, 92, 246, ${0.5 + planeZ * 0.5})`;
          ctx.fill();

          // Glow effect
          ctx.globalAlpha = opacity * (0.5 + planeZ * 0.5);
          const glow = ctx.createRadialGradient(planeX, planeY, 0, planeX, planeY, 8);
          glow.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
          glow.addColorStop(1, 'rgba(139, 92, 246, 0)');
          ctx.beginPath();
          ctx.arc(planeX, planeY, 8, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
          ctx.globalAlpha = opacity;
        }
      });

      ctx.globalAlpha = 1;

      // Slow idle rotation + faster rotation when scrolling
      rotation += 0.001 + scrollRef.current * 0.02;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        height: '100%',
        maxWidth: '1200px',
        maxHeight: '1200px',
        pointerEvents: 'none',
      }}
    />
  );
}

// Floating particles using CSS animation classes
function FloatingParticles() {
  const particles = useRef(
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      size: 2 + Math.random() * 4,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 10 + Math.random() * 20,
      delay: -Math.random() * 20,
    }))
  ).current;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="floating-particle"
          style={{
            position: 'absolute',
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            backgroundColor: 'rgba(30, 58, 95, 0.15)',
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  // Track scroll progress for parallax effect
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const heroHeight = heroRef.current.offsetHeight;
      const scrollY = window.scrollY;
      // Calculate progress: 0 at top, 1 when hero is fully scrolled past
      const progress = Math.min(1, Math.max(0, scrollY / (heroHeight * 0.7)));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const isAuth = await isAuthenticated();
    setAuthenticated(isAuth);
    if (isAuth) {
      try {
        const user = await getCurrentUser();
        setUserEmail(user.email);
      } catch {
        // User not found, stay logged out
      }
    }
  };

  const handleLogout = () => {
    signOut();
    setAuthenticated(false);
    setUserEmail(null);
  };

  const handleStartPlanning = () => {
    if (!authenticated) {
      setShowLoginModal(true);
      return;
    }
    router.push('/planner');
  };

  const handleAuthSuccess = () => {
    checkAuth();
  };

  return (
    <>
      <Head>
        <title>wAI Travel - AI-Powered Trip Planning</title>
        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }

          @keyframes scrollBounce {
            0%, 100% { transform: translateY(0); opacity: 1; }
            50% { transform: translateY(8px); opacity: 0.5; }
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0) translateX(0);
              opacity: 0.3;
            }
            25% {
              transform: translateY(-30px) translateX(10px);
              opacity: 0.6;
            }
            50% {
              transform: translateY(-10px) translateX(-15px);
              opacity: 0.4;
            }
            75% {
              transform: translateY(-40px) translateX(5px);
              opacity: 0.5;
            }
          }

          .floating-particle {
            animation: float ease-in-out infinite;
          }

          .animate-fade-in {
            animation: fadeIn 0.6s ease-out;
          }

          .animate-fade-in-up {
            animation: fadeInUp 0.8s ease-out;
          }

          .animate-fade-in-up-delay-1 {
            animation: fadeInUp 0.8s ease-out 0.2s both;
          }

          .animate-fade-in-up-delay-2 {
            animation: fadeInUp 0.8s ease-out 0.4s both;
          }

          .animate-shimmer {
            animation: shimmer 3s linear infinite;
          }

          .animate-scroll-bounce {
            animation: scrollBounce 2s ease-in-out infinite;
          }

          .animate-fade-in-delay {
            animation: fadeIn 1s ease-out 1s both;
          }
        `}</style>
      </Head>

      <div
        style={{
          minHeight: '100vh',
          background: DESIGN.colors.bgPrimary,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Navigation Bar */}
        <nav
          className={mounted ? 'animate-fade-in' : ''}
          style={{
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${DESIGN.colors.border}`,
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 400,
              color: DESIGN.colors.primary,
              letterSpacing: '-0.025em',
            }}
          >
            wAI Travel
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {authenticated ? (
              <>
                <span
                  style={{
                    color: DESIGN.colors.textSecondary,
                    fontSize: '0.875rem',
                  }}
                >
                  {userEmail}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'transparent',
                    border: `1px solid ${DESIGN.colors.border}`,
                    borderRadius: DESIGN.radius.md,
                    color: DESIGN.colors.textSecondary,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: `all ${DESIGN.transitions.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = DESIGN.colors.primary;
                    e.currentTarget.style.color = DESIGN.colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = DESIGN.colors.border;
                    e.currentTarget.style.color = DESIGN.colors.textSecondary;
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowLoginModal(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: DESIGN.colors.textSecondary,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: `all ${DESIGN.transitions.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = DESIGN.colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = DESIGN.colors.textSecondary;
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowSignupModal(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: DESIGN.gradients.primary,
                    border: 'none',
                    borderRadius: DESIGN.radius.md,
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: `all ${DESIGN.transitions.fast}`,
                    boxShadow: DESIGN.shadows.sm,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = DESIGN.shadows.md;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = DESIGN.shadows.sm;
                  }}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <section
          ref={heroRef}
          style={{
            position: 'relative',
            padding: '8rem 2rem',
            textAlign: 'center',
            background: `linear-gradient(180deg, ${DESIGN.colors.bgCard} 0%, ${DESIGN.colors.bgPrimary} 100%)`,
            overflow: 'hidden',
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Animated background */}
          {mounted && <AnimatedGlobe scrollProgress={scrollProgress} />}
          {mounted && <FloatingParticles />}

          <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
            <h1
              className={mounted ? 'animate-fade-in-up' : ''}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                fontWeight: 400,
                lineHeight: 1.1,
                color: DESIGN.colors.textPrimary,
                marginBottom: '1.5rem',
                letterSpacing: '-0.025em',
              }}
            >
              Plan Your Perfect
              <br />
              <span
                className={mounted ? 'animate-shimmer' : ''}
                style={{
                  color: DESIGN.colors.primary,
                  background: `linear-gradient(135deg, ${DESIGN.colors.primary} 0%, #4A90D9 50%, ${DESIGN.colors.primary} 100%)`,
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Multi-City Adventure
              </span>
            </h1>
            <p
              className={mounted ? 'animate-fade-in-up-delay-1' : ''}
              style={{
                fontSize: '1.25rem',
                color: DESIGN.colors.textSecondary,
                lineHeight: 1.6,
                marginBottom: '2.5rem',
                maxWidth: '600px',
                margin: '0 auto 2.5rem',
              }}
            >
              Create personalized travel itineraries with AI. Add multiple destinations,
              see real routes on an interactive map, and get smart recommendations
              for your journey.
            </p>
            <button
              onClick={handleStartPlanning}
              className={mounted ? 'animate-fade-in-up-delay-2' : ''}
              style={{
                padding: '1.25rem 3rem',
                background: DESIGN.gradients.primary,
                color: 'white',
                border: 'none',
                borderRadius: DESIGN.radius.lg,
                fontSize: '1.125rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: `all ${DESIGN.transitions.normal}`,
                boxShadow: '0 4px 20px rgba(30, 58, 95, 0.3)',
                letterSpacing: '0.025em',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(30, 58, 95, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(30, 58, 95, 0.3)';
              }}
            >
              Start Planning Your Trip
            </button>

            {/* Scroll indicator */}
            <div
              className={mounted ? 'animate-fade-in-delay' : ''}
              style={{
                position: 'absolute',
                bottom: '-4rem',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '40px',
                  border: `2px solid ${DESIGN.colors.border}`,
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'center',
                  paddingTop: '8px',
                }}
              >
                <div
                  className="animate-scroll-bounce"
                  style={{
                    width: '4px',
                    height: '8px',
                    backgroundColor: DESIGN.colors.primary,
                    borderRadius: '2px',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          style={{
            padding: '6rem 2rem',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.5rem',
              fontWeight: 400,
              color: DESIGN.colors.textPrimary,
              textAlign: 'center',
              marginBottom: '4rem',
            }}
          >
            How It Works
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
            }}
          >
            {[
              {
                step: '01',
                title: 'Add Your Destinations',
                description:
                  'Search and add cities to your trip. Drag to reorder, set how many nights at each stop.',
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={DESIGN.colors.primary} strokeWidth="1.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Choose Transport Modes',
                description:
                  'Select how you want to travel between cities - train, bus, car, or flight with real route visualization.',
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={DESIGN.colors.primary} strokeWidth="1.5">
                    <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4z" />
                    <circle cx="7.5" cy="15.5" r="1.5" />
                    <circle cx="16.5" cy="15.5" r="1.5" />
                    <path d="M6 10h5V6H6v4zM13 10h5V6h-5v4z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Generate Your Itinerary',
                description:
                  'Get an AI-powered day-by-day itinerary with activities, restaurants, and local tips.',
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={DESIGN.colors.primary} strokeWidth="1.5">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                    <path d="M9 12h6M9 16h6" />
                  </svg>
                ),
              },
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '2.5rem',
                  backgroundColor: DESIGN.colors.bgCard,
                  borderRadius: DESIGN.radius.xl,
                  border: `1px solid ${DESIGN.colors.border}`,
                  transition: `all 0.4s cubic-bezier(0.4, 0, 0.2, 1)`,
                  cursor: 'default',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(30, 58, 95, 0.15)';
                  e.currentTarget.style.borderColor = DESIGN.colors.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = DESIGN.colors.border;
                }}
              >
                {/* Background number */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-10px',
                    fontSize: '120px',
                    fontWeight: 700,
                    color: DESIGN.colors.bgSecondary,
                    lineHeight: 1,
                    userSelect: 'none',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {item.step}
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: DESIGN.radius.lg,
                      background: `linear-gradient(135deg, ${DESIGN.colors.bgSecondary} 0%, ${DESIGN.colors.bgPrimary} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1.5rem',
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    {item.icon}
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: DESIGN.colors.primary,
                      marginBottom: '0.75rem',
                      padding: '4px 12px',
                      backgroundColor: 'rgba(30, 58, 95, 0.08)',
                      borderRadius: DESIGN.radius.full,
                    }}
                  >
                    STEP {item.step}
                  </span>
                  <h3
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 500,
                      color: DESIGN.colors.textPrimary,
                      marginBottom: '0.75rem',
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '1rem',
                      color: DESIGN.colors.textSecondary,
                      lineHeight: 1.6,
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section
          style={{
            padding: '6rem 2rem',
            backgroundColor: DESIGN.colors.bgCard,
            borderTop: `1px solid ${DESIGN.colors.border}`,
            borderBottom: `1px solid ${DESIGN.colors.border}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative elements */}
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '5%',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(30, 58, 95, 0.03) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '10%',
              right: '5%',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.03) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.5rem',
                fontWeight: 400,
                color: DESIGN.colors.textPrimary,
                textAlign: 'center',
                marginBottom: '4rem',
              }}
            >
              Everything You Need
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {[
                { title: 'Interactive Map', description: 'See your entire route with real driving paths and flight arcs.', icon: '&#x1F5FA;' },
                { title: 'Smart Recommendations', description: 'AI suggests the best transport mode based on distance and region.', icon: '&#x1F9E0;' },
                { title: 'Drag & Drop', description: 'Easily reorder your destinations to optimize your route.', icon: '&#x2728;' },
                { title: 'Real Travel Times', description: 'Get actual driving times from Mapbox for accurate planning.', icon: '&#x23F1;' },
                { title: 'Flexible Stays', description: 'Set custom nights at each destination to match your pace.', icon: '&#x1F3E8;' },
                { title: 'Multi-City Trips', description: 'Plan complex itineraries with as many stops as you need.', icon: '&#x1F30D;' },
              ].map((feature, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1.75rem',
                    backgroundColor: DESIGN.colors.bgPrimary,
                    borderRadius: DESIGN.radius.lg,
                    border: `1px solid ${DESIGN.colors.border}`,
                    transition: 'all 0.3s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = DESIGN.shadows.md;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{ fontSize: '2rem', marginBottom: '1rem' }}
                    dangerouslySetInnerHTML={{ __html: feature.icon }}
                  />
                  <h3
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 500,
                      color: DESIGN.colors.textPrimary,
                      marginBottom: '0.5rem',
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.9375rem',
                      color: DESIGN.colors.textSecondary,
                      lineHeight: 1.5,
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          style={{
            padding: '8rem 2rem',
            textAlign: 'center',
            position: 'relative',
            background: `linear-gradient(180deg, ${DESIGN.colors.bgPrimary} 0%, ${DESIGN.colors.bgCard} 100%)`,
          }}
        >
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.5rem',
                fontWeight: 400,
                color: DESIGN.colors.textPrimary,
                marginBottom: '1rem',
              }}
            >
              Ready to Plan Your Trip?
            </h2>
            <p
              style={{
                fontSize: '1.125rem',
                color: DESIGN.colors.textSecondary,
                marginBottom: '2.5rem',
              }}
            >
              Start adding destinations and let AI help you create the perfect itinerary.
            </p>
            <button
              onClick={handleStartPlanning}
              style={{
                padding: '1.25rem 3rem',
                background: DESIGN.gradients.primary,
                color: 'white',
                border: 'none',
                borderRadius: DESIGN.radius.lg,
                fontSize: '1.125rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: `all ${DESIGN.transitions.normal}`,
                boxShadow: '0 4px 20px rgba(30, 58, 95, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(30, 58, 95, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(30, 58, 95, 0.3)';
              }}
            >
              Get Started Free
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            padding: '2rem',
            textAlign: 'center',
            borderTop: `1px solid ${DESIGN.colors.border}`,
            backgroundColor: DESIGN.colors.bgCard,
          }}
        >
          <p
            style={{
              fontSize: '0.875rem',
              color: DESIGN.colors.textMuted,
            }}
          >
            wAI Travel - AI-Powered Trip Planning
          </p>
        </footer>

        {/* Login Modal */}
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onSwitchToSignup={() => {
              setShowLoginModal(false);
              setShowSignupModal(true);
            }}
            onSuccess={handleAuthSuccess}
          />
        )}

        {/* Signup Modal */}
        {showSignupModal && (
          <SignupModal
            onClose={() => setShowSignupModal(false)}
            onSwitchToLogin={() => {
              setShowSignupModal(false);
              setShowLoginModal(true);
            }}
            onSuccess={handleAuthSuccess}
          />
        )}
      </div>
    </>
  );
}
