# AIVOA CRM: AI-First HCP Module

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Redux](https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)

## 📌 Project Overview
This project is a technical implementation of an AI-first Customer Relationship Management (CRM) module designed for Life Science sales representatives. 

Following the strict requirements of the technical assignment, this application features a split-screen interface where manual data entry is completely disabled. The left panel houses a read-only "Interaction Details" form, which is exclusively populated and modified by a LangGraph-powered AI assistant interacting with the user via a chat interface on the right panel.

## ✅ Assignment Requirement Checklist
- [x] **Split-Screen Layout:** Exact replica of the required interface.
- [x] **Zero Manual Entry:** Form inputs are locked (`disabled`); AI controls all state.
- [x] **Frontend:** React + Redux Toolkit.
- [x] **Backend:** Python + FastAPI.
- [x] **AI Framework:** LangGraph agent workflow implemented.
- [x] **LLM:** Groq utilized (`llama-3.3-70b-versatile` as authorized).
- [x] **Database:** MySQL integration for custom tools.
- [x] **Font:** Google Inter utilized globally.
- [x] **5 Tools Built:** 2 Mandatory (Log, Edit) + 3 Custom DB tools.

---

## ✨ Features
* **Conversational Data Entry:** Transform natural language meeting notes into structured JSON data.
* **Granular State Editing:** Instruct the AI to fix specific form fields without losing the rest of the interaction context.
* **Context-Aware Database Lookups:** Chat with your CRM to pull doctor specialties, product battlecards, and historical meeting data on the fly.
* **Real-time Redux Sync:** The React UI updates instantly as the backend AI triggers tool calls.

---

## 🏗️ System Architecture

```text
+-----------------------+           +------------------------+
|    React Frontend     |           |    FastAPI Backend     |
|                       |           |                        |
|  +-----------------+  |   JSON    |  +------------------+  |
|  |  Redux Store    |  | <=======> |  |  POST /api/chat  |  |
|  | (Form State)    |  |  (Axios)  |  +---------+--------+  |
|  +-----------------+  |           |            |           |
|  +-----------------+  |           |  +---------v--------+  |
|  |   Chat Panel    |  |           |  | LangGraph Agent  |  |
|  +-----------------+  |           |  +---------+--------+  |
+-----------------------+           +------------|-----------+
                                                 |
                                       +---------+---------+
                                       |                   |
                               +-------v------+     +------v------+
                               |  Groq API    |     |  MySQL DB   |
                               | (Llama 3.3)  |     | (Localhost) |
                               +--------------+     +-------------+
```

### Application Workflow
1. User types a natural language message in the React right-panel chat.
2. Axios sends a POST request with the message to the FastAPI `/api/chat` endpoint.
3. LangGraph ingests the message, combines it with the system prompt, and passes it to the Groq LLM.
4. Groq determines if it needs to talk to the user OR trigger a tool. 
5. If a tool is triggered, the backend executes the Python function (fetching DB data or structuring form updates).
6. FastAPI intercepts the final tool payload and sends a structured JSON response back to React.
7. Redux catches the payload and visually updates the locked left-panel form instantly.

---

## 🗂️ Project Structure
```text
aivoa_crm/
├── backend/
│   ├── .env                 # API keys & DB credentials (git-ignored)
│   ├── agent.py             # LangGraph state, tools, and node compilation
│   ├── main.py              # FastAPI server and endpoint routing
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # React UI panels (LeftForm, RightChat)
│   │   ├── store/           # Redux slices and store configuration
│   │   ├── App.jsx          # Main split-screen layout
│   │   ├── App.css          # Styling & Google Inter font injection
│   │   └── main.jsx         # React DOM entry
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite bundler config
├── .gitignore               # Security exclusions
└── README.md                # Project documentation
```

---

