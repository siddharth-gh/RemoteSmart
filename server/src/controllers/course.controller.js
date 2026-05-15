import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import Lecture from "../models/lecture.model.js";
import Module from "../models/module.model.js";
import Progress from "../models/progress.model.js";
import Quiz from "../models/quiz.model.js";
import QuizAttempt from "../models/quizAttempt.model.js";
import Achievement from "../models/achievement.model.js";
import Note from "../models/note.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import crypto from "crypto";

// @desc Create Course
// @route POST /api/courses
export const createCourse = asyncHandler(async (req, res) => {
    const { title, description, category, level } = req.body;

    if (!title) {
        res.status(400);
        throw new Error("Title is required");
    }

    if (!description) {
        res.status(400);
        throw new Error("Description is required");
    }

    const course = await Course.create({
        title,
        description,
        category,
        level,
        thumbnail: req.body.thumbnail || "",
        teacherId: req.user._id,
    });

    res.status(201).json(course);
});

// @desc Get all courses
// @route GET /api/courses
export const getCourses = asyncHandler(async (req, res) => {
    const { search, category, level } = req.query;
    const query = {};

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];
    }

    if (category && category !== "all") {
        query.category = category;
    }

    if (level && level !== "all") {
        query.level = level;
    }

    const courses = await Course.find(query)
        .populate("teacherId", "name email")
        .sort({ updatedAt: -1 });
    res.json(courses);
});

export const getTeacherCourses = asyncHandler(async (req, res) => {
    const query =
        req.user.role === "admin" && req.query.teacherId
            ? { teacherId: req.query.teacherId }
            : { teacherId: req.user._id };

    const courses = await Course.find(query)
        .populate("teacherId", "name email")
        .sort({ updatedAt: -1 });

    res.json(courses);
});

// @desc Get single course
// @route GET /api/courses/:id
export const getCourseById = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id).populate(
        "teacherId",
        "name email"
    );

    if (!course) {
        res.status(404);
        throw new Error("Course not found");
    }

    res.json(course);
});

// @desc Update Course
// @route PUT /api/courses/:id
export const updateCourse = asyncHandler(async (req, res) => {
    const { title, description, category, level, thumbnail } = req.body;

    const course = await Course.findById(req.params.id);

    if (!course) {
        res.status(404);
        throw new Error("Course not found");
    }

    if (
        req.user.role !== "admin" &&
        course.teacherId.toString() !== req.user._id.toString()
    ) {
        res.status(403);
        throw new Error("Not authorized");
    }

    if (title) course.title = title;
    if (description) course.description = description;
    if (category) course.category = category;
    if (level) course.level = level;
    if (thumbnail !== undefined) course.thumbnail = thumbnail;

    await course.save();

    res.json(course);
});

// @desc Delete Course
// @route DELETE /api/courses/:id
export const deleteCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
        res.status(404);
        throw new Error("Course not found");
    }

    if (
        req.user.role !== "admin" &&
        course.teacherId.toString() !== req.user._id.toString()
    ) {
        res.status(403);
        throw new Error("Not authorized");
    }

    const modules = await Module.find({ courseId: course._id }).select("_id");
    const moduleIds = modules.map((moduleItem) => moduleItem._id);
    const lectures = await Lecture.find({ moduleId: { $in: moduleIds } }).select(
        "_id"
    );
    const lectureIds = lectures.map((lecture) => lecture._id);
    const quizzes = await Quiz.find({ courseId: course._id }).select("_id");
    const quizIds = quizzes.map((quiz) => quiz._id);

    await Enrollment.deleteMany({ courseId: course._id });
    await Progress.deleteMany({ courseId: course._id });
    await Progress.deleteMany({ lectureId: { $in: lectureIds } });
    await Lecture.deleteMany({ moduleId: { $in: moduleIds } });
    await QuizAttempt.deleteMany({ quizId: { $in: quizIds } });
    await Quiz.deleteMany({ courseId: course._id });
    await Achievement.deleteMany({ courseId: course._id });
    await Note.deleteMany({ courseId: course._id });
    await Module.deleteMany({ courseId: course._id });
    await course.deleteOne();

    res.json({ message: "Course deleted successfully" });
});

