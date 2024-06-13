const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000


// middle ware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3aom8f0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//middleware own
const logger = (req, res, next) => {
    console.log('log info', req.method, req.url);
    next();
}

const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;
    // console.log('Token in the middleware:', token);
    if(!token){
        return req.status(401).send({message: 'unauthorized access'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
            return req.status(401).send({message: 'unauthorized access'})
        }
        req.user = decoded;
        next();
    })
    // next();
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('carDoctor').collection('services')
    const bookingCollection = client.db('carDoctor').collection('bookings')

    // auth related
    app.post('/jwt', (req, res) => {
        const user = req.body;
        console.log('User For Token', user);
    
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' });
    
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,  // change to true in production
            sameSite: 'none'
        }).send({ success: true });
    });

    app.post('/logout', async(req, res)=>{
        const user = req.body;
        console.log('logging out', user);
        res.clearCookie('token', {maxAge: 0}).send({success: true})

    })

    // services

    // send all services
    app.get('/services', async(req, res)=>{
        const cursor = serviceCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })

    // send one services specific by id
    app.get('/services/:id', async(req, res) =>{
        const id = req.params.id
        const query = {_id: new ObjectId(id)}

        const options = {
            projection: { title: 1, img: 1, price: 1, service_id: 1 },
          };

        const result = await serviceCollection.findOne(query, options)
        res.send(result)
    })


    // booking
    app.get('/bookings', logger, verifyToken, async(req, res) => {
        console.log(req.query.email);
        console.log('Token owner info', req.user);
        if(req.user.email !== req.query.email){
            return req.status(403).send({message: 'Forbidden'})
        }
        let query = {}
        if (req.query?.email){
            query = {email: req.query.email}
        }
        const result = await bookingCollection.find(query).toArray()
        res.send(result)
    })

    // post the booking of specific one
    app.post('/bookings', async(req, res)=>{
        const booking = req.body
        console.log(booking);
        const result = await bookingCollection.insertOne(booking);
        res.send(result);
    })

    // delete a booking by id
    app.delete('/bookings/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await bookingCollection.deleteOne(query)
        res.send(result)
    })

    // update 
    app.patch('/bookings/:id', async(req, res)=>{
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)};
        const updatedBooking = req.body;
        console.log(updatedBooking);
        const updateDoc = {
            $set: {
                status: updatedBooking.status
            },
        };
        const result = await bookingCollection.updateOne(filter, updateDoc);
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





app.get('/', (req, res)=>{
    res.send('CAR DOCTOR SERVER IS RUNNING')
})

app.listen(port, () => {
    console.log(`CAR DOCTOR SERRVER IS RUNNING ON PORT : ${port}`);
})