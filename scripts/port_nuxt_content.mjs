#!/usr/bin/env node
// Porta las páginas de contenido estático del legacy-nuxt (Vue SFC) a Astro.
// Vue template -> Astro: NuxtLink->a, UIcon->emoji, directivas Vue fuera.
// Sin blockchain, sin canisters: solo contenido servido por el sitio.
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const REF = 'origin/legacy-nuxt';
const SRC = 'src/frontend/pages';

const HEAD_OVERRIDE = {
  'contact.vue': {
    title: 'Contact Us - Ionic Swap',
    desc: 'Get in touch with the Ionic Swap team. Development, AI agents and Web3 solutions tailored to your needs.',
  },
};

const ICONS = {
  'i-heroicons-cog-6-tooth': '⚙️',
  'i-heroicons-arrow-path': '🔄',
  'i-heroicons-shield-check': '🛡️',
  'i-heroicons-bolt': '⚡',
  'i-heroicons-envelope': '✉️',
  'i-heroicons-clock': '⏱️',
  'i-heroicons-users': '👥',
  'i-heroicons-currency-dollar': '💲',
  'i-heroicons-check-circle': '✅',
  'i-heroicons-chat-bubble-left-right': '💬',
  'i-heroicons-banknotes': '💵',
  'i-heroicons-academic-cap': '🎓',
  'i-heroicons-sparkles': '✨',
  'i-heroicons-server': '🖥️',
  'i-heroicons-question-mark-circle': '❓',
  'i-heroicons-pencil-square': '📝',
  'i-heroicons-chart-bar': '📊',
  'i-heroicons-calculator': '🧮',
  'i-heroicons-arrow-right': '→',
  'i-fa6-solid-paper-plane': '✈️',
  'i-fa6-solid-envelope': '✉️',
  'i-fa6-brands-twitter': '𝕏',
  'i-fa6-brands-github': '🐙',
  'i-fa6-brands-linkedin': '💼',
};

// Páginas portadas automáticamente. Las interactivas se ajustan a mano después.
const MAP = [
  ['learn/index.vue', 'src/pages/learn/index.astro'],
  ['learn/what-are-tokens.vue', 'src/pages/learn/what-are-tokens.astro'],
  ['learn/defi-basics.vue', 'src/pages/learn/defi-basics.astro'],
  ['learn/token-standards.vue', 'src/pages/learn/token-standards.astro'],
  ['learn/cross-chain-swapping.vue', 'src/pages/learn/cross-chain-swapping.astro'],
  ['learn/gasless-transactions.vue', 'src/pages/learn/gasless-transactions.astro'],
  ['learn/web3-basics.vue', 'src/pages/learn/web3-basics.astro'],
  ['learn/crypto-wallets.vue', 'src/pages/learn/crypto-wallets.astro'],
  ['terms.vue', 'src/pages/terms.astro'],
  ['privacy.vue', 'src/pages/privacy.astro'],
  ['contact.vue', 'src/pages/contact.astro'],
  ['support.vue', 'src/pages/support.astro'],
];

const show = (p) => execSync(`git show ${REF}:${SRC}/${p}`, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString();

function headMeta(src) {
  // El título de página vive dentro de useHead({...}); fuera de ahí aparecen
  // títulos de artículos/toasts que no son el <title> del documento.
  const head = src.match(/useHead\(\{([\s\S]*?)\n\s*\}\)/)?.[1] ?? src;
  const title = head.match(/title:\s*'([^']+)'/)?.[1] ?? 'Ionic Swap';
  const desc =
    head.match(/name:\s*'description',\s*content:\s*(?:\n\s*)'([^']+)'/s)?.[1] ??
    head.match(/name:\s*'description',\s*content:\s*(?:\n\s*)'?([^'\n]+)'?/s)?.[1] ??
    undefined;
  const canonical = head.match(/rel:\s*'canonical',\s*href:\s*'([^']+)'/)?.[1];
  return { title, desc, canonical };
}

