import React, { useState, useEffect, useMemo } from 'react';
import { Chess } from 'chess.js';
import axios from 'axios';
import qs from 'qs'
import ReactGA from 'react-ga';

import Piece from './Piece'
import Square from './Square'
import GameInfo from './GameInfo';
import ExpandedGameInfo from './ExpandedGameInfo';

import chessboard from '../Images/chessboard.png';
import bB from '../Images/BBishop.png';
import bK from '../Images/BKing.png';
import bN from '../Images/BKnight.png';
import bP from '../Images/BPawn.png';
import bQ from '../Images/BQueen.png';
import bR from '../Images/BRook.png';
import wB from '../Images/WBishop.png';
import wK from '../Images/WKing.png';
import wN from '../Images/WKnight.png';
import wP from '../Images/WPawn.png';
import wQ from '../Images/WQueen.png';
import wR from '../Images/WRook.png';

// import chessboard from '../staunty-wood/chessboard.png';
// import bB from '../staunty_wood/bb.svg';
// import bK from '../staunty_wood/kb.svg';
// import bN from '../staunty_wood/nb.svg';
// import bP from '../staunty_wood/pb.svg';
// import bQ from '../staunty_wood/qb.svg';
// import bR from '../staunty_wood/rb.svg';
// import wB from '../staunty_wood/bw.svg';
// import wK from '../staunty_wood/kw.svg';
// import wN from '../staunty_wood/nw.svg';
// import wP from '../staunty_wood/pw.svg';
// import wQ from '../staunty_wood/qw.svg';
// import wR from '../staunty_wood/rw.svg';

import rotateIcon from '../Icons/rotate.png';
import backIcon from '../Icons/back.png';
import calculatorIcon from '../Icons/calculator.png';
import closeIcon from '../Icons/close.png';
import playIcon from '../Icons/play.png';
import stopIcon from '../Icons/stop.png';
import swapIcon from '../Icons/swap.png';
import saveIcon from '../Icons/save.png';
import leftIcon from '../Icons/left.png';
import rightIcon from '../Icons/right.png';
import microscopeIcon from '../Icons/microscope.png';

import '../App.css';

const images = {
    'P': wP,
    'R': wR,
    'N': wN,
    'B': wB,
    'Q': wQ,
    'K': wK,
    'p': bP,
    'r': bR,
    'n': bN,
    'b': bB,
    'q': bQ,
    'k': bK,
    null: null
};

function GetImage(piece) {
    if(piece == null) return "";
    let p = piece.color == 'w' ? piece.type.toUpperCase() : piece.type;
    return images[p];
}


function getWindowSize() {
    const {innerWidth, innerHeight} = window;
    console.log("W:",innerWidth,"H:",innerHeight)
    return {innerWidth, innerHeight};
}

const cord = {
    'a': 0,
    'b': 1,
    'c': 2,
    'd': 3,
    'e': 4,
    'f': 5,
    'g': 6,
    'h': 7,
    '8': 0,
    '7': 1,
    '6': 2,
    '5': 3,
    '4': 4,
    '3': 5,
    '2': 6,
    '1': 7,
}

const cordToFile = {
    0: 'a',
    1: 'b',
    2: 'c',
    3: 'd',
    4: 'e',
    5: 'f',
    6: 'g',
    7: 'h',
}

function GetFile(x) {
    return cordToFile[x];
}

function GetRank(y) {
    return "" + (8 - y);
}

function GetCords(flipped, square) {
    var x = cord[square.charAt(0)];
    var y = cord[square.charAt(1)];
    if (flipped) {
        x = 7 - x;
        y = 7 - y;
    }
    return [x, y]
}

