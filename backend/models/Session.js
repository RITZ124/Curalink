const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: {
    publications: [{ type: mongoose.Schema.Types.Mixed }],
    clinicalTrials: [{ type: mongoose.Schema.Types.Mixed }],
    queryExpanded: String,
    retrievalStats: mongoose.Schema.Types.Mixed
  }
});

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userContext: {
    patientName: String,
    disease: String,
    location: String,
    additionalContext: String
  },
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

SessionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Session', SessionSchema);
