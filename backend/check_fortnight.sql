SELECT 
  id, 
  period_start, 
  period_end,
  allocations,
  transactions,
  jsonb_array_length(COALESCE(transactions, '[]'::jsonb)) as tx_count
FROM fortnight_snapshots 
WHERE user_id = 'e85df3e6-b4db-47c2-bf92-651a4fcf4fdb'
ORDER BY period_start DESC
LIMIT 3;
