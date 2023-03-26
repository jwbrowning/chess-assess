import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chess } from 'chess.js';
import ReactGA from 'react-ga';

import Board from './Board';
import StandingsRow from './StandingsRow';
import LineGraph from './LineGraph';

let stockfish = [];

export default function Tournament(props) {

    useEffect(() => {
        stockfish = createWorkers();
    }, [])
    const createWorkers = () => {
        var ws = [];
        for (var i = 0; i < props.games.length; i++) {
            ws.push(new Worker('/stockfish.js'));
        }
        return ws;
    }
    // let stockfish = createWorkers();

    const [chances, setChances] = useState(props.chances.slice());
    const setChanceList = (i, chanceList) => {
        var cl = chances.slice();
        cl[i] = chanceList;
        setChances(cl);
    }

    const getPropDepths = () => {
        var ds = []
        for (var i = 0; i < props.games.length; i++) {
            ds.push(props.depth);
        }
        return ds;
    }
    const setDepth = (i, newDepth) => {
        var ds = depths.slice();
        ds[i] = newDepth;
        setDepths(ds);
    }
    const [depths, setDepths] = useState(getPropDepths());


    const onStockfishMsg = (event, fen, i, g, d) => {
        // console.log("stockfishmsg");
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

            setGameNotTemp(i, newG);
            setDepth(i, dep);
            if (event.data.startsWith("info depth " + props.depth) || g.pgn.includes('1-0') || g.pgn.includes('1/2-1/2') || g.pgn.includes('0-1')) {
                stockfish[i].terminate();
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
        stockfish[i].terminate();
        stockfish[i] = new Worker("/stockfish.js");
        stockfish[i].postMessage("uci");
        stockfish[i].postMessage("ucinewgame");
        stockfish[i].postMessage(`position fen ${fen}`);
        stockfish[i].postMessage(`go depth ${props.depth}`);
        stockfish[i].onmessage = (event) => {
            onStockfishMsg(event, fen, i, g, d);
        }
    }

    
    const getPlayerRating = (player) => {
        for (var i = 0; i < props.playerInfo.length; i++) {
            if (props.playerInfo[i][0] == player) {
                return props.playerInfo[i][1];
            }
        }
        // return 0;
    }

    const setProbStuff = (text, doApiTimeout) => {
        var data = [];
        var lines = text.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var items = lines[i].split(' ');
            var key = '';
            for (var j = 0; j < props.games.length; j++) {
                key += items[j] + ",";
            }
            var val = []
            for (var j = props.games.length; j < items.length; j++) {
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
        fetch(props.probabilities)
            .then(r => r.text())
            .then(text => setProbStuff(text, doApiTimeout))
    };

    const [probData, setProbData] = useState([]);

    // useEffect(() => {
    // }, []);

    const isInData = (d, x) => {
        for (var i = 0; i < d.length; i++) {
            for (var j = 0; j < x.length; j++) {
                if (getFromSplitStr(d[i][0], j, ',') == x[j]) {
                    return true;
                }
            }
        }
        return false;
    }

    const getData = (d, x) => {
        for (var i = 0; i < d.length; i++) {
            for (var j = 0; j < x.length; j++) {
                if (getFromSplitStr(d[i][0], j, ',') == x[j]) {
                    return d[i][1];
                }
            }
        }
        return null;
    }

    const getFromSplitStr = (str, i, splitter) => {
        var split = str.split(splitter);
        return split[i];
    }


    const getPgn = (i) => {
        return games[i].pgn;
    }

    const GetScore = (i, cR) => {
        var name = props.playerInfo[i][0];
        var score = props.playerInfo[i][2];
        for (var j = 0; j < props.games.length; j++) {
            // console.log(j + ": " + name + " " + cR[j]);
            if (props.games[j][0] == name) {
                var c = new Chess();
                c.load_pgn(getPgn(j));
                var res = c.header().Result;
                if (!(res == '1-0' || res == '1/2-1/2' || res == '0-1')) res = GetChosenResult(j, cR);
                if (res == '1-0') {
                    score += 1;
                    break;
                } else if (res == '1/2-1/2') {
                    score += .5;
                    break;
                } else if (res == '0-1') {
                    break;
                }
            } else if (props.games[j][1] == name) {
                var c = new Chess();
                c.load_pgn(getPgn(j));
                var res = c.header().Result;
                if (!(res == '1-0' || res == '1/2-1/2' || res == '0-1')) res = GetChosenResult(j, cR);
                if (res == '0-1') {
                    score += 1;
                    break;
                } else if (res == '1/2-1/2') {
                    score += .5;
                    break;
                } else if (res == '1-0') {
                    break;
                }
            }
            if (props.games[j][0] == name && cR[j] == "1-0") {
                // console.log("A")
                score += 1;
                break;
            } else if (props.games[j][1] == name && cR[j] == "0-1") {
                // console.log("AB")
                score += 1;
                break;
            } else if (cR[j] == "1/2-1/2") {
                // console.log("ABC")
                score += .5;
                break;
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

    const createBoardTypes = () => {
        var bs = [];
        for (var i = 0; i < props.games.length; i++) {
            bs.push('small-tournament');
        }
        return bs;
    }
    const [boardTypes, setBoardTypes] = useState(createBoardTypes());

    const GetStandings = (data, cR=createChosenResults(), cs=chances, ignoreOS=false) => {
        if (ignoreOS) return null;
        if (data.length == 0) return null;
        // console.log('data')
        // console.log(data)
        const results = [
            '1-0', '1/2-1/2', '0-1'
        ]
        var probs = []
        for (var i = 0; i < props.playerInfo.length; i++) {
            probs.push(0);
        }
        // for (var i = 0; i < results.length; i++) {
        //     for (var j = 0; j < results.length; j++) {
        //         for (var k = 0; k < results.length; k++) {
        //             for (var l = 0; l < results.length; l++) {
        //                 var probsData = getData(data, {res1: results[i], res2: results[j], res3: results[k], res4: results[l]});
        //                 var chance =      (cR.res1 == 'x' ? cs[0][i] : cR.res1 == results[i] ? 1.0 : 0.0)
        //                                 * (cR.res2 == 'x' ? cs[1][j] : cR.res2 == results[j] ? 1.0 : 0.0)
        //                                 * (cR.res3 == 'x' ? cs[2][k] : cR.res3 == results[k] ? 1.0 : 0.0)
        //                                 * (cR.res4 == 'x' ? cs[3][l] : cR.res4 == results[l] ? 1.0 : 0.0)
        //                 for (var m = 0; m < probs.length; m++) {
        //                     probs[m] += chance * probsData[m] / N
        //                 }
        //             }
        //         }
        //     }
        // }

        const indicesToResults = (indices) => {
            var res = [];
            for (var i = 0; i < indices.length; i++) {
                res.push(results[indices[i]]);
            }
            return res;
        }
        
        const probLoop = (depth, itrs) => {
            for (var i = 0; i < results.length; i++) {
                if (depth == props.games.length) {
                    var cc = itrs.concat([i]);
                    var probsData = getData(data,indicesToResults(cc));
                    var chance = 1.0;
                    for (var j = 0; j < cR.length; j++) {
                        chance *= (cR[j] == 'x' ? cs[j][cc[j]] : cR[j] == results[cc[j]] ? 1.0 : 0.0);
                    }
                    for (var k = 0; k < probs.length; k++) {
                        probs[k] += chance * probsData[k] / props.N;
                    }
                } else {
                    probLoop(depth + 1, itrs.concat([i]));
                }
            }
        }
        probLoop(1, []);

        
        // console.log('get standings')
        var s = [];
        // console.log(data);
        for (var i = 0; i < props.playerInfo.length; i++) {
            // console.log(props.playerInfo[i][0] + ": " + probs[i]);
            s.push({
                key: i,
                name: props.playerInfo[i][0],
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

    const createChosenResults = () => {
        var cr = [];
        for (var i = 0; i < props.games.length; i++) {
            cr.push('x');
        }
        return cr;
    }
    const [chosenResults, setChosenResults] = useState(createChosenResults());

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
        var cR = chosenResults
        var c = cR[i];
        var c2 = 'x'
        if (c == '1-0') {
            c2 = 'x';
        } else {
            c2 = '1-0';
        }
        cR[i] = c2;
        setChosenResults(cR);
        setStandings(GetStandings(probData, cR))
    }
    const drawButton = (i) => {
        ReactGA.event({
            category: 'Follow',
            action: 'Clicked Draw Button'
        });
        var cR = chosenResults
        var c = cR[i];
        var c2 = 'x'
        if (c == '1/2-1/2') {
            c2 = 'x';
        } else {
            c2 = '1/2-1/2';
        }
        cR[i] = c2;
        setChosenResults(cR);
        setStandings(GetStandings(probData, cR))
    }
    const blackButton = (i) => {
        ReactGA.event({
            category: 'Follow',
            action: 'Clicked Black Win Button'
        });
        var cR = chosenResults
        var c = cR[i];
        var c2 = 'x'
        if (c == '0-1') {
            c2 = 'x';
        } else {
            c2 = '0-1';
        }
        cR[i] = c2;
        setChosenResults(cR);
        setStandings(GetStandings(probData, cR))
    }

    const expand = (i) => {
        // console.log(chances[0]);
        ReactGA.event({
            category: 'Follow',
            action: 'Expanded Board'
        });
        // console.log(boardTypes)
        var b = boardTypes.slice();
        b[i] = 'big-tournament';
        setBoardTypes(b);
    }
    const minimize = (i) => {
        ReactGA.event({
            category: 'Follow',
            action: 'Minimized Board'
        });
        // console.log(boardTypes)
        var b = boardTypes.slice();
        b[i] = 'small-tournament';
        setBoardTypes(b);
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


    const createGames = () => {
        var gs = []
        for (var i = 0; i < props.games.length; i++) {
            gs.push({
                pgn: '',
                eval: 0.2,
                wClock: '2:00:00',
                bClock: '2:00:00',
                ply: 0,
                material: 78,
            })
        }
        return gs;
    }
    const [games, setGames] = useState(createGames().slice());
    const setGameNotTemp = (i, data) => {
        var gs = games.slice();
        gs[i] = data;
        // console.log("setting games")
        setGames(gs);
    }

    useEffect(() => {
        // console.log("jlam")
        // stockfish1.terminate();
        var cR = chosenResults;
        var chancesLists = chances.slice();
        for (var i = 0; i < props.games.length; i++) {
            var c = new Chess();
            c.load_pgn(games[i].pgn);
            var res = c.header().Result;
            if (res == '1-0' || res == '1/2-1/2' || res == '0-1') {
                cR[i] = 'x';
                if (res == '1-0') {
                    chancesLists[i] = [1,0,0];
                } else if (res == '1/2-1/2') {
                    chancesLists[i] = [0,1,0];
                } else if (res == '0-1') {
                    chancesLists[i] = [0,0,1];
                }
            }
        }
        setChosenResults(cR);
        setChances(chancesLists)
    }, [JSON.stringify(games)])

    useEffect(() => {
        var getst = GetStandings(probData, chosenResults);
        if (getst != null) setStandings(getst)
    }, [JSON.stringify(chances), JSON.stringify(chosenResults)])


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
        
        var r1 = getPlayerRating(props.games[i][0]);
        var r2 = getPlayerRating(props.games[i][1]);
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
        setChanceList(i, c);
        var cs = chances;
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

    const [temps, setTemps] = useState(createGames().slice());
    const setTemp = (i, data) => {
        var ts = temps.slice();
        ts[i] = data;
        setTemps(ts);
    }

    useEffect(() => {
        // console.log("temp game updated")
        for (var i = 0; i < props.games.length; i++) {
            // console.log(temps[i].pgn);
            // console.log(games[i].pgn.length + " vs " + temps[i].pgn.length);
            // console.log((temps[i].pgn.includes('1.') && temps[i].pgn.length > games[i].pgn.length));
            if (temps[i].pgn.includes('1.') && temps[i].pgn.length > games[i].pgn.length) {
                // console.log("calling get eval")
                getEval(i, temps[i], probData);
            }
        }
    }, [JSON.stringify(temps)])

    const setGame = (i, pgn, e, wC, bC, p, m, d) => {
        var g = {
            pgn: pgn,
            eval: e,
            wClock: wC,
            bClock: bC,
            ply: p,
            material: m
        }
        // console.log('set temp game')
        // console.log(d);
        if (pgn.includes('1.')) {
            // console.log("setting temp");
            setTemp(i, g);
        } else {
            console.log("bad: " + pgn);
        }
    }

    function fetchAPIData(d) {
        // console.log('making api request')
        // broadcastRoundId = 'wrKZuojo' // test - Prague Challengers Round 6
        if (props.broadcastRoundId == '') return
        const url = 'https://lichess.org/api/broadcast/round/' + props.broadcastRoundId + '.pgn';
        axios.get(url)
        .then((response) => {
            // console.log("got response: " + response)
            if (response.status == 200) {
                const lines = response.data.split('\n');
                var gs = games;
                if (lines.length > 0) {
                    var curPgn = lines[0]
                    var curW = ''
                    var curB = ''
                    for (var i = 1; i < lines.length; i++) {
                        if (lines[i].startsWith('[Event ') || i == lines.length - 1) {
                            for (var j = 0; j < props.games.length; j++) {
                                if (curW.includes(props.games[j][0]) && curB.includes(props.games[j][1])) {
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
                                    // console.log("made it to set game call")
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

    const unitStart = 'calc(var(--unit) * ';

    const getPlayerColor = (name) => {
        if (props.playerInfo!=null && props.playerInfo.length>0 && props.playerInfo[0].length > 3) {
            for (var i = 0; i < props.playerInfo.length; i++) {
                if (name == props.playerInfo[i][0]) return props.playerInfo[i][3];
            }
        }
        return null;
    }

    let standingsHeight = {
        height: unitStart + props.playerInfo.length + ' * 5 + var(--unit) * 5)',
        // backgroundColor: 'red'
    }

    let filter = {
        filter: 'opacity(' + (props.opacity ? props.opacity : 100) + '%)',
    }

    return (
        <div className='tournament' style={{...filter}}>
            {props.comingSoon ?
                <div>
                    <h2 className='info-text'>coming soon:</h2>
                    <h2 className='info-text2'>follow the {props.name}</h2>
                    <h2 className='info-text3'>-live win/draw/loss chances for each game updated move by move</h2>
                    <h2 className='info-text3'>-live {props.type} victory chances for each player updated each round AND each move</h2>
                    <h2 className='info-text3'>-see how different results affect tournament victory chances</h2>
                </div> : <div></div>
            }
            {props.display ? 
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
                            <h2>{props.name}</h2>
                            <h3>{props.subtitle}</h3>
                        </div>
                        <button className='help'
                        >?
                            <span className='help-text'>
                                      Welcome to Chess Assess's coverage of the {props.name + "!"}
                                {'\n'}
                                {'\n'}This is a place where you can follow tournament games live and keep
                                {'\n'}track of each player's chances of winning the tournament.
                                {'\n'}
                                {'\n'}You can also see my model's predictions for each individual game: how
                                {'\n'}likely a win, draw, and loss is for each player.
                                {'\n'}
                                {'\n'}The best part? All the percentages will continue to update EACH MOVE.
                                {'\n'}Every time a move is played live, the model will re-assess the position
                                {'\n'}and update the chances of each result. Each player's tournament victory
                                {'\n'}chances will then update accordingly!
                            </span>
                        </button>
                    </div>
                    <div className='games-and-standings-container'>
                        <div className='tournament-games-container'>
                            {games.map((game, i) => (
                                <Board type={boardTypes[i]} expand={expand} minimize={minimize} key={i + ' ' + boardTypes[i] + ' ' + game.pgn.length}
                                    pieceSize={boardTypes[i]=='small-tournament' ? 16 : 48} bid={i} selectedResult={chosenResults[i]}
                                    whiteButton={whiteButton} blackButton={blackButton} drawButton={drawButton}
                                    whitePlayer={props.games[i][0]} blackPlayer={props.games[i][1]} eval={game.eval} pgn={game.pgn}
                                    wcol={getPlayerColor(props.games[i][0])} bcol={getPlayerColor(props.games[i][1])}
                                    whiteClock={game.wClock} blackClock={game.bClock}
                                    probs={chances[i]} depth={depths[i]}/>
                            ))}
                        </div>
                        <div className='standings-container'
                                style={{...standingsHeight}}>
                            {/* <h2>Standings</h2> */}
                            <table className='standings-table'>
                                <tbody>
                                <tr>
                                    <th>Player</th>
                                    <th>Score</th>
                                    <th>Win%
                                        {/* {winP ? 'Win%' : 'Top2%'}
                                        <span className='tooltiptext'>{'change to ' + (winP ? 'Top2%' : 'Win%')}</span> */}
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
                                        doColor={!standingsEqual()}
                                        pcol={getPlayerColor(row.name)}/>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {props.graph ? <LineGraph /> : <div></div>}
                </div></div>
            :  <div></div>}
        </div>
    )

}