## 🚀 Technology Stack
* **Frontend:** React.js (Vite), Redux Toolkit (State Management), Axios, CSS (Strictly utilizing the Google Inter Font)
* **Backend:** Python, FastAPI, Uvicorn
* **AI & Agent Framework:** LangChain, LangGraph
* **LLM:** Groq (`llama-3.3-70b-versatile` utilized as an authorized alternative context model)
* **Database:** MySQL

---

## 🧠 LangGraph Architecture & Tools
The core logic of this application is driven by a LangGraph `StateGraph`, which acts as the decision-making brain. Hard-coded logic was strictly avoided in favor of LLM tool-calling. The agent evaluates the user's natural language input and selects from **5 predefined tools**:

### 🛠️ Tool Summary Table

| Tool Name | Type | Description | Database Dependency |
| :--- | :--- | :--- | :--- |
| `log_interaction` | Mandatory | Extracts entities to auto-fill the entire CRM form. | None |
| `edit_interaction`| Mandatory | Targets and updates specific fields based on user corrections. | None |
| `get_hcp_profile` | Custom | Fetches specialty and tier status of a Healthcare Professional. | `doctors` table |
| `get_product_battlecard`| Custom | Fetches key benefits and side effects of a medical product. | `products` table |
| `get_past_interactions`| Custom | Checks for historical meeting records with a specific doctor. | `interactions` table |

### Mandatory Tools Deep Dive
1. **`log_interaction`:** Extracts entities (HCP Name, Date, Time, Topics, Sentiment, Materials, etc.) from natural language and outputs a structured dictionary. The React frontend intercepts this action and dispatches the data to the Redux store to auto-fill the form.
2. **`edit_interaction`:** Listens for user corrections (e.g., "Change the sentiment to negative and materials to none"). It targets specific fields within the Redux state and updates them seamlessly without overwriting previously logged data.

### Custom Tools Deep Dive
3. **`get_hcp_profile`:** Queries the MySQL `doctors` table to fetch the specialty and tier status of a specific HCP to help the rep prepare for a meeting.
4. **`get_product_battlecard`:** Queries the MySQL `products` table to fetch the key benefits and side effects of a specific medical product.
5. **`get_past_interactions`:** Queries the MySQL `interactions` table to retrieve historical meeting data, allowing the rep to check prior outcomes before a new engagement.

---

## 💬 Prompt Examples
To test the full capability of the LangGraph agent, try typing these exact prompts into the chat interface:
* **Logging:** *"I met with Dr. Smith today to discuss Respira. He was in a Positive mood and I shared 2 brochures."*
* **Editing:** *"Oops, I made a mistake. Change the sentiment to Negative and materials to None."*
* **Querying:** *"What is Dr. Smith's profile?"*
* **Querying:** *"What are the side effects of Respira?"*
* **Querying:** *"Have I had any past interactions with Dr. Sarah?"*

---

## ⚙️ Configuration & Environment Variables
The backend requires a `.env` file in the `backend/` directory to authenticate with Groq and access the local database. 

```env
# backend/.env
GROQ_API_KEY=your_groq_api_key_here
```
*Note: The MySQL credentials (username: `root`, password: `mysql123`) are currently hardcoded in the `get_db_connection()` helper inside `agent.py` for ease of local testing. Update these to match your local machine if necessary.*

---

## 💻 Step-by-Step Local Setup Guide

To run this application locally, ensure you have **Node.js**, **Python 3.8+**, and a local **MySQL Server** installed on your machine.

### Step 1: Database Configuration & Schema
You must configure the database before starting the backend server so the custom tools can successfully query the data.

1. Open your MySQL command line or a GUI tool like MySQL Workbench.
2. Run the following SQL commands to create the database, tables, and insert the necessary dummy data:

