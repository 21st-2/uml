/* global React */
const { useState: useStateAct, useRef: useRefAct, useEffect: useEffectAct } = React;

// ── Activity diagram — editable ───────────────────────────────────────────

const NODE_W = 240;
const NODE_H = 50;
const DIAMOND = 72;
const PILL_W = 180;
const PILL_H = 38;
const MERGE_R = 9;

const CX = 400;
const RX = 680;
const LX = 120;

const INITIAL_NODES = [
  { id: 'start', kind: 'start',    label: 'Paciente chega à UPA',         x: CX, y: 30 },
  { id: 'a1',    kind: 'action',   label: 'Registrar entrada',  rf:'RF04', x: CX, y: 110 },
  { id: 'd1',    kind: 'decision', label: 'Possui cadastro?',             x: CX, y: 210 },
  { id: 'a2',    kind: 'action',   label: 'Cadastrar paciente', rf:'RF01', x: RX, y: 210 },
  { id: 'a3',    kind: 'action',   label: 'Atualizar dados',    rf:'RF03', x: CX, y: 320 },
  { id: 'm1',    kind: 'merge',                                            x: CX, y: 410 },
  { id: 'a4',    kind: 'action',   label: 'Triagem & sinais vitais', rf:'RF05–RF06', x: CX, y: 480 },
  { id: 'a5',    kind: 'action',   label: 'Classificar risco',  rf:'RF07', x: CX, y: 570 },
  { id: 'd2',    kind: 'decision', label: 'Nível de urgência?',           x: CX, y: 670 },
  { id: 'a6',    kind: 'action',   label: 'Atendimento prioritário',      x: LX, y: 670, urgent: true },
  { id: 'm2',    kind: 'merge',                                            x: CX, y: 780 },
  { id: 'a7',    kind: 'action',   label: 'Consulta médica',    rf:'RF09–RF11', x: CX, y: 850 },
  { id: 'd3',    kind: 'decision', label: 'Exames ou retorno?',           x: CX, y: 950 },
  { id: 'a8',    kind: 'action',   label: 'Solicitar exame',    rf:'RF12–RF14', x: RX, y: 950 },
  { id: 'a9',    kind: 'action',   label: 'Buscar horários',    rf:'RF15–RF17', x: RX, y: 1030 },
  { id: 'a10',   kind: 'action',   label: 'Confirmar agendamento', rf:'RF18–RF20', x: RX, y: 1110 },
  { id: 'a11',   kind: 'action',   label: 'Gerar protocolo',    rf:'RF21', x: RX, y: 1190 },
  { id: 'a12',   kind: 'action',   label: 'Notificar paciente', rf:'RF22–RF25', x: RX, y: 1270 },
  { id: 'a13',   kind: 'action',   label: 'Realizar exame',     rf:'RF26–RF28', x: RX, y: 1350 },
  { id: 'm3',    kind: 'merge',                                            x: CX, y: 1440 },
  { id: 'a14',   kind: 'action',   label: 'Atualizar prontuário', rf:'RF29–RF32', x: CX, y: 1510 },
  { id: 'a15',   kind: 'action',   label: 'Encerrar atendimento', rf:'RF33–RF35', x: CX, y: 1600 },
  { id: 'end',   kind: 'end',      label: 'Fim',                          x: CX, y: 1690 },
];

