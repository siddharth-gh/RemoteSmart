import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["text", "image", "video"],
            required: true,
        },

        data: {
            type: String, // for text content
        },

        url: {
            type: String, // for image URL
        },

        originalUrl: {
            type: String, // for high-quality video URL
            trim: true,
            default: "",
        },

        originalSize: {
            type: Number,
            default: 0,
        },

        optimizedSize: {
            type: Number,
            default: 0,
        },

        isOptimized: {
            type: Boolean,
            default: false,
        },

        optimizedUrl: {
            type: String,
            trim: true,
            default: "",
        },

        audioOnlyUrl: {
            type: String,
            trim: true,
            default: "",
        },

        thumbnailUrl: {
            type: String,
            trim: true,
            default: "",
        },

        codec: {
            type: String,
            trim: true,
            default: "",
        },

        duration: {
            type: Number,
            default: 0,
        },

        audioOnlySize: {
            type: Number,
            default: 0,
        },

        isLowBandwidthOptimized: {
            type: Boolean,
            default: false,
        },

        order: {
            type: Number,
            required: true,
        },
    },
    { _id: false }
);

const adaptiveQuestionSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
            trim: true,
        },
        options: {
            type: [String],
            default: [],
            validate: {
                validator: (options) => options.length === 4,
                message: "Adaptive question must contain exactly 4 options",
            },
        },
        correctAnswer: {
            type: Number,
            required: true,
            min: 0,
            max: 3,
        },
        explanation: {
            type: String,
            trim: true,
            default: "",
        },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "medium",
        },
        concept: {
            type: String,
            trim: true,
            default: "Core concept",
        },
        learningObjective: {
            type: String,
            trim: true,
            default: "",
        },
        remediationHint: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { timestamps: false }
);

const lectureSchema = new mongoose.Schema(
    {
        moduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Module",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },
        videoJobId: {
            type: String,
            default: "",
        },

        order: {
            type: Number,
            required: true,
        },

        contents: [contentSchema],

        resources: [
            {
                title: {
                    type: String,
                    required: true,
                    trim: true,
                },
                url: {
                    type: String,
                    required: true,
                    trim: true,
                },
                type: {
                    type: String,
                    enum: ["pdf", "ppt", "pptx", "docx", "doc", "text", "file"],
                    default: "file",
                },
                originalFilename: {
                    type: String,
                    trim: true,
                    default: "",
                },
                extractedText: {
                    type: String,
                    trim: true,
                    default: "",
                },
                originalSize: {
                    type: Number,
                    default: 0,
                },
                optimizedSize: {
                    type: Number,
                    default: 0,
                },
                isOptimized: {
                    type: Boolean,
                    default: false,
                },
            },
        ],

        aiSummary: {
            status: {
                type: String,
                enum: ["idle", "processing", "ready", "failed"],
                default: "idle",
            },
            text: {
                type: String,
                trim: true,
                default: "",
            },
            keyPoints: {
                type: [String],
                default: [],
            },
            generatedAt: {
                type: Date,
                default: null,
            },
            error: {
                type: String,
                trim: true,
                default: "",
            },
        },

        aiQuestionBank: {
            status: {
                type: String,
                enum: ["idle", "processing", "ready", "failed"],
                default: "idle",
            },
            questions: {
                type: [adaptiveQuestionSchema],
                default: [],
            },
            generatedAt: {
                type: Date,
                default: null,
            },
            error: {
                type: String,
                trim: true,
                default: "",
            },
        },

        aiMcqs: {
            status: {
                type: String,
                enum: ["idle", "processing", "ready", "failed"],
                default: "idle",
            },
            questions: {
                type: [
                    {
                        question: {
                            type: String,
                            trim: true,
                            default: "",
                        },
                        options: {
                            type: [String],
                            default: [],
                        },
                        correctAnswer: {
                            type: Number,
                            default: 0,
                        },
                        explanation: {
                            type: String,
                            trim: true,
                            default: "",
                        },
                    },
                ],
                default: [],
            },
            generatedAt: {
                type: Date,
                default: null,
            },
            error: {
                type: String,
                trim: true,
                default: "",
            },
        },

        transcript: {
            status: {
                type: String,
                enum: ["idle", "processing", "ready", "failed"],
                default: "idle",
            },
            text: {
                type: String,
                trim: true,
                default: "",
            },
            source: {
                type: String,
                trim: true,
                default: "",
            },
            generatedAt: {
                type: Date,
                default: null,
            },
            error: {
                type: String,
                trim: true,
                default: "",
            },
        },
        videoJobId: {
            type: String,
            trim: true,
            default: "",
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Lecture = mongoose.model("Lecture", lectureSchema);

export default Lecture;
