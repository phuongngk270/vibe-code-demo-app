# Anduin Sub-doc Reviewer

This application is a subscription document reviewer that leverages AI to analyze PDF documents for various issues (typos, formatting, logic points requiring customer confirmation) and generates professional review emails based on the findings.

## Features

*   **PDF Upload & Analysis:** Upload subscription documents for comprehensive AI-powered review.
*   **Advanced Issue Detection:** Identifies typos, spacing, punctuation, capitalization, alignment, font, formatting, and cross-reference issues.
*   **Logic Point Detection:** Detects 17 types of subscription document logic points that require customer confirmation including:
    *   Fund exclusiveness issues
    *   Missing pages or table of contents mismatches
    *   LPA/PA/PPM reference inconsistencies
    *   Subscription amount discrepancies
    *   Date inconsistencies and signature issues
    *   Capital call, management fee, and carried interest terms
    *   Investment period and key person provisions
    *   And more subscription-specific validation points
*   **Professional Email Generation:** Automatically drafts customer-friendly confirmation emails following legal-ops best practices with exact page references.
*   **Real Email Sending:** Send emails directly to customers using Resend API integration with demo mode fallback.
*   **Screenshot Generation:** Generates visual previews of specific pages related to identified issues.
*   **History Tracking:** View and manage previous document reviews with authentication via Clerk.
*   **Enhanced UI:** Intuitive interface with animated backgrounds and professional design.

## Getting Started

Follow these steps to set up and run the application locally.

### Prerequisites

*   Node.js (v18 or higher)
*   npm or Yarn

### Environment Variables

Create a `.env` file in the root of the project based on `.env.example` and populate it with the following keys:

*   `GEMINI_API_KEY`: Your API key for the Google Gemini API.
*   `SUPABASE_URL`: The URL for your Supabase project.
*   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key.
*   `NEXT_PUBLIC_SUPABASE_URL`: Public URL for your Supabase project.
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anonymous key for your Supabase project.
*   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk.dev publishable key for authentication.
*   `CLERK_SECRET_KEY`: Your Clerk.dev secret key.
*   `RESEND_API_KEY`: Your Resend API key for email sending (optional - app works in demo mode without it).
*   `FROM_EMAIL`: The email address to send emails from (e.g., noreply@yourdomain.com).

### Installation

```bash
npm install
# or
yarn install
```

### Database Setup

This project uses Supabase. You'll need to set up your Supabase project and run the provided SQL schema.

1.  **Create a Supabase Project:** Go to [Supabase](https://supabase.com/) and create a new project.
2.  **Run Schema:** Execute the SQL commands in `schema.sql` within your Supabase project's SQL Editor to set up the necessary tables.
3.  **Setup Storage:** Run the following script to set up Supabase storage for screenshots:
    ```bash
    npm run setup-storage
    ```

### Running the Application

#### Development

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

*   **Framework:** Next.js 14 with TypeScript
*   **AI Integration:** Google Gemini API for document analysis and logic point detection
*   **Database:** Supabase (PostgreSQL)
*   **Authentication:** Clerk.dev
*   **Email Service:** Resend API
*   **PDF Processing:** PDF.js for screenshot generation
*   **UI/UX:** Tailwind CSS with custom animations
*   **Deployment:** Vercel

## How It Works

1. **Document Upload:** Users upload subscription PDF documents through the web interface
2. **AI Analysis:** Google Gemini analyzes the document for:
   - Standard formatting issues (typos, spacing, etc.)
   - Subscription-specific logic points requiring customer confirmation
3. **Issue Categorization:** Results are categorized and displayed with page references and screenshots
4. **Email Generation:** Professional confirmation emails are generated following legal-ops templates
5. **Email Delivery:** Emails can be sent directly to customers or previewed in demo mode
6. **History Tracking:** All reviews are saved with user authentication for future reference

#### Build & Deploy

```bash
npm run build
npm start
```

### Live Demo

[https://subdoc-reviewer-ieuuw8hl5-phuongnguyen-3338s-projects.vercel.app](https://subdoc-reviewer-ieuuw8hl5-phuongnguyen-3338s-projects.vercel.app)

## Learn More

To learn more about Next.js, take a look at the following resources:

*   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
*   [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