const INITIAL_FLOWS = [
  { from: 'start', to: 'a1' },
  { from: 'a1', to: 'd1' },
  { from: 'd1', to: 'a3', label: 'sim', fromSide: 'bottom', toSide: 'top' },
  { from: 'd1', to: 'a2', label: 'não', fromSide: 'right', toSide: 'left' },
  { from: 'a2', to: 'm1', fromSide: 'bottom', toSide: 'right' },
  { from: 'a3', to: 'm1', fromSide: 'bottom', toSide: 'top' },
  { from: 'm1', to: 'a4', fromSide: 'bottom', toSide: 'top' },
  { from: 'a4', to: 'a5' },
  { from: 'a5', to: 'd2' },
  { from: 'd2', to: 'm2', label: 'normal', fromSide: 'bottom', toSide: 'top' },
  { from: 'd2', to: 'a6', label: 'alta', fromSide: 'left', toSide: 'right' },
  { from: 'a6', to: 'm2', fromSide: 'bottom', toSide: 'left' },
  { from: 'm2', to: 'a7', fromSide: 'bottom', toSide: 'top' },
  { from: 'a7', to: 'd3' },
  { from: 'd3', to: 'a8', label: 'sim', fromSide: 'right', toSide: 'left' },
  { from: 'd3', to: 'm3', label: 'não', fromSide: 'bottom', toSide: 'top' },
  { from: 'a8', to: 'a9' },
  { from: 'a9', to: 'a10' },
  { from: 'a10', to: 'a11' },
  { from: 'a11', to: 'a12' },
  { from: 'a12', to: 'a13' },
  { from: 'a13', to: 'm3', fromSide: 'bottom', toSide: 'right' },
  { from: 'm3', to: 'a14', fromSide: 'bottom', toSide: 'top' },
  { from: 'a14', to: 'a15' },
  { from: 'a15', to: 'end' },
];

function nodeSize(n) {
  if (n.kind === 'start' || n.kind === 'end') return { w: PILL_W, h: PILL_H };
  if (n.kind === 'decision')                 return { w: DIAMOND, h: DIAMOND };
  if (n.kind === 'merge')                    return { w: MERGE_R * 2, h: MERGE_R * 2 };
  return { w: NODE_W, h: NODE_H };
}

function portOf(n, side) {
  const s = nodeSize(n);
  switch (side) {
    case 'top':    return { x: n.x,             y: n.y - s.h / 2 };
    case 'bottom': return { x: n.x,             y: n.y + s.h / 2 };
    case 'left':   return { x: n.x - s.w / 2,   y: n.y };
    case 'right':  return { x: n.x + s.w / 2,   y: n.y };
  }
}

function autoSide(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dy) > Math.abs(dx) * 1.5) {
    return dy > 0 ? 'bottom' : 'top';
  }
  return dx > 0 ? 'right' : 'left';
}

