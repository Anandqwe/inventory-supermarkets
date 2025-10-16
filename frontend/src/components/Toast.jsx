import React from 'react';
import { ToastContainer } from 'react-toastify';
import { useTheme } from '../contexts/ThemeContext';
import 'react-toastify/dist/ReactToastify.css';

const Toast = () => {
  const { theme } = useTheme();
  
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme}
      className="mt-16"
      toastClassName={`${theme === 'dark' ? 'dark:bg-zinc-950 dark:text-zinc-100' : ''}`}
    />
  );
};

export default Toast;
