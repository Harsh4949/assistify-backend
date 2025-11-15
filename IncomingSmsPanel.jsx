import { useState } from 'react';
import { fetchIncomingSms as fetchinsms } from '../client';  // Assuming apiClient or similar exported from your client.js
import axios from 'axios';
export default function IncomingSmsPanel() {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchIncomingSms = async () => {
    if (!sessionId) {
      setError('Please enter a valid session ID.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/v1/incoming-sms', { params: { sessionId } });
      setMessages(response.data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch incoming SMS');
      setMessages([]);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Incoming SMS Messages</h2>

      <input
        type="text"
        placeholder="Enter Session ID"
        value={sessionId}
        onChange={(e) => setSessionId(e.target.value)}
        className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <button
        onClick={fetchIncomingSms}
        disabled={loading}
        className="mb-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-60"
      >
        {loading ? 'Loading...' : 'Fetch Incoming SMS'}
      </button>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700">
          Error: {error}
        </div>
      )}

      {messages.length === 0 && !loading ? (
        <div className="text-gray-500">No incoming messages found.</div>
      ) : (
        <ul className="max-h-96 overflow-y-auto divide-y divide-gray-200 border border-gray-100 rounded-md">
          {messages.map((msg) => (
            <li key={msg._id} className="p-4">
              <p>
                <span className="font-semibold">From: </span>{msg.from}
              </p>
              <p className="whitespace-pre-wrap">{msg.body}</p>
              <p className="text-sm text-gray-500 mt-1">
                Received At: {new Date(msg.receivedAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}