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

    let trans = {
        transform: 'translate(' + (.1 * props.x) + 'vmin, ' + (.1 * props.y) + 'vmin)'
    }

    let mTrans = {
        transform: 'translate(' + .1 * Math.floor(.3125 * props.pieceSize) + 'vmin, ' + .1 * Math.floor(.3125 * props.pieceSize) + 'vmin)'
    }

    let color = {
        backgroundColor: 'var(--glow-color)'
    }

    let mSize = {
        width: .1 * Math.floor(.375 * props.pieceSize) + 'vmin',
        height: .1 * Math.floor(.375 * props.pieceSize) + 'vmin'
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