function buildPath(p1, p2, fromSide, toSide) {
  if (p1.x === p2.x || p1.y === p2.y) {
    return { d: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`, segments: [[p1, p2]] };
  }
  let mid;
  if (fromSide === 'top' || fromSide === 'bottom') {
    if (toSide === 'top' || toSide === 'bottom') {
      mid = { x: p1.x, y: (p1.y + p2.y) / 2 };
      const mid2 = { x: p2.x, y: (p1.y + p2.y) / 2 };
      return {
        d: `M ${p1.x} ${p1.y} L ${mid.x} ${mid.y} L ${mid2.x} ${mid2.y} L ${p2.x} ${p2.y}`,
        segments: [[p1, mid], [mid, mid2], [mid2, p2]],
      };
    } else {
      mid = { x: p1.x, y: p2.y };
      return {
        d: `M ${p1.x} ${p1.y} L ${mid.x} ${mid.y} L ${p2.x} ${p2.y}`,
        segments: [[p1, mid], [mid, p2]],
      };
    }
  } else {
    if (toSide === 'left' || toSide === 'right') {
      mid = { x: (p1.x + p2.x) / 2, y: p1.y };
      const mid2 = { x: (p1.x + p2.x) / 2, y: p2.y };
      return {
        d: `M ${p1.x} ${p1.y} L ${mid.x} ${mid.y} L ${mid2.x} ${mid2.y} L ${p2.x} ${p2.y}`,
        segments: [[p1, mid], [mid, mid2], [mid2, p2]],
      };
    } else {
      mid = { x: p2.x, y: p1.y };
      return {
        d: `M ${p1.x} ${p1.y} L ${mid.x} ${mid.y} L ${p2.x} ${p2.y}`,
        segments: [[p1, mid], [mid, p2]],
      };
    }
  }
}

function midOfLongestSeg(segments) {
  let best = segments[0], bestLen = 0;
  for (const seg of segments) {
    const len = Math.hypot(seg[1].x - seg[0].x, seg[1].y - seg[0].y);
    if (len > bestLen) { bestLen = len; best = seg; }
  }
  return { x: (best[0].x + best[1].x) / 2, y: (best[0].y + best[1].y) / 2 };
}

function ActivityDiagram({ onSelect, selected, editing, setEditing }) {
  const [nodes, setNodes] = useStateAct(INITIAL_NODES);
  const [flows, setFlows] = useStateAct(INITIAL_FLOWS);
  const [hover, setHover] = useStateAct(null);
  const [drag, setDrag] = useStateAct(null);
  const svgRef = useRefAct(null);
  const focus = editing ? (hover || selected) : null;

  // Drag node to move
  useEffectAct(() => {
    if (!drag) return;
    const onMove = (e) => {
      const svg = svgRef.current;
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const cur = pt.matrixTransform(svg.getScreenCTM().inverse());
      setNodes(ns => ns.map(n => n.id === drag.id ? { ...n, x: cur.x + drag.dx, y: cur.y + drag.dy } : n));
    };
    const onUp = () => setDrag(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drag]);

  const startNodeDrag = (n, e) => {
    if (!editing) return;
    e.stopPropagation();
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const cur = pt.matrixTransform(svg.getScreenCTM().inverse());
    setDrag({ id: n.id, dx: n.x - cur.x, dy: n.y - cur.y });
  };

  const W = 800;
  // Dynamic height based on lowest node
  const H = Math.max(...nodes.map(n => n.y + nodeSize(n).h / 2)) + 60;

  const addNode = (kind) => {
    const id = `n${Date.now() % 100000}`;
    const newNode = {
      id, kind,
      label: kind === 'action' ? 'Nova ação' : kind === 'decision' ? 'Decisão?' : kind === 'start' ? 'Início' : kind === 'end' ? 'Fim' : '',
      x: CX, y: H - 40,
    };
    setNodes(ns => [...ns, newNode]);
    onSelect({ kind: 'activity', id });
  };

  const updateNode = (id, patch) => {
    setNodes(ns => ns.map(n => n.id === id ? { ...n, ...patch } : n));
  };

  const deleteNode = (id) => {
    setNodes(ns => ns.filter(n => n.id !== id));
    setFlows(fs => fs.filter(f => f.from !== id && f.to !== id));
    onSelect(null);
  };

  // Expose API
  React.useEffect(() => {
    window.__activityDiagramAPI = { updateNode, deleteNode, nodes };
  }, [nodes]);

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--rule)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', borderBottom: '1px solid var(--rule)', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className={`btn ${editing ? 'btn-primary' : ''}`} onClick={() => setEditing(!editing)}>
            {editing ? '✓ Concluir edição' : '✎ Modo edição'}
          </button>
          {editing && (
            <>
              <button className="btn" onClick={() => addNode('action')}>+ Ação</button>
              <button className="btn" onClick={() => addNode('decision')}>+ Decisão</button>
              <button className="btn" onClick={() => addNode('merge')}>+ Merge</button>
            </>
          )}
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-mute)', letterSpacing: '.06em', textTransform: 'uppercase', marginLeft: 8 }}>
            {nodes.filter(n => n.kind === 'action').length} ações · {nodes.filter(n => n.kind === 'decision').length} decisões
          </span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
          {editing ? 'arraste nós p/ reposicionar · clique p/ editar' : 'ative edição p/ interagir'}
        </div>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMin meet"
        style={{ display: 'block', width: '100%', height: 'auto' }}>
        <defs>
          <marker id="act-arrow" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="9" markerHeight="9" orient="auto">
            <path d="M 0 0 L 10 6 L 0 12 z" fill="var(--ink-soft)"/>
          </marker>
          <marker id="act-arrow-hl" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="9" markerHeight="9" orient="auto">
            <path d="M 0 0 L 10 6 L 0 12 z" fill="var(--teal)"/>
          </marker>
        </defs>

        {flows.map((f, i) => {
          const a = nodes.find(n => n.id === f.from);
          const b = nodes.find(n => n.id === f.to);
          if (!a || !b) return null;
          const fromSide = f.fromSide || autoSide(a, b);
          const toSide = f.toSide || autoSide(b, a);
          const p1 = portOf(a, fromSide);
          const p2 = portOf(b, toSide);
          const path = buildPath(p1, p2, fromSide, toSide);
          const labelPos = f.label ? midOfLongestSeg(path.segments) : null;
          const hl = focus === f.from || focus === f.to;
          return (
            <g key={i}>
              <path d={path.d} fill="none" stroke={hl ? 'var(--teal)' : 'var(--ink-soft)'}
                strokeWidth={hl ? 1.6 : 1.1}
                markerEnd={`url(#${hl ? 'act-arrow-hl' : 'act-arrow'})`}/>
              {labelPos && (
                <g>
                  <rect x={labelPos.x - 22} y={labelPos.y - 9} width="44" height="18" rx="2"
                    fill="var(--card)" stroke="var(--rule)"/>
                  <text x={labelPos.x} y={labelPos.y + 4} textAnchor="middle"
                    fontFamily="var(--mono)" fontSize="11" fill="var(--ink-mid)">
                    {f.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {nodes.map(n => {
          const sel = selected === n.id;
          const hl = focus === n.id;
          const dragCursor = editing ? (drag ? 'grabbing' : 'grab') : 'pointer';

          const commonHandlers = editing ? {
            onClick: (e) => { e.stopPropagation(); onSelect({ kind: 'activity', id: n.id }); },
            onPointerDown: (e) => startNodeDrag(n, e),
            onMouseEnter: () => setHover(n.id),
            onMouseLeave: () => setHover(null),
            style: { cursor: dragCursor },
          } : {
            style: { cursor: 'inherit', pointerEvents: 'none' },
          };

          if (n.kind === 'merge') {
            return (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={MERGE_R}
                  fill={sel ? 'var(--teal)' : 'var(--ink)'}
                  stroke={sel ? 'var(--teal-deep)' : 'var(--ink)'}
                  strokeWidth={sel ? 3 : 0}
                  {...commonHandlers}/>
                {sel && editing && (
                  <g onClick={(e) => { e.stopPropagation(); deleteNode(n.id); }} style={{ cursor: 'pointer' }}>
                    <circle cx={n.x + 18} cy={n.y - 14} r="9" fill="var(--c-coral)" stroke="var(--paper)" strokeWidth="1.5"/>
                    <text x={n.x + 18} y={n.y - 11} textAnchor="middle" fontSize="11" fill="var(--paper)">×</text>
                  </g>
                )}
              </g>
            );
          }

          if (n.kind === 'start' || n.kind === 'end') {
            return (
              <g key={n.id}>
                <rect x={n.x - PILL_W / 2} y={n.y - PILL_H / 2} width={PILL_W} height={PILL_H}
                  rx={PILL_H / 2} ry={PILL_H / 2}
                  fill={n.kind === 'start' ? 'var(--teal)' : 'var(--ink)'}
                  stroke={sel ? 'var(--teal-deep)' : (n.kind === 'start' ? 'var(--teal-deep)' : 'var(--ink)')}
                  strokeWidth={sel ? 3 : 1}
                  {...commonHandlers}/>
                <text x={n.x} y={n.y + 4} textAnchor="middle" pointerEvents="none"
                  fontFamily="var(--mono)" fontSize="11" letterSpacing="1.2"
                  fill="var(--paper)">
                  {(n.label || '').toUpperCase()}
                </text>
                {sel && editing && (
                  <g onClick={(e) => { e.stopPropagation(); deleteNode(n.id); }} style={{ cursor: 'pointer' }}>
                    <circle cx={n.x + PILL_W / 2 + 4} cy={n.y - PILL_H / 2 - 4} r="10" fill="var(--c-coral)" stroke="var(--paper)" strokeWidth="1.5"/>
                    <text x={n.x + PILL_W / 2 + 4} y={n.y - PILL_H / 2 - 1} textAnchor="middle" fontSize="12" fill="var(--paper)">×</text>
                  </g>
                )}
              </g>
            );
          }

          if (n.kind === 'decision') {
            const s = DIAMOND;
            const pts = `${n.x},${n.y - s/2} ${n.x + s/2},${n.y} ${n.x},${n.y + s/2} ${n.x - s/2},${n.y}`;
            return (
              <g key={n.id}>
                <polygon points={pts}
                  fill="var(--c-sun-soft)" stroke={sel || hl ? 'var(--teal)' : 'var(--c-sun)'}
                  strokeWidth={sel ? 2.4 : hl ? 2 : 1.2}
                  {...commonHandlers}/>
                <foreignObject x={n.x - 38} y={n.y - 24} width={76} height={48} pointerEvents="none">
                  <div style={{
                    fontFamily: 'var(--sans)', fontSize: 11, lineHeight: 1.15,
                    color: 'var(--c-amber)', textAlign: 'center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '100%', fontWeight: 500,
                  }}>
                    {n.label}
                  </div>
                </foreignObject>
                {sel && editing && (
                  <g onClick={(e) => { e.stopPropagation(); deleteNode(n.id); }} style={{ cursor: 'pointer' }}>
                    <circle cx={n.x + s / 2 + 4} cy={n.y - s / 2 - 4} r="10" fill="var(--c-coral)" stroke="var(--paper)" strokeWidth="1.5"/>
                    <text x={n.x + s / 2 + 4} y={n.y - s / 2 - 1} textAnchor="middle" fontSize="12" fill="var(--paper)">×</text>
                  </g>
                )}
              </g>
            );
          }

          // Action
          const w = NODE_W, h = NODE_H;
          const accent = n.urgent ? 'var(--c-coral)' : 'var(--teal)';
          const bg = n.urgent ? 'var(--c-coral-soft)' : 'var(--card)';
          return (
            <g key={n.id}>
              <rect x={n.x - w/2} y={n.y - h/2} width={w} height={h} rx="4"
                fill={bg} stroke={sel || hl ? 'var(--teal)' : 'var(--ink-soft)'}
                strokeWidth={sel ? 2.4 : hl ? 2 : 1}
                {...commonHandlers}/>
              <rect x={n.x - w/2} y={n.y - h/2} width={3} height={h}
                fill={accent} pointerEvents="none"/>
              <text x={n.x - w/2 + 16} y={n.y - 4} pointerEvents="none"
                fontFamily="var(--sans)" fontSize="13" fill="var(--ink)" fontWeight="500">
                {n.label}
              </text>
              {n.rf && (
                <text x={n.x - w/2 + 16} y={n.y + 14} pointerEvents="none"
                  fontFamily="var(--mono)" fontSize="10" fill={n.urgent ? 'var(--c-coral)' : 'var(--ink-mute)'} letterSpacing="0.5">
                  {n.rf}
                </text>
              )}
              {sel && editing && (
                <g onClick={(e) => { e.stopPropagation(); deleteNode(n.id); }} style={{ cursor: 'pointer' }}>
                  <circle cx={n.x + w / 2 + 4} cy={n.y - h / 2 - 4} r="10" fill="var(--c-coral)" stroke="var(--paper)" strokeWidth="1.5"/>
                  <text x={n.x + w / 2 + 4} y={n.y - h / 2 - 1} textAnchor="middle" fontSize="12" fill="var(--paper)">×</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

window.ActivityDiagram = ActivityDiagram;
