import React, { useState, useRef } from 'react';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import { Midi } from '@tonejs/midi';
import * as Tone from 'tone';

function App() {
  const [scale, setScale] = useState('C');
  const [type, setType] = useState('major');
  const [tempo, setTempo] = useState(180);
  const [captchaToken, setCaptchaToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [currentlyPlayingIndex, setCurrentlyPlayingIndex] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const partRef = useRef(null);
  const captchaRef = useRef(null);

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

      const contentDisposition = response.headers['content-disposition'] || '';
      const match = contentDisposition.match(/filename="(.+?)"/);
      const filename = match ? match[1] : 'kithara.mid';

      const blob = new Blob([response.data], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);

      setRecordings(prev => {
        const updated = [{ name: filename, blob, url }, ...prev];
        return updated.slice(0, 10); // Keep max 10
      });
    } catch (err) {
      console.error(err);
      alert('Failed to generate song.');
    } finally {
      if (captchaRef.current) {
        captchaRef.current.reset();
        setCaptchaToken('');
      }
      setIsSubmitting(false);
    }
  };

  const playOrPauseMIDI = async (index, blob) => {
    await Tone.start();

    // Pause current playback if same track
    if (currentlyPlayingIndex === index && !isPaused) {
      Tone.Transport.pause();
      setIsPaused(true);
      return;
    }

    // Resume current if paused
    if (currentlyPlayingIndex === index && isPaused) {
      Tone.Transport.start();
      setIsPaused(false);
      return;
    }

    // Stop any previous part
    Tone.Transport.stop();
    if (partRef.current) {
      partRef.current.dispose();
    }

    // Load new MIDI
    const arrayBuffer = await blob.arrayBuffer();
    const midi = new Midi(arrayBuffer);

    const synth = new Tone.PolySynth().toDestination();
    const events = [];

    midi.tracks.forEach(track => {
      track.notes.forEach(note => {
        events.push({
          time: note.time,
          note: note.name,
          duration: note.duration,
          velocity: note.velocity,
        });
      });
    });

    const part = new Tone.Part((time, value) => {
      synth.triggerAttackRelease(value.note, value.duration, time, value.velocity);
    }, events).start(0);

    partRef.current = part;
    Tone.Transport.position = 0;
    Tone.Transport.start();

    setCurrentlyPlayingIndex(index);
    setIsPaused(false);
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

        <ReCAPTCHA
          sitekey="6Lf59FkrAAAAADzEQXiOOJQERUCKdBN-o1XwnNtJ"
          onChange={(token) => setCaptchaToken(token)}
          theme="dark"
          ref={captchaRef}
        />
      </form>

      <hr style={{ margin: '2em 0' }} />

      <h2>Recent Recordings</h2>
      {recordings.length === 0 && <p>No recordings yet.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {recordings.map((rec, index) => (
          <li key={index} style={{ marginBottom: '1em' }}>
            <span>{rec.name}</span>

            <button
              onClick={() => playOrPauseMIDI(index, rec.blob)}
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
              {currentlyPlayingIndex === index && !isPaused ? '⏸ Pause' : '▶️ Play'}
            </button>

            <a
              href={rec.url}
              download={rec.name}
              style={{
                marginLeft: '1em',
                padding: '0.5em 1em',
                backgroundColor: '#535353',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              ⬇️ Download
            </a>
          </li>
        ))}
      </ul>
      

    </div>
  );
}

export default App;
