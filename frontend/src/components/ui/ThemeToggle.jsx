import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from './Button';

const ThemeToggle = ({ className, size = "default" }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="subtle"
      size={size === "icon" ? "icon" : size}
      onClick={toggleTheme}
      className={className}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <MoonIcon className="h-4 w-4" />
      ) : (
        <SunIcon className="h-4 w-4" />
      )}
      {size !== "icon" && (
        <span className="ml-2">
          {theme === 'light' ? 'Dark' : 'Light'}
        </span>
      )}
    </Button>
  );
};

ThemeToggle.displayName = "ThemeToggle";

export { ThemeToggle };