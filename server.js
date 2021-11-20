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
    let response = await axios.post(process.env.FACE_RECOGNITION, req.body);
    res.send(response.data);
});

app.get('/person/:id', async (req, res) => {
    let response = await axios.get(process.env.PERSON_INFO + req.params.id);
    res.send(response.data);
});

app.listen(PORT);
