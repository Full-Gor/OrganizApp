import React, { useState } from 'react';

const DashboardUI = () => {
  const [hoveredButton, setHoveredButton] = useState(null);
  const [activeButton, setActiveButton] = useState(null);
  const [hoveredNavItem, setHoveredNavItem] = useState(null);

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
      padding: '40px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },

    card: {
      width: '900px',
      background: 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
      borderRadius: '32px',
      padding: '32px 40px',
      boxShadow: `
        0 25px 50px -12px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        inset 0 -1px 0 rgba(0, 0, 0, 0.1)
      `,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      position: 'relative',
      overflow: 'hidden',
    },

    cardInnerGlow: {
      position: 'absolute',
      top: '-50%',
      left: '-50%',
      width: '200%',
      height: '200%',
      background: 'radial-gradient(circle at 30% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
      pointerEvents: 'none',
    },

    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px',
      position: 'relative',
      zIndex: 1,
    },

    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#ffffff',
      letterSpacing: '-0.5px',
      textShadow: '0 2px 10px rgba(0,0,0,0.3)',
    },

    nav: {
      display: 'flex',
      alignItems: 'center',
      gap: '32px',
    },

    navItem: (isHovered) => ({
      fontSize: '14px',
      fontWeight: '500',
      color: isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textShadow: isHovered ? '0 0 20px rgba(255,255,255,0.5)' : 'none',
      transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
    }),

    searchIcon: {
      width: '20px',
      height: '20px',
      color: 'rgba(255, 255, 255, 0.7)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },

    buttonsRow: {
      display: 'flex',
      gap: '16px',
      marginBottom: '32px',
      position: 'relative',
      zIndex: 1,
    },

    actionButton: (gradient, isHovered, isActive) => ({
      padding: '14px 32px',
      borderRadius: '50px',
      border: 'none',
      background: gradient,
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: isActive
        ? `inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)`
        : isHovered
        ? `0 10px 40px -10px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)`
        : `0 4px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.1)`,
      transform: isActive
        ? 'translateY(2px) scale(0.98)'
        : isHovered
        ? 'translateY(-3px) scale(1.02)'
        : 'translateY(0) scale(1)',
      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
      letterSpacing: '0.5px',
      position: 'relative',
      overflow: 'hidden',
    }),

    buttonShine: {
      position: 'absolute',
      top: '0',
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      transition: 'left 0.5s ease',
    },

    statsContainer: {
      display: 'flex',
      gap: '24px',
      position: 'relative',
      zIndex: 1,
    },

    statCard: (isHovered) => ({
      flex: 1,
      background: 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)',
      borderRadius: '24px',
      padding: '24px 28px',
      boxShadow: isHovered
        ? `
          0 20px 40px -15px rgba(0, 0, 0, 0.3),
          0 0 0 1px rgba(255, 255, 255, 0.8),
          inset 0 2px 0 rgba(255, 255, 255, 1),
          inset 0 -2px 4px rgba(0, 0, 0, 0.05)
        `
        : `
          0 10px 30px -10px rgba(0, 0, 0, 0.2),
          0 0 0 1px rgba(255, 255, 255, 0.5),
          inset 0 2px 0 rgba(255, 255, 255, 0.8),
          inset 0 -2px 4px rgba(0, 0, 0, 0.03)
        `,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
      cursor: 'pointer',
    }),

    statHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },

    statTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1a1a2e',
      letterSpacing: '-0.3px',
    },

    statValue: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1a1a2e',
    },

    progressBarContainer: {
      height: '8px',
      background: 'rgba(0, 0, 0, 0.08)',
      borderRadius: '4px',
      marginBottom: '20px',
      overflow: 'hidden',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
    },

    progressBar: (gradient, width) => ({
      height: '100%',
      width: width,
      background: gradient,
      borderRadius: '4px',
      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    }),

    statLabels: {
      display: 'flex',
      justifyContent: 'space-between',
    },

    labelColumn: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },

    label: {
      fontSize: '13px',
      color: '#64748b',
      fontWeight: '500',
    },

    colorDot: (color) => ({
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: color,
      marginRight: '8px',
      boxShadow: `0 0 6px ${color}40`,
    }),
  };

  // Button configurations
  const buttons = [
    { id: 'rush', label: 'Rush', gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
    { id: 'projects', label: 'Projets', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)' },
    { id: 'workflow', label: 'Workflow', gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
    { id: 'stats', label: 'Stats', gradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)' },
  ];

  const navItems = ['Home', 'Projets', 'Rush', 'Settings'];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Inner glow effect */}
        <div style={styles.cardInnerGlow} />

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Dashboard</h1>
          <nav style={styles.nav}>
            {navItems.map((item, index) => (
              <span
                key={item}
                style={styles.navItem(hoveredNavItem === index)}
                onMouseEnter={() => setHoveredNavItem(index)}
                onMouseLeave={() => setHoveredNavItem(null)}
              >
                {item}
              </span>
            ))}
            <svg
              style={styles.searchIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </nav>
        </div>

        {/* Action Buttons */}
        <div style={styles.buttonsRow}>
          {buttons.map((btn) => (
            <button
              key={btn.id}
              style={styles.actionButton(
                btn.gradient,
                hoveredButton === btn.id,
                activeButton === btn.id
              )}
              onMouseEnter={() => setHoveredButton(btn.id)}
              onMouseLeave={() => setHoveredButton(null)}
              onMouseDown={() => setActiveButton(btn.id)}
              onMouseUp={() => setActiveButton(null)}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div style={styles.statsContainer}>
          {/* Left Card - Rush Progress */}
          <StatCard
            title="Rush Actifs"
            value="150%"
            progress="100%"
            progressGradient="linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)"
            leftLabels={[
              { color: '#3b82f6', text: 'En cours' },
              { color: '#8b5cf6', text: 'En pause' },
            ]}
            rightLabels={[
              { color: '#22c55e', text: 'Termines' },
              { color: '#f59e0b', text: 'A venir' },
            ]}
            styles={styles}
          />

          {/* Right Card - Projects Progress */}
          <StatCard
            title="Progression"
            value="120%"
            progress="85%"
            progressGradient="linear-gradient(90deg, #ec4899 0%, #f97316 50%, #eab308 100%)"
            leftLabels={[
              { color: '#ec4899', text: 'Taches' },
              { color: '#f97316', text: 'Sessions' },
            ]}
            rightLabels={[
              { color: '#22c55e', text: 'Objectifs' },
              { color: '#6366f1', text: 'Bonus' },
            ]}
            styles={styles}
          />
        </div>
      </div>
    </div>
  );
};

// StatCard Component
const StatCard = ({ title, value, progress, progressGradient, leftLabels, rightLabels, styles }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={styles.statCard(isHovered)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.statHeader}>
        <span style={styles.statTitle}>{title}</span>
        <span style={styles.statValue}>{value}</span>
      </div>

      <div style={styles.progressBarContainer}>
        <div style={styles.progressBar(progressGradient, progress)} />
      </div>

      <div style={styles.statLabels}>
        <div style={styles.labelColumn}>
          {leftLabels.map((label, index) => (
            <span key={index} style={styles.label}>
              <span style={styles.colorDot(label.color)} />
              {label.text}
            </span>
          ))}
        </div>
        <div style={styles.labelColumn}>
          {rightLabels.map((label, index) => (
            <span key={index} style={styles.label}>
              <span style={styles.colorDot(label.color)} />
              {label.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardUI;
