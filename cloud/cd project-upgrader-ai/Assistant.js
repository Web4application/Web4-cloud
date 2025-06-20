let projectFiles = [];
let isOnlineAI = true;  // Flag to toggle between online/offline AI

// Handle file input and load files into projectFiles
document.getElementById('fileInput').addEventListener('change', (e) => {
  const files = e.target.files;
  for (const file of files) {
    const reader = new FileReader();
    reader.onload = (e) => {
      projectFiles.push({
        name: file.name,
        code: e.target.result
      });
      displayOutput();
    };
    reader.readAsText(file);
  }
});

// Function to trigger refactoring of code using either online or offline AI
async function runAIRefactor() {
  for (let i = 0; i < projectFiles.length; i++) {
    try {
      const refactored = isOnlineAI ? 
        await realAIRefactor(projectFiles[i].code) : 
        await localAIRefactor(projectFiles[i].code);
        
      projectFiles[i].code = refactored;
      projectFiles[i].status = 'refactored';

      // Optional: Add more processing like complexity analysis, documentation, etc.
      await additionalProcessing(projectFiles[i]);

    } catch (error) {
      console.error(`Error refactoring file ${projectFiles[i].name}:`, error);
    }
  }
  displayOutput();
}

// Function for refactoring using OpenAI's GPT model (online)
async function realAIRefactor(code) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY', // Use environment variables to store keys securely
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a senior developer.' },
          { role: 'user', content: 'Refactor and optimize this code:\\n\\n' + code }
        ]
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error during OpenAI request:', error);
    throw new Error('Failed to get refactored code from OpenAI');
  }
}

// Function for local AI refactoring (offline using WebLLM)
async function localAIRefactor(code) {
  try {
    const chat = await webllm.createChat();
    await chat.reload("Llama-3-8B-Instruct"); // Load Llama model
    const reply = await chat.generate("Refactor and optimize this code:\n" + code);
    return reply;
  } catch (error) {
    console.error('Error during local AI refactoring:', error);
    throw new Error('Failed to get refactored code from local AI');
  }
}

// Optional: Additional processing functions like complexity analysis, documentation generation, etc.
async function additionalProcessing(file) {
  // Example: Generate documentation for refactored code
  const doc = await generateDocumentation(file.code);
  console.log(`Generated documentation for ${file.name}:`, doc);
  
  // Example: Generate unit tests for refactored code
  const tests = await generateUnitTests(file.code);
  console.log(`Generated unit tests for ${file.name}:`, tests);

  // Update file status to reflect additional processing
  file.status = 'refactored and documented';
}

// Function to display the output of the current project files
function displayOutput() {
  const output = document.getElementById('output');
  output.textContent = projectFiles.map(f => `// ${f.name}\n${f.code}\n`).join('\n\n');
}

// Function to download the refactored project as a ZIP file
function downloadProject() {
  const zip = new JSZip();
  projectFiles.forEach(file => {
    zip.file(file.name, file.code);
  });
  zip.generateAsync({ type: "blob" }).then(content => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = "refactored_project.zip";
    a.click();
  });
}

// Function to save the project files locally using localForage
function saveToLocal() {
  localforage.setItem('my_project_files', projectFiles).then(() => {
    alert('Saved locally!');
  }).catch(err => {
    console.error("Error saving to local storage:", err);
  });
}

// Function to load the project files from local storage
function loadFromLocalStorage() {
  localforage.getItem('my_project_files').then(data => {
    if (data) {
      projectFiles = data;
      displayOutput();
    } else {
      alert('No saved project found.');
    }
  }).catch(err => {
    console.error("Error loading from local storage:", err);
  });
}

// Function to generate documentation for code using AI
async function generateDocumentation(code) {
  const docPrompt = `Generate documentation for the following code:\n\n${code}`;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY', // Use environment variables to store keys securely
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert software documentation generator.' },
        { role: 'user', content: docPrompt }
      ]
    })
  });
  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// Function to generate unit tests for code
async function generateUnitTests(code) {
  const testPrompt = `Generate unit tests for the following code using the appropriate testing framework (e.g., Jest, Mocha):\n\n${code}`;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY', // Use environment variables to store keys securely
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a test generation AI.' },
        { role: 'user', content: testPrompt }
      ]
    })
  });
  const data = await response.json();
  return data.choices[0].message.content.trim();
}
