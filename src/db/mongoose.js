const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true
})
.then(() => console.log('Connected to mongoDb database successfully...'))
.catch(() => console.log('Could not connect to database...'))




