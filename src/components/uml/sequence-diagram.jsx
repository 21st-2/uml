/* global React */
const { useState: useStateSeq, useMemo: useMemoSeq, useRef: useRefSeq, useEffect: useEffectSeq } = React;

function SequenceDiagram({ onSelect, selected }) {
  const { SEQUENCE, SEQ_LANES } = window.UPA;
  const [hover, setHover] = useStateSeq(null);
  const [step, setStep] = useStateSeq(SEQUENCE.length);
  const focus = hover;

  const laneIndex = useMemoSeq(() => {
    const m = {};
    SEQ_LANES.forEach((l, i) => { m[l.id] = i; });
    return m;
  }, []);

  const LANE_W = 145;
  const MSG_H = 54;
  const TOP_PAD = 24;
  const TOTAL_W = LANE_W * SEQ_LANES.length;

  // Detect alt frame
  const altRange = useMemoSeq(() => {
    const start = SEQUENCE.findIndex(m => m.alt);
    let end = -1;
    for (let i = start; i < SEQUENCE.length; i++) {
      if (SEQUENCE[i].alt) end = i;
    }
    return { start, end };
  }, []);

  return (
    <div className="seq-wrap">
      {/* Player controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px', borderBottom: '1px solid var(--rule)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setStep(s => Math.max(1, s - 1))}>← Anterior</button>
          <button className="btn" onClick={() => setStep(s => Math.min(SEQUENCE.length, s + 1))}>Próximo →</button>
          <button className="btn btn-ghost" onClick={() => setStep(SEQUENCE.length)}>Tudo</button>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
          Mensagem <b style={{ color: 'var(--ink)' }}>{step}</b> de {SEQUENCE.length}
        </div>
        <input type="range" min="1" max={SEQUENCE.length} value={step} onChange={e => setStep(+e.target.value)}
          style={{ flex: 1, accentColor: 'var(--teal)' }}/>
      </div>

      <div className="seq-scroll">
        <div className="seq" style={{ '--lanes': SEQ_LANES.length, minWidth: TOTAL_W + 64 }}>
          <div className="seq-lanes" style={{ gridTemplateColumns: `repeat(${SEQ_LANES.length}, ${LANE_W}px)`, width: TOTAL_W }}>
            {SEQ_LANES.map(l => (
              <div className="seq-lane-head" key={l.id}>
                <div className={`lane-pill ${l.kind}`}>{l.label}</div>
                <span className="lane-sub">{l.kind === 'actor' ? 'ator' : 'objeto'} · {l.id}</span>
              </div>
            ))}
          </div>

          <div className="seq-canvas" style={{ width: TOTAL_W, height: SEQUENCE.length * MSG_H + TOP_PAD + 40, position: 'relative' }}>
            {/* Lifelines */}
            {SEQ_LANES.map((l, i) => (
              <div key={l.id} className="seq-lifeline" style={{ left: LANE_W * i + LANE_W / 2 }}/>
            ))}

            {/* Alt frame */}
            {altRange.start >= 0 && (
              <div className="seq-frame"
                data-label="alt · sem cadastro"
                style={{
                  left: LANE_W * Math.min(laneIndex['R'], laneIndex['DB']) + LANE_W / 2 - 30,
                  top: TOP_PAD + altRange.start * MSG_H - 8,
                  width: LANE_W * (Math.max(laneIndex['R'], laneIndex['DB']) - Math.min(laneIndex['R'], laneIndex['DB'])) + 60,
                  height: (altRange.end - altRange.start + 1) * MSG_H + 12,
                }}
              />
            )}

            {/* Messages */}
            {SEQUENCE.map((m, i) => {
              const fromIdx = laneIndex[m.from];
              const toIdx = laneIndex[m.to];
              if (fromIdx === undefined || toIdx === undefined) return null;
              const isSelf = fromIdx === toIdx;
              const x1 = LANE_W * fromIdx + LANE_W / 2;
              const x2 = LANE_W * toIdx + LANE_W / 2;
              const y = TOP_PAD + i * MSG_H + MSG_H / 2;
              const visible = i < step;
              const dim = !visible;
              return (
                <div key={i}
                  className={`seq-msg ${m.kind === 'return' ? 'return' : ''} ${isSelf ? 'self' : ''} ${dim ? 'dim' : ''} ${focus === i ? 'hl' : ''}`}
                  style={{ position: 'absolute', left: 0, right: 0, top: TOP_PAD + i * MSG_H, height: MSG_H }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelect({ kind: 'seq', id: i })}
                >
                  {!isSelf && (
                    <div className="arrow" style={{
                      left: Math.min(x1, x2),
                      width: Math.abs(x2 - x1),
                      transform: x2 > x1 ? '' : 'scaleX(-1)',
                      top: '50%',
                    }}/>
                  )}
                  {isSelf && (
                    <div className="arrow" style={{ left: x1, top: y - 28 }}/>
                  )}
                  <div className="label" style={{ left: (x1 + x2) / 2 + (isSelf ? 24 : 0), top: '50%' }}>
                    {m.label}
                    {m.rf && <span className="rf">{m.rf}</span>}
                  </div>
                </div>
              );
            })}

            {/* Final note */}
            <div className="seq-note" style={{
              left: LANE_W * laneIndex['S'] + LANE_W / 2 - 80,
              top: TOP_PAD + SEQUENCE.length * MSG_H + 8,
              width: 280,
            }}>
              note · antes da data: lembrete (RF25)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.SequenceDiagram = SequenceDiagram;
