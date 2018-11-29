'use strict'

let views = {}

views.index = (req, res) => {
    res.render('index', {
        title : `Home | ${req.app.locals.company}`,
        view: 'index'
    })
}

let resolveView = (req, res, next) => {
    if (views[req.path.replace('/', '')]) {
        views[req.path.replace('/', '')](req, res)
    }
    else {
        next()
    }
}

exports.index = views.index
exports.resolveView = resolveView
