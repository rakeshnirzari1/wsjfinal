import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Improved loading fallback removal with cache busting
const removeLoadingFallback = () => {
  const fallback = document.getElementById('loading-fallback');
  if (fallback) {
    fallback.style.opacity = '0';
    fallback.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => {
      if (fallback.parentNode) {
        fallback.parentNode.removeChild(fallback);
      }
    }, 300);
  }
};

// Force cache refresh on page load
const forceCacheRefresh = () => {
  // Add cache busting parameter to prevent stale cache issues
  if (window.location.search.indexOf('v=') === -1) {
    const url = new URL(window.location.href);
    url.searchParams.set('v', Date.now().toString());
    window.history.replaceState({}, '', url.toString());
  }
};

// Add error handling for the entire app
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  removeLoadingFallback();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  removeLoadingFallback();
});

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    // Force cache refresh to prevent stale cache issues
    forceCacheRefresh();
    
    const root = createRoot(rootElement);
    
    root.render(
      <StrictMode>
        <App onAppReady={removeLoadingFallback} />
      </StrictMode>
    );
    
  } catch (error) {
    console.error('Failed to render app:', error);
    removeLoadingFallback();
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1>Loading Error</h1>
        <p>There was an error loading the application. Please refresh the page.</p>
        <p style="color: red; font-size: 12px;">Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        <button onclick="window.location.reload()" style="
          background: #2563eb; 
          color: white; 
          border: none; 
          padding: 10px 20px; 
          border-radius: 5px; 
          cursor: pointer;
          margin-top: 10px;
        ">Refresh Page</button>
      </div>
    `;
  }
} else {
  console.error('Root element not found');
  removeLoadingFallback();
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
      <h1>Loading Error</h1>
      <p>Root element not found. Please contact support.</p>
      <button onclick="window.location.reload()" style="
        background: #2563eb; 
        color: white; 
        border: none; 
        padding: 10px 20px; 
        border-radius: 5px; 
        cursor: pointer;
        margin-top: 10px;
      ">Refresh Page</button>
    </div>
  `;
}