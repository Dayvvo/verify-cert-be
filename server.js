const express = require('express');
const app = express();
const dotenv = require('dotenv');
//initialize dotenv to initialize environmental variables
dotenv.config()
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors')
// const bodyParser = require('body-parser')

const connectDB = async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://dayvvo:ope12345@cluster0.z44qpt2.mongodb.net/verify_cert?retryWrites=true&w=majority',
      {

        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false,

      }
    );

    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('error at connecting db', err.message);
    process.exit(1);
  }
};


connectDB()



app.use(cors({
  origin:['http://localhost:3000'],
  optionsSuccessStatus:200,  
}));


app.use(express.urlencoded({ extended: false }));

app.use(express.json())

app.all('/*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Routes
// app.use('/auth', require('./routes/authRoutes'));
app.use('/',require('./routes/'));



app.get('/inapp',function(req,res){
  res.sendFile(path.join(__dirname+'/in-app.html'));
  //__dirname : It will resolve to your project folder.
});


app.get('/', async(req, res) => {
  res.send(`Server started successfully`);
});



// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// ERROR HANDLERS
// Development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
    });
  });
}

// Producti
// on error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);

  console.log('error handled',err)

  res.render('error', {
    message: err.message,
    error: {},
  });
});

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

