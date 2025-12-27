"use strict";
/**
 * Controllers Index
 * Central export point for all controllers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimilarGamesController = exports.RecommendationController = exports.AdminController = exports.ViewController = exports.BalanceController = exports.ReviewController = exports.WishlistController = exports.PurchaseController = exports.UserController = exports.GameController = void 0;
var gameController_1 = require("./gameController");
Object.defineProperty(exports, "GameController", { enumerable: true, get: function () { return gameController_1.GameController; } });
var userController_1 = require("./userController");
Object.defineProperty(exports, "UserController", { enumerable: true, get: function () { return userController_1.UserController; } });
var purchaseController_1 = require("./purchaseController");
Object.defineProperty(exports, "PurchaseController", { enumerable: true, get: function () { return purchaseController_1.PurchaseController; } });
var wishlistController_1 = require("./wishlistController");
Object.defineProperty(exports, "WishlistController", { enumerable: true, get: function () { return wishlistController_1.WishlistController; } });
var reviewController_1 = require("./reviewController");
Object.defineProperty(exports, "ReviewController", { enumerable: true, get: function () { return reviewController_1.ReviewController; } });
var balanceController_1 = require("./balanceController");
Object.defineProperty(exports, "BalanceController", { enumerable: true, get: function () { return balanceController_1.BalanceController; } });
var viewController_1 = require("./viewController");
Object.defineProperty(exports, "ViewController", { enumerable: true, get: function () { return viewController_1.ViewController; } });
var adminController_1 = require("./adminController");
Object.defineProperty(exports, "AdminController", { enumerable: true, get: function () { return adminController_1.AdminController; } });
var recommendationController_1 = require("./recommendationController");
Object.defineProperty(exports, "RecommendationController", { enumerable: true, get: function () { return recommendationController_1.RecommendationController; } });
var similarGamesController_1 = require("./similarGamesController");
Object.defineProperty(exports, "SimilarGamesController", { enumerable: true, get: function () { return similarGamesController_1.SimilarGamesController; } });
//# sourceMappingURL=index.js.map