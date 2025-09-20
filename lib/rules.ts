type Issue = {
  page: number;
  type: 'reference'|'numbering';
  message: string;
  original: string;
  suggestion: string;
  locationHint: string;
};
const SECTION_DECL_RE = /\bSection\s+(?:[IVXLCDM]+|\d+|[A-Z])\b/g;

export function collectDeclaredSections(pages: string[]) {
  const m = new Map<string, Set<number>>();
  pages.forEach((text, i) => {
    text.split('\n').forEach(line => {
      const hits = line.match(SECTION_DECL_RE);
      if (!hits) return;
      hits.forEach(tok => {
        const looksHeader = /^\s*Section\s+(?:[IVXLCDM]+|\d+|[A-Z])(\s*[–—-:])/.test(line) || line.trimStart().startsWith(tok);
        if (looksHeader) {
          const s = m.get(tok) ?? new Set<number>();
          s.add(i+1); m.set(tok, s);
        }
      });
    });
  });
  return m;
}

export function collectReferencedSections(pages: string[]) {
  const refs: Array<{label:string,page:number,context:string}> = [];
  pages.forEach((text, i) => {
    const it = text.matchAll(SECTION_DECL_RE);
    for (const m of it) {
      const label = m[0];
      const start = Math.max(0, (m.index ?? 0) - 40);
      const end = Math.min(text.length, (m.index ?? 0) + label.length + 40);
      refs.push({ label, page: i+1, context: text.slice(start, end).replace(/\s+/g,' ').trim() });
    }
  });
  return refs;
}

export function diffMissingReferences(declared: Map<string, Set<number>>, referenced: Array<{label:string,page:number,context:string}>): Issue[] {
  const issues: Issue[] = [];
  for (const r of referenced) {
    if (!declared.has(r.label)) {
      issues.push({
        page: r.page,
        type: 'reference',
        message: `Reference to missing section: ${r.label}`,
        original: r.context,
        suggestion: `Remove/update the reference; declared sections: ${[...declared.keys()].join(', ') || 'none'}.`,
        locationHint: r.context
      });
    }
  }
  return issues;
}

export function findNumberingGaps(pages: string[]): Issue[] {
  const issues: Issue[] = [];
  const LIST_RE = /^\s*([a-zA-Z]|\d+)[\.\)]\s+/;
  pages.forEach((text, idx) => {
    const lines = text.split('\n');
    let seq: Array<{lab:string,line:string}> = [];
    const flush = () => {
      if (seq.length < 2) { seq = []; return; }
      const alpha = /^[A-Za-z]$/.test(seq[0].lab);
      if (alpha) {
        for (let i=1;i<seq.length;i++){
          const prev = seq[i-1].lab.toLowerCase().charCodeAt(0);
          const curr = seq[i].lab.toLowerCase().charCodeAt(0);
          if (curr !== prev+1) issues.push({
            page: idx+1, type:'numbering',
            message:`List jumps from "${seq[i-1].lab}" to "${seq[i].lab}"`,
            original: seq[i].line, suggestion:`Insert "${String.fromCharCode(prev+1)}." or renumber.`,
            locationHint: seq[i].line.trim()
          });
        }
      } else {
        for (let i=1;i<seq.length;i++){
          const p = Number(seq[i-1].lab); const c = Number(seq[i].lab);
          if (Number.isFinite(p) && Number.isFinite(c) && c !== p+1) issues.push({
            page: idx+1, type:'numbering',
            message:`List jumps from "${p}" to "${c}"`,
            original: seq[i].line, suggestion:`Insert "${p+1}." or renumber.`,
            locationHint: seq[i].line.trim()
          });
        }
      }
      seq = [];
    };
    for (const line of lines) {
      const m = line.match(LIST_RE);
      if (m) seq.push({ lab:m[1], line });
      else flush();
    }
    flush();
  });
  return issues;
}
