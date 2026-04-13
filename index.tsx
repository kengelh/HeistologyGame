/**
 * @file index.tsx
 * @description
 * This is the main entry point for the React application. Its primary responsibility
 * is to find the root HTML element in `index.html` and render the main `App` component
 * into it. This file bootstraps the entire client-side application.
 */


// Import the React library, which is the core of the application's UI.
import * as React from 'react';
// Import the ReactDOM library, which provides methods for interacting with the DOM (Document Object Model).
import ReactDOM from 'react-dom/client';
// Import the main App component, which serves as the root of the React component tree and contains all other components.
import App from './App';

// Find the root HTML element where the React application will be mounted.
// This element is defined in `index.html` with the id 'root'.
// It acts as the container for the entire single-page application.
const rootElement = document.getElementById('root');

// A crucial safety check. If the root element isn't found in the HTML document,
// the application cannot render. This is a critical error, so we throw an exception to stop execution immediately.
if (!rootElement) {
  throw new Error("Could not find root element with id 'root' to mount the application.");
}

// Create a React root for the specified HTML element. This is the modern
// API for rendering a React app, introduced in React 18. It enables concurrent features,
// which can improve performance and user experience in complex applications.
const root = ReactDOM.createRoot(rootElement);

// Render the main App component into the root.
// `React.StrictMode` is a wrapper component that helps with highlighting potential problems
// in an application during development. It activates additional checks and warnings
// for its descendants, such as identifying components with unsafe lifecycles,
// legacy API usage, and unexpected side effects. It does not affect the production build.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
