import React, { useState } from 'react'
import { Chess } from 'chess.js';
import '../App.css';

function Piece(props) {

    let trans = {
        transform: 'translate(' + props.x + 'px, ' + props.y + 'px)',
        // filter: 'grayscale(100%)'
    }

    return(
        <div className={props.cName ? 'piece ' + props.cName : 'piece'}
        draggable="true"
        onDragStart={(e) => {props.onDragStart(e, props.x, props.y)}}
        onDragEnter={props.onDragEnter}
        onDragLeave={props.onDragLeave}
        onDragOver={props.onDragOver}
        onDrop={(e) => {props.onDrop(e, props.x, props.y)}}
        // onDragEnd={(e) => {props.onDragEnd(e, props.x, props.y)}}
        // onmouse={(e) => {props.onDragEnd(e, props.x, props.y)}}
        onClick={(e) => {props.onClick(e, props.x, props.y)}}
        style={{...trans, ...props.pSize}}>
            <img className='no-drag'
                src={props.type}
                height='100%'
                width='100%'/>
        </div>
    );
}

export default Piece;