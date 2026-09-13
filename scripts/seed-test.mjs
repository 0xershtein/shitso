import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const bad = ['shit','cap','clown','snake','bot'], good = ['brain','fire','goat','respect','gem'];
const targets = { dumenci_test: 0.85, sus_test: 0.4, kral_test: 0.1 };
await sql`delete from votes where target like '%_test'`;
await sql`delete from vote_events where target like '%_test'`;
for (const [t, p] of Object.entries(targets)) {
  const n = 12 + Math.floor(Math.random()*20);
  for (let i=0;i<n;i++) {
    const pool = Math.random() < p ? bad : good;
    const e = pool[Math.floor(Math.random()*pool.length)];
    const daysAgo = Math.floor(Math.random()*14), hrs = Math.random()*24;
    const at = new Date(Date.now() - (daysAgo*24+hrs)*3600e3);
    const vid = `seed:${t}:${i}`;
    await sql`insert into votes (voter_id, voter_handle, target, emoji, created_at, updated_at) values (${vid}, ${'voter'+i}, ${t}, ${e}, ${at}, ${at})`;
    await sql`insert into vote_events (voter_id, voter_handle, target, emoji, created_at) values (${vid}, ${'voter'+i}, ${t}, ${e}, ${at})`;
  }
}
console.log('seeded');
