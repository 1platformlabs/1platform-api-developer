'use strict';
// node --test plugins/agent-docs — T-1, T-2, T-3 of the épica infraestructura-para-agentes-ia.
const test = require('node:test');
const assert = require('node:assert/strict');
const {mdxToMarkdown} = require('./convert.cjs');
const {collectPages, mdPath} = require('./index.cjs');

const ctx = (extra = {}) => ({
  file: 'x.mdx',
  link: (t) => (t.startsWith('/') ? `https://dev${t}` : t),
  productList: () => ['- [P](https://dev/p.md): d'],
  quickList: () => ['- [Q](https://dev/q.md): d'],
  prompt: (slug) => `prompt ${slug}\n\`\`\`bash\ncurl x\n\`\`\`\n`,
  ...extra,
});

test('T-1 the .md path comes from the permalink, not from the file name', () => {
  const allContent = {'docusaurus-plugin-content-docs': {default: {loadedVersions: [{
    docs: [
      {id: 'atlas/index', source: '@site/docs/atlas/index.mdx', permalink: '/docs/atlas/overview', title: 'Atlas', frontMatter: {description: 'd'}},
      {id: 'cat/index', source: '@site/docs/cat/index.mdx', permalink: '/docs/cat', title: 'Cat', frontMatter: {description: 'd'}},
      {id: 'cat/a', source: '@site/docs/cat/a.mdx', permalink: '/docs/cat/a', title: 'A', frontMatter: {description: 'd'}},
    ],
    sidebars: {docs: [
      {type: 'category', label: 'Cat', link: {type: 'doc', id: 'cat/index'}, items: [{type: 'doc', id: 'cat/a'}]},
      {type: 'category', label: 'Atlas', link: {type: 'doc', id: 'atlas/index'}, items: []},
    ]},
  }]}}};
  const pages = collectPages(allContent);
  assert.deepEqual(pages.map((p) => mdPath(p.permalink)), ['/docs/cat.md', '/docs/cat/a.md', '/docs/atlas/overview.md']);
  assert.deepEqual(pages.map((p) => p.section), ['Cat', 'Cat', 'Atlas']);
});

test('T-3 a page without description in the front matter fails', () => {
  const allContent = {'docusaurus-plugin-content-docs': {default: {loadedVersions: [{
    docs: [{id: 'a', source: '@site/docs/a.mdx', permalink: '/docs/a', title: 'A', description: 'derived from the body', frontMatter: {}}],
    sidebars: {docs: [{type: 'doc', id: 'a'}]},
  }]}}};
  assert.throws(() => collectPages(allContent), /no front matter description/);
});

test('T-2 an unknown component fails the conversion', () => {
  assert.throws(() => mdxToMarkdown('---\ntitle: t\n---\n\n<Foo />\n', ctx()), /unknown JSX\/HTML <Foo>/);
  assert.throws(() => mdxToMarkdown('Texto <Callout tipo="x">y</Callout>\n', ctx()), /unknown JSX\/HTML <Callout>/);
  assert.throws(() => mdxToMarkdown('Total: {precio}\n', ctx()), /JSX expression/);
  assert.throws(() => mdxToMarkdown('```bash\nx\n', ctx()), /unclosed code fence/);
});

test('known MDX becomes plain Markdown and fences are copied verbatim', () => {
  const source = [
    '---', 'title: t', 'description: d', '---', '',
    "import Tabs from '@theme/Tabs';",
    '<p className="lead">Hola <strong>mundo</strong> y <a href="/docs/x">x</a>.</p>',
    '<span id="viejo" />',
    '## Paso 1 {#paso-1}',
    '<div className="table-scroll" role="region" tabIndex={0}>',
    '| a | b<br />c |',
    '</div>',
    '<table tabIndex={0} aria-label="x"><tr><td><code>X-Id</code></td></tr></table>',
    '<Tabs groupId="lang">', '<TabItem value="py" label="Python">', '',
    '```jsx', '<Foo prop={1} />', "import x from 'y';", '```', '',
    '</TabItem>', '</Tabs>',
    '<ProductCards />',
    '<PromptParaAgente slug="maestro" />',
    'Un `<Tag>` en código y \\{llaves\\} escapadas.',
  ].join('\n');
  const md = mdxToMarkdown(source, ctx());
  assert.match(md, /^Hola \*\*mundo\*\* y \[x\]\(https:\/\/dev\/docs\/x\)\.$/m);
  assert.match(md, /^## Paso 1$/m);
  assert.match(md, /^\| a \| b<br>c \|$/m);
  assert.match(md, /^<table><tr><td>`X-Id`<\/td><\/tr><\/table>$/m);
  assert.match(md, /^\*\*Python\*\*$/m);
  assert.match(md, /^<Foo prop=\{1\} \/>$/m, 'fenced JSX is copied verbatim');
  assert.match(md, /^- \[P\]/m);
  assert.match(md, /^````text\nprompt maestro\n```bash/m, 'the prompt fence is longer than the fences it contains');
  assert.match(md, /Un `<Tag>` en código y \{llaves\} escapadas\./);
  assert.doesNotMatch(md, /className|import Tabs|<span|<\/?div|title: t/);
});
