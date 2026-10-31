'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {mdxToMarkdown} = require('./convert.cjs');

/**
 * Documentation an agent can read without scraping HTML (IPA-01, D-1/D-3):
 * `/llms.txt` (index), `/llms-full.txt` (every page, sidebar order) and one
 * `<permalink>.md` per sidebar page.
 *
 * A plugin hook and not an npm `postbuild`: the hook runs on EVERY
 * `docusaurus build`, the npm script only when someone remembers to call it.
 * Paths come from the docs plugin's PERMALINKS, never from file names —
 * `atlas-api/index.mdx` publishes as `/overview` and category `index.mdx` files
 * publish as their directory. `postBuild` does not receive other plugins'
 * content, so the pages are captured in `allContentLoaded`.
 */

const INDEX_FILE = 'llms.txt';
const FULL_FILE = 'llms-full.txt';

function indexLine(origin) {
  return `> Índice completo de la documentación para agentes: ${origin}/${INDEX_FILE}`;
}

/** Walk the sidebar in reading order, keeping the top-level section of each doc. */
function walkSidebar(items, section, visit) {
  for (const item of items) {
    if (item.type === 'doc' || item.type === 'ref') {
      visit(item.id, section);
    } else if (item.type === 'category') {
      const own = section ?? item.label;
      if (item.link?.type === 'doc') visit(item.link.id, own);
      walkSidebar(item.items ?? [], own, visit);
    }
  }
}

function mdPath(permalink) {
  return `${permalink.replace(/\/$/, '')}.md`;
}

function collectPages(allContent) {
  const docsPlugin = allContent['docusaurus-plugin-content-docs']?.default;
  const version = docsPlugin?.loadedVersions?.[0];
  if (!version) throw new Error('agent-docs: the docs plugin content was not loaded');
  const byId = new Map(version.docs.map((doc) => [doc.id, doc]));
  const pages = [];
  const seen = new Set();
  for (const sidebar of Object.values(version.sidebars)) {
    walkSidebar(sidebar, undefined, (id, section) => {
      if (seen.has(id)) return;
      seen.add(id);
      const doc = byId.get(id);
      if (!doc) throw new Error(`agent-docs: sidebar points to unknown doc ${id}`);
      const description = doc.frontMatter?.description;
      if (typeof description !== 'string' || !description.trim()) {
        throw new Error(`agent-docs: ${doc.source} has no front matter description (D-3)`);
      }
      // A product with a single page is collapsed into a plain sidebar link; it
      // is still a section of its own, not part of «Inicio».
      const ownSection = section ?? (/\/index\.mdx?$/.test(doc.source) ? doc.title : 'Inicio');
      pages.push({
        id,
        section: ownSection,
        title: doc.title,
        description: description.trim(),
        permalink: doc.permalink,
        source: doc.source,
        sidebarLabel: doc.sidebar_label ?? doc.frontMatter?.sidebar_label,
      });
    });
  }
  return pages;
}

/** Products of the home grid: the same `_category_.json` the HomeCards read. */
function productList(siteDir, pages, origin) {
  const root = path.join(siteDir, 'docs/saas/1platform-api');
  const products = [];
  for (const dir of fs.readdirSync(root, {withFileTypes: true})) {
    if (!dir.isDirectory()) continue;
    const file = path.join(root, dir.name, '_category_.json');
    if (!fs.existsSync(file)) continue;
    const cat = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (cat.customProps?.kind !== 'product') continue;
    const page = pages.find((p) => p.id === cat.link?.id);
    if (!page) throw new Error(`agent-docs: product ${dir.name} has no landing page`);
    products.push({position: cat.position ?? 0, line: `- [${cat.label}](${origin}${mdPath(page.permalink)}): ${cat.customProps.description ?? ''}`});
  }
  return products.sort((a, b) => a.position - b.position).map((p) => p.line);
}

function quickList(siteDir, website, link) {
  const quick = JSON.parse(fs.readFileSync(path.join(siteDir, 'src/components/HomeCards/quick.json'), 'utf8'));
  return quick.map((q) => `- [${q.title}](${link(q.href.replace('{website}', website))}): ${q.desc}`);
}

