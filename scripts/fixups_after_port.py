#!/usr/bin/env python3
# Ajustes que el conversor mecánico no puede deducir: rejilla de artículos,
# FAQs, formularios reales y fusión de atributos class duplicados.
# Se ejecuta DESPUÉS de scripts/port_nuxt_content.mjs.
import glob
import pathlib
import re


def merge_dup_class(html: str) -> str:
    """Un elemento con dos class="" (una del template, otra del :class resuelto)
    conserva una sola, con las clases unidas."""
    def fix_tag(m):
        tag = m.group(0)
        if tag.count('class="') < 2:
            return tag
        classes = re.findall(r'class="([^"]*)"', tag)
        merged = ' '.join(c.strip() for c in classes if c.strip())
        first = True

        def repl(_):
            nonlocal first
            if first:
                first = False
                return f' class="{merged}"'
            return ''

        tag = re.sub(r'\s*class="[^"]*"', repl, tag)
        return tag

    return re.sub(r'<[a-zA-Z][^<>]*?>', fix_tag, html)


ARTICLES = [
    ('what-are-tokens', 'What are Tokens?', '💲', 'Beginner', '5 min read',
     'Learn about different types of tokens, their standards, and how they work across blockchains.'),
    ('defi-basics', 'DeFi Basics', '💵', 'Beginner', '8 min read',
     'Get started with DeFi concepts, liquidity, and decentralized trading protocols.'),
    ('token-standards', 'Token Standards', '⚙️', 'Intermediate', '10 min read',
     'Explore the different token standards used on Ethereum, Solana, and Internet Computer.'),
    ('cross-chain-swapping', 'Cross-Chain Swapping', '🔄', 'Intermediate', '7 min read',
     'Discover how to swap tokens between different blockchains seamlessly and securely.'),
    ('gasless-transactions', 'Gasless Transactions', '⚡', 'Advanced', '9 min read',
     'Learn about gasless transaction technology and how it makes swapping more accessible.'),
]

FAQS = [
    ('How do gasless transactions work?',
     'Gasless transactions use cryptographic permits that allow contracts to execute transactions on your behalf without requiring you to pay gas fees. You sign a permit with your wallet, and our server submits the transaction.'),
    ('Which networks are supported?',
     'Ionic Swap runs on its own FreeBSD-native chain with its own ledger, and bridges value against Ethereum (EVM) and Solana assets. Everything settles on our own server, no external canisters.'),
    ('What token standards are supported?',
     'Every token listed by our own server (/api/tokens), plus ERC-20 on EVM chains and SPL tokens on Solana when you bridge in.'),
    ('How long do swaps take?',
     'Swaps on our own chain settle in milliseconds. Bridge-in from Solana is typically seconds; EVM takes 1-5 minutes depending on congestion.'),
    ('Are there any fees for swapping?',
     "Ionic Swap uses gasless transactions, so you don't pay network gas. A small protocol fee (0.3%) applies per swap and is accrued by the server's ledger."),
    ('Is my wallet secure?',
     'Yes. Ionic Swap is non-custodial: we never touch your private keys. You sign with your own wallet (MetaMask, Phantom, Rabby, Plug, Magic Eden or the built-in local wallet); the server only stores balances and positions.'),
]


def fix_learn_index():
    p = pathlib.Path('src/pages/learn/index.astro')
    s = p.read_text()
    cards = []
    for slug, title, icon, diff, rt, desc in ARTICLES:
        cards.append(f'''          <a
            href="/learn/{slug}"
            class="group bg-zinc-50 dark:bg-neutral-900 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <span class="text-xl inline-flex items-center justify-center leading-none" aria-hidden="true">{icon}</span>
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {title}
                </h3>
                <p class="text-sm text-zinc-600 dark:text-zinc-300">{diff}</p>
              </div>
            </div>
            <p class="text-zinc-600 dark:text-zinc-300 mb-4 line-clamp-2">{desc}</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <span class="w-4 h-4 inline-flex items-center justify-center leading-none" aria-hidden="true">⏱️</span>
                <span>{rt}</span>
              </div>
              <span class="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform inline-flex items-center justify-center leading-none" aria-hidden="true">→</span>
            </div>
          </a>''')
    grid = ('          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">\n'
            + '\n'.join(cards) + '\n          </div>')
    start = s.index('<!-- All Articles Grid -->')
    end = s.index('<!-- Call to Action -->')
    section = s[start:end]
    section = re.sub(r'(<h2[\s\S]*?All Articles[\s\S]*?</h2>\s*)<div class="grid[\s\S]*\n          </div>',
                     lambda m: m.group(1) + grid, section, count=1)
    p.write_text(merge_dup_class(s[:start] + section + s[end:]))
    print('learn/index.astro: rejilla de 5 artículos')


