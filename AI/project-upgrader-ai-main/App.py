from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

# Load environment variables from a .env file
load_dotenv()

# Get the OpenAI API key from environment variables
openai_api_key = os.getenv("OPENAI_API_KEY")  # Ensure the .env file has OPENAI_API_KEY=<your_key>

app = Flask(__name__)

@app.route('/generate_react', methods=['POST'])
def generate_react():
    data = request.json['data']  # Get the data to be passed into the prompt

    # Initialize OpenAI GPT-4 model
    llm = ChatOpenAI(api_key=openai_api_key, model_name="gpt-4")  # Corrected API key argument

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
    response = chain.run(file_data=data)

    # Return the generated code
    return jsonify({"generated_code": response})

if __name__ == '__main__':
    app.run(debug=True)
