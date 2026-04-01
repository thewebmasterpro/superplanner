import { useState, useMemo, useCallback } from 'react'
import DashboardLayoutV3 from '../../components/layout/DashboardLayoutV3'
import { Code2, Copy, Check, Eye, Settings2, Layers } from 'lucide-react'
import { Button } from '../../components/ui/button'
import toast from 'react-hot-toast'

const ELEMENTS = [
  { id: 'button', label: 'Button', icon: '🔘' },
  { id: 'card', label: 'Card', icon: '🃏' },
  { id: 'input', label: 'Input', icon: '✏️' },
  { id: 'badge', label: 'Badge', icon: '🏷️' },
  { id: 'alert', label: 'Alert', icon: '⚠️' },
  { id: 'avatar', label: 'Avatar', icon: '👤' },
  { id: 'navbar', label: 'Navbar', icon: '📌' },
  { id: 'hero', label: 'Hero Section', icon: '🦸' },
  { id: 'pricing', label: 'Pricing Card', icon: '💰' },
  { id: 'testimonial', label: 'Testimonial', icon: '💬' },
]

const COLOR_PRESETS = [
  { name: 'Blue', primary: '#3b82f6', secondary: '#dbeafe', text: '#1e3a5f' },
  { name: 'Green', primary: '#22c55e', secondary: '#dcfce7', text: '#14532d' },
  { name: 'Purple', primary: '#a855f7', secondary: '#f3e8ff', text: '#3b0764' },
  { name: 'Red', primary: '#ef4444', secondary: '#fee2e2', text: '#7f1d1d' },
  { name: 'Orange', primary: '#f97316', secondary: '#ffedd5', text: '#7c2d12' },
  { name: 'Teal', primary: '#14b8a6', secondary: '#ccfbf1', text: '#134e4a' },
  { name: 'Pink', primary: '#ec4899', secondary: '#fce7f3', text: '#831843' },
  { name: 'Dark', primary: '#1e293b', secondary: '#334155', text: '#f8fafc' },
]

const SIZE_OPTIONS = ['sm', 'md', 'lg']
const RADIUS_OPTIONS = ['none', 'sm', 'md', 'lg', 'full']

const defaultConfig = {
  color: COLOR_PRESETS[0],
  size: 'md',
  radius: 'md',
  text: '',
  shadow: true,
  outlined: false,
  animated: false,
}

