import React, { useState } from "react";

function GameInfo(props) {

    const length = 250;

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

    let whiteEvalBar = {
        width: .1 * whiteEvalLength + 'vmin',
    }
    let blackEvalBar = {
        width: .1 * blackEvalLength + 'vmin',
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
        width: .1 * whiteChanceLength + 'vmin',
    }
    let drawChanceBar = {
        width: .1 * drawChanceLength + 'vmin',
    }
    let blackChanceBar = {
        width: .1 * blackChanceLength + 'vmin',
    }
    let whiteChanceBar2 = {
        width: .1 * whiteChanceLength + 'vmin',
        color: '#000f'
    }
    let drawChanceBar2 = {
        width: .1 * drawChanceLength + 'vmin',
        color: '#000f'
    }
    let blackChanceBar2 = {
        width: .1 * blackChanceLength + 'vmin',
        color: '#ffff'
    }

    return (
        <div className="game-info"
        style={{...props.size}}>
            <div className="game-player-info">
                <h3>{props.whitePlayer + ' - ' + props.blackPlayer}</h3>
            </div>
            <div className="game-eval-info">
                <h4 className="bar-label">{'Eval (depth ' + props.depth + ')'}</h4>
                <div className="eval-bar-container">
                    <div className="eval-bar white-eval-bar" style={{...whiteEvalBar}}><b>{props.eval >= 0 ? props.eval.toFixed(2) : ''}</b></div>
                    <div className="eval-bar black-eval-bar" style={{...blackEvalBar}}><b>{props.eval < 0 ? props.eval.toFixed(2) : ''}</b></div>
                </div>
                <h4 className="bar-label">Predictions</h4>
                <div className="prediction-bar-container">
                    <div className="prediction-bar white-bar" style={most == 'white' ? {...whiteChanceBar2} : {...whiteChanceBar}}><b>{Math.round(props.whiteChance * 100) + '%'}</b></div>
                    <div className="prediction-bar gray-bar" style={most == 'draw' ? {...drawChanceBar2} : {...drawChanceBar}}><b>{Math.round(props.drawChance * 100) + '%'}</b></div>
                    <div className="prediction-bar black-bar" style={most == 'black' ? {...blackChanceBar2} : {...blackChanceBar}}><b>{Math.round(props.blackChance * 100) + '%'}</b></div>
                </div>
            </div>
        </div>
    )
}

export default GameInfo;