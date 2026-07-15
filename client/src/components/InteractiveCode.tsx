import { motion } from 'framer-motion';

export default function InteractiveCode() {
  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        background: 'var(--bg)', 
        position: 'relative', 
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1200px'
      }}
    >
      <div style={{ position: 'absolute', top: 48, left: 48, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
        WORKSPACE PREVIEW
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        whileHover={{ scale: 1.05, rotateZ: 2 }}
        style={{ 
          width: '80%', 
          maxWidth: 600, 
          position: 'relative',
          zIndex: 10,
          cursor: 'pointer'
        }}
      >
        <motion.img 
          src="/login.webp" 
          alt="Preview"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ 
            width: '100%', 
            height: 'auto', 
            borderRadius: '16px',
            boxShadow: '0 30px 60px -15px rgba(0,0,0,0.6), 0 0 60px rgba(30, 58, 138, 0.2)',
            border: '1px solid rgba(255,255,255,0.1)',
            objectFit: 'cover'
          }}
        />
        
        {/* Glow under the image */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ 
            position: 'absolute',
            bottom: -20,
            left: '10%',
            width: '80%', 
            height: 20, 
            background: 'var(--accent)', 
            filter: 'blur(30px)', 
            zIndex: -1
          }} 
        />
      </motion.div>
      
      {/* Grid Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, var(--bg) 100%)', pointerEvents: 'none' }} />
    </div>
  );
}
