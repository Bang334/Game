import { Router } from 'express'
import { RecommendationController } from '../controllers/recommendationController'

const router = Router()

/**
 * GET /api/reco/games
 * Get AI-powered game recommendations for a user
 */
router.get('/games', RecommendationController.getRecommendations)

/**
 * GET /api/reco/health
 * Check AI service health
 */
router.get('/health', RecommendationController.checkAIServiceHealth)

export default router