function transform(tpl) {
  let out = tpl;

  // <UIcon name="..." class="..." /> -> <span class="..." aria-hidden="true">emoji</span>
  out = out.replace(/<UIcon\b([^>]*?)\/?>/gs, (_, attrs) => {
    const name = attrs.match(/name="([^"]+)"/)?.[1] ?? '';
    const cls = attrs.match(/(?<![:\w-])class="([^"]*)"/)?.[1] ?? '';
    const emoji = ICONS[name] ?? '•';
    const klass = cls ? ` class="${cls} inline-flex items-center justify-center leading-none"` : ' class="inline-flex items-center justify-center leading-none"';
    return `<span${klass} aria-hidden="true">${emoji}</span>`;
  });

  // NuxtLink -> a
  out = out.replace(/<NuxtLink\b/g, '<a').replace(/<\/NuxtLink>/g, '</a>');
  out = out.replace(/\sto="([^"]*)"/g, ' href="$1"');
  out = out.replace(/\s:to="([^"]*)"/g, '');

  // :class con plantillas basadas en currentTheme -> clase estática emerald
  out = out.replace(/:class="`([^`]*)`"/g, (_, expr) => {
    const stat = expr.replace(/\$\{currentTheme\}/g, 'emerald').replace(/`/g, '');
    return `class="${stat}"`;
  });
  // resto de bindings dinámicos fuera
  out = out.replace(/\s:class="[^"]*"/g, '');
  out = out.replace(/\s:style="[^"]*"/g, '');

  // directivas Vue fuera
  out = out.replace(/\s+v-(if|else-if|for|show|bind|on|model)(:[a-z-]+)?(="[^"]*")?/g, '');
  out = out.replace(/\s+@[a-z.]+(="[^"]*")?/g, '');
  out = out.replace(/\s+ref="[^"]*"/g, '');
  out = out.replace(/\s+:?key="[^"]*"/g, '');

  // UButton / UBadge / UCard -> elementos nativos
  out = out.replace(/<UButton\b([^>]*?)\/?>/gs, (_, attrs) => {
    const cls = attrs.match(/(?<![:\w-])class="([^"]*)"/)?.[1] ?? '';
    const label = attrs.match(/label="([^"]*)"/)?.[1] ?? '';
    const klass = cls ? ` class="${cls}"` : '';
    return `<button type="button"${klass}>${label}`;
  });
  out = out.replace(/<\/UButton>/g, '</button>');
  out = out.replace(/<U(Badge|Card|Divider)\b[^>]*>/g, '<div>').replace(/<\/U(Badge|Card|Divider)>/g, '</div>');

  // UFormField -> div con label visible
  out = out.replace(/<UFormField\b([^>]*?)(\/?)>/gs, (_, attrs) => {
    const cls = attrs.match(/(?<![:\w-])class="([^"]*)"/)?.[1] ?? '';
    const label = attrs.match(/(?<![:\w-])label="([^"]*)"/)?.[1] ?? '';
    const klass = cls ? ` class="${cls}"` : '';
    return `<div${klass}>${label ? `<label class="block mb-1 text-sm font-medium">${label}</label>` : ''}`;
  });
  out = out.replace(/<\/UFormField>/g, '</div>');

  // UInput / UTextarea -> inputs nativos (placeholder, type y class se conservan)
  out = out.replace(/<UInput\b([^>]*?)\/?>/gs, (_, attrs) => {
    const keep = attrs
      .replace(/\s+[a-z:@][a-z0-9:@.-]*="[^"]*"/gi, (a) => (/(?<![:\w-])(class|placeholder|type|name|value|id|rows|required|disabled|readonly)="/i.test(a) ? a : ''))
      .replace(/\s+[a-z:@][a-z0-9:@.-]*="[^"]*"/gi, (a) => (/(?<![:\w-])(class|placeholder|type|name|value|id)="/i.test(a) ? a : ''));
    return `<input${keep} />`;
  });
  out = out.replace(/<UTextarea\b([^>]*?)\/?>/gs, (_, attrs) => {
    const keep = attrs
      .replace(/\s+[a-z:@][a-z0-9:@.-]*="[^"]*"/gi, (a) => (/(?<![:\w-])(class|placeholder|name|id|rows|required|disabled|readonly)="/i.test(a) ? a : ''))
      .replace(/\s+[a-z:@][a-z0-9:@.-]*="[^"]*"/gi, (a) => (/(?<![:\w-])(class|placeholder|name|id|rows)="/i.test(a) ? a : ''));
    return `<textarea${keep}></textarea>`;
  });

  // UForm / UContainer -> form / div
  out = out.replace(/<UForm\b[^>]*>/g, '<form>').replace(/<\/UForm>/g, '</form>');
  out = out.replace(/<UContainer\b([^>]*)>/g, (_, attrs) => {
    const cls = attrs.match(/(?<![:\w-])class="([^"]*)"/)?.[1] ?? '';
    return `<div${cls ? ` class="${cls}"` : ''}>`;
  });
  out = out.replace(/<\/UContainer>/g, '</div>');

  // interpolaciones Vue que quedan -> texto legible
  out = out.replace(/\{\{\s*([^}]*?)\s*\}\}/g, (_, expr) => (expr.match(/^'([^']*)'$/) ? expr.slice(1, -1) : ''));

  // llaves literales en el contenido (ejemplos de código) -> entidades, Astro las
  // interpretaría como expresiones JS.
  out = out.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');

  // colores del tema Nuxt UI (primary-*) -> emerald (paleta real del sitio)
  out = out.replace(
    /((?:text|bg|border|ring|from|to|via|divide|placeholder|caret|accent|fill|stroke|outline|decoration)-)primary-(\d{2,3})/g,
    '$1emerald-$2'
  );
  out = out.replace(
    /((?:text|bg|border|ring|from|to|via|divide|placeholder|caret|accent|fill|stroke|outline|decoration)-)primary\b/g,
    '$1emerald-500'
  );

  return out;
}

const report = [];
for (const [srcPath, outPath] of MAP) {
  const raw = show(srcPath);
  const tpl = raw.match(/<template>([\s\S]*)<\/template>/)?.[1] ?? '';
  const { title, desc, canonical } = {
    ...headMeta(raw),
    ...(HEAD_OVERRIDE[srcPath] ?? {}),
  };
  const body = transform(tpl).trim();

  const file = `---
import ContentLayout from '${outPath.includes('/learn/') ? '../../layouts/ContentLayout.astro' : '../layouts/ContentLayout.astro'}';
---

<ContentLayout title={${JSON.stringify(title)}}${desc ? ` description={${JSON.stringify(desc)}}` : ''}${canonical ? ` canonical={${JSON.stringify(canonical)}}` : ''}>
${body
    .split('\n')
    .map((l) => (l.trim() ? '  ' + l : l))
    .join('\n')}
</ContentLayout>
`;

  const abs = join(ROOT, outPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, file);
  report.push({ outPath, bytes: file.length, leftovers: (body.match(/\{\{|v-[a-z]|<Nuxt|UIcon|:class|@click/g) || []).length });
}

for (const r of report) console.log(`${r.outPath}  ${r.bytes}b  leftovers=${r.leftovers}`);
console.log('\nFalta ajustar a mano: learn/index (grid artículos), support (tabs+faq), contact (form).');
