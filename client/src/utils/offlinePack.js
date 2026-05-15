import API from "../api/api";

const OFFLINE_CACHE = "remotesmart-offline-v2";
const OFFLINE_INDEX_KEY = "remotesmart_offline_courses_v2";

const normalizeResourceType = (resource) => {
  if (resource?.type) {
    return resource.type;
  }

  const value = `${resource?.originalFilename || ""} ${resource?.url || ""}`.toLowerCase();

  if (value.includes(".pdf")) {
    return "pdf";
  }

  if (value.includes(".txt") || value.includes("text/plain")) {
    return "text";
  }

  return "file";
};

const cacheAsset = async (cache, url) => {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (response.ok || response.type === "opaque") {
      await cache.put(url, response.clone());
      return true;
    }
  } catch {
    // ignore asset failures for offline pack
  }
  return false;
};

export const downloadCoursePack = async (courseId) => {
  if (!("caches" in window)) {
    throw new Error("Offline caching is not supported in this browser.");
  }

  const [courseResponse, modulesResponse] = await Promise.all([
    API.get(`/courses/${courseId}`),
    API.get(`/modules/${courseId}`),
  ]);

  const lectureEntries = await Promise.all(
    modulesResponse.data.map(async (moduleItem) => {
      const [lectureResponse, quizResponse] = await Promise.all([
        API.get(`/lectures/${moduleItem._id}`),
        API.get(`/quizzes/module/${moduleItem._id}`),
      ]);
      return {
        moduleId: moduleItem._id,
        lectures: lectureResponse.data,
        quizzes: quizResponse.data,
      };
    })
  );

  const lecturesByModule = {};
  const quizzesByModule = {};
  lectureEntries.forEach((entry) => {
    lecturesByModule[entry.moduleId] = entry.lectures;
    quizzesByModule[entry.moduleId] = entry.quizzes;
  });

  const pack = {
    course: courseResponse.data,
    modules: modulesResponse.data,
    lecturesByModule,
    quizzesByModule,
    downloadedAt: new Date().toISOString(),
  };

  const assetUrls = [];

  Object.values(lecturesByModule).forEach((lectures) => {
    lectures.forEach((lecture) => {
      lecture.contents?.forEach((content) => {
        if (content.type === "image" && content.url) {
          assetUrls.push(content.url);
        }
      });

      lecture.resources?.forEach((resource) => {
        const type = normalizeResourceType(resource);
        if ((type === "pdf" || type === "text") && resource.url) {
          assetUrls.push(resource.url);
        }
      });
    });
  });

  const cache = await caches.open(OFFLINE_CACHE);
  await cache.put(
    `/offline/course/${courseId}.json`,
    new Response(JSON.stringify(pack), {
      headers: { "Content-Type": "application/json" },
    })
  );

  const uniqueAssetUrls = [...new Set(assetUrls)];

  const results = await Promise.all(
    uniqueAssetUrls.map((url) => cacheAsset(cache, url))
  );
  const cachedCount = results.filter(Boolean).length;

  const index = JSON.parse(localStorage.getItem(OFFLINE_INDEX_KEY) || "[]");
  const nextIndex = [
    ...index.filter((entry) => entry.courseId !== courseId),
    {
      courseId,
      title: courseResponse.data.title,
      downloadedAt: pack.downloadedAt,
    },
  ];
  localStorage.setItem(OFFLINE_INDEX_KEY, JSON.stringify(nextIndex));

  return {
    assetCount: uniqueAssetUrls.length,
    cachedCount,
  };
};

export const getOfflineIndex = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_INDEX_KEY) || "[]");
  } catch {
    return [];
  }
};

export const isCourseDownloaded = (courseId) =>
  getOfflineIndex().some((entry) => entry.courseId === courseId);

export const getOfflineCoursePack = async (courseId) => {
  if (!("caches" in window)) {
    return null;
  }

  const cache = await caches.open(OFFLINE_CACHE);
  const response = await cache.match(`/offline/course/${courseId}.json`);
  if (!response) {
    return null;
  }
  return response.json();
};

export const findOfflineLecture = async (lectureId) => {
  const index = getOfflineIndex();
  if (!index.length) {
    return null;
  }

  for (const entry of index) {
    const pack = await getOfflineCoursePack(entry.courseId);
    if (!pack) {
      continue;
    }
    const modules = pack.modules || [];
    for (const module of modules) {
      const lectures = pack.lecturesByModule?.[module._id] || [];
      const found = lectures.find((lecture) => lecture._id === lectureId);
      if (found) {
        return {
          lecture: found,
          module,
          course: pack.course,
          lectures,
          quizzes: pack.quizzesByModule?.[module._id] || [],
        };
      }
    }
  }

  return null;
};

export const clearOfflineCourse = async (courseId) => {
  if (!("caches" in window)) {
    return false;
  }

  const cache = await caches.open(OFFLINE_CACHE);
  await cache.delete(`/offline/course/${courseId}.json`);

  const index = getOfflineIndex().filter(
    (entry) => entry.courseId !== courseId
  );
  localStorage.setItem(OFFLINE_INDEX_KEY, JSON.stringify(index));
  return true;
};
