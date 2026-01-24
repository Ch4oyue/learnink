-- ============================================
-- Notification Trigger for Material Requests
-- ============================================
-- When a material request status changes to 'completed',
-- automatically create a notification for the requesting user.

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.notify_on_request_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes TO 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Insert notification for the user who made the request
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      related_request_id,
      is_read
    ) VALUES (
      NEW.user_id,
      'Materi Anda Sudah Tersedia! 🎉',
      'Permintaan materi "' || NEW.topic || '" telah selesai dan siap dipelajari.',
      'request_completed',
      NEW.id,
      false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_notify_on_request_completed ON public.material_requests;

-- Create the trigger
CREATE TRIGGER trigger_notify_on_request_completed
  AFTER UPDATE ON public.material_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_request_completed();

-- ============================================
-- Also notify when new module is linked to request
-- ============================================
-- When a module's source_request_id is set, notify the requester
-- that a new module is available for them

CREATE OR REPLACE FUNCTION public.notify_on_module_created_from_request()
RETURNS TRIGGER AS $$
DECLARE
  request_user_id uuid;
  request_topic text;
BEGIN
  -- Only trigger when source_request_id is newly set
  IF NEW.source_request_id IS NOT NULL AND 
     (OLD.source_request_id IS NULL OR OLD.source_request_id != NEW.source_request_id) THEN
    
    -- Get the user who made the request
    SELECT user_id, topic INTO request_user_id, request_topic
    FROM public.material_requests
    WHERE id = NEW.source_request_id;
    
    IF request_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        related_module_id,
        related_request_id,
        is_read
      ) VALUES (
        request_user_id,
        'Modul Baru dari Request Anda! 📚',
        'Modul "' || NEW.title || '" telah dibuat berdasarkan permintaan Anda. Mulai belajar sekarang!',
        'module_created',
        NEW.id,
        NEW.source_request_id,
        false
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_notify_on_module_from_request ON public.modules;

-- Create the trigger
CREATE TRIGGER trigger_notify_on_module_from_request
  AFTER INSERT OR UPDATE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_module_created_from_request();

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.notify_on_request_completed() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_on_module_created_from_request() TO authenticated;
