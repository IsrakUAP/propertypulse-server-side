const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


//middleware

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8qysmqo.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();


    const propertyCollection = client.db("propertydb").collection("property");
    const reviewCollection = client.db("propertydb").collection("review");
    const wishlistCollection = client.db("propertydb").collection("wishlist");
    const submitOfferCollection = client.db("propertydb").collection("submitOffer");
    const userCollection = client.db("propertydb").collection("users");


    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })

    app.get('/property', async (req, res) => {
      const result = await propertyCollection.find().toArray();
      res.send(result);
    })

    app.get('/review', async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    })


    app.get('/wishlist', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await wishlistCollection.find(query).toArray();
      res.send(result);
    })




    app.post('/review', async (req, res) => {
      const newReview = req.body;
      const result = await reviewCollection.insertOne(newReview);
      res.send(result);
    })




    app.post('/wishlist', async (req, res) => {
      const newWishlist = req.body;
      const result = await wishlistCollection.insertOne(newWishlist);
      res.send(result);
    })

    app.delete('/wishlist/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishlistCollection.deleteOne(query);
      res.send(result);
    })




    app.post('/submitOffer', async (req, res) => {
      const newSubmitOffer = req.body;
      const result = await submitOfferCollection.insertOne(newSubmitOffer);
      res.send(result);
    })



    app.get('/submitOffer', async (req, res) => {
      const result = await submitOfferCollection.find().toArray();
      res.send(result);
    })




    app.delete('/review/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    })




    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existUser = await userCollection.findOne(query);
      if (existUser) {
        return res.send({ message: 'user exist', insertedId: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }



    const verifyAgent = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAgent = user?.role === 'agent';
      if (!isAgent) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }






    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })



    app.get('/users/admin/:email', verifyToken, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })



    app.get('/users/agent/:email', verifyToken, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const agent = false;
      if (user) {
        agent = user?.role === 'agent';
      }
      res.send({ agent });
    })







    app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })


    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const upadtedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(query, upadtedDoc);
      res.send(result);
    })


    app.patch('/users/agent/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const upadtedDoc = {
        $set: {
          role: 'agent'
        }
      }
      const result = await userCollection.updateOne(query, upadtedDoc);
      res.send(result);
    })

    app.patch('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const upadtedDoc = {
        $set: {
          role: 'fraud'
        }
      }
      const result = await userCollection.updateOne(query, upadtedDoc);
      res.send(result);
    })






    app.patch('/property/verify/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const upadtedDoc = {
        $set: {
          verificationStatus: 'verify'
        }
      }
      const result = await propertyCollection.updateOne(query, upadtedDoc);
      res.send(result);
    })


    app.patch('/property/reject/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const upadtedDoc = {
        $set: {
          verificationStatus: 'reject'
        }
      }
      const result = await propertyCollection.updateOne(query, upadtedDoc);
      res.send(result);
    })








    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/', (req, res) => {
  res.send('server is running')
})

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`)
})