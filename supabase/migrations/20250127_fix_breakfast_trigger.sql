-- Fix the breakfast total guests calculation trigger to handle both array and string JSONB types
CREATE OR REPLACE FUNCTION calculate_breakfast_total_guests()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle both JSONB array and JSONB string cases
  IF jsonb_typeof(NEW."tableBreakdown") = 'array' THEN
    SELECT COALESCE(SUM((value::text)::integer), 0)
    INTO NEW."totalGuests"
    FROM jsonb_array_elements(NEW."tableBreakdown");
  ELSIF jsonb_typeof(NEW."tableBreakdown") = 'string' THEN
    -- If it's a string, try to parse it as JSON array
    DECLARE
      parsed_array JSONB;
    BEGIN
      parsed_array := NEW."tableBreakdown"::text::jsonb;
      IF jsonb_typeof(parsed_array) = 'array' THEN
        SELECT COALESCE(SUM((value::text)::integer), 0)
        INTO NEW."totalGuests"
        FROM jsonb_array_elements(parsed_array);
      ELSE
        NEW."totalGuests" := 0;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NEW."totalGuests" := 0;
    END;
  ELSE
    NEW."totalGuests" := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

