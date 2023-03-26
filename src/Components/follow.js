import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chess } from 'chess.js';
import ReactGA from 'react-ga';

import candidatesProbs from '../probabilities.txt';
import wccProbs from '../probabilities2.txt';

import Board from './Board';
import StandingsRow from './StandingsRow';
import Tournament from './Tournament';

let stockfish1 = new Worker('/stockfish.js');
let stockfish2 = new Worker('/stockfish.js');
let stockfish3 = new Worker('/stockfish.js');
let stockfish4 = new Worker('/stockfish.js');

const depth = 30;

export default function Follow() {

    return (
        <div>
            {/* <Tournament 
            name='World Chess Championship 2023'
            subtitle='Ian Nepomniachtchi vs Ding Liren'
            type='match'
            comingSoon={true}
            comingSoonMessage=""
            display={true}
            broadcastRoundId=''
            playerInfo = {[
                ["N/A",0,0]
                ["N/A",0,0]
            ]}
            games = {[
                ["N/A", "N/A"]
            ]}
            chances = {[
                [.3333,.3333,.3333]
            ]}
            probabilities={wccProbs}
            N={10000}
            depth={depth}
            /> */}

            <Tournament 
            name='World Chess Championship 2023'
            subtitle='Game 1'
            type='match'
            comingSoon={true}
            display={true}
            broadcastRoundId='kx9gaE3w'
            playerInfo = {[
                ['Nepo', 2795.0, 0.0, "#938fff"],
                ['Ding', 2788.0, 0.0, "#ff8f8f"],
            ]}
            games = {[
                ['Ding', 'Nepo'],
            ]}
            chances = {[
                [0.21599920898482067, 0.6163473718652897, 0.16759713914788993],
            ]}
            probabilities={wccProbs}
            N={10000}
            depth={depth}
            graph={true}
            />

            <Tournament 
            name='Candidates Tournament 2022'
            subtitle='Finished'
            type='tournament'
            comingSoon={false}
            display={true}
            broadcastRoundId='ZA07lchF'
            playerInfo = {[
                ['Ding', 2806.0, 7.0],
                ['Firouzja', 2793.1, 5.0],
                ['Caruana', 2782.6, 6.5],
                ['Nepo', 2766.4, 9.0],
                ['Rapport', 2764.0, 5.5],
                ['Nakamura', 2760.0, 7.5],
                ['Radjabov', 2748.2, 6.5],
                ['Duda', 2750.0, 5.0],
            ]}
            games = {[
                ['Rapport', 'Radjabov'],
                ['Caruana', 'Firouzja'],
                ['Ding', 'Nakamura'],
                ['Duda', 'Nepo'],
            ]}
            chances = {[
                [0.23466566724939456, 0.6473620483532273, 0.1179722843953783],
                [0.24391905313766132, 0.6488927550214011, 0.10718819183893763],
                [0.2586836675621616, 0.6397994594552858, 0.10151687298055272],
                [0.15867367582238695, 0.6901139190656111, 0.151212405110002],
            ]}
            probabilities={candidatesProbs}
            N={1000}
            depth={depth}
            opacity={30}
            />
        </div>
    )

}