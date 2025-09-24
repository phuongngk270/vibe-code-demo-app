# Product Requirements Document (PRD) - Sub-Doc Reviewer App

## 1. Introduction

This document outlines the requirements for the Subscription Document Reviewer App, a tool designed to assist DS teammates in efficiently reviewing sub-documents (PDFs) for formatting inconsistencies, typos, and other critical issues before digitization. The application leverages AI to automate the detection process and streamline the generation of review feedback.

## 2. Problem Statement

DS teammates spend a significant amount of time manually reviewing sub-docs for errors, resulting in a time-consuming and error-prone process. Inconsistent formatting, typos, and incorrect cross-references can cause delays and inaccuracies in the digitization workflow.

## 3. Target Users

The primary target users are Digitization Service (DS) team members responsible for reviewing sub-docs and ensuring their quality before further processing or digitization.

## 4. Goals

*   To reduce the manual effort and time spent on sub-doc review.
*   To improve the accuracy and consistency of issue detection.
*   To provide a streamlined process for generating review feedback (emails).
*   To enhance the overall efficiency of the document digitization workflow.

## 5. Features

### 5.1 Core Functionality

*   **PDF Upload:** Users can upload PDF documents for analysis.
*   **AI-Powered Issue Detection:** The application will scan uploaded PDFs to identify:
    *   Typos
    *   Spacing inconsistencies
    *   Punctuation errors
    *   Capitalization errors
    *   Alignment issues
    *   Font inconsistencies
    *   General formatting problems (e.g., inconsistent numbering/bullets)
    *   Broken cross-references (e.g., "see Section X" where Section X does not exist)
*   **Issue Reporting:** A table displaying all detected issues, including:
    *   Page number
    *   Type of issue
    *   Detailed message
    *   Original text snippet
    *   Suggested correction (if applicable)
    *   Location hint (e.g., "Section 1", "Paragraph starting with...")
*   **Screenshot Generation:** For each identified issue, a screenshot of the relevant section of the PDF page will be generated and displayed.
*   **AI-Generated Review Email:** Based on the detected issues, the application will draft a customer-friendly email that:
    *   Summarizes the findings.
    *   Proposes solutions for each issue.
    *   Cites exact section names and page numbers.
    *   Maintains a polite, direct, and time-bounded tone.

### 5.2 User Interface (UI)

*   **Review Page (`/review`):**
    *   PDF upload interface.
    *   Display of the issues table.
    *   Display of generated screenshots.
    *   Interface to generate and preview the review email.
*   **History Page (`/history`):**
    *   List of past document analyses.
    *   Ability to view detailed results of previous analyses.

## 6. User Flow

1.  **User logs in** (via Clerk authentication).
2.  **User navigates to the `/review` page.**
3.  **User uploads a PDF document.**
4.  **The application processes the PDF:**
    *   Extracts text and metadata.
    *   Sends relevant data to the Gemini API for issue detection.
    *   Generates screenshots for identified issues.
5.  **The application displays the detected issues** in a table format on the `/review` page.
6.  **User reviews the issues and generates screenshots.**
7.  **User initiates the email generation process.**
8.  **The application generates a draft review email** based on the issues.
9.  **User previews the email** and can copy it for sending.
10. **All analysis results are saved to the history** and accessible via the `/history` page.

## 7. Technical Design

### 7.1 Architecture

The application is built using the Next.js framework, providing a full-stack solution with API routes for backend logic and React for the frontend.

### 7.2 Key Integrations

*   **Next.js:** Frontend and API routes.
*   **Clerk:** User authentication and management.
*   **Supabase:**
    *   **Database:** Stores analysis results (`demo_requests` table).
    *   **Storage:** Stores generated screenshots.
*   **Google Gemini API:** AI model for PDF analysis and issue detection.
*   **`pdfjs-dist`:** PDF rendering and manipulation for screenshot generation.
*   **`formidable`:** Handles multipart/form-data for file uploads.
*   **`canvas`:** Used for rendering PDF pages to images for screenshots.

### 7.3 Data Model (Supabase)

*   **`demo_requests` table:**
    *   `id`: `uuid` (Primary Key)
    *   `created_at`: `timestamptz`
    *   `user_input`: `text` (e.g., file name of the uploaded PDF)
    *   `ai_result`: `jsonb` (Stores the detailed `AnalysisResult` from the AI, including issues and summary)

## 8. Success Criteria

*   The API consistently returns strict JSON with a list of detected issues from uploaded PDFs.
*   Each request/response is successfully stored in Supabase (`demo_requests` table).
*   The application is deployed live on Vercel with functional `/review` and `/history` pages.
*   The `/review` page successfully uploads PDFs, displays issues, and generates screenshots.
*   The `/history` page accurately lists past analyses and allows viewing of detailed results.
*   AI-generated emails are coherent, accurate, and follow the specified format.
*   No sensitive keys or secrets are exposed in the repository.
*   `README.md` provides clear and comprehensive setup instructions.
