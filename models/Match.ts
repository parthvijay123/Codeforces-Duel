import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema({
    player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    playerHandle: {
        type: String,
        required: true,
    },
    opponent: {
        type: String,
        required: true,
    },
    opponentRating: {
        type: Number,
        required: true,
    },
    problem: {
        name: { type: String, required: true },
        rating: { type: Number, default: 0 },
        tags: [String],
        url: { type: String },
        index: { type: String },
        contestId: { type: Number },
    },
    result: {
        type: String,
        enum: ['WIN', 'LOSS', 'DRAW'],
        required: true,
    },
    ratingBefore: {
        type: Number,
        required: true,
    },
    ratingAfter: {
        type: Number,
        required: true,
    },
    ratingChange: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
});

// Compound index for efficient user history queries
MatchSchema.index({ player: 1, createdAt: -1 });

export default mongoose.models.Match || mongoose.model('Match', MatchSchema);
