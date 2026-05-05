import { useState, useEffect } from "react";
import "./App.css";

const INSIGHTS_JSON_URL = "https://raw.githubusercontent.com/mgosnat/veille-ia/main/data/insights.json";

const DEFAULT_SOURCES = {
  agentique: ["arXiv cs.AI","Hugging Face Blog","LangChain Blog","The Batch","TLDR AI","The Rundown AI","Agents Weekly","r/LocalLLaMA","Latent Space (podcast)","AI Explained (YouTube)"],
  gouvernance: ["OECD AI Policy Observatory","AlgorithmWatch","MIT Sloan Review","EUR-Lex – EU AI Act","Import AI – Jack Clark","AI Governance Weekly","r/AIPolicy","Eye on AI (podcast)","The AI Law Podcast"],
  clinique: ["ClinicalTrials.gov","FDA Diversity Action Plan","EMA Guidelines","NEJM","JAMA Network","Nature Medicine","STAT News","ICH E17 guidelines","Applied Clinical Trials"]
};
const DEFAULT_KEYWORDS = {
  agentique: ["agentic AI","multi-agent","AutoGen","CrewAI","LangGraph","MCP protocol","agent framework","tool use","reasoning model"],
  gouvernance: ["AI governance","EU AI Act","ISO 42001","responsible AI","AI compliance","AI policy","algorithmic bias","AI audit"],
  clinique: ["clinical trial diversity","health equity","underrepresented populations","FDA diversity action plan","inclusive trial design","ICH E17","trial enrollment equity"]
};
const THEME_CONFIG = {
  agentique:   { label:"IA agentique",                 shortLabel:"Agentique",   color:"#16a34a", bgLight:"#dcfce7", textLight:"#15803d" },
  gouvernance: { label:"Gouvernance IA entreprise",    shortLabel:"Gouvernance", color:"#d97706", bgLight:"#fef9c3", textLight:"#854d0e" },
  clinique:    { label:"Diversité & essais cliniques", shortLabel:"Clinique",    color:"#0ea5e9", bgLight:"#e0f2fe", textLight:"#0369a1" }
};
const THEMES = ["agentique","gouvernance","clinique"];

