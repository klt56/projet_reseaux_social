const { v4: uuidv4 } = require('uuid');

const PostModel = require("../models/post.model");
const UserModel = require("../models/user.model");
const { uploadErrors } = require("../utils/errors.utils");
const ObjectID = require("mongoose").Types.ObjectId;
const fs = require("fs");
const { promisify } = require("util");
const pipeline = promisify(require("stream").pipeline);



module.exports.readPost = (req, res) => {
  PostModel.find((err, docs) => {
    if (!err) res.send(docs);
    else console.log("Error to get data : " + err);
  }).sort({ createdAt: -1 });
};

module.exports.createPost = async (req, res) => {
  let fileName;

  if (req.file) {
    try {
      if (
        req.file.detectedMimeType !== "image/jpg" &&
        req.file.detectedMimeType !== "image/png" &&
        req.file.detectedMimeType !== "image/jpeg"
      )
        throw Error("Invalid file format");

      if (req.file.size > 500000) throw Error("File size too large");
    } catch (err) {
      const errors = uploadErrors(err);
      return res.status(400).json({ errors });
    }

    fileName = uuidv4() + '.jpg';


    try {
      await pipeline(
        req.file.stream,
        fs.createWriteStream(
          `${__dirname}/../client/public/uploads/posts/${fileName}`
        )
      );

      const newPost = new PostModel({
        posterId: req.body.posterId,
        message: req.body.message,
        picture: `/uploads/posts/${fileName}`,
        video: req.body.video,
        likers: [],
        comments: [],
      });

      const post = await newPost.save();
      return res.status(201).json(post);
    } catch (err) {
      return res.status(500).json({ message: "Failed to upload image" });
    }
  } else {
    const newPost = new PostModel({
      posterId: req.body.posterId,
      message: req.body.message,
      picture: "",
      video: req.body.video,
      likers: [],
      comments: [],
    });

    try {
      const post = await newPost.save();
      return res.status(201).json(post);
    } catch (err) {
      return res.status(400).send(err);
    }
  }
};


module.exports.updatePost = (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  const updatedRecord = {
    message: req.body.message,
  };

  PostModel.findByIdAndUpdate(
    req.params.id,
    { $set: updatedRecord },
    { new: true },
    (err, docs) => {
      if (!err) res.send(docs);
      else console.log("Update error : " + err);
    }
  );
};

module.exports.deletePost = (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  PostModel.findByIdAndRemove(req.params.id, (err, docs) => {
    if (!err) res.send(docs);
    else console.log("Delete error : " + err);
  });
};

module.exports.likePost = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  try {
    await PostModel.findByIdAndUpdate(
      req.params.id,
      {
        $addToSet: { likers: req.body.id },
      },
      { new: true }
    );

    await UserModel.findByIdAndUpdate(
      req.body.id,
      {
        $addToSet: { likes: req.params.id },
      },
      { new: true }
    );

    const data = await PostModel.findById(req.params.id);
    res.send(data);
  } catch (err) {
    return res.status(500).send({ message: err });
  }
};

module.exports.unlikePost = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  try {
    await PostModel.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { likers: req.body.id },
      },
      { new: true }
    );

    await UserModel.findByIdAndUpdate(
      req.body.id,
      {
        $pull: { likes: req.params.id },
      },
      { new: true }
    );

    const data = await PostModel.findById(req.params.id);
    res.send(data);
  } catch (err) {
    return res.status(500).send({ message: err });
  }
};


module.exports.commentPost = (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  try {
    return PostModel.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            commenterId: req.body.commenterId,
            commenterPseudo: req.body.commenterPseudo,
            text: req.body.text,
            timestamp: new Date().getTime(),
          },
        },
      },
      { new: true })
            .then((data) => res.send(data))
            .catch((err) => res.status(500).send({ message: err }));
    } catch (err) {
        return res.status(400).send(err);
    }
};

module.exports.editCommentPost = (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  try {
    return PostModel.findById(req.params.id, (err, docs) => {
      const theComment = docs.comments.find((comment) =>
        comment._id.equals(req.body.commentId)
      );

      if (!theComment) return res.status(404).send("Comment not found");
      theComment.text = req.body.text;

      return docs.save((err) => {
        if (!err) return res.status(200).send(docs);
        return res.status(500).send(err);
      });
    });
  } catch (err) {
    return res.status(400).send(err);
  }
};

module.exports.deleteCommentPost = (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  try {
    return PostModel.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          comments: {
            _id: req.body.commentId,
          },
        },
      },
      { new: true })
            .then((data) => res.send(data))
            .catch((err) => res.status(500).send({ message: err }));
    } catch (err) {
        return res.status(400).send(err);
    }
};
