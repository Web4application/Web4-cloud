const response = await fetch('https://web4ai-analyze.up.railway.app/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text })
});
