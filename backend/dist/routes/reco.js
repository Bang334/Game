"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recommendationController_1 = require("../controllers/recommendationController");
const router = (0, express_1.Router)();
/**
 * GET /api/reco/games
 * Get AI-powered game recommendations for a user
 */
router.get('/games', recommendationController_1.RecommendationController.getRecommendations);
/**
 * GET /api/reco/health
 * Check AI service health
 */
router.get('/health', recommendationController_1.RecommendationController.checkAIServiceHealth);
exports.default = router;
//# sourceMappingURL=reco.js.map