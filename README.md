# Assignment Management System

An AI-powered assignment management system that helps students organize and track their academic assignments.

## Features

- PDF assignment upload and analysis
- AI-powered assignment breakdown into manageable steps
- Timeline view of assignments
- Summary table with difficulty levels and estimated completion times
- Step-by-step progress tracking
- Due date management
- User authentication

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- React DatePicker for date selection

### Backend
- Node.js with Express
- TypeScript
- PDF parsing
- AI integration for assignment analysis

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/assignment-management-system.git
cd assignment-management-system
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

4. Create a `.env` file in the backend directory with the following variables:
```
PORT=3001
```

5. Start the development servers:

Frontend:
```bash
cd frontend
npm start
```

Backend:
```bash
cd backend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Project Structure

```
assignment-management-system/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # React context providers
│   │   ├── services/        # API services
│   │   └── types/          # TypeScript type definitions
│   └── public/             # Static files
│
└── backend/                 # Express backend
    ├── src/
    │   ├── routes/         # API routes
    │   ├── services/       # Business logic
    │   └── types/         # TypeScript type definitions
    └── data/              # Data storage
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for AI integration
- PDF.js for PDF parsing
- All other open-source libraries used in this project 