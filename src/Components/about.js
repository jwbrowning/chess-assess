import React from 'react'
import fischer from '../Images/fischerasciiscreenshot.png'
import axios from 'axios'
import qs from 'qs'
import ReactGA from 'react-ga'

export default function AboutPage() {

    const comingSoon = false;

    return (
        <div className='about'>
            {comingSoon ? 
            <h2>
                coming soon
            </h2> :
            <div>
                <h2>Welcome to Chess Assess!</h2>
                <h4 className='desc'>
                    a chess website for training and following games made by Johnathan Browning
                    {'\n\n'}<a onClick={() => {
                        ReactGA.event({
                            category: 'About',
                            action: 'Clicked Twitter Link'
                        });
                    }} className='twitter-link' target="_blank" rel="noopener noreferrer" href="https://twitter.com/JBrowningIndie">@JBrowningIndie</a>
                </h4>
                <h3>
                    About Chess Assess
                </h3>
                <p>
                    This is a side project of mine to host everything I want to build related to chess. 
                </p>
                <p>
                    I made this site with React, with a reasonable understanding of javascript, html, css.
                </p>
                <p>
                    The 
                    {'\n\n'}<a onClick={() => {
                        ReactGA.event({
                            category: 'About',
                            action: 'Clicked Lichess API Link'
                        });
                    }} className='twitter-link general-link' target="_blank" rel="noopener noreferrer" href="https://lichess.org/api">{' Lichess.org API '}</a>
                    has been incredibly helpful for this project, for both accessing the database for my Opening Trainer, and following Live broadcasts for my Follow Tournaments page. 
                </p>
                <h3>
                    About My Candidates Prediction Model
                </h3>
                <p>
                    I'll go ahead and preface this by saying I am not a statistician or data analyst.
                    I'm just a computer science student who enjoys chess, programming and stats.
                    Don't take all of this too seriously; I just do this stuff for fun and I hope it will make your chess experience more enjoyable!
                </p>
                <p>
                    You can follow the 2022 FIDE Candidates Tournament LIVE at 
                    <a onClick={() => {
                        ReactGA.event({
                            category: 'About',
                            action: 'Clicked Follow Link'
                        });
                    }} className='twitter-link general-link' target="_blank" rel="noopener noreferrer" href="https://chessassess.com/follow">{' the Follow Tournaments page'}</a>
                    . It's unique in that not only do I run simulations between rounds to predict the tournament winner, 
                    but I also am actively predicting the result of each game as it's being played, move-by-move.
                </p>
                <h5>
                    Simulations
                </h5>
                <p>
                    This part isn't new, people (I included) have run simulations for the Candidates for some time now. Check out 
                    <a onClick={() => {
                        ReactGA.event({
                            category: 'About',
                            action: 'Clicked Chess Numbers Link'
                        });
                    }} className='twitter-link general-link' target="_blank" rel="noopener noreferrer" href="https://twitter.com/ChessNumbers ">{' @ChessNumbers '}</a>
                    and 
                    <a onClick={() => {
                        ReactGA.event({
                            category: 'About',
                            action: 'Clicked Pawnalyze Link'
                        });
                    }} className='twitter-link general-link' target="_blank" rel="noopener noreferrer" href="https://twitter.com/Pawnalyze">{' @Pawnalyze '}</a>
                    to see some other simulation models. 
                    What makes my model different from these is I try to account for things like head-to-head scores and must-win situations, rather than using only elo.
                </p>
                <p>
                    To calculate win, draw, loss percentages for two players in my simulations I used the formulas discussed at
                    <a onClick={() => {
                        ReactGA.event({
                            category: 'About',
                            action: 'Clicked Wismuth Elo Calc Link'
                        });
                    }} className='twitter-link general-link' target="_blank" rel="noopener noreferrer" href="https://wismuth.com/elo/calculator.html">{' this super useful site, '}</a>
                    which are elo-based.
                </p>
                <h5>
                    Predicting Games Live
                </h5>
                <p>
                    In order to accomplish live updating W/D/L chances, I used a multinomial logistic regression model. 
                    I sampled a database of top-level classical chess games (2650+) and recorded information about the position: 
                    the engine's eval, both player ratings, and less important things such as material count and move number.
                </p>
                <p>
                    The only problem was I really wanted to include clock times as an input, but I do not know of a database of top-level games that contains both players' clock times each move. 
                    To solve this, I downloaded a bunch of games from Lichess's top classical time-control players and tried to see how a time advantage converts to elo points. 
                    I ended up defining a time advantage as (t1 - t2) / (t1 + t2) where t1 and t2 are player 1's clock and player 2's clock, respectively. 
                    This makes sense to me as it accounts for the fact that 1 minute is very valuable in a blitz game, but nowhere near as valuable when both players have 1hr+.
                </p>
                <p>
                    All that was left to do now was combine the two models and update everything every time a move is played, and allow the user to plug in different scenarios to see the outcome. 
                    Instead of constantly re-running simulations, I run 256 different sets of simulations, for every combination of result for each of the 4 games: win, draw, loss, unknown. 
                    I can then use the live-updating W/D/L probabilities in combination with the corresponding simulations to output live updateing tournament victory chances.
                </p>
                
            </div>
            }
        </div>
    )
}