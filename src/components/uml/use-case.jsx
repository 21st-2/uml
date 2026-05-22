/* global React */
const { useState, useMemo, useEffect, useRef } = React;

// ---------- Small primitives ----------

function Chip({ group, children }) {
  const color = window.UPA.GROUPS[group]?.color || 'teal';
  return (
    <span className="chip" data-c={color}>
      <span className="chip-dot"></span>
      {children || window.UPA.GROUPS[group]?.label}
    </span>
  );
}

function ActorGlyph({ size = 28 }) {
  // Refined stick-figure actor (UML standard glyph)
  return (
    <svg viewBox="0 0 28 40" width={size} height={size * 40/28} fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="14" cy="6" r="5"/>
      <line x1="14" y1="11" x2="14" y2="24"/>
      <line x1="4"  y1="17" x2="24" y2="17"/>
      <line x1="14" y1="24" x2="4"  y2="38"/>
      <line x1="14" y1="24" x2="24" y2="38"/>
    </svg>
  );
}

function EmptySide({ title = 'Nenhuma seleção', desc = 'Selecione um elemento do diagrama para ver os detalhes.' }) {
  return (
    <div className="side-empty">
      <div className="icon">↗</div>
      <div className="lbl">{title}</div>
      <div className="desc">{desc}</div>
    </div>
  );
}

// ---------- Use case diagram ----------

// Hand-tuned positions inside a 1100×720 canvas
const UC_ACTOR_POS = {
  paciente:      { x: 110, y: 150 },
  enfermeiro:    { x: 110, y: 380 },
  notificacao:   { x: 110, y: 600 },
  recepcionista: { x: 990, y: 150 },
  medico:        { x: 990, y: 380 },
  laboratorio:   { x: 990, y: 600 },
};

const UC_CASE_POS = {
  UC01: { x: 330, y: 130 },
  UC02: { x: 330, y: 200 },
  UC03: { x: 330, y: 270 },
  UC18: { x: 330, y: 600 },
  UC19: { x: 330, y: 670 },

  UC04: { x: 330, y: 380 },
  UC05: { x: 330, y: 450 },

  UC09: { x: 770, y: 130 },
  UC10: { x: 770, y: 200 },
  UC11: { x: 770, y: 270 },

  UC06: { x: 550, y: 330 },
  UC07: { x: 550, y: 400 },
  UC08: { x: 550, y: 470 },
  UC17: { x: 550, y: 540 },
  UC16: { x: 550, y: 610 },

  UC12: { x: 770, y: 540 },
  UC13: { x: 770, y: 600 },

  UC14: { x: 770, y: 380 },
  UC15: { x: 770, y: 450 },
};

function UseCaseDiagram({ onSelect, selected, hoverActor, setHoverActor }) {
  const { ACTORS, USE_CASES, GROUPS } = window.UPA;
  const [hoverUC, setHoverUC] = useState(null);
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!wrapRef.current) return;
    const update = () => {
      if (!wrapRef.current) return;
      const w = wrapRef.current.clientWidth;
      setScale(Math.min(1, w / 1100));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrapRef.current);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, []);

  const focusActor = hoverActor;
  const focusUC = hoverUC || selected;

  // Determine which use cases & actors are highlighted
  const isHL = (uc) => {
    if (focusActor) return uc.actors.includes(focusActor);
    if (focusUC) return uc.id === focusUC;
    return false;
  };
  const actorIsHL = (a) => {
    if (focusActor) return a.id === focusActor;
    if (focusUC) {
      const uc = USE_CASES.find(u => u.id === focusUC);
      return uc?.actors.includes(a.id);
    }
    return false;
  };
  const anyFocus = !!(focusActor || focusUC);

  return (
    <div className="uc-canvas-wrap" ref={wrapRef} style={{ height: 720 * scale + 2 }}>
    <div className="uc-canvas" style={{ transform: `scale(${scale})` }}>
      <div className="uc-system">
        <div className="uc-system-label">Sistema UPA 24h · Agendamento Inteligente</div>
      </div>

      <svg className="uc-svg" viewBox="0 0 1100 720" preserveAspectRatio="none">
        {USE_CASES.flatMap(uc => uc.actors.map(actorId => {
          const a = UC_ACTOR_POS[actorId];
          const c = UC_CASE_POS[uc.id];
          if (!a || !c) return null;
          const mx = (a.x + c.x) / 2;
          const my = (a.y + c.y) / 2;
          const cx = a.x < c.x ? mx - 20 : mx + 20;
          const hl = anyFocus && (actorIsHL({id: actorId}) || isHL(uc));
          const matches = (focusActor === actorId) || (focusUC === uc.id);
          const dim = anyFocus && !matches && !(focusActor && uc.actors.includes(focusActor) && actorId === focusActor) && !(focusUC === uc.id && actorId !== focusActor);
          return (
            <path
              key={`${uc.id}-${actorId}`}
              d={`M ${a.x} ${a.y} Q ${cx} ${my} ${c.x} ${c.y}`}
              className={`link ${matches ? 'hl' : ''} ${anyFocus && !matches ? 'dim' : ''}`}
            />
          );
        }))}
      </svg>

      {ACTORS.map(a => {
        const p = UC_ACTOR_POS[a.id];
        if (!p) return null;
        const hl = actorIsHL(a);
        const dim = anyFocus && !hl;
        return (
          <div
            key={a.id}
            className={`uc-actor ${hl ? 'hl' : ''} ${dim ? 'dim' : ''}`}
            style={{ left: p.x, top: p.y }}
            onMouseEnter={() => setHoverActor(a.id)}
            onMouseLeave={() => setHoverActor(null)}
            onClick={() => onSelect({ kind: 'actor', id: a.id })}
          >
            <ActorGlyph/>
            <div className="uc-actor-label">{a.label}</div>
          </div>
        );
      })}

      {USE_CASES.map(uc => {
        const p = UC_CASE_POS[uc.id];
        if (!p) return null;
        const color = GROUPS[uc.group]?.color || 'teal';
        const hl = isHL(uc);
        const dim = anyFocus && !hl;
        const sel = selected === uc.id;
        return (
          <div
            key={uc.id}
            className={`uc-case ${dim ? 'dim' : ''} ${sel ? 'sel' : ''}`}
            data-c={color}
            style={{ left: p.x, top: p.y }}
            onMouseEnter={() => setHoverUC(uc.id)}
            onMouseLeave={() => setHoverUC(null)}
            onClick={() => onSelect({ kind: 'uc', id: uc.id })}
          >
            <span className="uc-id">{uc.id}</span>
            <span>{uc.label}</span>
          </div>
        );
      })}
    </div>
    </div>
  );
}

window.UseCaseDiagram = UseCaseDiagram;
window.ActorGlyph = ActorGlyph;
window.Chip = Chip;
window.EmptySide = EmptySide;
