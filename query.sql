-- @block Bookmarked query
-- @group Ungrouped
-- @name case-sensitivity in postgres

SELECT * FROM "Users"

Select *
FROM "Users" as u
where u."Id" = 'a95d1491-9ec9-4047-b7a2-b88f40856bc8'


-- Select challenges

Select * FROM "UserTotpLoginChallenges"
