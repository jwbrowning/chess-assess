import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ReactGA from 'react-ga';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';

// const TRACKING_ID = 'UA-230577039-2';
// ReactGA.initialize(TRACKING_ID);

import HomePage from './home'
import FollowPage from './follow'
import OpeningsPage from './openings'
import AboutPage from './about'

function NavBar() {

    useEffect(() => {
        ReactGA.pageview(window.location.pathname + window.location.search);
    }, []);

    return (
        <div className='NavBar'>
            <Router>
                <nav>
                    <h2>Chess Assess</h2>
                    <ul className='nav-links'>
                        <li>
                            <Link to='/'><h2>Home</h2></Link>
                        </li>
                        <li>
                            <Link to='about'><h2>About</h2></Link>
                        </li>
                        <li>
                            <Link to='follow'><h2>Follow Tournaments</h2></Link>
                        </li>
                        <li>
                            <Link to='openings'><h2>Opening Trainer</h2></Link>
                        </li>
                    </ul>
                    <button style={{padding: '1.0vmin'}}
                            onClick={() => {
                                document.documentElement.style.setProperty('--hue', (Math.floor(Math.random() * 360) - 0) + 'deg');
                                document.documentElement.style.setProperty('--sat', (Math.floor(Math.random() * 60) + 50) + '%');
                                ReactGA.event({
                                    category: 'Navigation Bar',
                                    action: 'Changed Color'
                                });
                            }}>
                        <h3>Change Color</h3>
                    </button>
                </nav>
                <Routes>
                    <Route path='/' element={<HomePage />} />
                    <Route path='about' element={<AboutPage />} />
                    <Route path='follow' element={<FollowPage />} />
                    <Route path='openings' element={<OpeningsPage />} />
                </Routes>
            </Router>
        </div>
    )
}

export default NavBar;