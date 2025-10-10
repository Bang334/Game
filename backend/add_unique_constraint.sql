-- Add unique constraint to ensure each user can only have one review per game
-- This prevents duplicate reviews from the same user for the same game

-- First, remove any duplicate reviews (keep the latest one)
DELETE r1 FROM Review r1
INNER JOIN Review r2 
WHERE r1.review_id < r2.review_id 
AND r1.user_id = r2.user_id 
AND r1.game_id = r2.game_id;

-- Add unique constraint on (user_id, game_id)
ALTER TABLE Review 
ADD CONSTRAINT unique_user_game_review 
UNIQUE (user_id, game_id);

-- Verify the constraint was added
SHOW CREATE TABLE Review;
