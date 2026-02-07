import { useEffect, useState } from "react";

type Options = {
  upper: boolean;
  lower: boolean;
  numbers: boolean;
  symbols: boolean;
};

type HistoryItem = {
  _id: string;
  password: string;
  strength: string;
  responseTime: number;
  length: number;
  options: Options;
  createdAt: string;
};

type Stats = {
  totalGenerated: number;
  generatedToday: number;
  generatedThisWeek: number;
  averageLength: number;
  averageResponseTime: number;
  strengthDistribution: Array<{ _id: string; count: number }>;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [length, setLength] = useState<number>(12);
  const [options, setOptions] = useState<Options>({
    upper: true,
    lower: true,
    numbers: true,
    symbols: false
  });
  const [password, setPassword] = useState<string>("");
  const [strength, setStrength] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Generate password from backend API
  const generatePassword = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/passwords/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          length,
          options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate password');
      }

      const result = await response.json();
      
      if (result.success) {
        setPassword(result.data.password);
        setStrength(result.data.strength);
        
        // Refresh history and stats
        await Promise.all([fetchHistory(), fetchStats()]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate password';
      setError(errorMessage);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch history from backend
  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/passwords/history?limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const result = await response.json();
      
      if (result.success) {
        setHistory(result.data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  // Fetch statistics from backend
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/passwords/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Clear history from backend
  const clearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all history?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/passwords/history`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear history');
      }

      const result = await response.json();
      
      if (result.success) {
        setHistory([]);
        await fetchStats();
      }
    } catch (err) {
      console.error('Error clearing history:', err);
      alert('Failed to clear history');
    }
  };

  // Delete individual password
  const deletePassword = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/passwords/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete password');
      }

      // Refresh history and stats
      await Promise.all([fetchHistory(), fetchStats()]);
    } catch (err) {
      console.error('Error deleting password:', err);
      alert('Failed to delete password');
    }
  };

  // Initial load
  useEffect(() => {
    generatePassword();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-regenerate when options or length change
  const handleOptionsChange = async (key: keyof Options) => {
    const newOptions = { ...options, [key]: !options[key] };
    setOptions(newOptions);
  };

  const handleLengthChange = (newLength: number) => {
    setLength(newLength);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const toggleHistory = () => {
    if (!showHistory) {
      fetchHistory();
    }
    setShowHistory(!showHistory);
  };

  return (
    <div className="app-wrapper">
      <div className="container">
        <h1>🔐 Password Generator</h1>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <div className="password-display">
          <input 
            className="password" 
            value={password} 
            readOnly 
            placeholder={loading ? "Generating..." : "Your password will appear here"}
          />
          <button 
            className="copy-btn" 
            onClick={() => copyToClipboard(password)}
            disabled={!password || loading}
          >
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
        </div>

        {strength && (
          <p className={`strength ${strength.toLowerCase()}`}>
            Strength: {strength}
          </p>
        )}

        {stats && (
          <div className="stats-card">
            <h3>📊 Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Generated</span>
                <span className="stat-value">{stats.totalGenerated}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Today</span>
                <span className="stat-value">{stats.generatedToday}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">This Week</span>
                <span className="stat-value">{stats.generatedThisWeek}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Avg Length</span>
                <span className="stat-value">{stats.averageLength.toFixed(1)}</span>
              </div>
            </div>
            
            {stats.strengthDistribution.length > 0 && (
              <div className="strength-distribution">
                <h4>Strength Distribution</h4>
                <div className="strength-bars">
                  {stats.strengthDistribution.map((item) => (
                    <div key={item._id} className="strength-bar-item">
                      <span className={`strength-label ${item._id.toLowerCase()}`}>
                        {item._id}
                      </span>
                      <div className="strength-bar-container">
                        <div 
                          className={`strength-bar ${item._id.toLowerCase()}`}
                          style={{ 
                            width: `${(item.count / stats.totalGenerated) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="strength-count">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <label className="length-label">
          Length: {length}
          <input
            type="number"
            min={4}
            max={64}
            value={length}
            onChange={e => handleLengthChange(Number(e.target.value))}
            disabled={loading}
          />
        </label>

        <div className="options-grid">
          {Object.keys(options).map(key => (
            <label key={key} className="checkbox-label">
              <input
                type="checkbox"
                checked={options[key as keyof Options]}
                onChange={() => handleOptionsChange(key as keyof Options)}
                disabled={loading}
              />
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </label>
          ))}
        </div>
        
        <button 
          className="regenerate-btn" 
          onClick={generatePassword}
          disabled={loading}
        >
          {loading ? "🔄 Generating..." : "🔄 Regenerate Password"}
        </button>

        <button 
          className="history-toggle" 
          onClick={toggleHistory}
          disabled={loading}
        >
          {showHistory ? "📦 Hide History" : "📜 Show History"} ({history.length})
        </button>
      </div>

      {showHistory && (
        <div className="history-panel">
          <div className="history-header">
            <h2>Password History</h2>
            <button className="clear-btn" onClick={clearHistory}>
              🗑️ Clear All
            </button>
          </div>
          
          {history.length === 0 ? (
            <p className="no-history">No passwords generated yet</p>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div key={item._id} className="history-item">
                  <div className="history-main">
                    <span className="history-password">{item.password}</span>
                    <div className="history-actions">
                      <button 
                        className="history-copy" 
                        onClick={() => copyToClipboard(item.password)}
                        title="Copy password"
                      >
                        📋
                      </button>
                      <button 
                        className="history-delete" 
                        onClick={() => deletePassword(item._id)}
                        title="Delete password"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="history-meta">
                    <span className={`history-strength ${item.strength.toLowerCase()}`}>
                      {item.strength}
                    </span>
                    <span className="history-time">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                    <span className="history-response">
                      ⚡ {item.responseTime.toFixed(2)}ms
                    </span>
                    <span className="history-length">
                      📏 {item.length} chars
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}