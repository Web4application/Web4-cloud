import gradio as gr
from huggingface_hub import InferenceClient

def process_meeting_audio(audio_file):
    """Process uploaded audio file and return transcript + summary"""
    if audio_file is None:
        return "Please upload an audio file.", ""
    
    # We'll implement the AI logic next
    return "Transcript will appear here...", "Summary will appear here..."

# Create the Gradio interface
app = gr.Interface(
    fn=process_meeting_audio,
    inputs=gr.Audio(label="Upload Meeting Audio", type="filepath"),
    outputs=[
        gr.Textbox(label="Transcript", lines=10),
        gr.Textbox(label="Summary & Action Items", lines=8)
    ],
    title="🎤 AI Meeting Notes",
    description="Upload an audio file to get an instant transcript and summary with action items."
)

if __name__ == "__main__":
    app.launch()
