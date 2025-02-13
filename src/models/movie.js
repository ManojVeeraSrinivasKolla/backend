// const mongoose = require("mongoose");
// const { Schema } = mongoose;

// const { genreData } = require("../utils/data");

// const MovieSchema = new Schema(
//   {
//     title: {
//       type: String,
//       trim: true,
//       required: true,
//     },
//     storyLine: {
//       type: String,
//       trim: true,
//       required: true,
//     },
//     director: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Actor",
//     },
//     releaseDate: {
//       type: Date,
//       required: true,
//     },
//     status: {
//       type: String,
//       required: true,
//       enum: ["public", "private"], // if public , display to public otherwise only admin
//     },
//     type: {
//       type: String,
//       required: true,
//     },
//     genres: {
//       type: [String],
//       required: true,
//       enum: genreData,
//     },
//     tags: {
//       type: [String],
//       required: true,
//     },
//     cast: [
//       {
//         actor: { type: mongoose.Schema.Types.ObjectId, ref: "Actor" },
//         roleAs: String,
//         leadActor: Boolean,
//       },
//     ],
//     writers: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Actor",
//       },
//     ],
//     poster: {
//       type: Object,
//       url: { type: String, required: true },
//       public_id: { type: String, required: true },
//       responsiveImages: [URL],
//     },
//     trailer: {
//       type: Object,
//       url: { type: String, required: true },
//       public_id: { type: String, required: true },
//       required: true,
//     },
//     reviews: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Review",
//       },
//     ],
//     language: {
//       type: String,
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// // MovieSchema.index({ title: "text" });
// MovieSchema.index({ title: "text", storyLine: "text" }, { default_language: "none" });


// const Movie = mongoose.model("Movie", MovieSchema);
// module.exports = Movie;
const mongoose = require("mongoose");
const { Schema } = mongoose;
const { genreData } = require("../utils/data");

const MovieSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    storyLine: {
      type: String,
      trim: true,
      required: true,
    },
    director: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Actor",
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["public", "private"],
    },
    type: {
      type: String,
      required: true,
    },
    genres: {
      type: [String],
      required: true,
      enum: genreData,
    },
    tags: {
      type: [String],
      required: true,
    },
    cast: [
      {
        actor: { type: mongoose.Schema.Types.ObjectId, ref: "Actor" },
        roleAs: String,
        leadActor: Boolean,
      },
    ],
    writers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Actor",
      },
    ],
    poster: {
      type: Object,
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      responsiveImages: [URL],
    },
    trailer: {
      type: Object,
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      required: true,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    language: {
      type: String,
      required: true,
      // You can set a default if you want:
      // default: "multilingual"
    },
  },
  { timestamps: true }
);

// Update the index to ignore the "language" field for text search
// MovieSchema.index(
//   { title: "text", storyLine: "text" },
//   { default_language: "none", language_override: "dummy" }
// );
// Updated text index: ignore the "language" field from documents by overriding it with "dummy"
// MovieSchema.index(
//   { title: "text", storyLine: "text" },
//   { default_language: "none", language_override: "dummy" }
// );
MovieSchema.index(
  { title: "text", storyLine: "text" },
  { default_language: "none", language_override: "dummy" }
);


const Movie = mongoose.model("Movie", MovieSchema);
module.exports = Movie;
