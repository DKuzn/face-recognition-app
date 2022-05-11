// server.js
//
// Copyright (C) 2021-2022  Дмитрий Кузнецов
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const express = require('express');
const axios = require('axios').default;
const bodyParser = require('body-parser');
const serveStatic = require('serve-static');


const app = express();

const PORT = process.env.PORT || 80

app.use(serveStatic("./build"));
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: false }))

app.get('/', (req, res) => {
    res.sendFile('./index.html', { root: './build' });
});

app.post('/features/', async (req, res) => {
    axios.post(process.env.FACE_RECOGNITION, req.body).then((response) => {
        res.send(response.data);
    }).catch((err) => {
        console.log(err);
        res.sendStatus(err.response.status);        
    });
});

app.get('/person/:id', async (req, res) => {
    axios.get(process.env.PERSON_INFO + req.params.id).then((response) => {
        res.send(response.data);
    }).catch((err) => {
        console.log(err);   
        res.sendStatus(err.response.status);      
    });
});

app.listen(PORT);
