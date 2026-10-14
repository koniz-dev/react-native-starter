import { darkTheme, lightTheme } from '@/shared/ui/theme';
function ch(c: string) { const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c); return m ? m.slice(1,4).map(Number) : [1,3,5].map(i=>parseInt(c.slice(i,i+2),16)); }
function lum(c: string) { const [r,g,b] = ch(c).map(v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4;}); return 0.2126*r!+0.7152*g!+0.0722*b!; }
function cr(a: string,b: string){const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return ((x!+0.05)/(y!+0.05)).toFixed(2);}
it('contrast survey', () => {
  for (const [n,t] of [['light',lightTheme],['dark',darkTheme]] as const) {
    const c = t.colors as unknown as Record<string,string> & {elevation: Record<string,string>};
    const pairs = [['error','background'],['error','surface'],['onError','error'],['onErrorContainer','errorContainer'],['outline','background'],['onTertiary','tertiary'],['primary','surfaceVariant'],['onSurfaceVariant','elevation.level2'],['primary','secondaryContainer'],['onSurface','secondaryContainer'],['inverseOnSurface','inverseSurface'],['onSurfaceVariant','elevation.level3']];
    const get = (k: string) => k.startsWith('elevation.') ? c.elevation[k.slice(10)]! : c[k]!;
    console.log(n, pairs.map(([a,b]) => `${a}/${b}=${cr(get(a!),get(b!))}`).join('  '), 'tertiary', c.tertiary, 'inverseSurface', c.inverseSurface, 'backdrop', c.backdrop, 'surfaceDisabled', c.surfaceDisabled);
  }
});
