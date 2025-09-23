import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are a legal-ops email drafter for Anduin’s digitization workflow. Draft **precise, concise, customer-friendly** emails that ask or confirm legal behaviors found during sub-doc review.
**Obligations:**

1.  Always cite the **exact section name** and **printed page** using the format “p. N”. Keep this format consistent across the email. When available, mention you’ve attached the screenshot(s). 
2.  Structure questions as **Issue → Proposed solution**. If you know the solution, propose it. If unclear, ask the customer to clarify intention. Avoid excessive legal jargon. 
3.  Do **not** ask about items that are clearly specified or not mentioned in the sub-doc. 
4.  Use one term consistently for each object (e.g., Investor/Subscriber/Applicant; the Fund/Partnership). Check “Types of mistake” and avoid them (wrong references, inconsistent short names, grammar). 
5.  If asking for PDF text changes, **explicitly request the updated PDF**. 
6.  Tone: polite, direct, and time-bounded; ask for reply by **Expected Date**. Use provided openers and follow-up language patterns. 
7.  New vs Existing customer:
    *   New → “new questions” framing. * Existing → “confirm prior behaviors (and new questions, if any)”.

**Output JSON Schema:**
The output should be a JSON object with the following structure:
{
  "subject": "Email Subject",
  "opening": "Opening paragraph of the email.",
  "assumptionsBlock": "Optional assumptions block.",
  "questions": [
    {
      "type": "question",
      "title": "Short title for the question",
      "issue": "Detailed description of the issue.",
      "evidence": {
        "sectionTitle": "Section title from the document",
        "pageRef": "p. N"
      },
      "proposedSolution": "Proposed solution or clarification needed.",
      "requestUpdatedPDF": false
    }
  ],
  "typos": [
    {
      "pageRef": "p. N",
      "excerpt": "Original text with typo",
      "suggestedFix": "Suggested correction"
    }
  ],
  "closing": "Closing paragraph of the email.",
  "signature": "Email signature.",
  "followUps": []
}
`

export interface Customer {
  name: string;
  timezone: string;
  isExistingCustomer?: boolean;
}

export interface Fund {
  name: string;
}

export interface SubDoc {
  name: string;
}

export interface Issue {
  category: string;
  sectionTitle: string;
  pageRef: string;
  needsUpdatedPDF: boolean;
}

export interface Typo {
  pageRef: string;
  excerpt: string;
  suggestedFix: string;
}

export interface EmailGenerationInputs {
  customer: Customer;
  funds: Fund[];
  issues: Issue[];
  typos: Typo[];
  expectedDate: string;
  firstTestingDate?: string;
}

export interface GeneratedEmail {
  subject: string;
  bodyHtml: string;
  bodyText: string;
}

export interface EmailMetadata {
  toneCheckPassed: boolean;
  referencesCheckPassed: boolean;
  followUpSchedule: any[]; // Adjust type as needed
}

export interface PostProcessorFlag {
  type: 'warning' | 'error';
  message: string;
}

export interface EmailGenerationResult {
  email: GeneratedEmail;
  metadata: EmailMetadata;
  flags: PostProcessorFlag[];
}

function constructUserPrompt(inputs: EmailGenerationInputs): string {
    const { customer, funds, issues, typos, expectedDate, firstTestingDate } = inputs;
    const prompt = `
