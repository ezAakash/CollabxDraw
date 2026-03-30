import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FeatureCard from '../components/FeatureCard';
import './LandingPage.css';

const features = [
  {
    icon: '🎨',
    title: 'Shape Tools',
    description:
      'Draw rectangles, ellipses, diamonds, lines, and arrows with precise control.',
  },
  {
    icon: '✏️',
    title: 'Freehand Drawing',
    description:
      'Sketch freely with the pencil tool. Smooth curves rendered in real-time.',
  },
  {
    icon: '🌐',
    title: 'Real-time Collaboration',
    description:
      'Draw together with your team. See changes as they happen via WebSocket.',
  },
  {
    icon: '♾️',
    title: 'Infinite Canvas',
    description:
      'Pan and zoom endlessly. Your canvas has no boundaries.',
  },
  {
    icon: '⌨️',
    title: 'Keyboard Shortcuts',
    description:
      'Switch tools instantly with single-key shortcuts. Work at the speed of thought.',
  },
  {
    icon: '🔒',
    title: 'Private Rooms',
    description:
      'Create rooms with unique slugs. Share the link to collaborate.',
  },
];

export default function LandingPage() {
  return (
    <div className="landing" id="landing-page">
      <Navbar />

      {/* Hero */}
      <section className="hero" id="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            Collaborative Whiteboard
          </div>
          <h1 className="hero-title">
            Draw.
            <span className="hero-accent"> Collaborate.</span>
            <br />
            Create.
          </h1>
          <p className="hero-subtitle">
            A real-time collaborative whiteboard where your ideas come to life.
            Draw shapes, sketch freely, and build together — all in your browser.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary btn-lg" id="hero-cta">
              Get Started Free
              <span className="btn-arrow">→</span>
            </Link>
            <Link to="/login" className="btn btn-glass btn-lg" id="hero-signin">
              Sign In
            </Link>
          </div>
        </div>

        {/* Canvas preview mockup */}
        <div className="hero-preview">
          <div className="preview-window">
            <div className="preview-toolbar">
              <div className="preview-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="preview-canvas">
              <svg viewBox="0 0 400 250" className="preview-svg">
                {/* Animated shapes */}
                <rect
                  x="40"
                  y="30"
                  width="100"
                  height="70"
                  rx="4"
                  fill="none"
                  stroke="#6c5ce7"
                  strokeWidth="2"
                  className="preview-shape shape-1"
                />
                <ellipse
                  cx="260"
                  cy="65"
                  rx="55"
                  ry="40"
                  fill="none"
                  stroke="#ff6b6b"
                  strokeWidth="2"
                  className="preview-shape shape-2"
                />
                <line
                  x1="140"
                  y1="65"
                  x2="205"
                  y2="65"
                  stroke="#51cf66"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                  className="preview-shape shape-3"
                />
                <polygon
                  points="180,140 220,170 180,200 140,170"
                  fill="none"
                  stroke="#feca57"
                  strokeWidth="2"
                  className="preview-shape shape-4"
                />
                <path
                  d="M 40,180 Q 80,140 120,180 T 200,180"
                  fill="none"
                  stroke="#cc5de8"
                  strokeWidth="2"
                  className="preview-shape shape-5"
                />
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="10"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#51cf66" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features-section">
        <h2 className="features-heading">Everything you need to create</h2>
        <p className="features-subheading">
          Powerful tools packed into a lightweight, real-time drawing experience.
        </p>
        <div className="features-grid">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" id="cta-section">
        <div className="cta-card">
          <h2 className="cta-title">Ready to start drawing?</h2>
          <p className="cta-subtitle">
            Create your free account and start collaborating in seconds.
          </p>
          <Link to="/signup" className="btn btn-primary btn-lg">
            Create Free Account
            <span className="btn-arrow">→</span>
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <p>CollabxDraw — Built with ♥</p>
      </footer>
    </div>
  );
}
