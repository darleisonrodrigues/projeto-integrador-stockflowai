import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

import { GoogleOAuthProvider } from '@react-oauth/google';

// Substitua pelo seu Client ID real do Google
const GOOGLE_CLIENT_ID = '631412838806-4og4gq8irt7dg5ci3aaa4f4dta94dqok.apps.googleusercontent.com';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);