from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import os

openai_api_key = os.getenv("OPENAI_API_KEY")

def generate_react_code(data):
    llm = ChatOpenAI(openai_api_key=openai_api_key, model_name="gpt-4")

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

    chain = LLMChain(llm=llm, prompt=prompt_template)
    response = chain.run(file_data=data)
    return response
