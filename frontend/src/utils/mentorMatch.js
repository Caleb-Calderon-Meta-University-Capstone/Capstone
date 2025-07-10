// Weight settings for different features in the matching algorithm
const FEATURE_WEIGHTS = {
  skills: 0.4,
  interests: 0.3,
  ai_interest: 0.1,
  experience_years: 0.1,
  preferred_meeting: 0.1,
};

// Create variable for meeting types to support
const MEETING_OPTIONS = ["Zoom", "In Person", "Hybrid"];

// Mapping of skill levels to numeric values based on proficiency
const SKILL_LEVEL_MAP = {
  Beginner:     0.33,
  Intermediate: 0.66,
  Advanced:     1.0,
};

// These functions turn parts of a user's profile into numbers; This helps us compare users and find the best mentor matches later.

function encodeSkills(user, globalSkills) {
  return globalSkills.map(skill => {
    const level = user.skills?.[skill];
    return SKILL_LEVEL_MAP[level] || 0;
  });
}

function encodeInterests(user, globalInterests) {
  return globalInterests.map(interest => (user.interests?.includes(interest) ? 1 : 0));
}

function encodeAI(user) {
  return [user.ai_interest ? 1 : 0];
}

