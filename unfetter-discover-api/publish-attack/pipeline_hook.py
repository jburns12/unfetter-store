import subprocess
import fcntl

def main():
    core = open('/tmp/stixviz_lock', 'w')
    fcntl.flock(core, fcntl.LOCK_EX)
    proc = subprocess.Popen("cd ..; git clone git@gitlab.mitre.org:attack-strategy/website.git; cd website; git checkout stixviz; cp ../cti/enterprise-attack/enterprise-attack.json stix/enterprise-attack.json; cp ../cti/mobile-attack/mobile-attack.json stix/mobile-attack.json; cp ../cti/pre-attack/pre-attack.json stix/pre-attack.json; git add .; git config --global user.email 'jburns@mitre.org'; git config --global user.name 'Jen Burns'; git commit -m 'ATT&CK GUI build pipeline'; git push; cd ..; rm -rf website/;", stdout=subprocess.PIPE, shell=True)
    proc_stdout = proc.communicate()[0].strip()
    fcntl.flock(core, fcntl.LOCK_UN)
    core.close()
    print(proc_stdout)

if __name__ == "__main__":
    main()
