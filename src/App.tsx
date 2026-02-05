import { useEffect, useState } from "react";

type Options = {
  upper: boolean;
  lower: boolean;
  numbers: boolean;
  symbols: boolean;
};

type HistoryItem = {
  id: string;
  password: string;
  strength: string;
  timestamp: string;
  responseTime: number;
};

const CHARSETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}<>?"
};

const evaluateStrength = (pw: string, poolSize: number) => {
  const entropy = pw.length * Math.log2(poolSize);

  if (entropy < 40) return "Weak";
  else if (entropy < 60) return "Medium";
  else return "Strong";
};

const generatePasswordFromOptions = (length: number, options: Options) => {
  const startTime = performance.now();
  
  let pool = "";

  if (options.upper) pool += CHARSETS.upper;
  if (options.lower) pool += CHARSETS.lower;
  if (options.numbers) pool += CHARSETS.numbers;
  if (options.symbols) pool += CHARSETS.symbols;

  if (!pool) {
    return { password: "", strength: "", responseTime: 0 };
  }

  let result = "";
  for (let i = 0; i < length; i++) {
    result += pool[Math.floor(Math.random() * pool.length)];
  }

  const endTime = performance.now();
  const responseTime = endTime - startTime;

  return {
    password: result,
    strength: evaluateStrength(result, pool.length),
    responseTime
  };
};

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

  // Generate initial password on mount
  useEffect(() => {
    const { password: pwd, strength: str, responseTime } = generatePasswordFromOptions(length, options);
    setPassword(pwd);
    setStrength(str);
    
    // Add to history
    addToHistory(pwd, str, responseTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const addToHistory = (pwd: string, str: string, responseTime: number) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      password: pwd,
      strength: str,
      timestamp: new Date().toLocaleTimeString(),
      responseTime: Math.round(responseTime * 100) / 100
    };
    
    setHistory(prev => [newItem, ...prev].slice(0, 20)); // Keep last 20 items
  };

  const generatePassword = () => {
    const { password: pwd, strength: str, responseTime } = generatePasswordFromOptions(length, options);
    setPassword(pwd);
    setStrength(str);
    addToHistory(pwd, str, responseTime);
  };

  const toggleOption = (key: keyof Options) => {
    const newOptions = { ...options, [key]: !options[key] };
    setOptions(newOptions);
    
    // Generate new password with updated options
    const { password: pwd, strength: str, responseTime } = generatePasswordFromOptions(length, newOptions);
    setPassword(pwd);
    setStrength(str);
    addToHistory(pwd, str, responseTime);
  };

  const handleLengthChange = (newLength: number) => {
    setLength(newLength);
    
    // Generate new password with updated length
    const { password: pwd, strength: str, responseTime } = generatePasswordFromOptions(newLength, options);
    setPassword(pwd);
    setStrength(str);
    addToHistory(pwd, str, responseTime);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="app-wrapper">
      <div className="container">
        <h1>🔐 Password Generator</h1>

        <div className="password-display">
          <input className="password" value={password} readOnly />
          <button className="copy-btn" onClick={() => copyToClipboard(password)}>
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
        </div>

        <p className={`strength ${strength.toLowerCase()}`}>
          Strength: {strength}
        </p>

        <label className="length-label">
          Length: {length}
          <input
            type="number"
            min={4}
            max={64}
            value={length}
            onChange={e => handleLengthChange(Number(e.target.value))}
          />
        </label>

        <div className="options-grid">
          {Object.keys(options).map(key => (
            <label key={key} className="checkbox-label">
              <input
                type="checkbox"
                checked={options[key as keyof Options]}
                onChange={() => toggleOption(key as keyof Options)}
              />
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </label>
          ))}
        </div>
        
        <button className="regenerate-btn" onClick={generatePassword}>
          🔄 Regenerate Password
        </button>

        <button className="history-toggle" onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? "📦 Hide History" : "📜 Show History"} ({history.length})
        </button>
      </div>

      {showHistory && (
        <div className="history-panel">
          <div className="history-header">
            <h2>Password History</h2>
            <button className="clear-btn" onClick={clearHistory}>Clear All</button>
          </div>
          
          {history.length === 0 ? (
            <p className="no-history">No passwords generated yet</p>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-main">
                    <span className="history-password">{item.password}</span>
                    <button 
                      className="history-copy" 
                      onClick={() => copyToClipboard(item.password)}
                      title="Copy password"
                    >
                      📋
                    </button>
                  </div>
                  <div className="history-meta">
                    <span className={`history-strength ${item.strength.toLowerCase()}`}>
                      {item.strength}
                    </span>
                    <span className="history-time">{item.timestamp}</span>
                    <span className="history-response">
                      ⚡ {item.responseTime}ms
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