def fix_support():
    p = pathlib.Path('src/pages/support.astro')
    s = p.read_text()
    items = []
    for q, a in FAQS:
        items.append(f'''              <details class="border-b border-gray-200 dark:border-gray-700 pb-4 group">
                <summary class="text-lg font-semibold text-zinc-900 dark:text-white cursor-pointer list-none flex items-center justify-between gap-4">
                  <span>{q}</span>
                  <span class="text-emerald-500 group-open:rotate-45 transition-transform" aria-hidden="true">＋</span>
                </summary>
                <p class="text-zinc-600 dark:text-zinc-300 mt-3">{a}</p>
              </details>''')
    block = '            <div class="space-y-6">\n' + '\n'.join(items) + '\n            </div>'
    s = re.sub(r'(Frequently Asked Questions[\s\S]*?</h2>\s*)<div class="space-y-6">[\s\S]*?\n            </div>',
               lambda m: m.group(1) + block, s, count=1)

    for anchor, marker in (('faq', '<!-- FAQ Section -->'), ('chat', '<!-- Chat Section -->'),
                           ('email-support', '<!-- Email Section -->')):
        s = s.replace(f'''{marker}
          <div
            class="bg-zinc-50 dark:bg-neutral-800 rounded-lg shadow p-8"
          >''', f'''{marker}
          <div
            id="{anchor}"
            class="bg-zinc-50 dark:bg-neutral-800 rounded-lg shadow p-8 scroll-mt-20"
          >''')

    for color, href, label in (('emerald', '#faq', 'Browse FAQ →'),
                              ('green', '#chat', 'Start Chat →'),
                              ('purple', '#email-support', 'Send Email →')):
        s = s.replace(f'''            <button
              class="text-{color}-600 dark:text-{color}-400 hover:text-{color}-700 dark:hover:text-{color}-300 font-medium"
            >
              {label}
            </button>''', f'''            <a
              href="{href}"
              class="text-{color}-600 dark:text-{color}-400 hover:text-{color}-700 dark:hover:text-{color}-300 font-medium"
            >
              {label}
            </a>''')

    s = s.replace('''              <button type="button">
                Contact Email Support
              </button>''', '''              <a href="#email-support" class="inline-block px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors">
                Contact Email Support
              </a>''')

    s = s.replace('''            <div class="space-y-4">
              <div>
                <label
                  class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Subject''', '''            <form id="support-form" class="space-y-4" novalidate>
              <div>
                <label
                  class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Subject''')
    s = s.replace('''                <input
                  placeholder="Brief description of your issue"
                  class="w-full"
                 />''', '''                <input
                  id="support-subject"
                  name="subject"
                  required
                  placeholder="Brief description of your issue"
                  class="w-full"
                 />''')
    s = s.replace('''                <textarea
                  placeholder="Please provide as much detail as possible about your issue..."
                  class="w-full"
                ></textarea>''', '''                <textarea
                  id="support-message"
                  name="message"
                  required
                  rows="5"
                  placeholder="Please provide as much detail as possible about your issue..."
                  class="w-full"
                ></textarea>''')
    s = s.replace('''                <input
                  type="email"
                  placeholder="your@email.com"
                  class="w-full"
                 />''', '''                <input
                  id="support-email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  placeholder="your@email.com"
                  class="w-full"
                 />''')
    s = s.replace('''              <button type="button" class="w-full">
                Send Support Request
              </button>''', '''              <button type="submit" class="w-full">
                Send Support Request
              </button>
              <p id="support-status" class="text-sm text-zinc-500 dark:text-zinc-400" role="status" aria-live="polite"></p>''')
    s = s.replace('''            </div>
          </div>
        </div>
      </div>
    </div>
</ContentLayout>''', '''            </form>
          </div>
        </div>
      </div>
    </div>
</ContentLayout>

<script>
  const sForm = document.getElementById('support-form') as HTMLFormElement | null;
  const sStatus = document.getElementById('support-status');
  const setS = (msg: string, ok?: boolean) => {
    if (!sStatus) return;
    sStatus.textContent = msg;
    sStatus.style.color = ok === undefined ? '' : ok ? '#10b981' : '#f87171';
  };

  sForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(sForm);
    const payload = Object.fromEntries([...data.entries()].map(([k, v]) => [k, String(v)]));
    if (!payload.subject || !payload.message) {
      setS('Subject and message are required.', false);
      return;
    }
    setS('Sending...');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, topic: 'support' }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      sForm.reset();
      setS('Request received! We will reply within 24 hours.', true);
    } catch (err) {
      const subject = encodeURIComponent(String(payload.subject));
      const body = encodeURIComponent(
        String(payload.message) + '\\n\\nFrom: ' + String(payload.email ?? '')
      );
      setS('Server unavailable — opening your mail client instead.', false);
      window.location.href = 'mailto:support@ionicswap.com?subject=' + subject + '&body=' + body;
    }
  });
</script>''')
    p.write_text(merge_dup_class(s))
    print('support.astro: FAQs + anchors + formulario')


