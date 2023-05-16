process.stdin.setEncoding("utf8");
const path = require("path");
const express = require("express"); /* Accessing express module */
const app = express();
const fs = require('fs');
const statusCode = 200;
const portNumber = 4000;

app.listen(portNumber);
console.log(`Web server started and running at http://localhost:${portNumber}`);

const prompt = "Stop to shutdown the server: ";

process.stdout.write(prompt);
process.stdin.on("readable", function () {
    let dataInput = process.stdin.read();
    if (dataInput !== null) {
      let command = dataInput.trim();
      if (command === "stop") {
        process.exit(0);
      }
      else {
        process.stdout.write("Invalid command: " + command + "\n");
      }
      process.stdout.write(prompt);
      process.stdin.resume();
    }
});


require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') }) 

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

 /* Our database and collection */
 const databaseAndCollection = {db: "CMSC335_DB", collection:"final"};

 const { MongoClient, ServerApiVersion } = require('mongodb');

 const uri = `mongodb+srv://${userName}:${password}@cluster0.hcngmbw.mongodb.net/?retryWrites=true&w=majority`;
 const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const { response } = require("express");
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.get("/", (request, response) => {
    response.render("index");
});

app.get("/add", (request, response) => {
    response.render("add");
});

const bodyParser = require("body-parser"); /* To handle post parameters */
app.use(bodyParser.urlencoded({extended:false}));

app.post("/processAdd", (request, response) => {
    let {title, hour, minute, stars, review} = request.body;
    
    
    
    let movie = {title, hour, minute, stars, review};
    insertMovie(movie);

    response.render("processAdd", movie)
});

app.get("/review", (request, response) => {
    response.render("review");
});

app.post("/processReview", async (request, response) => {
    let {title} = request.body;
    let thisTitle = title;


    try {
        await client.connect();

        let filter = {title: thisTitle};
        const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .findOne(filter);
              

        if (result) {
            let title = result.title;
            let hour = result.hour;
            let minute = result.minute;
            let stars = result.stars;
            let review = result.review;
            await response.render("processAdd", {title, hour, minute, stars, review});
        } else {
            let title = "NONE";
            let hour = "NONE";
            let minute = "NONE"
            let stars = "NONE";
            let review = "NONE";
            await response.render("processAdd", {title, hour, minute, stars, review});
        }  
        
        

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
});

app.get("/runtime", (request, response) => {
    response.render("runtime");
});

app.get("/remove", (request, response) => {
    response.render("remove.ejs");
});

app.post("/processRuntime", async (request, response) => {
    let {hour, minute} = request.body;

    // let time = hour.minute;

    let runtime= hour+" hours, "+minute+" minutes";

    try {
        await client.connect();

        let filter = {hour : { $lt: hour}};

        const cursor = client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .find(filter);
        const result = await cursor.toArray();

        let table = "<table border='1'> <tr> <th>Title</th> <th>Hours</th> <th>Minutes</th></tr>"

        result.forEach(movie => {
            table+="<tr><td>"+movie.title+"</td><td>"+movie.hour+"</td><td>"+movie.minute+"</td></tr>"
        });
        table+="<br></table>";

        await response.render("processRuntime", {table, hour});

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
});

app.post("/processRemove", async (request, response) => {

    try {
        await client.connect();
        
        const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});
        let size = result.deletedCount;

        await response.render("processRemove", {size});
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

});

async function insertMovie(newMovie) {
    try {
        await client.connect();

        await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newMovie);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
    
}
