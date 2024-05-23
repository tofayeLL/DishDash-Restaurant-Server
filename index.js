const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8mgufzz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const menuCollection = client.db("dishdashDb").collection("menu");
        const reviewCollection = client.db("dishdashDb").collection("reviews");
        const cartCollection = client.db("dishdashDb").collection("carts");
        // user collection
        const userCollection = client.db("dishdashDb").collection("users");





        // ---------jwt related apis--------//
        // create token
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token });
        })


        // MIDDLeware
        const verifyToken = async (req, res, next) => {
            console.log('inside verify token', req.headers.authorization);

            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'forbidden access' });
            }

            const token = req.headers.authorization.split(' ')[1];

            // verify token
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'forbidden access' });
                }

                req.decoded = decoded;
                next();
            });

        }




        // --------------users crud--------//
        // get method
        app.get('/users', verifyToken, async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })

        // post method
        app.post('/users', async (req, res) => {
            const user = req.body;
            // check when login with google if user exist or not
            // we can check 3 ways (1. email unique, 2. upsert 3. simple email query)
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'User Already Exist', insertedId: null })
            }
            const result = await userCollection.insertOne(user)
            res.send(result);
        })


        // PATCH FOR USERS ADMIN
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        })


        // DELETE method for  USER 
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query)
            res.send(result);

        })












        // MENU ReLAted APis
        // Get Many for All Menu
        app.get('/menu', async (req, res) => {
            const cursor = menuCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // Get Many for All Reviews
        app.get('/reviews', async (req, res) => {
            const cursor = reviewCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })


        // Add To Carts Data
        // get carts data
        app.get('/carts', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await cartCollection.find(query).toArray();
            res.send(result);
        })

        // DELETE 
        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        })

        // post cart data
        app.post('/carts', async (req, res) => {
            const cart = req.body;
            const result = await cartCollection.insertOne(cart);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('DishDash server running..');
})


app.listen(port, () => {
    console.log(`DishDash server is running at port:${port}`);
})