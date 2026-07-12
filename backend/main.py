from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
import ast

# Import your LangGraph AI Brain from agent.py
from agent import ai_agent

app = FastAPI(title="AIVOA CRM AI Backend")

# Add CORS so React can talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    # In a real app, this would be your React URL. "*" means allow all.
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the format of the incoming message


class ChatRequest(BaseModel):
    message: str

# Create the Doorway (Endpoint) for the chat


@app.post("/api/chat")
def chat_endpoint(request: ChatRequest):
    try:
        # 1. Send the user's message to the LangGraph AI
        initial_state = {"messages": [HumanMessage(content=request.message)]}
        result = ai_agent.invoke(initial_state)

        # 2. Extract the final text answer from the AI
        final_message = result["messages"][-1].content

        # 3. Check if the AI used any of our mandatory form tools (Log or Edit)
        action = None
        action_data = {}  # Empty dictionary to collect multiple updates

        for msg in result["messages"]:
            # Check if the AI decided to call a tool (this catches multiple edits at once)
            if hasattr(msg, 'tool_calls') and msg.tool_calls:
                for tc in msg.tool_calls:
                    if tc["name"] == "log_interaction":
                        action = "LOG_INTERACTION"
                        action_data = tc["args"]

                    elif tc["name"] == "edit_interaction":
                        action = "EDIT_INTERACTION"
                        # FIX: Extract the values and reshape the dictionary for React!
                        field = tc["args"].get("field_to_update")
                        val = tc["args"].get("new_value")
                        if field and val:
                            action_data[field] = val

        # 4. Send everything back to the frontend
        return {
            "reply": final_message,
            "action": action,
            # Return action_data if action exists, else None
            "action_data": action_data if action else None
        }

    except Exception as e:
        return {"reply": f"Sorry, I encountered an error: {str(e)}", "action": None, "action_data": None}
