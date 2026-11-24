/**
 * SEOKaroAI mark (public/brand/logo-mark-*.webp): the "S" ribbon rising into a growth arrow, with
 * ranking bars, a search lens and AI sparkles. Animated with CSS (globals.css → "logo"): it settles in
 * on load, a light sweep crosses it every few seconds, and it lifts on hover. Reduced motion turns
 * the animation off.
 */
export function LogoMark({ size = 28, animated = true, className = "" }: { size?: number; animated?: boolean; className?: string }) {
  const src = size > 96 ? "/brand/logo-mark-512.webp" : size > 40 ? "/brand/logo-mark-256.webp" : "/brand/logo-mark-128.webp";
  return (
    <span className={`sk-mark ${animated ? "sk-anim" : ""} ${className}`} style={{ width: size, height: size, ["--sk-img" as string]: `url(${src})` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="SEOKaroAI" width={size} height={size} draggable={false} />
      <span className="sk-shine" aria-hidden />
    </span>
  );
}

export function Logo({ size = 26, className = "", animated = true }: { size?: number; className?: string; animated?: boolean }) {
  const mark = Math.round(size * 1.55); // the mark is detailed, so it is drawn larger than the text
  return (
    <span className={`sk-logo-wrap group inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={mark} animated={animated} />
      <span className="font-semibold tracking-[-0.035em]" style={{ fontSize: size * 0.7 }}>
        SEOKaro<span className="sk-ai">AI</span>
      </span>
    </span>
  );
}
