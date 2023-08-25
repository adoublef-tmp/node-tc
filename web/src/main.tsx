import { render } from 'preact';
import { App } from './app.tsx';
import { StrictMode } from "preact/compat";

render(
    <StrictMode>
        <App />
    </StrictMode>, document.getElementById('app') as HTMLElement);
