import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/FormControls';
import { AlertCircle } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <AlertCircle className="w-16 h-16 text-indigo-500 animate-bounce" />
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Page Not Found</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        The page you are looking for does not exist, or you do not have permission to view it.
      </p>
      <div className="pt-2">
        <Button variant="primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
