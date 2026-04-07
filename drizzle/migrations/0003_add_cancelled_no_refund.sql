-- Cancel + Refund Logic (Task 12 from plan)

-- Add cancelled_no_refund state to sms_activation
ALTER TYPE sms_activation_state ADD VALUE IF NOT EXISTS 'cancelled_no_refund';
ALTER TYPE sms_activation_state ADD VALUE IF NOT EXISTS 'cancelled_after_refund';