export const startCourseLiveSession = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
        res.status(404);
        throw new Error("Course not found");
    }

    if (
        req.user.role !== "admin" &&
        course.teacherId.toString() !== req.user._id.toString()
    ) {
        res.status(403);
        throw new Error("Not authorized to start this live session");
    }
    console.log("[Backend] /live/start called by", req.user.email, "with body:", req.body);

    const providedRoomId = req.body.roomId;

    course.liveSession = {
        isActive: true,
        roomId: providedRoomId || course.liveSession?.roomId || crypto.randomUUID(),
        startedAt: new Date(),
        startedBy: req.user._id,
        mode: providedRoomId ? "videosdk" : "webrtc",
    };

    console.log("[Backend] Saved liveSession:", course.liveSession);

    await course.save();

    res.json(course.liveSession);
});

export const stopCourseLiveSession = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
        res.status(404);
        throw new Error("Course not found");
    }

    if (
        req.user.role !== "admin" &&
        course.teacherId.toString() !== req.user._id.toString()
    ) {
        res.status(403);
        throw new Error("Not authorized to stop this live session");
    }

    course.liveSession = {
        isActive: false,
        roomId: "",
        startedAt: null,
        startedBy: null,
        mode: "videosdk",
    };

    await course.save();

    res.json(course.liveSession);
});

export const getCourseLiveSession = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id)
        .populate("liveSession.startedBy", "name email")
        .populate("teacherId", "name email");

    if (!course) {
        res.status(404);
        throw new Error("Course not found");
    }

    res.json({
        courseId: course._id,
        teacherId: course.teacherId,
        liveSession: course.liveSession,
    });
});

// @desc Rate Course
// @route POST /api/courses/:id/rate
export const rateCourse = asyncHandler(async (req, res) => {
    const { rating, review } = req.body;
    const courseId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
        res.status(400);
        throw new Error("Valid rating (1-5) is required");
    }

    const course = await Course.findById(courseId);
    if (!course) {
        res.status(404);
        throw new Error("Course not found");
    }

    // Check if user is enrolled
    const enrollment = await Enrollment.findOne({
        courseId,
        studentId: req.user._id,
    });
    if (!enrollment && req.user.role !== "admin") {
        res.status(403);
        throw new Error("Only enrolled students can rate this course");
    }

    // Check if user already rated
    const existingRatingIndex = course.ratings.findIndex(
        (r) => r.userId.toString() === req.user._id.toString()
    );

    if (existingRatingIndex > -1) {
        // Update existing rating
        course.ratings[existingRatingIndex].rating = rating;
        course.ratings[existingRatingIndex].review = review || "";
        course.ratings[existingRatingIndex].createdAt = new Date();
    } else {
        // Add new rating
        course.ratings.push({
            userId: req.user._id,
            rating,
            review: review || "",
        });
    }

    // Calculate average rating
    const totalRating = course.ratings.reduce((acc, r) => acc + r.rating, 0);
    course.averageRating = (totalRating / course.ratings.length).toFixed(1);

    await course.save();

    res.json({
        message: "Rating submitted successfully",
        averageRating: course.averageRating,
        ratingsCount: course.ratings.length,
    });
});

// @desc Schedule Live Session
// @route POST /api/courses/:id/schedule-live
export const scheduleLiveSession = asyncHandler(async (req, res) => {
    const { title, scheduledAt, duration } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
        res.status(404);
        throw new Error("Course not found");
    }

    // Check if user is the teacher of this course
    if (course.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error("Not authorized to schedule sessions for this course");
    }

    if (!title || !scheduledAt) {
        res.status(400);
        throw new Error("Title and scheduled time are required");
    }

    const newSession = {
        title,
        scheduledAt: new Date(scheduledAt),
        duration: Number(duration) || 60,
    };

    course.scheduledSessions.push(newSession);
    await course.save();

    res.status(201).json(course.scheduledSessions);
});
