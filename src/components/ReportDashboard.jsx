import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import sampleData from '../data/sampleSession.json';
import { generateOllamaFeedback } from '../services/ollamaService';

const percentageChange = (calm, pressure) =>
  Math.round(((pressure - calm) / calm) * 100);

export default function ReportDashboard({ sessionData = sampleData, onReset }) {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const blinkDelta = percentageChange(sessionData.calm.blinksPerMin, sessionData.pressure.blinksPerMin);
  const pitchDelta = percentageChange(sessionData.calm.avgPitchHz, sessionData.pressure.avgPitchHz);
  const smileDelta = percentageChange(sessionData.calm.smileScore, sessionData.pressure.smileScore);
  const postureDelta = percentageChange(sessionData.calm.headY, sessionData.pressure.headY);
  const deltas = { blinkDelta, pitchDelta, smileDelta, postureDelta };

  const fetchFeedback = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await generateOllamaFeedback(sessionData, deltas);
      setFeedback(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate feedback from the local Ollama model.');
    } finally {
      setLoading(false);
    }
  };

  const feedbackPoints = feedback
    .split(/\r?\n/)
    .map((point) => point.replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);

  const metrics = [
    {
      label: 'Blink Rate',
      value: `${blinkDelta > 0 ? '+' : ''}${blinkDelta}%`,
      detail: `${sessionData.calm.blinksPerMin} → ${sessionData.pressure.blinksPerMin} blinks/min`,
      color: '#fb7185'
    },
    {
      label: 'Vocal Pitch',
      value: `${pitchDelta > 0 ? '+' : ''}${pitchDelta}%`,
      detail: `${sessionData.calm.avgPitchHz} → ${sessionData.pressure.avgPitchHz} Hz`,
      color: '#fbbf24'
    },
    {
      label: 'Facial Tension',
      value: `${smileDelta}%`,
      detail: `${sessionData.calm.smileScore} → ${sessionData.pressure.smileScore} smile score`,
      color: '#fb7185'
    },
    {
      label: 'Posture Shift',
      value: `${postureDelta > 0 ? '+' : ''}${postureDelta}%`,
      detail: `${sessionData.calm.headY} → ${sessionData.pressure.headY} head position · ${sessionData.pressure.slouchScore}`,
      color: '#fbbf24'
    }
  ];

  return (
    <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '32px 24px', color: '#e5e7eb', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <div>
          <p style={{ margin: '0 0 8px', color: '#60a5fa', fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Post-interview analysis</p>
          <h1 style={{ margin: 0, fontSize: '30px', color: '#f9fafb' }}>PressureProof Report</h1>
          <p style={{ margin: '8px 0 0', color: '#9ca3af' }}>Calm vs. pressure-round performance over 60 seconds</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={fetchFeedback}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#374151' : '#2563eb',
              color: '#fff',
              border: 'none',
              padding: '12px 18px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 700
            }}
          >
            {loading ? 'Analyzing with Gemma 3...' : 'Generate AI Feedback (Gemma 3)'}
          </button>
          <button
            onClick={onReset}
            style={{
              backgroundColor: 'transparent',
              color: '#d1d5db',
              border: '1px solid #4b5563',
              padding: '12px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            Interview Again
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" style={{ background: '#451a1a', color: '#fecaca', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <section aria-label="Calm to pressure metric changes" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {metrics.map((metric) => (
          <article key={metric.label} style={{ border: '1px solid #293548', background: '#111827', borderRadius: '10px', padding: '18px' }}>
            <h2 style={{ margin: 0, color: '#9ca3af', fontSize: '13px', fontWeight: 600 }}>{metric.label}</h2>
            <div style={{ margin: '12px 0 6px', color: metric.color, fontSize: '28px', fontWeight: 750 }}>{metric.value}</div>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px', lineHeight: 1.5 }}>{metric.detail}</p>
          </article>
        ))}
      </section>

      <section style={{ border: '1px solid #293548', background: '#111827', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 18px', color: '#f3f4f6', fontSize: '17px' }}>Vocal pitch over the 60-second timeline</h2>
        <div style={{ width: '100%', height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sessionData.timeline}>
              <XAxis dataKey="sec" unit="s" stroke="#9ca3af" />
              <YAxis unit=" Hz" domain={['auto', 'auto']} stroke="#9ca3af" />
              <Tooltip contentStyle={{ background: '#030712', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' }} />
              <Area type="monotone" dataKey="calmPitch" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.18} name="Calm Round" />
              <Area type="monotone" dataKey="pressurePitch" stroke="#fb7185" fill="#fb7185" fillOpacity={0.18} name="Pressure Round" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {feedback && (
        <section aria-live="polite" style={{ background: '#0b1220', color: '#e5e7eb', border: '1px solid #1d4ed8', borderRadius: '10px', padding: '22px' }}>
          <h2 style={{ margin: '0 0 12px', color: '#93c5fd', fontSize: '18px' }}>Local Gemma 3 Coaching Analysis</h2>
          <ul style={{ margin: 0, paddingLeft: '22px', lineHeight: 1.8, fontSize: '14px' }}>
            {feedbackPoints.map((point, index) => <li key={`${index}-${point}`}>{point}</li>)}
          </ul>
        </section>
      )}
    </main>
  );
}