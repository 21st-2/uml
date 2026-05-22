/* global React, ReactDOM */
const { useState: useS, useEffect: useE, useMemo: useM } = React;

const TABS = [
  { id: 'overview',   num: '00', label: 'Visão Geral' },
  { id: 'use-cases',  num: '01', label: 'Casos de Uso' },
  { id: 'classes',    num: '02', label: 'Classes' },
  { id: 'activities', num: '03', label: 'Atividades' },
  { id: 'sequence',   num: '04', label: 'Sequência' },
  { id: 'requirements', num: '05', label: 'Requisitos' },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#1F6B5E",
  "density": "comfortable",
  "showLegend": true
}/*EDITMODE-END*/;

function DetailsPanel({ selection, goTo, clear, editing, kind }) {
  const { ACTORS, USE_CASES, CLASSES, ACTIVITIES, SEQUENCE, RFS, GROUPS } = window.UPA;
  if (!selection) {
    // Different empty state per context
    if (kind === 'classes' && editing === false) {
      return (
        <div className="side-card">
          <h4>Diagrama de classes</h4>
          <div className="body" style={{ marginBottom: 12 }}>
            Visualização do modelo de domínio. Para editar, adicionar ou excluir classes, ative o <b>Modo edição</b>.
          </div>
          <div style={{ marginTop: 12, padding: 12, background: 'var(--paper-soft)', borderRadius: 4, fontSize: 12, color: 'var(--ink-mid)', lineHeight: 1.6 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-mute)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>livre navegação</div>
            • <b>Arraste o cabeçalho</b> de qualquer classe para reposicioná-la<br/>
            • <b>Arraste o fundo</b> para mover o canvas<br/>
            • <b>Scroll</b> ou botões <b>−</b>/<b>+</b> para zoom<br/>
            • <b>Selecione texto</b> nos campos de atributos/métodos e <b>Ctrl+C</b> para copiar
          </div>
        </div>
      );
    }
    if (kind === 'activities' && editing === false) {
      return (
        <div className="side-card">
          <h4>Diagrama de atividades</h4>
          <div className="body" style={{ marginBottom: 12 }}>
            Fluxo de atendimento da UPA 24h. Para selecionar, editar, adicionar ou excluir nós, ative o <b>Modo edição</b>.
          </div>
        </div>
      );
    }
    return (
      <div className="side-card">
        <h4>Detalhes</h4>
        <window.EmptySide title="Nenhuma seleção" desc="Passe o mouse ou clique em um elemento do diagrama para inspecionar."/>
      </div>
    );
  }

  if (selection.kind === 'actor') {
    const a = ACTORS.find(x => x.id === selection.id);
    const cases = USE_CASES.filter(u => u.actors.includes(a.id));
    return (
      <div className="side-card">
        <h4>Ator</h4>
        <div className="side-card-title">{a.label}</div>
        <div className="body" style={{ marginBottom: 12 }}>{a.desc}</div>
        <div className="field"><div className="field-k">tipo</div><div className="field-v">{a.kind}</div></div>
        <div className="field"><div className="field-k">casos</div><div className="field-v">{cases.length}</div></div>
        <h4 style={{ marginTop: 16 }}>Casos de uso vinculados</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {cases.map(u => (
            <button key={u.id} className="btn" style={{ padding: '4px 8px', fontSize: 11.5 }} onClick={() => goTo('use-cases', { kind: 'uc', id: u.id })}>
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--ink-mute)', fontSize: 10 }}>{u.id}</span> {u.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (selection.kind === 'uc') {
    const uc = USE_CASES.find(x => x.id === selection.id);
    const actors = ACTORS.filter(a => uc.actors.includes(a.id));
    const rfs = RFS.filter(r => uc.rfs.includes(r.id));
    return (
      <div className="side-card">
        <h4>Caso de uso</h4>
        <div className="side-card-title">{uc.label}</div>
        <div style={{ marginBottom: 12, marginTop: 6 }}><window.Chip group={uc.group}/></div>
        <div className="field"><div className="field-k">código</div><div className="field-v" style={{ fontFamily: 'var(--mono)' }}>{uc.id}</div></div>
        <div className="field"><div className="field-k">módulo</div><div className="field-v">{GROUPS[uc.group]?.label}</div></div>
        <div className="field"><div className="field-k">atores</div><div className="field-v">{actors.map(a => a.label).join(', ') || '—'}</div></div>
        <h4 style={{ marginTop: 16 }}>Requisitos vinculados</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rfs.map(r => (
            <div key={r.id} style={{ padding: 10, background: 'var(--paper-soft)', borderRadius: 4, fontSize: 12.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--teal-deep)', fontSize: 10.5 }}>{r.id}</span>
                <span style={{ fontWeight: 600 }}>{r.title}</span>
              </div>
              <div style={{ color: 'var(--ink-mid)', fontSize: 12, lineHeight: 1.5 }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (selection.kind === 'class') {
    const liveClasses = window.__classDiagramAPI?.classes || CLASSES;
    const c = liveClasses.find(x => x.id === selection.id);
    if (!c) return null;
    const api = window.__classDiagramAPI;

    if (editing && api) {
      return (
        <div className="side-card">
          <h4>Editar classe</h4>
          <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-mute)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Nome</label>
          <input className="search" defaultValue={c.id}
            onBlur={(e) => api.renameClass(c.id, e.target.value.trim())}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}/>
          <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-mute)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4, marginTop: 14 }}>Estereótipo</label>
          <select className="search" value={c.stereotype || 'entity'}
            onChange={(e) => api.updateClass(c.id, { stereotype: e.target.value })}>
            <option value="entity">entity</option>
            <option value="abstract">abstract</option>
          </select>
          <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-mute)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4, marginTop: 14 }}>Atributos · um por linha</label>
          <textarea className="search" rows="6"
            defaultValue={c.attrs.join('\n')}
            onBlur={(e) => api.updateClass(c.id, { attrs: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
            style={{ fontFamily: 'var(--mono)', fontSize: 11.5, resize: 'vertical' }}/>
          <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-mute)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4, marginTop: 14 }}>Métodos · um por linha</label>
          <textarea className="search" rows="4"
            defaultValue={c.methods.join('\n')}
            onBlur={(e) => api.updateClass(c.id, { methods: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
            style={{ fontFamily: 'var(--mono)', fontSize: 11.5, resize: 'vertical' }}/>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn" onClick={() => api.deleteClass(c.id)} style={{ color: 'var(--c-coral)', borderColor: 'var(--c-coral)' }}>Excluir classe</button>
          </div>
          <div style={{ marginTop: 14, padding: 10, background: 'var(--paper-soft)', borderRadius: 4, fontSize: 11.5, color: 'var(--ink-mid)', lineHeight: 1.5 }}>
            <b>Convenções UML:</b><br/>
            <code style={{ fontFamily: 'var(--mono)' }}>- nome: Tipo</code> · privado<br/>
            <code style={{ fontFamily: 'var(--mono)' }}>+ metodo(): Tipo</code> · público
          </div>
        </div>
      );
    }

    return (
      <div className="side-card">
        <h4>Classe</h4>
        <div className="side-card-title">{c.id}</div>
        {c.stereotype === 'abstract' && <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--teal-deep)', marginBottom: 8 }}>«abstract»</div>}
        <h4 style={{ marginTop: 12 }}>Atributos</h4>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
          {c.attrs.map((a, i) => <div key={i}>{a}</div>)}
        </div>
        <h4 style={{ marginTop: 16 }}>Métodos</h4>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
          {c.methods.length ? c.methods.map((m, i) => <div key={i}>{m}</div>) : <div style={{ color: 'var(--ink-faint)' }}>—</div>}
        </div>
      </div>
    );
  }

  if (selection.kind === 'activity') {
    const liveNodes = window.__activityDiagramAPI?.nodes || ACTIVITIES;
    const a = liveNodes.find(x => x.id === selection.id);
    if (!a) return null;
    const api = window.__activityDiagramAPI;

    if (editing && api) {
      return (
        <div className="side-card">
          <h4>Editar atividade</h4>
          <div style={{ marginBottom: 12, fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-mute)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            tipo: {a.kind}
          </div>
          {a.kind !== 'merge' && (
            <>
              <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-mute)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Rótulo</label>
              <input className="search" defaultValue={a.label || ''}
                onBlur={(e) => api.updateNode(a.id, { label: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}/>
            </>
          )}
          {a.kind === 'action' && (
            <>
              <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-mute)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4, marginTop: 14 }}>RFs vinculados</label>
              <input className="search" defaultValue={a.rf || ''} placeholder="ex: RF05–RF07"
                onBlur={(e) => api.updateNode(a.id, { rf: e.target.value.trim() || undefined })}
                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                style={{ fontFamily: 'var(--mono)', fontSize: 12 }}/>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" defaultChecked={!!a.urgent}
                  onChange={(e) => api.updateNode(a.id, { urgent: e.target.checked })}/>
                <span>Marcar como urgente (coral)</span>
              </label>
            </>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn" onClick={() => api.deleteNode(a.id)} style={{ color: 'var(--c-coral)', borderColor: 'var(--c-coral)' }}>
              Excluir nó
            </button>
          </div>
          <div style={{ marginTop: 14, padding: 10, background: 'var(--paper-soft)', borderRadius: 4, fontSize: 11.5, color: 'var(--ink-mid)', lineHeight: 1.5 }}>
            <b>Dica:</b> arraste o nó no diagrama para reposicionar. Os conectores recalculam automaticamente.
          </div>
        </div>
      );
    }

    return (
      <div className="side-card">
        <h4>Atividade</h4>
        <div className="side-card-title">{a.label || (a.kind === 'merge' ? 'Merge node' : '—')}</div>
        <div className="field"><div className="field-k">tipo</div><div className="field-v">{a.kind}</div></div>
        {a.rf && <div className="field"><div className="field-k">RFs</div><div className="field-v" style={{ fontFamily: 'var(--mono)' }}>{a.rf}</div></div>}
        {a.urgent && <div className="field"><div className="field-k">prioridade</div><div className="field-v" style={{ color: 'var(--c-coral)' }}>Alta · prioritário</div></div>}
        <h4 style={{ marginTop: 16 }}>Sobre esta etapa</h4>
        <div className="body">
          {a.kind === 'start' && 'Marco inicial do fluxo de atendimento.'}
          {a.kind === 'end' && 'Marco final. O caso é encerrado e indicadores atualizados.'}
          {a.kind === 'decision' && 'Ponto de decisão. O sistema avalia a condição e ramifica o fluxo.'}
          {a.kind === 'merge' && 'Nó de merge: convergência de duas ou mais ramificações em um único caminho.'}
          {a.kind === 'action' && 'Ação executada por um ator ou pelo sistema.'}
        </div>
      </div>
    );
  }

  if (selection.kind === 'seq') {
    const m = SEQUENCE[selection.id];
    if (!m) return null;
    const fromLane = window.UPA.SEQ_LANES.find(l => l.id === m.from);
    const toLane = window.UPA.SEQ_LANES.find(l => l.id === m.to);
    return (
      <div className="side-card">
        <h4>Mensagem</h4>
        <div className="side-card-title" style={{ fontFamily: 'var(--mono)', fontSize: 18 }}>{m.label}</div>
        <div className="field"><div className="field-k">de</div><div className="field-v">{fromLane?.label}</div></div>
        <div className="field"><div className="field-k">para</div><div className="field-v">{toLane?.label}</div></div>
        <div className="field"><div className="field-k">tipo</div><div className="field-v">{m.kind === 'return' ? 'retorno (assíncrono)' : 'síncrona'}</div></div>
        {m.rf && <div className="field"><div className="field-k">RFs</div><div className="field-v" style={{ fontFamily: 'var(--mono)' }}>{m.rf}</div></div>}
        {m.alt && <div className="field"><div className="field-k">frame</div><div className="field-v">alt · {m.alt}</div></div>}
      </div>
    );
  }

  return null;
}

function Legend() {
  const { GROUPS } = window.UPA;
  return (
    <div className="legend">
      {Object.entries(GROUPS).map(([k, g]) => (
        <div key={k} className="legend-item">
          <span className="legend-swatch" style={{ background: `var(--c-${g.color}-soft)`, borderColor: `var(--c-${g.color})` }}/>
          <span>{g.label}</span>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [tab, setTab] = useS('overview');
  const [selection, setSelection] = useS(null);
  const [reqInitialGroup, setReqInitialGroup] = useS(null);
  const [hoverActor, setHoverActor] = useS(null);
  const [editingClasses, setEditingClassesRaw] = useS(false);
  const [editingActivities, setEditingActivitiesRaw] = useS(false);
  const setEditingClasses = (v) => { setEditingClassesRaw(v); if (!v) setSelection(null); };
  const setEditingActivities = (v) => { setEditingActivitiesRaw(v); if (!v) setSelection(null); };

  // Tweaks
  const [t, setTweak] = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}];

  // Apply accent live
  useE(() => {
    document.documentElement.style.setProperty('--teal', t.accent);
  }, [t.accent]);

  // Apply density
  useE(() => {
    document.documentElement.style.setProperty('--shell-pad', t.density === 'compact' ? '32px' : '56px');
  }, [t.density]);

  const goTo = (newTab, sel) => {
    setTab(newTab);
    if (newTab === 'requirements' && sel?.group) setReqInitialGroup(sel.group);
    else setSelection(sel || null);
    window.scrollTo({ top: 0 });
  };

  const onSelect = (sel) => setSelection(sel);

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead-top">
          <div className="brand">
            <div className="brand-mark">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M14 3h-4v7H3v4h7v7h4v-7h7v-4h-7V3z" fill="currentColor"/>
              </svg>
            </div>
            <div className="brand-text">
              <div className="kicker">IFMA · Sistemas de Informação · Empreendedorismo G2</div>
              <h1>Sistema Inteligente de Agendamento <em>· UPA 24h</em></h1>
            </div>
          </div>
          <div className="masthead-meta">
            <div className="meta-row"><span>VERSÃO</span><span className="v">1.0</span></div>
            <div className="meta-row"><span>UML</span><span className="v">2.5</span></div>
            <div className="meta-row"><span>ATUALIZADO</span><span className="v">2026</span></div>
          </div>
        </div>
        <nav className="nav">
          {TABS.map(tt => (
            <button key={tt.id} className={`nav-item ${tab === tt.id ? 'active' : ''}`} onClick={() => goTo(tt.id)}>
              <span className="num">{tt.num}</span>
              <span>{tt.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {tab === 'overview' && (
          <window.Overview goTo={goTo}/>
        )}

        {tab === 'use-cases' && (
          <div>
            <div className="section-head">
              <div>
                <div className="section-eyebrow">01 · Casos de Uso · UML 2.5</div>
                <h2 className="section-title">Quem usa o sistema e o <em>que</em> faz</h2>
                <p className="section-lede">
                  Seis atores interagem com 19 casos de uso dentro da fronteira do sistema.
                  Passe o mouse sobre um ator para destacar seus casos; clique em uma elipse
                  para ver os requisitos vinculados.
                </p>
              </div>
              <div className="section-aside">
                <div><b>06</b> atores</div>
                <div><b>19</b> casos de uso</div>
                <div><b>35</b> RFs vinculados</div>
              </div>
            </div>
            {t.showLegend && <Legend/>}
            <div className="split">
              <window.UseCaseDiagram onSelect={onSelect} selected={selection?.kind === 'uc' ? selection.id : null}
                hoverActor={hoverActor} setHoverActor={setHoverActor}/>
              <div className="side">
                <DetailsPanel selection={selection} goTo={goTo} clear={() => setSelection(null)}/>
              </div>
            </div>
          </div>
        )}

        {tab === 'classes' && (
          <div>
            <div className="section-head">
              <div>
                <div className="section-eyebrow">02 · Diagrama de Classes · Modelo de Domínio</div>
                <h2 className="section-title">O <em>modelo</em> de domínio</h2>
                <p className="section-lede">
                  Onze classes, três especializações via herança e relacionamentos com multiplicidade.
                  Passe o mouse sobre uma classe para destacar suas conexões.
                </p>
              </div>
              <div className="section-aside">
                <div><b>11</b> classes</div>
                <div><b>03</b> heranças</div>
                <div><b>08</b> associações</div>
              </div>
            </div>
            <div className="split">
              <window.ClassDiagram onSelect={onSelect} selected={selection?.kind === 'class' ? selection.id : null}
                editing={editingClasses} setEditing={setEditingClasses}/>
              <div className="side">
                <DetailsPanel selection={selection} goTo={goTo} clear={() => setSelection(null)} editing={editingClasses} kind="classes"/>
              </div>
            </div>
          </div>
        )}

        {tab === 'activities' && (
          <div>
            <div className="section-head">
              <div>
                <div className="section-eyebrow">03 · Diagrama de Atividades · Fluxo de Atendimento</div>
                <h2 className="section-title">Do paciente que chega ao <em>encerramento</em></h2>
                <p className="section-lede">
                  Quinze ações, três pontos de decisão e uma rota prioritária. Clique em uma ação
                  para ver seus RFs e contexto.
                </p>
              </div>
              <div className="section-aside">
                <div><b>15</b> ações</div>
                <div><b>03</b> decisões</div>
                <div><b>1</b> rota urgente</div>
              </div>
            </div>
            <div className="split">
              <window.ActivityDiagram onSelect={onSelect} selected={selection?.kind === 'activity' ? selection.id : null}
                editing={editingActivities} setEditing={setEditingActivities}/>
              <div className="side">
                <DetailsPanel selection={selection} goTo={goTo} clear={() => setSelection(null)} editing={editingActivities} kind="activities"/>
              </div>
            </div>
          </div>
        )}

        {tab === 'sequence' && (
          <div>
            <div className="section-head">
              <div>
                <div className="section-eyebrow">04 · Diagrama de Sequência · Agendamento de Exame</div>
                <h2 className="section-title">A <em>conversa</em> entre paciente, sistema e equipe</h2>
                <p className="section-lede">
                  Cenário principal: paciente entra na UPA, passa por triagem e consulta, médico
                  solicita exame, sistema agenda e notifica. Use o controle de tempo para passo-a-passo.
                </p>
              </div>
              <div className="section-aside">
                <div><b>{window.UPA.SEQUENCE.length}</b> mensagens</div>
                <div><b>7</b> participantes</div>
                <div><b>1</b> alt frame</div>
              </div>
            </div>
            <div className="split">
              <window.SequenceDiagram onSelect={onSelect} selected={selection?.kind === 'seq' ? selection.id : null}/>
              <div className="side">
                <DetailsPanel selection={selection} goTo={goTo} clear={() => setSelection(null)}/>
              </div>
            </div>
          </div>
        )}

        {tab === 'requirements' && (
          <window.Requirements initialGroup={reqInitialGroup}/>
        )}
      </main>

      <footer className="footer">
        <span>IFMA · <b>Sistemas de Informação</b> · Empreendedorismo e Inovação G2 · 2026</span>
        <span>UML 2.5 · 4 diagramas · 35 RFs · 22 RNFs</span>
      </footer>

      {/* Tweaks Panel */}
      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection label="Aparência">
            <window.TweakColor label="Cor de destaque"
              value={t.accent}
              options={['#1F6B5E', '#134E45', '#3565A8', '#6A4F9A', '#B26A1C', '#B6493B']}
              onChange={v => setTweak('accent', v)}
            />
            <window.TweakRadio label="Densidade"
              value={t.density}
              options={[{value: 'compact', label: 'Compacto'}, {value: 'comfortable', label: 'Confortável'}]}
              onChange={v => setTweak('density', v)}
            />
            <window.TweakToggle label="Mostrar legenda nos diagramas"
              value={t.showLegend}
              onChange={v => setTweak('showLegend', v)}
            />
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
