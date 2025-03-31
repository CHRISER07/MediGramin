import os
from aixplain.factories import ModelFactory
from flask import Flask, request, jsonify
from flask_cors import CORS

# Set API Key
os.environ["AIXPLAIN_API_KEY"] = "7f200134925288f6f3ba560917037a160fad4b6ead9c250b225b924a724d6eed"

# Initialize Flask App
app = Flask(__name__)
CORS(app)

# Load the Aixplain model (use the correct model ID)
MODEL_ID = "6759db476eb56303857a07c1"
try:
    model = ModelFactory.get(MODEL_ID)
except Exception as e:
    print(f"Error loading model: {e}")
    model = None  # Set model to None if loading fails

def classify_query(user_message):
    """Classify query strictly as 'Medical' or 'Non-Medical'."""
    if not model:
        return False  # Default to Non-Medical if model is not loaded

    result = model.run({
        "text": f"Classify this query strictly as 'Medical' or 'Non-Medical'. Reply with ONLY 'Medical' or 'Non-Medical'. Query: {user_message}"
    })

    # First try to get from data field
    response_text = result.get("data", "")
    # If empty, try text field as backup
    if not response_text:
        response_text = result.get("text", "")
    
    response_text = str(response_text).strip()
    print(f"Model classification response: '{response_text}'")
    
    is_medical = "medical" in response_text.lower()
    print(f"Classified as medical: {is_medical}")
    
    return is_medical

def get_ai_response(user_message, language="English"):
    """Fetch AI-generated response from Aixplain API with proper formatting in specified language."""
    if not model:
        return "Error: AI model not available."

    # Add language instruction to the prompt
    language_instruction = ""
    if language.lower() != "english":
        language_instruction = f"Respond in {language}. "

    prompt = f"{language_instruction}{user_message} Provide the response in a numbered list with 5 clear and short points. Ensure each point appears on a new line."
    print(f"Prompt to model: {prompt}")

    result = model.run({
        "text": prompt
    })

    # First try to get from data field
    response_text = result.get("data", "")
    # If empty, try text field as backup
    if not response_text:
        response_text = result.get("text", "")
    
    return response_text or "Sorry, I couldn't process your request."

@app.route("/chat", methods=["POST"])
def chatbot_reply():
    """Receive message from frontend and return AI response."""
    data = request.json
    user_message = data.get("message", "")
    language = data.get("language", "English")

    if classify_query(user_message):
        bot_reply = get_ai_response(user_message, language)
    else:
        # Optionally translate this message too based on language
        if language.lower() != "english":
            bot_reply = get_ai_response(f"Translate to {language}: This bot only provides medical information. Please ask health-related questions.")
        else:
            bot_reply = "This bot only provides medical information. Please ask health-related questions."

    return jsonify({"reply": bot_reply})

if __name__ == "__main__":
    app.run(debug=True)                 