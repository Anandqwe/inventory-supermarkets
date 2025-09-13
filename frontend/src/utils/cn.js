import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names and merges Tailwind classes intelligently
 * @param {...(string | object | array)} classes 
 * @returns {string}
 */
export function cn(...classes) {
  return twMerge(clsx(...classes));
}