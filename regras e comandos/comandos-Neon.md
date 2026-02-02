SELECT 
  c1.name as categoria,
  c1.level,
  c2.name as categoria_pai
FROM category c1
LEFT JOIN category c2 ON c1.parent_id = c2.id
WHERE c1.name ILIKE 'cat%'
ORDER BY c1.level, c1.name;


SELECT * FROM category 
WHERE name LIKE 'tes%';

SELECT * FROM category
WHERE parent_id = '893fdfcf-c581-4bbf-a91b-615275c360be'
ORDER BY order_index;

/api/admin/categories 