module.exports = function agentDocs(context) {
  const {siteDir, siteConfig} = context;
  const origin = siteConfig.url.replace(/\/$/, '');
  const website = String(siteConfig.customFields?.websiteUrl ?? 'https://1platform.pro');
  let pages = null;

  return {
    name: 'agent-docs',

    async allContentLoaded({allContent}) {
      pages = collectPages(allContent);
    },

    async postBuild({outDir}) {
      if (!pages) throw new Error('agent-docs: allContentLoaded did not run');
      const byPermalink = new Map(pages.map((p) => [p.permalink.replace(/\/$/, ''), p]));

      const link = (target) => {
        if (!target) return target;
        if (target.startsWith('pathname:///')) return `${origin}/${target.slice('pathname:///'.length)}`;
        if (!target.startsWith('/')) return target;
        const [pathname, hash] = target.split('#');
        const page = byPermalink.get(pathname.replace(/\/$/, ''));
        const resolved = page ? mdPath(page.permalink) : pathname;
        return `${origin}${resolved}${hash ? `#${hash}` : ''}`;
      };
      const products = productList(siteDir, pages, origin);
      const prompt = (slug) => {
        const file = path.join(siteDir, 'static/prompts', `${slug}.md`);
        if (!fs.existsSync(file)) throw new Error(`agent-docs: prompt ${slug} does not exist in static/prompts`);
        return fs.readFileSync(file, 'utf8');
      };

      const rendered = [];
      for (const page of pages) {
        const file = path.join(siteDir, page.source.replace(/^@site\//, ''));
        const body = mdxToMarkdown(fs.readFileSync(file, 'utf8'), {
          file: path.relative(siteDir, file),
          link,
          productList: () => products,
          quickList: () => quickList(siteDir, website, link),
          prompt,
        });
        // A page whose body already opens with its own `# Title` keeps it; the
        // others get the title from the front matter. Never two.
        const heading = /^# /.test(body) ? '' : `# ${page.title}\n\n`;
        const md = `${indexLine(origin)}\n\n${heading}${page.description}\n\n${body}`;
        const target = path.join(outDir, mdPath(page.permalink));
        fs.mkdirSync(path.dirname(target), {recursive: true});
        fs.writeFileSync(target, md);
        rendered.push({page, md});
      }

      const sections = [];
      for (const {page} of rendered) {
        let section = sections.find((s) => s.name === page.section);
        if (!section) sections.push((section = {name: page.section, lines: []}));
        section.lines.push(`- [${page.title}](${origin}${mdPath(page.permalink)}): ${page.description}`);
      }
      const index = [
        `# ${siteConfig.title}`,
        '',
        `> ${siteConfig.tagline}. Una sola API REST (\`https://api.1platform.pro/api/v1\`, QA en \`https://api-qa.1platform.pro/api/v1\`) con dos credenciales: el token de aplicación en \`Authorization: Bearer\` y el token de usuario en \`x-user-token\`.`,
        '',
        'Cada página de esta lista existe también en Markdown (la URL que termina en `.md`). El contrato exacto de cada operación está en el OpenAPI: no invente endpoints ni campos que no aparezcan ahí.',
        '',
        ...sections.flatMap((s) => [`## ${s.name}`, '', ...s.lines, '']),
        '## Recursos para agentes',
        '',
        `- [OpenAPI de la 1Platform API](${origin}/openapi/1platform-api.json): contrato completo de operaciones, parámetros y respuestas.`,
        `- [OpenAPI de la Atlas API](${origin}/openapi/atlas-api.json): contrato de la Atlas API, un producto independiente.`,
        `- [Documentación completa en un archivo](${origin}/${FULL_FILE}): todas las páginas de esta lista, en el mismo orden.`,
        '',
      ].join('\n');
      fs.writeFileSync(path.join(outDir, INDEX_FILE), index);

      const full = rendered.map(({page, md}) => md.replace(`${indexLine(origin)}\n\n`, `<!-- ${origin}${mdPath(page.permalink)} -->\n`));
      fs.writeFileSync(path.join(outDir, FULL_FILE), `${indexLine(origin)}\n\n${full.join('\n\n---\n\n')}`);
    },
  };
};

module.exports.collectPages = collectPages;
module.exports.mdPath = mdPath;
module.exports.walkSidebar = walkSidebar;
