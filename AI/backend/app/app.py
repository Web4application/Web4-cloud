from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Get the OpenAI API key
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY is missing from the environment variables")

@app.route('/generate_react', methods=['POST'])
def generate_react():
    data = request.json.get('data')
    
    if not data:
        return jsonify({"error": "Data is required"}), 400

    # Initialize the OpenAI GPT-4 model
    llm = ChatOpenAI(api_key=openai_api_key, model_name="gpt-4")

    # Create the prompt template
    prompt_template = PromptTemplate(
        input_variables=["file_data"],
        template="""
You are an AI assistant that helps developers build UI components.

Given the following data:

{file_data}

Generate a React component to display the data in a user-friendly table with sorting and filtering capabilities.

Provide only the code for the component, and ensure that it is optimized for performance.
"""
    )

    # Chain the LLM with the prompt template
    chain = LLMChain(llm=llm, prompt=prompt_template)

    # Generate the response using the model
    try:
        response = chain.run(file_data=data)
        return jsonify({"generated_code": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def index():
    return jsonify({"message": "Web4AI is running successfully!"})

if __name__ == "__main__":
    app.run()
