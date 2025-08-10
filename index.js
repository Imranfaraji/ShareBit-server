require('dotenv').config()
const express = require('express')
const admin = require("firebase-admin");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors=require('cors')
const app = express()
const port = 3000

// middleware

app.use(cors())
app.use(express.json())


const decoded=Buffer.from(process.env.FB_SERVICE_KEY,'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// jwt verify middleware

const verifyToken=async(req,res,next)=>{
  const authorize=req.headers.authorization
  if(!authorize || !authorize.startsWith('Bearer')){
    return res.status(401).send({message:"Unauthorize access"})
  }
  const token=authorize.split(' ')[1]
  try{
    const decoded=await admin.auth().verifyIdToken(token)
    req.decoded=decoded
    next()
  }catch(error){
    return res.status(401).send({message:"Unauthorize access"})

  }
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pztqlyl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    
    

    
    const foodsCollection=client.db('foodShareCollection').collection('foods')
    const requestCollections=client.db('foodShareCollection').collection('myRequestFood')
    const reviewsCollections=client.db('foodShareCollection').collection('reviews')
    const blogsCollections=client.db('foodShareCollection').collection('blogs')

    app.get('/featuredFoods', async(req,res)=>{
         const query={
          status:"available"
         }

         const result=await foodsCollection.find(query).sort({quantity:-1}).limit(8).toArray()
         res.send(result)
    })

    app.get('/foods', async(req,res)=>{
       const query={
          status:"available"
         }
         const result=await foodsCollection.find(query).sort({expiredDate:-1}).toArray()
         res.send(result)
    })

    app.get('/foods/:id', async(req,res)=>{
      const id=req.params.id;
      const query={_id: new ObjectId(id)}
      const result=await foodsCollection.findOne(query)
      res.send(result)
    })

    app.get('/myrequest',verifyToken, async(req,res)=>{
      const email= req.query.email

      if(email !== req.decoded.email){
        return res.status(403).send({message:"Forbidden"})
      }
      const query={userEmail:email}
      const result=await requestCollections.find(query).toArray()
      res.send(result)
    })

    app.get('/mypostedfoods',verifyToken, async(req,res)=>{
      const email=req.query.email
      if(email !== req.decoded.email){
        return res.status(403).send({message:"Forbidden"})
      }
      const query={
        email:email
      }

      const result=await foodsCollection.find(query).toArray()
      res.send(result)
    })


    // reviews get api

    app.get('/reviews', async(req,res)=>{
      const result= await reviewsCollections.find().toArray()
      res.send(result)
    })

    // blog api

    app.get('/blogs', async(req,res)=>{
      const result=await blogsCollections.find().toArray()
      res.send(result)
    })


    app.get('/blogs/:id', async(req,res)=>{
      const id=req.params.id;
      const query={_id: new ObjectId(id)}
      const result=await blogsCollections.findOne(query)
      res.send(result)
    })


    app.post('/foods', async(req,res)=>{
      const newFood=req.body;
      const result=await foodsCollection.insertOne(newFood)
      res.send(result)
    })

    app.post('/myrequest', async(req,res)=>{
      const newRequest=req.body
      const result=await requestCollections.insertOne(newRequest)
      res.send(result)
    })

    app.patch('/foods/:id', async(req,res)=>{
      const id=req.params.id;
      const {status}=req.body
      const result= await foodsCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set:{status}}
      )
      res.send(result)
    })

    app.put('/foods/:id', async(req,res)=>{
      const id=req.params.id
      const filter={_id: new ObjectId(id)}
      const newUpdate=req.body
      const updatedDoc={
        $set:newUpdate
      }

      const option={upsert:true}

      const result=await foodsCollection.updateOne(filter,updatedDoc,option)
      res.send(result)
    })

    app.delete('/foods/:id', async(req,res)=>{
      const id=req.params.id;
      const query= {_id: new ObjectId(id)}
      const result= await foodsCollection.deleteOne(query)
      res.send(result)
    })
    
    
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Foods sharing server runnig!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
