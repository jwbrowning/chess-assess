import React from 'react';
import { render } from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// const root = ReactDOM.createRoot(document.getElementById('root'));
const root = document.getElementById("root")
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );
if (!window.location.host.startsWith("www")){
    window.location = window.location.protocol + "//" + "www." + window.location.host + window.location.pathname;
}

render(<App />, root)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