function generateCode(element, config) {
  const { color, size, radius, shadow, outlined, animated } = config
  const text = config.text || getDefaultText(element)

  const sizeMap = { sm: { padding: '8px 16px', font: '13px' }, md: { padding: '12px 24px', font: '15px' }, lg: { padding: '16px 32px', font: '17px' } }
  const radiusMap = { none: '0', sm: '4px', md: '8px', lg: '16px', full: '9999px' }
  const s = sizeMap[size]
  const r = radiusMap[radius]

  const baseStyle = `border-radius: ${r};`
  const shadowStyle = shadow ? 'box-shadow: 0 4px 14px rgba(0,0,0,0.1);' : ''
  const animStyle = animated ? 'transition: all 0.3s ease; cursor: pointer;' : ''
  const outlineBase = outlined
    ? `background: transparent; color: ${color.primary}; border: 2px solid ${color.primary};`
    : `background: ${color.primary}; color: white; border: none;`

  switch (element) {
    case 'button':
      return {
        html: `<button class="component-btn">${text}</button>`,
        css: `.component-btn {\n  ${outlineBase}\n  padding: ${s.padding};\n  font-size: ${s.font};\n  font-weight: 600;\n  ${baseStyle}\n  ${shadowStyle}\n  ${animStyle}\n  font-family: inherit;\n  letter-spacing: 0.01em;\n}\n${animated ? `.component-btn:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 6px 20px rgba(0,0,0,0.15);\n}` : ''}`,
      }

    case 'card':
      return {
        html: `<div class="component-card">\n  <h3 class="card-title">${text}</h3>\n  <p class="card-desc">A beautifully designed component ready to use in your project.</p>\n  <button class="card-action">Learn More →</button>\n</div>`,
        css: `.component-card {\n  background: ${outlined ? 'transparent' : color.secondary};\n  ${outlined ? `border: 2px solid ${color.primary};` : 'border: none;'}\n  ${baseStyle}\n  padding: ${size === 'sm' ? '20px' : size === 'lg' ? '40px' : '28px'};\n  ${shadowStyle}\n  ${animStyle}\n  max-width: 380px;\n}\n.card-title {\n  font-size: ${size === 'sm' ? '18px' : size === 'lg' ? '26px' : '22px'};\n  font-weight: 700;\n  color: ${color.text};\n  margin: 0 0 12px;\n}\n.card-desc {\n  color: ${color.text}99;\n  font-size: ${s.font};\n  line-height: 1.6;\n  margin: 0 0 20px;\n}\n.card-action {\n  background: ${color.primary};\n  color: white;\n  border: none;\n  padding: 8px 20px;\n  ${baseStyle}\n  font-weight: 600;\n  font-size: 14px;\n  cursor: pointer;\n}${animated ? `\n.component-card:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 30px rgba(0,0,0,0.12);\n}` : ''}`,
      }

    case 'input':
      return {
        html: `<div class="component-input-group">\n  <label class="input-label">${text}</label>\n  <input type="text" class="component-input" placeholder="Type something..." />\n</div>`,
        css: `.component-input-group {\n  max-width: 340px;\n}\n.input-label {\n  display: block;\n  font-size: 14px;\n  font-weight: 600;\n  color: ${color.text};\n  margin-bottom: 8px;\n}\n.component-input {\n  width: 100%;\n  padding: ${s.padding};\n  font-size: ${s.font};\n  ${baseStyle}\n  border: 2px solid ${outlined ? color.primary : '#e2e8f0'};\n  background: ${outlined ? 'transparent' : 'white'};\n  color: #1a1a2e;\n  outline: none;\n  ${animStyle}\n  box-sizing: border-box;\n}\n.component-input:focus {\n  border-color: ${color.primary};\n  ${shadow ? `box-shadow: 0 0 0 3px ${color.primary}33;` : ''}\n}`,
      }

    case 'badge':
      return {
        html: `<span class="component-badge">${text}</span>`,
        css: `.component-badge {\n  display: inline-block;\n  ${outlineBase}\n  padding: ${size === 'sm' ? '4px 10px' : size === 'lg' ? '8px 18px' : '6px 14px'};\n  font-size: ${size === 'sm' ? '11px' : size === 'lg' ? '15px' : '13px'};\n  font-weight: 700;\n  ${baseStyle}\n  letter-spacing: 0.03em;\n  text-transform: uppercase;\n}`,
      }

    case 'alert':
      return {
        html: `<div class="component-alert">\n  <strong>Info:</strong> ${text}\n</div>`,
        css: `.component-alert {\n  background: ${color.secondary};\n  border-left: 4px solid ${color.primary};\n  color: ${color.text};\n  padding: ${s.padding};\n  font-size: ${s.font};\n  ${baseStyle}\n  ${shadowStyle}\n  max-width: 440px;\n  line-height: 1.5;\n}`,
      }

    case 'avatar':
      return {
        html: `<div class="component-avatar">${text.charAt(0).toUpperCase()}</div>`,
        css: `.component-avatar {\n  width: ${size === 'sm' ? '40px' : size === 'lg' ? '72px' : '56px'};\n  height: ${size === 'sm' ? '40px' : size === 'lg' ? '72px' : '56px'};\n  ${outlineBase}\n  ${baseStyle}\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: ${size === 'sm' ? '16px' : size === 'lg' ? '28px' : '22px'};\n  font-weight: 700;\n  ${shadowStyle}\n}`,
      }

    case 'navbar':
      return {
        html: `<nav class="component-navbar">\n  <span class="nav-brand">${text}</span>\n  <div class="nav-links">\n    <a href="#" class="nav-link">Home</a>\n    <a href="#" class="nav-link">About</a>\n    <a href="#" class="nav-link">Contact</a>\n  </div>\n</nav>`,
        css: `.component-navbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  background: ${outlined ? 'transparent' : color.primary};\n  ${outlined ? `border: 2px solid ${color.primary};` : ''}\n  color: ${outlined ? color.primary : 'white'};\n  padding: ${s.padding};\n  ${baseStyle}\n  ${shadowStyle}\n  width: 100%;\n  box-sizing: border-box;\n}\n.nav-brand {\n  font-size: ${size === 'sm' ? '16px' : size === 'lg' ? '22px' : '19px'};\n  font-weight: 800;\n}\n.nav-links {\n  display: flex;\n  gap: 20px;\n}\n.nav-link {\n  color: inherit;\n  text-decoration: none;\n  font-size: 14px;\n  font-weight: 500;\n  opacity: 0.85;\n  ${animStyle}\n}\n.nav-link:hover {\n  opacity: 1;\n}`,
      }

    case 'hero':
      return {
        html: `<section class="component-hero">\n  <h1 class="hero-title">${text}</h1>\n  <p class="hero-subtitle">Build amazing things with clean, reusable components.</p>\n  <div class="hero-actions">\n    <button class="hero-btn-primary">Get Started</button>\n    <button class="hero-btn-secondary">Learn More</button>\n  </div>\n</section>`,
        css: `.component-hero {\n  text-align: center;\n  padding: ${size === 'sm' ? '40px 20px' : size === 'lg' ? '80px 40px' : '60px 32px'};\n  background: linear-gradient(135deg, ${color.primary}15, ${color.secondary});\n  ${baseStyle}\n  ${shadowStyle}\n  width: 100%;\n  box-sizing: border-box;\n}\n.hero-title {\n  font-size: ${size === 'sm' ? '28px' : size === 'lg' ? '48px' : '38px'};\n  font-weight: 800;\n  color: ${color.text};\n  margin: 0 0 16px;\n}\n.hero-subtitle {\n  font-size: ${s.font};\n  color: ${color.text}99;\n  margin: 0 0 32px;\n  max-width: 500px;\n  margin-left: auto;\n  margin-right: auto;\n}\n.hero-actions {\n  display: flex;\n  gap: 12px;\n  justify-content: center;\n}\n.hero-btn-primary {\n  background: ${color.primary};\n  color: white;\n  border: none;\n  padding: 12px 28px;\n  ${baseStyle}\n  font-weight: 600;\n  font-size: 15px;\n  cursor: pointer;\n}\n.hero-btn-secondary {\n  background: transparent;\n  color: ${color.primary};\n  border: 2px solid ${color.primary};\n  padding: 12px 28px;\n  ${baseStyle}\n  font-weight: 600;\n  font-size: 15px;\n  cursor: pointer;\n}`,
      }

    case 'pricing':
      return {
        html: `<div class="component-pricing">\n  <h3 class="pricing-plan">Pro Plan</h3>\n  <div class="pricing-price">${text}</div>\n  <p class="pricing-period">per month</p>\n  <ul class="pricing-features">\n    <li>✓ Unlimited projects</li>\n    <li>✓ Priority support</li>\n    <li>✓ Advanced analytics</li>\n  </ul>\n  <button class="pricing-btn">Choose Plan</button>\n</div>`,
        css: `.component-pricing {\n  background: ${outlined ? 'transparent' : 'white'};\n  ${outlined ? `border: 2px solid ${color.primary};` : `border: 1px solid #e2e8f0;`}\n  ${baseStyle}\n  padding: ${size === 'sm' ? '24px' : size === 'lg' ? '44px' : '32px'};\n  text-align: center;\n  ${shadowStyle}\n  max-width: 320px;\n  ${animStyle}\n}\n.pricing-plan {\n  font-size: 16px;\n  font-weight: 700;\n  color: ${color.primary};\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n  margin: 0 0 8px;\n}\n.pricing-price {\n  font-size: ${size === 'sm' ? '32px' : size === 'lg' ? '52px' : '42px'};\n  font-weight: 800;\n  color: ${color.text};\n  margin: 0;\n}\n.pricing-period {\n  color: #94a3b8;\n  font-size: 14px;\n  margin: 4px 0 24px;\n}\n.pricing-features {\n  list-style: none;\n  padding: 0;\n  margin: 0 0 28px;\n  text-align: left;\n}\n.pricing-features li {\n  padding: 8px 0;\n  color: ${color.text}cc;\n  font-size: 14px;\n  border-bottom: 1px solid #f1f5f9;\n}\n.pricing-btn {\n  background: ${color.primary};\n  color: white;\n  border: none;\n  padding: 12px 32px;\n  ${baseStyle}\n  font-weight: 600;\n  font-size: 15px;\n  cursor: pointer;\n  width: 100%;\n}${animated ? `\n.component-pricing:hover {\n  transform: translateY(-6px) scale(1.02);\n  box-shadow: 0 16px 40px rgba(0,0,0,0.12);\n}` : ''}`,
      }

    case 'testimonial':
      return {
        html: `<div class="component-testimonial">\n  <p class="testimonial-text">"${text}"</p>\n  <div class="testimonial-author">\n    <div class="testimonial-avatar">A</div>\n    <div>\n      <div class="testimonial-name">Alex Johnson</div>\n      <div class="testimonial-role">CEO, TechCo</div>\n    </div>\n  </div>\n</div>`,
        css: `.component-testimonial {\n  background: ${outlined ? 'transparent' : color.secondary};\n  ${outlined ? `border: 2px solid ${color.primary};` : 'border: none;'}\n  ${baseStyle}\n  padding: ${size === 'sm' ? '20px' : size === 'lg' ? '40px' : '28px'};\n  ${shadowStyle}\n  max-width: 420px;\n  ${animStyle}\n}\n.testimonial-text {\n  font-size: ${s.font};\n  color: ${color.text};\n  line-height: 1.7;\n  margin: 0 0 20px;\n  font-style: italic;\n}\n.testimonial-author {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n}\n.testimonial-avatar {\n  width: 44px;\n  height: 44px;\n  background: ${color.primary};\n  color: white;\n  border-radius: 50%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-weight: 700;\n  font-size: 18px;\n}\n.testimonial-name {\n  font-weight: 700;\n  color: ${color.text};\n  font-size: 15px;\n}\n.testimonial-role {\n  color: ${color.text}99;\n  font-size: 13px;\n}`,
      }

    default:
      return { html: '', css: '' }
  }
}

