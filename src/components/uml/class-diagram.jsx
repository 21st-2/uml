/* global React */
const { useState: useStateCls, useRef: useRefCls, useEffect: useEffectCls, useLayoutEffect, useMemo: useMemoCls } = React;

const CLASS_W = 240;

const INITIAL_POS = {
  // ── Top row: main flow of an attendance ──
  Paciente:             { x: 40,   y: 40   },
  Triagem:              { x: 320,  y: 40   },
  Consulta:             { x: 600,  y: 40   },
  ProntuarioEletronico: { x: 920,  y: 40   },

  // ── Second row: appointment & exams branch from Consulta ──
  Agendamento:          { x: 600,  y: 340 },
  Exame:                { x: 920,  y: 340 },

  // ── Third row: notification triggered by Agendamento ──
  Notificacao:          { x: 600,  y: 580 },

  // ── Bottom: Profissional inheritance hierarchy ──
  Profissional:         { x: 320,  y: 780 },
  Medico:               { x: 40,   y: 1060 },
  Enfermeiro:           { x: 320,  y: 1060 },
  Recepcionista:        { x: 600,  y: 1060 },
};

function getPort(rect, side, t = 0.5) {
  switch (side) {
    case 'top':    return { x: rect.x + rect.w * t, y: rect.y };
    case 'bottom': return { x: rect.x + rect.w * t, y: rect.y + rect.h };
    case 'left':   return { x: rect.x,              y: rect.y + rect.h * t };
    case 'right':  return { x: rect.x + rect.w,     y: rect.y + rect.h * t };
  }
}

function pickSides(rA, rB) {
  const cA = { x: rA.x + rA.w / 2, y: rA.y + rA.h / 2 };
  const cB = { x: rB.x + rB.w / 2, y: rB.y + rB.h / 2 };
  const dx = cB.x - cA.x;
  const dy = cB.y - cA.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return [dx > 0 ? 'right' : 'left', dx > 0 ? 'left' : 'right'];
  }
  return [dy > 0 ? 'bottom' : 'top', dy > 0 ? 'top' : 'bottom'];
}

function buildOrtho(p1, p2, sideA, sideB) {
  if ((sideA === 'top' || sideA === 'bottom') && (sideB === 'top' || sideB === 'bottom')) {
    const my = (p1.y + p2.y) / 2;
    return `M ${p1.x} ${p1.y} L ${p1.x} ${my} L ${p2.x} ${my} L ${p2.x} ${p2.y}`;
  }
  if ((sideA === 'left' || sideA === 'right') && (sideB === 'left' || sideB === 'right')) {
    const mx = (p1.x + p2.x) / 2;
    return `M ${p1.x} ${p1.y} L ${mx} ${p1.y} L ${mx} ${p2.y} L ${p2.x} ${p2.y}`;
  }
  if (sideA === 'top' || sideA === 'bottom') {
    return `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y} L ${p2.x} ${p2.y}`;
  }
  return `M ${p1.x} ${p1.y} L ${p2.x} ${p1.y} L ${p2.x} ${p2.y}`;
}

