import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Team name is required'],
        trim: true,
        maxlength: [30, 'Team name cannot exceed 30 characters'],
    },
    inviteCode: {
        type: String,
        unique: true,
        required: true,
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

TeamSchema.index({ captain: 1 });
TeamSchema.index({ members: 1 });
TeamSchema.index({ inviteCode: 1 });

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);
