'use strict'

let path = require('path')

let express = require('express')
let stylus = require('stylus')
let nib = require('nib')
let bodyParser = require('body-parser')
let favicon = require('serve-favicon')
let multer = require('multer')
let ms = require('ms')

let routes = require('./app/routes')
let views = require('./app/views')

let maxSize = 10485760
let app = express()
let storage = multer.memoryStorage()
let limits = {
    fileSize: maxSize
}
let multerOpts = {
    storage: storage,
    limits: limits
}
let upload = multer(multerOpts)

let compile = (str, _path) => {
    return stylus(str).set('filename', _path).use(nib());
}

app.set('homedir', __dirname)
app.set('port', process.env.PORT || 3000)
app.set('views', __dirname + '/public/views/pug')
app.set('view engine', 'pug')
app.set('company', 'Team Arrow')
app.set('handle', 'teamarrow')
app.set('year', new Date().getFullYear())
app.set('designer person', 'Michael Ogezi')
app.set('designer company', 'Makerloom Software Ltd.')
app.set('designer person site', 'https://github.com/okibeogezi')
app.set('designer company site', 'https://makerloom.com/software')
app.set('phone', '0903 409 9658')
app.set('phone_href', '+2349034099658')
app.set('addr_one', 'Unijos, Bauchi Road, Jos')
app.set('addr_two', 'Plateau, Nigeria')
app.set('email', 'okibeogezi@gmail.com')
app.set('founder', 'Team Arrow')
app.set('facebook share', 'https://facebook.com/sharer/sharer.php?u=')
app.set('google share', 'https://plus.google.com/share?url=')
app.set('twitter share', 'https://twitter.com/home?status=')

app.use(express.static(path.join(__dirname + '/public')))
app.use(bodyParser.json())
// app.use(favicon(path.join(__dirname, '/public/images/logo.ico')))
app.use(stylus.middleware({
    src: path.join(__dirname, '/public'),
    compile: compile
}))
app.use(bodyParser.urlencoded({
    extended: false
}))

app.locals.company = app.get('company')
app.locals.handle = app.get('handle')
app.locals.year = app.get('year')
app.locals.designerPerson = app.get('designer person')
app.locals.designerCompany = app.get('designer company')
app.locals.designerPersonSite = app.get('designer person site')
app.locals.designerCompanySite = app.get('designer company site')
app.locals.phone = app.get('phone')
app.locals.phoneHref = app.get('phone_href')
app.locals.addrOne = app.get('addr_one')
app.locals.addrTwo = app.get('addr_two')
app.locals.email = app.get('email')
app.locals.founder = app.get('founder')
app.locals.facebookShare = app.get('facebook share')
app.locals.twitterShare = app.get('twitter share')
app.locals.googleShare = app.get('google share')
app.locals.rootUrl = `http://localhost:/${app.get('port')}`

app.get('/*.html', routes.handleHtml)
app.get('/getState', routes.getState)
app.get('/getStates', routes.getStates)
app.get('/getLGAs', routes.getLGAs)
app.get('/getSettlements', routes.getSettlements)
app.get('/', views.index)
app.get('/:view', views.resolveView)


app.locals.pretty = true

app.listen(app.get('port'), () => {
    console.log(`Listening or port ${app.get('port')}`)
})
