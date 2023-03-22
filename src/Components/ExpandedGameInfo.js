import React, { useState } from "react";

function ExpandedGameInfo(props) {

    const length = 384;

    const clampedEval = props.eval > 4.0 ? 4.0 : props.eval < -4.0 ? -4.0 : props.eval;
    // const clampedEval = 2.5;
    const whiteEvalLength = length * (clampedEval + 4) / 8;
    const blackEvalLength = length * (-clampedEval + 4) / 8;

    const whiteChanceLength = props.whiteChance * length;
    const drawChanceLength = props.drawChance * length;
    const blackChanceLength =props.blackChance * length;
    // const whiteChanceLength = .6 * length;
    // const drawChanceLength = .35 * length;
    // const blackChanceLength = .05 * length;

    const unitStart = 'calc(var(--unit) * ';

    let whiteEvalBar = {
        height: unitStart + (whiteEvalLength/10) + ')',
    }
    let blackEvalBar = {
        height: unitStart + (blackEvalLength/10) + ')',
    }

    var most = 'draw'
    if (props.drawChance > props.whiteChance && props.drawChance > props.blackChance) {
        most = 'draw'
    } else if (props.whiteChance >= props.drawChance && props.whiteChance >= props.blackChance) {
        most = 'white'
    } else if (props.blackChance > props.drawChance && props.blackChance > props.whiteChance) {
        most = 'black'
    }

    let whiteChanceBar = {
        height: unitStart + (whiteChanceLength/10) + ')',
    }
    let drawChanceBar = {
        height: unitStart + (drawChanceLength/10) + ')',
    }
    let blackChanceBar = {
        height: unitStart + (blackChanceLength/10) + ')',
    }
    let whiteChanceBar2 = {
        height: unitStart + (whiteChanceLength/10) + ')',
        color: '#000f'
    }
    let drawChanceBar2 = {
        height: unitStart + (drawChanceLength/10) + ')',
        color: '#000f'
    }
    let blackChanceBar2 = {
        height: unitStart + (blackChanceLength/10) + ')',
        color: '#ffff'
    }

    return (
        <div className='expanded-board-stuff'>
            <div className='player-info black-player'>
                <h2 className='player'>{props.blackPlayer}</h2>
                <h2 className='clock'>{props.blackClock}</h2>
            </div>
            <div className='player-info white-player'>
                <h2 className='player'>{props.whitePlayer}</h2>
                <h2 className='clock'>{props.whiteClock}</h2>
            </div>
            <div className='vert-eval-bar-container'>
                <div className="vert-eval-bar black-eval-bar" style={{...blackEvalBar}}><b>{props.eval < 0 ? props.eval.toFixed(2) : ''}</b></div>
                <div className="vert-eval-bar white-eval-bar" style={{...whiteEvalBar}}><b>{props.eval >= 0 ? props.eval.toFixed(2) : ''}</b></div>
            </div>
            <div className='vert-prediction-bar-container'>
                <div className="vert-prediction-bar black-bar" style={most == 'black' ? {...blackChanceBar2} : {...blackChanceBar}}><b>{Math.round(props.blackChance * 100) + '%'}</b></div>
                <div className="vert-prediction-bar gray-bar" style={most == 'draw' ? {...drawChanceBar2} : {...drawChanceBar}}><b>{Math.round(props.drawChance * 100) + '%'}</b></div>
                <div className="vert-prediction-bar white-bar" style={most == 'white' ? {...whiteChanceBar2} : {...whiteChanceBar}}><b>{Math.round(props.whiteChance * 100) + '%'}</b></div>
            </div>
        </div>
    )
}

export default ExpandedGameInfo;