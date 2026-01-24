-- =============================================
-- Security Logs Table for Audit Trail
-- Created: 2026-01-19
-- Purpose: Log authentication failures and security events
-- =============================================

-- Create enum for log types
CREATE TYPE security_event_type AS ENUM (
    'auth_failure',
    'rate_limit_exceeded',
    'invalid_api_key',
    'unauthorized_access',
    'suspicious_activity'
);

-- Create security_logs table
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type security_event_type NOT NULL,
    ip_address INET,
    user_agent TEXT,
    endpoint TEXT NOT NULL,
    request_method TEXT,
    error_code INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at 
ON public.security_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_logs_event_type 
ON public.security_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address 
ON public.security_logs(ip_address);

-- Enable RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "security_logs_admin_select" ON public.security_logs
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
);

-- Service role can insert (for Edge Functions)
GRANT INSERT ON public.security_logs TO service_role;
GRANT SELECT ON public.security_logs TO authenticated;

-- Create function to log security events (for Edge Functions)
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type security_event_type,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_endpoint TEXT DEFAULT '',
    p_request_method TEXT DEFAULT 'POST',
    p_error_code INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.security_logs (
        event_type,
        ip_address,
        user_agent,
        endpoint,
        request_method,
        error_code,
        error_message,
        metadata
    ) VALUES (
        p_event_type,
        p_ip_address,
        p_user_agent,
        p_endpoint,
        p_request_method,
        p_error_code,
        p_error_message,
        p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION log_security_event TO service_role;

-- =============================================
-- Rate Limiting Table
-- =============================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP address or API key preview
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint for rate limit lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON public.rate_limits(identifier, endpoint, window_start);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access (for Edge Functions)
GRANT ALL ON public.rate_limits TO service_role;

-- Create function to check and update rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_max_requests INTEGER DEFAULT 100,
    p_window_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
    current_window TIMESTAMPTZ;
    current_count INTEGER;
BEGIN
    -- Calculate current window start (rounded to window size)
    current_window := date_trunc('minute', NOW()) - 
        (EXTRACT(MINUTE FROM NOW())::INTEGER % p_window_minutes) * INTERVAL '1 minute';
    
    -- Upsert rate limit record
    INSERT INTO public.rate_limits (identifier, endpoint, request_count, window_start)
    VALUES (p_identifier, p_endpoint, 1, current_window)
    ON CONFLICT (identifier, endpoint, window_start) 
    DO UPDATE SET request_count = rate_limits.request_count + 1
    RETURNING request_count INTO current_count;
    
    -- Check if limit exceeded
    IF current_count > p_max_requests THEN
        RETURN FALSE; -- Rate limit exceeded
    END IF;
    
    RETURN TRUE; -- Within limit
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_rate_limit TO service_role;

-- Clean up old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION cleanup_rate_limits() RETURNS void AS $$
BEGIN
    DELETE FROM public.rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DONE
-- =============================================
SELECT 'Security tables created successfully!' as status;
