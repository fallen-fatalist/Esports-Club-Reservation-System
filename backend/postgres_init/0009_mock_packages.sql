-- Standard 
INSERT INTO packages (package_id, package_name, room, price, startTime, endTime) VALUES
(1, '1 Hour',       'Standard', 1000, NULL, NULL),
(2, '2+1',          'Standard', 2100, NULL, NULL),
(3, '3+2',          'Standard', 3150, NULL, NULL),
(4, 'Morning',      'Standard', 1500, '06:00', '12:00'),
(5, 'Day',          'Standard', 3000, '08:00', '20:00'),
(6, 'Night',        'Standard', 4050, '22:00', '06:00');

-- VIP 
INSERT INTO packages (package_id, package_name, room, price, startTime, endTime) VALUES
(7, '1 Hour',       'VIP',      1250, NULL, NULL),
(8, '2+1',          'VIP',      2600, NULL, NULL),
(9, '3+2',          'VIP',      3900, NULL, NULL),
(10, 'Morning',      'VIP',      1650, '06:00', '12:00'),
(11, 'Day',          'VIP',      3700, '08:00', '20:00'),
(12, 'Night',        'VIP',      4600, '22:00', '06:00');

-- Console
INSERT INTO packages (package_id, package_name, room, price, startTime, endTime) VALUES
(13, '1 Hour',       'Console',  1200, NULL, NULL),
(14, '2+1',          'Console',  2900, NULL, NULL);
