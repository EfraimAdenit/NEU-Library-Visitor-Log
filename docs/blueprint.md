# **App Name**: NEU Library Visitor Log

## Core Features:

- Secure Google Login: Authenticate users via Google OAuth, restricting access to '@neu.edu.ph' email addresses for enhanced security and institutional alignment.
- Visitor Log Entry Form: A user-friendly form on the homepage allowing visitors to easily log their details including reason, college, and visitor type, with data stored in Firestore.
- Personalized User Interface: Displays a dynamic welcome message for logged-in users, ensuring a personalized and inviting experience upon arrival.
- Role-Based Access Control: Implement a 'useEffect' hook to fetch user roles from Firestore upon login, enabling exclusive access to the Admin Dashboard for 'admin' users.
- Admin Visitor Statistics: The Admin Dashboard displays key statistical cards such as 'Today's Visitors', 'Weekly Growth', and 'Employee vs. Student breakdown' by querying Firestore data.
- AI-Powered Visitor Log Insights: An AI tool for administrators to generate concise summaries or identify significant trends and patterns from filtered visitor log data.
- Interactive Data Filters & Charts: Admins can filter visitor data by College and Reason, with results visualized through interactive charts (e.g., bar chart of daily visits) using Firestore data.

## Style Guidelines:

- Background color: Deep Ink Blue (#0B192C) to establish a sophisticated, library-centric, and calm atmosphere for a dark scheme.
- Primary UI elements color: Stormy Blue (#1E3E62), used for cards and main interactive components, providing a balanced contrast against the dark background.
- Accent color for CTAs: Safety Orange (#FF6500), chosen for its high visibility and vibrant contrast against the blue palette, to highlight calls to action and important interactive elements.
- Accent color for success states: Neon Mint (#25E6C8), offering a bright, clear indicator for successful operations and positive feedback.
- Headline and body font: 'Inter', a grotesque-style sans-serif for its modern, objective, and neutral aesthetic, suitable for professional and data-driven content.
- Utilize simple, clean line-art icons that complement the modern sans-serif typography, ensuring clarity and professionalism throughout the application.
- Employ a clean, card-based layout structure for user-facing forms and an organized table-based design for the Admin Dashboard, prioritizing readability and efficient data display.
- Incorporate subtle, functional animations for feedback during interactions such as form submissions, data loading, and chart updates, enhancing the user experience without distraction.