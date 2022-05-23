const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
app.use(cors())
app.use(express.json())

app.get('/', async (req, res) => {
    res.send('Welcome')
})
app.listen(port, () => {
    console.log('Listening from port : ', port);
})

