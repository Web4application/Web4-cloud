import { InferenceClient } from 'https://esm.sh/@huggingface/inference';

// Access the token from Hugging Face Spaces secrets
const HF_TOKEN = window.huggingface?.variables?.HF_TOKEN;
// Or if you're running locally, you can set it as an environment variable
// const HF_TOKEN = process.env.HF_TOKEN;

document.getElementById('file').onchange = async (e) => {
    if (!e.target.files[0]) return;
    
    const file = e.target.files[0];
    
    show(document.getElementById('loading'));
    hide(document.getElementById('results'), document.getElementById('error'));
    
    try {
        const transcript = await transcribe(file);
        const summary = await summarize(transcript);

        document.getElementById('transcript').textContent = transcript;
        document.getElementById('summary').textContent = summary;
        
        hide(document.getElementById('loading'));
        show(document.getElementById('results'));
    } catch (error) {
        hide(document.getElementById('loading'));
        showError(`Error: ${error.message}`);
    }
};
