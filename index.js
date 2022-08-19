require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const dns = require('dns');

//url
const validUrl = require("valid-url");
const urlExists = require("url-exists");
const isValidHostname = require('is-valid-host');
const shortUrl = require("node-url-shortener");

//setup mongoose (database)
const mySecret = process.env['MONGO_URI'];

//create a model
const linkSchema = new mongoose.Schema({
  originalUrl: {type: String, required: true},
  shortUrl: {type: Number, default:0}
});
const User = mongoose.model("User", linkSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(mySecret, 
{
  useNewUrlParser: true,
  useUnifiedTopology: true
}, (err) => {
  if (err) return console.log(err);
  console.log("DB connected");
});
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(require('body-parser').urlencoded({extended:false}))

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


app.post("/api/shorturl", (req,res) => {
  var original_url = req.body.url;
  const regex = /^http(s?)?/i;
  var short_url;
  var count;
  console.log(req.body)
  console.log(original_url);

  if(original_url.match(regex)){
    const hostCheck = new URL(original_url);
    console.log(hostCheck);
    dns.lookup(hostCheck.host, (err, address, family) => {
      if(err){
        res.json({error: 'Invalid URL'});
      }
      else{
        const urlFinder = User.findOne({original:original_url}, async (err,foundUrl) => {
          if(err) res.json('error');
          else if(urlFinder === true)
          {
            res.json({foundUrl})
          }
          else{
                short_url = Math.floor(Math.random()*100);
                await User.create({originalUrl: original_url, shortUrl: short_url});
              res.json({original_url,short_url});
              
          }
        })
      }
    });
  }
  else res.json({error: 'Invalid URL'});
});

app.get('/api/shorturl/:short_url', (req, res) => {
  //must declare params else cannot find originalUrl
  short_url = req.params.short_url;
  const docs = User.findOne({ shortUrl: short_url }, (err,foundUser) => {
    if(err) console.log(err)
    else res.redirect(foundUser.originalUrl)
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});


module.exports = User;

module.exports = app;