import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chess } from 'chess.js';
import ReactGA from 'react-ga';

import probabilities from '../probabilities.txt';
import probabilities2 from '../probabilities2.txt';

import Board from './Board';
import StandingsRow from './StandingsRow';

let stockfish1 = new Worker('/stockfish.js');
let stockfish2 = new Worker('/stockfish.js');
let stockfish3 = new Worker('/stockfish.js');
let stockfish4 = new Worker('/stockfish.js');

export default function Follow() {


    // SET THIS STUFF BEFORE EACH ROUND -------------------
    const broadcastRoundId = 'ZA07lchF'; 
    // 'LsFeKWZU' // candidates round 1
    // 'sylFQGas' // candidates round 2
    // 'oe2udItH' // candidates round 3
    // '0QuWnLkU' // candidates round 4
    // '1ZAF8srK' // candidates round 5
    // 'yF4JxPcn' // candidates round 6
    // 'OFBhwamI' // candidates round 7
    // 'fsvj5GFW' // candidates round 8
    // 'pk9gRSMB' // candidates round 9
    // 'FWJYzJJJ' // candidates round 10
    // '16iH8elQ' // candidates round 11
    // 'ZfmMC2Gh' // candidates round 12
    // 'oIi8sTms' // candidates round 13
    // 'ZA07lchF' // candidates round 14
    
    const round = 14;

    const scores = [
        7.0, // Ding
        5.0, // Firouzja
        6.5, // Caruana
        9.0, // Nepo
        5.5, // Rapport
        7.5, // Nakamura
        6.5, // Radjabov
        5.0, // Duda
    ]

    const games = [
        ['Rapport', 'Radjabov'],
        ['Caruana', 'Firouzja'],
        ['Ding', 'Nakamura'],
        ['Duda', 'Nepo'],
    ]

    const [chances1, setChances1] = useState([
        0.23466566724939456, 0.6473620483532273, 0.1179722843953783
    ]);
    const [chances2, setChances2] = useState([
        0.24391905313766132, 0.6488927550214011, 0.10718819183893763
    ]);
    const [chances3, setChances3] = useState([
        0.2586836675621616, 0.6397994594552858, 0.10151687298055272
    ]);
    const [chances4, setChances4] = useState([
        0.15867367582238695, 0.6901139190656111, 0.151212405110002
    ]);
    // DONT FORGET TO PUT PROBABILITIES FROM SIMS IN probabilities.txt
    //-----------------------------------------------------

    const N = 1000;
    const depth = 30;

    const [depth1, setDepth1] = useState(30);
    const [depth2, setDepth2] = useState(30);
    const [depth3, setDepth3] = useState(30);
    const [depth4, setDepth4] = useState(30);

    const onStockfishMsg = (event, fen, i, g, d) => {
        // console.log("stockfishmsg");
        // console.log(event.data)
        // console.log(event.data)
        if (event.data.startsWith("info depth ")) {
            // console.log(event.data)
            // console.log('iiiiiiii ' + i)
            // console.log('msg' + d);
            // console.log(d);
            const ind = event.data.indexOf("info depth ");
            const sp = event.data.indexOf(" ", ind + 11);
            const dep = Number(event.data.substring(ind + 11, sp));
            if (dep < 10) return;

            var messageEvalType;
            var message = event.data.split(" ");
            const chess = new Chess();
            chess.load(fen);
            const turn = chess.turn();

            if (message.includes("mate")) {
                messageEvalType = `M${message[message.indexOf("mate") + 1]}`
            } else {
                messageEvalType = message[message.indexOf("cp") + 1]
            }

            var evaluation = Number(convertEvaluation(
                messageEvalType,
                turn
            ));
            // evaluation = -10 * 100

            var newG = {
                pgn: g.pgn,
                eval: evaluation / 100,
                wClock: g.wClock,
                bClock: g.bClock,
                ply: g.ply,
                material: g.material,
            }

            updateChances(i, newG, d);
            if (i == 0) {
                setGame1(newG);
                setDepth1(dep);
                if (event.data.startsWith("info depth " + depth) || g.pgn.includes('1-0') || g.pgn.includes('1/2-1/2') || g.pgn.includes('0-1')) {
                    stockfish1.terminate();
                }
            } else if (i == 1) {
                setGame2(newG);
                setDepth2(dep);
                if (event.data.startsWith("info depth " + depth) || g.pgn.includes('1-0') || g.pgn.includes('1/2-1/2') || g.pgn.includes('0-1')) {
                    stockfish2.terminate();
                }
            } else if (i == 2) {
                setGame3(newG);
                setDepth3(dep);
                if (event.data.startsWith("info depth " + depth) || g.pgn.includes('1-0') || g.pgn.includes('1/2-1/2') || g.pgn.includes('0-1')) {
                    stockfish3.terminate();
                }
            } else if (i == 3) {
                setGame4(newG);
                setDepth4(dep);
                if (event.data.startsWith("info depth " + depth) || g.pgn.includes('1-0') || g.pgn.includes('1/2-1/2') || g.pgn.includes('0-1')) {
                    stockfish4.terminate();
                }
            }
        }
    };

    const convertEvaluation = (ev, turn) => {
        // console.log(ev)
        // if (ev.startsWith('M')) {
        //     ev = ev.substring(1) + '000'
        // }
        if (turn === 'b' && !ev.startsWith('M')) {
            if (ev.startsWith('-')) {
                ev = ev.substring(1);
            } else {
                ev = `-${ev}`;
            }
        }
        if (turn === 'b' && ev.startsWith('M')) {
            ev = ev.substring(1) + '000';
            if (ev.startsWith('-')) {
                ev = ev.substring(1);
            } else {
                ev = `-${ev}`;
            }
        }
        if (ev.startsWith('M')) {
            ev = ev.substring(1) + '000';
            return ev
        }
        return ev;
    };

    const getEval = (i, g, d) => {

        // console.log('geteval');
        // console.log(d);
        var c = new Chess();
        c.load_pgn(g.pgn);
        var fen = c.fen();
        // if (c.header().Result != '*') {
        //     // console.log(c.header().Result)
        //     return;
        // }
        if (i == 0) {
            stockfish1.terminate();
            stockfish1 = new Worker("/stockfish.js");
            stockfish1.postMessage("uci");
            stockfish1.postMessage("ucinewgame");
            stockfish1.postMessage(`position fen ${fen}`);
            stockfish1.postMessage(`go depth ${depth}`);
            stockfish1.onmessage = (event) => {
                onStockfishMsg(event, fen, i, g, d);
            }
        } else if (i == 1) {
            stockfish2.terminate();
            stockfish2 = new Worker("/stockfish.js");
            stockfish2.postMessage("uci");
            stockfish2.postMessage("ucinewgame");
            stockfish2.postMessage(`position fen ${fen}`);
            stockfish2.postMessage(`go depth ${depth}`);
            stockfish2.onmessage = (event) => {
                onStockfishMsg(event, fen, i, g, d);
            }
        } else if (i == 2) {
            stockfish3.terminate();
            stockfish3 = new Worker("/stockfish.js");
            stockfish3.postMessage("uci");
            stockfish3.postMessage("ucinewgame");
            stockfish3.postMessage(`position fen ${fen}`);
            stockfish3.postMessage(`go depth ${depth}`);
            stockfish3.onmessage = (event) => {
                onStockfishMsg(event, fen, i, g, d);
            }
        } else if (i == 3) {
            stockfish4.terminate();
            stockfish4 = new Worker("/stockfish.js");
            stockfish4.postMessage("uci");
            stockfish4.postMessage("ucinewgame");
            stockfish4.postMessage(`position fen ${fen}`);
            stockfish4.postMessage(`go depth ${depth}`);
            stockfish4.onmessage = (event) => {
                onStockfishMsg(event, fen, i, g, d);
            }
        }
    }

    
    const comingSoon = false;

    const playerNames = [
        'Ding',
        'Firouzja',
        'Caruana',
        'Nepo',
        'Rapport',
        'Nakamura',
        'Radjabov',
        'Duda',
    ]
    const playerRatings = [
        ['Ding', 2806.0],
        ['Firouzja', 2793.1],
        ['Caruana', 2782.6],
        ['Nepo', 2766.4],
        ['Rapport', 2764.0],
        ['Nakamura', 2760.0],
        ['Radjabov', 2748.2],
        ['Duda', 2750.0],
    ]
    const getPlayerRating = (player) => {
        for (var i = 0; i < playerRatings.length; i++) {
            if (playerRatings[i][0] == player) {
                return playerRatings[i][1];
            }
        }
        // return 0;
    }

    const setProbStuff = (text, doApiTimeout) => {
        var data = [];
        var lines = text.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var items = lines[i].split(' ');
            var key = {
                res1: items[0],
                res2: items[1],
                res3: items[2],
                res4: items[3]
            }
            var val = []
            for (var j = 4; j < items.length; j++) {
                val.push(items[j])
            }
            data.push([key, val])
        }
        setProbData(data);
        setStandings(GetStandings(data, chosenResults));

        if (doApiTimeout) {
            apiTimeout = setTimeout(() => {
                clearTimeout(apiTimeout);
                fetchAPIData(data)
            }, 1);
        }
    }

    const ReadProbs = (doApiTimeout=true) => {
        // console.log('read probs')
        fetch((winP ? probabilities : probabilities2))
            .then(r => r.text())
            .then(text => setProbStuff(text, doApiTimeout))
    };

    const [probData, setProbData] = useState([]);

    // useEffect(() => {
    // }, []);

    const isInData = (d, x) => {
        for (var i = 0; i < d.length; i++) {
            if (d[i][0].res1 == x.res1 &&
                d[i][0].res2 == x.res2 &&
                d[i][0].res3 == x.res3 &&
                d[i][0].res4 == x.res4) {
                return true;
            }
        }
        return false;
    }

    const getData = (d, x) => {
        for (var i = 0; i < d.length; i++) {
            if (d[i][0].res1 == x.res1 &&
                d[i][0].res2 == x.res2 &&
                d[i][0].res3 == x.res3 &&
                d[i][0].res4 == x.res4) {
                return d[i][1];
            }
        }
        return null;
    }


    const getPgn = (i) => {
        if (i == 0) {
            return game1.pgn;
        } else if (i == 1) {
            return game2.pgn;
        } else if (i == 2) {
            return game3.pgn;
        } else {
            return game4.pgn;
        }
    }

    const GetScore = (i, cR) => {
        var name = playerNames[i];
        var score = scores[i];
        for (var j = 0; j < games.length; j++) {
            if (games[j][0] == name) {
                var c = new Chess();
                c.load_pgn(getPgn(j));
                var res = c.header().Result;
                if (!(res == '1-0' || res == '1/2-1/2' || res == '0-1')) res = GetChosenResult(j, cR);
                if (res == '1-0') {
                    return score + 1;
                } else if (res == '1/2-1/2') {
                    return score + .5;
                } else {
                    return score;
                }
            } else if (games[j][1] == name) {
                var c = new Chess();
                c.load_pgn(getPgn(j));
                var res = c.header().Result;
                if (!(res == '1-0' || res == '1/2-1/2' || res == '0-1')) res = GetChosenResult(j, cR);
                if (res == '0-1') {
                    return score + 1;
                } else if (res == '1/2-1/2') {
                    return score + .5;
                } else {
                    return score;
                }
            }
        }
        return score;
    }

    const GetChosenResult = (i, cR=chosenResults) => {
        if (i == 0) {
            return cR.res1;
        } else if (i == 1) {
            return cR.res2;
        } else if (i == 2) {
            return cR.res3;
        } else {
            return cR.res4;
        }
    }

    const [boardTypes, setBoardTypes] = useState([
        'small-tournament',
        'small-tournament',
        'small-tournament',
        'small-tournament',
    ]);

    const GetStandings = (data, cR={res1: 'x', res2: 'x', res3: 'x', res4: 'x'}, cs=[chances1,chances2,chances3,chances4], ignoreOS=false) => {
        if (ignoreOS) return null;
        if (data.length == 0) return null;
        // console.log('data')
        // console.log(data)
        const results = [
            '1-0', '1/2-1/2', '0-1'
        ]
        var probs = [
            0,0,0,0,0,0,0,0
        ]
        for (var i = 0; i < results.length; i++) {
            for (var j = 0; j < results.length; j++) {
                for (var k = 0; k < results.length; k++) {
                    for (var l = 0; l < results.length; l++) {
                        var probsData = getData(data, {res1: results[i], res2: results[j], res3: results[k], res4: results[l]});
                        var chance =      (cR.res1 == 'x' ? cs[0][i] : cR.res1 == results[i] ? 1.0 : 0.0)
                                        * (cR.res2 == 'x' ? cs[1][j] : cR.res2 == results[j] ? 1.0 : 0.0)
                                        * (cR.res3 == 'x' ? cs[2][k] : cR.res3 == results[k] ? 1.0 : 0.0)
                                        * (cR.res4 == 'x' ? cs[3][l] : cR.res4 == results[l] ? 1.0 : 0.0)
                        for (var m = 0; m < probs.length; m++) {
                            probs[m] += chance * probsData[m] / N
                        }
                    }
                }
            }
        }
        // console.log(probs)


        
        // console.log('get standings')
        var s = [];
        // console.log(data);
        for (var i = 0; i < playerNames.length; i++) {
            s.push({
                key: i,
                name: playerNames[i],
                score: GetScore(i, cR),
                // winChance: (isInData(data, cR)) ? (100 * getData(data, cR)[i] / N) : 0
                winChance: (100 * probs[i])
            });
        }
        // console.log(cR);
        // console.log(data[cR])
        // console.log(s)
        // console.log(isInData(cR))
        // console.log(data);
        // console.log(cR in data);
        if (originalStandings.length == 0 && !ignoreOS) {
            // console.log('original:')
            // console.log(s)
            setOriginalStandings(s);
            // oriStands = s;
        }
        const oS = originalStandings.length == 0 ? s : originalStandings;
        var maxGap = 0
        for (var i = 0; i < s.length; i++) {
            for (var j = 0; j < oS.length; j++) {
                if (s[i].name == oS[j].name) {
                    var gap = Math.abs(s[i].winChance - oS[j].winChance)
                    if (gap > maxGap) {
                        maxGap = gap;
                    }
                }
            }
        }
        setBiggestGap(maxGap);
        return s;
    };

    const [chosenResults, setChosenResults] = useState({
        res1: 'x',
        res2: 'x',
        res3: 'x',
        res4: 'x'
    });

    const [standings, setStandings] = useState([]);
    const [originalStandings, setOriginalStandings] = useState([]);
    // const originalStandings = [
    //     [],
    // ]
    const [biggestGap, setBiggestGap] = useState(0);

    const standingsEqual = () => {
        for (var i = 0; i < standings.length; i++) {
            for (var j = 0; j < originalStandings.length; j++) {
                var a = standings[i];
                var b = originalStandings[j];
                if (a.name == b.name && a.winChance != b.winChance) {
                    return false;
                }
            }
        }
        return true;
    }

    const whiteButton = (i) => {
        ReactGA.event({
            category: 'Follow',
            action: 'Clicked White Win Button'
        });
        var cR = {
            res1: chosenResults.res1,
            res2: chosenResults.res2,
            res3: chosenResults.res3,
            res4: chosenResults.res4,
        };
        var c = 'x';
        if (i == 0) {
            c = cR.res1;
        } else if (i == 1) {
            c = cR.res2;
        } else if (i == 2) {
            c = cR.res3;
        } else if (i == 3) {
            c = cR.res4;
        }
        var c2 = 'x'
        if (c == '1-0') {
            c2 = 'x';
        } else {
            c2 = '1-0';
        }
        if (i == 0) {
            cR.res1 = c2;
        } else if (i == 1) {
            cR.res2 = c2;
        } else if (i == 2) {
            cR.res3 = c2;
        } else if (i == 3) {
            cR.res4 = c2;
        }
        setChosenResults(cR);
        setStandings(GetStandings(probData, cR))
    }
    const drawButton = (i) => {
        ReactGA.event({
            category: 'Follow',
            action: 'Clicked Draw Button'
        });
        var cR = {
            res1: chosenResults.res1,
            res2: chosenResults.res2,
            res3: chosenResults.res3,
            res4: chosenResults.res4,
        };
        var c = 'x';
        if (i == 0) {
            c = cR.res1;
        } else if (i == 1) {
            c = cR.res2;
        } else if (i == 2) {
            c = cR.res3;
        } else if (i == 3) {
            c = cR.res4;
        }
        var c2 = 'x'
        if (c == '1/2-1/2') {
            c2 = 'x';
        } else {
            c2 = '1/2-1/2';
        }
        if (i == 0) {
            cR.res1 = c2;
        } else if (i == 1) {
            cR.res2 = c2;
        } else if (i == 2) {
            cR.res3 = c2;
        } else if (i == 3) {
            cR.res4 = c2;
        }
        setChosenResults(cR);
        setStandings(GetStandings(probData, cR))
    }
    const blackButton = (i) => {
        ReactGA.event({
            category: 'Follow',
            action: 'Clicked Black Win Button'
        });
        var cR = {
            res1: chosenResults.res1,
            res2: chosenResults.res2,
            res3: chosenResults.res3,
            res4: chosenResults.res4,
        };
        var c = 'x';
        if (i == 0) {
            c = cR.res1;
        } else if (i == 1) {
            c = cR.res2;
        } else if (i == 2) {
            c = cR.res3;
        } else if (i == 3) {
            c = cR.res4;
        }
        var c2 = 'x'
        if (c == '0-1') {
            c2 = 'x';
        } else {
            c2 = '0-1';
        }
        if (i == 0) {
            cR.res1 = c2;
        } else if (i == 1) {
            cR.res2 = c2;
        } else if (i == 2) {
            cR.res3 = c2;
        } else if (i == 3) {
            cR.res4 = c2;
        }
        setChosenResults(cR);
        setStandings(GetStandings(probData, cR))
    }

    const expand = (i) => {
        ReactGA.event({
            category: 'Follow',
            action: 'Expanded Board'
        });
        // console.log(boardTypes)
        var b = boardTypes;
        b[i] = 'big-tournament';
        setBoardTypes([b[0],b[1],b[2],b[3]]);
    }
    const minimize = (i) => {
        ReactGA.event({
            category: 'Follow',
            action: 'Minimized Board'
        });
        // console.log(boardTypes)
        var b = boardTypes;
        b[i] = 'small-tournament';
        setBoardTypes([b[0],b[1],b[2],b[3]]);
    }

    /* 
        Round 1
            Duda - Rapport
            0.15094079131841132 0.7051676044834969 0.14389160419809158
            Ding - Nepomniachtchi
            0.19070409210166353 0.7067877126834711 0.1025081952148653
            Caruana - Nakamura
            0.17864220349728166 0.7068548988439672 0.11450289765875109
            Radjabov - Firouzja
            0.15384638103263587 0.7060438028867654 0.14010981608059878

            Duda - Rapport
            0.20251337885273374 0.6346508440327967 0.16283577711113612
            Ding - Nepomniachtchi
            0.22558674341741725 0.65565642723387 0.1187568293453794
            Caruana - Nakamura
            0.19171620911416837 0.7281317625217543 0.08015202836074407
            Radjabov - Firouzja
            0.15384638103212306 0.7060438028844119 0.14010981608013173
    */


    const [game1, setGame1] = useState({
        pgn: '',
        eval: 0.2,
        wClock: '2:00:00',
        bClock: '2:00:00',
        ply: 0,
        material: 78,
    });
    const [game2, setGame2] = useState({
        pgn: '',
        eval: 0.2,
        wClock: '2:00:00',
        bClock: '2:00:00',
        ply: 0,
        material: 78,
    });
    const [game3, setGame3] = useState({
        pgn: '',
        eval: 0.2,
        wClock: '2:00:00',
        bClock: '2:00:00',
        ply: 0,
        material: 78,
    });
    const [game4, setGame4] = useState({
        pgn: '',
        eval: 0.2,
        wClock: '2:00:00',
        bClock: '2:00:00',
        ply: 0,
        material: 78,
    });

    useEffect(() => {
        // stockfish1.terminate();
        var c = new Chess();
        c.load_pgn(game1.pgn);
        var res = c.header().Result;
        var cR = chosenResults;
        if (res == '1-0' || res == '1/2-1/2' || res == '0-1') {
            setChosenResults({
                res1: 'x',
                res2: chosenResults.res2,
                res3: chosenResults.res3,
                res4: chosenResults.res4,
            })
            if (res == '1-0') {
                setChances1([1,0,0]);
            } else if (res == '1/2-1/2') {
                setChances1([0,1,0]);
            } else if (res == '0-1') {
                setChances1([0,0,1]);
            }
        }
    }, [game1])

    useEffect(() => {
        // stockfish2.terminate();
        var c = new Chess();
        c.load_pgn(game2.pgn);
        var res = c.header().Result;
        var cR = chosenResults;
        if (res == '1-0' || res == '1/2-1/2' || res == '0-1') {
            setChosenResults({
                res1: chosenResults.res1,
                res2: 'x',
                res3: chosenResults.res3,
                res4: chosenResults.res4,
            })
            if (res == '1-0') {
                setChances2([1,0,0]);
            } else if (res == '1/2-1/2') {
                setChances2([0,1,0]);
            } else if (res == '0-1') {
                setChances2([0,0,1]);
            }
        }
    }, [game2])

    useEffect(() => {
        // stockfish3.terminate();
        // stockfish2.terminate();
        var c = new Chess();
        c.load_pgn(game3.pgn);
        var res = c.header().Result;
        var cR = chosenResults;
        if (res == '1-0' || res == '1/2-1/2' || res == '0-1') {
            setChosenResults({
                res1: chosenResults.res1,
                res2: chosenResults.res2,
                res3: 'x',
                res4: chosenResults.res4,
            })
            if (res == '1-0') {
                setChances3([1,0,0]);
            } else if (res == '1/2-1/2') {
                setChances3([0,1,0]);
            } else if (res == '0-1') {
                setChances3([0,0,1]);
            }
        }
    }, [game3])

    useEffect(() => {
        // stockfish4.terminate();
        // stockfish2.terminate();
        var c = new Chess();
        c.load_pgn(game4.pgn);
        var res = c.header().Result;
        var cR = chosenResults;
        if (res == '1-0' || res == '1/2-1/2' || res == '0-1') {
            setChosenResults({
                res1: chosenResults.res1,
                res2: chosenResults.res2,
                res3: chosenResults.res3,
                res4: 'x',
            })
            if (res == '1-0') {
                setChances4([1,0,0]);
            } else if (res == '1/2-1/2') {
                setChances4([0,1,0]);
            } else if (res == '0-1') {
                setChances4([0,0,1]);
            }
        }
    }, [game4])

    // const [chances, setChances] = useState([
    //     [ 0.20251337885273374, 0.6346508440327967, 0.16283577711113612, ],
    //     [ 0.22558674341741725, 0.6556564272338700, 0.11875682934537940, ],
    //     [ 0.19171620911416837, 0.7281317625217543, 0.08015202836074407, ],
    //     [ 0.15384638103212306, 0.7060438028844119, 0.14010981608013173, ],
    // ]);

    useEffect(() => {
        var getst = GetStandings(probData, chosenResults);
        if (getst != null) setStandings(getst)
    }, [chances1, chances2, chances3, chances4, chosenResults])


    const updateChances = (i, g, dd) => {
        // console.log('update chances' + d);
        // console.log(d);
        // console.log(g)
        const drawWeights = [
            -0.1319925,
            0.001823399,
            -0.0003408588,
            0.002164263,
            -0.0019374980,
            0.5328431,
            -0.501454589,
            -0.007406910,
            -0.02810264
        ]
        const whiteWeights = [
            -2.8472784,
            0.004396867,
            -0.0029729183,
            0.007369797,
            -0.0004282089,
            1.1312987,
            -0.001756741,
            -0.005103267,
            -0.01124505
        ]
        
        var r1 = getPlayerRating(games[i][0]);
        var r2 = getPlayerRating(games[i][1]);
        var wC = g.wClock;
        var c1 = wC.indexOf(':');
        var c2 = wC.indexOf(':', c1+1);
        var hours1 = Number(wC.substring(0, c1));
        var minutes1 = Number(wC.substring(c1 + 1, c2));
        var seconds1 = Number(wC.substring(c2 + 1));
        var bC = g.bClock;
        c1 = bC.indexOf(':');
        c2 = bC.indexOf(':', c1+1);
        var hours2 = Number(bC.substring(0, c1));
        var minutes2 = Number(bC.substring(c1 + 1, c2));
        var seconds2 = Number(bC.substring(c2 + 1));
        var total1 = hours1 * 60 * 60 + minutes1 * 60 + seconds1;
        var total2 = hours2 * 60 * 60 + minutes2 * 60 + seconds2;
        var diff = total1 - total2;
        var sum = total1 + total2;
        var x = diff / sum;
        var adj = 250 * x * x * x + 125 * x;
        if (adj > 0) {
            r2 -= adj;
        } else {
            r1 += adj
        }
        var t = [
            1,
            r1,
            r2,
            r1 - r2,
            Math.abs(r1 - r2),
            g.eval,
            Math.abs(g.eval),
            g.ply,
            g.material
        ];
        // console.log(t);
        var d = 0;
        var w = 0;
        for (var j = 0; j < t.length; j++) {
            w += t[j] * whiteWeights[j];
            d += t[j] * drawWeights[j];
        }
        var pWin = Math.exp(w);
        var pDraw = Math.exp(d);
        var pLoss = 1;
        const total = pWin + pDraw + pLoss;
        pWin /= total;
        pDraw /= total;
        pLoss /= total;
        setChancesI(i, [pWin, pDraw, pLoss], dd, g.pgn);
    }
    const setChancesI = (i, c, d, pgn) => {
        // console.log(i)
        // console.log(c)
        var ch = new Chess();
        ch.load_pgn(pgn);
        if (ch.header().Result == '1-0' || ch.header().Result == '1/2-1/2' || ch.header().Result == '0-1') return;
        if (i == 0) {
            setChances1(c);
        } else if (i == 1) {
            setChances2(c);
        } else if (i == 2) {
            setChances3(c);
        } else if (i == 3) {
            setChances4(c);
        }
        var cs = [chances1, chances2, chances3, chances4];
        cs[i] = c;
        // console.log('set chances' + d);
        // console.log(d);
        setStandings(GetStandings(d, chosenResults, cs, true));
    }

    const [apiFailed, setApiFailed] = useState(0);
    var apiTimeout = null;
    useEffect(() => {
        ReadProbs();
    }, []);

    const [temp1, setTemp1] = useState({
        pgn: '',
        eval: 0.2,
        wClock: '2:00:00',
        bClock: '2:00:00',
        ply: 0,
        material: 78,
    });
    const [temp2, setTemp2] = useState({
        pgn: '',
        eval: 0.2,
        wClock: '2:00:00',
        bClock: '2:00:00',
        ply: 0,
        material: 78,
    });
    const [temp3, setTemp3] = useState({
        pgn: '',
        eval: 0.2,
        wClock: '2:00:00',
        bClock: '2:00:00',
        ply: 0,
        material: 78,
    });
    const [temp4, setTemp4] = useState({
        pgn: '',
        eval: 0.2,
        wClock: '2:00:00',
        bClock: '2:00:00',
        ply: 0,
        material: 78,
    });

    useEffect(() => {
        if (temp1.pgn.includes('1.') && temp1.pgn.length > game1.pgn.length) getEval(0, temp1, probData)
    }, [temp1])

    useEffect(() => {
        if (temp2.pgn.includes('1.') && temp2.pgn.length > game2.pgn.length) getEval(1, temp2, probData)
    }, [temp2])

    useEffect(() => {
        if (temp3.pgn.includes('1.') && temp3.pgn.length > game3.pgn.length) getEval(2, temp3, probData)
    }, [temp3])

    useEffect(() => {
        if (temp4.pgn.includes('1.') && temp4.pgn.length > game4.pgn.length) getEval(3, temp4, probData)
    }, [temp4])

    const setGame = (i, pgn, e, wC, bC, p, m, d) => {
        var g = {
            pgn: pgn,
            eval: e,
            wClock: wC,
            bClock: bC,
            ply: p,
            material: m
        }
        // console.log('setgame')
        // console.log(d);
        if (pgn.includes('1.')) {
            if (i == 0) {
                setTemp1(g);
            } else if (i == 1) {
                setTemp2(g);
            } else if (i == 2) {
                setTemp3(g);
            } else if (i == 3) {
                setTemp4(g);
            }
        } 
    }

    function fetchAPIData(d) {
        // console.log('making api request')
        // broadcastRoundId = 'wrKZuojo' // test - Prague Challengers Round 6
        const url = 'https://lichess.org/api/broadcast/round/' + broadcastRoundId + '.pgn';
        axios.get(url)
        .then((response) => {
            // console.log(response)
            if (response.status == 200) {
                const lines = response.data.split('\n');
                var gs = [game1, game2, game3, game4];
                if (lines.length > 0) {
                    var curPgn = lines[0]
                    var curW = ''
                    var curB = ''
                    for (var i = 1; i < lines.length; i++) {
                        if (lines[i].startsWith('[Event ') || i == lines.length - 1) {
                            for (var j = 0; j < games.length; j++) {
                                if (curW.includes(games[j][0]) && curB.includes(games[j][1])) {
                                    // console.log('found ' + j)
                                    // if (j == 1) console.log(curPgn)
                                    var c = new Chess();
                                    c.load_pgn(curPgn);
                                    var comments = c.get_comments();
                                    var curEval = 0.2;
                                    var curWClock = '2:00:00';
                                    var curBClock = '2:00:00';
                                    var clks = 0;
                                    var lastClock = '2:00:00';
                                    var prevClock = '2:00:00';
                                    for (var k = 0; k < comments.length; k++) {
                                        // console.log(comments[k].comment)
                                        var comment = comments[k].comment;
                                        if (comment.includes('eval')) {
                                            var e = comment.indexOf('eval');
                                            curEval = Number(comment.substring(e + 5, comment.indexOf(']', e)));
                                        }
                                        if (comment.includes('clk')) {
                                            var e = comment.indexOf('clk');
                                            var clk = comment.substring(e + 4, comment.indexOf(']', e));
                                            prevClock = lastClock;
                                            lastClock = clk;
                                            var cc = new Chess(comments[k].fen);
                                            if (cc.turn() === 'b') {
                                                curWClock = lastClock;
                                                curBClock = prevClock;
                                            } else {
                                                curWClock = prevClock;
                                                curBClock = lastClock;
                                            }
                                        }
                                    }
                                    var curMaterial = 0;
                                    var cBoard = c.board();
                                    for (var k = 0; k < cBoard.length; k++) {
                                        for (var l = 0; l < cBoard[k].length; l++) {
                                            if (cBoard[k][l] == null) continue;
                                            var t = cBoard[k][l].type;
                                            if (t == 'p') {
                                                curMaterial += 1;
                                            } else if (t == 'r') {
                                                curMaterial += 5;
                                            } else if (t == 'n') {
                                                curMaterial += 3;
                                            } else if (t == 'b') {
                                                curMaterial += 3;
                                            } else if (t == 'q') {
                                                curMaterial += 9;
                                            }
                                        }
                                    }
                                    setGame(j, curPgn, curEval, curWClock, curBClock, comments.length, curMaterial, d);
                                    gs[j] = {
                                        pgn: curPgn,
                                        eval: curEval,
                                        wClock: curWClock,
                                        bClock: curBClock,
                                        ply: comments.length,
                                        material: curMaterial,
                                    }
                                    // console.log(c.pgn())
                                    // console.log(comments);
                                }
                            }
                            // console.log(curPgn)
                            curPgn = lines[i] + '\n';
                            curW = '';
                            curB = '';
                        } else {
                            if (lines[i] != '') {
                                if (lines[i].startsWith('1.') || lines[i].startsWith('*')) {
                                    curPgn += '\n'
                                }
                                curPgn += lines[i] + '\n';
                                if (lines[i].startsWith('[White ')) {
                                    curW = lines[i];
                                } else if(lines[i].startsWith('[Black ')) {
                                    curB = lines[i];
                                }
                            }
                        }
                    }
                }

                // console.log(response.data);
                apiTimeout = setTimeout(() => {
                    fetchAPIData(d)
                }, 10000);
                setApiFailed(0);
            } else {
                apiTimeout = setTimeout(() => {
                    fetchAPIData(d)
                }, 60000);
                setApiFailed(apiFailed + 1);
            }
        })
        .catch((error) => {
            console.log(error);
            if (apiFailed > 6) {
                clearTimeout(apiTimeout);
            } else {
                apiTimeout = setTimeout(() => {
                    fetchAPIData(d)
                }, 60000);
            }
            setApiFailed(apiFailed + 1);
        })
    }

    const [winP, setWinP] = useState(true);
    const WinPercentClick = () => {
        const newWinP = !winP;
        // setOriginalStandings([]);
        setWinP(newWinP);
    }
    useEffect(() => {
        ReadProbs(false);
    }, [winP])
    useEffect(() => {
        setWinP(true);
    }, [])

    return (
        <div>
            {!comingSoon ? 
                <div>
                {/* <div style={{
                    margin: '50px',
                }}>
                    <h2 className='info-text'>coming soon:</h2>
                    <h2 className='info-text2'>follow the Candidates Tournament 2022</h2>
                    <h2 className='info-text3'>-live win/draw/loss chances for each game updated move by move</h2>
                    <h2 className='info-text3'>-live tournament victory chances for each player updated each round AND each move</h2>
                    <h2 className='info-text3'>-see how different results affect tournament victory chances</h2>
                </div> */}
                {apiFailed > 6 ? <div className='fail-popup'>
                    <h2 className='fail-text'>Failed to retrieve tournament data. Please try again.</h2>
                </div> : <></>}
                <div className='tournament-container'>
                    <div className='tournament-info-and-help'>
                        <div className='tournament-info'>
                            <h2>FIDE Candidates Tournament 2022</h2>
                            <h3>{'Round ' + round}</h3>
                        </div>
                        <button className='help'
                        >?
                            <span className='help-text'>
                                      Welcome to the Chess Assess coverage of the Candidates Tournament!
                                {'\n'}
                                {'\n'}This is a place where you can follow the Candidates games live and keep
                                {'\n'}track of each player's chances of winning the tournament.
                                {'\n'}
                                {'\n'}You can also see my model's predictions for each individual game: how
                                {'\n'}likely a win, draw, and loss is for each player.
                                {'\n'}
                                {'\n'}The best part? All the percentages will continue to update EACH MOVE.
                                {'\n'}Every time a move is played live, the model will re-assess the position
                                {'\n'}and update the chances of each result. Each player's tournament victory
                                {'\n'}chances will then update accordingly!
                                {'\n'}
                                {'\n'}Check back each round as I will post graphs of each player's tournament
                                {'\n'}victory chances over time!
                            </span>
                        </button>
                    </div>
                    <div className='games-and-standings-container'>
                        <div className='tournament-games-container'>
                            <Board type={boardTypes[0]} expand={expand} minimize={minimize} key={boardTypes[0] + '0' + game1.pgn.length}
                                pieceSize={boardTypes[0]=='small-tournament' ? 16 : 48} bid={0} selectedResult={chosenResults.res1}
                                whiteButton={whiteButton} blackButton={blackButton} drawButton={drawButton}
                                whitePlayer={games[0][0]} blackPlayer={games[0][1]} eval={game1.eval} pgn={game1.pgn}
                                whiteClock={game1.wClock} blackClock={game1.bClock}
                                probs={chances1} depth={depth1}/>
                            <Board type={boardTypes[1]} expand={expand} minimize={minimize} key={boardTypes[1] + '1' + game2.pgn.length}
                                pieceSize={boardTypes[1]=='small-tournament' ? 16 : 48} bid={1} selectedResult={chosenResults.res2}
                                whiteButton={whiteButton} blackButton={blackButton} drawButton={drawButton}
                                whitePlayer={games[1][0]} blackPlayer={games[1][1]} eval={game2.eval} pgn={game2.pgn}
                                whiteClock={game2.wClock} blackClock={game2.bClock}
                                probs={chances2} depth={depth2}/>
                            <Board type={boardTypes[2]} expand={expand} minimize={minimize} key={boardTypes[2] + '2' + game3.pgn.length}
                                pieceSize={boardTypes[2]=='small-tournament' ? 16 : 48} bid={2} selectedResult={chosenResults.res3}
                                whiteButton={whiteButton} blackButton={blackButton} drawButton={drawButton}
                                whitePlayer={games[2][0]} blackPlayer={games[2][1]} eval={game3.eval} pgn={game3.pgn}
                                whiteClock={game3.wClock} blackClock={game3.bClock}
                                probs={chances3} depth={depth3}/>
                            <Board type={boardTypes[3]} expand={expand} minimize={minimize} key={boardTypes[3] + '3' + game4.pgn.length}
                                pieceSize={boardTypes[3]=='small-tournament' ? 16 : 48} bid={3} selectedResult={chosenResults.res4}
                                whiteButton={whiteButton} blackButton={blackButton} drawButton={drawButton}
                                whitePlayer={games[3][0]} blackPlayer={games[3][1]} eval={game4.eval} pgn={game4.pgn}
                                whiteClock={game4.wClock} blackClock={game4.bClock}
                                probs={chances4} depth={depth4}/>
                        </div>
                        <div className='standings-container'>
                            {/* <h2>Standings</h2> */}
                            <table className='standings-table'>
                                <tbody>
                                <tr>
                                    <th>Player</th>
                                    <th>Score</th>
                                    <th className='clickable-th' onClick={WinPercentClick}>
                                        {winP ? 'Win%' : 'Top2%'}
                                        <span className='tooltiptext'>{'change to ' + (winP ? 'Top2%' : 'Win%')}</span>
                                    </th>
                                    {/* <th>{winP ? 'Win%' : 'Top2%'}</th> */}
                                </tr>
                                {standings
                                .sort((a,b) => {return (b.winChance + b.score / 1000) - (a.winChance + a.score / 1000)})
                                .map((row) => (
                                    <StandingsRow
                                        key={row.key}
                                        name={row.name}
                                        score={row.score}
                                        winChance={row.winChance}
                                        original={originalStandings}
                                        maxGap={biggestGap}
                                        doColor={!standingsEqual()}/>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div></div>
            :  
                <div>
                    <h2 className='info-text'>coming soon:</h2>
                    <h2 className='info-text2'>follow the Candidates Tournament 2022</h2>
                    <h2 className='info-text3'>-live win/draw/loss chances for each game updated move by move</h2>
                    <h2 className='info-text3'>-live tournament victory chances for each player updated each round AND each move</h2>
                    <h2 className='info-text3'>-see how different results affect tournament victory chances</h2>
                </div>
            }
        </div>
    )
}