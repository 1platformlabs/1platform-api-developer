'use strict';

/**
 * MDX → Markdown for agents (épica infraestructura-para-agentes-ia, D-1).
 *
 * The conversion is an ALLOWLIST: every JSX component and HTML tag the docs use
 * today has a rule here, and anything else makes the build fail. Publishing a
 * page with an unknown component silently dropped would hand an agent a page
 * that reads complete and is not — the same reason an unknown `{expression}`
 * outside code is an error instead of being copied through.
 *
 * Fenced blocks are copied verbatim. Inline code is never rewritten.
 */

// Tags left in the output on purpose: plain HTML that Markdown renders as-is.
// Their attributes are stripped (`tabIndex={0}` is JSX, not HTML).
const KEPT_HTML = new Set(['table', 'thead', 'tbody', 'tr', 'th', 'td', 'br']);
// Layout wrappers: the tag goes, the content stays.
const WRAPPERS = new Set(['div', 'section', 'aside', 'p', 'span']);
const COMPONENTS = new Set(['Link', 'ProductCards', 'QuickCards', 'Tabs', 'TabItem', 'PromptParaAgente']);

class ConversionError extends Error {}

function fail(file, line, message) {
  throw new ConversionError(`${file}:${line}: ${message}`);
}

function stripFrontMatter(source) {
  if (!source.startsWith('---\n')) return {body: source, offset: 0};
  const end = source.indexOf('\n---\n', 4);
  if (end === -1) return {body: source, offset: 0};
  const head = source.slice(0, end + 5);
  return {body: source.slice(end + 5), offset: head.split('\n').length - 1};
}

/** Apply `fn` to the parts of a line that are not inline code. */
function outsideInlineCode(line, fn) {
  let out = '';
  let rest = line;
  for (;;) {
    const start = rest.search(/`+/);
    if (start === -1) return out + fn(rest);
    const ticks = rest.slice(start).match(/^`+/)[0];
    const close = rest.indexOf(ticks, start + ticks.length);
    if (close === -1) return out + fn(rest);
    out += fn(rest.slice(0, start)) + rest.slice(start, close + ticks.length);
    rest = rest.slice(close + ticks.length);
  }
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`));
  return m ? (m[1] ?? m[2]) : undefined;
}

function convertInline(text, ctx) {
  return text
    .replace(/<h([1-6])\b[^>]*>(.*?)<\/h\1>/g, (_, level, inner) => `${'#'.repeat(Number(level))} ${inner}`)
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '_$1_')
    .replace(/<code>(.*?)<\/code>/g, '`$1`')
    .replace(/<a\b([^>]*)>(.*?)<\/a>/g, (_, attrs, inner) => `[${inner}](${ctx.link(attr(attrs, 'href') ?? '')})`)
    .replace(/<Link\b([^>]*)>(.*?)<\/Link>/g, (_, attrs, inner) => `[${inner}](${ctx.link(attr(attrs, 'to') ?? attr(attrs, 'href') ?? '')})`)
    .replace(/<br\s*\/?>/g, '<br>')
    .replace(/<(table|thead|tbody|tr|th|td)\b[^>]*>/g, '<$1>')
    .replace(/<\/?(?:div|section|aside|p)\b[^>]*>/g, '')
    .replace(/<span\b[^>]*\/>/g, '')
    .replace(/\]\(([^)\s]+)\)/g, (_, target) => `](${ctx.link(target)})`);
}

function checkLeftovers(text, file, lineNo) {
  for (const m of text.matchAll(/<\/?([A-Za-z][A-Za-z0-9.]*)/g)) {
    if (KEPT_HTML.has(m[1])) continue;
    if (COMPONENTS.has(m[1]) || WRAPPERS.has(m[1])) fail(file, lineNo, `<${m[1]}> in a form the converter does not handle`);
    fail(file, lineNo, `unknown JSX/HTML <${m[1]}>`);
  }
  if (/(?<!\\)[{}]/.test(text)) fail(file, lineNo, 'JSX expression outside code');
}

/**
 * @param {string} source MDX with front matter
 * @param {object} ctx {file, link(target)→string, productList()→string[], quickList()→string[], prompt(slug)→string}
 */
function mdxToMarkdown(source, ctx) {
  const file = ctx.file;
  const {body, offset} = stripFrontMatter(source);
  const out = [];
  let fence = null;
  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const lineNo = i + 1 + offset;
    const fenceMark = raw.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      out.push(raw);
      if (fenceMark && fenceMark[1][0] === fence[0] && fenceMark[1].length >= fence.length && raw.trim() === fenceMark[1]) fence = null;
      continue;
    }
    if (fenceMark) {
      fence = fenceMark[1];
      out.push(raw);
      continue;
    }
    const line = raw.trim();
    if (/^import\s.+\sfrom\s.+;?$/.test(line) || /^import\s+['"].+['"];?$/.test(line)) continue;
    if (/^export\s/.test(line)) fail(file, lineNo, 'MDX export is not supported');
    if (/^<ProductCards\s*\/>$/.test(line)) { out.push(...ctx.productList()); continue; }
    if (/^<QuickCards\s*\/>$/.test(line)) { out.push(...ctx.quickList()); continue; }
    if (/^<PromptParaAgente\b[^>]*\/>$/.test(line)) {
      const slug = attr(line, 'slug');
      if (!slug) fail(file, lineNo, '<PromptParaAgente> without slug');
      const text = ctx.prompt(slug).replace(/\n+$/, '');
      const longest = Math.max(2, ...[...text.matchAll(/`{3,}/g)].map((m) => m[0].length));
      const ticks = '`'.repeat(longest + 1);
      out.push(`Prompt para su agente (también en ${ctx.link(`pathname:///prompts/${slug}.md`)}):`, '', `${ticks}text`, text, ticks);
      continue;
    }
    if (/^<\/?Tabs\b[^>]*>$/.test(line) || /^<\/TabItem>$/.test(line)) continue;
    if (/^<TabItem\b[^>]*>$/.test(line)) {
      const label = attr(line, 'label') ?? attr(line, 'value');
      if (!label) fail(file, lineNo, '<TabItem> without label');
      out.push(`**${label}**`);
      continue;
    }
    if (/^<aside\b[^>]*>$/.test(line)) {
      const label = attr(line, 'aria-label');
      if (label) out.push('', `**${label}**`, '');
      continue;
    }
    if (/^<\/?(div|section|aside)\b[^>]*>$/.test(line) || /^<span\b[^>]*\/>$/.test(line)) continue;

    // Content nested in a layout wrapper is indented in the MDX; in Markdown that
    // indentation would turn a heading into a code block.
    const source = /^\s+</.test(raw) ? raw.trimStart() : raw;
    let text = source.replace(/^(#{1,6}\s.*?)\s*\{#[^}]+\}\s*$/, '$1');
    text = outsideInlineCode(text, (part) => {
      const converted = convertInline(part, ctx);
      checkLeftovers(converted, file, lineNo);
      return converted.replace(/\\([{}<>])/g, '$1');
    });
    out.push(text);
  }
  if (fence) fail(file, lines.length + offset, 'unclosed code fence');
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

module.exports = {mdxToMarkdown, ConversionError, outsideInlineCode};
