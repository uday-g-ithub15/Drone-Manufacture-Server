const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
app.use(cors())
app.use(express.json())
require('dotenv').config()
const jwt = require('jsonwebtoken')

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jb74a.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJwt = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) {
        return res.status(401).send({ message: 'unauthorized' })
    }
    const token = auth.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden' })
        }
        req.decoded = decoded;
        next()
    })
}

const run = async () => {
    try {
        await client.connect()
        const partsCollection = client.db(`dronemanufacture`).collection('parts');
        const partsOrders = client.db(`dronemanufacture`).collection('orders');
        const userCollection = client.db(`dronemanufacture`).collection('users');

        //Load all parts
        app.get('/parts', async (req, res) => {
            const query = {};
            const cursor = partsCollection.find(query)
            const parts = await cursor.toArray()
            res.send(parts)
        })
        //Load single part
        app.get('/parts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const part = await partsCollection.findOne(query)
            res.send(part);
        })
        //Insert new order
        app.post('/orders', async (req, res) => {
            const product = req.body;
            const result = await partsOrders.insertOne(product);
            res.send(result)
        })
        //Load specific order
        app.get('/orders', verifyJwt, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            console.log(email, decodedEmail);
            if (email === decodedEmail) {
                const query = { email }
                const result = await partsOrders.find(query).toArray();
                return res.send(result)
            }
            else {
                return res.status(403).send({ message: 'Forbidden' })
            }
        })

        //Update stock quantity
        app.put('/parts/:id', async (req, res) => {
            const id = req.params.id;
            const stock = req.body.newStock;
            const quantity = req.body.userQuantity;
            const available = stock - quantity;
            const query = { _id: ObjectId(id) }
            const updateDoc = {
                $set: { available }
            }
            const result = await partsCollection.updateOne(query, updateDoc)
            res.send(result)
        })
        //Delete an item
        app.delete('/parts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await partsOrders.deleteOne(query);
            res.send(result);
        })
        //Store user
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            const userInfo = req.body;
            const filter = { email }
            const options = { upsert: true }
            const updateDoc = {
                $set:
                    userInfo

            }
            const result = await userCollection.updateOne(filter, updateDoc, options)
            const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '10hr' })
            res.send({ result, token })
        })
        //Load all users
        app.get('/users', verifyJwt, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users)
        })
        //Make admin
        app.put('/users/admin/:email', verifyJwt, async (req, res) => {
            const email = req.params.email;
            const decodedEmail = req?.decoded?.email;
            const requester = await userCollection.findOne({ email: decodedEmail })
            if (requester.userRole === 'ADMIN') {
                const filter = { email }
                const updateDoc = {
                    $set:
                        { userRole: 'ADMIN' }

                }
                const result = await userCollection.updateOne(filter, updateDoc)
                res.send(result)
            }
            else {
                return res.status(403).send({ message: 'Forbidden' })
            }
        })
        //Checking an user is admin or not
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email })
            const isAdmin = user.userRole === 'ADMIN';
            res.send({ ADMIN: isAdmin })
        })
        //Add new products
        app.post('/parts', async (req, res) => {
            const part = req.body;
            const result = await partsCollection.insertOne(part)
            res.send(result)
            console.log(doc);
        })
        //Delete Product
        app.delete('/part/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = partsCollection.deleteOne(query)
            res.send(result)
        })

    }
    finally {

    }
}
run().catch(console.dir)

app.get('/', async (req, res) => {
    res.send('Welcome')
})
app.listen(port, () => {
    console.log('Listening from port : ', port);
})

