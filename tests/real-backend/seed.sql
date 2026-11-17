-- Local-only test data for the real-backend suite. Not for production.
insert into auth.users(id,email,raw_user_meta_data) values
('00000000-0000-0000-0000-000000000001','super@t.test','{"display_name":"Super"}'),
('00000000-0000-0000-0000-000000000002','admin@t.test','{"display_name":"Admin"}'),
('00000000-0000-0000-0000-000000000003','tutor@t.test','{"display_name":"Tutor"}'),
('00000000-0000-0000-0000-000000000004','learner@t.test','{"display_name":"Learner"}'),
('00000000-0000-0000-0000-000000000005','other@t.test','{"display_name":"Other"}')
on conflict do nothing;
set session_replication_role = replica;
update user_roles set role='superadmin' where user_id='00000000-0000-0000-0000-000000000001';
update user_roles set role='admin' where user_id='00000000-0000-0000-0000-000000000002';
update user_roles set role='tutor' where user_id='00000000-0000-0000-0000-000000000003';
insert into modules(id,title,summary,level,category,is_published,created_by,content) values
('11111111-1111-1111-1111-111111111111','Flexbox Basics','s','beginner','general',true,'00000000-0000-0000-0000-000000000003',E'# Flexbox Basics\n\nIntro.\n\n## Axes\n\nAxes text.')
on conflict (id) do nothing;
insert into quizzes(id,module_id,title,passing_score,time_limit_minutes) values
('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','Flexbox check',70,5) on conflict (id) do nothing;
insert into quiz_questions(id,quiz_id,question_text,question_type,options,correct_answer,points,order_index) values
('33333333-3333-3333-3333-333333333331','22222222-2222-2222-2222-222222222222','Which property sets the main axis?','multiple_choice','["flex-direction","z-index"]','flex-direction',1,0),
('33333333-3333-3333-3333-333333333332','22222222-2222-2222-2222-222222222222','Flex items stay on a single line by default.','true_false','["True","False"]','benar',1,1)
on conflict (id) do nothing;
