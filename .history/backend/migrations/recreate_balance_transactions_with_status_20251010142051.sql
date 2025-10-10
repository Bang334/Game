-- Drop existing balance_transaction table
DROP TABLE IF EXISTS balance_transaction;

-- Create balance_transaction table with status field for approval workflow
CREATE TABLE balance_transaction (
  transaction_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  balance_before DECIMAL(15, 2) NOT NULL,
  balance_after DECIMAL(15, 2) NOT NULL,
  transaction_type ENUM('DEPOSIT', 'PURCHASE', 'REFUND', 'ADMIN_ADJUST') NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  description VARCHAR(500),
  related_game_id INT NULL,
  -- Deposit proof information
  transfer_proof_image VARCHAR(500) NULL, -- URL/path to transfer screenshot
  transfer_amount DECIMAL(15, 2) NULL, -- Amount user claims to have transferred
  transfer_reference VARCHAR(100) NULL, -- Bank reference number
  -- Admin review
  reviewed_by INT NULL, -- Admin user_id who reviewed
  reviewed_at TIMESTAMP NULL,
  reject_reason VARCHAR(500) NULL,
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
  FOREIGN KEY (related_game_id) REFERENCES game(game_id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES user(user_id) ON DELETE SET NULL,
  -- Indexes
  INDEX idx_user_created (user_id, created_at DESC),
  INDEX idx_status (status, created_at DESC),
  INDEX idx_type_status (transaction_type, status)
);

