import React, { useState, useRef } from 'react';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';

function App() {
  const [scale, setScale] = useState('C');
  const [type, setType] = useState('major');
  const [tempo, setTempo] = useState(180);
  const [captchaToken, setCaptchaToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const audioContextRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaToken) return alert('Please complete the CAPTCHA.');

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        'https://x2rrahzngmlg4hcvyxjzsjhrtq0qcraa.lambda-url.us-west-2.on.aws/',
        JSON.stringify({ scale, type, tempo, captcha: captchaToken }),
        { headers: { 'Content-Type': 'application/json' }, responseType: 'blob' }
      );

      const contentDisposition = response.headers['content-disposition'] || '';
      const match = contentDisposition.match(/filename="(.+?)"/);
      const filename = match ? match[1] : 'kithara.mid';

      const blob = new Blob([response.data], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);

      setRecordings(prev => {
        const updated = [{ name: filename, blob, url }, ...prev];
        return updated.slice(0, 10); // Keep only 10 most recent
      });
    } catch (err) {
      console.error(err);
      alert('Failed to generate song.');
    }
    setIsSubmitting(false);
  };

  const playMIDI = async (blob) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const midiArray = new Uint8Array(reader.result);
      const midiCtx = audioContextRef.current;

      // Web MIDI synth using oscillator placeholder
      // Replace with real MIDI instrument playback if needed
      console.warn("MIDI playback is simulated. WebAudio doesn't natively support MIDI synthesis.");
      alert("Simulated playback only: browser MIDI synth not implemented. Use a MIDI plugin or library for true audio.");

      // You can extend here to parse the MIDI file manually
    };
    reader.readAsArrayBuffer(blob);
  };

  return (
    <div style={{ backgroundColor: '#121212', color: '#e0e0e0', minHeight: '100vh', padding: '2em' }}>
      <h1>Kithara – randomly generate the beginning of a song</h1>

      <form onSubmit={handleSubmit}>
        {/* Controls and Submit (unchanged) */}
        {/* ...snipped for brevity... */}

        <ReCAPTCHA
          sitekey="6Lf59FkrAAAAADzEQXiOOJQERUCKdBN-o1XwnNtJ"
          onChange={token => setCaptchaToken(token)}
          theme="dark"
        />
      </form>

      <hr style={{ margin: '2em 0' }} />

      <h2>Recent Recordings</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {recordings.map((rec, index) => (
          <li key={index} style={{ marginBottom: '1em' }}>
            <span>{rec.name}</span>
            <button
              onClick={() => playMIDI(rec.blob)}
              style={{
                marginLeft: '1em',
                padding: '0.5em 1em',
                backgroundColor: '#1db954',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ▶️ Play
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
