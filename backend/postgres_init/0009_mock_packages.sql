-- Standard 
INSERT INTO packages (package_id, package_name, room, price, duration, startTime, endTime) VALUES
(1, '1 Hour',       'Standard', 1000, 1, NULL, NULL),
(2, '2+1',          'Standard', 2100, 3, NULL, NULL),
(3, '3+2',          'Standard', 3150, 5, NULL, NULL);
-- (4, 'Morning',      'Standard', 1500, 5, '08:00', '13:00'),
-- (5, 'Day',          'Standard', 3000, 6, '12:00', '18:00'),
-- (6, 'Night',        'Standard', 4050, 10, '22:00', '08:00');

-- VIP 
INSERT INTO packages (package_id, package_name, room, price, duration, startTime, endTime) VALUES
(4, '1 Hour',       'VIP',      1250, 1, NULL, NULL),
(5, '2+1',          'VIP',      2600, 3, NULL, NULL),
(6, '3+2',          'VIP',      3900, 5, NULL, NULL);
-- (10, 'Morning',      'VIP',      1650, 5, '08:00', '13:00'),
-- (11, 'Day',          'VIP',      3700, 6, '12:00', '18:00'),
-- (12, 'Night',        'VIP',      4600, 10,'22:00', '08:00');

-- Console
INSERT INTO packages (package_id, package_name, room, price, duration, startTime, endTime) VALUES
(7, '1 Hour',       'Console',  1200, 1, NULL, NULL),
(8, '2+1',          'Console',  2900, 3, NULL, NULL);
