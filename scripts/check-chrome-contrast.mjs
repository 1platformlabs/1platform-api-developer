import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const css = readFileSync(new URL('src/css/custom.css', root), 'utf8');
const brand = JSON.parse(readFileSync(new URL('src/css/brand-tokens.json', root), 'utf8'));
function color(name) {
  if (name.startsWith('--brand-')) return brand[name.slice(8)];
  const value = css.match(new RegExp(`${name}:\\s*([^;]+)`))?.[1].trim();
  if (value?.startsWith('var(')) return color(value.slice(4, -1));
  if (!/^#[a-f\d]{6}$/i.test(value ?? '')) throw new Error(`Missing color token ${name}`);
  return value;
}
function luminance(hex) {const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
function ratio(a,b) {const [l,h]=[luminance(a),luminance(b)].sort((a,b)=>a-b);return (h+.05)/(l+.05);}
const pairs=[['--ink','--surface'],['--muted','--selected'],['--on-dark','--navy'],['--ink','--wash'],['--code-text','--navy'],['--code-muted','--code-raised'],['--http-post','--http-post-bg'],['--http-write','--http-write-bg'],['--http-delete','--http-delete-bg'],['--blue','--selected'],['--footer-muted','--navy-deep'],['--footer-heading','--navy-deep'],['--footer-link','--navy-deep'],['--footer-bottom','--navy-deep']];
pairs.push(...['--code-accent', '--code-green', '--code-purple', '--code-orange', '--code-red'].map(token => [token, '--navy']));
pairs.push(...['--code-accent', '--code-green', '--code-purple', '--code-orange', '--code-red'].map(token => [token, '--code-raised']));
if(process.argv.includes('--self-test')) {assert(ratio('#ffffff','#eeeeee')<4.5);assert(ratio('#000000','#ffffff')>20);console.log('ok   contrast self-test');}
else {for(const [fg,bg] of pairs) {const r=ratio(color(fg),color(bg));assert(r>=4.5,`${fg} on ${bg} ${r.toFixed(2)} below AA`);console.log(`ok   ${fg} on ${bg} ${r.toFixed(2)}`);}assert(ratio(color('--code-accent'),color('--navy'))>=3);console.log('ok   focus on navbar');}
