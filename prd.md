Problem

What problem are you solving?
Detect typos and formatting issues in the PDF documents

Target User

Who is this for?
DS team member who reviews the sub-docs and detects formatting issues before the form digitization

Core Feature

What’s the single feature your MVP must deliver?
Scan through the PDF, detect all typos and weird formats and produce a table listing all errors with its location in the PDF.

AI Integration

Where does AI fit in?
Gemini 1.5 Flash will process the PDF and flexibly detect format errors and typos as per the predefined instructions and examples.

Data Model (Supabase)
	•	demo_requests
	•	id: uuid
	•	created_at: timestamptz
	•	user_input: text
	•	ai_result: jsonb

Success Criteria
	•	API returns strict JSON with a list of detected issues from the uploaded PDF.
	•	Each request/response is stored in Supabase (demo_requests).
	•	Live deployment on Vercel with at least 2 pages:
	•	/review (upload PDF → see issues table)
	•	/history (list past analyses; link to view results)
	•	API returns strict JSON with a list of detected issues from the uploaded PDF.
	•	Each request/response is stored in Supabase (demo_requests).
	•	Live deployment on Vercel with at least 2 pages:
	•	/review (upload PDF → see issues table)
	•	/history (list past analyses; link to view results)

