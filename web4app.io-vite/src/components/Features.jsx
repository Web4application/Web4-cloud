
export default function Features() {
  return (
    <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h2>What Web4App Offers</h2>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '2rem',
        marginTop: '2rem'
      }}>
        {[
          ['AI-Driven Engines', 'Deploy LLM-powered bots and autonomous agents with ease.'],
          ['Web3 Integration', 'Built for Fadaka, NFTs, DAOs, and data sovereignty.'],
          ['Lightning Deployment', 'Run anywhere: Fly.io, Docker, Railway, or your own node.']
        ].map(([title, desc], i) => (
          <div key={i} style={{
            background: '#1c1c1c',
            padding: '2rem',
            borderRadius: '10px',
            maxWidth: '300px'
          }}>
            <h3>{title}</h3>
            <p>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