function ClassDiagram({ onSelect, selected, editing, setEditing }) {
  const initialClasses = window.UPA.CLASSES;
  const [classes, setClasses] = useStateCls(initialClasses);
  const [positions, setPositions] = useStateCls(INITIAL_POS);
  const [heights, setHeights] = useStateCls({});
  const [hover, setHover] = useStateCls(null);
  const [drag, setDrag] = useStateCls(null);
  const [pan, setPan] = useStateCls({ x: 0, y: 0 });
  const [zoom, setZoom] = useStateCls(0.85);
  const [panning, setPanning] = useStateCls(null);
  const containerRef = useRefCls(null);
  const viewportRef = useRefCls(null);

  // Measure heights on each render (classes can change)
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const m = {};
    classes.forEach(c => {
      const el = containerRef.current.querySelector(`[data-cid="${c.id}"]`);
      if (el) m[c.id] = el.offsetHeight;
    });
    setHeights(m);
  }, [classes]);

  // Card drag handler (move class)
  useEffectCls(() => {
    if (!drag) return;
    const onMove = (e) => {
      const dx = (e.clientX - drag.startX) / zoom;
      const dy = (e.clientY - drag.startY) / zoom;
      setPositions(p => ({
        ...p,
        [drag.id]: { x: drag.origX + dx, y: drag.origY + dy },
      }));
    };
    const onUp = () => setDrag(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drag, zoom]);

  // Canvas pan handler
  useEffectCls(() => {
    if (!panning) return;
    const onMove = (e) => {
      const dx = e.clientX - panning.startX;
      const dy = e.clientY - panning.startY;
      setPan({ x: panning.origX + dx, y: panning.origY + dy });
    };
    const onUp = () => setPanning(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [panning]);

  // Wheel zoom (centered on cursor)
  const onWheel = (e) => {
    e.preventDefault();
    const rect = viewportRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = -e.deltaY * 0.0015;
    const newZoom = Math.max(0.3, Math.min(2.5, zoom * (1 + delta)));
    // Adjust pan so the point under cursor stays fixed
    const k = newZoom / zoom;
    setPan(p => ({
      x: mx - (mx - p.x) * k,
      y: my - (my - p.y) * k,
    }));
    setZoom(newZoom);
  };

  const startDrag = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    const orig = positions[id];
    setDrag({ id, startX: e.clientX, startY: e.clientY, origX: orig.x, origY: orig.y });
  };

  const startPan = (e) => {
    if (e.target.closest('button, input, textarea, select')) return;
    // Don't pan when interacting with class card (drag handler on header / text selection on body)
    if (e.target.closest('.uml-class')) return;
    e.preventDefault();
    setPanning({ startX: e.clientX, startY: e.clientY, origX: pan.x, origY: pan.y });
  };

  const reset = () => {
    setPositions(INITIAL_POS);
    setPan({ x: 0, y: 0 });
    setZoom(0.85);
  };

  const fit = () => {
    setPan({ x: 0, y: 0 });
    setZoom(0.85);
  };

  const addClass = () => {
    const id = `NovaClasse${Date.now() % 1000}`;
    setClasses(cs => [...cs, {
      id, stereotype: 'entity',
      attrs: ['- id: UUID', '- nome: String'],
      methods: ['+ salvar()'],
    }]);
    // Place new class near current view center
    const vp = viewportRef.current?.getBoundingClientRect();
    const cx = vp ? (vp.width / 2 - pan.x) / zoom - CLASS_W / 2 : 200;
    const cy = vp ? (vp.height / 2 - pan.y) / zoom - 100 : 200;
    setPositions(p => ({ ...p, [id]: { x: cx, y: cy } }));
    onSelect({ kind: 'class', id });
    setEditing(true);
  };

  const updateClass = (id, patch) => {
    setClasses(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const renameClass = (oldId, newId) => {
    if (!newId || newId === oldId || classes.some(c => c.id === newId)) return;
    setClasses(cs => cs.map(c => c.id === oldId ? { ...c, id: newId } : c));
    setPositions(p => {
      const np = { ...p };
      np[newId] = np[oldId];
      delete np[oldId];
      return np;
    });
    onSelect({ kind: 'class', id: newId });
  };

  const deleteClass = (id) => {
    setClasses(cs => cs.filter(c => c.id !== id));
    setPositions(p => { const np = { ...p }; delete np[id]; return np; });
    onSelect(null);
  };

  // Expose API to side panel via parent via setEditing / selected
  React.useEffect(() => {
    window.__classDiagramAPI = { updateClass, renameClass, deleteClass, classes };
  }, [classes]);

  // Compute rects
  const rects = {};
  classes.forEach(c => {
    const p = positions[c.id];
    const h = heights[c.id] || 200;
    if (p) rects[c.id] = { x: p.x, y: p.y, w: CLASS_W, h };
  });

  const allRels = window.UPA.CLASS_RELATIONS;
  const relsForView = allRels.filter(r => rects[r.from] && rects[r.to]);

  // Bounds for canvas
  const allX = Object.values(rects).map(r => [r.x, r.x + r.w]).flat();
  const allY = Object.values(rects).map(r => [r.y, r.y + r.h]).flat();
  const maxX = Math.max(...allX, 1200, 0);
  const maxY = Math.max(...allY, 1080, 0);
  const minX = Math.min(...allX, 0);
  const minY = Math.min(...allY, 0);

  const focus = editing ? (hover || selected) : null;
  const focusRels = focus ? relsForView.filter(r => r.from === focus || r.to === focus).map(r => `${r.from}→${r.to}`) : [];
  const anyFocus = !!focus;

  const innerW = maxX - minX + 200;
  const innerH = maxY - minY + 200;
  const offsetX = -minX + 100;
  const offsetY = -minY + 100;

  return (
    <div style={{ position: 'relative', background: 'var(--card)' }}>
      {/* Toolbar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', background: 'var(--card)', borderBottom: '1px solid var(--rule)',
        gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn" onClick={addClass}>+ Adicionar classe</button>
          <button className={`btn ${editing ? 'btn-primary' : ''}`} onClick={() => setEditing(!editing)}>
            {editing ? '✓ Concluir edição' : '✎ Modo edição'}
          </button>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-mute)', letterSpacing: '.06em', textTransform: 'uppercase', marginLeft: 8 }}>
            {classes.length} classes
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div className="legend" style={{ margin: 0, marginRight: 12 }}>
            <div className="legend-item">
              <svg width="32" height="12"><line x1="2" y1="6" x2="22" y2="6" stroke="var(--ink-mid)"/><polygon points="22,2 30,6 22,10" fill="var(--card)" stroke="var(--ink-mid)"/></svg>
              herança
            </div>
            <div className="legend-item">
              <svg width="32" height="12"><polygon points="2,6 8,2 14,6 8,10" fill="var(--ink-mid)" stroke="var(--ink-mid)"/><line x1="14" y1="6" x2="30" y2="6" stroke="var(--ink-mid)"/></svg>
              composição
            </div>
            <div className="legend-item">
              <svg width="32" height="12"><line x1="2" y1="6" x2="30" y2="6" stroke="var(--ink-mid)"/></svg>
              associação
            </div>
          </div>
          <button className="btn" onClick={() => { setZoom(z => Math.max(0.3, z - 0.15)); }} title="Diminuir zoom">−</button>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-mid)', minWidth: 44, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button className="btn" onClick={() => { setZoom(z => Math.min(2.5, z + 0.15)); }} title="Aumentar zoom">+</button>
          <button className="btn" onClick={fit} title="Centralizar">⊡</button>
          <button className="btn" onClick={reset} title="Resetar layout">↺</button>
        </div>
      </div>

      {/* Viewport */}
      <div
        ref={viewportRef}
        className="class-viewport"
        onWheel={onWheel}
        onPointerDown={startPan}
        style={{
          position: 'relative',
          height: 720,
          marginTop: 56,
          overflow: 'hidden',
          background:
            'radial-gradient(circle at 1px 1px, rgba(20,24,31,0.05) 1px, transparent 1px)',
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          cursor: panning ? 'grabbing' : 'grab',
        }}
      >
        <div
          ref={containerRef}
          style={{
            position: 'absolute',
            left: 0, top: 0,
            width: innerW,
            height: innerH,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <svg style={{ position: 'absolute', inset: 0, width: innerW, height: innerH, pointerEvents: 'none' }}>
            <defs>
              <marker id="arrow-inherit" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="14" markerHeight="14" orient="auto">
                <path d="M 0 0 L 10 6 L 0 12 z" fill="var(--card)" stroke="var(--ink-mid)" strokeWidth="1"/>
              </marker>
              <marker id="arrow-inherit-hl" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="14" markerHeight="14" orient="auto">
                <path d="M 0 0 L 10 6 L 0 12 z" fill="var(--card)" stroke="var(--teal)" strokeWidth="1.2"/>
              </marker>
              <marker id="diamond-comp" viewBox="0 0 16 12" refX="0" refY="6" markerWidth="16" markerHeight="12" orient="auto">
                <path d="M 0 6 L 8 0 L 16 6 L 8 12 z" fill="var(--ink-mid)" stroke="var(--ink-mid)"/>
              </marker>
              <marker id="diamond-comp-hl" viewBox="0 0 16 12" refX="0" refY="6" markerWidth="16" markerHeight="12" orient="auto">
                <path d="M 0 6 L 8 0 L 16 6 L 8 12 z" fill="var(--teal)" stroke="var(--teal)"/>
              </marker>
              <marker id="arrow-open" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" orient="auto">
                <path d="M 0 0 L 10 6 L 0 12" fill="none" stroke="var(--ink-mid)" strokeWidth="1"/>
              </marker>
              <marker id="arrow-open-hl" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" orient="auto">
                <path d="M 0 0 L 10 6 L 0 12" fill="none" stroke="var(--teal)" strokeWidth="1.3"/>
              </marker>
            </defs>

            <g transform={`translate(${offsetX}, ${offsetY})`}>
              {relsForView.map((r, i) => {
                const rA = rects[r.from];
                const rB = rects[r.to];
                const [sideA, sideB] = pickSides(rA, rB);
                const pA = getPort(rA, sideA);
                const pB = getPort(rB, sideB);
                const d = buildOrtho(pA, pB, sideA, sideB);

                const key = `${r.from}→${r.to}`;
                const hl = focusRels.includes(key);
                const dim = anyFocus && !hl;

                let markerEnd, markerStart;
                if (r.kind === 'inheritance') {
                  markerEnd = hl ? 'url(#arrow-inherit-hl)' : 'url(#arrow-inherit)';
                } else if (r.kind === 'composition') {
                  markerStart = hl ? 'url(#diamond-comp-hl)' : 'url(#diamond-comp)';
                } else {
                  markerEnd = hl ? 'url(#arrow-open-hl)' : 'url(#arrow-open)';
                }

                const midX = (pA.x + pB.x) / 2;
                const midY = (pA.y + pB.y) / 2;
                const isHoriz = (sideA === 'left' || sideA === 'right') && (sideB === 'left' || sideB === 'right');
                const labelOffsetX = isHoriz ? 0 : 16;
                const labelOffsetY = isHoriz ? -14 : 0;
                const offA = (s) => {
                  if (s === 'top')    return { dx: 6,    dy: -6 };
                  if (s === 'bottom') return { dx: 6,    dy: 14 };
                  if (s === 'left')   return { dx: -6,   dy: -6 };
                  if (s === 'right')  return { dx: 6,    dy: -6 };
                };
                const oA = offA(sideA);
                const oB = offA(sideB);

                return (
                  <g key={key}>
                    <path d={d} fill="none"
                      stroke={hl ? 'var(--teal)' : 'var(--ink-mid)'}
                      strokeWidth={hl ? 1.6 : 1.1}
                      strokeOpacity={dim ? 0.15 : 1}
                      markerEnd={markerEnd} markerStart={markerStart}/>
                    {r.label && !dim && (
                      <g>
                        <rect x={midX + labelOffsetX - r.label.length * 3.3 - 5} y={midY + labelOffsetY - 8} width={r.label.length * 6.6 + 10} height="14" rx="2"
                          fill="var(--card)" opacity="0.94"/>
                        <text x={midX + labelOffsetX} y={midY + labelOffsetY + 4} textAnchor="middle"
                          fontFamily="var(--mono)" fontSize="10.5"
                          fill={hl ? 'var(--teal-deep)' : 'var(--ink-mid)'}>
                          {r.label}
                        </text>
                      </g>
                    )}
                    {r.multA && !dim && (
                      <text x={pA.x + oA.dx} y={pA.y + oA.dy}
                        fontFamily="var(--mono)" fontSize="10"
                        fill="var(--ink-mute)"
                        textAnchor={sideA === 'left' ? 'end' : 'start'}>
                        {r.multA}
                      </text>
                    )}
                    {r.multB && !dim && (
                      <text x={pB.x + oB.dx} y={pB.y + oB.dy}
                        fontFamily="var(--mono)" fontSize="10"
                        fill="var(--ink-mute)"
                        textAnchor={sideB === 'left' ? 'end' : 'start'}>
                        {r.multB}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          <div style={{ position: 'absolute', left: offsetX, top: offsetY, width: 0, height: 0 }}>
            {classes.map(c => {
              const p = positions[c.id];
              if (!p) return null;
              const hl = focus === c.id;
              const dim = anyFocus && !hl;
              const sel = selected === c.id;
              const isDragging = drag?.id === c.id;
              return (
                <div
                  key={c.id}
                  data-cid={c.id}
                  className={`uml-class ${c.stereotype === 'abstract' ? 'abstract' : ''} ${dim ? 'dim' : ''} ${sel ? 'sel' : ''} ${isDragging ? 'dragging' : ''} ${!editing ? 'no-interact' : ''}`}
                  style={{ position: 'absolute', left: p.x, top: p.y, width: CLASS_W }}
                  onMouseEnter={() => editing && setHover(c.id)}
                  onMouseLeave={() => editing && setHover(null)}
                >
                  <div className="uml-class-head"
                    onPointerDown={(e) => startDrag(c.id, e)}
                    onClick={editing ? (e) => { e.stopPropagation(); onSelect({ kind: 'class', id: c.id }); } : undefined}
                    style={{ cursor: drag ? 'grabbing' : 'grab', userSelect: 'none' }}
                  >
                    {c.stereotype === 'abstract' && <span className="stereo">«abstract»</span>}
                    <span className="name">{c.id}</span>
                  </div>
                  <div className="uml-class-body"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={editing ? (e) => { e.stopPropagation(); onSelect({ kind: 'class', id: c.id }); } : undefined}
                    style={{ userSelect: 'text', cursor: 'text' }}>
                    {c.attrs.map((a, i) => <div key={i}>{a}</div>)}
                    {c.attrs.length === 0 && <div style={{ color: 'var(--ink-faint)' }}>—</div>}
                  </div>
                  <div className="uml-class-meta"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={editing ? (e) => { e.stopPropagation(); onSelect({ kind: 'class', id: c.id }); } : undefined}
                    style={{ userSelect: 'text', cursor: 'text' }}>
                    {c.methods.map((m, i) => <div key={i}>{m}</div>)}
                    {c.methods.length === 0 && <div style={{ color: 'var(--ink-faint)' }}>—</div>}
                  </div>
                  {editing && sel && (
                    <button onClick={(e) => { e.stopPropagation(); deleteClass(c.id); }}
                      style={{
                        position: 'absolute', top: -10, right: -10, zIndex: 5,
                        width: 22, height: 22, borderRadius: '50%',
                        background: 'var(--c-coral)', color: 'var(--paper)',
                        border: '1.5px solid var(--paper)', fontSize: 11, lineHeight: 1,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      }} title="Excluir classe">×</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hint */}
        <div style={{
          position: 'absolute', bottom: 12, left: 16,
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-mute)',
          letterSpacing: '.06em', textTransform: 'uppercase',
          background: 'rgba(255,255,255,0.92)', padding: '4px 10px', borderRadius: 4,
          border: '1px solid var(--rule)',
          pointerEvents: 'none',
        }}>
          {editing
            ? 'arraste cabeçalho p/ reposicionar · clique p/ editar · arraste fundo p/ mover · scroll p/ zoom'
            : 'arraste cabeçalho p/ reposicionar · arraste fundo p/ mover · scroll p/ zoom · selecione texto e Ctrl+C p/ copiar'}
        </div>
      </div>
    </div>
  );
}

window.ClassDiagram = ClassDiagram;
