import { useEffect, useRef, useState } from 'react'
import {
  ArrowDownRight,
  ArrowRight,
  AudioLines,
  Bot,
  Check,
  ChevronDown,
  CircleHelp,
  CloudSun,
  Droplets,
  FileImage,
  Globe2,
  HeartPulse,
  Home,
  Leaf,
  Menu,
  Mic,
  ScanLine,
  Search,
  ShieldCheck,
  Sprout,
  Sun,
  Upload,
  Volume2,
  Wheat,
  X,
} from 'lucide-react'
import { askAssistant, createFarmer, getFarmer, getPlantInfo, getPlantLibrary, scanPlant } from './api'
import { getLanguage, languages } from './languages'
import { usePageTranslation } from './usePageTranslation'
import './App.css'

function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
      <span className="brand-mark"><Sprout size={24} strokeWidth={2.5} /></span>
      <span className="brand-copy">
        <strong>CropDoctor AI</strong>
        <small>Smart Farming. Better Tomorrow.</small>
      </span>
    </div>
  )
}

function LanguageSelector({ languageCode, onChange, landing = false }) {
  return (
    <label className={landing ? 'language-button' : 'language-select-label'} data-no-translate>
      <Globe2 size={15} />
      <select aria-label="Choose website language" onChange={(event) => onChange(event.target.value)} value={languageCode}>
        {languages.map((language) => <option key={language.code} value={language.code}>{language.nativeName}</option>)}
      </select>
      <ChevronDown size={landing ? 14 : 13} />
    </label>
  )
}

function NameGate({ initialName, onChoose, onCancel, error, busy, languageCode, onLanguageChange }) {
  const [name, setName] = useState(initialName || '')

  function submit(event) {
    event.preventDefault()
    onChoose(name)
  }

  return (
    <main className="name-gate">
      <section className="name-card">
        <div className="name-card-top"><Brand /><LanguageSelector languageCode={languageCode} onChange={onLanguageChange} /></div>
        <div className="name-icon"><Sprout size={26} /></div>
        <h1>Welcome, Farmer!</h1>
        <p>Enter your name to open your plant dashboard. Your scans and chats are saved under this name.</p>
        <form onSubmit={submit}>
          <label htmlFor="farmer-name">Your name</label>
          <input
            id="farmer-name"
            autoComplete="name"
            maxLength={60}
            minLength={2}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Asha"
            required
            value={name}
          />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary" disabled={busy} type="submit">
            {busy ? 'Opening your dashboard…' : 'Continue'} <ArrowRight size={16} />
          </button>
        </form>
        <small className="privacy-note">No password or account is created. Names are not private logins—anyone entering the same name can see that name&apos;s saved data on this server.</small>
        {onCancel && <button className="cancel-name" onClick={onCancel} type="button">Cancel</button>}
      </section>
    </main>
  )
}

