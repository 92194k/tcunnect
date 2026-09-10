-- TCUnnect: 20250908390001_fix_comments_not_null.sql
-- Bug: feed_comments.poster_session_hash was NOT NULL from the original
-- anonymous-comments design. 20250908380001 switched comments to show real
-- identity (user_id) instead and stopped sending poster_session_hash, but
-- never relaxed this constraint — every comment insert has been failing
-- since then with "null value in column poster_session_hash violates
-- not-null constraint".

alter table feed_comments alter column poster_session_hash drop not null;
