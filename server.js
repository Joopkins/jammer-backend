var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var JAMS_COLLECTION = "jams";

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

// JAMS API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

/*  "/contacts"
 *    GET: finds all contacts
 *    POST: creates a new contact
 */

app.get("/jams", function(req, res) {
    db.collection(JAMS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get jams.");
    } else {
      res.status(200).json(docs);
    }
  });

});

app.post("/jams", function(req, res) {
  var newJam = req.body;
  newJam.createDate = new Date();

  if (!(req.body.jamName)) {
    handleError(res, "Invalid user input", "Must provide name.", 400);
  }

  db.collection(JAMS_COLLECTION).insertOne(newJam, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to create new jam.");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});

/*  "/contacts/:id"
 *    GET: find contact by id
 *    PUT: update contact by id
 *    DELETE: deletes contact by id
 */

app.get("/jams/:id", function(req, res) {
  db.collection(JAMS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get jam");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put("/jams/:id", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc._id;

  db.collection(JAMS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update jam");
    } else {
      res.status(204).end();
    }
  });
});

app.delete("/jams/:id", function(req, res) {
    db.collection(JAMS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete jam");
    } else {
      res.status(204).end();
    }
  });
});



