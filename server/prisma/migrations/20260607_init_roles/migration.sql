-- Initialize roles in the roles table
INSERT INTO roles (role_name) 
VALUES ('customer'), ('seller')
ON CONFLICT (role_name) DO NOTHING;
