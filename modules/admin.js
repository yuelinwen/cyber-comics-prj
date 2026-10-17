const express = require('express');
const router = express.Router();
//I use axios to fetch api in this project
const axios = require("axios");

const LATEST_TTL = 10 * 60 * 1000;  //re-fetch the latest page number every 10 minutes

let maxNum = 0;          //the latest page number, fetch it by num property in api
let maxNumFetchedAt = 0;
const viewCounts = new Map();   //page id -> how many times this page is visited

//get the latest page number, cached so we don't hit the api on every request
var getMaxNum = async () => {
    if (!maxNum || Date.now() - maxNumFetchedAt > LATEST_TTL) {
        let response = await axios.get('https://xkcd.com/info.0.json', { timeout: 5000 })
        maxNum = response.data.num
        maxNumFetchedAt = Date.now()
    }
    return maxNum
}

//previous page, next page, random page numbers
var getPrev = (num) => Math.max(num - 1, 1)
var getNext = (num) => Math.min(num + 1, maxNum)
var getRandom = () => Math.floor(Math.random() * maxNum) + 1

//GET route ‘/’, handle the main page route. Get the latest page num, then redirect it to the GET ‘/:id’ request route.
router.get('/', async (req, res, next) => {
    try {
        res.redirect(`/${await getMaxNum()}`);
    } catch (err) {
        next(err)
    }
});

//POST route ‘/’, this route is used to handle the POST request from my search form function, that form is used to allow user enter the comic page number and redirect to that page
router.post("/", (req, res) => {
    let id = parseInt(req.body.id, 10)
    res.redirect(isNaN(id) ? '/' : `/${id}`)
})

//GET route ‘/:id’, evaluate the request id first, then fetch api by using axios, and render the data to ejs views page
router.get('/:id', async (req, res, next) => {
    try {
        let id = Number(req.params.id)
        if (!/^\d+$/.test(req.params.id) || id <= 0 || id > await getMaxNum()) {
            return res.status(404).render('404')
        }

        let response
        try {
            response = await axios.get(`https://xkcd.com/${id}/info.0.json`, { timeout: 5000 })
        } catch (err) {
            //some comics don't exist on xkcd (e.g. #404)
            if (err.response && err.response.status === 404) {
                return res.status(404).render('404')
            }
            throw err
        }
        let data = response.data
        let transcript = (data.transcript || '').split('\n').filter(line => line.trim() !== '')

        viewCounts.set(id, (viewCounts.get(id) || 0) + 1)

        res.render('main', {
            data: data,
            transcript: transcript,
            count: viewCounts.get(id),
            maxNum: maxNum,
            prev: getPrev(id),
            next: getNext(id),
            random: getRandom()
        })
    } catch (err) {
        next(err)
    }
});

exports.routes = router;
