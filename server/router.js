import register from "./routes/auth/register.js";
import login from "./routes/auth/login.js";
import logout from "./routes/auth/logout.js";
import me from "./routes/auth/me.js";

import workspacesIndex from "./routes/workspaces/index.js";
import workspaceItem from "./routes/workspaces/[id].js";

import subjects from "./routes/syllabus/subjects.js";
import chapters from "./routes/syllabus/chapters.js";
import syllabusTopics from "./routes/syllabus/topics.js";

import progressTopics from "./routes/progress/topics.js";
import progressSummary from "./routes/progress/summary.js";

import activitiesIndex from "./routes/activities/index.js";
import activityItem from "./routes/activities/[id]/index.js";
import activityComments from "./routes/activities/[id]/comments.js";
import activityReactions from "./routes/activities/[id]/reactions.js";

import groupsIndex from "./routes/groups/index.js";
import groupsJoin from "./routes/groups/join.js";

import goalsIndex from "./routes/goals/index.js";
import goalItem from "./routes/goals/[id].js";

import sessionsIndex from "./routes/sessions/index.js";
import sessionItem from "./routes/sessions/[id].js";

import testsIndex from "./routes/tests/index.js";
import testItem from "./routes/tests/[id].js";

import leaderboard from "./routes/leaderboard/index.js";
import analytics from "./routes/analytics/index.js";
import dashboardStats from "./routes/dashboard/stats.js";

/**
 * Convert a path pattern like "/workspaces/:id" to a RegExp.
 * Returns { regex, keys } where keys are the param names in order.
 */
function pathToRegex(pattern) {
  const keys = [];
  const source = pattern
    .replace(/:([^/]+)/g, (_, key) => {
      keys.push(key);
      return "([^/]+)";
    })
    .replace(/\*/g, "(.*)");
  return { regex: new RegExp(`^${source}$`), keys };
}

/**
 * Route table: method + path pattern → handler.
 * All paths are relative (without the /api prefix).
 */
const ROUTES = [
  // --- Auth ---
  { method: "POST", path: "/auth/register", handler: register },
  { method: "POST", path: "/auth/login", handler: login },
  { method: "POST", path: "/auth/logout", handler: logout },
  { method: "GET", path: "/auth/me", handler: me },

  // --- Workspaces ---
  { method: "GET", path: "/workspaces", handler: workspacesIndex },
  { method: "POST", path: "/workspaces", handler: workspacesIndex },
  { method: "GET", path: "/workspaces/:id", handler: workspaceItem },
  { method: "PUT", path: "/workspaces/:id", handler: workspaceItem },
  { method: "DELETE", path: "/workspaces/:id", handler: workspaceItem },

  // --- Syllabus ---
  { method: "GET", path: "/syllabus/subjects", handler: subjects },
  { method: "POST", path: "/syllabus/subjects", handler: subjects },
  { method: "GET", path: "/syllabus/chapters", handler: chapters },
  { method: "POST", path: "/syllabus/chapters", handler: chapters },
  { method: "GET", path: "/syllabus/topics", handler: syllabusTopics },
  { method: "POST", path: "/syllabus/topics", handler: syllabusTopics },

  // --- Progress ---
  { method: "POST", path: "/progress/topics", handler: progressTopics },
  { method: "GET", path: "/progress/topics", handler: progressTopics },
  { method: "GET", path: "/progress/summary", handler: progressSummary },

  // --- Activities ---
  { method: "GET", path: "/activities", handler: activitiesIndex },
  { method: "POST", path: "/activities", handler: activitiesIndex },
  { method: "GET", path: "/activities/:id", handler: activityItem },
  { method: "DELETE", path: "/activities/:id", handler: activityItem },
  { method: "GET", path: "/activities/:id/comments", handler: activityComments },
  { method: "POST", path: "/activities/:id/comments", handler: activityComments },
  { method: "GET", path: "/activities/:id/reactions", handler: activityReactions },
  { method: "POST", path: "/activities/:id/reactions", handler: activityReactions },

  // --- Groups ---
  { method: "GET", path: "/groups", handler: groupsIndex },
  { method: "POST", path: "/groups", handler: groupsIndex },
  { method: "POST", path: "/groups/join", handler: groupsJoin },

  // --- Goals ---
  { method: "GET", path: "/goals", handler: goalsIndex },
  { method: "POST", path: "/goals", handler: goalsIndex },
  { method: "GET", path: "/goals/:id", handler: goalItem },
  { method: "PUT", path: "/goals/:id", handler: goalItem },
  { method: "DELETE", path: "/goals/:id", handler: goalItem },

  // --- Sessions ---
  { method: "GET", path: "/sessions", handler: sessionsIndex },
  { method: "POST", path: "/sessions", handler: sessionsIndex },
  { method: "GET", path: "/sessions/:id", handler: sessionItem },
  { method: "PUT", path: "/sessions/:id", handler: sessionItem },
  { method: "DELETE", path: "/sessions/:id", handler: sessionItem },

  // --- Tests ---
  { method: "GET", path: "/tests", handler: testsIndex },
  { method: "POST", path: "/tests", handler: testsIndex },
  { method: "GET", path: "/tests/:id", handler: testItem },
  { method: "PUT", path: "/tests/:id", handler: testItem },
  { method: "DELETE", path: "/tests/:id", handler: testItem },

  // --- Leaderboard ---
  { method: "GET", path: "/leaderboard", handler: leaderboard },

  // --- Analytics ---
  { method: "GET", path: "/analytics", handler: analytics },

  // --- Dashboard ---
  { method: "GET", path: "/dashboard/stats", handler: dashboardStats },
];

// Pre-compile regexes (keys stored for param extraction)
const COMPILED = ROUTES.map((r) => {
  const { regex, keys } = pathToRegex(r.path);
  return { ...r, regex, keys };
});

/**
 * Extract path parameters from a matched route.
 */
function extractParams(keys, match) {
  const params = {};
  for (let i = 0; i < keys.length; i++) {
    params[keys[i]] = match[i + 1];
  }
  return params;
}

export default async function handler(req, res) {
  // Strip /api prefix from the URL path
  const url = req.url || "";
  const apiPath = url.startsWith("/api") ? url.slice(4) : url;
  const pathname = apiPath.split("?")[0];

  // Find matching route (method + path)
  let matchResult = null;
  for (const route of COMPILED) {
    if (route.method !== req.method) continue;
    const m = pathname.match(route.regex);
    if (m) {
      matchResult = { route, m };
      break;
    }
  }

  if (!matchResult) {
    res.status(404).json({ message: "Not found" });
    return;
  }

  const { route, m } = matchResult;

  // Merge query string + path params into req.query
  const queryString = apiPath.split("?").slice(1).join("?");
  const params = extractParams(route.keys, m);

  req.query = { ...parseQuery(queryString), ...params };

  try {
    return await route.handler(req, res);
  } catch (err) {
    console.error(`[api] ${req.method} ${pathname} failed:`, err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

function parseQuery(queryString) {
  const query = {};
  if (!queryString) return query;

  for (const pair of queryString.split("&")) {
    if (!pair) continue;
    const separator = pair.indexOf("=");
    const rawKey = separator === -1 ? pair : pair.slice(0, separator);
    const rawValue = separator === -1 ? "" : pair.slice(separator + 1);
    const key = safeDecode(rawKey);
    if (key) query[key] = safeDecode(rawValue);
  }

  return query;
}
