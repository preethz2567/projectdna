import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function InteractiveMap() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive(prev => !prev);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const nodes = [
    { id: 'client', label: 'Client App', x: 15, y: 20 },
    { id: 'api', label: 'API Gateway', x: 50, y: 35 },
    { id: 'auth', label: 'Auth Service', x: 85, y: 20 },
    { id: 'db', label: 'PostgreSQL', x: 50, y: 75 },
    { id: 'ai', label: 'AI Engine', x: 85, y: 65 },
    { id: 'cache', label: 'Redis Cache', x: 15, y: 65 },
  ];

  const edges = [
    { source: 'client', target: 'api' },
    { source: 'api', target: 'auth' },
    { source: 'api', target: 'db' },
    { source: 'api', target: 'ai' },
    { source: 'api', target: 'cache' },
    { source: 'ai', target: 'db' }
  ];

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        background: '#030712', // Deep navy/black
        position: 'absolute', 
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      <div style={{ position: 'absolute', top: 32, left: 32, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }}>
        ARCHITECTURE MAPPING [IDLE]
      </div>

      <div style={{ width: '100%', height: '100%', position: 'relative', opacity: 0.4 }}>
        {/* SVG Edges */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {edges.map((edge, i) => {
            const sourceNode = nodes.find(n => n.id === edge.source)!;
            const targetNode = nodes.find(n => n.id === edge.target)!;
            return (
              <motion.line
                key={i}
                x1={`${sourceNode.x}%`}
                y1={`${sourceNode.y}%`}
                x2={`${targetNode.x}%`}
                y2={`${targetNode.y}%`}
                stroke="var(--accent)"
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: active ? 1 : 0,
                  opacity: active ? 0.5 : 0
                }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.div
            key={node.id}
            initial={{ y: 0 }}
            animate={{ y: active ? [0, -10, 0] : 0 }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.2 }}
            style={{
              position: 'absolute',
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: 'translate(-50%, -50%)',
              background: 'rgba(15, 23, 42, 0.8)', // Semi-transparent dark slate
              border: `1px solid ${active ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
              padding: '8px 12px',
              borderRadius: 6,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: active ? 'white' : 'rgba(255,255,255,0.5)',
              boxShadow: active ? '0 0 20px rgba(30, 58, 138, 0.3)' : 'none',
              transition: 'all 0.5s ease',
              backdropFilter: 'blur(4px)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: active ? 'var(--accent)' : 'rgba(255,255,255,0.2)' }} />
              {node.label}
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Subtle vignette/grid over the map to ensure the center is dark enough for the card */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, #030712 90%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5, pointerEvents: 'none' }} />
    </div>
  );
}
