import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// CSP sem nonce (estático) — o app não carrega script de terceiro
// nenhum, então dá pra evitar a complexidade de nonce/renderização
// dinâmica em toda página só por causa da CSP (ver guia oficial em
// node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md,
// seção "Without Nonces"). unsafe-inline em script-src cobre o script
// inline de modo escuro em app/layout.tsx; ws/wss/stun/turn em
// connect-src cobrem o Socket.IO e a sinalização/mídia WebRTC.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self' data:;
  media-src 'self' blob:;
  connect-src 'self' ws: wss: stun: turn:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspHeader.replace(/\n/g, ""),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Ignorado pelo navegador fora de HTTPS (dev local), então não precisa
  // ser condicional — em produção (sempre HTTPS) passa a valer.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // camera/microphone/display-capture liberados só pra própria origem —
  // é exatamente o que a chamada de vídeo/compartilhamento de tela usa;
  // o resto (geolocalização, pagamento, USB etc.) o app nunca usa.
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), microphone=(self), display-capture=(self), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
