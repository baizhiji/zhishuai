DELETE FROM User WHERE phone != '18601655222';
SELECT '--- After cleanup ---' as info;
SELECT phone, name, role, status FROM User;
