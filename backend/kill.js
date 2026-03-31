import { execSync } from 'child_process';
try {
  const output = execSync('netstat -ano | findstr :5000', { encoding: 'utf-8' });
  const lines = output.split('\n');
  for (const line of lines) {
    if (line.includes('LISTENING')) {
      const pid = line.trim().split(/\s+/).pop();
      console.log(`Killing PID ${pid}`);
      try {
        process.kill(parseInt(pid), 'SIGKILL');
      } catch(e) {}
    }
  }
} catch(e) {
  console.log("No process on 5000");
}
