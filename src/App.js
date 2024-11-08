import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  const [featureFlags, setFeatureFlags] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newFeatureFlag, setNewFeatureFlag] = useState({
    code: '',
    name: '',
    description: '',
    active: true,
    type: 'boolean',
    percentage: 0,
    conditions: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [evaluateModal, setEvaluateModal] = useState({ show: false, flagCode: null, parameters: [] });
  const [isEditing, setIsEditing] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, flagCode: null });
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    fetchFeatureFlags();
  }, []);

  const fetchFeatureFlags = async () => {
    try {
      const response = await axios.get('http://localhost:8080/feature-flags');
      setFeatureFlags(response.data);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      alert('Error fetching feature flags');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewFeatureFlag(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleConditionChange = (index, e) => {
    const { name, value } = e.target;
    setNewFeatureFlag(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [name]: value } : condition
      )
    }));
  };

  const addCondition = () => {
    setNewFeatureFlag(prev => ({
      ...prev,
      conditions: [...prev.conditions, { key: '', value: '', operation: 'equals' }]
    }));
  };

  const removeCondition = (index) => {
    setNewFeatureFlag(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const flagToSubmit = { ...newFeatureFlag };

    if (flagToSubmit.type === 'boolean') {
      delete flagToSubmit.percentage;
      flagToSubmit.conditions = [];
    } else if (flagToSubmit.type === 'percentage') {
      flagToSubmit.percentage = parseFloat(flagToSubmit.percentage);
      delete flagToSubmit.conditions;
    } else if (flagToSubmit.type === 'conditions') {
      delete flagToSubmit.percentage;
    }

    try {
      if (isEditing) {
        await axios.put(`http://localhost:8080/feature-flags/${flagToSubmit.code}`, flagToSubmit, {
          headers: { 'Content-Type': 'application/json' }
        });
        toast.success('Feature flag updated successfully!', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        await axios.post('http://localhost:8080/feature-flags', flagToSubmit, {
          headers: { 'Content-Type': 'application/json' }
        });
        toast.success('Feature flag created successfully!', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
      setShowForm(false);
      resetForm();
      fetchFeatureFlags();
    } catch (error) {
      console.error('Error creating/updating feature flag:', error);
      toast.error('Error creating/updating feature flag: ' + error.response?.data?.error || error.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleToggleStatus = async (code, currentStatus) => {
    try {
      await axios.patch(`http://localhost:8080/feature-flags/${code}/status`, {
        active: !currentStatus
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      fetchFeatureFlags();
    } catch (error) {
      console.error('Error toggling feature flag status:', error);
      alert('Error toggling feature flag status');
    }
  };

  const handleEvaluate = (code, type) => {
    if (type === 'conditions') {
      setEvaluateModal({ show: true, flagCode: code, parameters: [{ key: '', value: '' }] });
    } else {
      evaluateFlag(code, {});
    }
  };

  const evaluateFlag = async (code, parameters) => {
    try {
      const response = await axios.post(`http://localhost:8080/feature-flags/${code}/evaluate`, 
        { parameters },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const result = response.data.result;
      if (result === true || result === false) {
        toast[result ? 'success' : 'error'](`Result of the evaluation: ${result}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        toast.info(`Result of the evaluation: ${JSON.stringify(result)}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error('Error evaluating feature flag:', error);
      toast.error('Error evaluating feature flag: ' + error.response?.data?.error || error.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const filteredFlags = featureFlags.filter(flag =>
    flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flag.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const closeForm = () => {
    const form = document.querySelector('form');
    form.classList.remove('fade-in');
    form.classList.add('fade-out');
    setTimeout(() => {
      setShowForm(false);
      resetForm(); // Resetear el formulario al cerrar
    }, 500);
  };

  const showFormWithAnimation = () => {
    resetForm(); // Resetear el formulario antes de mostrar
    setShowForm(true);
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.classList.add('fade-in');
      }
    }, 10);
  };

  const resetForm = () => {
    setNewFeatureFlag({
      code: '',
      name: '',
      description: '',
      active: true,
      type: 'boolean',
      percentage: 0,
      conditions: []
    });
    setIsEditing(false);
  };

  const handleModalParameterChange = (index, field, value) => {
    setEvaluateModal(prev => ({
      ...prev,
      parameters: prev.parameters.map((param, i) => 
        i === index ? { ...param, [field]: value } : param
      )
    }));
  };

  const handleModalAddParameter = () => {
    setEvaluateModal(prev => ({
      ...prev,
      parameters: [...prev.parameters, { key: '', value: '' }]
    }));
  };

  const handleModalRemoveParameter = (index) => {
    setEvaluateModal(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }));
  };

  const handleModalSubmit = () => {
    const parameters = Object.fromEntries(
      evaluateModal.parameters
        .filter(param => param.key && param.value)
        .map(param => [param.key, param.value])
    );
    evaluateFlag(evaluateModal.flagCode, parameters);
    // Eliminamos la línea que cerraba el modal
  };

  const handleModalClose = () => {
    setEvaluateModal({ show: false, flagCode: null, parameters: [] });
  };

  const handleEdit = (flag) => {
    setNewFeatureFlag({
      code: flag.code,
      name: flag.name,
      description: flag.description,
      active: flag.active,
      type: flag.type,
      percentage: flag.percentage || 0,
      conditions: flag.conditions || []
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = (code) => {
    setDeleteModal({ show: true, flagCode: code });
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:8080/feature-flags/${deleteModal.flagCode}`);
      toast.success('Feature flag deleted successfully!', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      fetchFeatureFlags();
      setDeleteModal({ show: false, flagCode: null });
    } catch (error) {
      console.error('Error deleting feature flag:', error);
      toast.error('Error deleting feature flag: ' + error.response?.data?.error || error.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleAIAssistantClick = () => {
    setShowChat(!showChat);
  };

  const handleSendMessage = async (message) => {
    // Añade el mensaje del usuario al chat
    setChatMessages(prevMessages => [...prevMessages, { text: message, sender: 'user' }]);

    try {
      // Llama al endpoint
      const response = await axios.post('http://localhost:8080/feature-flags/assistant', {
        instruction: message
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Añade la respuesta del AI al chat
      setChatMessages(prevMessages => [...prevMessages, { text: response.data.response, sender: 'ai' }]);
    } catch (error) {
      console.error('Error al comunicarse con el asistente:', error);
      
      // Intenta leer el mensaje de error del campo 'response'
      const errorMessage = error.response?.data?.response || "Lo siento, hubo un error al procesar tu solicitud.";
      
      // Añade el mensaje de error al chat
      setChatMessages(prevMessages => [...prevMessages, { text: errorMessage, sender: 'ai' }]);
    }
  };

  return (
    <div className="App">
      <h1>Feature Flags Manager</h1>
      
      {!showForm && (
        <>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search feature flags..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="add-button" onClick={showFormWithAnimation}>Add Feature Flag</button>
          </div>
          <table className="fade-in">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Description</th>
                <th>Type</th>
                <th>Percentage</th>
                <th>Conditions</th>
                <th>Active</th>
                <th>Evaluate</th>
                <th>Edit</th>
                <th>Delete</th> {/* Nueva columna para Delete */}
              </tr>
            </thead>
            <tbody>
              {filteredFlags.map(flag => (
                <tr key={flag.code}>
                  <td>{flag.code}</td>
                  <td>{flag.name}</td>
                  <td>{flag.description}</td>
                  <td>{flag.type}</td>
                  <td>{flag.percentage !== null ? `${flag.percentage}%` : ''}</td>
                  <td>
                    {flag.conditions && flag.conditions.length > 0 ? (
                      <pre className="json-conditions">
                        {JSON.stringify(flag.conditions.map(({ key, value, operation }) => ({ key, value, operation })), null, 2)}
                      </pre>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={flag.active}
                        onChange={() => handleToggleStatus(flag.code, flag.active)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </td>
                  <td>
                    <button onClick={() => handleEvaluate(flag.code, flag.type)} className="evaluate-button">
                      Evaluate
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(flag)} className="edit-button">
                      Edit
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(flag.code)} className="delete-button">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="fade-in">
          <div>
            <label>Name:</label>
            <input type="text" name="name" value={newFeatureFlag.name} onChange={handleChange} required />
          </div>
          <div>
            <label>Description:</label>
            <textarea name="description" value={newFeatureFlag.description} onChange={handleChange} required />
          </div>
          <div className="checkbox-container">
            <label></label>
            <div className="checkbox-wrapper">
              <label className="switch">
                <input 
                  type="checkbox" 
                  name="active" 
                  checked={newFeatureFlag.active} 
                  onChange={handleChange} 
                />
                <span className="slider round"></span>
              </label>
              <span>Active</span>
            </div>
          </div>
          <div>
            <label>Type:</label>
            <select name="type" value={newFeatureFlag.type} onChange={handleChange}>
              <option value="boolean">Boolean</option>
              <option value="percentage">Percentage</option>
              <option value="conditions">Conditions</option>
            </select>
          </div>
          
          {newFeatureFlag.type === 'percentage' && (
            <div>
              <label>Percentage:</label>
              <input type="number" name="percentage" value={newFeatureFlag.percentage} onChange={handleChange} min="0" max="100" required />
            </div>
          )}
          
          {newFeatureFlag.type === 'conditions' && (
            <div>
              <h3>Conditions</h3>
              {newFeatureFlag.conditions.map((condition, index) => (
                <div key={index} className="condition-group">
                  <div className="condition-content">
                    <div>
                      <label>Key:</label>
                      <input type="text" name="key" value={condition.key} onChange={(e) => handleConditionChange(index, e)} required />
                    </div>
                    <div>
                      <label>Operation:</label>
                      <select name="operation" value={condition.operation} onChange={(e) => handleConditionChange(index, e)} required>
                        <option value="equals">Equals</option>
                        <option value="not_equals">Not Equals</option>
                      </select>
                    </div>
                    <div>
                      <label>Value:</label>
                      <input type="text" name="value" value={condition.value} onChange={(e) => handleConditionChange(index, e)} required />
                    </div>
                  </div>
                  <div className="condition-buttons">
                    <button type="button" onClick={() => removeCondition(index)}>Remove</button>
                  </div>
                </div>
              ))}
              <button type="button" className="add-condition" onClick={addCondition}>Add Condition</button>
            </div>
          )}
          
          <button type="submit">{isEditing ? 'Update' : 'Create'} Feature Flag</button>
          <button type="button" onClick={closeForm}>Cancel</button>
        </form>
      )}
      
      {evaluateModal.show && (
        <div className="modal">
          <div className="modal-content">
            <button onClick={handleModalClose} className="modal-close">&times;</button>
            <h2>Feature Flag Evaluator</h2>
            {evaluateModal.parameters.map((param, index) => (
              <div key={index} className="modal-parameter">
                <input
                  type="text"
                  value={param.key}
                  onChange={(e) => handleModalParameterChange(index, 'key', e.target.value)}
                  placeholder="Key"
                />
                <input
                  type="text"
                  value={param.value}
                  onChange={(e) => handleModalParameterChange(index, 'value', e.target.value)}
                  placeholder="Value"
                />
                <button onClick={() => handleModalRemoveParameter(index)} className="modal-button">Delete</button>
              </div>
            ))}
            <div className="modal-buttons">
              <button onClick={handleModalAddParameter} className="modal-button modal-button-add">Add Parameter</button>
              <button onClick={handleModalSubmit} className="modal-button modal-button-primary">Evaluate</button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
      {deleteModal.show && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirm Deletion</h2>
            <p>Are you sure you want to delete this feature flag?</p>
            <div className="modal-buttons">
              <button onClick={confirmDelete} className="modal-button modal-button-primary">Delete</button>
              <button onClick={() => setDeleteModal({ show: false, flagCode: null })} className="modal-button modal-button-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <button className="ai-assistant-button" onClick={handleAIAssistantClick}>
        <span className="ai-icon">🤖</span>
        AI Assistant
      </button>

      {showChat && (
        <Chat messages={chatMessages} onSendMessage={handleSendMessage} />
      )}
    </div>
  );
}

const Chat = ({ messages, onSendMessage }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage('');
      // Resetear la altura del textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (inputMessage === '') {
      adjustTextareaHeight();
    }
  }, [inputMessage]);

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="input-container">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows="1"
          />
          <button type="submit" className="send-button">
            <span className="send-icon">➤</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default App;
