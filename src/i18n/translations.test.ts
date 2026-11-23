import en from './en.json';
import hi from './hi.json';
import mr from './mr.json';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((out, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[path] = value;
    else Object.assign(out, flatten(value, path));
    return out;
  }, {});
}

const placeholders = (s: string) => (s.match(/\{\{\s*\w+\s*\}\}/g) ?? []).map((p) => p.replace(/\s/g, '')).sort();

const english = flatten(en as Tree);

describe.each([
  ['hi', hi],
  ['mr', mr],
])('%s translation', (_lang, file) => {
  const translated = flatten(file as Tree);

  it('has exactly the same keys as English', () => {
    expect(Object.keys(translated).sort()).toEqual(Object.keys(english).sort());
  });

  it('keeps every placeholder', () => {
    for (const [key, value] of Object.entries(english)) {
      expect([key, placeholders(translated[key] ?? '')]).toEqual([key, placeholders(value)]);
    }
  });

  it('uses Western digits only', () => {
    for (const value of Object.values(translated)) {
      expect(value).not.toMatch(/[०-९]/);
    }
  });
});
