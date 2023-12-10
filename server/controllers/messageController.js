const Messages = require("../models/messageModel");
const jwt = require("jsonwebtoken"); // Import JWT

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    // Verify JWT token from headers
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: Token not provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
      }

      const userId = decoded.userId;

      // Check if the user ID extracted from the token matches 'from' or 'to'
      if (userId !== from && userId !== to) {
        return res.status(403).json({ message: 'Forbidden: Access denied' });
      }

      const messages = await Messages.find({
        users: {
          $all: [from, to],
        },
      }).sort({ updatedAt: 1 });

      const projectedMessages = messages.map((msg) => {
        return {
          fromSelf: msg.sender.toString() === from,
          message: msg.message.text,
        };
      });
      res.json(projectedMessages);
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;

    // Verify JWT token from headers
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: Token not provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
      }

      const userId = decoded.userId;

      // Check if the user ID extracted from the token matches 'from'
      if (userId !== from) {
        return res.status(403).json({ message: 'Forbidden: Access denied' });
      }

      const data = await Messages.create({
        message: { text: message },
        users: [from, to],
        sender: from,
      });

      if (data) return res.json({ msg: "Message added successfully." });
      else return res.json({ msg: "Failed to add message to the database" });
    });
  } catch (ex) {
    next(ex);
  }
};
