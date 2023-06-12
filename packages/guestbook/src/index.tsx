import React from 'react';
import { createRoot } from 'react-dom/client';
import '@near-wallet-selector/modal-ui/styles.css';

import App from './App';

const container = document.getElementById('app');
const root = createRoot(container!);
root.render(<App />);
