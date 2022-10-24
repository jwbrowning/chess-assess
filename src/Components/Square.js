import React, { useState } from 'react'
import '../App.css';

function Square(props) {

    const [highlight, setHighlight] = useState(false);

    const dragEnter = () => {
        setHighlight(true);
    }

    const dragExit = () => {
        setHighlight(false);
    }

    const unitStart = 'calc(var(--unit) * ';

    let trans = {
        transform: 'translate(' + unitStart + (.1 * props.x) + '), ' + unitStart + (.1 * props.y) + '))'
    }

    let mTrans = {
        transform: 'translate(' + unitStart + (.1 * Math.floor(.3125 * props.pieceSize)) + '), ' + unitStart + (.1 * Math.floor(.3125 * props.pieceSize)) + '))'
    }

    let color = {
        backgroundColor: 'var(--glow-color)'
    }

    let mSize = {
        width: unitStart + (.1 * Math.floor(.375 * props.pieceSize)) + ')',
        height: unitStart + (.1 * Math.floor(.375 * props.pieceSize)) + ')'
    }

    return(
        <div className='square'
        onDragEnter={dragEnter}
        onDragLeave={dragExit}
        onDragOver={props.onDragOver}
        onDrop={(e) => {props.onDrop(e, props.x, props.y)}}
        style={highlight ? {...trans, ...color, ...props.pSize} : {...trans, ...props.pSize}}>
            <span className={props.type}
            style={props.type=='move' ? {...mSize, ...mTrans} : {...props.pSize}}/>
        </div>
    );
}

export default Square;