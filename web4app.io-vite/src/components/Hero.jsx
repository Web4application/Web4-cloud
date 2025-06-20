
export default function Hero() {
  return (
    <section className="hero" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <h1 style={{
        fontSize: '3rem',
        background: 'linear-gradient(90deg, #00ffe1, #61dafb)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Where AI Meets the Future of the Web
      </h1>
      <p style={{ color: '#bbb', maxWidth: '700px', margin: '1rem auto' }}>
        Empowering decentralized intelligence for the Web4 generation.
      </p>
      <a href="#launch" style={{
        display: 'inline-block',
        background: '#61dafb',
        color: '#000',
        padding: '0.75rem 2rem',
        borderRadius: '30px',
        fontWeight: 'bold'
      }}>
        Launch Web4App
      </a>
    </section>
  );
}
