/**
 * Copyright (c) 2021 Дмитрий Кузнецов
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const express = require('express');
const axios = require('axios').default;


const app = express();

const PORT = process.env.PORT || 80

app.use(express.static("./build"));
app.use(express.json());

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