function getDefaultText(element) {
  const defaults = {
    button: 'Click Me',
    card: 'Card Title',
    input: 'Email Address',
    badge: 'New',
    alert: 'This is an important notification for the user.',
    avatar: 'Anouar',
    navbar: 'MyBrand',
    hero: 'Build Faster, Ship Smarter',
    pricing: '$29',
    testimonial: 'This product completely transformed how our team works. Highly recommended!',
  }
  return defaults[element] || 'Hello'
}

function PreviewPanel({ html, css }) {
  const srcDoc = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { margin: 0; padding: 24px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 48px); background: #f8fafc; }
  ${css}
</style></head>
<body>${html}</body></html>`

  return (
    <iframe
      srcDoc={srcDoc}
      title="Preview"
      className="w-full h-full border-0 rounded-lg bg-white"
      sandbox="allow-scripts"
    />
  )
}

export default function ComponentGeneratorPage() {
  const [selected, setSelected] = useState('button')
  const [config, setConfig] = useState(defaultConfig)
  const [copiedType, setCopiedType] = useState(null)
  const [showCode, setShowCode] = useState(false)

  const { html, css } = useMemo(() => generateCode(selected, config), [selected, config])

  const updateConfig = useCallback((key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleCopy = useCallback(async (type) => {
    const content = type === 'html' ? html : type === 'css' ? css : `<!-- HTML -->\n${html}\n\n/* CSS */\n${css}`
    await navigator.clipboard.writeText(content)
    setCopiedType(type)
    toast.success(`${type.toUpperCase()} copié !`)
    setTimeout(() => setCopiedType(null), 2000)
  }, [html, css])

  return (
    <DashboardLayoutV3>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500 h-full">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-2">
            <Code2 className="w-8 h-8 text-primary" />
            Component Generator
          </h1>
          <p className="text-muted-foreground">Sélectionnez, configurez et copiez vos composants HTML/CSS.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
          {/* Left: Selector + Configurator */}
          <div className="xl:col-span-4 flex flex-col gap-4">
            {/* Element Selector */}
            <div className="rounded-xl border bg-card p-4">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Éléments
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {ELEMENTS.map((el) => (
                  <button
                    key={el.id}
                    onClick={() => {
                      setSelected(el.id)
                      setConfig(prev => ({ ...prev, text: '' }))
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
                      selected === el.id
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'bg-muted/30 hover:bg-muted/60 text-foreground'
                    }`}
                  >
                    <span className="text-base">{el.icon}</span>
                    {el.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Configurator */}
            <div className="rounded-xl border bg-card p-4 flex-1">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Configuration
              </h2>
              <div className="flex flex-col gap-4">
                {/* Text */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Texte</label>
                  <input
                    type="text"
                    value={config.text}
                    onChange={(e) => updateConfig('text', e.target.value)}
                    placeholder={getDefaultText(selected)}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                {/* Colors */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Couleur</label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => updateConfig('color', c)}
                        title={c.name}
                        className={`w-8 h-8 rounded-full transition-all duration-200 ${
                          config.color.name === c.name
                            ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110'
                            : 'hover:scale-110'
                        }`}
                        style={{ background: c.primary }}
                      />
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Taille</label>
                  <div className="flex gap-2">
                    {SIZE_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateConfig('size', s)}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                          config.size === s
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/30 hover:bg-muted/60 text-foreground'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Radius */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Border Radius</label>
                  <div className="flex gap-1.5">
                    {RADIUS_OPTIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => updateConfig('radius', r)}
                        className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          config.radius === r
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/30 hover:bg-muted/60 text-foreground'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'shadow', label: 'Shadow' },
                    { key: 'outlined', label: 'Outlined' },
                    { key: 'animated', label: 'Animated' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => updateConfig(key, !config[key])}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        config[key]
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/30 hover:bg-muted/60 text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview + Code */}
          <div className="xl:col-span-8 flex flex-col gap-4 min-h-0">
            {/* Tab toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCode(false)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  !showCode
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted/30 text-foreground hover:bg-muted/60'
                }`}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={() => setShowCode(true)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  showCode
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted/30 text-foreground hover:bg-muted/60'
                }`}
              >
                <Code2 className="w-4 h-4" />
                Code
              </button>
              <div className="flex-1" />
              {/* Copy buttons */}
              <Button size="sm" variant="outline" onClick={() => handleCopy('html')}>
                {copiedType === 'html' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                HTML
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleCopy('css')}>
                {copiedType === 'css' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                CSS
              </Button>
              <Button size="sm" onClick={() => handleCopy('all')}>
                {copiedType === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Tout copier
              </Button>
            </div>

            {/* Preview / Code area */}
            <div className="flex-1 rounded-xl border bg-card overflow-hidden min-h-[400px]">
              {!showCode ? (
                <PreviewPanel html={html} css={css} />
              ) : (
                <div className="h-full overflow-auto p-4 flex flex-col gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">HTML</h3>
                    <pre className="bg-muted/30 rounded-lg p-4 text-sm overflow-x-auto">
                      <code className="text-foreground">{html}</code>
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">CSS</h3>
                    <pre className="bg-muted/30 rounded-lg p-4 text-sm overflow-x-auto">
                      <code className="text-foreground">{css}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayoutV3>
  )
}
