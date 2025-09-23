# Anduin Sub-doc Reviewer

This application is a sub-document reviewer that leverages AI to analyze PDF documents for various issues (typos, formatting, capitalization, cross-references) and generates a review email based on the findings.

## Features

*   **PDF Upload & Analysis:** Upload PDF documents for AI-powered review.
*   **Issue Detection:** Identifies typos, spacing, punctuation, capitalization, alignment, font, formatting, and cross-reference issues.
*   **AI-Generated Review Email:** Automatically drafts a customer-friendly email summarizing the findings and proposing solutions.
*   **Screenshot Generation:** Generates screenshots of specific pages related to identified issues.

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

#### Build & Deploy

```bash
npm run build
npm start
```

### Live Demo

[Add Vercel Live URL Here]

## Learn More

To learn more about Next.js, take a look at the following resources:

*   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
*   [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
