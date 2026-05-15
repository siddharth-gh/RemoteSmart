import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        thumbnail: {
            type: String,
            default: "",
        },

        description: {
            type: String,
            trim: true,
        },

        category: {
            type: String,
            trim: true,
            default: "General",
        },

        level: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
            default: "beginner",
        },

        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        moduleIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Module",
            },
        ],

        liveSession: {
            isActive: {
                type: Boolean,
                default: false,
            },
            roomId: {
                type: String,
                trim: true,
                default: "",
            },
            startedAt: {
                type: Date,
                default: null,
            },
            startedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: null,
            },
            mode: {
                type: String,
                enum: ["webrtc", "videosdk"],
                default: "webrtc",
            },
        },
        ratings: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                rating: { type: Number, required: true, min: 1, max: 5 },
                review: { type: String, trim: true },
                createdAt: { type: Date, default: Date.now },
            },
        ],
        averageRating: {
            type: Number,
            default: 0,
        },
        totalDurationMinutes: {
            type: Number,
            default: 0,
        },
        scheduledSessions: [
            {
                title: { type: String, required: true },
                scheduledAt: { type: Date, required: true },
                duration: { type: Number, default: 60 }, // in minutes
                createdAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Course = mongoose.model("Course", courseSchema);

export default Course;
