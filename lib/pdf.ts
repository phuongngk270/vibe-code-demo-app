import pdf from 'pdf-parse';
export async function extractPdfText(buf: Buffer): Promise<{ pages: string[] }> {
  const d = await pdf(buf);
  const raw = d.text || '';
  const pages = raw.includes('\f') ? raw.split('\f') : [raw];
  return { pages };
}