function Panel({ tid, sources, keywords, insights, autoInsights, loading, error,
  onAnalyze, onSave, onAddSrc, onRemSrc, onAddKw, onRemKw }) {
  const cfg = THEME_CONFIG[tid];
  const [addSrc, setAddSrc] = useState(false);
  const [addKw,  setAddKw]  = useState(false);
  const [srcIn,  setSrcIn]  = useState("");
  const [kwIn,   setKwIn]   = useState("");
  const doAddSrc = () => { if(srcIn.trim()){ onAddSrc(tid,srcIn.trim()); setSrcIn(""); setAddSrc(false); } };
  const doAddKw  = () => { if(kwIn.trim()) { onAddKw(tid,kwIn.trim());   setKwIn("");  setAddKw(false);  } };
  const display = insights || autoInsights;
  const isAuto = !insights && !!autoInsights;

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="theme-badge" style={{background:cfg.bgLight,color:cfg.textLight}}>{cfg.label}</span>
        <button className="btn-analyze" onClick={()=>onAnalyze(tid)} disabled={loading}>
          {loading ? "Analyse en cours…" : "Analyser maintenant"}
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="label">Sources ({sources.length})</span>
          <button onClick={()=>setAddSrc(!addSrc)}>{addSrc?"Annuler":"+ Source"}</button>
        </div>
        {addSrc && <div className="add-row">
          <input value={srcIn} onChange={e=>setSrcIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doAddSrc()} placeholder="Nom de la source…" />
          <button onClick={doAddSrc}>OK</button>
        </div>}
        <div className="source-list">
          {sources.map((s,i)=>(
            <div key={i} className="source-item">
              <span>— {s}</span>
              <button className="btn-remove" onClick={()=>onRemSrc(tid,i)}>✕</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="label">Mots-clés</span>
          <button onClick={()=>setAddKw(!addKw)}>{addKw?"Annuler":"+ Mot-clé"}</button>
        </div>
        {addKw && <div className="add-row">
          <input value={kwIn} onChange={e=>setKwIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doAddKw()} placeholder="Nouveau mot-clé…" />
          <button onClick={doAddKw}>OK</button>
        </div>}
        <div className="kw-list">
          {keywords.map((kw,i)=>(
            <span key={i} className="kw-tag" style={{background:cfg.bgLight,color:cfg.textLight}}>
              {kw}<span className="kw-remove" onClick={()=>onRemKw(tid,i)}>✕</span>
            </span>
          ))}
        </div>
      </div>

      {error && <div className="error-box">Erreur : {error}</div>}

      {display && (
        <div className="insights">
          <div className="insights-header">
            <span className="label">Insights récents</span>
            {isAuto && <span className="auto-badge">— pipeline automatique</span>}
          </div>
          {display.map((item,i)=>(
            <div key={i} className="insight-card">
              <div className="insight-top">
                <p className="insight-title">
                  {item.url
                    ? <a href={item.url} target="_blank" rel="noreferrer">{item.titre}</a>
                    : item.titre}
                </p>
                <span className="pertinence" style={{
                  background:item.pertinence==="haute"?"#dcfce7":"#fef9c3",
                  color:item.pertinence==="haute"?"#15803d":"#854d0e"
                }}>{item.pertinence}</span>
              </div>
              <p className="insight-resume">{item.resume}</p>
              <div className="insight-footer">
                <div className="insight-meta">
                  <span className="insight-source">{item.source}</span>
                  {item.categorie && <span className="insight-cat">{item.categorie}</span>}
                </div>
                <button onClick={()=>onSave(item,tid)}>Sauvegarder</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [sources,  setSources]  = useState(DEFAULT_SOURCES);
  const [keywords, setKeywords] = useState(DEFAULT_KEYWORDS);
  const [insights, setInsights] = useState({agentique:null,gouvernance:null,clinique:null});
  const [autoInsights, setAutoInsights] = useState({agentique:null,gouvernance:null,clinique:null});
  const [loading,  setLoading]  = useState({agentique:false,gouvernance:false,clinique:false});
  const [errors,   setErrors]   = useState({agentique:null,gouvernance:null,clinique:null});
  const [saved,    setSaved]    = useState([]);
  const [showSaved,setShowSaved]= useState(false);
  const [autoDate, setAutoDate] = useState(null);
  const [autoLoading,setAutoLoading] = useState(true);

  useEffect(()=>{
    const s = localStorage.getItem("v3-sources"); if(s) setSources(JSON.parse(s));
    const k = localStorage.getItem("v3-keywords"); if(k) setKeywords(JSON.parse(k));
    const sv = localStorage.getItem("v3-saved"); if(sv) setSaved(JSON.parse(sv));
    fetch(INSIGHTS_JSON_URL)
      .then(r=>r.ok?r.json():null)
      .then(d=>{ if(d){ setAutoInsights(d.insights||{}); setAutoDate(d.date_fr||null); } })
      .catch(()=>{})
      .finally(()=>setAutoLoading(false));
  },[]);

  const persist = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  const analyze = async(tid)=>{
    setLoading(l=>({...l,[tid]:true})); setErrors(e=>({...e,[tid]:null})); setInsights(i=>({...i,[tid]:null}));
    try {
      const prefix = tid === "agentique" ? "Veille PRATIQUE sur" : "Veille sur";
      const focus = tid === "agentique" ? " Focus sur nouveaux outils, releases GitHub, retours builders, cas usage reels, tutoriels concrets. Evite articles theoriques." : "";
      const prompt = prefix + ' "' + THEME_CONFIG[tid].label + '".' + focus + ' Mots-cles: ' + keywords[tid].join(", ") + '. Dernieres 24-48h. Retourne UNIQUEMENT JSON: [{titre,resume,source,url,pertinence,categorie}] 8 items, resume en francais. JSON brut.';
      const r = await fetch("/api/claude",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:prompt}]})
      });
      const data = await r.json();
      const txt = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("").replace(/```json|```/g,"");
      const m = txt.match(/\[[\s\S]*\]/);
      if(!m) throw new Error("Pas de résultat structuré");
      setInsights(i=>({...i,[tid]:JSON.parse(m[0])}));
    } catch(e){ setErrors(err=>({...err,[tid]:e.message})); }
    setLoading(l=>({...l,[tid]:false}));
  };

  const onSave=async(item,tid)=>{ const ns=[{...item,themeId:tid,savedAt:new Date().toLocaleDateString("fr-FR"),id:Date.now()},...saved]; setSaved(ns); persist("v3-saved",ns); };
  const onRemoveSaved=(id)=>{ const ns=saved.filter(i=>i.id!==id); setSaved(ns); persist("v3-saved",ns); };
  const onAddSrc=(tid,val)=>{ const ns={...sources,[tid]:[...sources[tid],val]}; setSources(ns); persist("v3-sources",ns); };
  const onRemSrc=(tid,i)=>{ const ns={...sources,[tid]:sources[tid].filter((_,j)=>j!==i)}; setSources(ns); persist("v3-sources",ns); };
  const onAddKw=(tid,val)=>{ const nk={...keywords,[tid]:[...keywords[tid],val]}; setKeywords(nk); persist("v3-keywords",nk); };
  const onRemKw=(tid,i)=>{ const nk={...keywords,[tid]:keywords[tid].filter((_,j)=>j!==i)}; setKeywords(nk); persist("v3-keywords",nk); };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Tableau de veille IA</h1>
          <p className="date">{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
        </div>
        <div className="header-right">
          {autoLoading && <span className="loading-txt">Chargement pipeline…</span>}
          {autoDate && <span className="pipeline-badge">Pipeline : {autoDate}</span>}
        </div>
      </header>

      <div className="grid">
        {THEMES.map(tid=>(
          <Panel key={tid} tid={tid}
            sources={sources[tid]} keywords={keywords[tid]}
            insights={insights[tid]} autoInsights={autoInsights[tid]}
            loading={loading[tid]} error={errors[tid]}
            onAnalyze={analyze} onSave={onSave}
            onAddSrc={onAddSrc} onRemSrc={onRemSrc}
            onAddKw={onAddKw} onRemKw={onRemKw} />
        ))}
      </div>

      {saved.length>0 && (
        <div className="saved-section">
          <div className="saved-header" onClick={()=>setShowSaved(!showSaved)}>
            <span>Éléments sauvegardés ({saved.length})</span>
            <span>{showSaved?"Masquer ↑":"Afficher ↓"}</span>
          </div>
          {showSaved && saved.map(item=>(
            <div key={item.id} className="saved-item">
              <div className="saved-item-body">
                <div className="saved-item-meta">
                  <span className="theme-badge-sm" style={{background:THEME_CONFIG[item.themeId].bgLight,color:THEME_CONFIG[item.themeId].textLight}}>{THEME_CONFIG[item.themeId].shortLabel}</span>
                  <span className="saved-date">{item.savedAt}</span>
                </div>
                <p className="saved-title">{item.titre}</p>
                <p className="saved-source">{item.source}</p>
              </div>
              <button onClick={()=>onRemoveSaved(item.id)}>Retirer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
