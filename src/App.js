import React, { useState } from 'react';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';

function App() {
  const [scale, setScale] = useState('C');
  const [type, setType] = useState('major');
  const [tempo, setTempo] = useState(180);
  const [captchaToken, setCaptchaToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!captchaToken) {
      alert('Please complete the CAPTCHA.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        'https://x2rrahzngmlg4hcvyxjzsjhrtq0qcraa.lambda-url.us-west-2.on.aws/',
        JSON.stringify({ scale, type, tempo, captcha: captchaToken }),
        {
          headers: { 'Content-Type': 'application/json' },
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { type: 'audio/midi' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kithara.mid';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to generate song.');
    }

    setIsSubmitting(false);
  };

  return (
    <div style={{ backgroundColor: '#121212', color: '#e0e0e0', minHeight: '100vh', padding: '2em' }}>
      <h1>Kithara – randomly generate the beginning of a song</h1>
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'flex',
          gap: '1em',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '2em'
        }}>
          <label>
            Scale:
            <select value={scale} onChange={(e) => setScale(e.target.value)} style={{ marginLeft: '0.5em' }}>
              {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label>
            Type:
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ marginLeft: '0.5em' }}>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </select>
          </label>

          <label>
            Tempo:
            <select value={tempo} onChange={(e) => setTempo(Number(e.target.value))} style={{ marginLeft: '0.5em' }}>
              {[120, 140, 160, 180, 200, 220, 240].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !captchaToken}
            style={{
              padding: '0.75em 1.5em',
              fontSize: '1.1em',
              fontWeight: 'bold',
              backgroundColor: '#1db954',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: isSubmitting || !captchaToken ? 'not-allowed' : 'pointer',
              opacity: isSubmitting || !captchaToken ? 0.6 : 1,
              transition: 'background-color 0.3s'
            }}
          >
            {isSubmitting ? 'Generating...' : 'Generate'}
          </button>

        </div>

        {!captchaToken && (
          <ReCAPTCHA
            sitekey="6Lf59FkrAAAAADzEQXiOOJQERUCKdBN-o1XwnNtJ"
            onChange={(token) => setCaptchaToken(token)}
            theme="dark"
          />
        )}
      </form>
    </div>
  );
}

export default App;
