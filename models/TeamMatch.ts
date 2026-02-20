import mongoose from 'mongoose';

const TeamMatchSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true,
        index: true,
    },
    teamName: {
        type: String,
        required: true,
    },
    opponentTeamName: {
        type: String,
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
    members: [String], // CF handles of members who played
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
});

TeamMatchSchema.index({ team: 1, createdAt: -1 });

export default mongoose.models.TeamMatch || mongoose.model('TeamMatch', TeamMatchSchema);
