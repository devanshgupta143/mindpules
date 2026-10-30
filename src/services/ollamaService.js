export async function generateOllamaFeedback(sessionData, deltas) {
  const interruptions = sessionData.pressure.interruptions
    .map(({ sec, description }) => `- ${sec}s: ${description}`)
    .join('\n');

  const prompt = `You are an executive interview performance coach. Analyze the candidate's non-verbal telemetry deltas and transcript.

Telemetry:
- Baseline: ${sessionData.baseline.blinksPerMin} blinks/min, ${sessionData.baseline.avgPitchHz} Hz pitch
- Calm round: ${sessionData.calm.blinksPerMin} blinks/min, ${sessionData.calm.avgPitchHz} Hz pitch, smile score ${sessionData.calm.smileScore}, head position ${sessionData.calm.headY}
- Pressure round: ${sessionData.pressure.blinksPerMin} blinks/min (${deltas.blinkDelta > 0 ? '+' : ''}${deltas.blinkDelta}%), ${sessionData.pressure.avgPitchHz} Hz pitch (${deltas.pitchDelta > 0 ? '+' : ''}${deltas.pitchDelta}%), smile score ${sessionData.pressure.smileScore} (${deltas.smileDelta}% change), head position ${sessionData.pressure.headY} (${deltas.postureDelta > 0 ? '+' : ''}${deltas.postureDelta}% shift), ${sessionData.pressure.slouchScore}
- Pressure-round interruptions:
${interruptions}

Candidate transcript:
"${sessionData.transcript}"

Output exactly 3 short bullet points and no introduction or conclusion. Use these labels, one per bullet:
- Primary Stress Tell:
- Vocal Stability Assessment:
- One Actionable Practice Drill:`;

  const response = await fetch('/api/ollama/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma3:1b',
      prompt: prompt,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama responded with status: ${response.status}`);
  }

  const result = await response.json();
  if (typeof result.response !== 'string' || !result.response.trim()) {
    throw new Error('Ollama returned an empty or invalid response.');
  }

  return result.response.trim();
}