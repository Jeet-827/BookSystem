import '@testing-library/jest-dom';
import React from 'react';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Automatically unmount and cleanup DOM after each test run
afterEach(() => {
  cleanup();
});

// Mock react-helmet-async for isolated component tests that don't mount HelmetProvider
vi.mock('react-helmet-async', () => {
  return {
    Helmet: ({ children }) => React.createElement(React.Fragment, null, children),
    HelmetProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    HelmetData: class {},
  };
});
