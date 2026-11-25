/** 4-peer skill network with hats, curved links, and floating icons. */
export default function AuthPanelArt() {
  return (
    <div className="auth-art" aria-hidden="true">
      <svg className="auth-art-float auth-art-star" viewBox="0 0 48 48" fill="none">
        <path
          d="M24 6l4.2 10.2L39 18l-8.2 6.8L33.6 36 24 29.8 14.4 36l2.8-11.2L9 18l10.8-1.8L24 6z"
          fill="#93c5fd"
          stroke="#fff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>

      <svg className="auth-art-float auth-art-bolt" viewBox="0 0 48 48" fill="none">
        <path
          d="M26 4 12 26h10l-2 18 16-24H26l0-16z"
          fill="#93c5fd"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </svg>

      <svg className="auth-art-float auth-art-chat" viewBox="0 0 56 56" fill="none">
        <path
          d="M10 12h36a6 6 0 0 1 6 6v16a6 6 0 0 1-6 6H24l-10 8v-8h-4a6 6 0 0 1-6-6V18a6 6 0 0 1 6-6z"
          fill="#dbeafe"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="22" cy="26" r="2.4" fill="#0a4ac6" />
        <circle cx="28" cy="26" r="2.4" fill="#0a4ac6" />
        <circle cx="34" cy="26" r="2.4" fill="#0a4ac6" />
      </svg>

      <svg className="auth-art-float auth-art-puzzle" viewBox="0 0 64 64" fill="none">
        <path
          d="M22 12c0-4 3.2-7.2 7.2-7.2S36.4 8 36.4 12v5.2h5.2c4 0 7.2 3.2 7.2 7.2S45.6 31.6 41.6 31.6h-5.2v5.2c0 4-3.2 7.2-7.2 7.2S22 40.8 22 36.8v-5.2h-5.2c-4 0-7.2-3.2-7.2-7.2s3.2-7.2 7.2-7.2H22V12z"
          fill="#60a5fa"
          stroke="#fff"
          strokeWidth="2.5"
        />
      </svg>

      <svg className="auth-art-float auth-art-book" viewBox="0 0 56 56" fill="none">
        <path
          d="M10 12h16c3 0 6 2 8 4 2-2 5-4 8-4h14v32H34c-3 0-6 1-8 3-2-2-5-3-8-3H10V12z"
          fill="#bfdbfe"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M28 16v28" stroke="#0a4ac6" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      <svg className="auth-art-float auth-art-arrows" viewBox="0 0 56 56" fill="none">
        <path
          d="M12 20h26m0 0-6-6m6 6-6 6"
          stroke="#fff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M44 36H18m0 0 6 6m-6-6 6-6"
          stroke="#93c5fd"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <svg className="auth-art-main" viewBox="0 0 500 340" fill="none" overflow="visible">
        <defs>
          <path id="auth-path-top" d="M115 100 C190 58, 310 58, 385 100" />
          <path id="auth-path-diag-a" d="M115 100 C210 145, 290 185, 355 238" />
          <path id="auth-path-diag-b" d="M385 100 C290 145, 210 185, 145 238" />
          <path id="auth-path-left" d="M115 100 C160 160, 168 200, 145 238" />
          <path id="auth-path-right" d="M385 100 C340 160, 332 200, 355 238" />
          <path id="auth-path-bottom" d="M145 238 C220 285, 280 285, 355 238" />
        </defs>

        <g fill="none" stroke="#bfdbfe" strokeWidth="4.5" strokeLinecap="round" opacity="0.55">
          <use href="#auth-path-top" />
          <use href="#auth-path-left" />
          <use href="#auth-path-right" />
          <use href="#auth-path-bottom" />
          <use href="#auth-path-diag-a" />
          <use href="#auth-path-diag-b" />
        </g>

        <g
          fill="none"
          stroke="#fff"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray="10 14"
          className="auth-flow-stroke"
        >
          <use href="#auth-path-top" />
          <use href="#auth-path-diag-a" />
          <use href="#auth-path-diag-b" />
          <use href="#auth-path-bottom" />
          <use href="#auth-path-left" />
          <use href="#auth-path-right" />
        </g>

        <circle className="auth-motion-dot auth-motion-dot-1" r="7" fill="#93c5fd" stroke="#fff" strokeWidth="2" />
        <circle className="auth-motion-dot auth-motion-dot-2" r="6" fill="#fff" />
        <circle className="auth-motion-dot auth-motion-dot-3" r="6.5" fill="#60a5fa" stroke="#fff" strokeWidth="1.8" />
        <circle className="auth-motion-dot auth-motion-dot-4" r="6" fill="#dbeafe" />
        <circle className="auth-motion-dot auth-motion-dot-5" r="6.5" fill="#93c5fd" stroke="#fff" strokeWidth="1.8" />
        <circle className="auth-motion-dot auth-motion-dot-6" r="6" fill="#fff" />

        {/* 1 Design — hard hat */}
        <g>
          <circle cx="115" cy="100" r="54" fill="#1d4ed8" opacity="0.2" />
          <circle cx="115" cy="100" r="46" fill="#fff" />
          <path
            d="M88 118c6-8 16-12 27-12s21 4 27 12c2 18-6 34-27 34s-29-16-27-34z"
            fill="#2563eb"
            transform="translate(0 106) scale(1 0.85) translate(0 -106)"
          />
          <circle cx="115" cy="88" r="18" fill="#e8b48f" />
          <path d="M92 76c4-18 13-26 23-26s19 8 23 26H92z" fill="#f59e0b" />
          <path
            d="M84 76h62c2 0 3.5 1.8 3.5 3.8S148 84 146 84H84c-2 0-3.5-1.8-3.5-3.8S82 76 84 76z"
            fill="#d97706"
          />
          <rect x="110" y="56" width="10" height="10" rx="2" fill="#fbbf24" />
          <circle cx="109" cy="88" r="1.7" fill="#3b2418" />
          <circle cx="121" cy="88" r="1.7" fill="#3b2418" />
          <path d="M110 96c2.1 2.1 5.6 2.1 7.7 0" stroke="#c47a5a" strokeWidth="1.7" strokeLinecap="round" />
          <rect x="78" y="158" width="74" height="26" rx="8" fill="#fff" />
          <text
            x="115"
            y="176"
            textAnchor="middle"
            fill="#0a4ac6"
            fontFamily="Figtree, Avenir Next, Segoe UI, sans-serif"
            fontSize="13"
            fontWeight="700"
          >
            Design
          </text>
        </g>

        {/* 2 Music — headphones */}
        <g>
          <circle cx="385" cy="100" r="54" fill="#38bdf8" opacity="0.18" />
          <circle cx="385" cy="100" r="46" fill="#fff" />
          <path
            d="M358 118c6-8 16-12 27-12s21 4 27 12c2 18-6 34-27 34s-29-16-27-34z"
            fill="#0a4ac6"
            transform="translate(0 106) scale(1 0.85) translate(0 -106)"
          />
          <circle cx="385" cy="90" r="18" fill="#d7a07c" />
          <path
            d="M358 82c4-18 12-26 27-26s23 8 27 26"
            stroke="#111827"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="351" y="78" width="12" height="24" rx="6" fill="#1f2937" />
          <rect x="407" y="78" width="12" height="24" rx="6" fill="#1f2937" />
          <circle cx="379" cy="90" r="1.7" fill="#3b2418" />
          <circle cx="391" cy="90" r="1.7" fill="#3b2418" />
          <path d="M380 98c2.1 2.1 5.6 2.1 7.7 0" stroke="#b87352" strokeWidth="1.7" strokeLinecap="round" />
          <rect x="348" y="158" width="74" height="26" rx="8" fill="#fff" />
          <text
            x="385"
            y="176"
            textAnchor="middle"
            fill="#0a4ac6"
            fontFamily="Figtree, Avenir Next, Segoe UI, sans-serif"
            fontSize="13"
            fontWeight="700"
          >
            Music
          </text>
        </g>

        {/* 3 Writing — beanie */}
        <g>
          <circle cx="145" cy="238" r="50" fill="#0ea5e9" opacity="0.18" />
          <circle cx="145" cy="238" r="42" fill="#fff" />
          <path
            d="M120 254c5-7 14-11 25-11s20 4 25 11c2 16-5 30-25 30s-27-14-25-30z"
            fill="#0284c7"
            transform="translate(0 243) scale(1 0.85) translate(0 -243)"
          />
          <circle cx="145" cy="228" r="16" fill="#f0c2a0" />
          <path
            d="M124 220c4-16 11-22 21-22s17 6 21 22c-5-2-13-3-21-3s-16 1-21 3z"
            fill="#7c3aed"
          />
          <ellipse cx="145" cy="200" rx="7.5" ry="5.5" fill="#a78bfa" />
          <path d="M122 218h46" stroke="#5b21b6" strokeWidth="5" strokeLinecap="round" />
          <circle cx="139" cy="228" r="1.5" fill="#3b2418" />
          <circle cx="151" cy="228" r="1.5" fill="#3b2418" />
          <path d="M141 235c1.7 1.8 4.6 1.8 6.3 0" stroke="#c47a5a" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="110" y="294" width="70" height="24" rx="8" fill="#fff" />
          <text
            x="145"
            y="311"
            textAnchor="middle"
            fill="#0a4ac6"
            fontFamily="Figtree, Avenir Next, Segoe UI, sans-serif"
            fontSize="12"
            fontWeight="700"
          >
            Writing
          </text>
        </g>

        {/* 4 Photo — baseball cap */}
        <g>
          <circle cx="355" cy="238" r="50" fill="#818cf8" opacity="0.18" />
          <circle cx="355" cy="238" r="42" fill="#fff" />
          <path
            d="M330 254c5-7 14-11 25-11s20 4 25 11c2 16-5 30-25 30s-27-14-25-30z"
            fill="#4f46e5"
            transform="translate(0 243) scale(1 0.85) translate(0 -243)"
          />
          <circle cx="355" cy="230" r="16" fill="#c98b64" />
          <path d="M334 222c4-14 10-21 21-21s17 7 21 21H334z" fill="#0f766e" />
          <path
            d="M348 222h40c2.5 0 4 2 4 4.5s-1.5 4.5-4 4.5h-28c-3 0-6-1.6-9-4.5-1.5-2-2.4-4.5-3-4.5z"
            fill="#115e59"
          />
          <circle cx="349" cy="230" r="1.5" fill="#2a1810" />
          <circle cx="361" cy="230" r="1.5" fill="#2a1810" />
          <path d="M351 237c1.7 1.8 4.6 1.8 6.3 0" stroke="#a56a48" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="320" y="294" width="70" height="24" rx="8" fill="#fff" />
          <text
            x="355"
            y="311"
            textAnchor="middle"
            fill="#0a4ac6"
            fontFamily="Figtree, Avenir Next, Segoe UI, sans-serif"
            fontSize="12"
            fontWeight="700"
          >
            Photo
          </text>
        </g>
      </svg>
    </div>
  )
}
