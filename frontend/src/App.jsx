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
      // If the AI used the Edit Tool, update multiple fields at once (NEW FIX)
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
        <h2 style={{marginTop: 0}}>Interaction Details</h2>
        <p style={{color: '#d9534f', fontSize: '13px', fontWeight: 'bold'}}>
          🔒 Strict Mode: Manual entry is disabled. Use the AI to populate this form.
        </p>

        <div className="form-group"><label>HCP Name</label><input type="text" value={formData.hcpName} disabled /></div>
        <div style={{display: 'flex', gap: '10px'}}>
          <div className="form-group" style={{flex: 1}}><label>Date</label><input type="text" value={formData.interactionDate} disabled /></div>
          <div className="form-group" style={{flex: 1}}><label>Time</label><input type="text" value={formData.interactionTime} disabled /></div>
        </div>
        <div className="form-group"><label>Type of Interaction</label><input type="text" value={formData.interactionType} disabled /></div>
        <div className="form-group"><label>Sentiment</label><input type="text" value={formData.sentiment} disabled /></div>
        <div className="form-group"><label>Topics Discussed</label><textarea rows="2" value={formData.topicsDiscussed} disabled /></div>
        <div className="form-group"><label>Materials Shared</label><textarea rows="2" value={formData.materialsShared} disabled /></div>
        <div className="form-group"><label>Follow-up Actions</label><textarea rows="2" value={formData.followUpActions} disabled /></div>
      </div>

      {/* RIGHT PANEL: The AI Chat */}
      <div className="right-panel">
        <h2 style={{marginTop: 0}}>AIVOA Chat Assistant</h2>
        <div className="chat-history">
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
            placeholder="Type your meeting notes here..." 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading}>Send</button>
        </div>
      </div>

    </div>
  );
}

export default App;