'use strict'

let fs = require('fs')
let path = require('path')
let fileRoot = '../datasets'

const success = {
    statusCode: 200,
    message: 'success'
}

const error = {
    statusCode: 500,
    message: 'error'
}

let handleHtml = (req, res) => {
    res.redirect(req.path.replace('.html', ''))
}

let getStates = (req, res) => {
    let filePath = path.join(fileRoot, 'states.json')
    let states = require(filePath)

    res.send(states)
}

let getState = (req, res) => {
    let filePath = path.join(fileRoot, 'kaduna-state.json')
    let state = require(filePath)

    res.send(state)
}

// TODO: Change this to use dataset with all states when coming out of demo mode
let getLGAs = (req, res) => {
    let filePath = path.join(fileRoot, 'kaduna-boundary-lgas.json')
    let LGAs = require(filePath)

    let state = req.query.state

    let fLGAs = LGAs.features.filter(l => {
        if (l.properties.state_name == state) {
            return l
        }
    })

    res.send(fLGAs)
}

let getSettlements = (req, res) => {
    let filePath = path.join(fileRoot, 'kaduna-small-settlement-areas.json')
    let settlements = require(filePath)

    let state = req.query.state
    let lga = req.query.lga
    console.log('LGA:', lga, '\nState:', state)

    let fSettlements = settlements.features.filter(s => {
        if ((s.properties.lga_name == lga || !lga) && s.properties.state_name == state) {
            return s
        }
    })
    
    res.send(fSettlements)
}

exports.handleHtml = handleHtml
exports.getLGAs = getLGAs
exports.getState = getState
exports.getStates = getStates
exports.getSettlements = getSettlements