```sql
CREATE DATABASE aivoa_crm_db;
USE aivoa_crm_db;

CREATE TABLE doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    specialty VARCHAR(255),
    tier VARCHAR(50)
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    key_benefit TEXT,
    side_effects TEXT
);

CREATE TABLE interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hcp_name VARCHAR(255),
    interaction_date VARCHAR(50),
    topics_discussed TEXT
);

-- Insert dummy data to test the LangGraph tools
INSERT INTO doctors (name, specialty, tier) VALUES ('Dr. Smith', 'Cardiologist', 'Tier 1');
INSERT INTO doctors (name, specialty, tier) VALUES ('Dr. Sarah', 'Neurologist', 'Tier 2');
INSERT INTO products (name, key_benefit, side_effects) VALUES ('Respira', 'Clears airways in 5 minutes', 'Dry mouth');
```

### Step 2: Backend Setup (FastAPI & LangGraph)
Open your command prompt or terminal, navigate to the root folder of this project, and follow these exact steps:

**1. Navigate to the backend directory:**
```bash
cd backend
```

**2. Create and activate a virtual environment:**
* **Windows:**
  ```bash
  python -m venv venv
  venv\Scripts\activate
  ```
* **Mac/Linux:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

**3. Install all required Python packages:**
```bash
pip install fastapi uvicorn pydantic langchain langchain-groq langgraph pymysql python-dotenv
```

**4. Start the FastAPI Server:**
```bash
uvicorn main:app --reload
```
The backend is now successfully running and listening on `http://127.0.0.1:8000`.

### Step 3: Frontend Setup (React & Vite)
Open a **new, separate terminal** window, navigate to the root folder of the project, and follow these steps:

**1. Navigate to the frontend directory:**
```bash
cd frontend
```

**2. Install Node.js dependencies:**
```bash
npm install
```

**3. Start the Vite Development Server:**
```bash
npm run dev
```

### Step 4: Access and Test the Application
Once both servers are running:
1. Open your web browser and navigate to **`http://localhost:5173/`**.
2. Utilize the right-side chat panel to interact with the database and fill out the left-side form.

---

## 🔌 API Endpoints
### `POST /api/chat`
The single entry point for all frontend-to-backend communication.
* **Payload:** `{"message": "string"}`
* **Response:** ```json
  {
    "reply": "Conversational response from the LLM",
    "action": "LOG_INTERACTION" | "EDIT_INTERACTION" | null,
    "action_data": { "field_name": "extracted_value" }
  }
  ```
  *The React frontend checks the `action` key. If present, it dispatches the `action_data` dictionary to the Redux store.*

---

## 🛡️ Error Handling
* **Database Errors:** SQL `try/catch` blocks prevent the FastAPI server from crashing if a table is missing. The AI gracefully informs the user via chat that the DB lookup failed.
* **Tool Misuse:** The System Prompt strictly enforces that the LLM must utilize the invisible tool-calling backend instead of outputting raw JSON into the conversational chat window.
* **UI State Preservation:** Redux selectively merges edits to prevent data wiping when executing the `edit_interaction` tool.

---

## 📈 Challenges Faced & Learning Outcomes
* **LangGraph LLM Adherence:** Early iterations resulted in the Groq model "thinking out loud" or outputting raw function strings instead of triggering native tool calls. This was resolved by tightly refining the LangChain `SystemMessage` prompt and properly shaping the `action_data` dictionary in `main.py` for React ingestion.
* **State Management Security:** Ensuring the left form remained completely immutable to physical keystrokes while maintaining reactivity to Redux dispatches required careful configuration of controlled components in React.

## 🔮 Future Improvements
If this module were deployed to production, the following enhancements would be added:
* **PostgreSQL / SQLAlchemy:** Migrating from raw PyMySQL queries to a robust ORM.
* **Persistent Chat Memory:** Storing LangGraph state histories in a Redis cache or Postgres database to maintain conversation history across page reloads.
* **Auth & Multi-Tenancy:** Adding JWT authentication so reps can only log/query interactions tied to their specific user ID.

---

## 🌐 Browser Support
Tested and fully supported on:
* Google Chrome (Latest)
* Mozilla Firefox (Latest)
* Microsoft Edge (Latest)

## ✍️ Author
**Harish Nerella**
* For questions, feedback, or collaboration, feel free to contact me at nerellaharish122@gmail.com