def fix_contact():
    p = pathlib.Path('src/pages/contact.astro')
    s = p.read_text()
    s = s.replace('<form>', '<form id="contact-form" novalidate>')
    s = s.replace('''                  <input
                    placeholder="Your name"''', '''                  <input
                    name="name"
                    required
                    autocomplete="name"
                    placeholder="Your name"''')
    s = s.replace('''                  <input
                    type="email"
                    placeholder="your@email.com"''', '''                  <input
                    name="email"
                    type="email"
                    required
                    autocomplete="email"
                    placeholder="your@email.com"''')
    s = s.replace('''                  <input
                    placeholder="Your company"''', '''                  <input
                    name="company"
                    autocomplete="organization"
                    placeholder="Your company"''')
    s = s.replace('''                  <textarea
                    placeholder="Tell us about your inquiry..."''', '''                  <textarea
                    name="message"
                    required
                    rows="4"
                    placeholder="Tell us about your inquiry..."''')
    s = s.replace('''              <button type="button" class="w-full font-medium mt-4">''',
                  '''              <button type="submit" class="w-full font-medium mt-4">''')
    s = s.replace('''            <div
              class="text-center text-sm text-zinc-500 dark:text-zinc-300 mt-2"
            >
              We'll get back to you within 5-7 business days.
            </div>''', '''            <div
              id="contact-status"
              class="text-center text-sm text-zinc-500 dark:text-zinc-300 mt-2"
              role="status"
              aria-live="polite"
            >
              We'll get back to you within 5-7 business days.
            </div>''')
    s = s.replace('</ContentLayout>', '''</ContentLayout>

<script>
  // Envío al backend propio (Rust server: POST /api/contact). Sin terceros.
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  const status = document.getElementById('contact-status');
  const setStatus = (msg: string, tone: 'ok' | 'err' | 'info' = 'info') => {
    if (!status) return;
    status.textContent = msg;
    status.style.color = tone === 'ok' ? '#10b981' : tone === 'err' ? '#f87171' : '';
  };

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = Object.fromEntries([...data.entries()].map(([k, v]) => [k, String(v)]));
    if (!payload.name || !payload.email || !payload.message) {
      setStatus('Please fill in name, email and message.', 'err');
      return;
    }
    setStatus('Sending...', 'info');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      form.reset();
      setStatus('Message received! We will get back to you soon.', 'ok');
    } catch (err) {
      const subject = encodeURIComponent('Contact from ' + payload.name);
      const body = encodeURIComponent(
        payload.message + '\\n\\nFrom: ' + payload.name + ' <' + payload.email + '>' +
        (payload.company ? '\\nCompany: ' + payload.company : '')
      );
      setStatus('Server unavailable — opening your mail client instead.', 'err');
      window.location.href = 'mailto:contact@worldofunreal.com?subject=' + subject + '&body=' + body;
    }
  });
</script>''')
    p.write_text(merge_dup_class(s))
    print('contact.astro: formulario -> /api/contact')


def main():
    fix_learn_index()
    fix_support()
    fix_contact()
    print('fixups listos')


if __name__ == '__main__':
    main()
