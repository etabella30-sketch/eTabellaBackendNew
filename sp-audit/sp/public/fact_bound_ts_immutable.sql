CREATE OR REPLACE FUNCTION public.fact_bound_ts_immutable(j jsonb, p_bound text)
 RETURNS timestamp with time zone
 LANGUAGE sql
 IMMUTABLE
AS $function$
WITH base AS (
  SELECT
    upper(j->>'type')   AS t,
    upper(COALESCE(
      CASE (j->>'nValue')::int
        WHEN 241 THEN 'ON'
        WHEN 242 THEN 'C'
        WHEN 243 THEN 'B'
        WHEN 244 THEN 'A'
        WHEN 245 THEN 'BT'
        ELSE NULL
      END,
      j->>'cValue'
    ))               AS c,
    lower(p_bound)   AS b,
    j->'record'->0   AS r0,
    j->'record'->1   AS r1
),
dates AS (
  SELECT
    t, c, b, r0, r1,
    -- parse r0/r1.date
    CASE WHEN r0 ? 'date' THEN
      CASE WHEN (r0->>'date') ~ '(Z|[+-][0-9]{2}(:?[0-9]{2})?)$'
           THEN (r0->>'date')::timestamptz
           ELSE ((r0->>'date')::timestamp AT TIME ZONE 'UTC')
      END
    END AS d0_date,
    CASE WHEN r1 ? 'date' THEN
      CASE WHEN (r1->>'date') ~ '(Z|[+-][0-9]{2}(:?[0-9]{2})?)$'
           THEN (r1->>'date')::timestamptz
           ELSE ((r1->>'date')::timestamp AT TIME ZONE 'UTC')
      END
    END AS d1_date,
    -- MY/Y components
    (r0->>'year')::int  AS y0,
    (r0->>'month')::int AS m0,
    (r1->>'year')::int  AS y1,
    (r1->>'month')::int AS m1
  FROM base
),
-- Month bounds for record[0]
month_bounds AS (
  SELECT
    make_timestamptz(y0, m0, 1, 0, 0, 0) AS m_start,
    (make_timestamptz(y0, m0, 1, 0, 0, 0)
       + interval '1 month' - interval '1 millisecond')::timestamptz AS m_end,
    -- 'C' window (± 5 months)
    date_trunc('month', make_timestamptz(y0, m0, 1, 0, 0, 0) - interval '5 months') AS c_m_start,
    (date_trunc('month', make_timestamptz(y0, m0, 1, 0, 0, 0) + interval '6 months')
       - interval '1 millisecond')::timestamptz AS c_m_end
  FROM dates
),
-- Year bounds for record[0]
year_bounds AS (
  SELECT
    make_timestamptz(y0, 1, 1, 0, 0, 0) AS y_start,
    make_timestamptz(y0, 12, 31, 23, 59, 59.999) AS y_end,
    -- 'C' window (± 5 years)
    make_timestamptz(y0 - 5, 1, 1, 0, 0, 0) AS c_y_start,
    make_timestamptz(y0 + 5, 12, 31, 23, 59, 59.999) AS c_y_end
  FROM dates
)
SELECT
  CASE
    /* C-window across types */
    WHEN d.c = 'C' AND d.t = 'D' THEN
      CASE WHEN d.b = 'start' THEN COALESCE(d.d0_date, m.m_start, y.y_start) - interval '5 days'
           ELSE COALESCE(d.d0_date, m.m_start, y.y_start) + interval '5 days'
      END
    WHEN d.c = 'C' AND d.t = 'MY' THEN
      CASE WHEN d.b = 'start' THEN m.c_m_start ELSE m.c_m_end END
    WHEN d.c = 'C' AND d.t = 'Y' THEN
      CASE WHEN d.b = 'start' THEN y.c_y_start ELSE y.c_y_end END

    /* D & BT: start=r0.date, end=r1.date (fallback to r0) */
    WHEN d.t = 'D' AND d.c = 'BT' THEN
      CASE WHEN d.b = 'start' THEN d.d0_date
           ELSE COALESCE(d.d1_date, d.d0_date)
      END

    /* D non-BT: r0.date */
    WHEN d.t = 'D' THEN
      d.d0_date

    /* MY: month bounds (BT: end uses month from r1 with same year y0) */
    WHEN d.t = 'MY' THEN
      CASE WHEN d.b = 'start' THEN m.m_start
           ELSE
             CASE
               WHEN d.c = 'BT' AND d.m1 IS NOT NULL AND d.y0 IS NOT NULL
                 THEN (make_timestamptz(d.y0, d.m1, 1, 0, 0, 0)
                       + interval '1 month' - interval '1 millisecond')::timestamptz
               ELSE m.m_end
             END
      END

    /* Y: year bounds (BT: y1 for end) */
    WHEN d.t = 'Y' THEN
      CASE WHEN d.b = 'start' THEN y.y_start
           ELSE COALESCE(
                  CASE WHEN d.c = 'BT' AND d.y1 IS NOT NULL
                       THEN make_timestamptz(d.y1, 12, 31, 23, 59, 59.999)
                  END,
                  y.y_end
                )
      END

    ELSE NULL
  END
FROM dates d
LEFT JOIN month_bounds m ON TRUE
LEFT JOIN year_bounds  y ON TRUE;
$function$
