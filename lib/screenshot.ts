import * as fs from 'fs';
import * as path from 'path';
import { createServerSupabase } from './supabaseServer';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { createCanvas } from 'canvas';

// Disable worker for Node.js environment
pdfjsLib.GlobalWorkerOptions.workerSrc = false;

export interface ScreenshotOptions {
  pdfBuffer: Buffer;
  pageNumber: number;
  fileName: string;
  issueIndex: number;
}

/**
 * Generates a screenshot from a PDF page and uploads it to Supabase storage
 */
export async function generateScreenshot({
  pdfBuffer,
  pageNumber,
  fileName,
  issueIndex
}: ScreenshotOptions): Promise<string | null> {
  try {
    // Load PDF document
    const pdfDocument = await pdfjsLib.getDocument({
      data: pdfBuffer,
      useSystemFonts: true
    }).promise;

    if (pageNumber > pdfDocument.numPages) {
      console.error(`Page ${pageNumber} does not exist in PDF`);
      return null;
    }

    // Get the specific page
    const page = await pdfDocument.getPage(pageNumber);

    // Set up rendering context
    const scale = 2.0; // Higher scale for better quality
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    // Render page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    // Convert canvas to buffer
    const imageBuffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });

    // For now, save locally and return a data URL for testing
    // TODO: Upload to Supabase storage once bucket is configured
    const tempDir = path.join(process.cwd(), 'temp');

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempImagePath = path.join(tempDir, `${fileName}_page_${pageNumber}_issue_${issueIndex}.jpg`);
    fs.writeFileSync(tempImagePath, imageBuffer);

    // Convert to base64 data URL for immediate display
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;

    console.log(`✅ Generated screenshot for page ${pageNumber}, issue ${issueIndex}`);
    return dataUrl;

  } catch (error) {
    console.error('Error generating screenshot:', error);
    return null;
  }
}

/**
 * Generates screenshots for multiple issues
 */
export async function generateScreenshots(
  pdfBuffer: Buffer,
  fileName: string,
  issues: Array<{ page: number }>
): Promise<Array<string | null>> {
  const screenshots: Array<string | null> = [];

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    const screenshotUrl = await generateScreenshot({
      pdfBuffer,
      pageNumber: issue.page,
      fileName,
      issueIndex: i
    });

    screenshots.push(screenshotUrl);
  }

  return screenshots;
}