function Board(props) {
    
    const GetPieces = (board, flipped, pieceSize) => {
        // console.log('ps ' + pieceSize)
        var ps = []
        for (var i = 0; i < board.length; i++) {
            for (var j = 0; j < board[i].length; j++) {
                var b = board[i][j]
                if (b != null) {
                    ps.push(
                        { type: GetImage(b), x: props.pieceSize * (flipped ? 7 - j : j), y: props.pieceSize * (flipped ? 7 - i : i), key: ps.length }
                    );
                }
            }
        }
        return ps;
    }

    function GetSquare(flipped, x, y, pieceSize) {
        x /= props.pieceSize;
        y /= props.pieceSize;
        if (flipped) {
            x = 7 - x;
            y = 7 - y;
        }
        return GetFile(x) + GetRank(y);
    }

    // const [pieceSize, setPieceSize] = useState([16]);

    // useEffect(() => {
    //     setPieceSize(props.pieceSize);
    // }, [props.pieceSize]);

    function createFromPgn ()  {
        var c = new Chess();
        // if (props.pgn) {
        //     c.load_pgn(props.pgn);
        //     // console.log('loaded ' + props.pgn)
        //     // loadedPgn = true;
        // }
        return c;
    }

    const [chess, setChess] = useState(createFromPgn());

    const [startSq, setStartSq] = useState('');
    var endSq = ''
    var startX = 0
    var startY = 0

    const [trainingPosition, setTrainingPosition] = useState('');
    const [redoStack, setRedoStack] = useState([]);

    const [urlStart, setUrlStart] = useState('https://explorer.lichess.ovh/lichess?variant=standard&fen=');
    const [urlEnd, setUrlEnd] = useState('&play=&since=2012-01&until=2022-04&speeds=classical%2Crapid%2Cblitz&ratings=2000%2C2200%2C2500');
    const [selectedRatings, setSelectedRatings] = useState({
        '1600': true,
        '1800': true,
        '2000': true,
        '2200': true,
        '2500': true,
    })
    const [selectedTimeControls, setSelectedTimeControls] = useState({
        'Blitz': true,
        'Rapid': true,
        'Classical': true,
    })

    useEffect(() => {
        var url = '&play=&since=2012-01&until=2022-04&speeds=';
        if (selectedTimeControls['Classical']) url += 'classical%2C'
        if (selectedTimeControls['Rapid']) url += 'rapid%2C'
        if (selectedTimeControls['Blitz']) url += 'blitz%2C'
        if (url.slice(-1) == '=') url += 'classical%2C'
        if (url.slice(-1) == 'C') url = url.slice(0, -3)
        url += '&ratings='
        if (selectedRatings['1600']) url += '1600%2C'
        if (selectedRatings['1800']) url += '1800%2C'
        if (selectedRatings['2000']) url += '2000%2C'
        if (selectedRatings['2200']) url += '2200%2C'
        if (selectedRatings['2500']) url += '2500%2C'
        if (url.slice(-1) == '=') url += '2500%2C'
        if (url.slice(-1) == 'C') url = url.slice(0, -3)
        setUrlEnd(url);
    }, [selectedRatings, selectedTimeControls])

    const [flipped, setFlipped] = useState(false);

    const [autoRespond, setAutoRespond] = useState(false);

    const [pieces, setPieces] = useState(GetPieces(chess.board(), flipped, props.pieceSize));

    const [squares, setSquares] = useState([]);

    const UpdatePieces = (f=flipped, c=chess) => {
        setPieces(GetPieces(c.board(), f, props.pieceSize));
    }

    const Flip = () => {
        setFlipped(!flipped);
        UpdatePieces(!flipped);
        ReactGA.event({
            category: 'Opening Trainer',
            action: 'Flipped Board'
        });
    }

    const ToggleTraining = () => {
        setAutoRespond(!autoRespond);
        requestResponse(chess, !autoRespond);
        var act = 'Started Training'
        if (autoRespond) {
            act = 'Stopped Training'
        }
        ReactGA.event({
            category: 'Opening Trainer',
            action: act
        });
    }

    const saveTrainingPosition = () => {
        setTrainingPosition(chess.pgn());
        ReactGA.event({
            category: 'Opening Trainer',
            action: 'Saved Position',
            label: chess.pgn()
        });
    }

    const requestResponse = (ch, respond=autoRespond) => {
        // console.log(urlEnd);
        if (!respond) return;
        var fen = ch.fen();
        console.log(fen);
        // fen = 'rnbqkbnr%2Fpppppppp%2F8%2F8%2F8%2F8%2FPPPPPPPP%2FRNBQKBNR+w+KQkq+-+0+1'
        fen = fen.replaceAll(' ', '+');
        fen = fen.replaceAll('/', '%2F');
        var url = urlStart + fen + urlEnd;
        axios.get(url)
            .then((response) => {
                var moves = [];
                var total = 0;
                for (var i = 0; i < response.data.moves.length; i++) {
                    var c = response.data.moves[i].black + response.data.moves[i].white + response.data.moves[i].draws;
                    moves.push({move: response.data.moves[i].san,
                        count: c, from: response.data.moves[i].uci.substring(0, 2), to: response.data.moves[i].uci.substring(2, 4)});
                    total += c;
                }
                var rand = Math.random();
                var a = 0;
                if (moves.length == 0) {
                    setAutoRespond(false);
                    return;
                }
                for (var i = 0; i < moves.length; i++) {
                    if (rand < (moves[i].count / total) + a) {
                        if (!chess.move(moves[i].move)) {
                            setAutoRespond(false);
                        } else {
                            setChess(chess);
                            UpdatePieces();
                            setStartSq('');
                            updateSquares('');
                            setRedoStack([]);
                        }
                        break;
                    }
                    a += moves[i].count / total;
                }
            })
            .catch((error) => {
                console.log(error);
                setAutoRespond(false);
            });
    }

    const resetBoard = () => {
        if (trainingPosition == '') {
            var c = new Chess();
            setChess(c);
            UpdatePieces(flipped, c);
            setStartSq('');
            updateSquares('');
            setAutoRespond(false);
        } else {
            var c = new Chess();
            c.load_pgn(trainingPosition);
            if (chess.fen() == c.fen()) {
                c = new Chess();
            }
            setChess(c);
            UpdatePieces(flipped, c);
            setStartSq('');
            updateSquares('');
            setAutoRespond(false);
        }
        ReactGA.event({
            category: 'Opening Trainer',
            action: 'Reset Board'
        });
    }

    const leftArrow = () => {
        // console.log(chess.pgn())
        var c = chess;
        var m = c.undo();
        if (m) {
            redoStack.push(m.san);
            setChess(c);
            UpdatePieces(flipped, c);
        }
        setStartSq('');
        updateSquares('');
        setAutoRespond(false);
    }

    const rightArrow = () => {
        if (redoStack.length == 0) return;
        var san = redoStack.pop();
        setRedoStack(redoStack);
        var c = chess;
        c.move(san);
        setChess(c);
        UpdatePieces(flipped, c);
        setStartSq('');
        updateSquares('');
        setAutoRespond(false);
    }

    const Analyze = () => {
        var pgn = chess.pgn()
        console.log(pgn)
        axios.post('https://lichess.org/api/import', qs.stringify({ pgn: pgn }))
            .then((response) => {
                window.open(response.data.url, '_blank');
                console.log(response);
            })
            .catch((error) => {
                console.log(error);
                console.log(error.request.responseText)
            })
        ReactGA.event({
            category: 'Opening Trainer',
            action: 'Analyzed on Lichess'
        });
    }

    const updateSquares = (sq) => {
        const sqs = [];
        if (sq != '') {
            const sCords = GetCords(flipped, sq);
            sqs.push({ type: 'start', x: sCords[0] * props.pieceSize, y: sCords[1] * props.pieceSize, key: 0 });
            const moves = chess.moves({ verbose: true, square: sq });
            for (var i = 0; i < moves.length; i++) {
                const cords = GetCords(flipped, moves[i].to);
                if (chess.get(moves[i].to)) {
                    sqs.push({ type: 'capture', x: cords[0] * props.pieceSize, y: cords[1] * props.pieceSize, key: i + 1 });
                } else {
                    sqs.push({ type: 'move', x: cords[0] * props.pieceSize, y: cords[1] * props.pieceSize, key: i + 1 });
                }
            }
        }
        setSquares(sqs);
    }

    const DragStart = (e, x, y) => {
        e.dataTransfer.effectAllowed = 'move'
        var startSqu = GetSquare(flipped, x, y, props.pieceSize);
        setStartSq(startSqu);
        console.log('start ' + startSqu)
        const pctStr = getComputedStyle(document.documentElement).getPropertyValue('--unit');
        const pct = Number((pctStr.trim()).substring(0, pctStr.length - 4)) / 1000;
        const size = Math.min(windowSize.innerHeight, windowSize.innerWidth) * pct * props.pieceSize * 8;
        // console.log("size: ",size);
        startX = Math.floor((e.nativeEvent.offsetX / size) * 8) * props.pieceSize;
        startY = Math.floor((e.nativeEvent.offsetY / size) * 8) * props.pieceSize;
        endSq = "";
        updateSquares(startSqu);
    }

    const handleDragLeave = event => {
        event.dataTransfer.effectAllowed = 'move'
        event.preventDefault()
    };
    const handleDragOver = event => {
        event.dataTransfer.effectAllowed = 'move'
        event.preventDefault()
    };
    const handleDragEnter = event => {
        event.dataTransfer.effectAllowed = 'move'
        event.preventDefault()
    };

    const DropPiece = (e, x, y) => {
        const pctStr = getComputedStyle(document.documentElement).getPropertyValue('--unit');
        const pct = Number((pctStr.trim()).substring(1, pctStr.length - 4)) / 1000;
        const size = Math.min(windowSize.innerHeight, windowSize.innerWidth) * pct * props.pieceSize * 8;
        // console.log("size: ",size);
        const oX = startX - (Math.floor((e.nativeEvent.offsetX / size) * 8) * props.pieceSize);
        const oY = startY - (Math.floor((e.nativeEvent.offsetY / size) * 8) * props.pieceSize);
        x = x - oX
        y = y - oY
        DragEnd(e, x, y)
    }

    const DropPieceBoard = (e, x, y) => {
        for (var i = 0; i < pieces.length; i++) {
            if (pieces[i].x == x && pieces[i].y == y) return;
        }
        DragEndBoard(e, x, y)
    }

    const DragEnd = (e, x, y) => {
        e.dataTransfer.effectAllowed = 'move'
        e.preventDefault()
        endSq = GetSquare(flipped, x, y, props.pieceSize);
        console.log('end ' + endSq + ' from ' + startSq)
        if (startSq != "") {
            console.log('move')
            if (chess.move({ from: startSq, to: endSq })) {
                setRedoStack([]);
                requestResponse(chess);
            }
            setChess(chess);
            UpdatePieces();
        }
        setStartSq("");
        endSq = "";
        updateSquares("");
    }

    const Click = (e, x, y) => {
        var sq = GetSquare(flipped, x, y, props.pieceSize);
        console.log("click " + sq);
        if (startSq == "") {
            // console.log("start")
            setStartSq(sq);
            updateSquares(sq);
        } else if (startSq == sq) {
            setStartSq("");
            endSq = "";
            updateSquares("");
        } else {
            // console.log("end")
            if (chess.move({ from: startSq, to: sq })) {
                setRedoStack([]);
                requestResponse(chess);
            }
            setChess(chess);
            UpdatePieces();
            setStartSq(sq);
            endSq = "";
            updateSquares(sq);
        }
    }

    const ClickBoard = (e) => {
        if (props.type == 'small-tournament') return;
        const pctStr = getComputedStyle(document.documentElement).getPropertyValue('--unit');
        const pct = Number((pctStr.trim()).substring(1, pctStr.length - 4)) / 1000;
        const size = Math.min(windowSize.innerHeight, windowSize.innerWidth) * pct * props.pieceSize * 8;
        // console.log("pct: ", pctStr, pct);
        // console.log("size: ", size);
        const x = Math.floor((e.nativeEvent.offsetX / size) * 8) * props.pieceSize;
        const y = Math.floor((e.nativeEvent.offsetY / size) * 8) * props.pieceSize;
        for (var i = 0; i < pieces.length; i++) {
            if (pieces[i].x == x && pieces[i].y == y) return;
        }
        Click(e, x, y)
    }

    const DragEndBoard = (e) => {
        const pctStr = getComputedStyle(document.documentElement).getPropertyValue('--unit');
        const pct = Number((pctStr.trim()).substring(1, pctStr.length - 4)) / 1000;
        const size = Math.min(windowSize.innerHeight, windowSize.innerWidth) * pct * props.pieceSize * 8;
        // console.log("size: ",size);
        const x = Math.floor((e.nativeEvent.offsetX / size) * 8) * props.pieceSize;
        const y = Math.floor((e.nativeEvent.offsetY / size) * 8) * props.pieceSize;
        // for (var i = 0; i < pieces.length; i++) {
        //     if (pieces[i].x == x && pieces[i].y == y) return;
        // }
        DragEnd(e, x, y)
    }

    const handleKeyPress = (e) => {
        if (e.keyCode == 37) { // <-
            leftArrow();
        } else if (e.keyCode == 39) { // ->
            rightArrow();
        } else if (e.keyCode == 70) { // f
            Flip();
        } else if (e.keyCode == 82) { // r
            resetBoard();
        } else if (e.keyCode == 83) { // s
            saveTrainingPosition();
        }
    }
    
    const unitStart = 'calc(var(--unit) * ';
    let basSize = 
    props.type == 'opening trainer' ? 
    {
        width: unitStart + ((.1 * (10 + props.pieceSize * 8 + props.pieceSize * 4))) + ')',
        height: unitStart + ((.1 * (10 + props.pieceSize * 8))) + ')'
    } : props.type == 'small-tournament' ? {
        width: unitStart + (.1 * (props.pieceSize * 8 * 4)) + ')',
        height: unitStart + (.1 * (10 + props.pieceSize * 8)) + ')'
    } : {
        width: unitStart + (.1 * (10 + 502)) + ')',
        height: unitStart + (.1 * (10 + 512)) + ')',
        paddingTop: unitStart + (6.4) + ')'
    }

    let basMid = {
        position: 'relative',
        top: '0%'
    }

    let basMore = {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
    }


    let bSize = {
        width: unitStart + (.1 * (props.pieceSize * 8)) + ')',
        height: unitStart + (.1 * (props.pieceSize * 8)) + ')'
    }

    let pSize = {
        width: unitStart + (.1 * props.pieceSize) + ')',
        height: unitStart + (.1 * props.pieceSize) + ')'
    }

    const hue = 0;

    let bSaturated = {
        filter: 'saturate(200%) hue-rotate(' + hue + 'deg)',
    }

    let bNormal = {
        filter: 'saturate(100%) hue-rotate(' + hue + 'deg)',
    }

    let bDesaturated = {
        filter: 'saturate(50%) hue-rotate(' + hue + 'deg)',
    }

    const [gameResult, setGameResult] = useState('*');

    useEffect(() => {
        if (props.pgn) {
            var c = new Chess();
            c.load_pgn(props.pgn);
            setChess(c);
            UpdatePieces(false, c);
            setStartSq('');
            updateSquares('');
            setRedoStack([]);
            setGameResult(c.header().Result)
            // setGameResult('1-0')
        }
    }, [props.pgn])

    const [windowSize, setWindowSize] = useState(getWindowSize());

    useEffect(() => {
        function handleWindowResize() {
            setWindowSize(getWindowSize());
        }

        window.addEventListener('resize', handleWindowResize);

        return () => {
            window.removeEventListener('resize', handleWindowResize);
        };
    }, []);

    const updateRatings = (rating, status) => {
        var ratings = {
            '1600': selectedRatings['1600'],
            '1800': selectedRatings['1800'],
            '2000': selectedRatings['2000'],
            '2200': selectedRatings['2200'],
            '2500': selectedRatings['2500'],
        };
        ratings[rating] = status;
        setSelectedRatings(ratings);
    }

    const updateTimes = (time, status) => {
        var times = {
            'Blitz': selectedTimeControls['Blitz'],
            'Rapid': selectedTimeControls['Rapid'],
            'Classical': selectedTimeControls['Classical'],
        };
        times[time] = status;
        setSelectedTimeControls(times);
    }

    return(
        <div className='board-and-stuff'
        style={props.type=='opening trainer' ? {...basMore, ...basSize} : props.type == 'small-tournament' ? {...basSize} : {...basSize, ...basMid}}>
            <div className={'board' + (props.type=='small-tournament' ? ' board-expandable' : '')}
            style={{...bSize}}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={DropPieceBoard}
            onClick={props.type=='small-tournament' ? () => {
                props.expand(props.bid);
            } : (e) => {ClickBoard(e)}}
            >
                {gameResult == '1-0' || gameResult == '1/2-1/2' || gameResult == '0-1' ? <div className='result-overlay'>
                    <h2 className='result'>{gameResult}</h2>
                </div> : <></>}
                <img className='no-drag half-second-transition'
                    alt=''
                    src={chessboard}
                    style={(chess.pgn() == trainingPosition && trainingPosition != '') ? {...bSaturated} : autoRespond ? {...bNormal} : {...bDesaturated}}
                    height='100%'
                    width='100%'/>
                {squares.map((square) => (
                    <Square type={square.type} x={square.x} y={square.y} key={square.key}
                    pSize={pSize}
                    pieceSize={props.pieceSize}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={DropPiece}/>
                ))}
                {pieces.map((piece) => (
                    <Piece type={piece.type} x={piece.x} y={piece.y} key={piece.key} 
                    canMove={props.type=='opening trainer'}
                    pSize={pSize}
                    onDragStart={DragStart}
                    onDragEnd={DragEnd}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={DropPiece}
                    onClick={Click} />
                ))}
                
            </div>
            {props.type == 'opening trainer' ? <div>
            <div className='button-panel'>
                <div className='database-selection'>
                    <div className='time-selection'>
                        <button className={'selection-button' + (selectedTimeControls['Blitz'] ? ' selected-button' : ' unselected-button')}
                            onClick={() => {updateTimes('Blitz', !selectedTimeControls['Blitz'])}}>
                            Blitz
                        </button>
                        <button className={'selection-button' + (selectedTimeControls['Rapid'] ? ' selected-button' : ' unselected-button')}
                            onClick={() => {updateTimes('Rapid', !selectedTimeControls['Rapid'])}}>
                            Rapid
                        </button>
                        <button className={'selection-button' + (selectedTimeControls['Classical'] ? ' selected-button' : ' unselected-button')}
                            onClick={() => {updateTimes('Classical', !selectedTimeControls['Classical'])}}>
                            Classical
                        </button>
                    </div>
                    <div className='rating-selection'>
                        <button className={'selection-button' + (selectedRatings['1600'] ? ' selected-button' : ' unselected-button')}
                            onClick={() => {updateRatings('1600', !selectedRatings['1600'])}}>
                            1600
                        </button>
                        <button className={'selection-button' + (selectedRatings['1800'] ? ' selected-button' : ' unselected-button')}
                            onClick={() => {updateRatings('1800', !selectedRatings['1800'])}}>
                            1800
                        </button>
                        <button className={'selection-button' + (selectedRatings['2000'] ? ' selected-button' : ' unselected-button')}
                            onClick={() => {updateRatings('2000', !selectedRatings['2000'])}}>
                            2000
                        </button>
                        <button className={'selection-button' + (selectedRatings['2200'] ? ' selected-button' : ' unselected-button')}
                            onClick={() => {updateRatings('2200', !selectedRatings['2200'])}}>
                            2200
                        </button>
                        <button className={'selection-button' + (selectedRatings['2500'] ? ' selected-button' : ' unselected-button')}
                            onClick={() => {updateRatings('2500', !selectedRatings['2500'])}}>
                            2500
                        </button>
                    </div>
                </div>
                <div className='top-buttons'>
                    <div className='col'>
                        <button className='small-button tooltip'
                            onClick={resetBoard}>
                            <img className='button-icon' src={rotateIcon} alt='Reset' data='Reset Board' />
                            <span className='tooltiptext'>reset board</span>
                        </button>
                        <button className='small-button tooltip'
                            onClick={Flip}>
                            <img className='button-icon' src={swapIcon} alt='Flip' data='Flip Board' />
                            <span className='tooltiptext'>flip board</span>
                        </button>
                    </div>
                    <div className='col'>
                        <button className='small-button tooltip'
                            onClick={saveTrainingPosition}>
                            <img className='button-icon' src={saveIcon} alt='Save' data='Set position to train from' />
                            <span className='tooltiptext'>save position</span>
                        </button>
                        <button className='small-button tooltip'
                            onClick={Analyze}>
                            <img className='button-icon' src={microscopeIcon} alt='Analyze' data='Analyze on Lichess' />
                            <span className='tooltiptext'>analyze on lichess</span>
                        </button>
                    </div>
                </div>
                <button className={'panel-button ' + (autoRespond ? 'toggle-on' : 'toggle-off')}
                    onClick={ToggleTraining}>
                        <div className='col'>
                            {autoRespond ? 'Stop Training' : 'Start Training'}
                            <img className='button-icon2' alt='' src={autoRespond ? stopIcon : playIcon} />
                        </div>
                </button>
                <div className='col'>
                    <p className='fen'>PGN:</p>
                    <textarea className='fen' rows={5} cols={25} readOnly value={chess.pgn({max_width: 25})}>
                    </textarea>
                </div>
                <div className='col'>
                    <p className='fen'>FEN:</p>
                    <textarea className='fen' rows={1} cols={25} readOnly value={chess.fen()}>
                    </textarea>
                </div>
                <div className='top-buttons'>
                    <button className='small-button'
                        onClick={leftArrow}>
                        <img className='button-icon' src={leftIcon} alt='<' />
                    </button>
                    <button className='small-button'
                        onClick={rightArrow}>
                        <img className='button-icon' src={rightIcon} alt='>' />
                    </button>
                </div>
            </div>
            <button className='help'>?
                <span className='help-text'>
                    Welcome to the opening trainer!
                    {'\n'}Here you can play against the Lichess Opening Database.
                    {'\n'}
                    {'\n'}You can freely make moves on the board. Click the Save button to
                    {'\n'}save the position you want to train. 
                    {'\n'}
                    {'\n'}When you click the start button, the trainer will randomly choose 
                    {'\n'}a move from the lichess games database in this position and play it.
                    {'\n'}This way, the opening moves you face here will be representative
                    {'\n'}of what you would actually see in a game on lichess.
                    {'\n'}The trainer will then continue responding to your moves as you play.
                    {'\n'}
                    {'\n'}The trainer will stop when there are no more games in the database
                    {'\n'}from the current position. To check your moves with a computer,
                    {'\n'}you can click the Analyze on Lichess button, and the game will be
                    {'\n'}imported to Lichess.
                    {'\n'}
                    {'\n'}Clicking Reset will take you back to your saved position.
                    {'\n'}Click Reset again to return to the starting position.
                </span>
            </button></div> : props.type=='small-tournament' ?
            <div className='game-info-and-buttons'>
                <GameInfo 
                whitePlayer={props.whitePlayer}
                blackPlayer={props.blackPlayer}
                eval={props.eval}
                whiteChance={props.probs[0]}
                drawChance={props.probs[1]}
                blackChance={props.probs[2]}
                depth={props.depth}/>
                <div className='result-buttons'
                    style={gameResult == '1-0' || gameResult == '1/2-1/2' || gameResult == '0-1' ? {pointerEvents: 'none'} : {}}>
                    <button className={'small-button result-button black-result' + (props.selectedResult == '0-1' ? ' selected-result' : '')}
                    onClick={() => {props.blackButton(props.bid)}}>
                        <b>0 - 1</b>
                    </button>
                    <button className={'small-button result-button draw-result' + (props.selectedResult == '1/2-1/2' ? ' selected-result' : '')}
                    onClick={() => {props.drawButton(props.bid)}}>
                        <b>1/2-1/2</b>
                    </button>
                    <button className={'small-button result-button white-result' + (props.selectedResult == '1-0' ? ' selected-result' : '')}
                    onClick={() => {props.whiteButton(props.bid)}}>
                        <b>1 - 0</b>
                    </button>
                </div>
            </div>
            : props.type=='big-tournament' ? 
            <div>
            <ExpandedGameInfo
                whitePlayer={props.whitePlayer}
                blackPlayer={props.blackPlayer}
                whiteClock={props.whiteClock}
                blackClock={props.blackClock}
                eval={props.eval}
                whiteChance={props.probs[0]}
                drawChance={props.probs[1]}
                blackChance={props.probs[2]}/>
                <button className='minimize-button' onClick={() => {props.minimize(props.bid)}}>
                    <div className='mini'></div>
                </button>
                <div className='expanded-result-buttons'>
                    <button className={'small-button expanded-result-button white-result' + (props.selectedResult == '1-0' ? ' selected-result' : '')}
                    onClick={() => {props.whiteButton(props.bid)}}>
                        <b>1 - 0</b>
                    </button>
                    <button className={'small-button expanded-result-button draw-result' + (props.selectedResult == '1/2-1/2' ? ' selected-result' : '')}
                    onClick={() => {props.drawButton(props.bid)}}>
                        <b>1/2-1/2</b>
                    </button>
                    <button className={'small-button expanded-result-button black-result' + (props.selectedResult == '0-1' ? ' selected-result' : '')}
                    onClick={() => {props.blackButton(props.bid)}}>
                        <b>0 - 1</b>
                    </button>
                </div>
                {/* <div className='move-buttons'>
                    <div className='arrow-buttons'>
                        <button className='move-button'
                        onClick={leftArrow}>
                            <h3><b>{'<'}</b></h3>
                        </button>
                        <button className='move-button'
                        onClick={rightArrow}>
                            <h3><b>{'>'}</b></h3>
                        </button>
                    </div>
                    <button className='live-button'
                    onClick={()=>{}}>
                        <h3><b>Live</b></h3>
                    </button>
                </div> */}
            </div>
            :
            <></>}
        </div>
    );
}

export default Board;