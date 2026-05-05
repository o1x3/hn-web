/**
 * Inline script that runs before React hydrates and applies the user's
 * stored appearance prefs (accent + typography) to <html> as inline style.
 * Without this, picking a non-default accent flashes the orange default.
 *
 * `next-themes` injects its own pre-hydration script for the theme attribute,
 * so this only needs to handle the accent + reader-prefs vars.
 *
 * Keep the script body literal — no template variables — so the bundler
 * doesn't transform it and CSP-friendly hashes stay stable.
 */
const SCRIPT = `(function(){try{var raw=localStorage.getItem('hn-appearance');if(!raw)return;var p=JSON.parse(raw);if(!p)return;var html=document.documentElement;var s=html.style;function setAccent(h,sat,l){s.setProperty('--primary',h+' '+sat+'% '+l+'%');s.setProperty('--ring',h+' '+sat+'% '+l+'%');s.setProperty('--color-upvote-h',String(h));s.setProperty('--color-upvote-s',sat+'%');s.setProperty('--color-upvote-l',l+'%');s.setProperty('--primary-foreground',l<60?'0 0% 100%':'0 0% 9%');}var presets={orange:[20,90,55],red:[0,75,55],amber:[40,92,55],green:[145,60,42],teal:[175,70,40],blue:[215,80,55],violet:[265,70,60],pink:[330,80,60]};if(p.accent){var a=p.accent;if(a.kind==='preset'&&presets[a.id]){setAccent(presets[a.id][0],presets[a.id][1],presets[a.id][2]);}else if(a.kind==='custom'){setAccent(a.h,a.s,a.l);}}if(p.font){s.setProperty('--reader-font-family',p.font==='serif'?'var(--font-source-serif), ui-serif, Georgia, Cambria, "Times New Roman", serif':p.font==='mono'?'var(--font-mono)':'var(--font-sans)');html.dataset.readerFont=p.font;}if(p.fontSize){s.setProperty('--reader-font-size',p.fontSize+'px');}if(p.lineHeight){s.setProperty('--reader-line-height',String(p.lineHeight));}if(p.contentWidth){s.setProperty('--reader-content-width',p.contentWidth==='narrow'?'60rem':p.contentWidth==='wide'?'96rem':'80rem');}if(p.justify){s.setProperty('--reader-justify',p.justify);}}catch(e){}})();`;

export function AppearanceScript() {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: literal constant
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
