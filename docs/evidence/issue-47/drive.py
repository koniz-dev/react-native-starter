# Drives npm run init-project through a pseudo-terminal (interactive mode),
# answering each prompt as it appears. Prints the whole session.
import os, pty, re, select, sys
answers = ["Acme Notes", "", "", "com.example.notes", "com.acme.notes", "Acme Inc.", "y"]
pid, fd = pty.fork()
if pid == 0:
    os.execvp("npm", ["npm", "run", "init-project"])
out, pending, i = b"", b"", 0
ansi = re.compile(rb"\x1b\[[0-9;?]*[A-Za-z]")
while True:
    r, _, _ = select.select([fd], [], [], 120)
    if not r:
        out += b"\n[driver: no output for 120 s]\n"; os.kill(pid, 9); break
    try: data = os.read(fd, 4096)
    except OSError: break
    if not data: break
    out += data; pending += data
    if i < len(answers) and re.search(rb"[:)] $", ansi.sub(b"", pending)):
        os.write(fd, answers[i].encode() + b"\r"); i += 1; pending = b""
_, status = os.waitpid(pid, 0)
text = ansi.sub(b"", out).decode(errors="replace").replace("\r\n", "\n").replace("\r", "")
sys.stdout.write(text)
print(f"\n[exit status {os.waitstatus_to_exitcode(status)}]")
