import React from 'react';

export default function PublicRoute({ children }) {
  // Public routes don't require authentication
  // Just render children directly
  return children;
}