-- Group directory seed (owner-provided teams, pilot community grace-pilot).
-- Idempotent: fixed UUIDs + ON CONFLICT (id) DO NOTHING, safe to re-run.
-- Descriptions are keyword-rich on purpose: the suggest typeahead searches
-- name + description, and interest-matching runs against the same text.

INSERT INTO groups (id, org_id, name, description) VALUES
  ('67fc7d8b-e84f-44b7-9f6d-1712efecc2c8', '11111111-1111-1111-1111-111111111111', 'Pastoral Care Team', 'Pastoral & care · prayer, counsel and steady support for members going through hard seasons'),
  ('1e6313d9-e04b-4fa4-b610-2e3fdc3c883d', '11111111-1111-1111-1111-111111111111', 'Visitation Team', 'Pastoral & care · home visits to check on members, newcomers and the missing'),
  ('2c4feddb-d425-44b3-8363-c16c4665d251', '11111111-1111-1111-1111-111111111111', 'Hospital & Sick Visitation Team', 'Pastoral & care · visiting the sick at home and in hospital'),
  ('690ec07a-4f44-4f50-87b1-3429d1ab9f6c', '11111111-1111-1111-1111-111111111111', 'Bereavement & Support Team', 'Pastoral & care · standing with grieving families before, during and after funerals'),
  ('3ef86ef5-1117-409a-b66f-761600538415', '11111111-1111-1111-1111-111111111111', 'Prayer Team (Intercessors)', 'Pastoral & care · intercession, prayer meetings and prayer requests'),
  ('3cb66e41-542e-4966-a34b-ab62dee9e60e', '11111111-1111-1111-1111-111111111111', 'Counselling Team', 'Pastoral & care · confidential counsel for marriage, family and personal struggles'),
  ('eef5a35d-b911-44d3-80ef-78e8c128ad22', '11111111-1111-1111-1111-111111111111', 'Welfare Team', 'Pastoral & care · practical help for members in need'),
  ('c44be7f1-972e-4756-9f91-52e935f1ab9e', '11111111-1111-1111-1111-111111111111', 'Benevolence & Compassion Ministry', 'Pastoral & care · food, funds and relief for the poor and vulnerable'),
  ('a747135d-7c89-435f-b4ed-73e372fef4c6', '11111111-1111-1111-1111-111111111111', 'Shepherds (Under-Shepherds)', 'Pastoral & care · shepherds who watch over assigned families week by week'),
  ('1c3b7b4e-85df-4ca6-9f99-110251debcf1', '11111111-1111-1111-1111-111111111111', 'Cell & Home Fellowship', 'Pastoral & care · small home fellowships for word, prayer and closeness'),
  ('181b0d02-b18c-4c53-a285-d844694b93d7', '11111111-1111-1111-1111-111111111111', 'Zone, District & Area Pastors', 'Pastoral & care · pastors overseeing zones, districts and areas')
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
INSERT INTO groups (id, org_id, name, description) VALUES
  ('42b7a460-3a7d-4f79-a33b-e52284a79cf7', '11111111-1111-1111-1111-111111111111', 'Ushering Team', 'Welcome & integration · seating, order and first smiles on service days'),
  ('093bc878-e2b0-4798-94af-fcb05c8835f2', '11111111-1111-1111-1111-111111111111', 'Protocol Team', 'Welcome & integration · honouring ministers and guests with order and excellence'),
  ('9e32b752-f990-413c-af93-c45150ed8aaf', '11111111-1111-1111-1111-111111111111', 'Greeters & Welcome Team', 'Welcome & integration · first hello at the door for newcomers and visitors'),
  ('7f1b0255-9c25-44df-884c-124225d5ec31', '11111111-1111-1111-1111-111111111111', 'Hospitality Team', 'Welcome & integration · food, drinks and warmth for guests and ministers'),
  ('abc58c47-0abd-4625-85cf-eece0e779e6c', '11111111-1111-1111-1111-111111111111', 'New Members'' Class Team', 'Welcome & integration · teaching the foundation class for new members'),
  ('604229f7-121d-43aa-9fbb-3b6cefe358b4', '11111111-1111-1111-1111-111111111111', 'Membership & Assimilation Team', 'Welcome & integration · turning visitors into planted members'),
  ('3ce396e4-8d7e-4a14-b0f4-771bf3b6c708', '11111111-1111-1111-1111-111111111111', 'Visitors'' Relations Team', 'Welcome & integration · following up every first-time visitor'),
  ('18e209cd-da61-4412-8203-61e7accb4e02', '11111111-1111-1111-1111-111111111111', 'Retention & Connect Team', 'Welcome & integration · making sure no newcomer drifts into silence')
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
INSERT INTO groups (id, org_id, name, description) VALUES
  ('f0130677-0463-40d9-91a1-5fc86dd7ea73', '11111111-1111-1111-1111-111111111111', 'Choir & Worship Team', 'Worship & production · leading praise, worship and ministration in song'),
  ('129fd660-4a9d-44b6-9fa0-32f004a832d4', '11111111-1111-1111-1111-111111111111', 'Instrumentalists & Band', 'Worship & production · keyboard, drums, guitar and all instruments'),
  ('3dd0bd4c-bd50-488b-bf9d-a7d33c673ebd', '11111111-1111-1111-1111-111111111111', 'Sound & Audio Team', 'Worship & production · microphones, mixers and clear sound'),
  ('a233e974-c39f-4da5-a8cd-3ad5869ae76c', '11111111-1111-1111-1111-111111111111', 'Media & Projection Team', 'Worship & production · screens, slides and service projection'),
  ('0a4d0821-bfa7-45e4-925e-1e9bf4d873f6', '11111111-1111-1111-1111-111111111111', 'Lighting Team', 'Worship & production · stage and auditorium lighting'),
  ('7b1e0bfc-b5fd-4fa1-8535-b37d74162fa7', '11111111-1111-1111-1111-111111111111', 'Livestream & Broadcast Team', 'Worship & production · streaming services to those watching online'),
  ('f4260948-0187-4da8-b6ce-0654593597d9', '11111111-1111-1111-1111-111111111111', 'Photography & Video Team', 'Worship & production · capturing services and testimonies on camera'),
  ('f954fa48-9afe-4218-b189-3ee951d28645', '11111111-1111-1111-1111-111111111111', 'Stage & Décor Team', 'Worship & production · altars, stages and decorations that inspire'),
  ('68998829-956f-4795-b497-a92cdb6edc0a', '11111111-1111-1111-1111-111111111111', 'Dance, Drama & Creative Arts', 'Worship & production · choreography, drama and creative ministration')
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
INSERT INTO groups (id, org_id, name, description) VALUES
  ('88d69778-01ff-4278-9201-8f4d864d4a0f', '11111111-1111-1111-1111-111111111111', 'Sunday School Teachers', 'Teaching & discipleship · teaching the word class by class every Sunday'),
  ('c9fdd010-9ac5-453d-9851-675e41188db9', '11111111-1111-1111-1111-111111111111', 'Bible Study Leaders', 'Teaching & discipleship · leading midweek word study and discussion'),
  ('cb4ea126-7175-4a76-8002-cc874c8c6e5f', '11111111-1111-1111-1111-111111111111', 'Discipleship Team', 'Teaching & discipleship · raising believers into mature followers'),
  ('ef9adfa8-9fef-46d9-b93b-71b46e7edd22', '11111111-1111-1111-1111-111111111111', 'Foundation School Team', 'Teaching & discipleship · grounding new converts in the basics of faith'),
  ('a02da211-fd35-4e21-964b-924c2ebc61aa', '11111111-1111-1111-1111-111111111111', 'Children''s Ministry Team', 'Teaching & discipleship · raising children in the word with joy'),
  ('76ae0d89-695c-41a7-b9fc-075d8ccbce84', '11111111-1111-1111-1111-111111111111', 'Teens'' Ministry Team', 'Teaching & discipleship · guiding teenagers through faith and life'),
  ('0fd12f91-d553-4db2-9370-139f4809ccab', '11111111-1111-1111-1111-111111111111', 'Youth Ministry Team', 'Teaching & discipleship · building young adults in purpose and purity'),
  ('5cb95d49-9b0b-48a2-b3da-4a7adb8b86b7', '11111111-1111-1111-1111-111111111111', 'Leadership Training Team', 'Teaching & discipleship · equipping workers and future leaders'),
  ('793e8502-1a6b-4a10-b3c8-ca4143ea5ffa', '11111111-1111-1111-1111-111111111111', 'Workers-in-Training (WIT)', 'Teaching & discipleship · preparing new workers for service')
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
INSERT INTO groups (id, org_id, name, description) VALUES
  ('81f00e76-a868-4ef9-9b18-05487b52fae8', '11111111-1111-1111-1111-111111111111', 'Evangelism Team', 'Outreach & missions · preaching Christ and winning souls'),
  ('177d419a-beab-494b-9d3b-608e6bd6e912', '11111111-1111-1111-1111-111111111111', 'Missions Team', 'Outreach & missions · supporting missionaries and mission fields'),
  ('42f37d17-ce07-4918-bcec-7a7087d8ef4e', '11111111-1111-1111-1111-111111111111', 'Outreach & Community Service', 'Outreach & missions · serving the community with practical love'),
  ('ac63ce2d-f789-424d-a427-3aa0193a6425', '11111111-1111-1111-1111-111111111111', 'Street & Open-Air Evangelism', 'Outreach & missions · taking the gospel to streets and markets'),
  ('dae083b1-272b-439a-90b2-efe710c18bb4', '11111111-1111-1111-1111-111111111111', 'Follow-up & Convert Care Team', 'Outreach & missions · nursing new converts until they are planted'),
  ('61b0191a-f4ea-47b7-b100-6d437e2c4c42', '11111111-1111-1111-1111-111111111111', 'Prison Ministry', 'Outreach & missions · visiting and ministering to prisoners'),
  ('550b5120-f502-4efd-a9d0-08e5d7068648', '11111111-1111-1111-1111-111111111111', 'Hospital Ministry', 'Outreach & missions · ministering healing and hope to the sick'),
  ('ae2f73cd-fc64-49ea-a82a-68867bf61fc4', '11111111-1111-1111-1111-111111111111', 'Media Evangelism & Digital Missions', 'Outreach & missions · spreading the gospel online and on air')
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
INSERT INTO groups (id, org_id, name, description) VALUES
  ('372e02cd-5ad4-4b70-b40d-ca9e458036c6', '11111111-1111-1111-1111-111111111111', 'Secretariat & Admin Team', 'Administration · records, letters and office order'),
  ('50a29eab-2ac5-429e-a5fb-a7c9b6e51280', '11111111-1111-1111-1111-111111111111', 'Finance & Accounts Team', 'Administration · offerings, budgets and faithful accounting'),
  ('efbc49d5-e7f6-41ac-9e41-ef0b64f0c4ce', '11111111-1111-1111-1111-111111111111', 'Ushers'' Welfare & Stewardship', 'Administration · care for ushers and faithful stewardship'),
  ('8ca9b0e7-dad2-4d6f-9472-6af0b23a6583', '11111111-1111-1111-1111-111111111111', 'Technical & Facility Management', 'Administration · buildings, equipment and repairs'),
  ('c7a0eebb-a023-4046-b62b-f6fe1ac6ca5f', '11111111-1111-1111-1111-111111111111', 'Sanitation & Maintenance (Cleaning)', 'Administration · keeping God''s house clean and cared for'),
  ('4f77ac5d-4952-4f71-89df-7d7be4101a15', '11111111-1111-1111-1111-111111111111', 'Transport & Logistics Team', 'Administration · buses, movement and transport order'),
  ('bd7c49e6-7acb-4b6a-ac7f-573210153a14', '11111111-1111-1111-1111-111111111111', 'Security & Traffic Control', 'Administration · safety of lives and cars on service days'),
  ('c22e3d74-17dd-473d-b597-52b6617d6176', '11111111-1111-1111-1111-111111111111', 'Medical & First Aid Team', 'Administration · first response for health emergencies in service'),
  ('e749a5e6-c74b-4a7a-960e-5b8c9f0892d5', '11111111-1111-1111-1111-111111111111', 'Events & Planning Committee', 'Administration · planning programmes and special events'),
  ('8bc3d018-1af8-40df-bef8-d06f3872bdb6', '11111111-1111-1111-1111-111111111111', 'Publicity & Publications', 'Administration · fliers, announcements and community publications'),
  ('009e38c1-70fb-4a07-b3cd-4bddb2f4409d', '11111111-1111-1111-1111-111111111111', 'Library & Bookstall', 'Administration · books and resources that feed growth')
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
INSERT INTO groups (id, org_id, name, description) VALUES
  ('c483b6d0-b8dd-4287-b06c-384b83d14b0d', '11111111-1111-1111-1111-111111111111', 'Men''s Fellowship', 'Fellowship · brotherhood, leadership and growth for men'),
  ('cd425b2f-da93-4bcc-80ae-cd1a7a5ec3f2', '11111111-1111-1111-1111-111111111111', 'Women''s Fellowship', 'Fellowship · sisterhood, prayer and growth for women'),
  ('dd8b72a4-801e-4e87-b29b-32f9ed472bd9', '11111111-1111-1111-1111-111111111111', 'Couples'' & Marriage Ministry', 'Fellowship · building godly marriages and homes'),
  ('403529ec-a4cf-4aa9-9ed4-14938bbff9a8', '11111111-1111-1111-1111-111111111111', 'Singles'' Ministry', 'Fellowship · purpose, purity and preparation for singles'),
  ('6f450f3a-8a39-4748-9c1d-dfcc591ca6bc', '11111111-1111-1111-1111-111111111111', 'Widows'' Fellowship', 'Fellowship · love, support and community for widows'),
  ('e847d710-b73b-4c3b-ad87-5daae30be12e', '11111111-1111-1111-1111-111111111111', 'Elders'' & Senior Citizens'' Ministry', 'Fellowship · honouring and caring for our elders'),
  ('acd39023-6232-4bfa-9daa-7d677a9e6eb0', '11111111-1111-1111-1111-111111111111', 'Professionals'' Fellowship', 'Fellowship · faith at work for career people and professionals'),
  ('07a486b9-733c-493d-bfd1-d4ad80cbffce', '11111111-1111-1111-1111-111111111111', 'Campus & Student Ministry', 'Fellowship · reaching students on campuses'),
  ('b35684e7-9c83-480d-9cba-62d3f3c2affd', '11111111-1111-1111-1111-111111111111', 'Business & Entrepreneurs'' Fellowship', 'Fellowship · kingdom principles for business owners')
ON CONFLICT (id) DO NOTHING;
