import { spawn } from 'node:child_process';

if (process.env.ALLOW_DB_RESET !== 'true') {
  console.error(
    [
      'Refusing to reset the database.',
      'This app is being treated as a production/beta environment.',
      'If you really intend to wipe data, run:',
      '  bun run db:reset:force',
      'or set ALLOW_DB_RESET=true explicitly.'
    ].join('\n')
  );
  process.exit(1);
}

const child = spawn('bunx', ['prisma', 'migrate', 'reset'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