function LandingPage({ openDashboard, openScan, openLibrary, openHistory, openAssistant, languageCode, onLanguageChange }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <header className="site-header">
          <Brand />
          <button
            className="mobile-menu-button"
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <nav className={`landing-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            <button className="nav-pill active" onClick={openDashboard} type="button"><Home size={15} /> Home</button>
            <button onClick={openScan} type="button"><ScanLine size={15} /> Identify Plant</button>
            <button onClick={openLibrary} type="button"><Leaf size={15} /> Plant Library</button>
            <button onClick={openHistory} type="button"><Search size={15} /> Scan History</button>
            <button onClick={openAssistant} type="button"><Bot size={15} /> AI Plant Assistant</button>
          </nav>
          <LanguageSelector languageCode={languageCode} onChange={onLanguageChange} landing />
        </header>

        <div className="hero-content">
          <div className="hero-copy">
            <span className="eyebrow"><Sprout size={15} /> GROW WITH CONFIDENCE</span>
            <h1>Your Plant&apos;s Health,<br /><span>Powered by AI</span> <Leaf className="title-leaf" size={33} /></h1>
            <p>Identify any plant, discover its health conditions<br className="desktop-break" /> and get intelligent care guidance in your own language.</p>
            <div className="hero-actions">
              <button className="button button-primary" type="button" onClick={openScan}><ScanLine size={17} /> Scan Your Plant <ArrowRight size={16} /></button>
              <button className="button button-secondary" type="button" onClick={openLibrary}><Leaf size={16} /> Explore Plant Library</button>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-lower">
        <div className="how-section">
          <div className="section-heading">
            <h2><Leaf size={19} /> How It Works?</h2>
            <p>Get expert plant advice in just 3 simple steps</p>
          </div>
          <div className="steps-row">
            <Step number="1" icon={<FileImage />} title="Upload or Capture" detail="Take a photo or upload an image of your plant" />
            <ArrowRight className="step-arrow" size={18} />
            <Step number="2" icon={<Search />} title="Get Analysis" detail="Our AI will identify and analyze your plant" />
            <ArrowRight className="step-arrow" size={18} />
            <Step number="3" icon={<Sun />} title="Receive Guidance" detail="Get detailed care tips, disease treatment & more" />
          </div>
        </div>
        <div className="supported-card">
          <h3><Sprout size={18} /> Supported Plants</h3>
          <p>From crops to garden plants</p>
          <div className="crop-list">
            <Crop emoji="🍅" name="Tomato" />
            <Crop emoji="🌾" name="Rice" />
            <Crop emoji="🌽" name="Wheat" />
            <Crop emoji="🌿" name="Corn" />
            <Crop emoji="🧄" name="Cotton" />
          </div>
          <button className="small-dark-button" onClick={openLibrary} type="button">Explore More <ArrowRight size={13} /></button>
        </div>
        <div className="impact-card">
          <h3><Globe2 size={19} /> Global Agriculture Impact</h3>
          <p>Smarter plant care starts<br />with every farmer.</p>
          <div className="impact-stats"><div><strong>AI</strong><span>Plant insights</span></div><div><strong>24/7</strong><span>Care guidance</span></div></div>
        </div>
      </section>
      <footer className="landing-footer"><Leaf size={14} /> Smart Agriculture <span>•</span> Sustainable Future <Leaf size={14} /></footer>
    </main>
  )
}

function Step({ number, icon, title, detail }) {
  return <div className="step"><span className="step-number">{number}</span><span className="step-icon">{icon}</span><strong>{title}</strong><small>{detail}</small></div>
}

function Crop({ emoji, name }) {
  return <div className="crop"><span>{emoji}</span><small>{name}</small></div>
}

function Dashboard({
  farmer,
  data,
  onDataChange,
  activeSection,
  setActiveSection,
  onChangeName,
  onHome,
  languageCode,
  onLanguageChange,
}) {
  const [chatText, setChatText] = useState('')
  const [scanBusy, setScanBusy] = useState(false)
  const [chatBusy, setChatBusy] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [selectedScanId, setSelectedScanId] = useState('')
  const [libraryState, setLibraryState] = useState({ farmer: '', plants: [] })
  const [selectedPlant, setSelectedPlant] = useState(null)
  const [plantSearch, setPlantSearch] = useState('')
  const [plantInfoBusy, setPlantInfoBusy] = useState(false)
  const [plantInfoError, setPlantInfoError] = useState('')
  const [targetPlantForScan, setTargetPlantForScan] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const uploadRef = useRef(null)
  const chatInputRef = useRef(null)
  const plantInfoRequest = useRef(0)
  const latestScan = data.scans[0]
  const activeScan = data.scans.find((scan) => scan.id === selectedScanId) || latestScan
  const analysis = activeScan?.analysis
  const healthyCount = data.scans.filter((scan) => scan.analysis.healthy).length
  const diseaseCount = data.scans.filter((scan) => !scan.analysis.healthy).length
  const displayedError = error
  const libraryBusy = activeSection === 'library' && libraryState.farmer !== farmer

  useEffect(() => {
    if (activeSection !== 'library' || libraryState.farmer === farmer) return
    let active = true
    getPlantLibrary(farmer)
      .then((result) => { if (active) setLibraryState({ farmer, plants: result.plants }) })
      .catch((requestError) => { if (active) setError(requestError.message) })
    return () => { active = false }
  }, [activeSection, farmer, libraryState.farmer])

  function updateError(message) {
    setError(message)
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      updateError('Choose a JPEG, PNG, or WebP plant photo.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      updateError('Photo must be 8 MB or smaller.')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setActiveSection('scan')
    setScanBusy(true)
    updateError('')
    try {
      const { scan } = await scanPlant(farmer, file, languageCode, targetPlantForScan)
      onDataChange((current) => ({ ...current, scans: [scan, ...current.scans] }))
      setSelectedScanId(scan.id)
      setPreviewUrl('')
    } catch (requestError) {
      setPreviewUrl('')
      updateError(requestError.message)
    } finally {
      URL.revokeObjectURL(objectUrl)
      setScanBusy(false)
      setTargetPlantForScan('')
    }
  }

  async function sendMessage(event) {
    event.preventDefault()
    const message = chatText.trim()
    if (!message || chatBusy) return
    setChatBusy(true)
    updateError('')
    try {
      const result = await askAssistant(farmer, message, languageCode)
      onDataChange((current) => ({ ...current, messages: result.messages }))
      setChatText('')
    } catch (requestError) {
      updateError(requestError.message)
    } finally {
      setChatBusy(false)
      chatInputRef.current?.focus()
    }
  }

  function useSpeechInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      updateError('Voice input is not supported in this browser. Type your question instead.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = getLanguage(languageCode).speechLocale
    recognition.onresult = (event) => setChatText(event.results[0][0].transcript)
    recognition.onerror = () => updateError('Voice input could not be captured. Please try again or type your question.')
    recognition.start()
  }

  function readAloud() {
    if (!window.speechSynthesis) {
      updateError('Audio playback is not supported in this browser.')
      return
    }
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const content = analysis
      ? `${analysis.plantName}. ${analysis.healthy ? 'Plant appears healthy.' : `Possible issue: ${analysis.diseaseName}.`} ${analysis.symptoms} ${analysis.recommendations.join('. ')}`
      : 'Welcome to CropDoctor AI. Upload a plant photo to get a plant health analysis.'
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.lang = getLanguage(languageCode).speechLocale
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  function navigate(section) {
    setActiveSection(section)
    setError('')
  }

  function beginScan(plantName = '') {
    setTargetPlantForScan(plantName)
    navigate('scan')
    uploadRef.current?.click()
  }

  async function showPlantInfo(plantName) {
    const requestId = ++plantInfoRequest.current
    setSelectedPlant(null)
    setPlantInfoError('')
    setPlantInfoBusy(true)
    setPlantSearch(plantName)
    try {
      const result = await getPlantInfo(plantName, languageCode)
      if (requestId === plantInfoRequest.current) setSelectedPlant(result.plant)
    } catch (requestError) {
      if (requestId === plantInfoRequest.current) setPlantInfoError(requestError.message)
    } finally {
      if (requestId === plantInfoRequest.current) setPlantInfoBusy(false)
    }
  }

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <button className="sidebar-brand" onClick={onHome} type="button" aria-label="Go to CropDoctor home"><Brand compact /></button>
        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          <button className={`sidebar-link ${activeSection === 'overview' ? 'selected' : ''}`} onClick={() => navigate('overview')} type="button"><Home size={18} /> Overview</button>
          <button className={`sidebar-link ${activeSection === 'scan' ? 'selected' : ''}`} onClick={() => beginScan()} type="button"><ScanLine size={18} /> Scan Plant</button>
          <button className={`sidebar-link ${activeSection === 'library' ? 'selected' : ''}`} onClick={() => navigate('library')} type="button"><Leaf size={18} /> Plant Library</button>
          <button className={`sidebar-link ${activeSection === 'history' ? 'selected' : ''}`} onClick={() => navigate('history')} type="button"><AudioLines size={18} /> Scan History</button>
          <button className={`sidebar-link ${activeSection === 'assistant' ? 'selected' : ''}`} onClick={() => { navigate('assistant'); setTimeout(() => chatInputRef.current?.focus(), 0) }} type="button"><Bot size={18} /> AI Assistant</button>
          <button className={`sidebar-link ${activeSection === 'about' ? 'selected' : ''}`} onClick={() => navigate('about')} type="button"><CircleHelp size={18} /> About</button>
        </nav>
        <div className="sidebar-bottom"><Sprout size={28} /><strong>Healthy Plants<br />Healthy Planet</strong></div>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div><h1>👋 <span>Hello, </span><span data-no-translate>{farmer}!</span></h1><p>Your plant scans and advice are saved to this name. <Sprout size={15} /></p></div>
          <div className="header-actions">
            <LanguageSelector languageCode={languageCode} onChange={onLanguageChange} />
            <button className="audio-button" onClick={readAloud} type="button"><Volume2 size={15} /> {speaking ? 'Stop Audio' : 'Read Aloud'}</button>
            <button className="farmer-switch" onClick={onChangeName} type="button" title="Switch farmer name"><span>{farmer.slice(0, 1).toUpperCase()}</span><strong>Change name</strong></button>
          </div>
        </header>

        {displayedError && <div className="app-alert" role="alert"><span>{displayedError}</span><button aria-label="Dismiss error" onClick={() => setError('')} type="button"><X size={16} /></button></div>}

        <div className="stat-grid">
          <StatCard icon={<Leaf />} label="Total Scans" value={data.scans.length} change="" variant="green" />
          <StatCard icon={<ShieldCheck />} label="Healthy Plants" value={healthyCount} change="" variant="emerald" />
          <StatCard icon={<span className="bug-icon">🐞</span>} label="Possible Issues" value={diseaseCount} change="" variant="red" />
          <StatCard icon={<Sprout />} label="Saved Advice" value={data.messages.filter((message) => message.role === 'assistant').length} change="" variant="gold" />
        </div>

        <input ref={uploadRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} />
        <div className="dashboard-grid">
          {activeSection === 'overview' && (
            <>
              <ScanResultPanel scan={activeScan} previewUrl={previewUrl} busy={scanBusy} onUpload={() => uploadRef.current?.click()} onHistory={() => navigate('history')} />
              <CarePanel analysis={analysis} onDetails={() => beginScan(analysis?.plantName || '')} />
              <LifecyclePanel analysis={analysis} languageCode={languageCode} />
              <ImpactPanel />
              <AssistantPanel messages={data.messages} input={chatText} setInput={setChatText} onSend={sendMessage} busy={chatBusy} inputRef={chatInputRef} onVoice={useSpeechInput} />
            </>
          )}
          {activeSection === 'scan' && (
            <>
              <ScanResultPanel scan={activeScan} previewUrl={previewUrl} busy={scanBusy} onUpload={() => uploadRef.current?.click()} onHistory={() => navigate('history')} />
              <CarePanel analysis={analysis} onDetails={() => beginScan(analysis?.plantName || '')} />
              <LifecyclePanel analysis={analysis} languageCode={languageCode} />
              <div className="panel scan-help"><ScanLine size={25} /><h2>{targetPlantForScan ? `Scan ${targetPlantForScan}` : 'Scan a plant photo'}</h2><p>{targetPlantForScan ? `Upload a clear photo of ${targetPlantForScan}. The AI will only provide care guidance for this selected plant and reject a photo that does not match.` : 'Choose a clear JPEG, PNG, or WebP image up to 8 MB. The AI will identify the plant, assess visible health signs, and suggest care steps.'}</p><button className="care-button" disabled={scanBusy} onClick={() => uploadRef.current?.click()} type="button"><Upload size={14} /> {scanBusy ? 'Analyzing photo…' : 'Choose plant photo'}</button></div>
              <AssistantPanel messages={data.messages} input={chatText} setInput={setChatText} onSend={sendMessage} busy={chatBusy} inputRef={chatInputRef} onVoice={useSpeechInput} />
            </>
          )}
          {activeSection === 'history' && <HistoryPanel scans={data.scans} onSelect={(scan) => { setSelectedScanId(scan.id); navigate('overview') }} onUpload={() => { navigate('scan'); uploadRef.current?.click() }} />}
          {activeSection === 'library' && <LibraryPanel plants={libraryState.plants} loading={libraryBusy} selectedPlant={selectedPlant} search={plantSearch} onSearchChange={setPlantSearch} onSearch={(event) => { event.preventDefault(); if (plantSearch.trim()) showPlantInfo(plantSearch.trim()) }} onSelect={showPlantInfo} onScan={beginScan} infoBusy={plantInfoBusy} infoError={plantInfoError} />}
          {activeSection === 'assistant' && <AssistantPanel messages={data.messages} input={chatText} setInput={setChatText} onSend={sendMessage} busy={chatBusy} inputRef={chatInputRef} onVoice={useSpeechInput} expanded />}
          {activeSection === 'about' && <AboutPanel />}
        </div>
      </section>
    </main>
  )
}

function ScanResultPanel({ scan, previewUrl, busy, onUpload, onHistory }) {
  const analysis = scan?.analysis
  const image = previewUrl || scan?.imageUrl
  return (
    <section className="panel result-panel">
      <div className="panel-heading"><h2><Leaf size={16} /> {analysis ? 'Plant Scan Result' : 'Recent Scan Result'}</h2><button className="text-link" onClick={onHistory} type="button">View History <ArrowRight size={13} /></button></div>
      <div className="scan-result">
        <button className={`result-photo ${!image ? 'empty-photo' : ''}`} disabled={busy} type="button" onClick={onUpload} aria-label="Choose a plant photo">
          {image ? <img src={image} alt={analysis ? `${analysis.plantName} scan` : 'Selected plant photo'} /> : <span className="photo-prompt"><Upload size={21} /> Choose a photo</span>}
          <span>{busy ? 'Analyzing with AI…' : analysis ? new Date(scan.createdAt).toLocaleString() : 'JPEG, PNG or WebP · max 8 MB'}</span>
        </button>
        {analysis
          ? <div className="result-details">
            <h3>{analysis.plantName}</h3><i>{analysis.scientificName || 'Scientific name unavailable'}</i>
            <span className={`disease-badge ${analysis.healthy ? 'healthy-badge' : ''}`}><span /> {analysis.healthy ? 'No visible issue found' : `${analysis.severity} risk${analysis.confidence === null ? '' : ` · ${analysis.confidence}% confidence`}`}</span>
            <div className="disease-info"><strong>{analysis.healthy ? 'Plant looks healthy' : analysis.diseaseName}</strong><small>{analysis.symptoms || 'No visual symptoms were described.'}</small></div>
            <strong className="recommend-title">AI care recommendations</strong>
            <ul className="recommend-list">{analysis.recommendations.map((recommendation, index) => <li key={`${index}-${recommendation}`}><Check size={12} /> {recommendation}</li>)}</ul>
          </div>
          : <div className="empty-result"><strong>{busy ? 'Checking your plant…' : 'No scan yet'}</strong><span>{busy ? 'The AI is analyzing the photo.' : 'Upload a plant photo to get a real AI analysis.'}</span></div>}
      </div>
    </section>
  )
}

function CarePanel({ analysis, onDetails }) {
  const care = analysis?.care
  return (
    <section className="panel care-panel">
      <div className="panel-heading"><h2><Sprout size={16} /> Plant Care Guide</h2></div>
      <CareItem icon={<CloudSun />} title="Temperature" value={care?.temperature || 'Scan a plant first'} />
      <CareItem icon={<Sun />} title="Sunlight" value={care?.sunlight || 'Scan a plant first'} />
      <CareItem icon={<Droplets />} title="Water" value={care?.water || 'Scan a plant first'} />
      <CareItem icon={<Wheat />} title="Soil pH" value={care?.soilPh || 'Scan a plant first'} />
      <CareItem icon={<Sprout />} title="Fertilizer" value={care?.fertilizer || 'Scan a plant first'} />
      <button className="care-button" onClick={onDetails} type="button">Scan a plant for care advice <ArrowRight size={13} /></button>
    </section>
  )
}

function LifecyclePanel({ analysis, languageCode }) {
  const [plantLifecycle, setPlantLifecycle] = useState({ plantName: '', languageCode: '', steps: [] })
  const [lifecycleError, setLifecycleError] = useState({ plantName: '', languageCode: '', message: '' })
  const savedStages = analysis?.lifecycle || []
  const savedStagesHaveDetails = savedStages.some((stage) => typeof stage === 'object' && stage.details)
  const hasLoadedPlantLifecycle = plantLifecycle.plantName === analysis?.plantName && plantLifecycle.languageCode === languageCode
  const loadedStages = hasLoadedPlantLifecycle
    ? plantLifecycle.steps
    : []
  const stages = savedStagesHaveDetails ? savedStages : loadedStages.length ? loadedStages : savedStages
  const hasDetails = stages.some((stage) => typeof stage === 'object' && stage.details)
  const error = lifecycleError.plantName === analysis?.plantName && lifecycleError.languageCode === languageCode
    ? lifecycleError.message
    : ''
  const loading = Boolean(analysis?.plantName) && !savedStagesHaveDetails && !hasLoadedPlantLifecycle && !error

  useEffect(() => {
    let active = true
    const savedStages = analysis?.lifecycle || []
    if (!analysis?.plantName
      || savedStages.some((stage) => typeof stage === 'object' && stage.details)
      || (plantLifecycle.plantName === analysis.plantName && plantLifecycle.languageCode === languageCode)
      || (lifecycleError.plantName === analysis.plantName && lifecycleError.languageCode === languageCode)) return undefined

    getPlantInfo(analysis.plantName, languageCode)
      .then(({ plant }) => {
        if (active) setPlantLifecycle({ plantName: analysis.plantName, languageCode, steps: plant.lifecycle })
      })
      .catch((requestError) => {
        if (active) setLifecycleError({ plantName: analysis.plantName, languageCode, message: requestError.message })
      })
    return () => { active = false }
  }, [analysis?.plantName, analysis?.lifecycle, languageCode, lifecycleError.plantName, lifecycleError.languageCode, plantLifecycle.plantName, plantLifecycle.languageCode])

  const stageLabel = (stage) => typeof stage === 'string' ? stage : stage.stage
  const stageDetails = (stage) => typeof stage === 'string' ? '' : stage.details

  return (
    <section className="panel lifecycle-panel">
      <div className="panel-heading"><h2><Sprout size={16} /> {analysis ? `${analysis.plantName} Life Cycle` : 'Plant Life Cycle'}</h2></div>
      {stages.length > 0
        ? <>
          {hasDetails && <p className="lifecycle-intro">Step-by-step growth process for {analysis.plantName}.</p>}
          <ol className="life-cycle-steps">
            {stages.map((stage, index) => (
              <li className="life-cycle-step" key={`${index}-${stageLabel(stage)}`}>
                <span className={`life-emoji stage-${index}`}>{['🌰', '🌱', '🌿', '🌼', '🍅', '🌾', '🍎', '🌳'][index % 8]}</span>
                <div><strong>{stageLabel(stage)}</strong>{stageDetails(stage) && <p>{stageDetails(stage)}</p>}</div>
              </li>
            ))}
          </ol>
          {loading && <p className="panel-empty-note" role="status">Loading detailed stages for {analysis.plantName}…</p>}
          {error && <p className="lifecycle-error" role="alert">Could not load detailed lifecycle: {error}</p>}
        </>
        : <p className="panel-empty-note">{loading ? 'Loading plant lifecycle…' : 'Scan a plant to see its specific, step-by-step growth process.'}</p>}
    </section>
  )
}

function ImpactPanel() {
  return (
    <section className="panel impact-panel">
      <div className="panel-heading"><h2><Globe2 size={16} /> Global Impact</h2></div>
      <p>Helping farmers make informed plant-care decisions.</p>
      <div className="impact-illustration" aria-hidden="true"><Sprout /><Sprout /><Sprout /><Sprout /><Sprout /></div>
      <span className="impact-cta"><HeartPulse size={13} /> Together for food security</span>
    </section>
  )
}

function AssistantPanel({ messages, input, setInput, onSend, busy, inputRef, onVoice, expanded = false }) {
  return (
    <section className={`panel assistant-panel ${expanded ? 'assistant-expanded' : ''}`}>
      <div className="assistant-heading"><span className="bot-badge"><Bot size={18} /></span><span><strong>AI Plant Assistant</strong><small>Ask about plant health and care</small></span><span className="online-dot" /></div>
      <div className="chat-log" aria-live="polite">
        {messages.length === 0 && <div className="assistant-welcome"><span className="assistant-leaf"><Leaf size={16} /></span><span>Hi! Ask me about plant care, watering, or crop problems. Scan a plant first for advice about your specific plant.</span></div>}
        {messages.map((message) => <div className={`chat-message ${message.role === 'user' ? 'farmer-question' : 'assistant-answer'}`} key={message.id}>{message.role === 'assistant' && <span className="assistant-leaf"><Leaf size={15} /></span>}<div>{message.content}<small>{new Date(message.createdAt).toLocaleString()}</small></div></div>)}
        {busy && <div className="chat-message assistant-answer"><span className="assistant-leaf"><Bot size={15} /></span><span>Thinking…</span></div>}
      </div>
      <div className="quick-prompts">
        {['How often should I water?', 'What fertilizer is suitable?', 'How can I prevent disease?', 'Explain the plant life cycle'].map((prompt) => <button key={prompt} onClick={() => setInput(prompt)} type="button">{prompt}</button>)}
      </div>
      <form className="chat-input" onSubmit={onSend}>
        <button aria-label="Use voice input" onClick={onVoice} type="button"><Mic size={16} /></button>
        <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type or speak..." aria-label="Message the plant assistant" />
        <button className="send-button" disabled={busy || !input.trim()} type="submit" aria-label="Send message"><ArrowRight size={17} /></button>
      </form>
      <div className="assistant-footer"><span><Globe2 size={11} /> AI replies in the selected language</span><span>• Voice enabled</span></div>
    </section>
  )
}

function HistoryPanel({ scans, onSelect, onUpload }) {
  return (
    <section className="panel content-panel history-panel">
      <div className="panel-heading"><h2><AudioLines size={17} /> Your Scan History</h2><button className="care-button history-upload" onClick={onUpload} type="button"><Upload size={13} /> Scan a plant</button></div>
      {scans.length === 0
        ? <p className="panel-empty-note">No scans saved for this name yet. Upload a plant photo to get started.</p>
        : <div className="history-list">{scans.map((scan) => <button className="history-item" key={scan.id} onClick={() => onSelect(scan)} type="button"><img src={scan.imageUrl} alt="" /><span><strong>{scan.analysis.plantName}</strong><small>{new Date(scan.createdAt).toLocaleString()}</small></span><span className={`history-status ${scan.analysis.healthy ? 'healthy' : 'issue'}`}>{scan.analysis.healthy ? 'Looks healthy' : scan.analysis.diseaseName}</span><ArrowRight size={16} /></button>)}</div>}
    </section>
  )
}

function LibraryPanel({
  plants,
  loading,
  selectedPlant,
  search,
  onSearchChange,
  onSearch,
  onSelect,
  onScan,
  infoBusy,
  infoError,
}) {
  return (
    <section className="panel content-panel library-panel">
      <div className="panel-heading"><h2><Leaf size={17} /> Plant Library</h2></div>
      <p className="panel-intro">Explore detailed growing guides for popular crops, or search for any plant. Select a plant to see information just for it.</p>
      <form className="plant-search" onSubmit={onSearch}>
        <Search size={16} />
        <input aria-label="Search any plant or crop" onChange={(event) => onSearchChange(event.target.value)} placeholder="Search any plant or crop…" value={search} />
        <button className="care-button" disabled={!search.trim() || infoBusy} type="submit">{infoBusy ? 'Searching…' : 'Search'}</button>
      </form>
      {infoBusy && <p className="panel-empty-note" role="status">Loading plant information…</p>}
      {infoError && <p className="form-error plant-info-error" role="alert">{infoError}</p>}
      {selectedPlant && (
        <article className="plant-detail">
          <div className="plant-detail-heading">
            <div><span className="plant-category">{selectedPlant.category}</span><h3>{selectedPlant.plantName}</h3>{selectedPlant.scientificName && <i>{selectedPlant.scientificName}</i>}</div>
            <button className="care-button" onClick={() => onScan(selectedPlant.plantName)} type="button"><ScanLine size={14} /> Scan this plant</button>
          </div>
          <div className="plant-detail-data">
            <p>{selectedPlant.description}</p>
            <div className="plant-facts">
              <div><strong>Sunlight</strong><span>{selectedPlant.sunlight}</span></div>
              <div><strong>Water</strong><span>{selectedPlant.water}</span></div>
              <div><strong>Soil</strong><span>{selectedPlant.soil}</span></div>
              <div><strong>Temperature</strong><span>{selectedPlant.temperature}</span></div>
              <div><strong>Fertilizer</strong><span>{selectedPlant.fertilizer}</span></div>
              <div><strong>Germination</strong><span>{selectedPlant.germination}</span></div>
              <div><strong>Nutrients</strong><span>{selectedPlant.nutrients}</span></div>
              <div><strong>Harvesting</strong><span>{selectedPlant.harvesting}</span></div>
            </div>
            {selectedPlant.lifecycle.length > 0 && <div className="plant-detail-section"><h4>{selectedPlant.plantName} growth process</h4><ol className="plant-lifecycle-steps">{selectedPlant.lifecycle.map((stage, index) => <li key={`${index}-${stage.stage}`}><strong>{stage.stage}</strong><span>{stage.details}</span></li>)}</ol></div>}
            {selectedPlant.careTips.length > 0 && <div className="plant-detail-section"><h4>Care tips for {selectedPlant.plantName}</h4><ul>{selectedPlant.careTips.map((tip, index) => <li key={`${index}-${tip}`}>{tip}</li>)}</ul></div>}
            {selectedPlant.commonProblems.length > 0 && <div className="plant-detail-section"><h4>Common problems</h4><ul>{selectedPlant.commonProblems.map((problem, index) => <li key={`${index}-${problem}`}>{problem}</li>)}</ul></div>}
            {selectedPlant.prevention.length > 0 && <div className="plant-detail-section"><h4>Prevention</h4><ul>{selectedPlant.prevention.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></div>}
          </div>
        </article>
      )}
      {loading
        ? <p className="panel-empty-note">Loading plant library…</p>
        : <div className="library-list">{plants.map((plant) => (
          <button className="library-item" key={plant.name} onClick={() => onSelect(plant.name)} type="button">
            <span>{plant.emoji}</span>
            <strong data-no-translate>{plant.name}</strong>
            <small>{plant.category}</small>
          </button>
        ))}</div>}
    </section>
  )
}

function AboutPanel() {
  return (
    <section className="panel content-panel about-panel">
      <span className="about-icon"><Sprout size={30} /></span>
      <h2>About CropDoctor AI</h2>
      <p>Upload a plant photo for AI-assisted identification, visible health observations, and practical care suggestions. Results are informational and can be uncertain; consult a local agricultural expert for serious disease or crop loss.</p>
      <p>Scan history and assistant conversations are stored on this server under the name you enter. There is no password or account system. Anyone who enters the same name can open that name&apos;s data.</p>
    </section>
  )
}

function StatCard({ icon, label, value, change, variant }) {
  return <div className={`stat-card ${variant}`}><span className="stat-icon">{icon}</span><span className="stat-copy"><small>{label}</small><strong>{value} {change && <i>{change}</i>}</strong></span><ArrowDownRight className="stat-trend" size={16} /></div>
}

function CareItem({ icon, title, value }) {
  return <div className="care-item"><span className="care-icon">{icon}</span><span><strong>{title}</strong><small data-no-translate>{value}</small></span></div>
}

function App() {
  const loadedFarmer = useRef('')
  const [farmer, setFarmer] = useState(() => localStorage.getItem('cropdoctor.farmer') || '')
  const [data, setData] = useState({ name: '', scans: [], messages: [] })
  const [page, setPage] = useState('landing')
  const [activeSection, setActiveSection] = useState('overview')
  const [languageCode, setLanguageCode] = useState(() => getLanguage(localStorage.getItem('cropdoctor.language') || 'en').code)
  const [nameBusy, setNameBusy] = useState(false)
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('cropdoctor.farmer')))
  const [nameError, setNameError] = useState('')
  const [changeName, setChangeName] = useState(false)
  const [translationError, setTranslationError] = useState('')
  const language = getLanguage(languageCode)

  usePageTranslation(languageCode, setTranslationError)

  function changeLanguage(code) {
    const selected = getLanguage(code)
    setLanguageCode(selected.code)
    localStorage.setItem('cropdoctor.language', selected.code)
  }

  useEffect(() => {
    if (!farmer || loadedFarmer.current === farmer) return
    let active = true
    getFarmer(farmer)
      .then((result) => {
        if (active) {
          loadedFarmer.current = farmer
          setData(result)
          setNameError('')
        }
      })
      .catch((error) => { if (active) setNameError(error.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [farmer])

  async function chooseFarmer(value) {
    setNameBusy(true)
    setLoading(true)
    setNameError('')
    try {
      const result = await createFarmer(value)
      loadedFarmer.current = result.name
      setFarmer(result.name)
      localStorage.setItem('cropdoctor.farmer', result.name)
      setData(result)
      setChangeName(false)
      setPage('landing')
      setActiveSection('overview')
    } catch (error) {
      setNameError(error.message)
    } finally {
      setNameBusy(false)
      setLoading(false)
    }
  }

  function switchName() {
    setNameError('')
    setChangeName(true)
  }

  function goTo(section) {
    setActiveSection(section)
    setPage('dashboard')
  }

  let pageContent
  if (loading) {
    pageContent = <main className="name-gate"><section className="name-card"><div className="name-card-top"><Brand /><LanguageSelector languageCode={languageCode} onChange={changeLanguage} /></div><p>Loading saved data for <span data-no-translate>{farmer}</span>…</p>{nameError && <><p className="form-error" role="alert">{nameError}</p><button className="button button-primary" onClick={() => { localStorage.removeItem('cropdoctor.farmer'); setFarmer('') }} type="button">Enter a different name</button></>}</section></main>
  } else if (!farmer || changeName) {
    pageContent = <NameGate initialName={changeName ? farmer : ''} onChoose={chooseFarmer} onCancel={changeName ? () => setChangeName(false) : undefined} error={nameError} busy={nameBusy} languageCode={languageCode} onLanguageChange={changeLanguage} />
  } else if (nameError) {
    pageContent = <NameGate initialName={farmer} onChoose={chooseFarmer} error={nameError} busy={nameBusy} languageCode={languageCode} onLanguageChange={changeLanguage} />
  } else if (page === 'landing') {
    pageContent = <LandingPage
      openDashboard={() => goTo('overview')}
      openScan={() => goTo('scan')}
      openLibrary={() => goTo('library')}
      openHistory={() => goTo('history')}
      openAssistant={() => goTo('assistant')}
      languageCode={languageCode}
      onLanguageChange={changeLanguage}
    />
  } else {
    pageContent = <Dashboard
      farmer={farmer}
      data={data}
      onDataChange={setData}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      onChangeName={switchName}
      onHome={() => setPage('landing')}
      languageCode={languageCode}
      onLanguageChange={changeLanguage}
    />
  }

  return (
    <>
      {translationError && <div className="translation-alert" data-no-translate role="status">Website translation unavailable: {translationError}</div>}
      {pageContent}
    </>
  )
}

export default App
