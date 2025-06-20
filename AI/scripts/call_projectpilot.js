async function submitTranscript() {
  const transcript = document.getElementById('transcript').value;
  const resultBox = document.getElementById('result');
  
  const response = await fetch("http://localhost:8000/api/analyze-transcript/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ transcript })
  });

  const result = await response.json();
  resultBox.textContent = JSON.stringify(result, null, 2);
}
