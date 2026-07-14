import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setFormData, updateField } from './store/formSlice';
import axios from 'axios';
import './App.css';

// This dictionary translates Python's snake_case variables to React's camelCase variables
const fieldMapping = {
  hcp_name: 'hcpName', interaction_date: 'interactionDate', interaction_time: 'interactionTime',
  interaction_type: 'interactionType', attendees: 'attendees', topics_discussed: 'topicsDiscussed',
  materials_shared: 'materialsShared', sentiment: 'sentiment', outcomes: 'outcomes', follow_up_actions: 'followUpActions'
};

function App() {
  const formData = useSelector((state) => state.form);
  const dispatch = useDispatch();

  const [messages, setMessages] = useState([{ sender: 'ai', text: 'Hello! I am your AI CRM Assistant. I am connected to your database. How can I help you log a meeting today?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      // Send message to our Python FastAPI server
      const response = await axios.post('http://127.0.0.1:8000/api/chat', { message: userText });
      const { reply, action, action_data } = response.data;

      setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);

      // If the AI used the Log Tool, update the whole form
      if (action === 'LOG_INTERACTION' && action_data) {
        const mappedData = {};
        for (const key in action_data) {
          if (fieldMapping[key] && action_data[key] !== null) {
            mappedData[fieldMapping[key]] = action_data[key];
          }
        }
        dispatch(setFormData(mappedData));
      } 
      // If the AI used the Edit Tool, update multiple fields at once
      else if (action === 'EDIT_INTERACTION' && action_data) {
        for (const pyField in action_data) {
          const reactField = fieldMapping[pyField];
          if (reactField) {
            dispatch(updateField({ field: reactField, value: action_data[pyField] }));
          }
        }
      }
    } catch (error) {
      setMessages((prev) => [...prev, { sender: 'ai', text: 'Backend Error. Is FastAPI running on port 8000?' }]);
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      
      {/* LEFT PANEL: The CRM Form (Read Only) */}
      <div className="left-panel">
        <h2 style={{marginTop: 0, fontSize: '18px', color: '#1f2937'}}>Interaction Details</h2>
        <p style={{color: '#d9534f', fontSize: '12px', fontWeight: 'bold', marginBottom: '20px'}}>
          🔒 Strict Mode: Manual entry is disabled. Use the AI to populate this form.
        </p>

        {/* Row 1: HCP Name & Interaction Type */}
        <div className="form-row">
          <div className="form-group half-width">
            <label>HCP Name</label>
            <input type="text" value={formData.hcpName || ''} disabled placeholder="Search or select HCP..." />
          </div>
          <div className="form-group half-width">
            <label>Interaction Type</label>
            <select value={formData.interactionType || ''} disabled>
              <option value="">Meeting</option>
              <option value="Meeting">Meeting</option>
              <option value="Call">Call</option>
              <option value="Email">Email</option>
            </select>
          </div>
        </div>

        {/* Row 2: Date & Time */}
        <div className="form-row">
          <div className="form-group half-width">
            <label>Date</label>
            <input type="text" value={formData.interactionDate || ''} disabled placeholder="DD-MM-YYYY" />
          </div>
          <div className="form-group half-width">
            <label>Time</label>
            <input type="text" value={formData.interactionTime || ''} disabled placeholder="HH:MM" />
          </div>
        </div>

        {/* Attendees */}
        <div className="form-group">
          <label>Attendees</label>
          <input type="text" value={formData.attendees || ''} disabled placeholder="Enter names or search..." />
        </div>

        {/* Topics Discussed & Voice Note Button */}
        <div className="form-group">
          <label>Topics Discussed</label>
          <textarea rows="3" value={formData.topicsDiscussed || ''} disabled placeholder="Enter key discussion points..."></textarea>
        </div>
        <button className="voice-note-btn" disabled>
          ✨ Summarize from Voice Note (Requires Consent)
        </button>

        {/* Materials Box */}
        <div className="materials-box">
          <div className="form-group">
            <label>Materials Shared</label>
            <div style={{display: 'flex', gap: '10px'}}>
              <input type="text" value={formData.materialsShared || ''} disabled placeholder="No materials added." />
              <button className="dummy-btn" disabled>🔍 Search/Add</button>
            </div>
          </div>
          <div className="form-group" style={{marginBottom: 0}}>
            <label>Samples Distributed</label>
            <div style={{display: 'flex', gap: '10px'}}>
              <input type="text" disabled placeholder="No samples added." />
              <button className="dummy-btn" disabled>📦 Add Sample</button>
            </div>
          </div>
        </div>

        {/* Sentiment Radio Buttons */}
        <div className="form-group">
          <label>Observed/Inferred HCP Sentiment</label>
          <div className="sentiment-radio-group">
            <label><input type="radio" checked={formData.sentiment === 'Positive'} disabled /> 😊 Positive</label>
            <label><input type="radio" checked={formData.sentiment === 'Neutral'} disabled /> 😐 Neutral</label>
            <label><input type="radio" checked={formData.sentiment === 'Negative'} disabled /> ☹️ Negative</label>
          </div>
        </div>

        {/* Outcomes */}
        <div className="form-group">
          <label>Outcomes</label>
          <textarea rows="2" value={formData.outcomes || ''} disabled placeholder="Key outcomes or agreements..."></textarea>
        </div>

        {/* Follow-up Actions */}
        <div className="form-group">
          <label>Follow-up Actions</label>
          <textarea rows="2" value={formData.followUpActions || ''} disabled placeholder="Enter next steps or tasks..."></textarea>
        </div>

        {/* AI Suggestions */}
        <div className="ai-suggestions">
          <p><strong>AI Suggested Follow-ups:</strong></p>
          <ul>
            <li>+ Schedule follow-up meeting in 2 weeks</li>
            <li>+ Send OncoBoost Phase III PDF</li>
            <li>+ Add Dr. Sharma to advisory board invite list</li>
          </ul>
        </div>
      </div>

      {/* RIGHT PANEL: The AI Chat */}
      <div className="right-panel">
        <div className="chat-header-container">
          <h2 className="chat-title">🌐 AI Assistant</h2>
          <span className="chat-subtitle">Log interaction via chat</span>
        </div>
        
        <div className="chat-history">
          <div className="message msg-ai" style={{backgroundColor: '#fff', border: '1px solid #e0e0e0'}}>
            Log interaction details here (e.g., "Met Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochure") or ask for help.
          </div>
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender === 'user' ? 'msg-user' : 'msg-ai'}`}>
              {msg.text}
            </div>
          ))}
          {loading && <div className="message msg-ai"><em>AI is thinking...</em></div>}
        </div>
        
        <div className="chat-input">
          <input 
            type="text" 
            placeholder="Describe interaction..." 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={loading}
          />
          <button className="log-btn" onClick={sendMessage} disabled={loading}>
            <span>⏏ Log</span>
          </button>
        </div>
      </div>

    </div>
  );
}

export default App;