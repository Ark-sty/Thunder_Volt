# Assignment Management System

This project is an AI-powered web service that helps university students manage their academic workload by automatically analyzing assignments and generating personalized step-by-step plans toward their deadlines. The system reduces stress caused by overlapping tasks and tight schedules by breaking down each assignment into manageable steps and organizing them in a timeline.

---

## Core Features and Technologies

### Key Features

* **AI-powered task breakdown**: Automatically analyzes uploaded PDF or text-based assignments and divides them into smaller actionable steps.
* **Timeline and calendar generation**: Creates an optimized schedule from the current date to the due date, distributing steps across available days.
* **Progress tracking**: Provides a clear overview of assignment status with step-by-step tracking and completion indicators.
* **Summary view**: Displays an aggregated view of all tasks including estimated difficulty levels and time requirements.
* **User authentication and assignment management**: Allows users to securely manage their assignments after login or signup.

### Technology Stack

#### Frontend

* **React with TypeScript**: Component-based frontend development with strong type safety.
* **Tailwind CSS**: Utility-first responsive UI styling.
* **React Router**: Navigation between views.
* **React DatePicker**: Interactive date selection.
* **Axios**: Handles HTTP communication with the backend.
* **PDF.js**: Extracts text from uploaded PDF files for analysis.

#### Backend

* **Node.js with Express**: Handles API endpoints and business logic.
* **TypeScript**: Provides static typing and better code maintainability.
* **OpenAI API**: Utilizes large language models for analyzing and dividing assignment instructions.
* **JWT Authentication**: Secure user session management.
* **CORS configuration**: Enables secure communication between frontend and backend.

#### Cloud & Database

* **Firebase or Supabase**: Used for authentication and real-time data storage.
* **Environment variable support**: All credentials and sensitive configurations are handled through `.env` files.

#### Utilities

* **date-fns / dayjs**: Performs date calculations and formatting.

---

## Getting Started

### Prerequisites

* Node.js (v14 or higher)
* npm or yarn
* Git

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Ark-sty/Thunder_Volt.git
   cd Thunder_Volt
   ```

2. Install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

3. Install backend dependencies:

   ```bash
   cd ../backend
   npm install
   ```

4. Create a `.env` file in the `frontend` directory:

   ```env
   REACT_APP_FIREBASE_API_KEY=YOUR_API_KEY
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
   REACT_APP_FIREBASE_APP_ID=YOUR_APP_ID
   ```

5. Create a `.env` file in the `backend` directory:

   ```env
   PORT=3001
   NODE_ENV=development

   OPENAI_API_KEY=your_openai_api_key_here
   JWT_SECRET=your_jwt_secret_here
   ```

6. Start the development servers:

   **Frontend:**

   ```bash
   cd frontend
   npm start
   ```

   **Backend:**

   ```bash
   cd backend
   npm run dev
   npm start
   ```

   The application will be available at:

   * Frontend: [http://localhost:3000](http://localhost:3000)
   * Backend: [http://localhost:3001](http://localhost:3001)

---

## How to Use

1. Open the browser and go to `http://localhost:3000`
2. Register a new account or log in
3. Upload a PDF or text file containing the assignment
4. Set the due date
5. View the breakdown and timeline
6. Track progress using the summary or timeline view

---

## Troubleshooting

* Ensure both frontend and backend servers are running
* Check `.env` files for missing or incorrect values
* Look at browser and terminal console logs for errors
* Reinstall dependencies with `npm install`
* Clear browser cache for the latest UI state

Common issues:

* **Port already in use**: Change the value in `.env`
* **CORS errors**: Check backend CORS configuration
* **PDF not uploading**: Verify file format and size
* **Module not found**: Try reinstalling with `npm install`

---

## Project Structure

```
Thunder_Volt/
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── context/       # Global state management
│   │   ├── services/      # API call utilities
│   │   └── types/         # Type definitions
│   └── public/            # Static files and HTML template
│
└── backend/                # Node.js backend API
    ├── src/
    │   ├── routes/        # API route handlers
    │   ├── services/      # Assignment logic, OpenAI integration
    │   └── types/         # Type definitions
    └── data/              # Temporary or mock data
```

---

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m "Add YourFeature"`)
4. Push to your branch (`git push origin feature/YourFeature`)
5. Submit a Pull Request

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

---

## Acknowledgments

* OpenAI for their LLM API
* Mozilla's PDF.js for PDF parsing
* All open-source packages and contributors that made this project possible

---
