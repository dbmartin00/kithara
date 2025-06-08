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
        'https://your-lambda-url.amazonaws.com/generate',
        { scale, type, tempo, captcha: captchaToken },
        { responseType: 'blob' }
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
      <h1>Kithara</h1>
      <form onSubmit={handleSubmit}>
        {/* ... scale/type/tempo dropdowns here ... */}

        <ReCAPTCHA
          sitekey="6Le5tFkrAAAAAMmPj_j6b3VJKaVJP5mEXiQpDNJ8"
          onChange={(token) => setCaptchaToken(token)}
          theme="dark"
        />

        <button type="submit" disabled={isSubmitting} style={{ marginTop: '1em' }}>
          {isSubmitting ? 'Generating...' : 'Generate'}
        </button>
      </form>
    </div>
  );
}

export default App;

