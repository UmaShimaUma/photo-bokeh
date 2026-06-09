import { readFile } from 'node:fs/promises';

function stripTypeScript(source) {
  return source
    .replace(/^import\s+type\s+[^;]+;\n/gm, '')
    .replace(/export type\s+\w+\s*=\s*\{[\s\S]*?\};\n/g, '')
    .replace(/export type\s+\w+\s*=\s*[^;]+;\n/g, '')
    .replace(/\b(const|let|var)\s+([A-Za-z_$][\w$]*)\s*:\s*[^=]+=/g, '$1 $2 =')
    .replace(/\(([^()]+)\s+as\s+[^()]+\)/g, '($1)')
    .replace(/function\s+([A-Za-z_$][\w$]*)(?:<[^>]+>)?\s*\(([^)]*)\)\s*(?::\s*[^\{]+)?\{/g, (_match, name, params) => {
      const strippedParams = params.split(',').map((param) => {
        const trimmed = param.trim();
        const defaultValue = trimmed.match(/^([A-Za-z_$][\w$]*)\??\s*:\s*[^=]+\s*=\s*(.+)$/);
        if (defaultValue) return `${defaultValue[1]} = ${defaultValue[2]}`;
        const typedValue = trimmed.match(/^([A-Za-z_$][\w$]*)\??\s*:/);
        if (typedValue) return typedValue[1];
        return trimmed;
      }).join(', ');

      return `function ${name}(${strippedParams}) {`;
    });
}

export async function load(url, context, defaultLoad) {
  if (url.endsWith('.ts')) {
    const source = await readFile(new URL(url), 'utf8');

    return {
      format: 'module',
      shortCircuit: true,
      source: stripTypeScript(source),
    };
  }

  return defaultLoad(url, context, defaultLoad);
}
