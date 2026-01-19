import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress PostHog/analytics errors in development overlay
// These are from Emergent's preview analytics, not app code
if (process.env.NODE_ENV === 'development' || window.location.hostname.includes('preview.emergentagent.com')) {
  const originalError = console.error;
  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    if (
      message.includes('PerformanceServerTiming') ||
      message.includes('posthog') ||
      message.includes('DataCloneError')
    ) {
      return; // Suppress these errors
    }
    originalError.apply(console, args);
  };

  // Also suppress the React error overlay for these specific errors
  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('PerformanceServerTiming') ||
      event.message?.includes('DataCloneError') ||
      event.filename?.includes('posthog')
    ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