Generate the JSON email draft per schema.
**Customer:** ${JSON.stringify(customer)}
**Funds:** ${JSON.stringify(funds)}
**Issues (sample):**
${issues.map(issue => `• ${issue.category} at “${issue.sectionTitle}”, ${issue.pageRef} (needs updated PDF: ${issue.needsUpdatedPDF})`).join('\n')}
**Typos:**
${typos.map(typo => `• ${typo.pageRef} (“${typo.excerpt}”→“${typo.suggestedFix}”)`).join('\n')}
**ExpectedDate:** ${expectedDate}
**firstTestingDate:** ${firstTestingDate || 'N/A'}
`;
    return prompt;
}

function constructEmailBody(json: any): { bodyHtml: string; bodyText: string } {
    let bodyHtml = `<p>${json.opening}</p>`;
    if (json.assumptionsBlock) {
        bodyHtml += `<p><strong>Assumptions based on previous responses:</strong><br/>${json.assumptionsBlock}</p>`;
    }
    bodyHtml += '<ul>';
    for (const q of json.questions) {
        bodyHtml += `<li><strong>${q.title}:</strong> ${q.issue} (<em>${q.evidence.sectionTitle}, ${q.evidence.pageRef}</em>).<br/>${q.proposedSolution}</li>`;
    }
    bodyHtml += '</ul>';
    if (json.typos && json.typos.length > 0) {
        bodyHtml += `<p><strong>Typos:</strong></p><ul>`;
        for (const t of json.typos) {
            bodyHtml += `<li>On ${t.pageRef}, we found “${t.excerpt}” which we believe should be “${t.suggestedFix}”.</li>`;
        }
        bodyHtml += '</ul>';
    }
    bodyHtml += `<p>${json.closing}</p><p>${json.signature}</p>`;

    let bodyText = `${json.opening}\n\n`;
    if (json.assumptionsBlock) {
        bodyText += `Assumptions based on previous responses:\n${json.assumptionsBlock}\n\n`;
    }
    for (const q of json.questions) {
        bodyText += `• ${q.title}: ${q.issue} (${q.evidence.sectionTitle}, ${q.evidence.pageRef}).\n${q.proposedSolution}\n`;
    }
    if (json.typos && json.typos.length > 0) {
        bodyText += `\nTypos:\n`;
        for (const t of json.typos) {
            bodyText += `• On ${t.pageRef}, we found “${t.excerpt}” which we believe should be “${t.suggestedFix}”.\n`;
        }
    }
    bodyText += `\n${json.closing}\n${json.signature}`;

    return { bodyHtml, bodyText };
}

function getNextBusinessDay(date: Date, timeZone: string): Date {
    // Simplified implementation: adds 1 day, ignores holidays and weekends.
    // A real implementation would use a library like date-fns-tz.
    const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    return nextDay;
}

function checkTerminology(text: string): PostProcessorFlag[] {
    const flags: PostProcessorFlag[] = [];
    const investorTerms = ['Investor', 'Subscriber', 'Applicant'];
    const fundTerms = ['Fund', 'Partnership'];

    const foundInvestorTerms = investorTerms.filter(term => text.includes(term));
    if (foundInvestorTerms.length > 1) {
        flags.push({ type: 'warning', message: `Inconsistent terminology for investor: ${foundInvestorTerms.join(', ')}` });
    }

    const foundFundTerms = fundTerms.filter(term => text.includes(term));
    if (foundFundTerms.length > 1) {
        flags.push({ type: 'warning', message: `Inconsistent terminology for fund: ${foundFundTerms.join(', ')}` });
    }

    return flags;
}

async function runPostProcessorChecks(
    generatedJson: any, 
    inputs: EmailGenerationInputs
): Promise<PostProcessorFlag[]> {
    const flags: PostProcessorFlag[] = [];

  // Check that all questions have a type
  if (!Array.isArray(generatedJson.questions)) {
    generatedJson.questions = [];
  }
  for (const question of generatedJson.questions) {
    if (!question.type) {
      throw new Error("Question is missing a type");
    }
  }

    // 1. Reference Check
    for (const q of generatedJson.questions) {
        if (!q.evidence.sectionTitle || !q.evidence.pageRef) {
            flags.push({ type: 'error', message: `Missing sectionTitle or pageRef for question: ${q.title}` });
        }
        if (q.evidence.pageRef && !/p\. \d+/.test(q.evidence.pageRef)) {
            flags.push({ type: 'warning', message: `Incorrect pageRef format for question: ${q.title}` });
        }
    }

    // 2. No-Ask Rule (Placeholder)
    // This rule requires deeper semantic understanding of the sub-docs.
    // flags.push({ type: 'warning', message: 'No-Ask Rule check is not fully implemented.' });

    // 3. Updated PDF Rule
    for (const q of generatedJson.questions) {
        if (q.requestUpdatedPDF && !q.proposedSolution.toLowerCase().includes('updated') && !q.proposedSolution.toLowerCase().includes('revised')) {
            flags.push({ type: 'warning', message: `Question “${q.title}” may need to explicitly ask for an updated PDF.` });
        }
    }

    // 4. Terminology Consistency
    const emailText = `${generatedJson.opening} ${generatedJson.questions.map((q:any) => q.issue + ' ' + q.proposedSolution).join(' ')} ${generatedJson.closing}`;
    flags.push(...checkTerminology(emailText));

    // 5. Expected Date Calculation (Simplified)
    const expectedDate = getNextBusinessDay(new Date(), inputs.customer.timezone);
    // A more complex implementation would compare this with the LLM's expected date.

    // 6. Grammar & Style (Not implemented)
    // flags.push({ type: 'warning', message: 'Grammar and style check is not implemented.' });

    return flags;
}

export async function generateReviewEmail(inputs: EmailGenerationInputs): Promise<EmailGenerationResult> {
  const userPrompt = constructUserPrompt(inputs);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable not set');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent([SYSTEM_PROMPT, userPrompt]);
  const response = result.response;
  const text = response.text();
  const cleanedText = text.replace(/```json\n|```/g, '').trim();

  const generatedJson = JSON.parse(cleanedText);

  const flags = await runPostProcessorChecks(generatedJson, inputs);

  const { bodyHtml, bodyText } = constructEmailBody(generatedJson);

  const email: GeneratedEmail = {
      subject: generatedJson.subject,
      bodyHtml,
      bodyText,
  }

  const metadata: EmailMetadata = {
      toneCheckPassed: !flags.some(f => f.type === 'error'),
      referencesCheckPassed: !flags.some(f => f.message.includes('pageRef') || f.message.includes('sectionTitle')),
      followUpSchedule: generatedJson.followUps,
  }

  return { email, metadata, flags };
}
