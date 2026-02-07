import dotenv from "dotenv"
import app from "./app.js"


dotenv.config({
  path: ".env",
});


const port = process.env.PORT || 3000;


app.get('/', (req, res) => {
  res.send('Hello World!')
})


app.listen(port, () => {
    console.log(`Example of listening on part http://localhost:${port}`);
});