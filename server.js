// Requiring all dependencies
require('dotenv').config();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
//const { music } = require('./src/music.js');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/musicdetails', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Importing Schemas
const User = require('./src/backend/schemas/userModel');
const Like = require('./src/backend/schemas/likeModel');
//const Song = require('./src/backend/schemas/songModel.js');

// Middleware functions
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// // Save music details to the database
// async function saveSongToDatabase(song) {
//   try {
//     const songId = song.id.toString();
//     // Check if the song already exists in the database based on the id
//     const existingSong = await Song.findById(songId).exec();
//     if (existingSong) {
//       // If the song already exists, update all details
//       await Song.findByIdAndUpdate(songId, song);
//       console.log(`Song "${song.name}" updated in the database`);
//     } else {
//       // If the song does not exist, add it to the database
//       await Song.create(song);
//       console.log(`Song "${song.name}" added to the database`);
//     }
//   } catch (error) {
//     console.error(`Error saving song "${song.name}" to the database:`, error);
//   }
// }

// music.forEach(saveSongToDatabase);

// API functions
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  const newUser = new User({ name, email, password });
  newUser.save().then(() => {
      res.status(200).json({ message: 'Success' });
    })
    .catch((err) => {
      res.status(500).json({ message: err });
    });
});

app.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email }).exec();
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    if (user.password !== password) {
      res.status(401).json({ message: 'Incorrect password' });
      return;
    }
    res.status(200).json({ message: 'OK' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/like-song', async (req, res) => {
  const like = req.body.like;
  const songId = req.body.songId;
  const email = req.body.userId;
  try {
    const user = await User.findOne({ email: email }).exec();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = user._id;
    // Find the user's like document
    const userLike = await Like.findOne({ userId }).exec();
    if (like) {
      // If like is true, add the songId to the likedSongs array
      if (userLike) {
        if (!userLike.likedSongs.includes(songId)) {
          userLike.likedSongs.push(songId);
          await userLike.save();
        }
      } else {
        // If the user does not have a like document, create a new one
        const newLike = new Like({ userId, email, likedSongs: [songId] });
        await newLike.save();
      }
    } else {
      // If like is false, remove the songId from the likedSongs array
      if (userLike) {
        userLike.likedSongs.pull(songId);
        await userLike.save();
      }
    }
    res.status(200).end();
  } catch (err) {
    console.error('Error in /like-song route:', err);
    res.status(500).json({ message: err.message });
  }
});

app.get('/likedsong', async (req, res) => {
  try {
    const userEmail = req.query.userId;
    const user = await User.findOne({ email: userEmail }).exec();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = user._id;
    const userLike = await Like.findOne({ userId }).exec();

    if (!userLike || userLike.length === 0) {
      return res.status(404);
    }
    // Assuming your Like model has a field named 'likedSongs'
    const songs = userLike.likedSongs;
    return res.status(200).json({ songs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});