-- Create balance_transactions table to track all balance changes
CREATE TABLE IF NOT EXISTS balance_transaction (
  transaction_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL, -- Positive for deposits, negative for purchases
  balance_before DECIMAL(15, 2) NOT NULL,
  balance_after DECIMAL(15, 2) NOT NULL,
  transaction_type ENUM('DEPOSIT', 'PURCHASE', 'REFUND', 'ADMIN_ADJUST') NOT NULL,
  description VARCHAR(500),
  related_game_id INT NULL, -- For purchase transactions
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
  FOREIGN KEY (related_game_id) REFERENCES game(game_id) ON DELETE SET NULL,
  INDEX idx_user_created (user_id, created_at DESC)
);

-- Add sample data for existing users (optional)
-- This creates initial balance transaction records for users with existing balances
INSERT INTO balance_transaction (user_id, amount, balance_before, balance_after, transaction_type, description)
SELECT 
  user_id,
  balance as amount,
  0 as balance_before,
  balance as balance_after,
  'DEPOSIT' as transaction_type,
  'Số dư ban đầu' as description
FROM user 
WHERE balance > 0;

