require('dotenv').config()
const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors=require('cors')
const app = express()
const port = 3000

// middleware

app.use(cors())
app.use(express.json())


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

    app.get('/featuredFoods', async(req,res)=>{
         const query={
          status:"available"
         }

         const result=await foodsCollection.find(query).sort({quantity:-1}).limit(6).toArray()
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

    app.get('/myrequest', async(req,res)=>{
      const email= req.query.email
      const query={userEmail:email}
      const result=await requestCollections.find(query).toArray()
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
      const status=req.body
      const result= await foodsCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set:{status:status}}
      )
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
