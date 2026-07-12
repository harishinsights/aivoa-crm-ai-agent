import os
import pymysql
from pydantic import BaseModel, Field
from typing import Optional
from langchain_core.tools import tool
from dotenv import load_dotenv
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage

# Load the secret API key from our .env file
load_dotenv()

# --- DATABASE CONNECTION HELPER ---


def get_db_connection():
    return pymysql.connect(
        host='localhost',
        user='root',
        password='mysql123',
        database='aivoa_crm_db',
        cursorclass=pymysql.cursors.DictCursor
    )

# --- OUR 3 CUSTOM AI TOOLS ---


@tool
def get_hcp_profile(hcp_name: str) -> str:
    """Use this tool to get the specialty and tier status of a Healthcare Professional (HCP)."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Search the database for the doctor's name
            sql = "SELECT * FROM doctors WHERE name LIKE %s"
            cursor.execute(sql, (f"%{hcp_name}%",))
            result = cursor.fetchone()
        conn.close()

        if result:
            return f"Profile for {result['name']}: Specialty is {result['specialty']}, Status: {result['tier']}."
        return f"No profile found for {hcp_name} in the database."
    except Exception as e:
        return f"Database error: {str(e)}"


@tool
def get_product_battlecard(product_name: str) -> str:
    """Use this tool to get the key benefits and side effects of a medical product."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Search the database for the product's name
            sql = "SELECT * FROM products WHERE name LIKE %s"
            cursor.execute(sql, (f"%{product_name}%",))
            result = cursor.fetchone()
        conn.close()

        if result:
            return f"Product: {result['name']} | Benefit: {result['key_benefit']} | Side Effects: {result['side_effects']}."
        return f"No information found for {product_name}."
    except Exception as e:
        return f"Database error: {str(e)}"


@tool
def get_past_interactions(hcp_name: str) -> str:
    """Use this tool to check if we have any past meetings with this HCP."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Get the most recent interaction for this doctor
            sql = "SELECT interaction_date, topics_discussed FROM interactions WHERE hcp_name LIKE %s ORDER BY interaction_date DESC LIMIT 1"
            cursor.execute(sql, (f"%{hcp_name}%",))
            result = cursor.fetchone()
        conn.close()

        if result:
            return f"Last interaction with {hcp_name} was on {result['interaction_date']}. Topics: {result['topics_discussed']}."
        return f"No past interactions found for {hcp_name}."
    except Exception as e:
        return f"Database error: {str(e)}"

# --- THE 2 MANDATORY AI TOOLS ---


class LogInteractionSchema(BaseModel):
    hcp_name: Optional[str] = Field(
        description="Name of the Healthcare Professional")
    interaction_date: Optional[str] = Field(
        description="Date of the interaction (DD-MM-YYYY)")
    interaction_time: Optional[str] = Field(
        description="Time of the interaction (HH:MM)")
    interaction_type: Optional[str] = Field(
        description="Type of interaction (e.g., Meeting, Email, Call)")
    attendees: Optional[str] = Field(description="Other people present")
    topics_discussed: Optional[str] = Field(
        description="Summary of topics discussed")
    materials_shared: Optional[str] = Field(
        description="Brochures, samples, or materials shared")
    sentiment: Optional[str] = Field(
        description="Observed sentiment: Positive, Neutral, or Negative")
    outcomes: Optional[str] = Field(description="Agreements or outcomes")
    follow_up_actions: Optional[str] = Field(description="Next steps or tasks")


@tool(args_schema=LogInteractionSchema)
def log_interaction(**kwargs) -> dict:
    """Mandatory Tool: Extracts details from natural language to log a new HCP interaction."""
    return {"action": "LOG_INTERACTION", "data": kwargs}


class EditInteractionSchema(BaseModel):
    field_to_update: str = Field(
        description="The exact name of the form field to update (e.g., hcp_name, sentiment, topics_discussed)")
    new_value: str = Field(
        description="The new corrected value for that field")


@tool(args_schema=EditInteractionSchema)
def edit_interaction(field_to_update: str, new_value: str) -> dict:
    """Mandatory Tool: Updates specific fields in the existing form based on user corrections."""
    return {"action": "EDIT_INTERACTION", "data": {field_to_update: new_value}}


# Group all 5 tools together so the AI can use them
crm_tools = [
    get_hcp_profile,
    get_product_battlecard,
    get_past_interactions,
    log_interaction,
    edit_interaction
]

# --- THE LANGGRAPH AI BRAIN ---


class State(TypedDict):
    messages: Annotated[list, add_messages]


llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0)
llm_with_tools = llm.bind_tools(crm_tools)


def chatbot(state: State):
    # FIX: Clear, strict rules to prevent Groq from crashing or printing raw JSON
    system_prompt = SystemMessage(
        content="You are an expert AI CRM Assistant for a Life Science Sales Representative. "
                "CRITICAL INSTRUCTIONS: "
                "1. You MUST use your tools to log data, edit data, or fetch information. Do not just pretend to do it in text. "
                "2. When calling a tool, output ONLY the native tool call. NEVER add conversational filler before using a tool. "
                "3. Speak to the user in natural conversational English ONLY AFTER a tool has successfully returned data. "
                "4. NEVER output raw JSON, dictionaries, or XML tags like <function> directly into the chat response."
    )
    messages_to_process = [system_prompt] + state["messages"]
    response = llm_with_tools.invoke(messages_to_process)
    return {"messages": [response]}


graph_builder = StateGraph(State)
graph_builder.add_node("chatbot", chatbot)
graph_builder.add_node("tools", ToolNode(tools=crm_tools))
graph_builder.add_edge(START, "chatbot")
graph_builder.add_conditional_edges("chatbot", tools_condition)
graph_builder.add_edge("tools", "chatbot")
ai_agent = graph_builder.compile()
