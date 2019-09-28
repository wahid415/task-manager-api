const express = require('express');
const app = express();
require('./db/mongoose'); // just to run the database connection code to connect with database

const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const port = process.env.PORT

app.use(express.json()); //configured express to convert(parse) the incoming json data of body into object to use it
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => console.log(`Application listening on port ${port}`));
