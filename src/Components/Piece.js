import React, { useState, useEffect, useMemo } from 'react'
import { Chess } from 'chess.js';
import '../App.css';

function Piece(props) {

    const unitStart = 'calc(var(--unit) * ';

    let trans = {
        transform: 'translate(' + unitStart + (.1 * props.x) + '), ' + unitStart + (.1 * props.y) + '))',
        // filter: 'grayscale(100%)'
    }


    return(
        <div className={props.cName ? 'piece ' + props.cName : 'piece'}
        draggable={props.canMove ? "true" : "false"}
        onDragStart={(e) => {props.onDragStart(e, props.x, props.y)}}
        onDragEnter={props.onDragEnter}
        onDragLeave={props.onDragLeave}
        onDragOver={props.onDragOver}
        onDrop={(e) => {props.onDrop(e, props.x, props.y)}}
        // onDragEnd={(e) => {props.onDragEnd(e, props.x, props.y)}}
        // onmouse={(e) => {props.onDragEnd(e, props.x, props.y)}}
        onClick={(e) => {if(props.canMove) props.onClick(e, props.x, props.y)}}
        style={{...trans, ...props.pSize}}>
            <img className='no-drag'
                src={props.type}
                height='100%'
                width='100%'/>
        </div>
    );
}

export default Piece;